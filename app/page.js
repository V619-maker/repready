'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/*
 * Landing page, "future" direction (Nov 2026).
 * Dark ground, one saffron accent. Scroll behaviour:
 *   - thin progress line under the nav
 *   - headline rises word by word on load
 *   - a living conversation map in the hero
 *   - a pinned "scrollytelling" section: scrolling steps one sample call through
 *     rehearse -> pushback -> scored with evidence -> team readiness
 *   - staggered reveals on every other section
 * All motion is switched off for people who ask their device for reduced motion.
 * No customer logos or statistics are shown, because none are real yet; example
 * conversation content is labelled "Illustrative".
 */

const FONT_DISPLAY = "'Sora', system-ui, sans-serif";
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const BG = '#080B14';
const PANEL = '#0D1220';
const LINE = '#1E2540';
const LINE_STRONG = '#2A3150';
const TEXT = '#E8EAF2';
const MUTED = '#A7ADC2';
const DIM = '#7D84A0';
const ACCENT = '#FFB454';
const ROSE = '#F59E8B';
const CYAN = '#7FD7E8';
const INDIGO = '#6E7BC8';

const BOOK_DEMO_URL = 'https://cal.com/vrushal-kitke-lg9txr/30min';

const HEADLINE = [
  { w: 'Every', accent: false },
  { w: 'sales', accent: false },
  { w: 'conversation,', accent: false },
  { w: 'rehearsed', accent: true },
  { w: 'first.', accent: true },
];

// Examples of buyers a company can build for itself (illustrative).
const BUYER_CHIPS = [
  'Skeptical CFO', 'Procurement lead with a frozen budget', 'IT security reviewer',
  'Champion who went quiet', 'Founder who wants a discount', 'Operations head comparing three vendors',
];

const STEPS = [
  { tag: 'Before the call', title: 'Rehearse out loud', body: 'Speak to an AI buyer built from your product and your objections. Rehearse a real open deal from your CRM before you dial.' },
  { tag: 'During practice', title: 'The buyer pushes back', body: 'It interrupts, stalls, and asks for a discount. It gets harder as the rep gets better.' },
  { tag: 'After the call', title: 'Scored with evidence', body: 'Every point of feedback quotes the rep’s own words, with a better line to say instead.' },
  { tag: 'Across the team', title: 'Managers see readiness', body: 'See who practised, which skill is weakest across the team, and who is ready for live calls.' },
];

