import assert from 'node:assert/strict'
import { summarize, summarizeRuns, SAMPLE_TRANSCRIPTS, MAX_RUNS } from './scoreConsistency.mjs'
import { splitTranscriptIntoTurns } from './evidenceValidation.mjs'

let n = 0
const t = (fn) => { fn(); n++ }

t(() => assert.deepEqual(summarize([70, 70, 70]), { n: 3, min: 70, max: 70, mean: 70, stdDev: 0, spread: 0 }))
t(() => assert.deepEqual(summarize([60, 70, 80]), { n: 3, min: 60, max: 80, mean: 70, stdDev: 8.2, spread: 20 }))
t(() => assert.deepEqual(summarize([]), { n: 0, min: null, max: null, mean: null, stdDev: null, spread: null }))
t(() => assert.equal(summarize([5, undefined, NaN, 'x', 7]).n, 2))              // ignores junk
const s = summarizeRuns([
  { weightedScore: 80, procurementScore: 82, enablementScore: 77, dimensions: { a: 70, b: 90 } },
  { weightedScore: 76, procurementScore: 80, enablementScore: 70, dimensions: { a: 74, b: 90 } },
])
t(() => assert.equal(s.runs, 2))
t(() => assert.equal(s.weightedScore.spread, 4))
t(() => assert.equal(s.dimensions.a.spread, 4))
t(() => assert.equal(s.dimensions.b.spread, 0))
t(() => assert.equal(MAX_RUNS, 10))
// sample calls: right speaker labels, every line labelled, rep actually speaks
for (const [name, text] of Object.entries(SAMPLE_TRANSCRIPTS)) {
  const turns = splitTranscriptIntoTurns(text)
  t(() => assert.ok(turns.length >= 10, name))
  t(() => assert.ok(turns.every((l) => /^(Rep|Prospect): \S/.test(l)), name))
  t(() => assert.ok(turns.some((l) => l.startsWith('Rep: ')), name))
}
console.log(`scoreConsistency: ${n} assertions passed`)
