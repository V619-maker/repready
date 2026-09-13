import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { MongoClient } from 'mongodb'
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'

let cachedClient = null
async function getDb() {
  if (!cachedClient) {
    const client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    cachedClient = client
  }
  return cachedClient.db(process.env.DB_NAME || 'repready')
}

// Resolves the requester's email from the Clerk session only — never from a
// query param or request body. Returns null if there is no authenticated session.
async function getAuthedEmail() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  return user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null
}

// Reads role/plan/persona-selection from Clerk publicMetadata. Defaults are
// deliberately non-restrictive: no user currently has these fields set, so
// until they're set manually (or via a future billing webhook), everyone
// keeps exactly the access they have today — role defaults to 'rep' (the
// least-privileged, so nobody accidentally sees another rep's data), but
// planTier defaults to null, which means "unrestricted" (all 4 personas
// unlocked) rather than defaulting to the most restrictive tier. This
// avoids silently downgrading access for anyone until billing is actually
// wired up to set a real tier per user.
async function getAuthedUser() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null
  const meta = user?.publicMetadata || {}
  return {
    userId,
    email,
    role: meta.role === 'manager' ? 'manager' : 'rep',
    planTier: meta.planTier || null,
    selectedPersonas: Array.isArray(meta.selectedPersonas) ? meta.selectedPersonas : []
  }
}

// Shared transcript scoring — the same Gemini "combined analyst" call used by
// POST /api/boardroom (call 1) and, as of the Sprint 27 audit fix, as a
// server-side sanity check on POST /api/sessions before trusting a
// client-submitted score (see Known Issue 0b in REPREADY_CONTEXT.md).
// Keeping this in one place means the two can never silently drift apart —
// the forgery check scores against the exact same rubric a real boardroom
// review would use, not a second, different opinion.
//
// Buyer context is keyed by persona so it generalizes past the old
// richard/sandra binary. Priya/Rakesh have real buyer context matching
// their ElevenLabs system prompts.
const PERSONA_CONTEXT = {
  richard: 'VP Procurement at a logistics firm. CFO-mandated 15% cost reduction. Anchors on price, threatens vendor consolidation, demands Net-90 terms.',
  sandra: 'IT Director at a financial firm. Blocks on SOC 2, SAML/SSO, and bandwidth. Polite but always has a blocker.',
  priya: 'VP Procurement at an NBFC in India. Warm, relationship-first negotiator who builds rapport before grinding on price. Prioritizes long-term vendor relationships and trust, but pushes hard for discounts once comfortable, often after the rep has let their guard down.',
  rakesh: 'AVP - Digital Transformation at a PSU-adjacent insurer in India. Genuinely curious and engaged with digital initiatives, broadly fluent in general SaaS evaluation territory (implementation, integration, security, ROI), but has no final sign-off authority. Never gives a firm yes or no; warmly defers real commitment to his organization\'s digital transformation committee.'
}

// Default 6-dimension rubric — reproduces the pre-customization scoring exactly
// (same keys, names, and descriptions) so any org that never touches the new
// Scoring Criteria settings sees zero behavior change. `key` is what lands in
// session.dimensions and the Zod schema; `name`/`description` drive both the
// Gemini prompt and the dashboard/coach/my-stats UI labels. No `weight` field —
// every criterion is scored and treated identically until reweighting is
// actually built (deliberately left out of the data model per this feature's
// scope; adding it back later is a trivial additive field, not a migration).
const DEFAULT_CRITERIA = [
  { key: 'discoveryQuality', name: 'Discovery Quality', description: 'Did the rep ask the right questions before pitching. 0=no discovery at all, 100=excellent deep discovery' },
  { key: 'objectionHandling', name: 'Objection Handling', description: 'Did the rep validate objections before responding. 0=ignored objections, 100=acknowledged and reframed every objection' },
  { key: 'priceDefense', name: 'Price Defense', description: 'Did the rep hold firm on price. 0=caved immediately, 100=held firm and traded value for concessions' },
  { key: 'smeKnowledge', name: 'SME Knowledge', description: 'Did the rep demonstrate product and industry knowledge. 0=generic pitch, 100=specific credible expertise' },
  { key: 'communication', name: 'Communication', description: 'Clarity, pacing, and active listening. 0=rambling and unclear, 100=crisp concise and listened actively' },
  { key: 'emotionalResilience', name: 'Emotional Resilience', description: 'Did the rep stay composed under pressure. 0=crumbled immediately, 100=stayed calm and confident throughout' },
]

// Turns a manager-supplied criterion name into a safe object/JSON-schema key —
// never trust the raw string as a property name. Falls back to a stable
// positional key on total collapse (e.g. a name that's pure emoji/punctuation)
// so two odd names never silently collide into the same key.
function slugifyKey(name, index) {
  const slug = String(name || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^[A-Z0-9]/, (c) => c.toLowerCase())
  return slug || `criterion${index}`
}

// Looks up an org's custom scoring criteria; falls back to DEFAULT_CRITERIA
// when the org has no orgCriteria doc (never customized) or orgId is
// null/unresolvable. This is the single source of truth every scoring and
// aggregation code path below reads through, so a criteria change can never
// drift between the Gemini prompt and the dashboard.
async function getCriteriaForOrg(orgId) {
  // Logged unconditionally (not just on error) because a silent fallback to
  // DEFAULT_CRITERIA is indistinguishable from "org never customized" at the
  // call site — this is the only place that can tell the two apart, and a
  // real production mismatch here (orgId not matching the org a criterion
  // was actually saved under) produces no error, just a quietly wrong
  // result. See Known Issues / Sprint 38.
  if (!orgId) {
    console.log('[getCriteriaForOrg] no orgId received — using DEFAULT_CRITERIA')
    return DEFAULT_CRITERIA
  }
  const db = await getDb()
  const doc = await db.collection('orgCriteria').findOne({ _id: orgId })
  if (!doc || !Array.isArray(doc.criteria) || !doc.criteria.length) {
    console.log(`[getCriteriaForOrg] orgId="${orgId}" has no saved criteria doc — using DEFAULT_CRITERIA`)
    return DEFAULT_CRITERIA
  }
  console.log(`[getCriteriaForOrg] orgId="${orgId}" resolved ${doc.criteria.length} custom criteria: ${doc.criteria.map(c => c.key).join(', ')}`)
  return doc.criteria
}

function buildCombinedAnalystSchema(criteria) {
  const dimensionShape = {}
  for (const c of criteria) {
    dimensionShape[c.key] = z.number().min(0).max(100).describe(c.description)
  }
  return z.object({
    procurementScore: z.number().min(0).max(100).describe("Procurement score 0-100 based on margin defense and price discipline"),
    procurementReasoning: z.string().describe("2-3 sentences explaining the procurement score"),
    marginDefense: z.enum(['strong', 'moderate', 'weak']).describe("How well the rep defended margins"),
    discountedEarly: z.boolean().describe("Did the rep offer discounts before establishing value"),
    enablementScore: z.number().min(0).max(100).describe("Sales enablement score 0-100 based on call technique"),
    enablementReasoning: z.string().describe("2-3 sentences explaining the enablement score"),
    callControl: z.enum(['strong', 'moderate', 'weak']).describe("How well the rep controlled the call"),
    usedDiscovery: z.boolean().describe("Did the rep use discovery questions before pitching"),
    dimensions: z.object(dimensionShape).describe(`${criteria.length}-dimension skill scores`),
  })
}

function buildCombinedAnalystPrompt(transcript, personaContext, criteria) {
  const dimensionBullets = criteria.map(c => `- ${c.name}: ${c.description}`).join('\n')
  return `You are an elite B2B sales performance analyst. Evaluate this sales rep across two dimensions simultaneously: procurement/margin defense AND sales enablement/technique. Also score them across the following ${criteria.length} skill dimensions.

BUYER CONTEXT: ${personaContext}

PROCUREMENT SCORING — focus on:
HIGH SCORE: Postponed discount conversation, traded concessions for value, held firm on price, asked about budget before discussing numbers, uncovered cost of delay
LOW SCORE: Dropped price on first objection, offered verbal discounts before understanding budget, apologized for pricing, agreed to demands without counter-ask

ENABLEMENT SCORING — focus on (Challenger Sale + MEDDPICC):
HIGH SCORE: Acknowledged objections before responding, asked deep discovery questions, maintained control of next steps, reframed cost to business impact
LOW SCORE: Became defensive when pushed back, jumped to features without understanding objection, let buyer control the call, responded to every objection with a feature pitch

SKILL DIMENSION SCORING:
${dimensionBullets}

TRANSCRIPT:
${transcript}

Be strict and realistic. Do not be generous.`
}

// `orgId` here is trusted only as far as its two callers already trust it:
// POST /api/sessions already reads and stores body.orgId today (Known Issue
// 5a — unauthenticated), and POST /api/boardroom now accepts it the same way
// persona already was. Worst case a caller passes the wrong/fake orgId and
// gets scored against another org's rubric text — it never touches
// procurementScore/enablementScore/weightedScore (still fixed, still what the
// forgery guard checks), only the supplementary dimension labels.
async function scoreTranscript(transcript, persona, orgId) {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
  const personaContext = PERSONA_CONTEXT[persona] || 'Enterprise buyer evaluating a B2B software purchase.'
  const criteria = await getCriteriaForOrg(orgId)
  const result = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: buildCombinedAnalystSchema(criteria),
    system: buildCombinedAnalystPrompt(transcript, personaContext, criteria),
    prompt: 'Evaluate this sales rep strictly and realistically across all dimensions.',
  })
  const analyst = result.object
  const weightedScore = Math.round((analyst.procurementScore * 0.6) + (analyst.enablementScore * 0.4))
  // Reference equality against the module-level constant is safe here — it's
  // the literal object getCriteriaForOrg returns on its fallback branch, never
  // a copy — and lets callers (currently /api/boardroom's response) show
  // whether this org's own criteria were actually used without a second query.
  return { ...analyst, weightedScore, criteria, criteriaSource: criteria === DEFAULT_CRITERIA ? 'default' : 'custom', orgIdReceived: orgId || null }
}

