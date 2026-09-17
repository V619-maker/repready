// Evidence-grounding for the executive-summary coaching fields (Sprint 51).
//
// Pure, dependency-free functions — no Next.js/Mongo/Clerk imports — so they
// can be unit-tested with plain `node` (see evidenceValidation.test.mjs)
// without spinning up any framework. `.mjs` specifically: this package has
// no `"type": "module"` in package.json, so a `.js` file here would be
// loaded as CommonJS by a direct `node` invocation and choke on `export`;
// Next's own bundler doesn't care either way (it transpiles both), so this
// extension only matters for running the test file standalone.

// Splits a line-delimited transcript into ephemeral, request-scoped turn
// strings. Never persisted, never changes how transcripts are built or
// stored — the live-voice path (app/deck/page.js) joins turns with '\n\n',
// the real-call/pasted-transcript paths join with '\n'. Collapsing one-or-
// more consecutive newlines handles both separators identically without
// needing to know which caller produced the string.
export function splitTranscriptIntoTurns(transcript) {
  return String(transcript || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

// Whitespace-only normalization — deliberately not case-insensitive and not
// punctuation-stripping. A quote is either verbatim (modulo whitespace) or
// it's treated as fabricated; loosening the match further would weaken the
// "mechanically verifiable" guarantee this exists for. Collapses runs of
// whitespace to a single space so a quote reproduced with different
// spacing/line-wrapping than the stored turn still matches.
export function normalizeWhitespace(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

// The mechanical evidence gate (Sprint 51) — never trusts the model's own
// claim that a quote is real, regardless of what the prompt asked for.
// turnIndex must resolve to an actual turn in *this* transcript, and the
// quote (whitespace-normalized) must actually occur inside that exact
// turn's text — not anywhere else in the transcript, not paraphrased.
// Returns null on any failure so the caller can fail closed per evidence
// item: discard just that one object, keep the existing plain-string
// coaching field untouched. `turns` is the array already produced by
// splitTranscriptIntoTurns() for this same transcript.
export function validateEvidence(evidence, turns) {
  if (!evidence || typeof evidence !== 'object') return null
  if (!Array.isArray(turns) || turns.length === 0) return null

  const { turnIndex, quote, gap, betterResponse } = evidence

  if (!Number.isInteger(turnIndex) || turnIndex < 0 || turnIndex >= turns.length) return null

  const normalizedQuote = normalizeWhitespace(quote)
  if (!normalizedQuote) return null

  const normalizedTurn = normalizeWhitespace(turns[turnIndex])
  if (!normalizedTurn.includes(normalizedQuote)) return null

  if (typeof gap !== 'string' || !gap.trim()) return null
  if (typeof betterResponse !== 'string' || !betterResponse.trim()) return null

  // quote is returned as the model gave it (not the normalized version) —
  // display fidelity, not a second source of truth: we've already proven
  // its content (modulo whitespace) is a real substring of the real turn.
  return { turnIndex, quote, gap, betterResponse }
}
