// Tenancy resolution boundary.
//
// RepReady's current production tenancy model is email-domain based. This
// helper intentionally preserves the existing split('@')[1] semantics exactly
// rather than normalizing historical org IDs. A future organizations/memberships
// migration can replace the resolver behind this boundary additively.
export function deriveLegacyOrgId(email) {
  if (typeof email !== 'string') return null
  return email.split('@')[1] || null
}

// ---------------------------------------------------------------------------
// Private workspaces (used by product documents; NOT used for sessions/criteria)
//
// deriveLegacyOrgId() above treats every @gmail.com user as one "organization",
// which is harmless for scores but NOT safe for confidential product documents:
// one Gmail user would see another Gmail user's uploads. Product documents
// therefore use this stricter id instead. Historical sessions and criteria keep
// the legacy id untouched (no migration).
//
// - Company email  (rep@acme.com)  -> "acme.com"        (shared by that company)
// - Free email     (x@gmail.com)   -> "personal:<userId>" (private to that one user)
// ---------------------------------------------------------------------------
export const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'yahoo.in', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com',
  'outlook.com', 'outlook.in', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'proton.me', 'protonmail.com', 'pm.me',
  'rediffmail.com', 'gmx.com', 'mail.com', 'zoho.com', 'yandex.com',
])

export function isFreeEmailDomain(domain) {
  return typeof domain === 'string' && FREE_EMAIL_DOMAINS.has(domain.toLowerCase())
}

// Returns null when no safe workspace can be determined (the caller must then
// refuse the request, never fall back to a shared workspace).
export function deriveWorkspaceId(email, userId) {
  if (typeof email !== 'string') return null
  const domain = (email.split('@')[1] || '').trim().toLowerCase()
  if (!domain) return null
  if (isFreeEmailDomain(domain)) {
    if (typeof userId !== 'string' || !userId) return null
    return `personal:${userId}`
  }
  return domain
}

export function isPersonalWorkspace(workspaceId) {
  return typeof workspaceId === 'string' && workspaceId.startsWith('personal:')
}
