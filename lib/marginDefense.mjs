// "Was margin actually tested?" rule for the scoring pipeline.
//
// Problem: procurement/margin defense is 60% of the final score, but on a call
// where price, discounts or budget never came up the rep had nothing to defend.
// The analyst still produced a margin score, so reps earned "held firm" credit
// for a test that never happened (found in a live test, Nov 2026).
//
// Fix: the analyst may answer 'not_tested'. Applied in code (not just the prompt)
// so the cap holds even if the model ignores the instruction.

export const NOT_TESTED = 'not_tested'
// Without being tested, procurement cannot score above "average".
export const NOT_TESTED_PROCUREMENT_CAP = 60

export const MARGIN_TESTED_PROMPT = `MARGIN TESTED CHECK (decide this first):
Did price, discounts, budget or commercial terms actually come up in a way the rep had to handle? Examples: the buyer asked the price, pushed for a discount, said budget was tight, or compared prices, or the rep had to state a number and respond to a reaction.
- If YES: score procurement as described above and set marginDefense to strong, moderate or weak.
- If it NEVER came up at all (for example a pure discovery or intro call): set marginDefense to "not_tested", set discountedEarly to false, and say in procurementReasoning that price was not tested. Do not reward the rep for "holding firm" on something nobody challenged.`

// Returns a new analyst object; never mutates the input.
export function applyMarginTestedRule(analyst) {
  if (!analyst || analyst.marginDefense !== NOT_TESTED) return analyst
  const raw = analyst.procurementScore
  const capped = typeof raw === 'number' ? Math.min(raw, NOT_TESTED_PROCUREMENT_CAP) : raw
  return { ...analyst, procurementScore: capped, discountedEarly: false }
}

// Text for the UI ("not_tested" -> "Not tested").
export function marginDefenseLabel(value) {
  if (value === NOT_TESTED) return 'Not tested'
  return typeof value === 'string' && value ? value : '--'
}
