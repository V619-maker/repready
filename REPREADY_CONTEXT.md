# REPREADY_CONTEXT.md
# Single source of truth for RepReady — updated after every sprint task
# Last updated: August 11, 2026

---

## PRODUCT OVERVIEW

**RepReady** is an AI-powered B2B sales negotiation simulator targeting India and SEA markets. Reps practice against hostile AI buyers (voice-only) and receive boardroom-grade coaching feedback after each session.

**Core value proposition:** Progressive difficulty system where the AI buyer gets harder as the rep improves. Reps earn their way from Not Qualified → Elite through repeated sessions.

**Target users:** B2B sales reps (individual) + VP Sales / Sales Managers (team view)

**Stack:** Next.js 14 (App Router) · Clerk auth · MongoDB Atlas M0 (Mumbai) · ElevenLabs voice agents · Gemini 2.5 Flash (scoring) · Paddle (payments) · Vercel (Hobby plan, 10s function timeout)

---

## REPOSITORY

- **Repo:** github.com/V619-maker/repready
- **Branch:** main (auto-deploys to Vercel)
- **Production URL:** repready.site
- **Single catch-all API:** `app/api/[[...path]]/route.js` (all endpoints live here except `/api/coach` and `/api/deduct-credit` which have their own files)

---

## ENVIRONMENT VARIABLES (Vercel — repready project settings)

