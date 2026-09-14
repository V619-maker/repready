import { auth, currentUser } from '@clerk/nextjs/server'

// Resolves the requester's email from the Clerk session only — never from a
// query param or request body. Returns null if there is no authenticated session.
export async function getAuthedEmail() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  return user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null
}

// Reads role/plan/persona-selection from Clerk publicMetadata. Defaults are
// deliberately non-restrictive: no user currently has these fields set, so
// until they're set manually (or via a future billing webhook), everyone
// keeps exactly the access they have today — role defaults to 'rep' (the
// least-privileged, so nobody accidentally sees another rep's data), but
// planTier defaults to null, which means "unrestricted" (all 4 personas
// unlocked) rather than defaulting to the most restrictive tier. This
// avoids silently downgrading access for anyone until billing is actually
// wired up to set a real tier per user.
export async function getAuthedUser() {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null
  const meta = user?.publicMetadata || {}
  return {
    userId,
    email,
    role: meta.role === 'manager' ? 'manager' : 'rep',
    planTier: meta.planTier || null,
    selectedPersonas: Array.isArray(meta.selectedPersonas) ? meta.selectedPersonas : []
  }
}