// CALL 2 — Executive summarizer. Extracted out of the /api/boardroom handler
// (prerequisite, behavior-preserving refactor for the upcoming real-call
// upload + scoring feature — see task tracking) so it can be reused by a
// future caller without duplicating this prompt/schema. Byte-identical
// prompt/schema/logic to what previously lived inline in that handler.
async function generateExecutiveSummary(analyst, weightedScore, criteria) {
  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

  const ExecutiveSchema = z.object({
    finalScore: z.number().min(0).max(100).describe("Weighted final score"),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']).describe("Letter grade"),
    verdict: z.string().describe("One sentence executive verdict"),
    whatYouDidRight: z.string().describe("One specific thing the rep did well — max 20 words"),
    whatYouDidWrong: z.string().describe("One critical mistake — max 20 words"),
    oneThingToFixNext: z.string().describe("One tactical fix for the next session — max 20 words"),
  })

  const executiveResult = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: ExecutiveSchema,
    prompt: `You are an executive sales performance reviewer. A combined analyst has scored this rep.

PROCUREMENT SCORE: ${analyst.procurementScore}/100
Reasoning: ${analyst.procurementReasoning}
Margin defense: ${analyst.marginDefense}
Discounted early: ${analyst.discountedEarly}

ENABLEMENT SCORE: ${analyst.enablementScore}/100
Reasoning: ${analyst.enablementReasoning}
Call control: ${analyst.callControl}
Used discovery: ${analyst.usedDiscovery}

SKILL DIMENSION SCORES:
${criteria.map(c => `- ${c.name}: ${analyst.dimensions[c.key]}/100`).join('\n')}

WEIGHTED FINAL SCORE (60% procurement, 40% enablement): ${weightedScore}/100

Grade scale: A=90+, B=75-89, C=60-74, D=45-59, F=below 45

Write a crisp executive summary. Each feedback field must be under 20 words. Be direct, not motivational. This is enterprise-grade feedback.`,
  })

  return {
    grade: executiveResult.object.grade,
    verdict: executiveResult.object.verdict,
    whatYouDidRight: executiveResult.object.whatYouDidRight,
    whatYouDidWrong: executiveResult.object.whatYouDidWrong,
    oneThingToFixNext: executiveResult.object.oneThingToFixNext,
    analysts: {
      procurement: {
        score: analyst.procurementScore,
        reasoning: analyst.procurementReasoning,
        marginDefense: analyst.marginDefense,
        discountedEarly: analyst.discountedEarly,
      },
      enablement: {
        score: analyst.enablementScore,
        reasoning: analyst.enablementReasoning,
        callControl: analyst.callControl,
        usedDiscovery: analyst.usedDiscovery,
      }
    }
  }
}

// Prerequisite helpers for the real-call upload + scoring feature (Task 2).
// Neither of these is wired into a route yet — no new endpoint, no DB write.
// A later task calls transcribeWithDiarization() from the actual upload
// endpoint and parseSpeakerLabelsFromPastedText() from the paste-transcript
// input path, then decides what to do with their output (which speaker is
// the rep, how many labels is "too many/too few", etc).

// v1 cap on real-call audio length. Deliberately checked AFTER transcription
// completes (via transcribeWithDiarization()'s returned audioDurationSeconds),
// not before — no client-side duration probing here. That's a simplicity
// choice already made for this feature, not something for a later task to
// second-guess.
const MAX_REAL_CALL_DURATION_SECONDS = 7 * 60

// Runs a raw audio buffer through ElevenLabs' Speech-to-Text (Scribe v2),
// with diarization and speaker-role detection on. Mirrors the existing
// fail-fast-on-missing-key pattern used for GOOGLE_GENERATIVE_AI_API_KEY in
// /api/boardroom (see scoreTranscript() above and the /boardroom route
// handler) — check the key before doing any network work at all, never
// attempt the call and let it fail remotely.
//
// Reuses ELEVENLABS_API_KEY, already configured in this app for the
// Conversational AI agents and the retention-purge cron — no new env var
// needed for this feature.
//
// This endpoint is synchronous — one request, no polling loop needed.
//
// ElevenLabs Speech-to-Text API shape used below:
//   POST https://api.elevenlabs.io/v1/speech-to-text
//   multipart/form-data: `file` (the audio), `model_id: 'scribe_v2'`,
//   `diarize: 'true'`, `detect_speaker_roles: 'true'`
//   auth header: `xi-api-key: <ELEVENLABS_API_KEY>`
//   Response: `{ text, language_code, language_probability, words: [{ text,
//   start, end, type, speaker_id }] }` — `words` mixes `type: 'word'` entries
//   with non-word entries (spacing/audio-event markers); only `'word'`
//   entries are joined into utterance text below.
async function transcribeWithDiarization(audioBuffer, filename) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY not configured')
  }

  const formData = new FormData()
  formData.append('file', new Blob([audioBuffer]), filename)
  formData.append('model_id', 'scribe_v2')
  formData.append('diarize', 'true')
  formData.append('detect_speaker_roles', 'true')

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: formData,
  })
  if (!response.ok) {
    throw new Error(`ElevenLabs speech-to-text failed with status ${response.status}`)
  }
  const result = await response.json()
  const words = result.words || []

  // Group consecutive same-speaker words into utterance-like segments —
  // Scribe returns word-level entries, but everything downstream of this
  // function (the route handler, confirm-speaker, the /real-calls page)
  // only ever consumes utterance-shaped {speaker, text} pairs.
  const utterances = []
  let current = null
  for (const w of words) {
    if (w.type !== 'word') continue
    if (!current || current.speaker !== w.speaker_id) {
      if (current) utterances.push(current)
      current = { speaker: w.speaker_id, text: w.text, start: w.start, end: w.end }
    } else {
      current.text += ' ' + w.text
      current.end = w.end
    }
  }
  if (current) utterances.push(current)

  // Last word's end timestamp, not the last utterance's — a trailing
  // spacing/audio-event marker can extend past the last spoken word, so this
  // scans every entry in `words`, not just the ones grouped into utterances.
  const audioDurationSeconds = words.length ? Math.max(...words.map(w => w.end)) : 0

  const speakerLabels = [...new Set(utterances.map(u => u.speaker))]

  // Soft hint only, per detect_speaker_roles: when speaker roles are
  // detected, speaker_id is expected to carry a role ("agent"/"customer")
  // rather than a bare index — "agent" is RepReady's side of the call, so
  // that's the suggested rep. If nothing matches, no suggestion is made
  // (null) rather than guessing; the confirmation step below is unaffected
  // either way; this never substitutes for it.
  const suggestedRepLabel = speakerLabels.find(
    (label) => typeof label === 'string' && label.toLowerCase() === 'agent'
  ) || null

  return {
    text: result.text,
    utterances,
    audioDurationSeconds,
    speakerLabels,
    suggestedRepLabel,
  }
}

