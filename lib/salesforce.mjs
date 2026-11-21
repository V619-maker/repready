// Salesforce adapter. Login uses the OAuth 2.0 client-credentials flow against the
// customer's own My Domain with a customer-created External Client App (or
// Connected App); no app is hosted by RepReady. Salesforce calls a deal an
// "Opportunity". Request shapes follow Salesforce's public docs and have NOT been
// run against a live org from the build sandbox.
// IMPORTANT trade-off: the token acts as the app's "Run As" user, so Salesforce
// itself does not limit what we can read to the signed-in rep. RepReady enforces
// "own deals only" by filtering on Owner.Email; that filter is ours, not Salesforce's.

const API_VERSION = 'v61.0'
const HOST_SUFFIX = '.my.salesforce.com'

export function parseSalesforceCreds(input) {
  let u
  try { u = new URL(String(input?.domain || '').trim()) } catch { return { ok: false, error: 'Enter your My Domain address, like https://yourcompany.my.salesforce.com' } }
  const host = u.hostname.toLowerCase()
  if (u.protocol !== 'https:' || !host.endsWith(HOST_SUFFIX) || host === HOST_SUFFIX.slice(1) || u.port || u.username || u.password) {
    return { ok: false, error: 'The address must be your https My Domain, ending in .my.salesforce.com' }
  }
  const clientId = String(input?.clientId || '').trim()
  const clientSecret = String(input?.clientSecret || '').trim()
  if (clientId.length < 10 || clientId.length > 300 || clientSecret.length < 10 || clientSecret.length > 300) {
    return { ok: false, error: 'Enter the Consumer Key and Consumer Secret of your Salesforce app.' }
  }
  return { ok: true, creds: { domain: `https://${host}`, clientId, clientSecret } }
}
export const maskSalesforce = (c) => `${new URL(c.domain).hostname} · key …${c.clientId.slice(-4)}`

const isSfId = (id) => typeof id === 'string' && /^[a-zA-Z0-9]{15,18}$/.test(id)
export const isValidSalesforceDealId = isSfId
const soqlString = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
const EMAIL_RE = /^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]+$/

async function call(fetchImpl, url, opts = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetchImpl(url, { ...opts, signal: controller.signal, redirect: 'manual' })
    let json = null
    try { json = await res.json() } catch { /* empty body */ }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, json }
  } catch (e) {
    return { ok: false, status: 0, json: null, error: e?.name === 'AbortError' ? 'timeout' : 'network' }
  } finally { clearTimeout(timer) }
}

function explain(r, what) {
  if (r.status === 401) return `Salesforce rejected the access (${what}). The session may have expired; try again.`
  if (r.status === 403) return `The Salesforce Run As user lacks permission for ${what}.`
  if (r.status === 429) return 'Salesforce is rate-limiting us. Try again in a minute.'
  if (r.error === 'timeout') return 'Salesforce took too long to answer.'
  return `Salesforce request failed (${what}, ${r.status || r.error || 'error'}).`
}

