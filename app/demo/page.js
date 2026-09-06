import { redirect } from 'next/navigation'

// /demo used to render a standalone text-mode chat simulator
// (components/RepReadyCoach.jsx) — this violated the "voice-only" product
// constraint and was broken besides: it called /api/coach with a request
// shape that endpoint never accepted, so every real call 400'd and the UI
// silently fell back to the same hardcoded canned response forever.
//
// It was never linked from the app's own nav, but it was listed in
// sitemap.js and not blocked in robots.js, so it was publicly indexable —
// found during the Sprint 27 audit (see REPREADY_CONTEXT.md).
//
// Rather than hard-delete it (which would turn any existing inbound
// links/bookmarks/search results into dead 404s), this redirects to the
// real product — same pattern as the /pricing fix. sitemap.js and
// robots.js were updated alongside this so /demo stops being crawled and
// indexed as a distinct page going forward.
export default function DemoRedirect() {
  redirect('/deck')
}