// Heuristic parser for the "paste an existing transcript" input path — a
// manager pastes a transcript already exported from Gong/Chorus/Zoom/etc as
// plain text, one utterance per line, in a "Label: text" format. This is
// pure string processing (no network, no async) so it can run client-side
// or server-side identically.
//
// This is a heuristic for cleanly-formatted pastes, not guaranteed against
// arbitrary formatting (multi-line utterances, labels with a colon inside
// them, transcripts with timestamps prefixed on each line, etc). It only
// detects and reports what it finds — it does NOT validate or reject
// anything (0 labels, 1 label, 2 labels, 3+ labels are all returned the same
// way); a later task's caller is responsible for deciding what each of those
// counts means and validating accordingly.
function parseSpeakerLabelsFromPastedText(text) {
  const labelPattern = /^([A-Za-z][A-Za-z0-9 ._-]{0,40}):\s*(.+)$/
  const labels = []
  const lines = []

  String(text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .forEach(line => {
      const match = line.match(labelPattern)
      if (!match) return
      const [, label, utteranceText] = match
      if (!labels.includes(label)) {
        labels.push(label)
      }
      lines.push({ label, text: utteranceText })
    })

  return { labels, lines }
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS(request) {
  return applyCorsOriginPolicy(handleCORS(new NextResponse(null, { status: 200 })), request)
}

// Simple test schema
const TestResponseSchema = z.object({
  greeting: z.string().describe("A simple hello greeting"),
  status: z.string().describe("Status message")
})

// Zod schema for negotiation response
const NegotiationResponseSchema = z.object({
  message: z.string().describe("The persona's spoken dialogue"),
  deal_health_score: z.number().min(0).max(100).describe("Current deal health from 0-100"),
  score_reason: z.string().describe("One short sentence explaining why the score moved")
})

// Zod schema for scorecard response
const ScorecardResponseSchema = z.object({
  final_score: z.number().min(1).max(100).describe("Final performance score from 1-100"),
  verdict: z.string().describe("One sentence verdict: Passed/Needs Work/Failed"),
  strengths: z.array(z.string()).describe("Array of 2 bullet points highlighting strengths"),
  improvements: z.array(z.string()).describe("Array of 2 bullet points for improvements"),
  biggest_mistake: z.string().describe("One sentence describing the biggest mistake")
})

// Persona system prompts
const PERSONAS = {
  richard: {
    name: 'Richard',
    title: 'VP Procurement',
    company: '500-person logistics firm',
    difficulty: 5,
    systemPrompt: `You are Richard Chen, VP Procurement at Meridian Logistics, a 500-person freight and supply chain company. You have 22 years of procurement experience across three Fortune 500 companies. You are not a villain — you are a professional protecting your company's financial interests. Your CFO Janet Morrison has mandated 15% reduction in software spend before Q3. You have three vendors on your shortlist. You remember everything the rep says — if they contradict themselves you call it out. Never repeat the exact same objection twice in a row. Reveal your real pain point (current vendor Apex has had 3 system outages costing $40,000 each) only after the rep earns it through good discovery. You are evaluating a $50,000 SaaS contract. Your CFO mandated a 15% cost reduction. Your bonus is tied to savings. Tactics: threaten vendor consolidation, demand Net-90 terms, push for a 20% discount. You are curt, impatient, and never show genuine interest. Keep responses under 4 sentences. Never break character.

CRITICAL SCORING RULES - Evaluate the SALES REP's last message, NOT your own response:

SCORE DROPS (bad rep behavior):
- Rep offers ANY discount before establishing value → SET score to 15-25
- Rep apologizes for the price or seems defensive about cost → SET score to 20-30
- Rep offers free implementation, training, or extras unprompted → DROP score by 20 points
- Rep immediately agrees to your demands without pushback → DROP score by 15 points
- Rep sounds desperate or needy → DROP score by 10 points
- Rep fails to ask about your needs/pain points → DROP score by 5 points

SCORE RISES (good rep behavior):
- Rep asks discovery questions before pitching → SET score to 65-75
- Rep holds firm on price when you challenge them → SET score to 70-80
- Rep reframes the conversation to value/ROI → RAISE score by 15 points
- Rep professionally pushes back on unreasonable demands → RAISE score by 10 points
- Rep uncovers your real pain points → RAISE score by 10 points
- Rep creates urgency without being pushy → RAISE score by 5 points

Starting score is 50. Score range: 0-100.

IMPORTANT: You must respond with valid JSON containing:
- message: Your dialogue as Richard (stay in character, be curt and demanding)
- deal_health_score: Score based on the REP's behavior using rules above
- score_reason: Explain what the REP did wrong or right (e.g., "Rep offered discount without establishing value" or "Rep held firm and redirected to ROI")`
  },
  sandra: {
    name: 'Sandra',
    title: 'IT Director',
    company: '800-person financial firm',
    difficulty: 4,
    systemPrompt: `You are Sandra, IT Director at an 800-person financial firm. You aggressively protect your team's bandwidth. Tactics: claim zero implementation capacity this quarter, demand SOC 2 Type II certification, require native SAML/SSO as a non-negotiable. You are polite on the surface but every response contains a blocker. Keep responses under 4 sentences. Never break character.

CRITICAL SCORING RULES - Evaluate the SALES REP's last message, NOT your own response:

SCORE DROPS (bad rep behavior):
- Rep offers ANY discount before establishing value → SET score to 15-25
- Rep apologizes for the price or seems defensive about cost → SET score to 20-30
- Rep offers free implementation, training, or extras unprompted → DROP score by 20 points
- Rep immediately agrees to your demands without pushback → DROP score by 15 points
- Rep sounds desperate or needy → DROP score by 10 points
- Rep fails to address your specific concerns (bandwidth, SOC 2, SSO) → DROP score by 5 points

SCORE RISES (good rep behavior):
- Rep asks discovery questions before pitching → SET score to 65-75
- Rep holds firm on price when challenged → SET score to 70-80
- Rep proactively addresses your known blockers (SOC 2, SSO, bandwidth) → RAISE score by 15 points
- Rep offers creative solutions to bandwidth concerns → RAISE score by 10 points
- Rep demonstrates understanding of financial industry requirements → RAISE score by 10 points
- Rep builds a business case that resonates with IT priorities → RAISE score by 5 points

Starting score is 50. Score range: 0-100.

IMPORTANT: You must respond with valid JSON containing:
- message: Your dialogue as Sandra (stay in character, polite but always have a blocker)
- deal_health_score: Score based on the REP's behavior using rules above
- score_reason: Explain what the REP did wrong or right (e.g., "Rep offered free implementation unprompted - desperate move" or "Rep asked about current challenges before pitching")`
  }
}

// Fallback response for errors
const FALLBACK_RESPONSE = {
  message: "Let me stop you there.",
  deal_health_score: 50,
  score_reason: "Response parsing error — score held steady"
}
// Hostility calculation function
function calculateNextHostility(currentHostility, dealHealthScore) {
  let adjustment = 0
  if (dealHealthScore >= 65) adjustment = 5
  else if (dealHealthScore <= 35) adjustment = 0
  else adjustment = 0
  const next = currentHostility + adjustment
  const clamped = Math.min(90, Math.max(40, next))
  let label = 'Low'
  if (clamped >= 85) label = 'Extreme'
  else if (clamped >= 70) label = 'High'
  else if (clamped >= 55) label = 'Medium'
  return { hostility: clamped, hostilityLabel: label }
}

function getQualificationStatus(hostility, score) {
  if (hostility < 50) return { status: 'Not Qualified', detail: 'Needs higher hostility pressure', color: 'gray' }
  if (hostility >= 85 && score >= 70) return { status: 'Elite', detail: 'Ready for Fortune 500 procurement', color: 'gold' }
  if (hostility >= 70 && score >= 70) return { status: 'Qualified', detail: 'Ready for live calls', color: 'green' }
  if (hostility >= 50 && score >= 70) return { status: 'In Progress', detail: 'Strong score, needs more pressure', color: 'yellow' }
  return { status: 'Not Qualified', detail: 'Score needs improvement under pressure', color: 'red' }
}

// Groups an org's sessions into one row per rep — shared by GET /api/dashboard and
// GET /api/admin/reps so the two can't silently drift out of sync. Only ever sees
// reps who have submitted at least one session: there's no separate users
// collection and no Clerk-org-membership query anywhere in this codebase, so a rep
// who signed up but never ran a session won't appear from either caller.
const QUALIFICATION_STAGES = ['Not Qualified', 'Getting Started', 'Developing', 'Qualified', 'Elite']
function groupRepsFromSessions(sessions) {
  const repMap = {}
  for (const s of sessions) {
    if (!repMap[s.userEmail]) {
      repMap[s.userEmail] = {
        userEmail: s.userEmail,
        sessions: 0,
        bestScore: 0,
        bestHostility: null,
        bestQualificationStatus: null,
        lastSession: null
      }
    }
    const rep = repMap[s.userEmail]
    rep.sessions++
    if ((s.finalScore || 0) > rep.bestScore) rep.bestScore = s.finalScore || 0
    if (s.hostilityReached != null && (rep.bestHostility == null || s.hostilityReached > rep.bestHostility)) {
      rep.bestHostility = s.hostilityReached
    }
    if (s.qualificationStatus && QUALIFICATION_STAGES.includes(s.qualificationStatus)) {
      const stageIndex = QUALIFICATION_STAGES.indexOf(s.qualificationStatus)
      const bestIndex = rep.bestQualificationStatus ? QUALIFICATION_STAGES.indexOf(rep.bestQualificationStatus) : -1
      if (stageIndex > bestIndex) rep.bestQualificationStatus = s.qualificationStatus
    }
    if (s.createdAt && (rep.lastSession == null || new Date(s.createdAt) > new Date(rep.lastSession))) {
      rep.lastSession = s.createdAt
    }
  }
  return Object.values(repMap).sort((a, b) => b.bestScore - a.bestScore)
}

// Origins allowed to make credentialed cross-origin requests to this API.
// Access-Control-Allow-Origin: '*' can never be paired with
// Access-Control-Allow-Credentials: true — browsers reject that combination
// for credentialed requests. handleCORS() below still sets a static
// '*'-or-CORS_ORIGINS value (kept for the plain, non-credentialed callers
// that read it), but applyCorsOriginPolicy() runs last on every response
// and overwrites it with the real, per-request, allowlist-checked value.
const ALLOWED_CORS_ORIGINS = (process.env.CORS_ORIGINS || 'https://repready.site')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function applyCorsOriginPolicy(response, request) {
  const origin = request.headers.get('origin')
  if (origin && ALLOWED_CORS_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  } else {
    response.headers.delete('Access-Control-Allow-Origin')
    response.headers.delete('Access-Control-Allow-Credentials')
  }
  return response
}

// Route handler function
async function handleRouteInternal(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Root endpoint
    if ((route === '/root' || route === '/') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "RepReady API" }))
    }

    // ============================================
    // DIAGNOSTIC TEST ENDPOINT - GET /api/test
    // ============================================
    if (route === '/test' && method === 'GET') {
      const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        apiKeyPresent: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        apiKeyLength: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0,
        apiKeyPrefix: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10) || 'NOT_SET',
        modelName: 'gemini-2.5-flash',
        testStatus: 'pending'
      }

      // Check if API key is set
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return handleCORS(NextResponse.json({
          ...diagnostics,
          testStatus: 'failed',
          error: 'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set'
        }))
      }

      try {
        console.log('[TEST] Starting Gemini API test...')
        console.log('[TEST] API Key present:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        console.log('[TEST] API Key length:', process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length)

        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        console.log('[TEST] Google AI client created, calling generateObject...')

        const result = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: TestResponseSchema,
          prompt: 'Say hello in JSON format with a greeting field and a status field.',
        })

        console.log('[TEST] generateObject succeeded:', result.object)

        return handleCORS(NextResponse.json({
          ...diagnostics,
          testStatus: 'success',
          response: result.object,
          usage: result.usage
        }))

      } catch (testError) {
        console.error('[TEST] Gemini API test failed:', testError)
        console.error('[TEST] Error name:', testError.name)
        console.error('[TEST] Error message:', testError.message)
        console.error('[TEST] Error cause:', testError.cause)
        console.error('[TEST] Full error:', JSON.stringify(testError, Object.getOwnPropertyNames(testError), 2))

        return handleCORS(NextResponse.json({
          ...diagnostics,
          testStatus: 'failed',
          error: {
            name: testError.name || 'UnknownError',
            message: testError.message || 'No error message',
            cause: testError.cause ? String(testError.cause) : null,
            stack: testError.stack || null,
            fullError: JSON.stringify(testError, Object.getOwnPropertyNames(testError), 2)
          }
        }))
      }
    }

    // Negotiate endpoint - POST /api/negotiate
    if (route === '/negotiate' && method === 'POST') {
      const body = await request.json()
     const { persona, messages, currentHostility = 40 } = body

      if (!persona || !PERSONAS[persona]) {
        return handleCORS(NextResponse.json(
          { error: "Invalid persona. Choose 'richard' or 'sandra'." },
          { status: 400 }
        ))
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return handleCORS(NextResponse.json(
          { error: "Messages array is required." },
          { status: 400 }
        ))
      }

      const selectedPersona = PERSONAS[persona]
      const hostilityInstruction = currentHostility >= 85
  ? `\n\nCURRENT HOSTILITY: EXTREME (${currentHostility}%). Be maximally aggressive. Cut them off. Threaten to end the call immediately. Show visible frustration.`
  : currentHostility >= 70
  ? `\n\nCURRENT HOSTILITY: HIGH (${currentHostility}%). Be very curt and challenging. Push back hard on everything. Show clear impatience.`
  : currentHostility >= 55
  ? `\n\nCURRENT HOSTILITY: MEDIUM (${currentHostility}%). Be professional but skeptical. Challenge weak points firmly.`
  : `\n\nCURRENT HOSTILITY: LOW (${currentHostility}%). Be evaluating but not yet aggressive. Professional tone.`

const dynamicSystemPrompt = selectedPersona.systemPrompt + hostilityInstruction
      try {
        // Verify API key exists
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          console.error('[NEGOTIATE] GOOGLE_GENERATIVE_AI_API_KEY is not set')
          return handleCORS(NextResponse.json({
            ...FALLBACK_RESPONSE,
            _debug: {
              error: 'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set',
              timestamp: new Date().toISOString()
            }
          }))
        }

        console.log('[NEGOTIATE] Starting negotiation request...')
        console.log('[NEGOTIATE] Persona:', persona)
        console.log('[NEGOTIATE] Messages count:', messages.length)
        console.log('[NEGOTIATE] API Key present:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        console.log('[NEGOTIATE] Model: gemini-2.5-flash')

        // Validate schema before calling API
        try {
          NegotiationResponseSchema.parse({
            message: "test",
            deal_health_score: 50,
            score_reason: "test"
          })
          console.log('[NEGOTIATE] Schema validation passed')
        } catch (schemaError) {
          console.error('[NEGOTIATE] Schema validation failed:', schemaError)
          return handleCORS(NextResponse.json({
            ...FALLBACK_RESPONSE,
            _debug: {
              error: 'Schema validation failed',
              schemaError: schemaError.message,
              timestamp: new Date().toISOString()
            }
          }))
        }

        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        console.log('[NEGOTIATE] Calling generateObject with gemini-2.5-flash...')

        // Using generateObject instead of streamObject for debugging
const result = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: NegotiationResponseSchema,
  system: dynamicSystemPrompt,
  messages: messages.map(m => ({
    role: m.role,
    content: m.content
  })),
})

        console.log('[NEGOTIATE] generateObject succeeded')
        console.log('[NEGOTIATE] Response:', JSON.stringify(result.object))

        // Return the response directly (not streaming)
        const nextHostilityData = calculateNextHostility(
  currentHostility,
  result.object.deal_health_score || 50
)

