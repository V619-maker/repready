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
