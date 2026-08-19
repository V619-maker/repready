import { redirect } from 'next/navigation'

// /pricing used to be a standalone page with its own pricing tiers, copy,
// and CTAs. It went stale after the pricing model was redesigned (INR
// tiers based on rep count, replacing the old USD per-seat model) and
// after Priya/Rakesh were added — this page never got updated to match,
// and /deck was still linking real users into it.
//
// The current, correct pricing lives on the landing page's #pricing
// section. Rather than maintain two pricing sources that can drift apart
// again, this route just redirects there.
export default function PricingRedirect() {
  redirect('/#pricing')
}
