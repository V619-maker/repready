// Plain-Node tests for the Sprint 51 evidence-grounding gate. No framework —
// this repo has none (tests/ and test_reports/ are dead Python-template
// scaffold, unrelated to this app) — just Node's built-in `assert`.
//
// Run: node lib/evidenceValidation.test.mjs

import assert from 'node:assert/strict'
import { splitTranscriptIntoTurns, normalizeWhitespace, validateEvidence } from './evidenceValidation.mjs'

let passed = 0
function test(name, fn) {
  fn()
  passed++
  console.log(`ok - ${name}`)
}

// --- splitTranscriptIntoTurns -------------------------------------------

test('splitTranscriptIntoTurns handles the live-voice \\n\\n separator', () => {
  const transcript = 'Rep: Hi there, thanks for calling.\n\nProspect: Sure, I have a question.\n\nRep: Go ahead.'
  assert.deepEqual(splitTranscriptIntoTurns(transcript), [
    'Rep: Hi there, thanks for calling.',
    'Prospect: Sure, I have a question.',
    'Rep: Go ahead.',
  ])
})

test('splitTranscriptIntoTurns handles the real-call/pasted \\n separator identically', () => {
  const transcript = 'Rep: Hi there.\nProspect: Sure.\nRep: Go ahead.'
  assert.deepEqual(splitTranscriptIntoTurns(transcript), ['Rep: Hi there.', 'Prospect: Sure.', 'Rep: Go ahead.'])
})

test('splitTranscriptIntoTurns drops blank lines and trims each turn', () => {
  const transcript = '  Rep: Hi.  \n\n\n   \n\nProspect: Hello.  '
  assert.deepEqual(splitTranscriptIntoTurns(transcript), ['Rep: Hi.', 'Prospect: Hello.'])
})

// --- normalizeWhitespace -------------------------------------------------

test('normalizeWhitespace collapses runs of whitespace and trims', () => {
  assert.equal(normalizeWhitespace('  We  should\n  talk   about   pricing.  '), 'We should talk about pricing.')
})

// --- validateEvidence: the 7 required scenarios --------------------------

const TURNS = splitTranscriptIntoTurns(
  [
    'Rep: Look, I know this is a big investment, but I can do 20% off if we sign today.',
    'Prospect: That does help, but I still need to check with finance.',
    'Rep: Totally understand. What would you need from me to make that conversation easier?',
  ].join('\n')
)

test('1. valid quote + valid turn -> returns the evidence object', () => {
  const evidence = {
    turnIndex: 0,
    quote: 'I can do 20% off if we sign today',
    gap: 'Offered a discount before the prospect raised price as an objection.',
    betterResponse: 'Ask about budget and timeline before offering any concession.',
  }
  const result = validateEvidence(evidence, TURNS)
  assert.deepEqual(result, evidence)
})

test('2. fabricated quote (not present anywhere in the transcript) -> null', () => {
  const evidence = {
    turnIndex: 0,
    quote: 'I will match any competitor price no matter what',
    gap: 'Made an unconditional price-matching promise.',
    betterResponse: 'Never commit to matching an unnamed competitor.',
  }
  assert.equal(validateEvidence(evidence, TURNS), null)
})

test('3. valid quote attached to the wrong turn -> null (must match its OWN turn, not just exist somewhere)', () => {
  // "check with finance" is real, but it's turn 1, not turn 2.
  const evidence = {
    turnIndex: 2,
    quote: 'check with finance',
    gap: 'Mislabeled turn.',
    betterResponse: 'N/A',
  }
  assert.equal(validateEvidence(evidence, TURNS), null)
})

test('4. invalid/out-of-range turnIndex -> null', () => {
  const base = { quote: 'Totally understand', gap: 'x', betterResponse: 'y' }
  assert.equal(validateEvidence({ ...base, turnIndex: -1 }, TURNS), null, 'negative index')
  assert.equal(validateEvidence({ ...base, turnIndex: TURNS.length }, TURNS), null, 'one past the end')
  assert.equal(validateEvidence({ ...base, turnIndex: 1.5 }, TURNS), null, 'non-integer index')
  assert.equal(validateEvidence({ ...base, turnIndex: '0' }, TURNS), null, 'string index, not a number')
})

test('5. whitespace normalization -> a quote reproduced with different spacing/wrapping still validates', () => {
  const evidence = {
    turnIndex: 0,
    quote: '  I   can do 20% off\n  if we sign today  ',
    gap: 'x',
    betterResponse: 'y',
  }
  const result = validateEvidence(evidence, TURNS)
  assert.ok(result, 'expected validation to succeed despite whitespace differences')
  assert.equal(result.turnIndex, 0)
})

test('6. legacy realCall containing only string feedback -> missing evidence field validates to null, not a throw', () => {
  assert.equal(validateEvidence(undefined, TURNS), null)
  assert.equal(validateEvidence(null, TURNS), null)
})

test('7. mixed case: one evidence item fails, the other two pass', () => {
  const rightEvidence = {
    turnIndex: 2,
    quote: 'What would you need from me to make that conversation easier',
    gap: 'Asked a genuinely useful discovery question after a concession.',
    betterResponse: 'N/A — this was the strong moment.',
  }
  const wrongEvidence = {
    turnIndex: 0,
    quote: 'this sentence was never said by anyone',
    gap: 'fabricated',
    betterResponse: 'n/a',
  }
  const fixNextEvidence = {
    turnIndex: 1,
    quote: 'I still need to check with finance',
    gap: 'Signals a real procurement blocker that went unaddressed.',
    betterResponse: 'Ask who else is involved in the finance sign-off and offer to join that call.',
  }

  const results = {
    whatYouDidRightEvidence: validateEvidence(rightEvidence, TURNS),
    whatYouDidWrongEvidence: validateEvidence(wrongEvidence, TURNS),
    oneThingToFixNextEvidence: validateEvidence(fixNextEvidence, TURNS),
  }

  assert.ok(results.whatYouDidRightEvidence, 'right evidence should survive validation')
  assert.equal(results.whatYouDidWrongEvidence, null, 'fabricated wrong-evidence must be discarded')
  assert.ok(results.oneThingToFixNextEvidence, 'fix-next evidence should survive validation')
})

// --- additional guard: empty/whitespace-only quote never trivially matches ---

test('empty or whitespace-only quote never validates, even though it is technically a substring of everything', () => {
  assert.equal(validateEvidence({ turnIndex: 0, quote: '', gap: 'x', betterResponse: 'y' }, TURNS), null)
  assert.equal(validateEvidence({ turnIndex: 0, quote: '   ', gap: 'x', betterResponse: 'y' }, TURNS), null)
})

console.log(`\n${passed} passed, 0 failed`)
