// One interface over the three supported CRMs (HubSpot, Salesforce, Zoho) so the
// routes and dashboard do not care which one a workspace uses. Each adapter takes
// an injected fetchImpl. Ownership rule (enforced by RepReady, in the routes): a rep
// only ever sees or writes to deals whose owner matches their own sign-in email.
import * as hs from './hubspot.mjs'
import * as sf from './salesforce.mjs'
import * as zo from './zoho.mjs'
export { buildDealContext, NO_DEAL_CONTEXT, DEAL_CONTEXT_MAX_CHARS } from './hubspot.mjs'

const stripTags = (h) => String(h).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
export function buildPracticeNoteText(session, personaName) {
  return stripTags(hs.buildPracticeNoteHtml(session, personaName)).slice(0, 30000)
}
export const buildPracticeNoteHtml = hs.buildPracticeNoteHtml

const hubspot = {
  id: 'hubspot',
  label: 'HubSpot',
  isValidDealId: hs.isValidDealId,
  parseCreds(input) {
    const token = typeof input?.token === 'string' ? input.token.trim() : ''
    return hs.isValidHubspotToken(token)
      ? { ok: true, creds: { token } }
      : { ok: false, error: 'That does not look like a HubSpot private app token (it starts with pat-).' }
  },
  mask: (c) => hs.maskToken(c.token),
  async open(_f, creds) { return { ok: true, ctx: { token: creds.token } } },
  verify: (f, creds) => hs.verifyToken(f, creds.token),
  findOwner: (f, ctx, email) => hs.findOwnerIdByEmail(f, ctx.token, email),
  listDeals: (f, ctx, ownerId, n) => hs.listOwnedDeals(f, ctx.token, ownerId, n),
  getDeal: (f, ctx, id) => hs.getDeal(f, ctx.token, id),
  stageLabels: (f, ctx) => hs.getStageLabels(f, ctx.token),
  createNote: (f, ctx, deal, session, persona, ownerId) =>
    hs.createDealNote(f, ctx.token, deal.id, hs.buildPracticeNoteHtml(session, persona), ownerId),
}

const salesforce = {
  id: 'salesforce',
  label: 'Salesforce',
  isValidDealId: sf.isValidSalesforceDealId,
  parseCreds: sf.parseSalesforceCreds,
  mask: sf.maskSalesforce,
  open: sf.openSalesforce,
  verify: sf.verifySalesforce,
  findOwner: sf.findSalesforceOwner,
  listDeals: sf.listSalesforceDeals,
  getDeal: sf.getSalesforceDeal,
  async stageLabels() { return {} },
  createNote: (f, ctx, deal, session, persona) =>
    sf.createSalesforceNote(f, ctx, deal.id, buildPracticeNoteText(session, persona), deal.ownerSalesforceId),
}

const zoho = {
  id: 'zoho',
  label: 'Zoho CRM',
  isValidDealId: zo.isValidZohoDealId,
  parseCreds: zo.parseZohoCreds,
  mask: zo.maskZoho,
  open: zo.openZoho,
  verify: zo.verifyZoho,
  findOwner: zo.findZohoOwner,
  listDeals: zo.listZohoDeals,
  getDeal: zo.getZohoDeal,
  async stageLabels() { return {} },
  createNote: (f, ctx, deal, session, persona) => zo.createZohoNote(f, ctx, deal.id, buildPracticeNoteText(session, persona)),
}

export const CRM_PROVIDERS = { hubspot, salesforce, zoho }
export const getCrmAdapter = (id) => (Object.prototype.hasOwnProperty.call(CRM_PROVIDERS, id) ? CRM_PROVIDERS[id] : null)

// ---- Short-lived session cache -------------------------------------------------
// Each rep request used to sign in to the CRM and look up the rep before doing the
// real work (2-3 round trips). We keep the sign-in + rep lookup in memory for a few
// minutes per workspace/credentials/rep. Memory only (never stored); a changed
// credential misses the cache; failures are never cached; any CRM error drops the
// workspace's entries so the next request signs in fresh. Serverless instances come
// and go, so this helps on busy instances and is harmless on cold ones.
import { createHash } from 'node:crypto'
export const CRM_SESSION_TTL_MS = 5 * 60 * 1000
const CRM_CACHE_MAX = 200
const sessionCache = new Map()

export function forgetCrmSession(workspaceId) {
  const prefix = `${workspaceId}|`
  for (const k of [...sessionCache.keys()]) if (k.startsWith(prefix)) sessionCache.delete(k)
}

export async function openCrmSession(adapter, fetchImpl, creds, workspaceId, email, now = Date.now()) {
  const credHash = createHash('sha256').update(JSON.stringify(creds)).digest('hex').slice(0, 16)
  const key = `${workspaceId}|${adapter.id}|${credHash}|${String(email).toLowerCase()}`
  const hit = sessionCache.get(key)
  if (hit && hit.expires > now) return { ok: true, ctx: hit.ctx, ownerId: hit.ownerId, cached: true }
  sessionCache.delete(key)
  const opened = await adapter.open(fetchImpl, creds)
  if (!opened.ok) return { ok: false, error: opened.error }
  const owner = await adapter.findOwner(fetchImpl, opened.ctx, email)
  if (!owner.ok) return { ok: false, error: owner.error }
  if (owner.ownerId) { // an unmatched rep is not cached, so a newly added CRM user is found at once
    if (sessionCache.size >= CRM_CACHE_MAX) sessionCache.delete(sessionCache.keys().next().value)
    sessionCache.set(key, { ctx: opened.ctx, ownerId: owner.ownerId, expires: now + CRM_SESSION_TTL_MS })
  }
  return { ok: true, ctx: opened.ctx, ownerId: owner.ownerId, cached: false }
}
