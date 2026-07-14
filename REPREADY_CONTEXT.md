# REPREADY_CONTEXT.md
# Single source of truth for RepReady — updated after every sprint task
# Last updated: July 14, 2026

---

## PRODUCT OVERVIEW

**RepReady** is an AI-powered B2B sales negotiation simulator targeting India and SEA markets. Reps practice against hostile AI buyers (voice-only) and receive boardroom-grade coaching feedback after each session.

**Core value proposition:** Progressive difficulty system where the AI buyer gets harder as the rep improves. Reps earn their way from Not Qualified → Elite through repeated sessions.

**Target users:** B2B sales reps (individual) + VP Sales / Sales Managers (team view)

**Stack:** Next.js 14 (App Router) · Clerk auth · MongoDB Atlas M0 (Mumbai) · ElevenLabs voice agents · Gemini 2.5 Flash (scoring) · Paddle (payments) · Vercel (Hobby plan, 10s function timeout)

---

## REPOSITORY

- **Repo:** github.com/V619-maker/repready
- **Branch:** main (auto-deploys to Vercel)
- **Production URL:** repready.site
- **Single catch-all API:** `app/api/[[...path]]/route.js` (all endpoints live here except `/api/coach` and `/api/deduct-credit` which have their own files)

---

## ENVIRONMENT VARIABLES (Vercel — repready project settings)