// Returns { ok, ctx: { base, token } } or { ok: false, error }.
export async function openSalesforce(fetchImpl, creds) {
  const r = await call(fetchImpl, `${creds.domain}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: creds.clientId, client_secret: creds.clientSecret }).toString(),
  })
  if (!r.ok || !r.json?.access_token || !r.json?.instance_url) {
    const why = r.json?.error === 'invalid_client' || r.json?.error === 'invalid_grant' || r.status === 400
      ? 'Salesforce rejected the Consumer Key/Secret, or the app has no Run As user set, or the client credentials flow is not enabled on it.'
      : explain(r, 'signing in')
    return { ok: false, error: why }
  }
  let base
  try {
    const u = new URL(r.json.instance_url)
    if (u.protocol !== 'https:' || !u.hostname.toLowerCase().endsWith(HOST_SUFFIX)) throw new Error('bad host')
    base = u.origin
  } catch { return { ok: false, error: 'Salesforce returned an unexpected server address.' } }
  return { ok: true, ctx: { base, token: r.json.access_token } }
}

async function query(fetchImpl, ctx, soql) {
  return call(fetchImpl, `${ctx.base}/services/data/${API_VERSION}/query?q=${encodeURIComponent(soql)}`, {
    headers: { Authorization: `Bearer ${ctx.token}` },
  })
}

export async function verifySalesforce(fetchImpl, creds) {
  const o = await openSalesforce(fetchImpl, creds)
  if (!o.ok) return o
  const r = await query(fetchImpl, o.ctx, 'SELECT Id FROM Opportunity LIMIT 1')
  return r.ok ? { ok: true } : { ok: false, error: explain(r, 'reading Opportunities') }
}

// Salesforce has no separate user-id step: the rep is identified by their exact email.
export async function findSalesforceOwner(_fetchImpl, _ctx, email) {
  const e = String(email || '').trim().toLowerCase()
  return EMAIL_RE.test(e) ? { ok: true, ownerId: e } : { ok: true, ownerId: null }
}

const FIELDS = 'Id, Name, Amount, StageName, CloseDate, Description, IsClosed, OwnerId, Owner.Email, Account.Name'

function normalize(o) {
  return {
    id: String(o.Id),
    name: o.Name || 'Untitled deal',
    amount: o.Amount != null ? Number(o.Amount) : null,
    stage: o.StageName || null,
    closeDate: o.CloseDate ? String(o.CloseDate).slice(0, 10) : null,
    ownerId: o.Owner?.Email ? String(o.Owner.Email).toLowerCase() : null,
    ownerSalesforceId: o.OwnerId || null,
    company: o.Account?.Name || null,
    description: o.Description || '',
    closed: o.IsClosed === true,
  }
}

export async function listSalesforceDeals(fetchImpl, ctx, ownerEmail, limit = 25) {
  if (!EMAIL_RE.test(String(ownerEmail))) return { ok: true, deals: [] }
  const soql = `SELECT ${FIELDS} FROM Opportunity WHERE Owner.Email = ${soqlString(ownerEmail)} AND IsClosed = false ORDER BY LastModifiedDate DESC LIMIT ${Math.min(100, Math.max(1, limit))}`
  const r = await query(fetchImpl, ctx, soql)
  if (!r.ok) return { ok: false, error: explain(r, 'reading Opportunities') }
  return { ok: true, deals: (r.json?.records || []).map(normalize).filter((d) => !d.closed) }
}

export async function getSalesforceDeal(fetchImpl, ctx, dealId) {
  if (!isSfId(dealId)) return { ok: false, error: 'Invalid deal.' }
  const r = await query(fetchImpl, ctx, `SELECT ${FIELDS} FROM Opportunity WHERE Id = ${soqlString(dealId)} LIMIT 1`)
  if (!r.ok) return { ok: false, error: explain(r, 'reading the Opportunity') }
  const rec = (r.json?.records || [])[0]
  return { ok: true, deal: rec ? normalize(rec) : null }
}

// The practice result is logged as a completed Task related to the Opportunity.
export async function createSalesforceNote(fetchImpl, ctx, dealId, noteText, ownerSalesforceId, now = new Date()) {
  if (!isSfId(dealId)) return { ok: false, error: 'Invalid deal.' }
  const body = {
    Subject: 'RepReady practice call',
    Description: String(noteText).slice(0, 30000),
    Status: 'Completed',
    WhatId: dealId,
    ActivityDate: now.toISOString().slice(0, 10),
  }
  if (isSfId(ownerSalesforceId)) body.OwnerId = ownerSalesforceId
  const r = await call(fetchImpl, `${ctx.base}/services/data/${API_VERSION}/sobjects/Task`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ctx.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.ok ? { ok: true, noteId: r.json?.id || null } : { ok: false, error: explain(r, 'writing an activity') }
}
