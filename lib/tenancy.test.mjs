import assert from 'node:assert/strict'
import { deriveLegacyOrgId } from './tenancy.mjs'

const cases = [
  ['rep@acme.com', 'acme.com'],
  ['Rep@Acme.COM', 'Acme.COM'],
  ['rep+sales@sub.acme.com', 'sub.acme.com'],
  ['', null],
  [null, null],
  ['rep', null],
  ['@acme.com', 'acme.com'],
  ['rep@', null],
]

for (const [input, expected] of cases) {
  assert.equal(deriveLegacyOrgId(input), expected)
}

console.log(`tenancy: ${cases.length} assertions passed`)

// --- private workspaces (product documents) ---
import { deriveWorkspaceId, isPersonalWorkspace, isFreeEmailDomain } from './tenancy.mjs'

const wsCases = [
  // company email -> shared by domain, lowercased
  [['rep@acme.com', 'user_1'], 'acme.com'],
  [['Rep@Acme.COM', 'user_2'], 'acme.com'],
  [['a@sub.acme.com', 'user_3'], 'sub.acme.com'],
  // free email -> private per user, never shared
  [['a@gmail.com', 'user_A'], 'personal:user_A'],
  [['b@gmail.com', 'user_B'], 'personal:user_B'],
  [['c@GMAIL.COM', 'user_C'], 'personal:user_C'],
  [['d@yahoo.co.in', 'user_D'], 'personal:user_D'],
  // anything unsafe -> null (caller must refuse)
  [['a@gmail.com', ''], null],
  [['a@gmail.com', undefined], null],
  [['', 'user_1'], null],
  [[null, 'user_1'], null],
  [['rep', 'user_1'], null],
  [['rep@', 'user_1'], null],
]
for (const [[email, uid], expected] of wsCases) {
  assert.equal(deriveWorkspaceId(email, uid), expected, `${email} / ${uid}`)
}
// two different Gmail users can never land in the same workspace
assert.notEqual(deriveWorkspaceId('a@gmail.com', 'u1'), deriveWorkspaceId('b@gmail.com', 'u2'))
assert.equal(isPersonalWorkspace('personal:u1'), true)
assert.equal(isPersonalWorkspace('acme.com'), false)
assert.equal(isPersonalWorkspace(null), false)
assert.equal(isFreeEmailDomain('Gmail.com'), true)
assert.equal(isFreeEmailDomain('acme.com'), false)

console.log(`tenancy (workspaces): ${wsCases.length + 6} assertions passed`)
