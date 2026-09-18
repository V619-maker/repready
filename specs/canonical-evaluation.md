# Canonical Evaluation — Foundation Spec

## Scope of PR1

PR1 establishes deterministic provenance primitives and documents the migration contract. It changes no production request path.

### Implemented now

- `hashTranscript(transcript)`: SHA-256 of the exact UTF-8 transcript string.
- `fingerprintCriteria(criteria)`: SHA-256 of ordered scoring-relevant criteria fields (`key`, `name`, `description`).
- explicit constants for the current scoring methodology/model/source.
- plain-Node unit tests.
- ADR-001 and project-context documentation.

### Planned, not implemented in PR1

A future server-owned score result is expected to contain:

```js
{
  id,
  userEmail,
  orgId,
  persona,
  source,

  transcriptHash,

  scoringVersion,
  modelId,

  criteriaSnapshot,
  criteriaFingerprint,

  finalScore,
  procurementScore,
  enablementScore,
  dimensions,
  grade,

  status,
  createdAt,
  consumedAt,
}
```

The persisted shape may be refined before the shadow-write PR.

## Current trust boundary — characterization

The current live practice path remains authoritative during PR1:

1. `POST /api/boardroom` authenticates the caller, derives the org from the authenticated email, scores the supplied transcript, and returns scoring/coaching data to the browser.
2. The browser later submits session data to `POST /api/sessions`.
3. `POST /api/sessions` independently calls `scoreTranscript()` again.
4. The current rejection condition is one-sided: `claimedScore > verified.weightedScore + 20`.
5. If that verification call fails for infrastructure/LLM reasons, the current handler fails open and continues the save.
6. If accepted, the current session write persists browser-provided scoring fields.
7. Practice session documents do not persist the transcript.
8. `/api/coach` remains a separate fallback scoring methodology.
9. Real-call scoring is server-side and is unchanged by this work.

## Helper contracts

### hashTranscript

- input must be a string; programmer misuse throws `TypeError`
- empty string is valid and hashes normally
- no normalization
- output is lowercase 64-character SHA-256 hex

### fingerprintCriteria

- input must be an array; programmer misuse throws `TypeError`
- each criterion must contain string `key`, `name`, and `description`
- array order is significant
- unrelated runtime/UI metadata is ignored
- input is never mutated
- empty array is deterministic (although the live scoring path does not use an empty rubric)

## P0 regression gates for later PRs

A later implementation PR cannot merge unless it preserves the existing customer journey or explicitly documents and receives approval for a behavior change.

At minimum verify:

- boardroom success still yields the same response fields expected by `/deck` and `/coach`
- a new score-result write failure cannot suppress an otherwise successful existing debrief during shadow mode
- legacy session-save requests still work during the compatibility window
- supplied invalid canonical IDs cannot silently downgrade to the weaker legacy path
- existing sessions remain readable
- no raw practice transcript is added to canonical persistence
- real-call behavior is unchanged unless separately scoped
- tests and build results are reported accurately
