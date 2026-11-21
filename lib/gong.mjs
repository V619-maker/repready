// Gong import: a rep picks one of their own recent Gong calls and RepReady pulls the
// transcript into the existing real-call analysis. The network function is injected
// (fetchImpl) so everything is unit-testable with fake responses.
// Confirmed from Gong/partner docs: Basic auth (access key + secret), POST
// /v2/calls/transcript with { filter: { callIds } }, 3 req/s and 10,000 req/day limits.
// NOT confirmed (Gong's reference needs a login; written from partial sources, never
// run against a real Gong account): GET /v2/users paging and field names, and the
// POST /v2/calls/extensive request/response shapes (primaryUserIds filter, parties).
// Gong credentials are workspace-wide (no user-level OAuth), so "own calls only" is
// enforced HERE by matching the call's primary user / participants to the rep's email.

export const GONG_DEFAULT_BASE = 'https://api.gong.io'
export const GONG_MAX_TRANSCRIPT_CHARS = 30000
export const GONG_LOOKBACK_DAYS = 30
export const GONG_USER_CACHE_TTL_MS = 5 * 60 * 1000
const HOST_RE = /^([a-z0-9-]+\.)?api\.gong\.io$/

export function parseGongCreds(input) {
  const accessKey = String(input?.accessKey || '').trim()
  const accessSecret = String(input?.accessSecret || '').trim()
  if (accessKey.length < 8 || accessKey.length > 200 || accessSecret.length < 8 || accessSecret.length > 500) {
    return { ok: false, error: 'Enter the Access Key and Access Key Secret from Gong (Settings, Ecosystem, API).' }
  }
  const raw = String(input?.baseUrl || '').trim() || GONG_DEFAULT_BASE
  let u
  try { u = new URL(raw) } catch { return { ok: false, error: 'The Gong API address must look like https://api.gong.io or https://company-17.api.gong.io' } }
  const host = u.hostname.toLowerCase()
  if (u.protocol !== 'https:' || !HOST_RE.test(host) || u.port || u.username || u.password) {
    return { ok: false, error: 'The Gong API address must be an https address ending in api.gong.io' }
  }
  return { ok: true, creds: { baseUrl: `https://${host}`, accessKey, accessSecret } }
}
export const maskGong = (c) => `${new URL(c.baseUrl).hostname} · key …${c.accessKey.slice(-4)}`
export const isValidGongCallId = (id) => typeof id === 'string' && /^\d{1,25}$/.test(id)

