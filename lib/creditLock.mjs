// Per-user short lock used to serialize credit deductions (Known Issue 0e).
//
// Credits live in Clerk privateMetadata, which has no atomic "decrement". Two
// requests at the same moment could both read balance 1 and both succeed. This
// lock makes the read-check-write sequence run one request at a time per user,
// across every serverless instance, using a MongoDB document as the lock.
//
// Lock = one document with _id "credit:<userId>". Creating it fails (duplicate
// key) if someone else holds it. It expires on its own so a crashed request can
// never lock a user out for good.

export const CREDIT_LOCK_TTL_MS = 8000
export const CREDIT_LOCK_TRIES = 12
export const CREDIT_LOCK_WAIT_MS = 250

const lockId = (userId) => `credit:${userId}`
const isDuplicateKey = (err) => !!err && (err.code === 11000 || /E11000/.test(String(err.message || '')))

// Returns a token string when the lock is held, or null if it could not be taken
// in time. Throws on database errors other than "already locked".
export async function acquireCreditLock(col, userId, {
  now = () => Date.now(),
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  tries = CREDIT_LOCK_TRIES,
  waitMs = CREDIT_LOCK_WAIT_MS,
  ttlMs = CREDIT_LOCK_TTL_MS,
  makeToken = () => Math.random().toString(36).slice(2) + now().toString(36),
} = {}) {
  if (typeof userId !== 'string' || !userId) return null
  for (let i = 0; i < tries; i++) {
    const token = makeToken()
    const expiresAt = now() + ttlMs
    try {
      await col.insertOne({ _id: lockId(userId), token, expiresAt })
      return token
    } catch (err) {
      if (!isDuplicateKey(err)) throw err
      // Someone holds it. Take it over only if it has expired (claim-once: the
      // filter matches a single expired lock, so only one caller can win).
      const taken = await col.findOneAndUpdate(
        { _id: lockId(userId), expiresAt: { $lt: now() } },
        { $set: { token, expiresAt } },
      )
      if (taken) return token
    }
    if (i < tries - 1) await sleep(waitMs)
  }
  return null
}

// Releases the lock only if we still own it (a different token means it expired
// and someone else now holds it, so we must not delete theirs).
export async function releaseCreditLock(col, userId, token) {
  try {
    await col.deleteOne({ _id: lockId(userId), token })
  } catch {
    // Best effort: the lock expires by itself.
  }
}
