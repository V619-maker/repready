import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Link from 'next/link';

// ── SEO METADATA (replaces your old title/description) ──
export const metadata = {
  title: 'RepReady — AI B2B Sales Negotiation Simulator for Sales Teams',
  description: 'RepReady gives B2B sales reps live, voice-to-voice negotiation practice against hostile AI buyers. Real-time coaching, deal health scoring, and frame-control analysis. Start free.',
  keywords: 'AI sales training, B2B sales negotiation simulator, sales roleplay AI, sales coaching software, sales rep practice tool',
  robots: 'index, follow',
  authors: [{ name: 'RepReady' }],
  alternates: {
    canonical: 'https://repready.site/',
  },
  openGraph: {
    type: 'website',
    url: 'https://repready.site/',
    title: 'RepReady — AI B2B Sales Negotiation Simulator',
    description: 'Train your sales reps on hostile AI buyers before they face real prospects. Voice-to-voice negotiations, real-time coaching, deal health scoring.',
    images: [{ url: 'https://repready.site/og-image.png' }],
    siteName: 'RepReady',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RepReady — AI B2B Sales Negotiation Simulator',
    description: 'Train your sales reps on hostile AI buyers before they face real prospects.',
    images: ['https://repready.site/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {/* ── FONTS: added Sora + DM Sans + DM Mono for landing page, kept your originals ── */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=JetBrains+Mono:wght@400&family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />

          {/* ── CANONICAL TAG ── */}
          <link rel="canonical" href="https://repready.site/" />

          {/* ── FAQ SCHEMA — helps Google show RepReady in People Also Ask ── */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Who is RepReady built for?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "RepReady is built for B2B sales teams of 5 or more — SDRs, AEs, and the managers who run them. If your team loses deals on objections, pricing pressure, or procurement pushback, RepReady is built for you."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How is this different from traditional sales training or roleplay?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Traditional training is episodic. RepReady is always-on. Your reps get hostile AI buyers available 24/7, scored sessions, and a coaching debrief after every call. No scheduling, no bias, no holding back."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How quickly can my team get started?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Your team can run their first simulation in under 10 minutes. No integration required, no IT dependency. Sign up, pick a scenario, and go."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How does RepReady pricing work?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "RepReady starts at $49/seat/month with a 5-seat minimum. Volume discounts apply at 15+ seats. Payments processed via Paddle — works for India, Southeast Asia, and globally."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "What sales scenarios are available right now?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Current scenarios include CFO Pushback, Procurement Stall, Budget Freeze, Competitor Price Match, and Delayed Decision Maker. New scenarios added monthly."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is our data private and secure?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. All session data is encrypted in transit and at rest. Your team's recordings and coaching data are never used to train AI models without your explicit written consent."
                    }
                  }
                ]
              })
            }}
          />

          {/* ── SOFTWARE APP SCHEMA ── */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "RepReady",
                "applicationCategory": "BusinessApplication",
                "description": "AI-powered B2B sales negotiation simulator with voice personas, real-time coaching, and deal health scoring.",
                "url": "https://repready.site",
                "offers": {
                  "@type": "Offer",
                  "price": "49",
                  "priceCurrency": "USD"
                }
              })
            }}
          />
        </head>

        <body className="bg-white text-slate-900 font-sans antialiased selection:bg-cyan-100 relative min-h-screen flex flex-col">

          {/* THE FIXED HEADER — unchanged */}
          <header className="fixed top-0 left-0 right-0 w-full z-[100] flex justify-between items-center px-8 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">

            {/* LOGO — unchanged */}
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="absolute w-full h-full animate-[spin_15s_linear_infinite] opacity-20">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="black" strokeWidth="1" strokeDasharray="5 10" />
                </svg>
                <div className="relative w-7 h-7 flex items-center justify-center bg-white border-2 border-cyan-500 rounded-sm rotate-45 group-hover:rotate-[135deg] transition-transform duration-700">
                  <span className="text-black font-black text-base -rotate-45 group-hover:-rotate-[135deg] transition-transform duration-700">R</span>
                  <div className="absolute top-1 right-1 w-1 h-1 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                </div>
              </div>
              <span className="text-black font-black tracking-tighter uppercase text-xl italic">
                Rep<span className="text-cyan-500">Ready</span>
              </span>
            </Link>

            {/* NAVIGATION — unchanged */}
            <div className="flex items-center gap-8">
              <Link href="/pricing" className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 hover:text-black transition-colors">
                Pricing
              </Link>
              <Link href="/sign-in" className="bg-black text-white px-8 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all">
                Sign In
              </Link>
            </div>
          </header>

          {/* MAIN CONTENT — unchanged */}
          <main className="relative pt-20 flex-grow z-10">
            {children}
          </main>

          {/* GLOBAL GRID BACKGROUND — unchanged */}
          <div
            className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
            style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />

        </body>
      </html>
    </ClerkProvider>
  );
}
