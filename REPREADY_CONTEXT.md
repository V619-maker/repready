# REPREADY_CONTEXT.md
# Single source of truth for RepReady — updated after every sprint task
# Last updated: September 6, 2026 (Sprint 33 — protected-route matcher fix; Sprint 32 — CORS/
# credentials contradiction fix; Sprint 31 — clickjacking header fix; Sprint 30 — vendored
# compound-engineering-plugin skills — all landed the same day. See those entries for detail.
# Prior major update: September 2, 2026 full codebase audit, Sprint 27)

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
| `ELEVENLABS_API_KEY` | ElevenLabs Conversational AI API — used by `/api/cron/purge-conversations` (retention purge, Sprint 27) |
| `CRON_SECRET` | Bearer-token auth for `/api/cron/purge-conversations` — Vercel Cron sends it automatically when set; if unset, the endpoint 401s everything (fails safe, but silently — verify it's actually set in Vercel) |
| `ELEVENLABS_RETENTION_LIVE` | `"true"` to let the retention purge actually delete ElevenLabs conversations; unset/anything else = dry-run (default, logs only, deletes nothing) |
| `CORS_ORIGINS` | Overrides the `Access-Control-Allow-Origin` response header (`next.config.js`); unset defaults to `*` on every route — see Known Issues, this is currently a real gap |

**Undocumented until this audit (Sprint 27):** the four rows above were already live in code (added across Sprints 24–27) but had never been added to this table — a violation of this file's own "update env vars after every task" rule. Verify all four are actually set correctly in Vercel; this file cannot confirm that from the codebase alone.

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
- `app/demo/page.js` — `redirect('/deck')` as of Sprint 28. Used to render a broken, off-brand text-mode chat simulator (`components/RepReadyCoach.jsx`, now unreferenced dead code) that was publicly indexable despite violating the voice-only constraint — found in the Sprint 27 audit (Known Issue 0a), fixed same pattern as `/pricing`.
- `app/pricing/page.js` — as of Sprint 24, just `redirect('/#pricing')`; the real pricing lives on the landing page only, single-sourced

---

## ElevenLabs AGENTS

| Agent | ID | Role |
|---|---|---|
| Richard Vance | `agent_8601kmk3maq9f9a9csym74aj7s4e` | VP Procurement, Meridian Logistics |
| Sandra Chen | `agent_0301kmsnhr7tf11b62bvd7vsw9qq` | Head of IT, 800-person financial firm |
| Priya Malhotra | `agent_5701kzmwc61jfq59zjnvrvb1pxmt` | TBD — system prompt written directly in the ElevenLabs dashboard; role/company/first message not yet documented here |
| Rakesh Iyer | `agent_4901m021sybbenebrf04zntdad30` | TBD — same as Priya; system prompt written outside this repo |

**Priya and Rakesh are now callable (added Sprint 19, real agent IDs swapped in Sprint 20).** `app/deck/page.js`'s `PRIYA_ID`/`RAKESH_ID` placeholders have been replaced with the real ElevenLabs agent IDs above. Their persona cards still show "Role — TBD" in the UI, and this table still doesn't have their role/company/first-message details — that documentation gap is separate from callability and remains open.

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

**DPDP retention — ElevenLabs conversation history:** partially automated as of Sprint 27 — see `/api/cron/purge-conversations` in the API table above (daily Vercel Cron, dry-run by default). Until someone verifies a real dry-run response against a live ElevenLabs account and flips `ELEVENLABS_RETENTION_LIVE=true`, this is still not actually deleting anything — treat the manual monthly-deletion process as still required until that verification happens.

---

## MONGODB SCHEMA

**Collection: `sessions`**

```javascript
{
  id: uuidv4(),
  userEmail: String,          // rep's email from Clerk
  orgId: String,              // email domain (e.g. "acme.com") — auto-org
  persona: String,            // "richard", "sandra", "priya", or "rakesh" — open string, not an enum; the schema itself never hardcoded the first two, see Sprint 19
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
| `/api/sessions` | POST | Save a session after completion. Still trusts `body.userEmail`/`body.orgId` as sent (unauthenticated — see Known Issue 5a), but as of Sprint 28 requires a `transcript` field and rejects (400) a `finalScore` that doesn't roughly match an independent Gemini re-scoring of it (see Known Issue 0b). |
| `/api/sessions` | DELETE | **Auth required (Sprint 28).** Deletes the authenticated user's own sessions only; any `?email=` on the request is ignored. 401 if not signed in. |
| `/api/boardroom` | POST | 2-call Gemini pipeline (combined analyst + executive summarizer) |
| `/api/dashboard` | GET | **Auth required.** Org-level aggregate stats for the authenticated user's own org only — `orgId` is derived server-side from their email domain; any `?orgId=` on the request is ignored. 401 if not signed in. Team avg score (session-weighted), qualified/elite rep counts, team dimension averages + weakest dimension, per-rep best-ever score/hostility/qualification status/lastSession, recent sessions. |
| `/api/benchmark` | GET | **Auth required.** Fetch next hostility level for the authenticated user only (`?persona=` still accepted; `?email=` is ignored). 401 if not signed in. |
| `/api/rep-memory` | POST | **Auth required.** `{ userEmail, persona }` → last-5-session Gemini summary of rep patterns for the AI buyer to use. 401 if not signed in; 403 if `body.userEmail` doesn't match the authenticated session's email (rejected outright rather than silently corrected, since this call is billed). `{ hasHistory: false }` if <2 sessions or on any failure (never a 500). Nothing is stored — regenerated fresh every call. |
| `/api/admin/reps` | GET | **Manager-only (Sprint 29).** Lists the caller's org's reps (same "at least one session" scoping as `/api/dashboard`, via a newly-shared `groupRepsFromSessions()` helper) plus each rep's current Clerk `role`. 401 if not signed in, 403 if not `role: 'manager'`. A rep with no matching Clerk account (possible since `POST /api/sessions` is unauthenticated — see 5a) gets `role: null`, shown as "unresolved" in the UI rather than silently guessed. |
| `/api/admin/reps` | POST | **Manager-only (Sprint 29).** `{ targetEmail, newRole: 'rep'\|'manager' }` — promotes/demotes a rep by writing `publicMetadata.role` via `clerkClient`. 401/403 (not manager, targeting self, or targeting outside caller's own org)/400 (bad body)/404 (email doesn't resolve to a Clerk user)/500. This is now the actual way `role: 'manager'` gets set — see Known Issue 5b. |
| `/api/negotiate` | POST | Text mode only (not used in voice journey) |
| `/api/coach` | POST | Standalone file — fallback single Gemini call for scoring |
| `/api/deduct-credit` | POST | Standalone file — Clerk credit deduction |
| `/api/persona-access` | GET/POST | **Undocumented until this audit.** Starter-tier persona gating (Sprint 26): locks a Starter-tier rep into their first 2-of-4 chosen personas via Clerk `publicMetadata.selectedPersonas`; `app/deck/page.js` calls it to compute `isLocked`/`handleSelectPersona`. |
| `/api/cron/purge-conversations` | GET | **Undocumented until this audit.** Standalone file (Sprint 27), wired into `vercel.json` as a daily 3am Vercel Cron job. DPDP 90-day retention purge for ElevenLabs conversation history (closes the manual-ops gap noted below under ElevenLabs Agents). Requires `Authorization: Bearer <CRON_SECRET>`; defaults to dry-run (`ELEVENLABS_RETENTION_LIVE` unset). **Not yet verified against live ElevenLabs API responses** — the code comments say the endpoint/field/pagination shapes were written from general knowledge, not confirmed docs. Do a dry-run check before ever setting `ELEVENLABS_RETENTION_LIVE=true`. |
| `/api/test` | GET | **No auth, no rate limit.** Triggers a live (billed) Gemini call and echoes the API key prefix in the response — see Known Issues. |

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
| Sprint 18 — Light-theme editorial redesign (branch `redesign/light-theme`) | ✅ Complete | Full palette + typography swap of `app/page.js` from the dark cyan/black theme to a warm-cream/navy editorial theme, matched from two approved "Claude Design" reference screenshots (no image files available for pixel-sampling, so colors were set by close visual judgment against the screenshots, not exact-sampled). New constants replace the old `CYAN`/`RED`/`GREEN`/`ZINC`: `CREAM` (`#F7F1E4`) / `CREAM_ALT` (`#F0E8D6`) background, `NAVY` (`#1B2A4A`) accent (replaces cyan everywhere — CTAs, links, skill-bar fill, borders), `NAVY_DEEP` (`#101A30`) for the final-CTA section background, `INK` (`#1D1912`) primary text, `STONE` (`#726B5C`) secondary text, muted `RED` (`#AC3A2C`) / `GREEN` (`#3D7A4C`) kept as the same functional bad/good indicators. Added `Newsreader` (Google Fonts, italic-capable serif) as `FONT_DISPLAY` for all headlines/scores, replacing Space Grotesk for that role; body/nav/mono fonts unchanged. Headline now italicizes + underlines "costing your team deals" per the reference. Hero restructured from single-column-centered to a two-column grid (`.rr-hero-grid`, collapses to 1 column under 860px): left is headline/copy/CTAs/ticker, right is a new `ChromeFrame`-wrapped session-preview card (waveform + "Richard Vance · Hostile Buyer · Turn 7 of 12" meta + count-up "73/100" + `GradePill` "Grade B") — explicitly no photo, per instruction. The existing full session-report section (`#session-report`) was kept as a separate, unchanged section (not merged into the new hero card) — the browser-chrome-frame pattern now appears twice via a shared `ChromeFrame` component. Demo comparison section gained a "LIVE CALL TRANSCRIPT" mono label + colored dot per card, "Session 1 · 31/100 · Grade F" (red) / "Session 4 · 73/100 · Grade B" (green) headers, and the final line of each transcript is now selectively colored red/green (previously every line was colored by fixed speaker role). New motion, all built from scratch (previously only described, not implemented): `Waveform` component (28 CSS-animated bars, deterministic `Math.sin`-based heights — not `Math.random()`, to avoid an SSR/client hydration mismatch); hero score count-up wired into the new `Counter` component (already existed, reused); `TranscriptLine` component gives the demo transcripts a staggered per-line reveal via individual `IntersectionObserver`s + `transition-delay: index * 0.09s`; a `useParallax` hook applies a `translateY(scrollY * 0.18)` transform (via direct ref/style mutation in a rAF-throttled scroll listener, not React state, to avoid re-render cost) to a decorative radial-gradient blob behind the hero; `.rr-navy-btn`/`.rr-link-btn`/`.rr-card-hover` CSS classes add hover lift/opacity-shift to buttons and cards. All new motion follows the Sprint 13 robustness rule: every animated element defaults to `opacity: 1` with only `transform`/position animated, so content stays visible even if JS never runs — verified by inspecting SSR HTML output. **Bug found and fixed during this task:** the new `.rr-hero-grid`/`.rr-grid-2/3/4` CSS caused a horizontal overflow on mobile (390px viewport) — grid items don't shrink below their content's intrinsic min-width by default, so long text/wide cards pushed past the viewport edge and got clipped by `overflowX: hidden`. Fixed by changing every grid's column tracks from `1fr` to `minmax(0, 1fr)`, which lets grid items shrink to fit; re-verified `document.documentElement.scrollWidth` matches viewport width exactly (390px) with no clipped content. **Verification performed:** `npm run build` clean (using a locally-exported dummy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` for the build only, not committed anywhere — this sandbox has no real Clerk keys, and the same "Missing publishableKey" prerender error reproduces identically on unmodified `origin/main`, confirming it's a pre-existing environment gap, not something this task introduced); Playwright + pre-seeded `__clerk_db_jwt` cookie harness (same technique as Sprint 16/17) confirmed zero hydration warnings across a fresh load, correct navy/cream colors on nav/CTA/counter/skill-bars, ticker still animating (`rr-ticker` keyframe, position confirmed moving), score counter reaching 73, skill bars filling to their correct widths/colors (weak skill still red), demo card borders correctly red/green, `Newsreader` confirmed as the computed `h1` font-family, annual/monthly pricing toggle confirmed flipping both the track/knob styling and the displayed price text on click, and desktop + mobile (390×844) screenshots taken of hero/session-report/demo/pricing/final-CTA sections for visual comparison against the reference screenshots. No routing, Clerk auth, CTA destinations (`BOOK_DEMO_URL`, `/sign-in` hrefs), copy, pricing tiers/amounts, or underlying section data/props were touched — only presentation (colors, fonts, layout, motion). The Sprint 17 hydration fix (`dangerouslySetInnerHTML` for the inline `<style>` block) was preserved as-is; the new `@import url('...')` for Newsreader uses the same pattern and re-confirmed zero hydration warnings. Note: a separate, still-unmerged dark "PRESSURE/BRASS/SLATE" palette redesign exists on branch `redesign/impeccable-palette` (commit `8df28e1`) as an open, parallel PR — this light-theme work supersedes it as the currently-approved direction but the old branch was left untouched; only the user should decide whether to close or discard it. |
| Sprint 19 — Add Priya Malhotra & Rakesh Iyer personas (branch `feature/india-personas`) | ✅ Complete (additive, not yet callable end-to-end at time of writing — see Sprint 20) | Added two new **additive** personas alongside the existing Richard/Sandra — neither of the originals was touched beyond generalizing code that was hardcoded to assume only two personas existed. **`app/deck/page.js`:** added `PRIYA_ID`/`RAKESH_ID` constants — both **placeholder** agent IDs (`agent_PLACEHOLDER_PRIYA_TBD` / `agent_PLACEHOLDER_RAKESH_TBD`), clearly commented as non-functional until the real ElevenLabs `agent_*` IDs are supplied; starting a session against either will fail until then. Extended `PERSONA_MAP` (agent ID → persona string) and `bestScores` state/localStorage-loading to include both new IDs, matching the existing Richard/Sandra pattern exactly. Added two new persona cards to the selection grid, styled identically to the Richard/Sandra cards (same grid, same border/hover/button treatment) — the 2-column grid naturally becomes 2×2 with no layout code changes needed. Neither new persona has a photo asset yet (`/Priya.png`/`/Rakesh.png` don't exist in `public/`); each card's `<img>` has an `onError` fallback to a styled initials block (PM/RI) so a missing photo shows a clean placeholder instead of a broken-image icon — this fallback pattern is new and only applied to the two new cards, Richard/Sandra's `<img>` tags are untouched. Each new card's role/title shows "Role — TBD" rather than an invented job title, since the user is writing these personas' real system prompts separately and a fabricated title could conflict with that content. **Found and fixed a real hardcoded-to-two bug while generalizing:** the live transcript's speaker label (`activeAgent === RICHARD_ID ? 'VANCE' : 'CHEN'`) would have mislabeled every Priya/Rakesh line as "CHEN" — replaced the ternary with a `PERSONA_DISPLAY_NAME` lookup object keyed by agent ID (Richard/Sandra's output is unchanged: still 'VANCE'/'CHEN'). **`app/api/[[...path]]/route.js`:** found and fixed a second, more serious hardcoded-to-two bug in the live `/api/boardroom` scoring endpoint (the real 2-call Gemini pipeline that scores every voice session) — `const personaContext = persona === 'richard' ? '...' : '...'` meant every non-Richard persona, including brand-new ones, silently got scored against **Sandra's** buyer context ("IT Director... SOC 2, SAML/SSO"), which would have corrupted Priya/Rakesh session scoring silently (no error, just wrong grading). Replaced with a `PERSONA_CONTEXT` lookup object covering all 4 personas plus a generic fallback for any unrecognized value; Richard/Sandra's context strings are byte-identical to before. Priya/Rakesh's context entries are placeholder text pending their real buyer scenario. **Checked and confirmed already persona-agnostic, no changes needed:** `/api/dashboard` (aggregates by `userEmail`, never branches on persona name), `/api/sessions` (persona stored/read as an opaque string), `/api/benchmark` (persona is a passthrough query param), `/api/rep-memory` (persona is a passthrough body field), `app/dashboard/page.js` (no persona-name references at all), `app/coach/page.js` (same). **MongoDB schema:** confirmed the `persona` field was always a plain string, never an enum — no migration needed for existing "richard"/"sandra" data, `"priya"`/`"rakesh"` are accepted immediately. **Found but explicitly left untouched (out of file scope for this task, flagged for a separate task):** `app/my-stats/page.js` has its own `PERSONA_LABELS` map (`{ richard: {...}, sandra: {...} }`) for the persona-breakdown display; it already has a safe fallback (`PERSONA_LABELS[persona] || { name: persona, title: '' }`) so it won't crash or mislabel for Priya/Rakesh — it'll just show the raw string "priya"/"rakesh" until someone adds entries there, a cosmetic gap, not a bug. `app/api/[[...path]]/route.js` also has a completely separate `PERSONAS` object (with full system prompts) and an "Invalid persona. Choose 'richard' or 'sandra'" error message, but both belong to `POST /api/negotiate`, the old **text-mode** endpoint — per `REPREADY_CONTEXT.md`'s own constraints ("do not add text mode," `/api/negotiate` is "not used in voice journey") this is legacy/parallel code in the same spirit as `/simulate`, left alone. `app/simulate/page.js` has its own hardcoded `PERSONAS` object too — that whole file is the standing "OLD page, do not touch" exception, left alone. **Item 5 — hardcoded "2 personas" count, found, not changed (pricing/packaging decision, not a code decision):** `app/page.js`'s pricing section lists `'2 personas'` as a Starter-tier feature bullet, and `app/pricing/page.js` (a separate `/pricing` route) lists `'Voice personas (Richard & Sandra)'` and `'Richard & Sandra voice personas'` by name in its tier feature lists. Neither file was touched — both are outside this task's allowed file list (`/deck`, session-schema API code, this file), and whether "Starter = 2 personas" should now mean "any 2 of 4" or something else is a pricing/packaging call, not a code default to assume. **Verification:** `npm run build` clean after each file change. Live authenticated browser-render of `/deck` was **not possible** in this sandbox — `/deck` is Clerk-`auth.protect()`-gated, and with dummy dev keys the middleware 307-redirects to a real `https://dummy.accounts.dev/sign-in` URL that the sandbox's network egress policy blocks (confirmed via Playwright network trace: `BAD RESP: 403 https://dummy.accounts.dev/sign-in?...`) — this is the same pre-existing dummy-Clerk-key/proxy limitation documented in earlier sprints for protected routes, not a regression from this change (the unprotected `/` route has no such issue). Verified instead via a full manual diff review plus `npm run build`, which does catch JSX/syntax/type errors. **Before this branch is production-ready:** replace `PRIYA_ID`/`RAKESH_ID` with real ElevenLabs agent IDs, replace "Role — TBD" with real titles, replace the `PERSONA_CONTEXT` placeholder strings for priya/rakesh with real buyer scenarios, add `/Priya.png`/`/Rakesh.png` if photos are wanted (falls back gracefully if not), and decide the Starter-tier "2 personas" pricing question above. **Update:** the agent-ID portion of the "before production-ready" list has since been addressed — see Sprint 20. |
| Sprint 29 — Self-serve manager admin panel (promote/demote reps) | ✅ Complete | Replaces the founder hand-editing Clerk metadata to set `role: 'manager'` — that no longer scales past a handful of customers. New `GET`/`POST /api/admin/reps` in `app/api/[[...path]]/route.js` (manager-only, org-scoped to the caller's own email domain); a new "TEAM MANAGEMENT" section in `app/dashboard/page.js`, rendered only when `user.publicMetadata.role === 'manager'`. Behavior-preserving refactor alongside: the session→rep-grouping loop inline in `GET /api/dashboard` was extracted into a shared top-level `groupRepsFromSessions()` helper, now called by both `/api/dashboard` and the new `/api/admin/reps` GET — same output, verified via read-through since live testing isn't possible in this sandbox. **Guards, all server-side (never trust the client alone):** a manager cannot change their own role (403, paired with a disabled button + "THIS IS YOU" label client-side); target must share the caller's org domain (403, checked before any Clerk call so a wrong-org probe and a same-domain-nonexistent-email both fail the same way up to that point); target must resolve to a real Clerk user via `getUserList` (404 otherwise); `updateUserMetadata` writes only `{ role: newRole }`, which Clerk PATCH-merges at the top level (confirmed against the installed `@clerk/backend` SDK source during planning, not assumed) — cannot clobber a rep's existing `planTier`/`selectedPersonas`. No default/fallback behavior changed: `getAuthedUser()`'s read side (missing `role` → `'rep'`) is untouched: this only adds a way to set the field, no backfill. UI never optimistically updates a role — local state only changes from the server's confirmed response, so a failed request always leaves the displayed role exactly as it was, with a per-row inline error. Found and fixed during review: the new admin row rendered `rep.userEmail[0].toUpperCase()` unguarded, which throws if `userEmail` is `''` — reachable because `POST /api/sessions` is unauthenticated and stores `body.userEmail` as-is (Known Issue 5a); guarded with a `(unknown)` fallback (the pre-existing Rep Leaderboard section a few lines above has the identical unguarded pattern from before this task — left untouched, out of scope here). **Known, accepted trade-offs, not fixed:** (1) the shared-domain privilege-escalation risk documented under Known Issue 5b above — explicit decision made during planning to ship as-is. (2) A manager's dashboard visit now fires two separate requests (`/api/dashboard` and `/api/admin/reps`) that each independently query and group the same org's sessions — a deliberate blast-radius trade-off (keeping the admin panel's extra Clerk API call and its failure modes off the widely-hit main dashboard endpoint) over a small amount of duplicate DB read/compute; acceptable at this product's scale, worth reconsidering only if session volume grows substantially. **Rep list only ever includes reps who have submitted at least one session** — inherited directly from reusing `/api/dashboard`'s existing pattern; there's no separate Clerk-org-membership query or MongoDB `users` collection anywhere in this codebase. Flagged in the UI with a small caption under the section header. `npm run build` clean. Live/authenticated testing not possible in this sandbox (no real Clerk/Mongo credentials) — same standing limitation as every other fix tonight; verified via manual trace of both the manager and rep code paths instead. |
| Sprint 20 — Swap placeholder ElevenLabs agent IDs for Priya and Rakesh (branch `fix/persona-agent-ids`) | ✅ Complete | Real ElevenLabs agents were created for both personas outside this repo. `app/deck/page.js`'s `PRIYA_ID`/`RAKESH_ID` placeholder string values replaced with the real IDs (Priya `agent_5701kzmwc61jfq59zjnvrvb1pxmt`, Rakesh `agent_4901m021sybbenebrf04zntdad30`), and the now-stale PLACEHOLDER warning comments tied to those two lines removed — nothing else in the file touched, verified via diff before committing. The ElevenLabs Agents table above and its "not yet callable" note were updated in this same change to match (this entry was originally written as "committed, not yet merged" while this branch was still pending — now folded into the merge). Role/company/first-message details for both personas are still undocumented — separate, still-open gap. `npm run build` clean. |
| Sprint 21 — Sharpen hero and pricing copy to lead with defensible differentiators (branch `copy/differentiation-messaging`) | ✅ Merged | Copy-only change to `app/page.js`. Hero subheadline now states the hostility-escalation mechanic explicitly instead of burying it — "hostile AI buyers who get harder as your team improves". Pricing subheadline swaps a vague "unlike US competitors" line for a factual, specific one about no demo-gating. `npm run build` clean; dev-render screenshots confirmed both lines wrap cleanly. |
| Sprint 22 — Let first-time users choose their persona (branch `fix/onboarding-persona-choice`) | ✅ Merged | Changes Sprint 7's behavior: `/deck` no longer auto-assigns Richard Vance to first-time users — the onboarding overlay now lets them pick which of the 4 personas to start with. Reconstructed from git history for this doc; not independently re-verified beyond reading the code (see Sprint 27 audit). |
| Sprint 23 — Swap persona agent IDs (superseded, see Sprint 20) / strip stage-direction tags (branch `fix/strip-stage-direction-tags`) | ✅ Merged | `app/deck/page.js`'s live-transcript handler now strips leading `[...]`/`<...>` stage-direction markup (e.g. `[Warmly]`) before text reaches the transcript, UI, or scoring pipeline. **Important scope limit found during Sprint 27 audit:** this only cleans the text transcript — it runs after ElevenLabs has already synthesized and spoken the audio, so Known Issue #1 (Richard audibly saying stage directions) is only partially addressed, not resolved. |
| Sprint 24 — Fix four known correctness bugs (branch `fix/scoring-pricing-clerk-og`) | ✅ Merged | Four independent fixes in one branch, per commit history: (1) Priya/Rakesh `PERSONA_CONTEXT` placeholder scoring strings in `app/api/[[...path]]/route.js` replaced with real buyer-scenario content matching their ElevenLabs system prompts. (2) `app/pricing/page.js` — the old stale standalone pricing page (still on the pre-4-persona USD per-seat model) replaced with a one-line `redirect('/#pricing')` to the landing page's single-sourced pricing section, eliminating the drift risk Sprint 19 flagged. (3) `afterSignInUrl` → `forceRedirectUrl` in `app/layout.js` + sign-in page (closes Known Issue #3). (4) `og-image.png` added to `public/` (closes Known Issue #6). Reconstructed from git history + verified directly against current code during the Sprint 27 audit — all four confirmed actually fixed. |
| Sprint 25 — Add rep/manager role gating and Starter-tier persona-access enforcement (branch `feature/role-tier-gating`) | ✅ Merged | Adds a `role` field (`'rep'` default / `'manager'`) read from Clerk `publicMetadata` via `getAuthedUser()`; `/api/dashboard` now scopes its query to the caller's own sessions unless `role === 'manager'` — closes Known Issue 5b. Also adds a new, previously undocumented `/api/persona-access` endpoint (GET/POST) implementing the Starter-tier "any 2 of 4 personas" lock via `publicMetadata.selectedPersonas`, wired into `app/deck/page.js`'s persona-selection UI (`isLocked`/`handleSelectPersona`). Neither the role-gating fix nor the new endpoint made it into this doc until the Sprint 27 audit caught the gap. |
| Sprint 26 — Add DPDP retention cron job (branch `feature/retention-cron`) | ✅ Merged | New standalone `app/api/cron/purge-conversations/route.js`, wired into `vercel.json` as a daily 3am Vercel Cron job. Automates the previously-manual "delete ElevenLabs conversation history older than 90 days" DPDP task. Requires `CRON_SECRET` bearer auth (401s without it); defaults to dry-run unless `ELEVENLABS_RETENTION_LIVE=true`. Code comments flag explicitly that the ElevenLabs API endpoint/field/pagination shapes were written from general knowledge and not verified against live docs — do not flip to live mode without a verified dry-run first. Not documented in this file until the Sprint 27 audit. |
| Sprint 27 — Full codebase audit (this task) | ✅ Complete | Read-only audit across API layer and frontend/page layer (no product code changed). Found this doc had drifted significantly behind merged code (Sprints 22–26 above were entirely undocumented; Known Issues #3, #5b, #6 were already fixed but still listed open). Updated env-var table, API endpoint table, and Known Issues accordingly. New issues found and logged under Known Issues 0a–0l, most serious being: `/demo` is an undocumented, broken, publicly-indexable text-mode page violating the voice-only rule (0a); `POST /api/sessions` allows full session/score forgery for any rep (0b); several billed-AI endpoints have no auth or rate limiting (0c). Full findings detail is in the audit conversation, not duplicated here — only actionable summary kept per this file's line-budget rule. |
| Sprint 28 — Fix 3 critical items from the Sprint 27 audit | ✅ Complete | **1) Score forgery (0b):** `POST /api/sessions` now requires a `transcript` field and re-derives a score from it via a new shared `scoreTranscript()` helper in `app/api/[[...path]]/route.js` (the same Gemini "combined analyst" call `/api/boardroom` uses — extracted so both share one prompt/schema and can't drift apart). If `body.finalScore` exceeds the transcript-derived score by more than 20 points, the save is rejected (400) and logged; on a Gemini/infra error during verification, the save proceeds unverified (fail-open, so an AI outage doesn't cost a legitimate rep their session) — see the in-code comment for the full reasoning. `app/deck/page.js`'s `handleTerminate` now sends `transcript: finalTranscript` in the save body (it wasn't sent before). **Side effect, flagged not hidden:** `app/simulate/page.js` never sent a `transcript` field to this endpoint, so its session-save calls now 400 — accepted, since `/simulate` is documented as an old, unlinked page ("do not touch"), and closing the forgery hole on the real journey matters more than keeping its save path alive. **2) Unauthenticated DELETE (5a, half of it):** `DELETE /api/sessions` now requires a valid Clerk session and only deletes the caller's own sessions (`getAuthedEmail()`, same pattern as the other 4 auth-gated endpoints); any `?email=` on the request is now ignored entirely. Deliberately did not add a manager-can-delete-org-sessions path — bigger blast radius, needs its own product decision. **3) `/demo` (0a):** `app/demo/page.js` now `redirect('/deck')` (same pattern as the `/pricing` fix in Sprint 24) instead of rendering the broken text-mode `RepReadyCoach` component; removed from `app/sitemap.js`; added to `robots.js`'s disallow list. `components/RepReadyCoach.jsx` and `hooks/useRepMemory.js` are now unreferenced anywhere in the app (confirmed via grep) but were left in place — deleting them wasn't asked for and is a separate, low-risk cleanup. **Verification:** `npm run build` clean (dummy Clerk keys, same documented sandbox limitation as prior sprints — reproduces identically on unmodified code); confirmed via build output that `/demo`'s bundle size (149 B) now matches `/pricing`'s redirect-only bundle exactly. Live browser/API testing not possible in this sandbox (no real Clerk/Mongo/Gemini credentials) — same standing limitation noted in Sprints 18–19. PR opened for review — see below. |
| Sprint 30 — Vendor selected compound-engineering-plugin skills (branch `claude/compound-engineering-plugin-install-5izvyi`) | ✅ Merged | Tooling-only change, no product code touched. The user wanted `EveryInc/compound-engineering-plugin`'s skills available, but its `/plugin marketplace add` + `/plugin install` flow only works in a local terminal Claude Code session, not this browser-based one — so instead of installing the plugin, 8 of its ~30 skills were manually copied into `.claude/skills/`: `ce-compound`, `ce-compound-refresh`, `ce-doc-review`, `ce-commit-push-pr`, `ce-resolve-pr-feedback`, `ce-test-browser`, `ce-polish`, `ce-handoff`. The other ~22 were deliberately skipped: several duplicate skills this repo already has installed (`ce-debug`/`ce-brainstorm`/`ce-plan`/`ce-work`/`ce-worktree`/`ce-code-review`/`ce-simplify-code` overlap with `systematic-debugging`/`brainstorming`/`writing-plans`/`executing-plans`/`using-git-worktrees`/`code-review`/`simplify`), some need infra this repo doesn't have (`ce-sweep`, `ce-product-pulse`, `ce-retune`, `ce-optimize`, `ce-proof`, `ce-riffrec-feedback-analysis`, `ce-test-xcode`), and a few are too autonomous for a solo project or hard-depend on the `gh` CLI this environment doesn't have (`lfg`, `ce-dogfood`, `ce-babysit-pr` — the last also overlaps with this environment's own built-in PR-watching behavior; confirmed and deliberately not vendored after actually reading its SKILL.md). MIT-licensed; attribution note left at `.claude/skills/ce-compound/ATTRIBUTION.md`. `ce-doc-review` bundles an optional cross-model review pass that shells out to other CLI tools (e.g. `codex`, `gemini`) — untested here since none are installed; it should degrade to skipping that pass, but hasn't been exercised. `ce-commit-push-pr` has since been exercised end-to-end on a real task (PR #30) — confirmed working, with `gh` CLI calls manually substituted for GitHub MCP tool calls since `gh` isn't installed in this environment. The other 6 skills haven't been run yet. |
| Sprint 31 — Fix clickjacking exposure from Sprint 27 audit (0f, branch `fix/clickjacking-frame-headers`) | ✅ Merged | Confirmed still live in production tonight (visible in `/api/sessions` response headers during PR #28 verification). `next.config.js`'s site-wide header block: `X-Frame-Options: ALLOWALL` → `DENY`, CSP `frame-ancestors *` → `frame-ancestors 'none'`. Checked first for a legitimate reason any route needs to be framed (grepped for `iframe`/`embed`/`widget` app-wide) — found none, so went with the fully restrictive option rather than `SAMEORIGIN`/`'self'`. Single change site, confirmed via grep: no other file sets `X-Frame-Options` or `frame-ancestors`, and `vercel.json` has no competing `headers` block. **Only file changed:** `next.config.js` (2 lines). **Not touched, flagged instead:** the other half of 0f — `Access-Control-Allow-Origin: *` (via `CORS_ORIGINS`, same file) paired with `Access-Control-Allow-Credentials: true` in `handleCORS()` (`app/api/[[...path]]/route.js`) — confirmed still present, contradictory, and out of scope for this task; needs a real origin allowlist. **Verification:** `npm run build` clean (dummy Clerk keys, same sandbox limitation as every prior sprint). Live header inspection against production not possible from this sandbox (no network egress to repready.site) — verified instead by reading the single source of truth (`next.config.js`) directly and confirming build output is unaffected. |
| Sprint 32 — Fix CORS `*` + `credentials:true` contradiction (0f, branch `ce-task/cors-credentials-contradiction`) | ✅ Merged | The other half of Known Issue 0f, flagged but deliberately not fixed in the separate clickjacking PR (Sprint 31 / PR #29). `app/api/[[...path]]/route.js`: added `applyCorsOriginPolicy(response, request)`, which reads the request's `Origin` header and checks it against an allowlist (`CORS_ORIGINS` env var, comma-separated; defaults to `https://repready.site` when unset) — a match gets the origin echoed back plus `Access-Control-Allow-Credentials: true`; anything else gets both headers stripped. Wired in with a thin wrapper: the existing `handleRoute` function was renamed `handleRouteInternal`, and a new `handleRoute(request, context)` calls it then applies the policy to the result before it's returned — this runs once, after everything else, so it didn't require editing the ~40 existing `handleCORS(...)` call sites scattered through the route branches (those still fire first and set the old undifferentiated value; the wrapper's `.set()`/`.delete()` calls afterward are what the client actually receives). `OPTIONS()` updated to accept and pass through `request` the same way. `next.config.js`: removed the site-wide static `Access-Control-Allow-Origin`/`-Methods`/`-Headers` header lines — a `headers()` config is evaluated once at build/deploy time and can't see the real request's `Origin`, so it could never have been the right layer for this and was actively the source of the `*` value colliding with the API layer's `Access-Control-Allow-Credentials: true`. **Merge note:** this branch was created before Sprint 31 merged, so `next.config.js`'s `headers()` array had a real (not just doc-housekeeping) merge conflict against Sprint 31's `X-Frame-Options`/CSP change on adjacent lines in the same array — resolved by keeping Sprint 31's `DENY`/`'none'` values together with this task's CORS-line removal, verified by reading the merged file directly line-by-line rather than trusting an absence of conflict markers alone. **Deliberately left as follow-up, not done here:** the ~40 pre-existing `handleCORS()` calls inside route.js's branches still set a stale, now-overwritten `Access-Control-Allow-Origin` value on the intermediate response object — harmless (the wrapper always overwrites it before the response leaves), but a future cleanup could delete that dead code from `handleCORS` and those call sites. **Verification:** `npm run build` clean; isolated a standalone Node script to unit-check the allowlist-matching logic in isolation (same-origin request → allowed; an arbitrary cross-origin request → rejected; multiple comma-separated `CORS_ORIGINS` values → each matched independently) since this sandbox has no real Clerk/Mongo credentials for a live end-to-end request. Live production header verification (`curl -I`) not possible from this sandbox. This PR shipped via `ce-commit-push-pr`; its babysit-handoff completion gate couldn't complete (`ce-babysit-pr` isn't vendored — see Sprint 30) and was substituted with this environment's native PR-activity subscription instead. With Sprints 31 and 32 both merged, Known Issue 0f is now fully closed — both halves fixed. |
| Sprint 33 — Protect `/dashboard` and `/my-stats` in middleware (0k, branch `fix/protect-dashboard-mystats-routes`) | ✅ Complete | One-line fix: `middleware.js`'s `isProtectedRoute` matcher now includes `/dashboard(.*)` and `/my-stats(.*)` alongside the existing `/deck(.*)`/`/coach(.*)`, so both page shells now redirect signed-out visitors instead of loading and only failing later at the API layer. No data exposure risk either way (their APIs were already auth-gated) — this was a UX/consistency gap, not a security hole. `middleware.js` was the only file this task's own change touched (no overlap with Sprints 31/32's `next.config.js`/`route.js` edits, confirmed via a clean merge with no conflicts outside this doc). **Verification:** `npm run build` clean; live signed-out-visitor testing not possible in this sandbox (no real Clerk credentials) — same standing limitation as every other sprint tonight. |


---
## KNOWN ISSUES (fix these before adding new features)

**Note (Sprint 27 audit):** this list had drifted badly out of sync with actual code — several items below were already fixed in merged PRs (Sprints 24–26 per git history) but never marked resolved here, which itself violates this file's "update after every task" rule. Corrected below. Full audit also found several **new** issues, listed first by severity — fix critical items before anything else.

### New findings from the Sprint 27 audit, not previously documented

0a. ~~`/demo` is a fully-built TEXT-MODE chat page, violating the "voice-only" constraint, and it's broken~~ — ✅ Fixed in Sprint 28. `app/demo/page.js` now redirects to `/deck`; removed from `sitemap.js`; added to `robots.js` disallow. `components/RepReadyCoach.jsx`/`hooks/useRepMemory.js` are now dead code, left in place (not asked to delete).

0b. ~~`POST /api/sessions` lets anyone forge a fake session for any rep, including a fabricated top score~~ — ✅ Mitigated in Sprint 28 (auth itself still not added — see 5a). The endpoint now requires a `transcript` field and rejects (400) any `finalScore` that exceeds an independent Gemini re-scoring of that transcript by more than 20 points. This closes the practical exploit (you can no longer just edit a JSON body to claim "Elite, 100/100") but the endpoint is still unauthenticated — anyone can still forge a session with a *plausible* score for a fabricated transcript, and delete-vs-overwrite/rate-limit abuse of the verification Gemini call itself isn't addressed. Full auth is still 5a's job.

0c. **HIGH — Several billed-AI endpoints have no auth and no rate limiting.** `/api/test`, `/api/negotiate`, `/api/scorecard`, `/api/boardroom`, `/api/coach` — none require a signed-in user, and there is no rate-limiting anywhere in the codebase (grepped, confirmed absent). Anyone with the URLs can trigger unlimited billed Gemini calls — a real cost-DoS vector, not just resource exhaustion. `/api/test` additionally echoes the Gemini API key prefix in its (unauthenticated, GET) response.

0d. **MEDIUM — Verbose error objects leak to clients.** `/api/test`, `/api/negotiate`, `/api/scorecard` return full error `stack`/`cause`/`fullError` (via `JSON.stringify(err, Object.getOwnPropertyNames(err))`) on Gemini failures instead of a generic message.

0e. **MEDIUM — Credit deduction race condition.** `app/api/deduct-credit/route.js` does a non-atomic read-then-write of `privateMetadata.credits` — two concurrent requests (e.g. a rapid double-click or replay) can both read the same balance, both pass the `>0` check, and both decrement, letting a user spend more credits than they have.

0f. ~~Wide-open CORS + framing headers, site-wide~~ — ✅ Fully fixed (Sprints 31 and 32, PRs #29 and #30). **Framing (Sprint 31):** `next.config.js` now sets `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` site-wide (was `ALLOWALL` / `frame-ancestors *`); confirmed no legitimate framing need exists anywhere in the codebase before going fully restrictive over `SAMEORIGIN`/`'self'`. **CORS (Sprint 32):** `app/api/[[...path]]/route.js` now resolves the origin dynamically per request via `applyCorsOriginPolicy()`, checked against an allowlist (`CORS_ORIGINS`, comma-separated; defaults to `https://repready.site`) — an allowed origin gets echoed back with credentials, anything else gets no CORS headers at all; `next.config.js`'s static site-wide `Access-Control-Allow-Origin`/`-Methods`/`-Headers` lines were removed (a `headers()` config can't reflect a real per-request Origin, so they were always going to be wrong for this). Both fixes touched the same `next.config.js` `headers()` array on adjacent lines — see the Sprint 32 merge note for how that conflict was resolved.

0g. **HIGH — Structured data (JSON-LD) advertises fake pricing.** `app/layout.js`'s FAQPage/SoftwareApplication schema states "$49/seat/month, 5-seat minimum" in USD and lists invented scenario names, neither of which matches the real INR per-tier pricing on the page itself. Misleading to search engines/AI crawlers that read structured data; should be regenerated from the real pricing table or removed.

0h. **MEDIUM — Boardroom pipeline and `/api/coach` retries risk the Vercel Hobby 10s timeout.** `/api/boardroom`'s two Gemini calls run strictly sequentially with no explicit timeout/AbortSignal; `/api/coach`'s retry loop (up to 3 attempts, `2000ms * attempt` backoff) has no overall deadline either. Neither has ever been load-tested against the 10s ceiling; worth a deliberate timeout budget rather than hoping latency stays low.

0i. **LOW — `if (boardroomData.finalScore)` treats a real score of 0 as falsy** in `app/deck/page.js`, incorrectly falling through to the coach fallback / failure path on a (rare but legitimate) 0 score.

0j. **LOW — Debug/dead code left in `app/deck/page.js`:** a `console.log("[BOARDROOM RESPONSE]", ...)` dumps the full scoring payload to the browser console in production; a `document.querySelector('body > header')` hides a `<header>` element removed since Sprint 11 (permanent no-op).

0k. ~~`/my-stats` and `/dashboard` aren't in `middleware.js`'s protected-route matcher`~~ — ✅ Fixed (this task, branch `fix/protect-dashboard-mystats-routes`). Both added to `isProtectedRoute`. Their underlying APIs were already auth-gated (no data ever leaked), but the page shells previously loaded for signed-out visitors, inconsistent with the documented "gated" user journey — now consistent with `/deck` and `/coach`.

0l. **LOW — `/api/dashboard`'s manager-role query has no `.limit()`**, unlike `/sessions`/`/benchmark`/`/rep-memory` which all cap results — unbounded growth risk as org session history accumulates.

### Previously documented — status corrected by this audit

1. **Richard says stage directions aloud (partially mitigated, not fixed)** — Sprint 24 (`fix/strip-stage-direction-tags`) added client-side stripping of leading `[...]`/`<...>` markup from the **displayed transcript and scoring pipeline** (`app/deck/page.js`, `onMessage` handler) — but this runs after ElevenLabs has already synthesized and played the audio, so it does **not** stop Richard from audibly saying stage directions. The original fix (switch Richard's LLM to an ElevenLabs-hosted model or Gemini 2.5 Flash in the ElevenLabs dashboard) is still needed for the audible issue.

2. **Dead code** — duplicate `getQualificationStatus` function still present at `app/api/[[...path]]/route.js:177-183`, still unused (confirmed via this audit). The active one is in `app/deck/page.js`. Safe to delete from route.js.

3. ~~Clerk dev keys / deprecated `afterSignInUrl`~~ — ✅ Fixed (Sprint 25, `fix/scoring-pricing-clerk-og`). Both `app/layout.js` and `app/sign-in/[[...sign-in]]/page.js` now use `forceRedirectUrl="/deck"`. Confirmed via this audit — no `afterSignInUrl` references remain anywhere.

4. **Personal best discrepancy (design choice, not a bug)** — unchanged, still applies. See constraints below re: localStorage.

5. ~~No server-side auth on `/api/sessions`(GET), `/api/dashboard`, `/api/benchmark`, `/api/rep-memory`~~ — ✅ Fixed, confirmed still correct by this audit.

5a. **Partially fixed in Sprint 28, still open otherwise.** ~~`DELETE /api/sessions?email=xxx` fully unauthenticated~~ — ✅ Fixed: now requires a Clerk session and only deletes the caller's own sessions. **Still open:** `POST /api/sessions` still trusts client-supplied `body.userEmail`/`body.orgId` unverified (score itself is now sanity-checked — see 0b), so it's not auth, just a harder-to-forge score. Anyone can still POST a session under someone else's email (with a transcript that genuinely supports whatever score they claim) or spam session-save calls. Needs real auth on this endpoint to close fully.

5b. ~~`/api/dashboard` has no rep-vs-manager role check~~ — ✅ Fixed (Sprint 26, `feature/role-tier-gating`), **not caught by the last doc update**. `getAuthedUser()` now reads `role` from Clerk `publicMetadata` (defaults to `'rep'`) and `/api/dashboard` scopes its query to the caller's own sessions unless `role === 'manager'`. As of Sprint 29, `role: 'manager'` is no longer only set by hand in the Clerk dashboard — an existing manager can self-serve promote/demote reps in their own org from `/dashboard`'s new Team Management section (`GET`/`POST /api/admin/reps`). **Known, accepted risk carried by this feature:** `orgId` is `email.split('@')[1]` everywhere in this app, with no allowlist of real business domains — a manager on a shared consumer domain (e.g. `gmail.com`) could in principle promote/demote another same-domain user who has a session. This isn't new (the dashboard already exposed same-domain session data as view-only); the admin panel extends it to a mutate capability. Decided explicitly during planning to ship as-is rather than invent new scope (a domain blocklist or real org modeling) — revisit if this product ever needs real multi-tenant isolation.

5c. ~~Sessions saved with `orgId: null`~~ — ✅ Fixed in Sprint 15, unchanged.

6. ~~`og-image.png` missing~~ — ✅ Fixed (Sprint 25). File now exists in `public/`, confirmed via this audit.

7. **`/deck`, `/my-stats`, `/dashboard`, `/coach` can't have their own page metadata** — unchanged, still applies (confirmed via this audit — all 4 remain Client Components with no `metadata` export).

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

**Clerk Backend SDK facts, verified against installed source during Sprint 29 (don't re-derive these from scratch next time):**
- `client.users.getUserList({ emailAddress: [...], limit })` batch-resolves multiple emails → Clerk users in one request (OR-matches every email in the array). **Always pass `limit` explicitly** — it silently defaults to 10 (max 500) and will truncate results for anything larger without any error.
- `client.users.updateUserMetadata(userId, { publicMetadata: {...} })` is a `PATCH` that shallow-merges at the top level — it does **not** replace the whole `publicMetadata` object. Writing `{ role: newRole }` for a user cannot clobber their existing `planTier`/`selectedPersonas`, no read-then-merge needed. (This is also why the existing `/api/persona-access` POST handler, which only ever writes `selectedPersonas`, has never silently wiped anyone's `role`.)
- **`sessions.userEmail`/`orgId` are not a trustworthy identity or authorization source anywhere in this codebase** — `POST /api/sessions` is unauthenticated (Known Issue 5a) and stores whatever the client sends. Any new feature that reads the `sessions` collection (like the admin panel above) should treat it as display data only and resolve real identity/authorization through Clerk directly, never through what's stored on a session document.

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