return handleCORS(NextResponse.json({
  ...result.object,
  currentHostility: nextHostilityData.hostility,
  hostilityLabel: nextHostilityData.hostilityLabel
}))

      } catch (apiError) {
        // Detailed error logging
        console.error('[NEGOTIATE] API Error occurred')
        console.error('[NEGOTIATE] Error name:', apiError.name)
        console.error('[NEGOTIATE] Error message:', apiError.message)
        console.error('[NEGOTIATE] Error cause:', apiError.cause)
        console.error('[NEGOTIATE] Error stack:', apiError.stack)
        
        // Try to extract more details
        let errorDetails = {
          name: apiError.name || 'UnknownError',
          message: apiError.message || 'No error message',
          timestamp: new Date().toISOString()
        }

        if (apiError.cause) {
          errorDetails.cause = String(apiError.cause)
        }

        if (apiError.data) {
          errorDetails.data = apiError.data
        }

        if (apiError.responseBody) {
          errorDetails.responseBody = apiError.responseBody
        }

        console.error('[NEGOTIATE] Full error details:', JSON.stringify(errorDetails, null, 2))

        return handleCORS(NextResponse.json({
          ...FALLBACK_RESPONSE,
          _debug: errorDetails
        }))
      }
    }

    // Scorecard endpoint - POST /api/scorecard
    if (route === '/scorecard' && method === 'POST') {
      const body = await request.json()
      const { persona, messages } = body

      if (!persona || !PERSONAS[persona]) {
        return handleCORS(NextResponse.json(
          { error: "Invalid persona." },
          { status: 400 }
        ))
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return handleCORS(NextResponse.json(
          { error: "Messages array is required for scoring." },
          { status: 400 }
        ))
      }

      const selectedPersona = PERSONAS[persona]
      
      // Format the conversation transcript
      const transcript = messages.map(m => 
        `${m.role === 'user' ? 'Sales Rep' : selectedPersona.name}: ${m.content}`
      ).join('\n\n')

      const scoringPrompt = `You are a senior B2B sales coach. Review this negotiation transcript and provide a detailed performance evaluation.

NEGOTIATION CONTEXT:
- Persona: ${selectedPersona.name}, ${selectedPersona.title} at ${selectedPersona.company}
- Deal Value: $50,000 SaaS Contract
- Known Tactics: ${selectedPersona.name === 'Richard' ? 'Threatens vendor consolidation, demands Net-90 terms, pushes for 20% discount' : 'Claims zero implementation capacity, demands SOC 2 Type II, requires native SAML/SSO'}

TRANSCRIPT:
${transcript}

Evaluate the sales rep's performance and return JSON with:
- final_score: A number from 1-100 based on overall negotiation skill
- verdict: One sentence starting with "Passed", "Needs Work", or "Failed" explaining the outcome
- strengths: Exactly 2 bullet points highlighting what the rep did well
- improvements: Exactly 2 bullet points for areas to improve
- biggest_mistake: One sentence describing their most critical error (or "No major mistakes" if they performed well)`

      try {
        // Verify API key exists
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          console.error('[SCORECARD] GOOGLE_GENERATIVE_AI_API_KEY is not set')
          return handleCORS(NextResponse.json({
            final_score: 50,
            verdict: "Unable to generate scorecard - API key not configured.",
            strengths: ["Participated in the negotiation", "Showed initiative"],
            improvements: ["Try again for a full evaluation", "Ensure stable connection"],
            biggest_mistake: "Scorecard generation failed - API configuration error"
          }))
        }

        console.log('[SCORECARD] Starting scorecard generation...')

        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        console.log('[SCORECARD] Calling generateObject with gemini-2.5-flash...')

        // Using generateObject instead of streamObject for debugging
        const result = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: ScorecardResponseSchema,
          prompt: scoringPrompt,
        })

        console.log('[SCORECARD] generateObject succeeded')
        console.log('[SCORECARD] Response:', JSON.stringify(result.object))

        return handleCORS(NextResponse.json(result.object))

      } catch (apiError) {
        console.error('[SCORECARD] API Error occurred')
        console.error('[SCORECARD] Error name:', apiError.name)
        console.error('[SCORECARD] Error message:', apiError.message)
        console.error('[SCORECARD] Error cause:', apiError.cause)

        return handleCORS(NextResponse.json({
          final_score: 50,
          verdict: "Unable to generate scorecard due to an error.",
          strengths: ["Participated in the negotiation", "Showed initiative"],
          improvements: ["Try again for a full evaluation", "Ensure stable connection"],
          biggest_mistake: "Scorecard generation failed",
          _debug: {
            error: apiError.message,
            name: apiError.name,
            timestamp: new Date().toISOString()
          }
        }))
      }
    }

    // Get personas endpoint - GET /api/personas
    if (route === '/personas' && method === 'GET') {
      const personas = Object.entries(PERSONAS).map(([key, value]) => ({
        id: key,
        name: value.name,
        title: value.title,
        company: value.company,
        difficulty: value.difficulty
      }))
      return handleCORS(NextResponse.json(personas))
    }

    // ============================================
    // COOKIE-BASED SESSION MANAGEMENT (No Database Required)
    // ============================================

    // Register user email - POST /api/register
    if (route === '/register' && method === 'POST') {
      try {
        const body = await request.json()
        const { email, consent } = body

        // Validate email format
        if (!email || !email.includes('@') || !email.includes('.')) {
          return handleCORS(NextResponse.json(
            { error: "Valid email is required." },
            { status: 400 }
          ))
        }

        if (!consent) {
          return handleCORS(NextResponse.json(
            { error: "Privacy consent is required." },
            { status: 400 }
          ))
        }

        // Generate session token
        const sessionToken = uuidv4()
        const userId = uuidv4()
        
        // Create response with user data
        const response = NextResponse.json({
          id: userId,
          email: email.toLowerCase(),
          sessionsUsed: 0,
          maxFreeSessions: 3,
          sessionToken: sessionToken,
          createdAt: new Date().toISOString()
        })

        // Set cookie with session data (expires in 30 days)
        response.cookies.set('repready_session', JSON.stringify({
          id: userId,
          email: email.toLowerCase(),
          sessionsUsed: 0,
          sessionToken: sessionToken
        }), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        return handleCORS(response)
      } catch (error) {
        console.error('Register error:', error)
        return handleCORS(NextResponse.json(
          { error: "Registration failed. Please try again." },
          { status: 500 }
        ))
      }
    }

    // Get user by email - GET /api/user?email=xxx
    if (route === '/user' && method === 'GET') {
      try {
        const url = new URL(request.url)
        const email = url.searchParams.get('email')

        if (!email) {
          return handleCORS(NextResponse.json(
            { error: "Email parameter required." },
            { status: 400 }
          ))
        }

        // Try to get session from cookie
        const sessionCookie = request.cookies.get('repready_session')
        
        if (sessionCookie) {
          try {
            const sessionData = JSON.parse(sessionCookie.value)
            if (sessionData.email === email.toLowerCase()) {
              return handleCORS(NextResponse.json({
                id: sessionData.id,
                email: sessionData.email,
                sessionsUsed: sessionData.sessionsUsed || 0,
                maxFreeSessions: 3
              }))
            }
          } catch (e) {
            // Invalid cookie, continue
          }
        }

        // User not found in cookies - return default
        return handleCORS(NextResponse.json({
          id: uuidv4(),
          email: email.toLowerCase(),
          sessionsUsed: 0,
          maxFreeSessions: 3
        }))
      } catch (error) {
        console.error('Get user error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to get user data." },
          { status: 500 }
        ))
      }
    }

    // Increment session count - POST /api/user/session
    if (route === '/user/session' && method === 'POST') {
      try {
        const body = await request.json()
        const { email, currentSessionsUsed } = body

        if (!email) {
          return handleCORS(NextResponse.json(
            { error: "Email is required." },
            { status: 400 }
          ))
        }

        // Get current count from request body or default to 0
        const newSessionsUsed = (currentSessionsUsed || 0) + 1

        const response = NextResponse.json({
          sessionsUsed: newSessionsUsed,
          maxFreeSessions: 3,
          limitReached: newSessionsUsed >= 3
        })

        // Update cookie with new session count
        const sessionCookie = request.cookies.get('repready_session')
        let sessionData = {
          id: uuidv4(),
          email: email.toLowerCase(),
          sessionsUsed: newSessionsUsed,
          sessionToken: uuidv4()
        }

        if (sessionCookie) {
          try {
            const existingData = JSON.parse(sessionCookie.value)
            sessionData = {
              ...existingData,
              sessionsUsed: newSessionsUsed
            }
          } catch (e) {
            // Use default sessionData
          }
        }

        response.cookies.set('repready_session', JSON.stringify(sessionData), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        return handleCORS(response)
      } catch (error) {
        console.error('Session increment error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to update session count." },
          { status: 500 }
        ))
      }
    }

    // Request team access - POST /api/request-access
    if (route === '/request-access' && method === 'POST') {
      try {
        const body = await request.json()
        const { email, company, teamSize, message } = body

        // Log the request (in production, you might want to send this to an email service)
        console.log('Team access request:', { email, company, teamSize, message })

        return handleCORS(NextResponse.json({ 
          success: true, 
          id: uuidv4(),
          message: "Your request has been received. We'll contact you within 24 hours."
        }))
      } catch (error) {
        console.error('Request access error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to submit request." },
          { status: 500 }
        ))
      }
    }

    // Save session - POST /api/sessions
    //
    // Score-forgery guard (Sprint 27 audit, Known Issue 0b): this endpoint has no
    // auth (see Known Issue 5a — a separate, still-open fix) and previously stored
    // body.finalScore/dimensions/procurementScore/enablementScore verbatim, so
    // anyone who could see the request shape — trivial, it's client JS — could POST
    // a fabricated "Elite, 100/100" session for any rep's email and poison their
    // stats, the org dashboard, and the leaderboard. This doesn't add auth (that's
    // issue 5a's job), but it does mean a forged score has to survive an
    // independent Gemini re-scoring of a transcript that actually supports it — a
    // much higher bar than editing a JSON body.
    //
    // transcript is now required specifically so this can't be bypassed by simply
    // omitting it. NOTE: this breaks session-saving from app/simulate/page.js,
    // which never sent a transcript field to this endpoint. /simulate is
    // documented as an old page not part of the user journey ("do not touch" —
    // REPREADY_CONTEXT.md), so this is an accepted, explicitly-flagged side effect,
    // not an oversight: closing the forgery hole on the real product journey
    // matters more than keeping a legacy, unlinked page's save path working.
    if (route === '/sessions' && method === 'POST') {
      try {
        const body = await request.json()

        const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''
        if (!transcript) {
          return handleCORS(NextResponse.json(
            { error: "transcript required to verify score" }, { status: 400 }
          ))
        }

        const claimedScore = Number(body.finalScore) || 0
        const SCORE_TOLERANCE = 20 // headroom for LLM run-to-run variance and the coach-fallback path's different scoring methodology
        try {
          const verified = await scoreTranscript(transcript, body.persona, body.orgId)
          if (claimedScore > verified.weightedScore + SCORE_TOLERANCE) {
            console.warn('Rejected session save — claimed score exceeds what the transcript supports', {
              userEmail: body.userEmail, persona: body.persona, claimedScore, verifiedScore: verified.weightedScore
            })
            return handleCORS(NextResponse.json(
              { error: "Score does not match transcript." }, { status: 400 }
            ))
          }
        } catch (verifyError) {
          // Fail OPEN on infra errors (Gemini down/timeout) — an outage in this
          // verification call shouldn't cost a legitimate rep their real session.
          // This does mean the forgery guard is soft during a Gemini outage; a
          // known, accepted trade-off, not an oversight.
          console.error('Score verification call failed, saving unverified:', verifyError)
        }

   const session = {
  id: uuidv4(),
  userEmail: body.userEmail || '',
  orgId: body.orgId || null,
  persona: body.persona || '',
  finalScore: body.finalScore || 0,
  verdict: body.scorecard?.verdict || body.verdict || '',
  mode: body.mode || 'text',
  hostilityReached: body.hostilityReached || null,
  nextHostility: body.nextHostility || null,
  qualificationStatus: body.qualificationStatus || null,
  grade: body.grade || null,
  procurementScore: body.procurementScore || null,
  enablementScore: body.enablementScore || null,
  dimensions: body.dimensions || null,
  consentGiven: body.consentGiven ?? null,
  consentTimestamp: body.consentTimestamp ?? null,
  createdAt: new Date().toISOString()
}
        const db = await getDb()
        await db.collection('sessions').insertOne(session)
        return handleCORS(NextResponse.json(session))
      } catch (error) {
        console.error('Save session error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to save session." },
          { status: 500 }
        ))
      }
    }

    // Get sessions by the authenticated user - GET /api/sessions
    // (a legacy ?email= param may still be present on the request but is ignored — the
    // authenticated Clerk session is the only source of identity here)
    if (route === '/sessions' && method === 'GET') {
      try {
        const authedEmail = await getAuthedEmail()
        if (!authedEmail) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        const db = await getDb()
        const sessions = await db.collection('sessions')
          .find({ userEmail: authedEmail })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray()
        return handleCORS(NextResponse.json(sessions))
      } catch (error) {
        console.error('Get sessions error:', error)
        return handleCORS(NextResponse.json([]))
      }
    }

    // Delete the authenticated user's own sessions - DELETE /api/sessions
    // Previously took an unauthenticated ?email= query param — anyone who knew or
    // guessed an email could wipe that rep's entire session history (Known Issue
    // 5a). Now scoped to the caller's own authenticated email only, matching the
    // auth pattern already used by GET /sessions, /dashboard, /benchmark, and
    // /rep-memory — any ?email= on the request is ignored. Deliberately did not
    // add a manager-can-delete-org-sessions path: that's a materially bigger blast
    // radius (bulk-deleting other people's data) that deserves its own product
    // decision, not a default assumed while closing an auth hole.
    if (route === '/sessions' && method === 'DELETE') {
      try {
        const authedEmail = await getAuthedEmail()
        if (!authedEmail) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        const db = await getDb()
        await db.collection('sessions').deleteMany({ userEmail: authedEmail })
        return handleCORS(NextResponse.json({ success: true }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: "Failed to delete sessions." }, { status: 500 }
        ))
      }
    }

    // Manager dashboard - GET /api/dashboard
    // orgId is always derived from the authenticated user's own email domain — a
    // client-supplied ?orgId= is ignored so no one can view another org's data by
    // guessing a domain. Role gating: managers see the full org aggregate; reps
    // (the default for everyone until manually promoted in Clerk) see only their
    // own sessions. No one currently has role: 'manager' set, so this is a real
    // behavior change from before — anyone who was relying on seeing the org-wide
    // view will need role: 'manager' added to their Clerk publicMetadata.
    if (route === '/dashboard' && method === 'GET') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        const orgId = authedUser.email.split('@')[1]
        if (!orgId) return handleCORS(NextResponse.json(
          { error: "Unable to determine organization from account email" }, { status: 400 }
        ))
        const db = await getDb()
        const sessionQuery = authedUser.role === 'manager'
          ? { orgId: orgId }
          : { orgId: orgId, userEmail: authedUser.email }
        const sessions = await db.collection('sessions')
          .find(sessionQuery)
          .sort({ createdAt: -1 })
          .toArray()

        // Sourced from the org's actual criteria config (or DEFAULT_CRITERIA if
        // never customized) rather than a hardcoded list, so this always
        // aggregates against whatever dimensions this org is currently scoring
        // on. A session scored under a prior/renamed criterion simply stops
        // contributing to that key once the org's active list moves on — no
        // retroactive relabeling of historical data (same as this codebase's
        // existing pre-Sprint-15 orgId:null historical-data gap).
        const criteria = await getCriteriaForOrg(orgId)
        const DIMENSION_KEYS = criteria.map(c => c.key)

        const reps = groupRepsFromSessions(sessions)
        const qualifiedReps = reps.filter(r => r.bestQualificationStatus === 'Qualified' || r.bestQualificationStatus === 'Elite').length
        const eliteReps = reps.filter(r => r.bestQualificationStatus === 'Elite').length

        const totalSessions = sessions.length
        const scoreSum = sessions.reduce((sum, s) => sum + (s.finalScore || 0), 0)
        const avgScore = totalSessions > 0 ? Math.round(scoreSum / totalSessions) : 0

        const dimensionSums = {}
        const dimensionCounts = {}
        for (const key of DIMENSION_KEYS) { dimensionSums[key] = 0; dimensionCounts[key] = 0 }
        for (const s of sessions) {
          if (s.dimensions && typeof s.dimensions === 'object') {
            for (const key of DIMENSION_KEYS) {
              if (typeof s.dimensions[key] === 'number') {
                dimensionSums[key] += s.dimensions[key]
                dimensionCounts[key]++
              }
            }
          }
        }

        let dimensionAverages = null
        let weakestDimension = null
        if (DIMENSION_KEYS.some(key => dimensionCounts[key] > 0)) {
          dimensionAverages = {}
          for (const key of DIMENSION_KEYS) {
            dimensionAverages[key] = dimensionCounts[key] > 0 ? Math.round(dimensionSums[key] / dimensionCounts[key]) : null
          }
          let minVal = Infinity
          for (const key of DIMENSION_KEYS) {
            if (dimensionAverages[key] != null && dimensionAverages[key] < minVal) {
              minVal = dimensionAverages[key]
              weakestDimension = key
            }
          }
        }

        return handleCORS(NextResponse.json({
          orgId,
          totalSessions,
          avgScore,
          totalReps: reps.length,
          qualifiedReps,
          eliteReps,
          dimensionAverages,
          weakestDimension,
          criteria,
          reps,
          recentSessions: sessions.slice(0, 10).map(s => ({
            userEmail: s.userEmail,
            persona: s.persona,
            finalScore: s.finalScore,
            mode: s.mode,
            createdAt: s.createdAt,
            hostilityReached: s.hostilityReached || null,
            qualificationStatus: s.qualificationStatus || null
          }))
        }))
      } catch (error) {
        console.error('Dashboard error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to load dashboard." }, { status: 500 }
        ))
      }
    }

    // List reps for the self-serve admin panel - GET /api/admin/reps
    // Manager-only. Replaces the founder manually hand-editing Clerk metadata to
    // promote/demote reps — see POST /api/admin/reps below for the write side.
    // Reuses groupRepsFromSessions() (shared with GET /api/dashboard above) rather
    // than re-deriving the org's rep list a second way.
    if (route === '/admin/reps' && method === 'GET') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        if (authedUser.role !== 'manager') {
          return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
        }
        const orgId = authedUser.email.split('@')[1]
        if (!orgId) return handleCORS(NextResponse.json(
          { error: "Unable to determine organization from account email" }, { status: 400 }
        ))
        const db = await getDb()
        const sessions = await db.collection('sessions').find({ orgId }).toArray()
        const reps = groupRepsFromSessions(sessions)

        // Batch-resolve each rep's current role from Clerk (publicMetadata is the
        // only source of truth for role — never trust anything from the sessions
        // collection for this, since POST /api/sessions is unauthenticated and
        // doesn't guarantee userEmail is a real Clerk identity). limit must be
        // passed explicitly: Clerk's list endpoints default to 10 and would
        // otherwise silently truncate roles for orgs with more than 10 reps.
        const client = await clerkClient()
        const { data: clerkUsers } = reps.length
          ? await client.users.getUserList({
              emailAddress: reps.map(r => r.userEmail),
              limit: Math.max(reps.length, 1)
            })
          : { data: [] }
        const roleByEmail = new Map()
        for (const cu of clerkUsers) {
          const email = cu.primaryEmailAddress?.emailAddress || cu.emailAddresses?.[0]?.emailAddress
          if (!email) continue
          // Same role definition as getAuthedUser() above — keep these in sync.
          const role = cu.publicMetadata?.role === 'manager' ? 'manager' : 'rep'
          roleByEmail.set(email.toLowerCase(), { clerkUserId: cu.id, role })
        }

        const repsWithRole = reps.map(r => {
          const match = roleByEmail.get(r.userEmail.toLowerCase())
          return {
            ...r,
            clerkUserId: match?.clerkUserId ?? null,
            // null (not 'rep') means "no matching Clerk account found" — the UI
            // must treat this as unresolved/disabled, not silently default it.
            role: match?.role ?? null
          }
        })

        return handleCORS(NextResponse.json({ orgId, reps: repsWithRole }))
      } catch (error) {
        console.error('Admin reps GET error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to load reps." }, { status: 500 }
        ))
      }
    }

    // Promote/demote a rep - POST /api/admin/reps
    // Body: { targetEmail, newRole: 'rep' | 'manager' }. Manager-only, and only
    // within the caller's own org. Writes only the `role` key via Clerk's
    // updateUserMetadata, which PATCH-merges publicMetadata at the top level (does
    // not touch planTier/selectedPersonas) — confirmed against the installed
    // @clerk/backend SDK source, not assumed. This is the only place in the app
    // that sets role: 'manager' on anyone; getAuthedUser()'s read side (defaults
    // to 'rep' when unset) is untouched, so nothing changes for existing users
    // until a manager explicitly acts here.
    //
    // Known, accepted risk: orgId is email.split('@')[1] everywhere in this app,
    // with no allowlist of real business domains. A manager whose account is on a
    // shared consumer domain (e.g. gmail.com) could promote/demote another
    // same-domain user who happens to have a session — this endpoint only extends
    // an exposure the rest of the app (e.g. /api/dashboard) already has as
    // view-only. Explicit decision: ship as-is rather than invent new scope (a
    // domain blocklist, or real org modeling) that wasn't asked for.
    if (route === '/admin/reps' && method === 'POST') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        if (authedUser.role !== 'manager') {
          return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
        }

        const body = await request.json()
        const targetEmail = typeof body.targetEmail === 'string' ? body.targetEmail.trim() : ''
        const newRole = body.newRole
        if (!targetEmail || (newRole !== 'rep' && newRole !== 'manager')) {
          return handleCORS(NextResponse.json(
            { error: "targetEmail and newRole ('rep' or 'manager') are required." }, { status: 400 }
          ))
        }

        if (targetEmail.toLowerCase() === authedUser.email.toLowerCase()) {
          return handleCORS(NextResponse.json(
            { error: "You cannot change your own role." }, { status: 403 }
          ))
        }

        // Domain check on the raw submitted string, before any Clerk call — cheap
        // reject, and means a wrong-org probe gets an identical 403 whether or not
        // the target email even exists (only a same-domain, nonexistent email ever
        // reaches the 404 branch below).
        const orgId = authedUser.email.split('@')[1]?.toLowerCase()
        const targetDomain = targetEmail.split('@')[1]?.toLowerCase()
        if (!orgId || !targetDomain || targetDomain !== orgId) {
          return handleCORS(NextResponse.json(
            { error: "Target user is not in your organization." }, { status: 403 }
          ))
        }

        const client = await clerkClient()
        const { data } = await client.users.getUserList({ emailAddress: [targetEmail] })
        if (!data.length) {
          return handleCORS(NextResponse.json({ error: "User not found." }, { status: 404 }))
        }
        const targetUser = data[0]

        await client.users.updateUserMetadata(targetUser.id, {
          publicMetadata: { role: newRole }
        })

        return handleCORS(NextResponse.json({
          userEmail: targetEmail,
          clerkUserId: targetUser.id,
          role: newRole
        }))
      } catch (error) {
        console.error('Admin reps POST error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to update role." }, { status: 500 }
        ))
      }
    }

    // Read-only scoring criteria for the caller's own org - GET /api/criteria
    // Any authenticated user (rep or manager), not manager-only: this just
    // supplies the dimension labels my-stats/coach/dashboard need to render
    // whatever this org is currently scoring on. Editing stays manager-only
    // via /api/admin/criteria below.
    if (route === '/criteria' && method === 'GET') {
      try {
        const authedEmail = await getAuthedEmail()
        if (!authedEmail) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        const orgId = authedEmail.split('@')[1] || null
        const criteria = await getCriteriaForOrg(orgId)
        return handleCORS(NextResponse.json({ orgId, criteria }))
      } catch (error) {
        console.error('Criteria GET error:', error)
        return handleCORS(NextResponse.json({ error: "Failed to load criteria." }, { status: 500 }))
      }
    }

    // Manager-only scoring criteria settings - GET/POST/DELETE /api/admin/criteria
    // Same role-gate pattern as /api/admin/reps above: manager-only, scoped to
    // the caller's own org (orgId always server-derived from the authed
    // manager's email, never client-supplied).
    if (route === '/admin/criteria' && method === 'GET') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        if (authedUser.role !== 'manager') {
          return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
        }
        const orgId = authedUser.email.split('@')[1]
        if (!orgId) return handleCORS(NextResponse.json(
          { error: "Unable to determine organization from account email" }, { status: 400 }
        ))
        const db = await getDb()
        const doc = await db.collection('orgCriteria').findOne({ _id: orgId })
        const isDefault = !doc || !Array.isArray(doc.criteria) || !doc.criteria.length
        return handleCORS(NextResponse.json({
          orgId,
          criteria: isDefault ? DEFAULT_CRITERIA : doc.criteria,
          isDefault
        }))
      } catch (error) {
        console.error('Admin criteria GET error:', error)
        return handleCORS(NextResponse.json({ error: "Failed to load criteria." }, { status: 500 }))
      }
    }

    // Body: { criteria: [{ name, description }] }. Server derives a slug `key`
    // from each `name` — never trusts a client-supplied key — and rejects
    // duplicate keys (e.g. two names that slugify the same way), empty
    // name/description, and lists over 10 criteria (keeps the Gemini prompt
    // and this settings UI sane). No `weight` field: every criterion is
    // scored identically for now (see DEFAULT_CRITERIA comment above).
    if (route === '/admin/criteria' && method === 'POST') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        if (authedUser.role !== 'manager') {
          return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
        }
        const orgId = authedUser.email.split('@')[1]
        if (!orgId) return handleCORS(NextResponse.json(
          { error: "Unable to determine organization from account email" }, { status: 400 }
        ))

        const body = await request.json()
        const rawCriteria = Array.isArray(body.criteria) ? body.criteria : []
        if (!rawCriteria.length) {
          return handleCORS(NextResponse.json({ error: "At least one criterion is required." }, { status: 400 }))
        }
        if (rawCriteria.length > 10) {
          return handleCORS(NextResponse.json({ error: "A maximum of 10 criteria is supported." }, { status: 400 }))
        }

        const criteria = []
        const seenKeys = new Set()
        for (let i = 0; i < rawCriteria.length; i++) {
          const name = typeof rawCriteria[i].name === 'string' ? rawCriteria[i].name.trim() : ''
          const description = typeof rawCriteria[i].description === 'string' ? rawCriteria[i].description.trim() : ''
          if (!name || !description) {
            return handleCORS(NextResponse.json(
              { error: "Each criterion needs a name and a description." }, { status: 400 }
            ))
          }
          const key = slugifyKey(name, i)
          if (seenKeys.has(key)) {
            return handleCORS(NextResponse.json(
              { error: `Two criteria produced the same key ("${key}") — use more distinct names.` }, { status: 400 }
            ))
          }
          seenKeys.add(key)
          criteria.push({ key, name, description })
        }

        const db = await getDb()
        await db.collection('orgCriteria').updateOne(
          { _id: orgId },
          { $set: { criteria, updatedAt: new Date().toISOString(), updatedBy: authedUser.email } },
          { upsert: true }
        )

        return handleCORS(NextResponse.json({ orgId, criteria }))
      } catch (error) {
        console.error('Admin criteria POST error:', error)
        return handleCORS(NextResponse.json({ error: "Failed to save criteria." }, { status: 500 }))
      }
    }

    // Reset to the default 6-dimension rubric - DELETE /api/admin/criteria
    if (route === '/admin/criteria' && method === 'DELETE') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        if (authedUser.role !== 'manager') {
          return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
        }
        const orgId = authedUser.email.split('@')[1]
        if (!orgId) return handleCORS(NextResponse.json(
          { error: "Unable to determine organization from account email" }, { status: 400 }
        ))
        const db = await getDb()
        await db.collection('orgCriteria').deleteOne({ _id: orgId })
        return handleCORS(NextResponse.json({ orgId, criteria: DEFAULT_CRITERIA }))
      } catch (error) {
        console.error('Admin criteria DELETE error:', error)
        return handleCORS(NextResponse.json({ error: "Failed to reset criteria." }, { status: 500 }))
      }
    }

    // Real-call upload + pasted-transcript intake - POST /api/real-calls
    // Any signed-in user (rep or manager), no plan-tier gate. Branches on the
    // request's Content-Type: multipart/form-data is an audio upload (Path A,
    // transcribed via transcribeWithDiarization()), anything else is treated
    // as a JSON pasted-transcript body (Path B, parsed via
    // parseSpeakerLabelsFromPastedText()). Both paths derive orgId the
    // standard server-side way and write a `realCalls` record before
    // returning, so both an accepted and an "unsupported" outcome are always
    // persisted, not just successes. This only produces the record and tells
    // the caller whether a speaker-confirmation step is needed next — it does
    // not do the confirmation, scoring, or GET-by-id itself (later tasks).
    if (route === '/real-calls' && method === 'POST') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        const orgId = authedUser.email.split('@')[1]
        if (!orgId) return handleCORS(NextResponse.json(
          { error: "Unable to determine organization from account email" }, { status: 400 }
        ))

        const db = await getDb()
        const contentType = request.headers.get('content-type') || ''

        // ---- Path A: audio upload ----
        if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData()
          const file = formData.get('audio')
          if (!file) {
            return handleCORS(NextResponse.json(
              { error: "Missing audio file (field 'audio')." }, { status: 400 }
            ))
          }
          const buffer = Buffer.from(await file.arrayBuffer())

          let transcription
          try {
            transcription = await transcribeWithDiarization(buffer, file.name)
          } catch (error) {
            console.error('Real-call transcription error:', error)
            return handleCORS(NextResponse.json(
              { error: "Transcription failed. Please try again." }, { status: 500 }
            ))
          }

          const record = {
            id: uuidv4(),
            orgId,
            userEmail: authedUser.email,
            createdAt: new Date().toISOString()
          }

          if (transcription.audioDurationSeconds > MAX_REAL_CALL_DURATION_SECONDS) {
            record.status = 'unsupported'
            record.unsupportedReason = 'duration'
            await db.collection('realCalls').insertOne(record)
            return handleCORS(NextResponse.json({ id: record.id, status: 'unsupported', reason: 'duration' }))
          }

          if (transcription.speakerLabels.length > 2) {
            record.status = 'unsupported'
            record.unsupportedReason = 'speaker_count'
            await db.collection('realCalls').insertOne(record)
            return handleCORS(NextResponse.json({ id: record.id, status: 'unsupported', reason: 'speaker_count' }))
          }

          record.status = 'ready_for_confirmation'
          record.utterances = transcription.utterances
          record.audioDurationSeconds = transcription.audioDurationSeconds
          record.suggestedRepLabel = transcription.suggestedRepLabel
          await db.collection('realCalls').insertOne(record)

          const speakers = transcription.speakerLabels.map(label => {
            const firstUtterance = transcription.utterances.find(u => u.speaker === label)
            return { label, snippet: firstUtterance ? firstUtterance.text : '' }
          })

          return handleCORS(NextResponse.json({
            id: record.id,
            status: 'ready_for_confirmation',
            speakers,
            suggestedRepLabel: transcription.suggestedRepLabel
          }))
        }

        // ---- Path B: pasted transcript (JSON) ----
        // Judgment call: pasted transcripts are exempt from MAX_REAL_CALL_DURATION_SECONDS,
        // same as before this cap dropped to 7 minutes. There's no audio here to measure, and
        // estimating spoken duration from word count is unreliable enough (speaking pace varies
        // ~110-170wpm, plus cross-talk/pauses a transcript doesn't capture) that it would reject
        // legitimate short-but-verbose pastes and pass slow-paced long ones. The duration cap's
        // real purpose is bounding the ElevenLabs speech-to-text call's cost/scope for Path A —
        // pasted text never calls that API, and scoreTranscript() already handles this length of
        // input fine for the audio-upload path, so there's no matching cost concern to bound here.
        // Pasted transcripts also have no suggestedRepLabel — there's no speaker-role detection
        // without audio, so the confirmation UI falls back to no pre-highlighted default for this path.
        const body = await request.json()
        const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''
        if (!transcript) {
          return handleCORS(NextResponse.json({ error: "Transcript text is required." }, { status: 400 }))
        }

        const { labels, lines } = parseSpeakerLabelsFromPastedText(transcript)

        const record = {
          id: uuidv4(),
          orgId,
          userEmail: authedUser.email,
          createdAt: new Date().toISOString()
        }

        if (labels.length === 0) {
          record.status = 'unsupported'
          record.unsupportedReason = 'no_labels_detected'
          await db.collection('realCalls').insertOne(record)
          return handleCORS(NextResponse.json({ id: record.id, status: 'unsupported', reason: 'no_labels_detected' }))
        }

        if (labels.length > 2) {
          record.status = 'unsupported'
          record.unsupportedReason = 'speaker_count'
          await db.collection('realCalls').insertOne(record)
          return handleCORS(NextResponse.json({ id: record.id, status: 'unsupported', reason: 'speaker_count' }))
        }

        // Judgment call (flagged per the task, not silently resolved either
        // way): exactly 1 detected label means the paste never distinguishes
        // a second speaker at all, so there's no rep-vs-prospect assignment
        // to confirm — the same practical dead end as 0 labels or 3+, just a
        // different cause. Treating it as its own explicit "unsupported"
        // outcome (rather than folding it into the 2-label success path,
        // which would wrongly claim a confirmation step exists, or into the
        // "too many" rejection path, which would mislabel the actual reason)
        // keeps the client-facing `reason` honest about why. See the
        // detailed writeup in the report accompanying this change.
        if (labels.length === 1) {
          record.status = 'unsupported'
          record.unsupportedReason = 'single_speaker'
          await db.collection('realCalls').insertOne(record)
          return handleCORS(NextResponse.json({ id: record.id, status: 'unsupported', reason: 'single_speaker' }))
        }

        record.status = 'ready_for_confirmation'
        record.pastedLines = lines
        await db.collection('realCalls').insertOne(record)

        const speakers = labels.map(label => {
          const firstLine = lines.find(l => l.label === label)
          return { label, snippet: firstLine ? firstLine.text : '' }
        })

        return handleCORS(NextResponse.json({ id: record.id, status: 'ready_for_confirmation', speakers }))
      } catch (error) {
        console.error('Real-calls POST error:', error)
        return handleCORS(NextResponse.json({ error: "Failed to process real call." }, { status: 500 }))
      }
    }

    // Fetch a single real-call record by id - GET /api/real-calls?id=...
    // Read-only, for the (later) client-side report page to load/reload a
    // specific record by id — not a polling endpoint, nothing async is in
    // flight by the time this is called. Scoped to the caller's own email,
    // same ownership-check pattern as POST /real-calls/confirm-speaker above
    // (never return another user's record even if they guess the id).
    if (route === '/real-calls' && method === 'GET') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }

        const id = new URL(request.url).searchParams.get('id')
        if (!id) {
          return handleCORS(NextResponse.json({ error: "id is required." }, { status: 400 }))
        }

        const db = await getDb()
        const record = await db.collection('realCalls').findOne({ id, userEmail: authedUser.email })
        if (!record) {
          return handleCORS(NextResponse.json({ error: "Real call not found." }, { status: 404 }))
        }

        return handleCORS(NextResponse.json(record))
      } catch (error) {
        console.error('Real-calls GET error:', error)
        return handleCORS(NextResponse.json({ error: "Failed to fetch real call." }, { status: 500 }))
      }
    }

    // Real-call speaker confirmation + scoring - POST /api/real-calls/confirm-speaker
    // Takes a `ready_for_confirmation` realCalls record (produced by POST
    // /api/real-calls, Task 3) plus the human's choice of which detected
    // speaker label is the rep, relabels the transcript to the standard
    // `Rep: `/`Prospect: ` line format used everywhere else in this app (see
    // app/deck/page.js's handleTerminate), and runs it through the exact same
    // two-call scoring pipeline /api/boardroom uses (scoreTranscript() then
    // generateExecutiveSummary()) — not a reimplementation of that
    // combination, the same one.
    if (route === '/real-calls/confirm-speaker' && method === 'POST') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }

        const body = await request.json()
        const { id, repLabel } = body
        if (!id || !repLabel) {
          return handleCORS(NextResponse.json(
            { error: "id and repLabel are required." }, { status: 400 }
          ))
        }

        const db = await getDb()
        // Scoped to the caller's own email — same ownership-check spirit as
        // GET/DELETE /api/sessions above (never trust a client-supplied
        // email/id pair without also matching it to the authenticated user).
        const record = await db.collection('realCalls').findOne({ id, userEmail: authedUser.email })
        if (!record) {
          return handleCORS(NextResponse.json({ error: "Real call not found." }, { status: 404 }))
        }

        if (record.status !== 'ready_for_confirmation') {
          return handleCORS(NextResponse.json(
            { error: "This call is not awaiting speaker confirmation." }, { status: 400 }
          ))
        }

        // Relabel to the same `Rep: `/`Prospect: ` line format the voice-mode
        // pipeline already produces (app/deck/page.js's handleTerminate) —
        // whichever detected label the human picked as repLabel becomes
        // "Rep", every other label becomes "Prospect". Two input shapes:
        // record.utterances (audio path, Task 2/3) uses {speaker, text};
        // record.pastedLines (paste path, Task 3) uses {label, text} — same
        // relabeling logic, different field name for the speaker tag.
        let transcript
        if (record.utterances) {
          transcript = record.utterances
            .map(u => `${u.speaker === repLabel ? 'Rep' : 'Prospect'}: ${u.text}`)
            .join('\n')
        } else {
          transcript = record.pastedLines
            .map(l => `${l.label === repLabel ? 'Rep' : 'Prospect'}: ${l.text}`)
            .join('\n')
        }

        // Same two-call pipeline /api/boardroom uses, destructured identically.
        const { weightedScore, criteria, criteriaSource, orgIdReceived, ...analyst } = await scoreTranscript(transcript, 'real-call', record.orgId)
        const executiveSummary = await generateExecutiveSummary(analyst, weightedScore, criteria)

        await db.collection('realCalls').updateOne({ id }, {
          $set: {
            status: 'scored',
            repLabel,
            transcript,
            finalScore: weightedScore,
            procurementScore: analyst.procurementScore,
            enablementScore: analyst.enablementScore,
            dimensions: analyst.dimensions,
            criteria,
            grade: executiveSummary.grade,
            verdict: executiveSummary.verdict,
            whatYouDidRight: executiveSummary.whatYouDidRight,
            whatYouDidWrong: executiveSummary.whatYouDidWrong,
            oneThingToFixNext: executiveSummary.oneThingToFixNext,
            analysts: executiveSummary.analysts,
            scoredAt: new Date().toISOString()
          }
        })

        const scoredRecord = await db.collection('realCalls').findOne({ id })
        return handleCORS(NextResponse.json(scoredRecord))
      } catch (error) {
        console.error('Real-calls confirm-speaker error:', error)
        return handleCORS(NextResponse.json({ error: "Failed to score real call." }, { status: 500 }))
      }
    }

    // Persona access - GET /api/persona-access
    // Returns which of the 4 personas this user can access. If planTier is
    // unset (true for everyone right now), all 4 are unlocked — enforcement
    // only activates once a real planTier is set on a user's Clerk account.
    // Growth/Scale/Enterprise are unrestricted; only 'starter' is limited.
    const ALL_PERSONAS = ['richard', 'sandra', 'priya', 'rakesh']
    if (route === '/persona-access' && method === 'GET') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        const unlocked = authedUser.planTier === 'starter'
          ? authedUser.selectedPersonas
          : ALL_PERSONAS
        return handleCORS(NextResponse.json({
          planTier: authedUser.planTier,
          unlocked
        }))
      } catch (error) {
        console.error('Persona-access GET error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to load persona access." }, { status: 500 }
        ))
      }
    }

    // Persona access - POST /api/persona-access
    // Locks in a persona choice for Starter-tier users (any 2 of 4, first
    // come). No-ops for non-starter users since they're already unrestricted.
    // Once 2 are locked in, a third distinct choice is rejected with a clear
    // error rather than silently failing.
    if (route === '/persona-access' && method === 'POST') {
      try {
        const authedUser = await getAuthedUser()
        if (!authedUser) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        const body = await request.json()
        const { personaId } = body
        if (!personaId || !ALL_PERSONAS.includes(personaId)) {
          return handleCORS(NextResponse.json({ error: "Invalid persona." }, { status: 400 }))
        }

        if (authedUser.planTier !== 'starter') {
          return handleCORS(NextResponse.json({ planTier: authedUser.planTier, unlocked: ALL_PERSONAS }))
        }

        if (authedUser.selectedPersonas.includes(personaId)) {
          return handleCORS(NextResponse.json({ planTier: 'starter', unlocked: authedUser.selectedPersonas }))
        }

        if (authedUser.selectedPersonas.length >= 2) {
          return handleCORS(NextResponse.json(
            { error: "Your plan includes 2 personas. Upgrade to unlock the rest.", unlocked: authedUser.selectedPersonas },
            { status: 403 }
          ))
        }

        const updatedSelection = [...authedUser.selectedPersonas, personaId]
        const client = await clerkClient()
        await client.users.updateUserMetadata(authedUser.userId, {
          publicMetadata: { selectedPersonas: updatedSelection }
        })

        return handleCORS(NextResponse.json({ planTier: 'starter', unlocked: updatedSelection }))
      } catch (error) {
        console.error('Persona-access POST error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to update persona access." }, { status: 500 }
        ))
      }
    }
