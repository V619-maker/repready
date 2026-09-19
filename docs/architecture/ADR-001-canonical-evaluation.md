# ADR-001: Canonical Evaluation Foundation

**Status:** Accepted for incremental implementation  
**Date:** 2026-09-18  
**P0 invariant:** No architecture improvement may regress the existing working RepReady product.

## Context

Practice scoring currently has two trust boundaries. `POST /api/boardroom` scores a transcript and returns scoring data to the browser. Later, `POST /api/sessions` independently calls `scoreTranscript()` again as a one-sided plausibility check, then persists accepted browser-provided scoring fields. The verification rejects only when the claimed final score is more than 20 points above the independently verified weighted score, and verification infrastructure failures currently fail open.

The existing successful boardroom path is itself a two-call Gemini pipeline: `scoreTranscript()` produces the analyst scores and deterministic weighted final score, then `generateExecutiveSummary()` produces the grade and coaching summary. Canonicalization must not make a partial result from only the first call authoritative.

The practice `sessions` collection does not persist the raw transcript. That data-minimization property must not be accidentally reversed by this foundation work.

Real-call scoring is already server-owned and is explicitly outside the first practice-scoring migration.

## Decision

Move practice scoring incrementally toward one server-owned canonical evaluation:

```
transcript
  -> existing boardroom pipeline completes
     -> scoreTranscript() once
     -> generateExecutiveSummary() once
  -> server-owned scoreResult
  -> scoreResultId returned to browser
  -> session finalization consumes that exact scoreResult
```

The browser may display evaluation data but will not remain the authority for canonical scoring fields after migration.

A future canonical score result will carry, at minimum:

- trusted identity/ownership context
- persona and source
- SHA-256 `transcriptHash`, not the raw practice transcript
- `scoringVersion` and `modelId`
- the exact `criteriaSnapshot` and deterministic `criteriaFingerprint`
- final/procurement/enablement scores, dimensions, and grade
- lifecycle fields needed for safe consumption/idempotency

The exact Mongo shape is intentionally deferred until the shadow-write PR.

## Provenance invariants

1. **Exact transcript binding.** `hashTranscript()` hashes the exact UTF-8 transcript string used for scoring. It performs no trimming or normalization.
2. **No new practice-transcript persistence.** Canonical evaluation stores a digest, not the raw practice transcript.
3. **Historical rubric meaning is preserved.** A canonical evaluation snapshots the scoring criteria used at evaluation time and fingerprints the scoring-relevant `key`, `name`, and `description` fields in array order.
4. **Methodology is versioned.** `scoringVersion` identifies the scoring methodology independently of the model identifier.
5. **Server ownership.** Future canonical scoring fields come from the trusted server result, not from browser-authored values.
6. **No partial canonical evaluation.** A score result is not authoritative or consumable unless the existing successful boardroom pipeline has completed. If analyst scoring succeeds but executive-summary generation fails, no consumable canonical evaluation may be created from that partial result.

## Scoring version bump contract

`scoringVersion` represents the meaning of the score, not merely the implementation that produced it. The version must change whenever a production change can alter score semantics for the same transcript and rubric, including:

- procurement or enablement scoring instructions/rubric
- the procurement/enablement weighting formula
- the schema or semantic meaning of scored fields
- persona/buyer context used by the scoring prompt
- any other score-affecting methodology change

The following are versioned independently and therefore do **not**, by themselves, require a `scoringVersion` bump:

- organization criteria changes, because the exact rubric is captured by `criteriaSnapshot` and `criteriaFingerprint`
- model identifier changes, because `modelId` is captured separately

A change that modifies both the model and score methodology must update both identifiers.

## Migration strategy

The migration is additive-first:

1. **PR1 — foundation (implemented):** deterministic helpers, tests, ADR/spec, context documentation. No production request path changes.
2. **PR2 — shadow write (implemented):** after the existing boardroom pipeline completes successfully, `/api/boardroom` creates a score result and additively returns `scoreResultId`. A shadow-write failure does not cost the rep their existing debrief.
3. **PR3 — dual-path finalization (implemented):** `/api/sessions` consumes a valid supplied `scoreResultId`; requests without one retain the legacy verification path. A supplied-but-invalid ID fails rather than silently downgrading.
4. **PR4 — hardening (implemented by this change):** canonical session insertion and `ready -> consumed` transition are transactional; already-consumed retries return the existing matching session; persistence failures are visible in the deck with an explicit retry action; canonical failures remain fail-closed and are logged.
5. **Later consumers:** real calls/completion semantics/coach unification are separate scoped changes.

## Existing Product Preservation / Regression Contract

Until a later PR explicitly changes a behavior, all of the following remain unchanged:

- practice call start/end behavior
- transcript capture
- boardroom scoring formula and prompts
- evidence-grounded coaching
- coach fallback
- session save response shape
- Dashboard and My Stats behavior
- qualification and hostility progression
- custom org criteria behavior
- rep memory
- consent/retention behavior
- credits/billing
- real-call scoring
- historical session readability

No historical records are rewritten.

## Consequences

### Positive

- Removes the long-term need for LLM-vs-LLM score verification.
- Prevents browser-authored rich scoring fields from becoming historical truth.
- Preserves the rubric/model/methodology context needed to interpret historical scores.
- Keeps practice transcript retention unchanged.
- Allows gradual rollout without forcing all downstream consumers to migrate together.

### Costs

- Temporary dual-path complexity during migration.
- A new score-result lifecycle must be made idempotent and ownership-scoped before it becomes authoritative.
- Legacy sessions remain less provenance-rich than post-migration evaluations.

## Not included

This ADR does not approve implementation of completion statuses, organization/membership tenancy, real-call migration, coach retirement, historical backfill, scoring-formula changes, or transcript persistence.
