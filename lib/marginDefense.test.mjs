import assert from 'node:assert/strict'
import { applyMarginTestedRule, marginDefenseLabel, NOT_TESTED_PROCUREMENT_CAP, MARGIN_TESTED_PROMPT } from './marginDefense.mjs'

let n = 0
const check = (fn) => { fn(); n++ }

check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'not_tested', procurementScore: 90, discountedEarly: true }).procurementScore, 60))
check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'not_tested', procurementScore: 45 }).procurementScore, 45))
check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'not_tested', procurementScore: 60 }).procurementScore, 60))
check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'not_tested', procurementScore: 90, discountedEarly: true }).discountedEarly, false))
// tested calls are untouched, including very high scores
check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'strong', procurementScore: 95 }).procurementScore, 95))
check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'weak', procurementScore: 20, discountedEarly: true }).discountedEarly, true))
check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'moderate', procurementScore: 70 }).procurementScore, 70))
// input is not mutated
check(() => { const a = { marginDefense: 'not_tested', procurementScore: 90 }; applyMarginTestedRule(a); assert.equal(a.procurementScore, 90) })
// other fields survive
check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'not_tested', procurementScore: 90, enablementScore: 77 }).enablementScore, 77))
// weird input is safe
check(() => assert.equal(applyMarginTestedRule(null), null))
check(() => assert.equal(applyMarginTestedRule({ marginDefense: 'not_tested' }).procurementScore, undefined))
check(() => assert.equal(NOT_TESTED_PROCUREMENT_CAP, 60))
check(() => assert.equal(marginDefenseLabel('not_tested'), 'Not tested'))
check(() => assert.equal(marginDefenseLabel('strong'), 'strong'))
check(() => assert.equal(marginDefenseLabel(undefined), '--'))
check(() => assert.ok(MARGIN_TESTED_PROMPT.includes('not_tested')))
// the 60/40 weighting: an untested 90 procurement + 70 enablement drops from 82 to 64
check(() => {
  const before = Math.round(90 * 0.6 + 70 * 0.4)
  const a = applyMarginTestedRule({ marginDefense: 'not_tested', procurementScore: 90, enablementScore: 70 })
  const after = Math.round(a.procurementScore * 0.6 + a.enablementScore * 0.4)
  assert.equal(before, 82); assert.equal(after, 64)
})

console.log(`marginDefense: ${n} assertions passed`)