| Variable | Purpose |
|---|---|
| `MONGO_URL` | MongoDB Atlas connection string (mongodb+srv://...) |
| `DB_NAME` | `repready` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key for boardroom scoring |
| `CLERK_SECRET_KEY` | Clerk server-side auth |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side auth |

**Resolved July 13, 2026:** `MONGO_URL` was renamed from `Mongo` to `MONGO_URL` in Vercel, and a `getDb()` connection-caching bug (see git history: `app/api/[[...path]]/route.js`) was fixed. `/api/sessions` POST now confirmed returning 200 in production.

---

## USER JOURNEY (confirmed, do not change without explicit instruction)

```
repready.site (landing)
    ↓
Sign In (Clerk) → redirects to /deck
    ↓
/deck — choose Richard Vance or Sandra Chen
    ↓
Voice simulation (ElevenLabs WebRTC)
    ↓
Session ends → boardroom pipeline fires (2 Gemini calls)
    ↓
Results screen (score + qualification status + hostility reached)
    ↓
ANALYZE WITH COACH → /coach (full debrief)
MY PROGRESS → /my-stats (rep progression)
    ↓
/dashboard (manager view — separate page)
```

**Pages that exist:**
- `app/page.js` — landing page ✅
- `app/coach/page.js` — post-session debrief ✅
- `app/my-stats/page.js` — rep progression ✅ live, showing real MongoDB data. Now includes "last practiced X days ago" and a consecutive-weeks streak counter.
- `app/dashboard/page.js` — manager view ✅ upgraded: qualified/elite rep counts, session-weighted team avg score, team skill matrix with weakest-dimension callout, best-ever rep leaderboard (with 7-day inactivity warning per rep), recent sessions
- `app/simulate/page.js` — OLD page, NOT part of user journey, do not touch
- `app/sign-in/[[...sign-in]]/page.js` — Clerk sign in, redirects to `/deck`

---

## ElevenLabs AGENTS

| Agent | ID | Role |
|---|---|---|
| Richard Vance | `agent_8601kmk3maq9f9a9csym74aj7s4e` | VP Procurement, Meridian Logistics |
| Sandra Chen | `agent_0301kmsnhr7tf11b62bvd7vsw9qq` | Head of IT, 800-person financial firm |

**Richard's current LLM:** Claude Sonnet 4.6 (known issue: says stage directions aloud like `[impatient]` — fix by switching to ElevenLabs-hosted LLM or Gemini 2.5 Flash in ElevenLabs dashboard)

**Dynamic variables passed via `startSession()` dynamicVariables:**
- `{{hostility_level}}` — always present. Values: `LOW (40%)`, `MEDIUM (60%)`, `HIGH (78%)`, `EXTREME (90%)`
- `{{rep_history}}` — added July 2026, **conditionally present**. Only included when: the rep is signed in, current hostility ≥50%, and `/api/rep-memory` finds 2+ prior sessions for that rep+persona and successfully generates a summary via Gemini 2.5 Flash. When any of those isn't true, the key is entirely absent from dynamicVariables (not an empty string) — **Richard's prompt must handle `{{rep_history}}` being unset/blank gracefully** (see "ACTION NEEDED" below).

**ACTION NEEDED (manual, ElevenLabs dashboard — not done by this repo):** Richard's system prompt needs an addition to actually use `{{rep_history}}`. Add this block to his prompt, positioned near the top alongside his other context/persona setup (before the scoring rules section):

```
REP HISTORY (if provided): {{rep_history}}

If REP HISTORY above contains a summary, use it to inform how you engage this rep — reference their known patterns naturally in your dialogue (e.g. push harder on a tactic they haven't tried, or call out a weakness they've shown before) without ever stating "the system told me" or otherwise breaking character. If REP HISTORY is blank or missing, ignore this instruction entirely and proceed as you would for any rep with no history — do not mention its absence.
```

This has NOT been applied to the live ElevenLabs agent yet — do it manually in the ElevenLabs dashboard, then verify a real session with a rep who has 2+ prior sessions actually changes Richard's behavior before considering this feature complete end-to-end. Sandra's prompt does not need this change (rep-memory currently applies to both personas' API calls, but this action item only covers Richard per the original ask — extend to Sandra separately if desired).

**Richard's first message:** "Richard Chen. Look, I've got something on my desk right now so make this fast. What've you got?"

**DPDP retention — ElevenLabs conversation history (manual action, not automated):** the app's own session records (MongoDB) are retained 90 days per the consent text and privacy policy, but ElevenLabs separately retains conversation/call history in its own dashboard, which this codebase does not control or auto-delete. Until an automated deletion job exists, someone must manually delete ElevenLabs conversation history older than 90 days on a recurring basis (e.g. monthly) via the ElevenLabs dashboard. Add this to a recurring ops checklist — there is no code-side reminder for it.

---

## MONGODB SCHEMA

**Collection: `sessions`**

```javascript
{
  id: uuidv4(),
  userEmail: String,          // rep's email from Clerk
  orgId: String,              // email domain (e.g. "acme.com") — auto-org
  persona: String,            // "richard" or "sandra"
  finalScore: Number,         // 0-100
  grade: String,              // "A", "B", "C", "D", "F"
  procurementScore: Number,   // 0-100 (boardroom analyst 1)
  enablementScore: Number,    // 0-100 (boardroom analyst 2)
  verdict: String,            // one-sentence executive verdict
  mode: String,               // "voice" or "text"
  hostilityReached: Number,   // % hostility during session (40-90)
  nextHostility: Number,      // recommended starting hostility next session
  qualificationStatus: String,// "Not Qualified" | "Getting Started" | "Developing" | "Qualified" | "Elite"
  dimensions: {
    discoveryQuality: Number,
    objectionHandling: Number,
    priceDefense: Number,
    smeKnowledge: Number,
    communication: Number,
    emotionalResilience: Number
  },
  consentGiven: Boolean,       // DPDP consent overlay — true if rep accepted before this session, nullable
  consentTimestamp: String,    // ISO timestamp of consent acceptance, nullable
  createdAt: String           // ISO timestamp
}
```

**Note:** `dimensions` is nullable — older sessions may not have it. Always handle null case.
**Note:** `consentGiven`/`consentTimestamp` are nullable — sessions saved before the DPDP consent overlay (Sprint 9) don't have them.

---

## API ENDPOINTS

All in `app/api/[[...path]]/route.js` unless noted:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/sessions` | GET | Fetch sessions by `?email=` or `?orgId=` |
| `/api/sessions` | POST | Save a session after completion |
| `/api/boardroom` | POST | 2-call Gemini pipeline (combined analyst + executive summarizer) |
| `/api/dashboard` | GET | Org-level aggregate stats by `?orgId=` — team avg score (session-weighted), qualified/elite rep counts, team dimension averages + weakest dimension, per-rep best-ever score/hostility/qualification status/lastSession (most recent `createdAt`), recent sessions |
| `/api/benchmark` | GET | Fetch next hostility level by `?email=&persona=` |
| `/api/rep-memory` | POST | `{ userEmail, persona }` → last-5-session Gemini summary of rep patterns for the AI buyer to use. `{ hasHistory: false }` if <2 sessions or on any failure (never a 500). Nothing is stored — regenerated fresh every call. |
| `/api/negotiate` | POST | Text mode only (not used in voice journey) |
| `/api/coach` | POST | Standalone file — fallback single Gemini call for scoring |
| `/api/deduct-credit` | POST | Standalone file — Clerk credit deduction |

---

## QUALIFICATION FRAMEWORK

| Score | Hostility | Status |
|---|---|---|
| Any | <50% | Not Qualified |
| 70+ | 50-59% | Getting Started |
| 70+ | 60-77% | Developing |
| 70+ | 78-84% | Qualified |
| 70+ | 85-90% | Elite |

**Hostility progression:**
- Starting hostility: 40% (first session ever)
- Next session = best `hostilityReached` + 5%
- Hostility increases during a session if rep scores well
- Cap: 90%

---

## BOARDROOM PIPELINE (2 Gemini calls, ~8-12 seconds)

**Call 1 — Combined Analyst:**
Scores procurement (margin defense) + enablement (call technique) + all 6 dimensions in one call.

**Call 2 — Executive Summarizer:**
Takes combined scores → produces finalScore, grade, verdict, whatYouDidRight, whatYouDidWrong, oneThingToFixNext.

**Fallback:** If boardroom fails → falls back to `/api/coach` standalone call.

**Output stored in localStorage:**
- `repready_latest_debrief` — full boardroom JSON
- `repready_latest_transcript` — raw conversation transcript
- `repready_debrief_type` — "boardroom" or "coach"

---

## 6-DIMENSION SKILL MATRIX

1. **Discovery Quality** — asked right questions before pitching
2. **Objection Handling** — validated before responding
3. **Price Defense** — held firm on price
4. **SME Knowledge** — demonstrated product/industry knowledge
5. **Communication** — clarity, pacing, active listening
6. **Emotional Resilience** — stayed composed under pressure

---

## 5 USPs (do not build features that don't reinforce these)

1. **Progressive Difficulty** — Richard gets harder as rep improves. Nobody else has this.
2. **Qualification Journey** — Not Qualified → Elite. A defined path, not just a score.
3. **Hostility-Adjusted Scoring** — 65 at 78% hostility > 80 at 40% hostility. Context-aware scoring.
4. **Boardroom Pipeline Feedback** — Two specialist analysts + executive summarizer. Not one generic coach.
5. **India/SEA fit** — DPDP Act 2023 compliant. Mumbai data residency. Accessible pricing vs Gong/Mindtickle.

---

## SPRINT STATUS

| Sprint | Status | Notes |
|---|---|---|
| Sprint 1 — Core journey | ✅ Complete | Landing → /deck → voice → /coach working |
| Sprint 2 — Dynamic hostility | ✅ Complete | Hostility passes to Richard via ElevenLabs dynamic variables |
| Sprint 3 — Boardroom pipeline | ✅ Complete | 2-call Gemini pipeline live, 6 dimensions scoring |
| Sprint 4 — Stats pages | ✅ Complete | /my-stats live with real data; /dashboard upgraded with qualified/elite counts, team skill matrix, best-ever rep leaderboard |
| Sprint 5 — Retention mechanics | ✅ Complete | /my-stats: last-practiced display + weekly streak counter. /dashboard: 7-day inactivity warning on rep leaderboard. Weekly nudges not built (not in scope). |
| Sprint 6 — CRM integration | ⏳ Not started | Via Nango (nango.dev). Salesforce + HubSpot OAuth. |
| Sprint 7 — 60-second onboarding | ✅ Complete | /deck auto-assigns Richard Vance and shows a brief overlay for first-time users (0 MongoDB sessions); returning users unaffected |
| Sprint 8 — Clerk production keys | ⏳ Not started | Dev keys warning showing in console |
| Sprint 9 — DPDP Act compliance (Task 1) | ✅ Complete | `/deck` shows a per-session consent overlay (above the existing call-modal) before every voice session; `consentGiven`/`consentTimestamp` piggyback on the existing end-of-session `POST /api/sessions` call — no new network call at session-start. Backend stores both fields as nullable. |
| Sprint 9 — DPDP Act compliance (Task 2) | ✅ Complete | `app/privacy/page.js` updated: explicit voice recording/transcript/scores/email data collection, MongoDB Atlas (Mumbai, India) named as storage processor alongside ElevenLabs/Gemini, explicit 90-day retention section, deletion-request and privacy-question contact routed to `privacy@repready.site`, new Grievance Redressal section (DPDP Act 2023) with 30-day response commitment. Sections renumbered 1–11; `sales@repready.site` no longer used anywhere on this page. |

---

## KNOWN ISSUES (fix these before adding new features)

1. **Richard says stage directions aloud** — `[impatient]`, `[skeptical]` etc. Root cause: Claude Sonnet 4.6 LLM in ElevenLabs generates stage directions. Fix: switch Richard's LLM to ElevenLabs-hosted model in ElevenLabs dashboard.

2. **Dead code** — duplicate `getQualificationStatus` function in `app/api/[[...path]]/route.js` (search for the function definition). The active one is in `app/deck/page.js`. Safe to delete from route.js.

3. **Clerk dev keys in production** — console warning: "afterSignInUrl is deprecated". Fix: switch to production Clerk keys + replace `afterSignInUrl` with `forceRedirectUrl` in layout.js.

4. **Personal best discrepancy (design choice, not a bug now)** — `/deck` shows personal best from localStorage (device-local). `/my-stats` and `/dashboard` read best-ever score from MongoDB (authoritative, cross-device). Now that MongoDB is confirmed working, these can genuinely disagree if a rep switches devices/browsers — localStorage isn't reliable per the constraints below. Consider migrating `/deck`'s personal-best display to MongoDB too.

5. **No server-side auth on `/api/sessions`, `/api/dashboard`, `/api/benchmark`, `/api/rep-memory`** — these trust `?email=`/`?orgId=`/body `userEmail` with no verification the caller owns that identity/org. Anyone who knows or guesses an email/org domain can read that data (or, for `/api/rep-memory`, trigger a Gemini call against arbitrary session history). Not yet fixed; flag before touching.

---

## P0 PRIORITY (do not deviate from this order)

1. ~~Fix MongoDB~~ — ✅ Complete July 13, 2026
2. Use skills library for all remaining sprints — no more manual back-and-forth
3. RAG for Richard/Sandra — code side ✅ complete, but built differently than originally scoped: instead of an ElevenLabs Knowledge Base upload, it's a `POST /api/rep-memory` endpoint that summarizes a rep's last 5 sessions (from MongoDB, via Gemini 2.5 Flash) and injects it as a `{{rep_history}}` dynamic variable at call start. **Still needs a manual ElevenLabs dashboard edit to Richard's system prompt** — see "ACTION NEEDED" under ElevenLabs Agents above. Not yet wired into Sandra's prompt.

---

## TOOLS & INTEGRATIONS

| Tool | Purpose | Status |
|---|---|---|
| ElevenLabs | Voice agents (Richard + Sandra) | ✅ Active |
| MongoDB Atlas | Sessions, benchmarks, org data | ✅ Active |
| Clerk | Auth, credits in privateMetadata | ✅ Active (dev keys) |
| Paddle | Payments | ✅ Active — DO NOT TOUCH without flagging |
| Nango | CRM integration (Sprint 6) | ⏳ Not started |
| Claude Code | Build agent via skills library | 🔄 Setting up |
| Vercel | Deployment (Hobby plan, 10s timeout) | ✅ Active |

---

## CONSTRAINTS (never violate these)

- **Vercel Hobby 10s timeout** — all API calls must complete in under 10 seconds. Boardroom pipeline is 2 calls not 3 for this reason.
- **Do not touch Paddle** — payment flow is working. Any change risks breaking real user payments.
- **Do not touch `/simulate`** — old page, not part of user journey, ignore it.
- **Do not add text mode** — RepReady is voice-only. It is an enterprise training simulator, not a chatbot.
- **localStorage is not reliable** — always save important data to MongoDB. localStorage is device-local and clears.
- **`dimensions` can be null** — older sessions don't have it. Always null-check before rendering skill matrix.

---

## CONTEXT FOR CLAUDE CODE SESSIONS

When starting a Claude Code session, tell it:
1. Read this file first
2. Check `app/api/[[...path]]/route.js` for the catch-all API pattern
3. Check `app/deck/page.js` for the main voice simulation logic
4. Never touch Paddle-related code
5. Always update this file after completing a task

---

## HOW TO UPDATE THIS FILE

After every sprint task, update:
- Sprint status table
- Known issues list (remove fixed, add new)
- Any new API endpoints
- Any schema changes
- Any new environment variables

Keep it under 200 lines of actual content. Remove resolved issues. This file is a living document.