// Boardroom Review - POST /api/boardroom
if (route === '/boardroom' && method === 'POST') {
  try {
    const body = await request.json()
    // orgId is client-supplied and unverified — this endpoint has no auth at
    // all (transcript/persona are already trusted this way). Known, accepted
    // gap tracked separately (Known Issue 5a); this feature doesn't add auth
    // here, it just extends the existing trust level to one more field.
    const { transcript, persona, orgId } = body

    if (!transcript || !persona) {
      return handleCORS(NextResponse.json(
        { error: "transcript and persona required" }, { status: 400 }
      ))
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return handleCORS(NextResponse.json(
        { error: "API key not configured" }, { status: 500 }
      ))
    }

    // CALL 1 — Combined analyst: procurement + enablement + the org's skill dimensions.
    // Shared with the POST /api/sessions score-forgery check — see scoreTranscript()
    // near the top of this file.
    const { weightedScore, criteria, criteriaSource, orgIdReceived, ...analyst } = await scoreTranscript(transcript, persona, orgId)
    console.log(`[/api/boardroom] persona=${persona} orgIdReceived=${orgIdReceived} criteriaSource=${criteriaSource} criteriaKeys=${criteria.map(c => c.key).join(',')}`)

    // CALL 2 — Executive summarizer. Extracted into generateExecutiveSummary()
    // near scoreTranscript() (prerequisite refactor for the upcoming
    // real-call-scoring feature) — same prompt/schema/logic as before, just
    // no longer inlined here.
    const executiveSummary = await generateExecutiveSummary(analyst, weightedScore, criteria)

    return handleCORS(NextResponse.json({
      procurementScore: analyst.procurementScore,
      enablementScore: analyst.enablementScore,
      finalScore: weightedScore,
      grade: executiveSummary.grade,
      verdict: executiveSummary.verdict,
      whatYouDidRight: executiveSummary.whatYouDidRight,
      whatYouDidWrong: executiveSummary.whatYouDidWrong,
      oneThingToFixNext: executiveSummary.oneThingToFixNext,
      dimensions: analyst.dimensions,
      criteria,
      // Diagnostic fields (Sprint 38) — not used by the UI, visible in the
      // browser Network tab and Vercel logs so a "why didn't my custom
      // criteria show up" report is instantly diagnosable instead of
      // requiring a repro: was an orgId even received, and did it resolve to
      // this org's saved criteria or the default fallback.
      criteriaSource,
      orgIdReceived,
      analysts: executiveSummary.analysts
    }))

  } catch (error) {
    console.error('Boardroom error:', error)
    return handleCORS(NextResponse.json(
      { error: "Boardroom review failed." }, { status: 500 }
    ))
  }
  }
    // GET /api/benchmark?persona=xxx — scoped to the authenticated user only
    if (route === '/benchmark' && method === 'GET') {
      try {
        const authedEmail = await getAuthedEmail()
        if (!authedEmail) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }
        const url = new URL(request.url)
        const persona = url.searchParams.get('persona')
        const db = await getDb()
        const query = { userEmail: authedEmail }
        if (persona) query.persona = persona
        const bestSession = await db.collection('sessions')
          .find({ ...query, hostilityReached: { $exists: true, $ne: null } })
          .sort({ hostilityReached: -1 })
          .limit(1)
          .toArray()
        if (!bestSession.length || !bestSession[0].hostilityReached) {
          return handleCORS(NextResponse.json({ startingHostility: 40, hostilityLabel: 'Low' }))
        }
        const nextStart = Math.min(90, bestSession[0].hostilityReached + 5)
        let label = 'Low'
        if (nextStart >= 85) label = 'Extreme'
        else if (nextStart >= 70) label = 'High'
        else if (nextStart >= 55) label = 'Medium'
        return handleCORS(NextResponse.json({ startingHostility: nextStart, hostilityLabel: label }))
      } catch (error) {
        console.error('Benchmark error:', error)
        return handleCORS(NextResponse.json({ startingHostility: 40, hostilityLabel: 'Low' }))
      }
    }

    // Rep memory - POST /api/rep-memory
    // Most urgent of the four to authenticate: this endpoint triggers a billed
    // Gemini call, so a mismatched/spoofed userEmail is rejected outright rather
    // than silently substituted, per the explicit request body contract.
    if (route === '/rep-memory' && method === 'POST') {
      try {
        const authedEmail = await getAuthedEmail()
        if (!authedEmail) {
          return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
        }

        const body = await request.json()
        const { userEmail, persona } = body
        if (!userEmail || !persona) {
          return handleCORS(NextResponse.json({ hasHistory: false }, { status: 400 }))
        }
        if (userEmail.toLowerCase() !== authedEmail.toLowerCase()) {
          return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
        }

        const db = await getDb()
        const sessions = await db.collection('sessions')
          .find({ userEmail, persona })
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray()

        if (sessions.length < 2) {
          return handleCORS(NextResponse.json({ hasHistory: false }))
        }

        const orgId = authedEmail.split('@')[1] || null
        const criteria = await getCriteriaForOrg(orgId)

        const sessionLines = sessions.map(s => {
          const date = s.createdAt ? String(s.createdAt).slice(0, 10) : 'unknown date'
          let line = `${date}: score ${s.finalScore ?? 0}/100, grade ${s.grade || 'N/A'}, hostility ${s.hostilityReached ?? 0}%, status ${s.qualificationStatus || 'Unknown'}`
          if (s.dimensions) {
            const dims = criteria
              .filter(c => typeof s.dimensions[c.key] === 'number')
              .map(c => `${c.name.toLowerCase()} ${s.dimensions[c.key]}`)
              .join(', ')
            if (dims) line += `, dimensions: ${dims}`
          }
          return line
        }).join('\n')

        const prompt = `You are analyzing a sales rep's practice history.
Summarize their patterns in 3 sentences maximum for
their AI buyer opponent to use. Focus on:
what tactics they rely on, where they consistently fail,
what they haven't tried yet. Be specific with scores.
Sessions: ${sessionLines}`

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
        if (!apiKey) {
          console.error('Rep memory error: GOOGLE_GENERATIVE_AI_API_KEY not set')
          return handleCORS(NextResponse.json({ hasHistory: false }))
        }

        let repHistory = ''
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.3,
              },
            }),
          })
          if (!response.ok) {
            const err = await response.text()
            console.error('Rep memory Gemini API error:', err)
            return handleCORS(NextResponse.json({ hasHistory: false }))
          }
          const data = await response.json()
          repHistory = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        } catch (geminiError) {
          console.error('Rep memory Gemini fetch error:', geminiError)
          return handleCORS(NextResponse.json({ hasHistory: false }))
        }

        if (!repHistory.trim()) {
          return handleCORS(NextResponse.json({ hasHistory: false }))
        }

        return handleCORS(NextResponse.json({ hasHistory: true, repHistory: repHistory.trim() }))
      } catch (error) {
        console.error('Rep memory error:', error)
        return handleCORS(NextResponse.json({ hasHistory: false }))
      }
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ))
  }
}

// Wraps handleRouteInternal so every response gets the real, per-request
// CORS origin decision applied last — see applyCorsOriginPolicy() above.
async function handleRoute(request, context) {
  const response = await handleRouteInternal(request, context)
  return applyCorsOriginPolicy(response, request)
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
