import assert from 'node:assert/strict'
import { deriveLegacyOrgId } from './tenancy.mjs'

const cases = [
  ['Rep@Acme.COM', 'acme.com'],
  [' rep@acme.com ', 'acme.com'],
  ['rep+sales@sub.acme.com', 'sub.acme.com'],
  ['', null],
  [null, null],
  ['rep', null],
  ['@acme.com', null],
  ['rep@', null],
]

for (const [input, expected] of cases) {
  assert.equal(deriveLegacyOrgId(input), expected)
}

console.log(`tenancy: ${cases.length} assertions passed`)
