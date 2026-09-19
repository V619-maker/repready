// Tenancy resolution boundary.
//
// RepReady's current production tenancy model is email-domain based. Keeping
// that behavior behind one deterministic helper lets request paths stop
// re-deriving organization identity independently, without changing any
// customer's current org assignment. A future organizations/memberships
// migration can replace the resolver behind this boundary additively.
export function deriveLegacyOrgId(email) {
  if (typeof email !== 'string') return null
  const normalizedEmail = email.trim().toLowerCase()
  const atIndex = normalizedEmail.lastIndexOf('@')
  if (atIndex <= 0 || atIndex === normalizedEmail.length - 1) return null
  const domain = normalizedEmail.slice(atIndex + 1)
  return domain || null
}