async function call(fetchImpl, creds, path, { method = 'GET', body } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetchImpl(`${creds.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${creds.accessKey}:${creds.accessSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      redirect: 'manual',
    })
    let json = null
    try { json = await res.json() } catch { /* empty body */ }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, json }
  } catch (e) {
    return { ok: false, status: 0, json: null, error: e?.name === 'AbortError' ? 'timeout' : 'network' }
  } finally { clearTimeout(timer) }
}

function explain(r, what) {
  if (r.status === 401) return `Gong rejected the keys (${what}). Check they were copied in full.`
  if (r.status === 403) return `The Gong keys are missing a permission for ${what}.`
  if (r.status === 404) return r.json?.errors ? 'Gong has no matching records.' : `Gong could not find that (${what}).`
  if (r.status === 429) return 'Gong is rate-limiting us (3 requests per second). Try again in a moment.'
  if (r.error === 'timeout') return 'Gong took too long to answer.'
  return `Gong request failed (${what}, ${r.status || r.error || 'error'}).`
}

export async function verifyGong(fetchImpl, creds) {
  const r = await call(fetchImpl, creds, '/v2/users')
  return r.ok ? { ok: true } : { ok: false, error: explain(r, 'reading users (needs api:users:read)') }
}

const userCache = new Map()
export function forgetGongUsers(prefix = '') {
  for (const k of [...userCache.keys()]) if (k.startsWith(prefix)) userCache.delete(k)
}

// Finds the rep's Gong user id by exact (case-insensitive) email. Up to 10 pages of users.
export async function findGongUserId(fetchImpl, creds, email, cacheKey = '', now = Date.now()) {
  const want = String(email || '').trim().toLowerCase()
  if (!want) return { ok: true, userId: null }
  const key = `${cacheKey}|${want}`
  const hit = userCache.get(key)
  if (hit && hit.expires > now) return { ok: true, userId: hit.userId, cached: true }
  let cursor = null
  for (let page = 0; page < 10; page++) {
    const r = await call(fetchImpl, creds, `/v2/users${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`)
    if (!r.ok) return { ok: false, error: explain(r, 'reading users (needs api:users:read)') }
    const u = (r.json?.users || []).find((x) => String(x.emailAddress || '').toLowerCase() === want)
    if (u) {
      userCache.set(key, { userId: String(u.id), expires: now + GONG_USER_CACHE_TTL_MS })
      return { ok: true, userId: String(u.id) }
    }
    cursor = r.json?.records?.cursor || null
    if (!cursor) break
  }
  return { ok: true, userId: null }
}

function normalizeCall(c) {
  const m = c?.metaData || {}
  return {
    id: String(m.id),
    title: String(m.title || 'Untitled call').slice(0, 150),
    started: m.started ? String(m.started) : null,
    durationSeconds: Number.isFinite(Number(m.duration)) ? Number(m.duration) : null,
    primaryUserId: m.primaryUserId != null ? String(m.primaryUserId) : null,
    parties: (c?.parties || []).map((p) => ({
      speakerId: p.speakerId != null ? String(p.speakerId) : null,
      name: p.name || null,
      email: p.emailAddress ? String(p.emailAddress).toLowerCase() : null,
      affiliation: p.affiliation || null,
    })),
  }
}

const iso = (ms) => new Date(ms).toISOString()

export async function listGongCalls(fetchImpl, creds, userId, now = Date.now(), limit = 20) {
  if (!userId) return { ok: true, calls: [] }
  const r = await call(fetchImpl, creds, '/v2/calls/extensive', {
    method: 'POST',
    body: {
      filter: { fromDateTime: iso(now - GONG_LOOKBACK_DAYS * 86400000), toDateTime: iso(now), primaryUserIds: [String(userId)] },
      contentSelector: { exposedFields: { parties: true } },
    },
  })
  if (r.status === 404) return { ok: true, calls: [] } // Gong answers 404 when nothing matches
  if (!r.ok) return { ok: false, error: explain(r, 'reading calls (needs api:calls:read:basic and api:calls:read:extensive)') }
  const calls = (r.json?.calls || []).map(normalizeCall)
    .filter((c) => isValidGongCallId(c.id) && c.primaryUserId === String(userId))
    .sort((a, b) => String(b.started).localeCompare(String(a.started)))
    .slice(0, limit)
  return { ok: true, calls }
}

// Look one call up by id (for the ownership check at import time).
export async function getGongCall(fetchImpl, creds, callId) {
  if (!isValidGongCallId(callId)) return { ok: false, error: 'Invalid call.' }
  const r = await call(fetchImpl, creds, '/v2/calls/extensive', {
    method: 'POST',
    body: { filter: { callIds: [callId] }, contentSelector: { exposedFields: { parties: true } } },
  })
  if (r.status === 404) return { ok: true, call: null }
  if (!r.ok) return { ok: false, error: explain(r, 'reading the call') }
  const c = (r.json?.calls || []).map(normalizeCall).find((x) => x.id === callId)
  return { ok: true, call: c || null }
}

export const isRepsCall = (call, userId, email) =>
  !!call && ((userId && call.primaryUserId === String(userId)) ||
    (!!email && call.parties.some((p) => p.email && p.email === String(email).toLowerCase())))

export async function getGongTranscript(fetchImpl, creds, callId, startedIso) {
  if (!isValidGongCallId(callId)) return { ok: false, error: 'Invalid call.' }
  const t0 = Date.parse(startedIso || '')
  const filter = { callIds: [callId] }
  if (Number.isFinite(t0)) { filter.fromDateTime = iso(t0 - 86400000); filter.toDateTime = iso(t0 + 86400000) }
  const r = await call(fetchImpl, creds, '/v2/calls/transcript', { method: 'POST', body: { filter } })
  if (r.status === 404) return { ok: true, transcript: null }
  if (!r.ok) return { ok: false, error: explain(r, 'reading the transcript (needs api:calls:read:transcript)') }
  const t = (r.json?.callTranscripts || []).find((x) => String(x.callId) === callId)
  return { ok: true, transcript: t?.transcript || null }
}

// Gong monologues -> "Name: text" lines the existing paste-transcript path understands.
// Labels must match /^[A-Za-z][A-Za-z0-9 ._-]{0,40}$/ and be unique; consecutive turns
// by one speaker are merged; text is flattened to one line (the paste parser is line based).
export function buildLabeledLines(parties, monologues) {
  const nameBySpeaker = new Map()
  for (const p of parties || []) if (p.speakerId && p.name) nameBySpeaker.set(String(p.speakerId), p.name)
  const labelBySpeaker = new Map()
  const used = new Set()
  let anon = 0
  const labelFor = (speakerId) => {
    const sid = String(speakerId)
    if (labelBySpeaker.has(sid)) return labelBySpeaker.get(sid)
    let base = String(nameBySpeaker.get(sid) || '').replace(/[^A-Za-z0-9 ._-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 36)
    if (!/^[A-Za-z]/.test(base)) base = `Speaker ${++anon}`
    let label = base, i = 2
    while (used.has(label.toLowerCase())) label = `${base} ${i++}`
    used.add(label.toLowerCase())
    labelBySpeaker.set(sid, label)
    return label
  }
  const lines = []
  for (const m of monologues || []) {
    const text = (m.sentences || []).map((s) => String(s.text || '').trim()).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
    if (!text || m.speakerId == null) continue
    const label = labelFor(m.speakerId)
    const last = lines[lines.length - 1]
    if (last && last.label === label) last.text += ` ${text}`
    else lines.push({ label, text })
  }
  const labels = [...new Set(lines.map((l) => l.label))]
  const chars = lines.reduce((n, l) => n + l.label.length + l.text.length + 3, 0)
  return { lines, labels, chars, labelBySpeaker: Object.fromEntries(labelBySpeaker) }
}
