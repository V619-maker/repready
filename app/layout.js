import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Link from 'next/link';

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
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=JetBrains+Mono:wght@400&family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
          <link rel="canonical" href="https://repready.site/" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  { "@type": "Question", "name": "Who is RepReady built for?", "acceptedAnswer": { "@type": "Answer", "text": "RepReady is built for B2B sales teams of 5 or more — SDRs, AEs, and the managers who run them. If your team loses deals on objections, pricing pressure, or procurement pushback, RepReady is built for you." } },
                  { "@type": "Question", "name": "How is this different from traditional sales training or roleplay?", "acceptedAnswer": { "@type": "Answer", "text": "Traditional training is episodic. RepReady is always-on. Your reps get hostile AI buyers available 24/7, scored sessions, and a coaching debrief after every call. No scheduling, no bias, no holding back." } },
                  { "@type": "Question", "name": "How quickly can my team get started?", "acceptedAnswer": { "@type": "Answer", "text": "Your team can run their first simulation in under 10 minutes. No integration required, no IT dependency. Sign up, pick a scenario, and go." } },
                  { "@type": "Question", "name": "How does RepReady pricing work?", "acceptedAnswer": { "@type": "Answer", "text": "RepReady starts at $49/seat/month with a 5-seat minimum. Volume discounts apply at 15+ seats. Payments processed via Paddle — works for India, Southeast Asia, and globally." } },
                  { "@type": "Question", "name": "What sales scenarios are available right now?", "acceptedAnswer": { "@type": "Answer", "text": "Current scenarios include CFO Pushback, Procurement Stall, Budget Freeze, Competitor Price Match, and Delayed Decision Maker. New scenarios added monthly." } },
                  { "@type": "Question", "name": "Is our data private and secure?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. All session data is encrypted in transit and at rest. Your team's recordings and coaching data are never used to train AI models without your explicit written consent." } }
                ]
              })
            }}
          />
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
                "offers": { "@type": "Offer", "price": "49", "priceCurrency": "USD" }
              })
            }}
          />
        </head>

        <body className="antialiased">

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
