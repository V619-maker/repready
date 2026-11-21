// Pure helpers for outgoing notifications (Slack, Microsoft Teams, generic
// webhook). No network and no database here, so every rule can be unit-tested.
// The API route does the actual sending; see notifyIntegrations().
import { createHmac, randomBytes } from 'node:crypto'

const TEAMS_HOST_SUFFIXES = ['.webhook.office.com', '.logic.azure.com', '.powerplatform.com']

function parseHttps(url) {
  let u
  try { u = new URL(String(url).trim()) } catch { return null }
  if (u.protocol !== 'https:') return null
  if (u.username || u.password) return null
  return u
}

// IPv4/IPv6 literals and well-known internal names are never allowed as targets.
export function isPrivateOrLocalAddress(addr) {
  const a = String(addr).toLowerCase().replace(/^\[|\]$/g, '')
  if (a === 'localhost' || a.endsWith('.localhost') || a.endsWith('.local') || a.endsWith('.internal')) return true
  const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  const v4 = (mapped ? mapped[1] : a).match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const [x, y] = [Number(v4[1]), Number(v4[2])]
    return (
      x === 0 || x === 10 || x === 127 ||
      (x === 100 && y >= 64 && y <= 127) ||
      (x === 169 && y === 254) ||
      (x === 172 && y >= 16 && y <= 31) ||
      (x === 192 && y === 168) ||
      (x === 192 && y === 0) ||
      (x === 198 && (y === 18 || y === 19)) ||
      x >= 224
    )
  }
  if (a.includes(':')) {
    return a === '::' || a === '::1' || a.startsWith('fc') || a.startsWith('fd') || a.startsWith('fe8') ||
      a.startsWith('fe9') || a.startsWith('fea') || a.startsWith('feb')
  }
  return false
}

// kind: 'slack' | 'teams' | 'webhook'. Returns { ok: true, url } or { ok: false, error }.
export function validateIntegrationUrl(kind, rawUrl) {
  const u = parseHttps(rawUrl)
  if (!u) return { ok: false, error: 'Enter a full https:// address.' }
  const host = u.hostname.toLowerCase()
  if (isPrivateOrLocalAddress(host) || /^[\d.]+$/.test(host) || host.includes(':')) {
    return { ok: false, error: 'That address is not allowed.' }
  }
  if (u.href.length > 2000) return { ok: false, error: 'That address is too long.' }
  if (kind === 'slack') {
    if (host !== 'hooks.slack.com') return { ok: false, error: 'A Slack webhook address starts with https://hooks.slack.com/.' }
  } else if (kind === 'teams') {
    if (!TEAMS_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
      return { ok: false, error: 'Use the address from a Teams Workflows (Power Automate) webhook.' }
    }
  } else if (kind !== 'webhook') {
    return { ok: false, error: 'Unknown integration.' }
  }
  return { ok: true, url: u.href }
}

export function maskUrl(url) {
  const u = parseHttps(url)
  if (!u) return null
  return `${u.hostname}/…${u.href.slice(-4)}`
}

export function generateWebhookSecret() {
  return randomBytes(24).toString('hex')
}

export function signBody(secret, body) {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
}

const PERSONA_NAMES = { richard: 'Richard', sandra: 'Sandra', priya: 'Priya', rakesh: 'Rakesh' }

export function buildSessionPayload(session) {
  const n = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : null)
  return {
    event: 'session.completed',
    sessionId: session.id,
    occurredAt: session.createdAt,
    rep: { email: session.userEmail },
    persona: session.persona || null,
    score: {
      overall: n(session.finalScore),
      grade: session.grade || null,
      procurement: n(session.procurementScore),
      enablement: n(session.enablementScore),
      qualificationStatus: session.qualificationStatus || null,
      dimensions: session.dimensions && typeof session.dimensions === 'object' ? session.dimensions : null,
    },
    verdict: String(session.verdict || '').slice(0, 300),
  }
}

export function buildTestPayload() {
  return buildSessionPayload({
    id: 'test-0000',
    createdAt: new Date().toISOString(),
    userEmail: 'sample.rep@example.com',
    persona: 'richard',
    finalScore: 72,
    grade: 'B',
    procurementScore: 70,
    enablementScore: 75,
    qualificationStatus: 'Developing',
    dimensions: null,
    verdict: 'This is a test message from RepReady. No real call happened.',
  })
}

function summaryLine(p) {
  const who = p.rep?.email || 'A rep'
  const buyer = PERSONA_NAMES[p.persona] || p.persona || 'a buyer'
  const score = p.score?.overall == null ? 'n/a' : p.score.overall
  const grade = p.score?.grade ? ` (${p.score.grade})` : ''
  const status = p.score?.qualificationStatus ? `. Status: ${p.score.qualificationStatus}` : ''
  return { who, buyer, score, grade, status }
}

const slackEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function formatSlack(p) {
  const { who, buyer, score, grade, status } = summaryLine(p)
  const verdict = p.verdict ? `\n_${slackEscape(p.verdict)}_` : ''
  return { text: `*Practice call finished.* ${slackEscape(who)} scored *${score}*${grade} against ${slackEscape(buyer)}${status}.${verdict}` }
}

export function formatTeams(p) {
  const { who, buyer, score, grade, status } = summaryLine(p)
  const lines = [`**Practice call finished.** ${who} scored **${score}**${grade} against ${buyer}${status}.`]
  if (p.verdict) lines.push(p.verdict)
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: lines.map((text) => ({ type: 'TextBlock', text, wrap: true })),
      },
    }],
  }
}

// CSV with spreadsheet-formula protection (cells starting with = + - @ are
// prefixed with an apostrophe so Excel/Sheets never run them as formulas).
export function toCsv(rows, columns) {
  const cell = (v) => {
    let s = v == null ? '' : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  return [columns.join(','), ...rows.map((r) => columns.map((c) => cell(r[c])).join(','))].join('\r\n') + '\r\n'
}
