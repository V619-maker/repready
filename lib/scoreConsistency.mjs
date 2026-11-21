// Scoring-consistency check: score the SAME transcript several times and look
// at how much the numbers move. Pure helpers + built-in sample calls, so the
// numbers can be unit-tested without any AI call. Used by
// GET /api/admin/score-consistency (manager only).

export const MAX_RUNS = 10

export function summarize(values) {
  const v = values.filter((x) => typeof x === 'number' && Number.isFinite(x))
  if (!v.length) return { n: 0, min: null, max: null, mean: null, stdDev: null, spread: null }
  const n = v.length
  const mean = v.reduce((a, b) => a + b, 0) / n
  const variance = v.reduce((a, b) => a + (b - mean) ** 2, 0) / n
  const min = Math.min(...v)
  const max = Math.max(...v)
  const r1 = (x) => Math.round(x * 10) / 10
  return { n, min, max, mean: r1(mean), stdDev: r1(Math.sqrt(variance)), spread: max - min }
}

// results: [{ weightedScore, procurementScore, enablementScore, dimensions: {key: number} }]
export function summarizeRuns(results) {
  const dimKeys = new Set()
  for (const r of results) Object.keys(r.dimensions || {}).forEach((k) => dimKeys.add(k))
  const dimensions = {}
  for (const k of dimKeys) dimensions[k] = summarize(results.map((r) => r.dimensions?.[k]))
  return {
    runs: results.length,
    weightedScore: summarize(results.map((r) => r.weightedScore)),
    procurementScore: summarize(results.map((r) => r.procurementScore)),
    enablementScore: summarize(results.map((r) => r.enablementScore)),
    dimensions,
  }
}

// Same line format the live call screen produces: "Rep: ..." / "Prospect: ...".
export const SAMPLE_TRANSCRIPTS = {
  strongRep: [
    "Prospect: Richard Chen. I've got something on my desk, so make this fast. What've you got?",
    "Rep: Thanks Richard. Before I pitch anything, can I ask what's driving the review of your fleet-tracking vendor right now?",
    "Prospect: Honestly, cost. We're paying too much and the board wants twelve percent out of logistics software.",
    "Rep: Twelve percent out of logistics software. Is that across every tool, or is tracking the biggest line?",
    "Prospect: Tracking is the biggest. About forty percent of that budget. Your quote is higher than what we pay now.",
    "Rep: Understood. What does a missed delivery window cost you today, roughly? I want to compare that against the price difference, not just the sticker.",
    "Prospect: Around nine thousand dollars a day in penalties when we get it wrong. We had six bad days last quarter.",
    "Rep: So roughly fifty-four thousand last quarter. Our customers with similar routes cut late deliveries by about a third, which would be around eighteen thousand a quarter back. That covers most of the premium.",
    "Prospect: Nice story. I still need ten percent off or I can't get this past procurement.",
    "Rep: I can't do ten percent on the price. What I can do is move to a two-year term, and for that I can take five percent off. Would a two-year commitment work on your side?",
    "Prospect: Two years is a stretch. What else?",
    "Rep: If you can confirm the pilot on the two busiest routes by the end of the month, I'll include onboarding at no charge, which is worth about six thousand dollars. Does that help with the board number?",
    "Prospect: That might work. Send me the terms and who signs on your side.",
  ].join('\n'),
  weakRep: [
    "Prospect: Richard Chen. I've got something on my desk, so make this fast. What've you got?",
    "Rep: Hi Richard, great to meet you. We have an amazing platform with real-time tracking, route optimisation, driver scorecards, analytics dashboards and an AI assistant. It's the best on the market.",
    "Prospect: Fine. What does it cost? Your quote is higher than what we pay now.",
    "Rep: Yes, it's a bit higher, but we can definitely work on that. What number would you like?",
    "Prospect: Ten percent off or I can't get this past procurement.",
    "Rep: Sure, ten percent is fine. I can even do fifteen if that helps.",
    "Prospect: Fifteen. Interesting. What about free onboarding as well?",
    "Rep: Absolutely, we can include onboarding. Anything else you need?",
    "Prospect: And a one-year term with no penalty to leave.",
    "Rep: Yes, no problem. We really want your business.",
    "Prospect: Good. Send it over.",
    "Rep: Great, I'll send it right away. Thank you so much, Richard.",
  ].join('\n'),
}