/* ---------- hooks ---------- */

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.fx-reveal');
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// Reads page scroll once per frame and exposes it as CSS variables / a step number.
function useScrollEffects(progressRef, glowRef, storyRef, onStep) {
  useEffect(() => {
    let raf = null;
    let lastStep = -1;
    const update = () => {
      raf = null;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const pageP = Math.min(1, Math.max(0, window.scrollY / max));
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${pageP})`;
      if (glowRef.current) glowRef.current.style.transform = `translate3d(0, ${Math.round(window.scrollY * 0.12)}px, 0)`;
      const story = storyRef.current;
      if (story) {
        const rect = story.getBoundingClientRect();
        const travel = Math.max(1, rect.height - window.innerHeight);
        const p = Math.min(0.9999, Math.max(0, -rect.top / travel));
        const step = Math.floor(p * STEPS.length);
        if (step !== lastStep) { lastStep = step; onStep(step); }
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [progressRef, glowRef, storyRef, onStep]);
}

/* ---------- small pieces ---------- */

function WaveRow({ label, color, bars }) {
  return (
    <div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: DIM, marginBottom: 8, letterSpacing: '0.06em' }}>{label}</div>
      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 3, height: 64 }}>
        {bars.map((b, i) => (
          <div key={i} className={b.on ? 'fx-bar' : undefined} style={{ flex: '1 1 0', minWidth: 2, borderRadius: 2, background: color, height: b.on ? b.h : 4, opacity: b.on ? 1 : 0.35, animationDelay: `${(i % 12) * 90}ms` }} />
        ))}
      </div>
    </div>
  );
}

function makeBars(seed, ranges) {
  return Array.from({ length: 64 }, (_, i) => {
    const on = ranges.some(([a, b]) => i >= a && i <= b);
    const wave = Math.abs(Math.sin(i * 0.9 + seed)) * 0.6 + Math.abs(Math.sin(i * 2.3 + seed * 2)) * 0.4;
    return { on, h: Math.round(12 + wave * 52) };
  });
}

const BUYER_BARS = makeBars(1, [[0, 9], [20, 33], [46, 58]]);
const REP_BARS = makeBars(4, [[11, 19], [34, 45], [59, 63]]);

function Label({ children, color = ACCENT }) {
  return <div style={{ fontFamily: FONT_MONO, fontSize: 12, color, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 18 }}>{children}</div>;
}

/* ---------- page ---------- */

export default function Home() {
  const progressRef = useRef(null);
  const glowRef = useRef(null);
  const storyRef = useRef(null);
  const [step, setStep] = useState(0);

  useReveal();
  useScrollEffects(progressRef, glowRef, storyRef, setStep);

  const plans = [
    { name: 'Team', price: 49, badge: 'MOST POPULAR', features: ['$49 per seat per month', '5-seat minimum', 'Volume discounts at 15+ seats', 'All 4 buyer personas', 'Boardroom scoring', '6-dimension skill matrix', 'Manager dashboard'], cta: 'Get started', href: '/sign-in' },
    { name: 'Enterprise', price: null, badge: null, features: ['100+ reps or BFSI/regulated industries', 'Custom personas', 'Compliance docs', 'Dedicated onboarding'], cta: 'Book a call', href: BOOK_DEMO_URL },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: BG, color: TEXT, fontFamily: FONT_BODY, lineHeight: 1.55, overflowX: 'clip' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        html { scroll-behavior: smooth; }
        a { color: inherit; }
        .fx-rise { display: inline-block; opacity: 0; transform: translateY(0.5em); animation: fx-rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) forwards; }
        @keyframes fx-rise { to { opacity: 1; transform: translateY(0); } }
        .fx-fade { opacity: 0; animation: fx-fade 1s ease forwards; }
        @keyframes fx-fade { to { opacity: 1; } }
        .fx-bar { transform-origin: center; animation: fx-bar 1.3s ease-in-out infinite; }
        @keyframes fx-bar { 0%, 100% { transform: scaleY(0.45); } 50% { transform: scaleY(1); } }
        .fx-marquee { display: flex; width: max-content; animation: fx-marquee 40s linear infinite; }
        @keyframes fx-marquee { to { transform: translateX(-50%); } }
        .fx-reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1); transition-delay: var(--d, 0ms); }
        .fx-reveal.is-in { opacity: 1; transform: none; }
        .fx-panel { position: absolute; inset: 0; padding: 32px; opacity: 0; transform: translateY(18px); transition: opacity 0.5s ease, transform 0.5s ease; pointer-events: none; }
        .fx-panel.is-on { opacity: 1; transform: none; pointer-events: auto; }
        .fx-step { opacity: 0.38; transition: opacity 0.4s ease; border-left: 2px solid ${LINE_STRONG}; padding: 4px 0 4px 22px; }
        .fx-step.is-on { opacity: 1; border-left-color: ${ACCENT}; }
        .fx-step .fx-body { max-height: 0; overflow: hidden; opacity: 0; transition: max-height 0.5s ease, opacity 0.4s ease; }
        .fx-step.is-on .fx-body { max-height: 200px; opacity: 1; }
        .fx-btn { transition: transform 0.2s ease, opacity 0.2s ease; }
        .fx-btn:hover { transform: translateY(-2px); opacity: 0.92; }
        .fx-card { transition: transform 0.3s ease, border-color 0.3s ease; }
        .fx-card:hover { transform: translateY(-4px); border-color: ${ACCENT}; }
        .fx-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .fx-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .fx-story { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 56px; align-items: center; }
        @media (max-width: 860px) {
          .fx-g2, .fx-g3, .fx-story { grid-template-columns: minmax(0, 1fr) !important; }
          .fx-story { gap: 20px; }
          .fx-step:not(.is-on) { display: none; }
          .fx-navlinks { display: none !important; }
          .fx-story-title { display: none; }
          .fx-panel { padding: 22px; }
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .fx-rise, .fx-fade, .fx-reveal { opacity: 1 !important; transform: none !important; animation: none !important; transition: none !important; }
          .fx-bar, .fx-marquee { animation: none !important; }
          .fx-panel, .fx-step, .fx-step .fx-body { transition: none !important; }
        }
      ` }} />

      {/* Nav + scroll progress */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 68, background: 'rgba(8,11,20,0.82)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 200 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: TEXT }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
          RepReady
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14 }}>
          <div className="fx-navlinks" style={{ display: 'flex', gap: 28, color: MUTED }}>
            <a href="#vision" style={{ textDecoration: 'none' }}>The vision</a>
            <a href="#yours" style={{ textDecoration: 'none' }}>Built from your company</a>
            <a href="#managers" style={{ textDecoration: 'none' }}>For managers</a>
            <a href="#pricing" style={{ textDecoration: 'none' }}>Pricing</a>
          </div>
          <Link href="/sign-in" className="fx-btn" style={{ border: `1px solid ${LINE_STRONG}`, color: TEXT, padding: '10px 20px', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </div>
        <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: LINE }}>
          <div ref={progressRef} style={{ height: '100%', background: ACCENT, transformOrigin: 'left', transform: 'scaleX(0)' }} />
        </div>
      </nav>

      {/* Hero */}
      <header style={{ position: 'relative', padding: '170px 24px 40px', textAlign: 'center', overflow: 'hidden' }}>
        <div ref={glowRef} aria-hidden="true" style={{ position: 'absolute', top: 40, left: '50%', width: 640, height: 640, marginLeft: -320, borderRadius: '50%', border: `1px solid ${LINE}`, boxShadow: `inset 0 0 0 80px rgba(255,180,84,0.015), inset 0 0 0 81px ${LINE}, inset 0 0 0 200px rgba(255,180,84,0.01), inset 0 0 0 201px ${LINE}`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto' }}>
          <div className="fx-fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: `1px solid ${LINE_STRONG}`, borderRadius: 999, padding: '8px 18px', fontFamily: FONT_MONO, fontSize: 13, color: MUTED, marginBottom: 36 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, display: 'inline-block' }} />
            Sales practice for teams of 100 to 500 reps
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(42px, 7.4vw, 108px)', lineHeight: 1.02, letterSpacing: '-0.04em', margin: '0 auto 32px' }}>
            {HEADLINE.map((h, i) => (
              <span key={h.w}>
                <span className="fx-rise" style={{ animationDelay: `${150 + i * 120}ms`, color: h.accent ? ACCENT : TEXT, fontWeight: h.accent ? 700 : 400 }}>{h.w}</span>{' '}
              </span>
            ))}
          </h1>
          <p className="fx-fade" style={{ animationDelay: '900ms', fontSize: 'clamp(17px, 1.7vw, 21px)', color: MUTED, maxWidth: 700, margin: '0 auto 44px' }}>
            India&apos;s sales teams are adopting AI early. RepReady gives every rep a place to have the hard conversation out loud before the real buyer is on the line, and shows managers exactly where each one stands.
          </p>
          <div className="fx-fade" style={{ animationDelay: '1100ms', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" className="fx-btn" style={{ background: ACCENT, color: BG, padding: '18px 34px', fontWeight: 700, fontSize: 16, borderRadius: 999, textDecoration: 'none' }}>Book a 30-minute demo</a>
            <Link href="/sign-in" className="fx-btn" style={{ border: `1px solid ${LINE_STRONG}`, padding: '18px 34px', fontWeight: 600, fontSize: 16, borderRadius: 999, textDecoration: 'none', color: TEXT }}>Try it yourself free</Link>
          </div>
        </div>

        {/* conversation map */}
        <div className="fx-fade" style={{ animationDelay: '1300ms', position: 'relative', maxWidth: 1100, margin: '88px auto 0', border: `1px solid ${LINE}`, borderRadius: 20, background: PANEL, padding: 'clamp(20px, 3vw, 36px)', textAlign: 'left' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', fontFamily: FONT_MONO, fontSize: 12, color: DIM, marginBottom: 24, letterSpacing: '0.06em' }}>
            <span>CONVERSATION MAP · ILLUSTRATIVE</span><span>BUYER: SKEPTICAL CFO</span>
          </div>
          <WaveRow label="BUYER" color={INDIGO} bars={BUYER_BARS} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px', margin: '18px 0', fontFamily: FONT_MONO, fontSize: 12 }}>
            <span style={{ color: ACCENT }}>▲ Price raised</span>
            <span style={{ color: ROSE }}>▲ Objection: budget frozen</span>
            <span style={{ color: CYAN }}>▲ Rep asks a discovery question</span>
            <span style={{ color: MUTED }}>▲ Silence, rep fills it</span>
          </div>
          <WaveRow label="REP" color={ACCENT} bars={REP_BARS} />
        </div>
      </header>

      {/* Example buyers marquee */}
      <div aria-label="Examples of buyers a company can build" style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, marginTop: 96, padding: '22px 0', overflow: 'hidden' }}>
        <div className="fx-marquee">
          {[...BUYER_CHIPS, ...BUYER_CHIPS].map((c, i) => (
            <span key={i} aria-hidden={i >= BUYER_CHIPS.length ? 'true' : undefined} style={{ flex: '0 0 auto', margin: '0 12px', padding: '10px 22px', border: `1px solid ${LINE_STRONG}`, borderRadius: 999, fontSize: 15, color: MUTED, whiteSpace: 'nowrap' }}>{c}</span>
          ))}
        </div>
      </div>

      {/* Pinned scrollytelling */}
      <section id="vision" ref={storyRef} style={{ position: 'relative', height: `${STEPS.length * 85 + 40}vh` }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center', padding: '88px 24px 24px' }}>
          <div className="fx-story" style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
            <div>
              <Label>The vision</Label>
              <h2 className="fx-story-title" style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(30px, 3.8vw, 52px)', letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 36px' }}>
                Selling is a conversation. It should be <span style={{ fontWeight: 700 }}>practised like one.</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {STEPS.map((s, i) => (
                  <div key={s.title} className={`fx-step${step === i ? ' is-on' : ''}`}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.tag}</div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '2px 0' }}>{s.title}</div>
                    <p className="fx-body" style={{ margin: 0, color: MUTED }}>{s.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', minHeight: 400, border: `1px solid ${LINE}`, borderRadius: 20, background: PANEL, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 14, right: 20, fontFamily: FONT_MONO, fontSize: 11, color: DIM, letterSpacing: '0.08em', zIndex: 2 }}>ILLUSTRATIVE</div>

              <div className={`fx-panel${step === 0 ? ' is-on' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: DIM }}>Rehearsing: open deal, mid-size logistics firm</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(20px, 2.2vw, 28px)', lineHeight: 1.35 }}>
                  <span style={{ display: 'block', fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: ROSE, marginBottom: 6 }}>Buyer</span>
                  You&apos;ve got three minutes. What&apos;s your number?
                </div>
              </div>

              <div className={`fx-panel${step === 1 ? ' is-on' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(18px, 2vw, 24px)', lineHeight: 1.4 }}>
                  <span style={{ display: 'block', fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: INDIGO, marginBottom: 6 }}>Rep</span>
                  Before I give you a number, can I ask what a delayed invoice costs you today?
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(18px, 2vw, 24px)', lineHeight: 1.4 }}>
                  <span style={{ display: 'block', fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: ROSE, marginBottom: 6 }}>Buyer</span>
                  I said skip the discovery. Our budget is frozen. Why would I talk to you?
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: ACCENT }}>▲ Objection raised · the buyer is getting harder</div>
              </div>

              <div className={`fx-panel${step === 2 ? ' is-on' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: DIM }}>THE MOMENT IT TURNED</div>
                <div style={{ borderLeft: `3px solid ${ROSE}`, paddingLeft: 18, fontFamily: FONT_DISPLAY, fontSize: 'clamp(17px, 1.8vw, 22px)', lineHeight: 1.4 }}>
                  &ldquo;We&apos;re very cost-effective compared to&hellip;&rdquo;
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: MUTED, marginTop: 8 }}>The rep jumped to a pitch instead of answering the budget objection.</div>
                </div>
                <div style={{ borderLeft: `3px solid ${ACCENT}`, paddingLeft: 18 }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: ACCENT, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Try instead</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(17px, 1.8vw, 22px)', lineHeight: 1.4 }}>&ldquo;Understood, budget is tight. What would your finance team need to see to approve something like this?&rdquo;</div>
                </div>
              </div>

              <div className={`fx-panel${step === 3 ? ' is-on' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: DIM, marginBottom: 10 }}>TEAM VIEW</div>
                {[
                  ['Assigned: Skeptical CFO, due Friday', 'Done', ACCENT],
                  ['Weakest skill across the team', 'Objection handling', TEXT],
                  ['Ready for live calls', 'Shown per rep', CYAN],
                  ['Not yet practised this week', 'Flagged', ROSE],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderBottom: `1px solid ${LINE}`, fontSize: 15 }}>
                    <span style={{ color: MUTED }}>{k}</span><strong style={{ color: c }}>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built from your company */}
      <section id="yours" style={{ padding: '112px 24px', background: PANEL, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="fx-reveal" style={{ maxWidth: 720, marginBottom: 56 }}>
            <Label>Built from your company</Label>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(30px, 4vw, 54px)', letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 20px' }}>Your product. Your buyers. <span style={{ fontWeight: 700 }}>Your deals.</span></h2>
            <p style={{ fontSize: 19, color: MUTED, margin: 0 }}>Practice is only as good as what it is built from, so it is built from you.</p>
          </div>
          <div className="fx-g2" style={{ gap: 16 }}>
            {[
              ['Product documents', 'The buyer checks the rep’s claims against your own material. Private to your company, and off until a manager switches it on.'],
              ['Custom buyers', 'Describe the buyer your team really meets: role, situation, hidden motivation and objections. Ready in minutes.'],
              ['Live CRM deals', 'Connect HubSpot, Salesforce or Zoho, rehearse a real open deal before the call, and log the practice back to the record.'],
              ['Real calls', 'Upload a recording, paste a transcript or import from Gong. Real calls get the same scoring and the same quoted evidence.'],
            ].map(([t, b], i) => (
              <div key={t} className="fx-reveal fx-card" style={{ '--d': `${i * 90}ms`, border: `1px solid ${LINE_STRONG}`, borderRadius: 16, padding: 32, background: BG }}>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 10px' }}>{t}</h3>
                <p style={{ margin: 0, color: MUTED }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Managers */}
      <section id="managers" style={{ padding: '120px 24px' }}>
        <div className="fx-g2" style={{ maxWidth: 1200, margin: '0 auto', gap: 56, alignItems: 'center' }}>
          <div className="fx-reveal">
            <Label>For sales managers</Label>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(30px, 4vw, 54px)', letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 22px' }}>Assign it. Track it. <span style={{ fontWeight: 700 }}>Know who is ready.</span></h2>
            <p style={{ fontSize: 19, color: MUTED, margin: 0 }}>Set the criteria your team is judged on, assign a buyer with a due date, find the skill the whole team is weak on, and send scores to Slack or Teams.</p>
          </div>
          <div className="fx-reveal" style={{ '--d': '120ms', border: `1px solid ${LINE}`, borderRadius: 20, background: PANEL, padding: 32 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: DIM, marginBottom: 14, letterSpacing: '0.06em' }}>YOUR CRITERIA · EXAMPLE</div>
            {['Discovery quality', 'Objection handling', 'Price defense', 'Economic buyer identification'].map((c) => (
              <div key={c} style={{ padding: '14px 0', borderBottom: `1px solid ${LINE}`, fontSize: 16 }}>{c}</div>
            ))}
            <div style={{ paddingTop: 14, fontSize: 14, color: MUTED }}>Edit these to match how your team sells.</div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section style={{ padding: '88px 24px', borderTop: `1px solid ${LINE}` }}>
        <div className="fx-g2" style={{ maxWidth: 1200, margin: '0 auto', gap: '40px 64px', alignItems: 'start', gridTemplateColumns: 'minmax(0, 0.8fr) minmax(0, 1.2fr)' }}>
          <h2 className="fx-reveal" style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(26px, 3.2vw, 40px)', letterSpacing: '-0.03em', margin: 0 }}>Built in Mumbai. Private by default.</h2>
          <div className="fx-g3" style={{ gap: 24, color: MUTED, fontSize: 15 }}>
            {[
              ['Your documents stay yours', 'Visible only inside your company workspace.'],
              ['Database in Mumbai', 'Stored in a Mumbai region database.'],
              ['Voice data deleted', 'Voice recordings are purged after 90 days.'],
            ].map(([t, b], i) => (
              <div key={t} className="fx-reveal" style={{ '--d': `${i * 100}ms` }}><strong style={{ color: TEXT }}>{t}.</strong><br />{b}</div>
            ))}
          </div>
        </div>
        <p style={{ textAlign: 'center', margin: '40px 0 0', fontSize: 13 }}><a href="/trust" style={{ color: MUTED }}>Read the full trust and compliance page</a></p>
      </section>

      {/* Pricing (facts unchanged from the previous page) */}
      <section id="pricing" style={{ padding: '110px 24px', background: PANEL, borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="fx-reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(28px, 3.6vw, 44px)', letterSpacing: '-0.03em', margin: '0 0 10px' }}>Transparent pricing. No surprises.</h2>
            <p style={{ color: MUTED, margin: 0 }}>We show you the number.</p>
          </div>
          <div className="fx-g2" style={{ gap: 20 }}>
            {plans.map((plan, i) => (
              <div key={plan.name} className="fx-reveal fx-card" style={{ '--d': `${i * 110}ms`, position: 'relative', border: `1px solid ${plan.badge ? ACCENT : LINE_STRONG}`, borderRadius: 16, padding: 32, background: BG }}>
                {plan.badge && <div style={{ position: 'absolute', top: -12, left: 28, background: ACCENT, color: BG, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', padding: '4px 12px', borderRadius: 999 }}>{plan.badge}</div>}
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 600, margin: '0 0 12px' }}>{plan.name}</h3>
                <div style={{ marginBottom: 20 }}>
                  {plan.price === null ? (
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600 }}>Custom pricing</span>
                  ) : (
                    <><span style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 600 }}>${plan.price}</span><span style={{ fontSize: 13, color: MUTED }}> /seat/month</span></>
                  )}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {plan.features.map((f) => <li key={f} style={{ fontSize: 14, color: MUTED, display: 'flex', gap: 10 }}><span style={{ color: ACCENT }} aria-hidden="true">✓</span>{f}</li>)}
                </ul>
                <a href={plan.href} target={plan.href.startsWith('http') ? '_blank' : undefined} rel={plan.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="fx-btn" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 14, background: plan.badge ? ACCENT : 'transparent', color: plan.badge ? BG : TEXT, border: plan.badge ? 'none' : `1px solid ${LINE_STRONG}` }}>{plan.cta}</a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 36, fontFamily: FONT_MONO, fontSize: 11, color: DIM, letterSpacing: '0.04em' }}>
            DPDP Act 2023 Compliant · MongoDB Atlas Mumbai · Voice data never used to train AI · Delete anytime: privacy@repready.site
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '140px 24px', textAlign: 'center' }}>
        <h2 className="fx-reveal" style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(36px, 6vw, 84px)', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 auto 24px', maxWidth: 1000 }}>
          The next hard conversation <span style={{ fontWeight: 700, color: ACCENT }}>starts here.</span>
        </h2>
        <p className="fx-reveal" style={{ '--d': '100ms', fontSize: 20, color: MUTED, margin: '0 auto 40px', maxWidth: 600 }}>Book 30 minutes. We run your team through a live session on your own product.</p>
        <div className="fx-reveal" style={{ '--d': '200ms', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
          <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" className="fx-btn" style={{ background: ACCENT, color: BG, padding: '20px 40px', fontWeight: 700, fontSize: 17, borderRadius: 999, textDecoration: 'none' }}>Book a demo</a>
          <Link href="/sign-in" className="fx-btn" style={{ border: `1px solid ${LINE_STRONG}`, padding: '20px 36px', fontWeight: 600, fontSize: 17, borderRadius: 999, textDecoration: 'none', color: TEXT }}>Try it yourself free</Link>
        </div>
      </section>

      <footer style={{ padding: '32px 24px', borderTop: `1px solid ${LINE}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/trust" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Trust &amp; Compliance</a>
            <a href="/terms" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Terms</a>
            <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: MUTED, textDecoration: 'none' }}>Contact</a>
          </div>
          <div style={{ fontSize: 12, color: DIM }}>© 2026 RepReady</div>
        </div>
      </footer>
    </div>
  );
}
