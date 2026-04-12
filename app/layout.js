import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import ConditionalHeader from '@/components/ConditionalHeader';

export const metadata = {
  title: 'RepReady — AI B2B Sales Negotiation Simulator for Sales Teams',
  description: 'RepReady gives B2B sales reps live, voice-to-voice negotiation practice against hostile AI buyers. Real-time coaching, deal health scoring, and frame-control analysis. Start free.',
  keywords: 'AI sales training, B2B sales negotiation simulator, sales roleplay AI, sales coaching software, sales rep practice tool',
  robots: 'index, follow',
  authors: [{ name: 'RepReady' }],
  alternates: { canonical: 'https://repready.site/' },
  openGraph: {
    type: 'website',
    url: 'https://repready.site/',
    title: 'RepReady — AI B2B Sales Negotiation Simulator',
    description: 'Train your sales reps on hostile AI buyers before they face real prospects.',
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
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=JetBrains+Mono:wght@400&family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
          <link rel="canonical" href="https://repready.site/" />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context":"https://schema.org","@type":"FAQPage",
            "mainEntity":[
              {"@type":"Question","name":"Who is RepReady built for?","acceptedAnswer":{"@type":"Answer","text":"RepReady is built for B2B sales teams of 5 or more — SDRs, AEs, and the managers who run them."}},
              {"@type":"Question","name":"How is this different from traditional sales training?","acceptedAnswer":{"@type":"Answer","text":"Traditional training is episodic. RepReady is always-on with hostile AI buyers available 24/7, scored sessions, and a coaching debrief after every call."}},
              {"@type":"Question","name":"How quickly can my team get started?","acceptedAnswer":{"@type":"Answer","text":"Your team can run their first simulation in under 10 minutes. No integration required, no IT dependency."}},
              {"@type":"Question","name":"How does RepReady pricing work?","acceptedAnswer":{"@type":"Answer","text":"RepReady starts at $49/seat/month with a 5-seat minimum. Volume discounts at 15+ seats. Payments via Paddle."}},
              {"@type":"Question","name":"What sales scenarios are available?","acceptedAnswer":{"@type":"Answer","text":"CFO Pushback, Procurement Stall, Budget Freeze, Competitor Price Match, and Missing Decision Maker. New scenarios added monthly."}},
              {"@type":"Question","name":"Is our data private?","acceptedAnswer":{"@type":"Answer","text":"Yes. All session data is encrypted. Your team's data is never used to train AI models without explicit written consent."}}
            ]
          })}} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context":"https://schema.org","@type":"SoftwareApplication",
            "name":"RepReady","applicationCategory":"BusinessApplication",
            "description":"AI-powered B2B sales negotiation simulator with voice personas, real-time coaching, and deal health scoring.",
            "url":"https://repready.site",
            "offers":{"@type":"Offer","price":"49","priceCurrency":"USD"}
          })}} />
        </head>

        <body className="bg-white text-slate-900 font-sans antialiased selection:bg-cyan-100 relative min-h-screen flex flex-col">

          {/* ConditionalHeader hides itself on /deck and /coach */}
          <ConditionalHeader />

          <main className="relative flex-grow z-10">
            {children}
          </main>

          <div
            className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
            style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px' }}
          />

        </body>
      </html>
    </ClerkProvider>
  );
}
