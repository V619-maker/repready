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

1. `POST /api/boardroom` authenticates the caller, derives the org from the authenticated email, runs `scoreTranscript()`, then runs `generateExecutiveSummary()`, and only after both calls succeed returns the boardroom scoring/coaching response to the browser.
2. `finalScore`, procurement/enablement scores, and dimensions come from the first call; `grade` and executive coaching come from the second call.
3. The browser later submits session data to `POST /api/sessions`.
4. `POST /api/sessions` independently calls `scoreTranscript()` again.
5. The current rejection condition is one-sided: `claimedScore > verified.weightedScore + 20`.
6. If that verification call fails for infrastructure/LLM reasons, the current handler fails open and continues the save.
7. If accepted, the current session write persists browser-provided scoring fields.
8. Practice session documents do not persist the transcript.
9. `/api/coach` remains a separate fallback scoring methodology.
10. Real-call scoring is server-side and is unchanged by this work.

## Canonical readiness contract

A future practice `scoreResult` becomes authoritative/consumable only after the existing successful boardroom pipeline has completed:

1. `scoreTranscript()` succeeds.
2. `generateExecutiveSummary()` succeeds for that same transcript and analyst result.
3. The canonical record is written from those trusted server results.

If step 1 succeeds but step 2 fails, the partial analyst result must not be written as a consumable canonical evaluation. During shadow mode, failure to write the new canonical record after both existing calls succeed must not suppress the existing boardroom debrief.

## Scoring version contract

`SCORING_VERSION` identifies score methodology. Bump it whenever a production change can alter score semantics for the same transcript and criteria snapshot, including changes to:

- procurement or enablement scoring instructions/rubric
- the procurement/enablement weighting formula
- the schema or semantic meaning of scored fields
- persona/buyer context used by scoring
- another score-affecting methodology rule

Do not bump `SCORING_VERSION` solely because an organization changes its criteria: that change is captured by `criteriaSnapshot` and `criteriaFingerprint`. Do not bump it solely because the model identifier changes: that is captured by `modelId`. If one release changes both methodology and model, update both.

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
- no canonical evaluation becomes consumable from a partial boardroom pipeline
- a new score-result write failure cannot suppress an otherwise successful existing debrief during shadow mode
- legacy session-save requests still work during the compatibility window
- supplied invalid canonical IDs cannot silently downgrade to the weaker legacy path
- existing sessions remain readable
- no raw practice transcript is added to canonical persistence
- real-call behavior is unchanged unless separately scoped
- tests and build results are reported accurately
