// Zoho CRM adapter. Login uses Zoho's client-credentials flow with a customer-created
// client (client id + secret + organisation id) in the customer's own data centre. Note:
// Zoho's own guidance calls this flow simple and recommends Self Client or server-based
// authorization for long-lived integrations; revisit if it proves unreliable. Request
// shapes follow Zoho's public docs and have NOT been run against a live org from the
// build sandbox; the deal-list/users shapes in particular are as I understand v6.

const API = 'crm/v6'
const SCOPES = 'ZohoCRM.modules.deals.READ,ZohoCRM.users.READ,ZohoCRM.modules.notes.CREATE'
export const ZOHO_DATA_CENTERS = {
  com: 'https://accounts.zoho.com',
  in: 'https://accounts.zoho.in',
  eu: 'https://accounts.zoho.eu',
  'com.au': 'https://accounts.zoho.com.au',
  jp: 'https://accounts.zoho.jp',
}
const API_DOMAIN_RE = /^https:\/\/www\.zohoapis\.(com|in|eu|com\.au|jp)$/

export function parseZohoCreds(input) {
  const dc = String(input?.dc || '').trim()
  if (!Object.prototype.hasOwnProperty.call(ZOHO_DATA_CENTERS, dc)) return { ok: false, error: 'Choose the data centre your Zoho account is in (India accounts use .in).' }
  const clientId = String(input?.clientId || '').trim()
  const clientSecret = String(input?.clientSecret || '').trim()
  const orgId = String(input?.orgId || '').trim()
  if (clientId.length < 10 || clientId.length > 200 || clientSecret.length < 10 || clientSecret.length > 200) {
    return { ok: false, error: 'Enter the Client ID and Client Secret from your Zoho client.' }
  }
  if (!/^\d{4,30}$/.test(orgId)) return { ok: false, error: 'Enter your Zoho CRM organisation ID (digits only).' }
  return { ok: true, creds: { dc, clientId, clientSecret, orgId } }
}
export const maskZoho = (c) => `zoho.${c.dc} · client …${c.clientId.slice(-4)}`

export const isValidZohoDealId = (id) => typeof id === 'string' && /^\d{5,25}$/.test(id)

async function call(fetchImpl, url, opts = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetchImpl(url, { ...opts, signal: controller.signal, redirect: 'manual' })
    let json = null
    try { json = await res.json() } catch { /* 204 / empty body */ }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, json }
  } catch (e) {
    return { ok: false, status: 0, json: null, error: e?.name === 'AbortError' ? 'timeout' : 'network' }
  } finally { clearTimeout(timer) }
}

function explain(r, what) {
  if (r.status === 401) return `Zoho rejected the access (${what}). Try again.`
  if (r.status === 403) return `The Zoho client is missing a permission for ${what}.`
  if (r.status === 429) return 'Zoho is rate-limiting us. Try again in a minute.'
  if (r.error === 'timeout') return 'Zoho took too long to answer.'
  return `Zoho request failed (${what}, ${r.status || r.error || 'error'}).`
}

export async function openZoho(fetchImpl, creds) {
  const r = await call(fetchImpl, `${ZOHO_DATA_CENTERS[creds.dc]}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.clientId, client_secret: creds.clientSecret, grant_type: 'client_credentials',
      scope: SCOPES, soid: `ZohoCRM.${creds.orgId}`,
    }).toString(),
  })
  if (!r.ok || !r.json?.access_token) {
    return { ok: false, error: r.json?.error ? 'Zoho rejected the Client ID, Secret, organisation ID or data centre.' : explain(r, 'signing in') }
  }
  const apiDomain = String(r.json.api_domain || '')
  if (!API_DOMAIN_RE.test(apiDomain)) return { ok: false, error: 'Zoho returned an unexpected server address.' }
  return { ok: true, ctx: { base: apiDomain, token: r.json.access_token } }
}

const get = (fetchImpl, ctx, path) => call(fetchImpl, `${ctx.base}/${API}${path}`, { headers: { Authorization: `Zoho-oauthtoken ${ctx.token}` } })

export async function verifyZoho(fetchImpl, creds) {
  const o = await openZoho(fetchImpl, creds)
  if (!o.ok) return o
  const r = await get(fetchImpl, o.ctx, '/users?type=ActiveUsers')
  return r.ok ? { ok: true } : { ok: false, error: explain(r, 'reading users (needs ZohoCRM.users.READ)') }
}

export async function findZohoOwner(fetchImpl, ctx, email) {
  const r = await get(fetchImpl, ctx, '/users?type=ActiveUsers')
  if (!r.ok) return { ok: false, error: explain(r, 'finding you in Zoho') }
  const u = (r.json?.users || []).find((x) => String(x.email || '').toLowerCase() === String(email).toLowerCase())
  return { ok: true, ownerId: u ? String(u.id) : null }
}

const FIELDS = 'Deal_Name,Amount,Stage,Closing_Date,Description,Owner,Account_Name'

function normalize(d) {
  return {
    id: String(d.id),
    name: d.Deal_Name || 'Untitled deal',
    amount: d.Amount != null && d.Amount !== '' ? Number(d.Amount) : null,
    stage: d.Stage || null,
    closeDate: d.Closing_Date ? String(d.Closing_Date).slice(0, 10) : null,
    ownerId: d.Owner?.id != null ? String(d.Owner.id) : null,
    company: d.Account_Name?.name || null,
    description: d.Description || '',
    closed: /^closed/i.test(String(d.Stage || '')),
  }
}

export async function listZohoDeals(fetchImpl, ctx, ownerId, limit = 25) {
  // Newest-modified 200 deals, filtered to the rep's own here (not by Zoho).
  const r = await get(fetchImpl, ctx, `/Deals?fields=${FIELDS}&sort_by=Modified_Time&sort_order=desc&per_page=200`)
  if (r.status === 204) return { ok: true, deals: [] }
  if (!r.ok) return { ok: false, error: explain(r, 'reading deals (needs ZohoCRM.modules.deals.READ)') }
  const deals = (r.json?.data || []).map(normalize).filter((d) => d.ownerId === String(ownerId) && !d.closed).slice(0, limit)
  return { ok: true, deals }
}

export async function getZohoDeal(fetchImpl, ctx, dealId) {
  if (!isValidZohoDealId(dealId)) return { ok: false, error: 'Invalid deal.' }
  const r = await get(fetchImpl, ctx, `/Deals/${dealId}?fields=${FIELDS}`)
  if (r.status === 204 || r.status === 404) return { ok: true, deal: null }
  if (!r.ok) return { ok: false, error: explain(r, 'reading the deal') }
  const rec = (r.json?.data || [])[0]
  return { ok: true, deal: rec ? normalize(rec) : null }
}

export async function createZohoNote(fetchImpl, ctx, dealId, noteText) {
  if (!isValidZohoDealId(dealId)) return { ok: false, error: 'Invalid deal.' }
  const r = await call(fetchImpl, `${ctx.base}/${API}/Deals/${dealId}/Notes`, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${ctx.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [{ Note_Title: 'RepReady practice call', Note_Content: String(noteText).slice(0, 30000) }] }),
  })
  const first = r.json?.data?.[0]
  if (r.ok && first?.code === 'SUCCESS') return { ok: true, noteId: first.details?.id || null }
  return { ok: false, error: r.ok ? 'Zoho did not accept the note.' : explain(r, 'writing a note (needs ZohoCRM.modules.notes.CREATE)') }
}
