import assert from 'node:assert/strict'
import { acquireCreditLock, releaseCreditLock } from './creditLock.mjs'

let passed = 0
const ok = async (name, fn) => { await fn(); passed++ }

// Minimal in-memory stand-in for a Mongo collection (unique _id, atomic ops).
function fakeCol() {
  const docs = new Map()
  return {
    docs,
    async insertOne(d) {
      if (docs.has(d._id)) { const e = new Error('E11000 duplicate key'); e.code = 11000; throw e }
      docs.set(d._id, { ...d })
    },
    async findOneAndUpdate(filter, update) {
      const d = docs.get(filter._id)
      if (!d) return null
      if (filter.expiresAt && !(d.expiresAt < filter.expiresAt.$lt)) return null
      Object.assign(d, update.$set)
      return { ...d }
    },
    async deleteOne(filter) {
      const d = docs.get(filter._id)
      if (d && (!filter.token || d.token === filter.token)) { docs.delete(filter._id); return { deletedCount: 1 } }
      return { deletedCount: 0 }
    },
  }
}
const noSleep = async () => {}

await ok('first caller gets the lock', async () => {
  const col = fakeCol()
  const t = await acquireCreditLock(col, 'u1', { sleep: noSleep })
  assert.ok(typeof t === 'string' && t.length > 0)
})
await ok('second caller cannot take a held lock and gives up', async () => {
  const col = fakeCol()
  await acquireCreditLock(col, 'u1', { sleep: noSleep })
  const t2 = await acquireCreditLock(col, 'u1', { sleep: noSleep, tries: 3 })
  assert.equal(t2, null)
})
await ok('different users do not block each other', async () => {
  const col = fakeCol()
  await acquireCreditLock(col, 'u1', { sleep: noSleep })
  assert.ok(await acquireCreditLock(col, 'u2', { sleep: noSleep }))
})
await ok('waiting caller gets the lock after release', async () => {
  const col = fakeCol()
  const t1 = await acquireCreditLock(col, 'u1', { sleep: noSleep })
  let slept = 0
  const sleep = async () => { slept++; if (slept === 2) await releaseCreditLock(col, 'u1', t1) }
  const t2 = await acquireCreditLock(col, 'u1', { sleep, tries: 5 })
  assert.ok(t2 && t2 !== t1)
})
await ok('an expired lock is taken over', async () => {
  const col = fakeCol()
  let clock = 1000
  const now = () => clock
  await acquireCreditLock(col, 'u1', { now, sleep: noSleep, ttlMs: 500 })
  clock = 2000
  assert.ok(await acquireCreditLock(col, 'u1', { now, sleep: noSleep }))
})
await ok('a live (unexpired) lock is not taken over', async () => {
  const col = fakeCol()
  let clock = 1000
  const now = () => clock
  await acquireCreditLock(col, 'u1', { now, sleep: noSleep, ttlMs: 5000 })
  clock = 2000
  assert.equal(await acquireCreditLock(col, 'u1', { now, sleep: noSleep, tries: 2 }), null)
})
await ok('release with the wrong token does not free the lock', async () => {
  const col = fakeCol()
  await acquireCreditLock(col, 'u1', { sleep: noSleep })
  await releaseCreditLock(col, 'u1', 'not-the-token')
  assert.equal(await acquireCreditLock(col, 'u1', { sleep: noSleep, tries: 1 }), null)
})
await ok('two simultaneous callers: exactly one wins', async () => {
  const col = fakeCol()
  const [a, b] = await Promise.all([
    acquireCreditLock(col, 'u1', { sleep: noSleep, tries: 1 }),
    acquireCreditLock(col, 'u1', { sleep: noSleep, tries: 1 }),
  ])
  assert.equal([a, b].filter(Boolean).length, 1)
})
await ok('database errors other than duplicate key are thrown, not swallowed', async () => {
  const col = { insertOne: async () => { throw new Error('connection lost') } }
  await assert.rejects(() => acquireCreditLock(col, 'u1', { sleep: noSleep }), /connection lost/)
})
await ok('missing user id never locks', async () => {
  assert.equal(await acquireCreditLock(fakeCol(), '', { sleep: noSleep }), null)
})

console.log(`creditLock: ${passed} assertions passed`)
