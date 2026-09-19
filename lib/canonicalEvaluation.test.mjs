import assert from 'node:assert/strict'
import {
  EVALUATION_SOURCE_PRACTICE,
  SCORING_MODEL_ID,
  SCORING_VERSION,
  fingerprintCriteria,
  hashTranscript,
} from './canonicalEvaluation.mjs'

const criteria = [
  { key: 'discoveryQuality', name: 'Discovery Quality', description: 'Ask the right questions before pitching' },
  { key: 'priceDefense', name: 'Price Defense', description: 'Hold firm and trade value for concessions' },
]

let assertions = 0
function check(fn) {
  fn()
  assertions += 1
}

check(() => assert.equal(hashTranscript('Rep: hello'), hashTranscript('Rep: hello')))
check(() => assert.notEqual(hashTranscript('Rep: hello'), hashTranscript('Rep: hello!')))
check(() => assert.notEqual(hashTranscript('Rep: hello'), hashTranscript('Rep:  hello')))
check(() => assert.notEqual(hashTranscript('Rep: hello'), hashTranscript('Rep: hello\n')))

check(() => assert.equal(fingerprintCriteria(criteria), fingerprintCriteria(criteria.map(c => ({ ...c })))))
check(() => assert.notEqual(
  fingerprintCriteria(criteria),
  fingerprintCriteria([{ ...criteria[0], name: 'Discovery' }, criteria[1]])
))
check(() => assert.notEqual(
  fingerprintCriteria(criteria),
  fingerprintCriteria([{ ...criteria[0], description: 'Different scoring instruction' }, criteria[1]])
))
check(() => assert.notEqual(
  fingerprintCriteria(criteria),
  fingerprintCriteria([{ ...criteria[0], key: 'discovery' }, criteria[1]])
))
check(() => assert.notEqual(fingerprintCriteria(criteria), fingerprintCriteria([...criteria].reverse())))

check(() => {
  const input = criteria.map(c => ({ ...c }))
  const before = JSON.stringify(input)
  fingerprintCriteria(input)
  assert.equal(JSON.stringify(input), before)
})

check(() => assert.throws(() => hashTranscript(null), /transcript must be a string/))
check(() => assert.throws(() => fingerprintCriteria(null), /criteria must be an array/))
check(() => assert.throws(
  () => fingerprintCriteria([{ key: 'x', name: 'X' }]),
  /must contain string key, name, and description/
))

check(() => assert.equal(hashTranscript(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'))
check(() => assert.equal(fingerprintCriteria([]), fingerprintCriteria([])))

check(() => {
  const withRuntimeMetadata = criteria.map(c => ({ ...c, updatedAt: 'tomorrow', uiColor: 'cyan' }))
  assert.equal(fingerprintCriteria(criteria), fingerprintCriteria(withRuntimeMetadata))
})

check(() => {
  assert.equal(SCORING_VERSION, 'boardroom-v1')
  assert.equal(SCORING_MODEL_ID, 'gemini-2.5-flash')
  assert.equal(EVALUATION_SOURCE_PRACTICE, 'practice')
})

console.log(`canonicalEvaluation: ${assertions} assertions passed`)
