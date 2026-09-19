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
