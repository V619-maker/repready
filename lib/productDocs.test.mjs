import assert from 'node:assert/strict'
import { PRODUCT_DOC_LIMITS as L, canManageProductDocs, validateProductDocInput, checkProductDocQuota } from './productDocs.mjs'

let n = 0
const t = (fn) => { fn(); n++ }

// --- who may manage ---
t(() => assert.equal(canManageProductDocs({ role: 'manager', isPersonalWorkspace: false }), true))
t(() => assert.equal(canManageProductDocs({ role: 'rep', isPersonalWorkspace: false }), false))   // company rep: list only
t(() => assert.equal(canManageProductDocs({ role: 'rep', isPersonalWorkspace: true }), true))     // sole owner of own workspace
t(() => assert.equal(canManageProductDocs({ role: undefined, isPersonalWorkspace: undefined }), false))

// --- input validation ---
const good = 'Our product has three plans and a 30-day trial.'
t(() => assert.deepEqual(validateProductDocInput('  Pricing guide ', `  ${good}  `), { ok: true, name: 'Pricing guide', text: good }))
t(() => assert.equal(validateProductDocInput('', good).status, 400))
t(() => assert.equal(validateProductDocInput('x'.repeat(L.maxNameChars + 1), good).status, 400))
t(() => assert.equal(validateProductDocInput(null, good).ok, false))
t(() => assert.equal(validateProductDocInput('n', 'short').status, 400))
t(() => assert.equal(validateProductDocInput('n', 123).ok, false))
t(() => assert.equal(validateProductDocInput('n', 'a'.repeat(L.maxCharsPerDoc + 1)).status, 413))
t(() => assert.equal(validateProductDocInput('n', 'a'.repeat(L.maxCharsPerDoc)).ok, true))
t(() => assert.equal(validateProductDocInput('n', `${good}\u0000\u0000`).text, good))              // NUL stripped

// --- quotas ---
t(() => assert.equal(checkProductDocQuota([], 100).ok, true))
t(() => assert.equal(checkProductDocQuota(Array(L.maxDocs).fill({ chars: 10 }), 10).status, 409))   // too many docs
t(() => assert.equal(checkProductDocQuota([{ chars: L.maxCharsTotal - 5 }], 10).status, 409))        // too many chars
t(() => assert.equal(checkProductDocQuota([{ chars: L.maxCharsTotal - 10 }], 10).ok, true))          // exactly at limit
t(() => assert.equal(checkProductDocQuota([{}], 10).ok, true))                                        // missing chars tolerated

console.log(`productDocs: ${n} assertions passed`)