| Variable | Purpose |
|---|---|
| `MONGO_URL` | MongoDB Atlas connection string (mongodb+srv://...) |
| `DB_NAME` | `repready` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key for boardroom scoring |
| `CLERK_SECRET_KEY` | Clerk server-side auth |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client-side auth |

**Resolved July 13, 2026:** `MONGO_URL` was renamed from `Mongo` to `MONGO_URL` in Vercel, and a `getDb()` connection-caching bug (see git history: `app/api/[[...path]]/route.js`) was fixed. `/api/sessions` POST now confirmed returning 200 in production.

---

## USER JOURNEY (confirmed, do not change without explicit instruction)

```
repready.site (landing)
    ↓
Sign In (Clerk) → redirects to /deck
    ↓
/deck — choose Richard Vance, Sandra Chen, Priya Malhotra, or Rakesh Iyer
    ↓
Voice simulation (ElevenLabs WebRTC)
    ↓
Session ends → boardroom pipeline fires (2 Gemini calls)
    ↓
Results screen (score + qualification status + hostility reached)
    ↓
ANALYZE WITH COACH → /coach (full debrief)
MY PROGRESS → /my-stats (rep progression)
    ↓
/dashboard (manager view — separate page)
```

**Pages that exist:**
- `app/page.js` — landing page ✅
- `app/coach/page.js` — post-session debrief ✅
- `app/my-stats/page.js` — rep progression ✅ live, showing real MongoDB data. Now includes "last practiced X days ago" and a consecutive-weeks streak counter.
- `app/dashboard/page.js` — manager view ✅ upgraded: qualified/elite rep counts, session-weighted team avg score, team skill matrix with weakest-dimension callout, best-ever rep leaderboard (with 7-day inactivity warning per rep), recent sessions
- `app/simulate/page.js` — OLD page, NOT part of user journey, do not touch
- `app/sign-in/[[...sign-in]]/page.js` — Clerk sign in, redirects to `/deck`

---

## ElevenLabs AGENTS

| Agent | ID | Role |
|---|---|---|
| Richard Vance | `agent_8601kmk3maq9f9a9csym74aj7s4e` | VP Procurement, Meridian Logistics |
| Sandra Chen | `agent_0301kmsnhr7tf11b62bvd7vsw9qq` | Head of IT, 800-person financial firm |
| Priya Malhotra | `TBD — manual ElevenLabs setup pending` | TBD — user is writing this persona's system prompt directly in the ElevenLabs dashboard; role/company/first message to follow |
| Rakesh Iyer | `TBD — manual ElevenLabs setup pending` | TBD — same as Priya; system prompt written outside this repo |

**Priya and Rakesh are wired into the code (added Sprint 18b) but not yet callable.** `app/deck/page.js` has placeholder agent IDs (`agent_PLACEHOLDER_PRIYA_TBD` / `agent_PLACEHOLDER_RAKESH_TBD`, clearly marked in code comments) — starting a session against either will fail until the real `agent_*` IDs from the ElevenLabs dashboard replace them. Their persona cards also show "Role — TBD" in the UI pending the same details. Do not remove the placeholders or ship this branch to production without swapping in real values.

**Richard's current LLM:** Claude Sonnet 4.6 (known issue: says stage directions aloud like `[impatient]` — fix by switching to ElevenLabs-hosted LLM or Gemini 2.5 Flash in ElevenLabs dashboard)

**Dynamic variables passed via `startSession()` dynamicVariables:**
- `{{hostility_level}}` — always present. Values: `LOW (40%)`, `MEDIUM (60%)`, `HIGH (78%)`, `EXTREME (90%)`
- `{{rep_history}}` — added July 2026, **conditionally present**. Only included when: the rep is signed in, current hostility ≥50%, and `/api/rep-memory` finds 2+ prior sessions for that rep+persona and successfully generates a summary via Gemini 2.5 Flash. When any of those isn't true, the key is entirely absent from dynamicVariables (not an empty string) — **Richard's prompt must handle `{{rep_history}}` being unset/blank gracefully** (see "ACTION NEEDED" below).

**ACTION NEEDED (manual, ElevenLabs dashboard — not done by this repo):** Richard's system prompt needs an addition to actually use `{{rep_history}}`. Add this block to his prompt, positioned near the top alongside his other context/persona setup (before the scoring rules section):

```
REP HISTORY (if provided): {{rep_history}}

If REP HISTORY above contains a summary, use it to inform how you engage this rep — reference their known patterns naturally in your dialogue (e.g. push harder on a tactic they haven't tried, or call out a weakness they've shown before) without ever stating "the system told me" or otherwise breaking character. If REP HISTORY is blank or missing, ignore this instruction entirely and proceed as you would for any rep with no history — do not mention its absence.
```

This has NOT been applied to the live ElevenLabs agent yet — do it manually in the ElevenLabs dashboard, then verify a real session with a rep who has 2+ prior sessions actually changes Richard's behavior before considering this feature complete end-to-end. Sandra's prompt does not need this change (rep-memory currently applies to both personas' API calls, but this action item only covers Richard per the original ask — extend to Sandra separately if desired).

**Richard's first message:** "Richard Chen. Look, I've got something on my desk right now so make this fast. What've you got?"

**DPDP retention — ElevenLabs conversation history (manual action, not automated):** the app's own session records (MongoDB) are retained 90 days per the consent text and privacy policy, but ElevenLabs separately retains conversation/call history in its own dashboard, which this codebase does not control or auto-delete. Until an automated deletion job exists, someone must manually delete ElevenLabs conversation history older than 90 days on a recurring basis (e.g. monthly) via the ElevenLabs dashboard. Add this to a recurring ops checklist — there is no code-side reminder for it.

---

## MONGODB SCHEMA

**Collection: `sessions`**

```javascript
{
  id: uuidv4(),
  userEmail: String,          // rep's email from Clerk
  orgId: String,              // email domain (e.g. "acme.com") — auto-org
  persona: String,            // "richard", "sandra", "priya", or "rakesh" — open string, not an enum; the schema itself never hardcoded the first two, see Sprint 18b
  finalScore: Number,         // 0-100
  grade: String,              // "A", "B", "C", "D", "F"
  procurementScore: Number,   // 0-100 (boardroom analyst 1)
  enablementScore: Number,    // 0-100 (boardroom analyst 2)
  verdict: String,            // one-sentence executive verdict
  mode: String,               // "voice" or "text"
  hostilityReached: Number,   // % hostility during session (40-90)
  nextHostility: Number,      // recommended starting hostility next session
  qualificationStatus: String,// "Not Qualified" | "Getting Started" | "Developing" | "Qualified" | "Elite"
  dimensions: {
    discoveryQuality: Number,
    objectionHandling: Number,
    priceDefense: Number,
    smeKnowledge: Number,
    communication: Number,
    emotionalResilience: Number
  },
  consentGiven: Boolean,       // DPDP consent overlay — true if rep accepted before this session, nullable
  consentTimestamp: String,    // ISO timestamp of consent acceptance, nullable
  createdAt: String           // ISO timestamp
}
```

**Note:** `dimensions` is nullable — older sessions may not have it. Always handle null case.
**Note:** `consentGiven`/`consentTimestamp` are nullable — sessions saved before the DPDP consent overlay (Sprint 9) don't have them.
**Note:** `orgId` is populated as of Sprint 15 (`userEmail.split('@')[1]`, set in `app/deck/page.js`'s `handleTerminate`). Sessions saved before Sprint 15 have `orgId: null` — any org-level query needs to handle that gap for historical data.

---

## API ENDPOINTS

All in `app/api/[[...path]]/route.js` unless noted:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/sessions` | GET | **Auth required.** Fetch sessions for the authenticated Clerk user only — identity comes from the server-side session, not `?email=` (any `?email=` on the request is ignored). 401 if not signed in. |
| `/api/sessions` | POST | Save a session after completion. Unchanged — still trusts `body.userEmail`/`body.orgId` as sent; not in scope for the auth fix (see Known Issues). |
| `/api/sessions` | DELETE | Delete sessions by `?email=`. Unchanged — still unauthenticated; not in scope for the auth fix (see Known Issues). |
| `/api/boardroom` | POST | 2-call Gemini pipeline (combined analyst + executive summarizer) |
| `/api/dashboard` | GET | **Auth required.** Org-level aggregate stats for the authenticated user's own org only — `orgId` is derived server-side from their email domain; any `?orgId=` on the request is ignored. 401 if not signed in. Team avg score (session-weighted), qualified/elite rep counts, team dimension averages + weakest dimension, per-rep best-ever score/hostility/qualification status/lastSession, recent sessions. |
| `/api/benchmark` | GET | **Auth required.** Fetch next hostility level for the authenticated user only (`?persona=` still accepted; `?email=` is ignored). 401 if not signed in. |
| `/api/rep-memory` | POST | **Auth required.** `{ userEmail, persona }` → last-5-session Gemini summary of rep patterns for the AI buyer to use. 401 if not signed in; 403 if `body.userEmail` doesn't match the authenticated session's email (rejected outright rather than silently corrected, since this call is billed). `{ hasHistory: false }` if <2 sessions or on any failure (never a 500). Nothing is stored — regenerated fresh every call. |
| `/api/negotiate` | POST | Text mode only (not used in voice journey) |
| `/api/coach` | POST | Standalone file — fallback single Gemini call for scoring |
| `/api/deduct-credit` | POST | Standalone file — Clerk credit deduction |

---

## QUALIFICATION FRAMEWORK

| Score | Hostility | Status |
|---|---|---|
| Any | <50% | Not Qualified |
| 70+ | 50-59% | Getting Started |
| 70+ | 60-77% | Developing |
| 70+ | 78-84% | Qualified |
| 70+ | 85-90% | Elite |

**Hostility progression:**
- Starting hostility: 40% (first session ever)
- Next session = best `hostilityReached` + 5%
- Hostility increases during a session if rep scores well
- Cap: 90%

---

## BOARDROOM PIPELINE (2 Gemini calls, ~8-12 seconds)

**Call 1 — Combined Analyst:**
Scores procurement (margin defense) + enablement (call technique) + all 6 dimensions in one call.

**Call 2 — Executive Summarizer:**
Takes combined scores → produces finalScore, grade, verdict, whatYouDidRight, whatYouDidWrong, oneThingToFixNext.

**Fallback:** If boardroom fails → falls back to `/api/coach` standalone call.

**Output stored in localStorage:**
- `repready_latest_debrief` — full boardroom JSON
- `repready_latest_transcript` — raw conversation transcript
- `repready_debrief_type` — "boardroom" or "coach"

---

## 6-DIMENSION SKILL MATRIX

1. **Discovery Quality** — asked right questions before pitching
2. **Objection Handling** — validated before responding
3. **Price Defense** — held firm on price
4. **SME Knowledge** — demonstrated product/industry knowledge
5. **Communication** — clarity, pacing, active listening
6. **Emotional Resilience** — stayed composed under pressure

---

## 5 USPs (do not build features that don't reinforce these)

1. **Progressive Difficulty** — Richard gets harder as rep improves. Nobody else has this.
2. **Qualification Journey** — Not Qualified → Elite. A defined path, not just a score.
3. **Hostility-Adjusted Scoring** — 65 at 78% hostility > 80 at 40% hostility. Context-aware scoring.
4. **Boardroom Pipeline Feedback** — Two specialist analysts + executive summarizer. Not one generic coach.
5. **India/SEA fit** — DPDP Act 2023 compliant. Mumbai data residency. Accessible pricing vs Gong/Mindtickle.

---

## SPRINT STATUS

| Sprint | Status | Notes |
|---|---|---|
| Sprint 1 — Core journey | ✅ Complete | Landing → /deck → voice → /coach working |
| Sprint 2 — Dynamic hostility | ✅ Complete | Hostility passes to Richard via ElevenLabs dynamic variables |
| Sprint 3 — Boardroom pipeline | ✅ Complete | 2-call Gemini pipeline live, 6 dimensions scoring |
| Sprint 4 — Stats pages | ✅ Complete | /my-stats live with real data; /dashboard upgraded with qualified/elite counts, team skill matrix, best-ever rep leaderboard |
| Sprint 5 — Retention mechanics | ✅ Complete | /my-stats: last-practiced display + weekly streak counter. /dashboard: 7-day inactivity warning on rep leaderboard. Weekly nudges not built (not in scope). |
| Sprint 6 — CRM integration | ⏳ Not started | Via Nango (nango.dev). Salesforce + HubSpot OAuth. |
| Sprint 7 — 60-second onboarding | ✅ Complete | /deck auto-assigns Richard Vance and shows a brief overlay for first-time users (0 MongoDB sessions); returning users unaffected |
| Sprint 8 — Clerk production keys | ⏳ Not started | Dev keys warning showing in console |
| Sprint 9 — DPDP Act compliance (Task 1) | ✅ Complete | `/deck` shows a per-session consent overlay (above the existing call-modal) before every voice session; `consentGiven`/`consentTimestamp` piggyback on the existing end-of-session `POST /api/sessions` call — no new network call at session-start. Backend stores both fields as nullable. |
| Sprint 9 — DPDP Act compliance (Task 2) | ✅ Complete | `app/privacy/page.js` updated: explicit voice recording/transcript/scores/email data collection, MongoDB Atlas (Mumbai, India) named as storage processor alongside ElevenLabs/Gemini, explicit 90-day retention section, deletion-request and privacy-question contact routed to `privacy@repready.site`, new Grievance Redressal section (DPDP Act 2023) with 30-day response commitment. Sections renumbered 1–11; `sales@repready.site` no longer used anywhere on this page. |
| Sprint 10 — SEO foundation | ✅ Complete | Added `app/robots.js` + `app/sitemap.js` (both 404'd before — likely why the site wasn't indexing). Fixed a site-wide bug: every page rendered an identical, duplicated `<link rel="canonical">` hardcoded in `app/layout.js`, always pointing to the homepage even on `/pricing`/`/privacy`/`/terms` — removed the hardcoded tag, gave those 3 pages correct per-page canonicals. Removed `images.unoptimized: true` from `next.config.js` (was disabling Vercel's image optimization). Trimmed homepage title/description into optimal length. `og-image.png` is still missing (referenced in OG/Twitter meta, 404s) — needs a real design asset, not fixed. `/deck`, `/my-stats`, `/dashboard`, `/coach` still can't have their own page metadata (Client Components) — needs a server/client split, not attempted. |
| Sprint 11 — Landing page redesign ("The Interrogation Room") | ✅ Complete | Full visual redesign of `app/page.js` only — nothing else touched (`app/layout.js`, `/deck`, `/coach`, `/api`, auth/Paddle files untouched). Black/gold/red/cyan theme, Space Grotesk headlines loaded via `@import` inside the page's own `<style>` tag (redundant with `app/layout.js`'s `<link>` load, by design — layout.js was off-limits). Removed `framer-motion` + `lucide-react` usage from this page (page bundle dropped 50.2 kB → 7.18 kB); replaced with plain CSS keyframes/transitions + `IntersectionObserver` — no new npm packages. 11 sections: hero (cursor-spotlight, disabled on touch via `matchMedia('(pointer: coarse)')`), simulation preview (animated hostility meter + live score counter + waveform bars), scroll-triggered stat counters, 3-step "how it works", persona cards (Richard/Sandra, hover lift), 5-stage qualification journey (lights up on scroll), 6-bar skill matrix (fills on scroll, Price Defense flagged weak in red), India/DPDP section (gold background), pricing (3 tiers + monthly/annual toggle), final CTA (spotlight returns), footer. Old left sidebar (Dash/Coach shortcuts to protected routes) removed — brief's nav spec only calls for Pricing + Sign In, and a sidebar into gated pages doesn't belong on an anonymous marketing page. "Book a Demo" now points to `mailto:demo@repready.site` (brief-specified; was `sales@repready.site` before). Clerk `/sign-in` link verified still functional; `npm run build` clean; local dev-server render verified for `/`, `/pricing`, `/sign-in`. `og-image.png`/favicon still missing (pre-existing, out of scope for this task). |
| Sprint 12 — Landing page v2 (CRO rebuild, single-buyer) | ✅ Complete | Full rebuild of `app/page.js` (v2 of Sprint 11's redesign) targeting a single buyer (VP/Head of Sales) with evidence-based copy instead of assertions — nothing else touched. Cut from 11 sections down to exactly 6: hero (no DPDP/Mumbai/BFSI mentions), team skill matrix (Objection Handling flagged weakest in red, 42%), a real session-report card (score/grade/hostility, procurement/enablement, what-you-did-right/wrong, one-thing-to-fix, 6-dim bars, link to `/coach`), side-by-side demo transcript (red-border losing call vs. green-border winning call, same rep session 1 vs. session 4), 4-tier pricing (Starter/Growth/Scale/Enterprise, per-seat price *decreases* with tier — intentional volume pricing, not a typo) with monthly/annual toggle, final CTA. Removed gold accent entirely — cyan (`#22D3EE`) is now the only accent color; red/green kept as functional (bad/good) indicators only. Removed cursor-spotlight, persona cards, qualification-journey section, numbers section, India-only section, and the left sidebar — all cut to hit the tighter 6-section spec. All demo/booking CTAs now point to `https://cal.com/vrushal-kitke-lg9txr/30min` (real external booking link) instead of `mailto:`; zero `mailto:` links anywhere on the page now, including footer "Contact" (previously `sales@repready.site`, then `demo@repready.site`). One DPDP/Mumbai compliance mention total, as plain text (not a link) below pricing, naming `privacy@repready.site` for deletion requests without making it clickable. `npm run build` clean; local dev-server render verified for `/`, `/sign-in`, `/pricing`, `/privacy`, `/terms`. Built on top of Sprint 11 (merged to `main` as PR #11 before this sprint started). |
| Sprint 13 — Fix landing page animations (robustness) | ✅ Complete | Diagnosed all 5 suspected causes on `app/page.js` (only file touched) against the real merged code (Sprint 12's version): (1) IntersectionObserver instantiated server-side — **ruled out**, every `new IntersectionObserver` call is already inside a `useEffect`. (2) useEffect missing cleanup/wrong deps — **ruled out**, all 3 effect sites (`useRevealOnScroll`, `Counter`, `SkillBar`) already had `obs.disconnect()` cleanup and correct dependency arrays. (3) CSS transition classes not applied correctly — **confirmed, real bug**: the `.reveal` class defaulted to `opacity: 0`, meaning all 5 section-reveal blocks stayed permanently invisible if the IntersectionObserver ever failed to fire (JS error elsewhere, slow/failed hydration, etc.) — content visibility was gated behind JS success. (4) Google Fonts/Space Grotesk fallback — **ruled out**, `FONT_HEAD` already has a full system-font fallback chain; a failed `@import` degrades to a visible fallback font, never blank text. (5) Tailwind dynamic class-name stripping — **does not apply**, this file uses zero Tailwind utility classes for animation state (grepped for `opacity-`, `translate-y-`, `transition-all`, `duration-`, and any `className={\`...\`}` interpolation — none found; all animation classes are custom CSS defined in the page's own `<style>` block, which Tailwind's scanner never touches). **Fix applied:** `.reveal` now defaults to `opacity: 1` with only the `translateY(28px)` offset gated behind JS — verified via server-rendered HTML (no client JS) that all section text is fully visible pre-hydration; the entrance animation is now a pure enhancement, never a visibility gate, per the robustness rule. Skill-matrix bars, score counter, and the annual pricing toggle were checked and left as-is — none of them hide real content (bars/counters default to a real 0-state number, not blank; pricing toggle is plain React state, not IO-gated). `npm run build` clean. |
| Sprint 14 — API auth hardening | ✅ Complete | Added Clerk server-side auth (`auth()`/`currentUser()` via a new `getAuthedEmail()` helper) to `GET /sessions`, `GET /dashboard`, `GET /benchmark`, `POST /rep-memory` in `app/api/[[...path]]/route.js` — the 4 endpoints that previously trusted client-supplied `?email=`/`?orgId=`/body `userEmail`. See Known Issue #5 (now resolved) for full detail. Found and documented, but did not fix (out of scope): `POST`/`DELETE /api/sessions` still unauthenticated (5a), `/api/dashboard` has no rep-vs-manager role check (5b), and real sessions were being saved with `orgId: null` (5c, fixed next in Sprint 15). |
| Sprint 15 — Populate `orgId` on session save | ✅ Complete | One-line, single-file fix to `app/deck/page.js`'s `handleTerminate`: added `orgId: userEmail ? userEmail.split('@')[1] : null` to the `POST /api/sessions` body, closing the gap found in Sprint 14 (5c) where every real session was saved with `orgId: null` because the client never sent one. Verified via a `git diff` that this was the only line changed; `npm run build` clean. Historical sessions saved before this sprint still have `orgId: null` (see MongoDB Schema note). |
| Sprint 16 — Visual rework (Recro/Paperclip/Amplemarket-inspired) | ✅ Complete | Same 6-section `app/page.js` structure, elevated execution — only file touched, built incrementally (6 stages, `npm run build` after each). Hero: bigger headline (`clamp(44px,7.5vw,84px)`, tighter `line-height: 1.02`), more whitespace, and a slow-looping ticker of fabricated example activity lines below the CTA row (static array, no live DB query, seamless CSS `translateX` marquee, masked edges) — proof-of-activity motion rather than decoration. Skill matrix: tightened internal bar spacing (20px→16px). Session report: wrapped in a subtle browser-chrome frame (3 muted dots + mock URL bar) so it reads as an embedded product screenshot; carried forward the "Illustrative example" label from the not-yet-merged copy-fix branch since it wasn't on `main` yet. Demo cards: added a soft colored shadow (red/green tint matching each card) for more elevation. Pricing: more section/card padding and gap, Growth ("Most Popular") tier now has extra padding + a cyan glow shadow for clearer emphasis — no changes to tiers, copy, or prices. General whitespace pass: sections 2/3/4 padding 100px→120px to match pricing/hero/final-CTA's more generous spacing. A Trust Signals section with `[FOUNDER NAME]`/`[FOUNDER BIO]`/`[FOUNDER PHOTO]` placeholders was built and then **removed at the user's request** (no founder content wanted) — pricing now flows directly into the final CTA, no placeholder text shipped anywhere. No CTA, link, pricing-value, or copy changes beyond the carried-forward label. Dev-render verified all remaining new elements present (ticker, chrome-bar label) and other routes (`/sign-in`, `/pricing`) unaffected. |
| Sprint 17 — Fix hydration mismatch in `app/page.js` | ✅ Complete | Root-caused and fixed the 100%-reproducible React hydration mismatch first found during Sprint 16 browser testing — only `app/page.js` touched (2-line change). **Root cause, empirically confirmed (not guessed):** the page's inline `<style>{`...`}</style>` block contains a literal apostrophe in `@import url('https://fonts.googleapis.com/...')`. React's server-side renderer HTML-entity-escapes all JSX text-child content (including inside `<style>`), so the SSR'd HTML sent to the browser contained the literal 6-character string `&#x27;` instead of `'` — confirmed directly via `curl` + raw-HTML inspection of the SSR output. But `<style>` (like `<script>`/`<textarea>`) is an HTML5 "raw text element": browsers never decode entities inside it, so the parsed DOM text node was stuck with `&#x27;` verbatim. React's client-side hydration render, by contrast, computes the same JSX into a real string with an actual `'` (client-side text-node construction doesn't go through the SSR HTML-escaping step) — the two don't match character-for-character, so React discards the SSR'd DOM and does a full client re-render on every single load. **Fix:** switched the tag from a JSX text child (`<style>{cssString}</style>`) to `<style dangerouslySetInnerHTML={{ __html: cssString }} />` — this is the standard React API for exactly this raw-content case (used by Next.js's own docs/examples for inline `<style>`/`<script>`), not a suppression hack: it bypasses the entity-escaping step entirely so SSR output and client output are byte-identical, rather than hiding the warning with `suppressHydrationWarning` or a `Suspense` boundary. **Verification:** re-confirmed via `curl` that the SSR HTML now contains a literal `'` (zero `&#x27;` occurrences); ran the same Playwright + pre-seeded `__clerk_db_jwt`-cookie harness from the Sprint 16 testing session across 4 fresh page loads — zero hydration warnings on all 4 (previously 100% reproducible, ~6 hydration-related console messages every single load). Re-verified in the same harness that the ticker animation, skill-bar scroll-fill, and session-report score counter (0→73) all still behave identically to the prior confirmed-working state — no regressions. `npm run build` clean. |
| Sprint 18b — Add Priya Malhotra & Rakesh Iyer personas (branch `feature/india-personas`) | ✅ Complete (additive, not yet callable end-to-end) | **Numbering note:** built from `origin/main` in parallel with the not-yet-merged `redesign/light-theme` branch, which separately used "Sprint 18" for its own entry — whichever branch merges first keeps its number as-is; the other should be renumbered by hand at merge time to avoid a duplicate "Sprint 18" in this file. Added two new **additive** personas alongside the existing Richard/Sandra — neither of the originals was touched beyond generalizing code that was hardcoded to assume only two personas existed. **`app/deck/page.js`:** added `PRIYA_ID`/`RAKESH_ID` constants — both **placeholder** agent IDs (`agent_PLACEHOLDER_PRIYA_TBD` / `agent_PLACEHOLDER_RAKESH_TBD`), clearly commented as non-functional until the real ElevenLabs `agent_*` IDs are supplied; starting a session against either will fail until then. Extended `PERSONA_MAP` (agent ID → persona string) and `bestScores` state/localStorage-loading to include both new IDs, matching the existing Richard/Sandra pattern exactly. Added two new persona cards to the selection grid, styled identically to the Richard/Sandra cards (same grid, same border/hover/button treatment) — the 2-column grid naturally becomes 2×2 with no layout code changes needed. Neither new persona has a photo asset yet (`/Priya.png`/`/Rakesh.png` don't exist in `public/`); each card's `<img>` has an `onError` fallback to a styled initials block (PM/RI) so a missing photo shows a clean placeholder instead of a broken-image icon — this fallback pattern is new and only applied to the two new cards, Richard/Sandra's `<img>` tags are untouched. Each new card's role/title shows "Role — TBD" rather than an invented job title, since the user is writing these personas' real system prompts separately and a fabricated title could conflict with that content. **Found and fixed a real hardcoded-to-two bug while generalizing:** the live transcript's speaker label (`activeAgent === RICHARD_ID ? 'VANCE' : 'CHEN'`) would have mislabeled every Priya/Rakesh line as "CHEN" — replaced the ternary with a `PERSONA_DISPLAY_NAME` lookup object keyed by agent ID (Richard/Sandra's output is unchanged: still 'VANCE'/'CHEN'). **`app/api/[[...path]]/route.js`:** found and fixed a second, more serious hardcoded-to-two bug in the live `/api/boardroom` scoring endpoint (the real 2-call Gemini pipeline that scores every voice session) — `const personaContext = persona === 'richard' ? '...' : '...'` meant every non-Richard persona, including brand-new ones, silently got scored against **Sandra's** buyer context ("IT Director... SOC 2, SAML/SSO"), which would have corrupted Priya/Rakesh session scoring silently (no error, just wrong grading). Replaced with a `PERSONA_CONTEXT` lookup object covering all 4 personas plus a generic fallback for any unrecognized value; Richard/Sandra's context strings are byte-identical to before. Priya/Rakesh's context entries are placeholder text pending their real buyer scenario. **Checked and confirmed already persona-agnostic, no changes needed:** `/api/dashboard` (aggregates by `userEmail`, never branches on persona name), `/api/sessions` (persona stored/read as an opaque string), `/api/benchmark` (persona is a passthrough query param), `/api/rep-memory` (persona is a passthrough body field), `app/dashboard/page.js` (no persona-name references at all), `app/coach/page.js` (same). **MongoDB schema:** confirmed the `persona` field was always a plain string, never an enum — no migration needed for existing "richard"/"sandra" data, `"priya"`/`"rakesh"` are accepted immediately. **Found but explicitly left untouched (out of file scope for this task, flagged for a separate task):** `app/my-stats/page.js` has its own `PERSONA_LABELS` map (`{ richard: {...}, sandra: {...} }`) for the persona-breakdown display; it already has a safe fallback (`PERSONA_LABELS[persona] || { name: persona, title: '' }`) so it won't crash or mislabel for Priya/Rakesh — it'll just show the raw string "priya"/"rakesh" until someone adds entries there, a cosmetic gap, not a bug. `app/api/[[...path]]/route.js` also has a completely separate `PERSONAS` object (with full system prompts) and an "Invalid persona. Choose 'richard' or 'sandra'" error message, but both belong to `POST /api/negotiate`, the old **text-mode** endpoint — per `REPREADY_CONTEXT.md`'s own constraints ("do not add text mode," `/api/negotiate` is "not used in voice journey") this is legacy/parallel code in the same spirit as `/simulate`, left alone. `app/simulate/page.js` has its own hardcoded `PERSONAS` object too — that whole file is the standing "OLD page, do not touch" exception, left alone. **Item 5 — hardcoded "2 personas" count, found, not changed (pricing/packaging decision, not a code decision):** `app/page.js`'s pricing section lists `'2 personas'` as a Starter-tier feature bullet, and `app/pricing/page.js` (a separate `/pricing` route) lists `'Voice personas (Richard & Sandra)'` and `'Richard & Sandra voice personas'` by name in its tier feature lists. Neither file was touched — both are outside this task's allowed file list (`/deck`, session-schema API code, this file), and whether "Starter = 2 personas" should now mean "any 2 of 4" or something else is a pricing/packaging call, not a code default to assume. **Verification:** `npm run build` clean after each file change. Live authenticated browser-render of `/deck` was **not possible** in this sandbox — `/deck` is Clerk-`auth.protect()`-gated, and with dummy dev keys the middleware 307-redirects to a real `https://dummy.accounts.dev/sign-in` URL that the sandbox's network egress policy blocks (confirmed via Playwright network trace: `BAD RESP: 403 https://dummy.accounts.dev/sign-in?...`) — this is the same pre-existing dummy-Clerk-key/proxy limitation documented in earlier sprints for protected routes, not a regression from this change (the unprotected `/` route has no such issue). Verified instead via a full manual diff review plus `npm run build`, which does catch JSX/syntax/type errors. **Before this branch is production-ready:** replace `PRIYA_ID`/`RAKESH_ID` with real ElevenLabs agent IDs, replace "Role — TBD" with real titles, replace the `PERSONA_CONTEXT` placeholder strings for priya/rakesh with real buyer scenarios, add `/Priya.png`/`/Rakesh.png` if photos are wanted (falls back gracefully if not), and decide the Starter-tier "2 personas" pricing question above. |

---
## KNOWN ISSUES (fix these before adding new features)

1. **Richard says stage directions aloud** — `[impatient]`, `[skeptical]` etc. Root cause: Claude Sonnet 4.6 LLM in ElevenLabs generates stage directions. Fix: switch Richard's LLM to ElevenLabs-hosted model in ElevenLabs dashboard.

2. **Dead code** — duplicate `getQualificationStatus` function in `app/api/[[...path]]/route.js` (search for the function definition). The active one is in `app/deck/page.js`. Safe to delete from route.js.

3. **Clerk dev keys in production** — console warning: "afterSignInUrl is deprecated". Fix: switch to production Clerk keys + replace `afterSignInUrl` with `forceRedirectUrl` in layout.js.

4. **Personal best discrepancy (design choice, not a bug now)** — `/deck` shows personal best from localStorage (device-local). `/my-stats` and `/dashboard` read best-ever score from MongoDB (authoritative, cross-device). Now that MongoDB is confirmed working, these can genuinely disagree if a rep switches devices/browsers — localStorage isn't reliable per the constraints below. Consider migrating `/deck`'s personal-best display to MongoDB too.

5. ~~No server-side auth on `/api/sessions`, `/api/dashboard`, `/api/benchmark`, `/api/rep-memory`~~ — ✅ Fixed. All 4 now require a valid Clerk session (`auth()`/`currentUser()` from `@clerk/nextjs/server`); identity/org is derived server-side from the session, never trusted from `?email=`/`?orgId=`/body `userEmail`. 401 if unauthenticated; `/api/rep-memory` additionally 403s if `body.userEmail` doesn't match the session (it's the only one of the 4 that rejects on mismatch rather than silently overriding, since it triggers a billed Gemini call).

5a. **Still open, discovered while fixing #5, same vulnerability class, explicitly out of scope for that fix:** `DELETE /api/sessions?email=xxx` remains fully unauthenticated — anyone who knows/guesses an email can delete that rep's session history. `POST /api/sessions` (session save) also still trusts `body.userEmail`/`body.orgId` as sent by the client, unverified. Neither was in the 4-endpoint list for the auth fix; needs its own pass.

5b. **`/api/dashboard` has no rep-vs-manager role check** — any authenticated user can view their own org's aggregate dashboard data (any rep can see the whole team's numbers, not just managers). Checked both Clerk user metadata and the MongoDB schema — neither has a role/manager field today, so no permission model was invented as part of the auth fix. Needs a deliberate decision (e.g. a `role` field in Clerk `publicMetadata`, or an org-admin list) before this is properly scoped to managers only.

5c. ~~Discovered while fixing #5 — sessions are saved with `orgId: null`~~ — ✅ Fixed in Sprint 15. `app/deck/page.js`'s `handleTerminate` now sends `orgId: userEmail.split('@')[1]` when saving a session. Sessions saved before Sprint 15 still have `orgId: null` (see MongoDB Schema note) — the dashboard's org-level aggregates will only include sessions from Sprint 15 onward for any given org.

6. **`og-image.png` missing** — referenced in OG/Twitter meta tags in `app/layout.js` but doesn't exist in `public/` (404s). Broken social share preview image. Needs a real 1200×630 branded design asset.

7. **`/deck`, `/my-stats`, `/dashboard`, `/coach` can't have their own page metadata** — all four are Client Components (`'use client'`), and Next.js App Router forbids `metadata` exports in Client Components. They inherit the homepage's title/description/canonical from `app/layout.js`. Fixing this needs a server-component wrapper + client child split per page — deliberately not attempted on `/deck` given the standing rule to never restructure that file's structure.

---

## P0 PRIORITY (do not deviate from this order)

1. ~~Fix MongoDB~~ — ✅ Complete July 13, 2026
2. Use skills library for all remaining sprints — no more manual back-and-forth
3. RAG for Richard/Sandra — code side ✅ complete, but built differently than originally scoped: instead of an ElevenLabs Knowledge Base upload, it's a `POST /api/rep-memory` endpoint that summarizes a rep's last 5 sessions (from MongoDB, via Gemini 2.5 Flash) and injects it as a `{{rep_history}}` dynamic variable at call start. **Still needs a manual ElevenLabs dashboard edit to Richard's system prompt** — see "ACTION NEEDED" under ElevenLabs Agents above. Not yet wired into Sandra's prompt.

---

## TOOLS & INTEGRATIONS

| Tool | Purpose | Status |
|---|---|---|
| ElevenLabs | Voice agents (Richard + Sandra) | ✅ Active |
| MongoDB Atlas | Sessions, benchmarks, org data | ✅ Active |
| Clerk | Auth, credits in privateMetadata | ✅ Active (dev keys) |
| Paddle | Payments | ✅ Active — DO NOT TOUCH without flagging |
| Nango | CRM integration (Sprint 6) | ⏳ Not started |
| Claude Code | Build agent via skills library | 🔄 Setting up |
| Vercel | Deployment (Hobby plan, 10s timeout) | ✅ Active |

---

## CONSTRAINTS (never violate these)

- **Vercel Hobby 10s timeout** — all API calls must complete in under 10 seconds. Boardroom pipeline is 2 calls not 3 for this reason.
- **Do not touch Paddle** — payment flow is working. Any change risks breaking real user payments.
- **Do not touch `/simulate`** — old page, not part of user journey, ignore it.
- **Do not add text mode** — RepReady is voice-only. It is an enterprise training simulator, not a chatbot.
- **localStorage is not reliable** — always save important data to MongoDB. localStorage is device-local and clears.
- **`dimensions` can be null** — older sessions don't have it. Always null-check before rendering skill matrix.

---

## CONTEXT FOR CLAUDE CODE SESSIONS

When starting a Claude Code session, tell it:
1. Read this file first
2. Check `app/api/[[...path]]/route.js` for the catch-all API pattern
3. Check `app/deck/page.js` for the main voice simulation logic
4. Never touch Paddle-related code
5. Always update this file after completing a task

---

## HOW TO UPDATE THIS FILE

After every sprint task, update:
- Sprint status table
- Known issues list (remove fixed, add new)
- Any new API endpoints
- Any schema changes
- Any new environment variables

Keep it under 200 lines of actual content. Remove resolved issues. This file is a living document.
