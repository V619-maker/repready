'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const FONT_DISPLAY = "'Newsreader', Georgia, 'Times New Roman', serif";
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const CREAM = '#F7F1E4';
const CREAM_ALT = '#F0E8D6';
const NAVY = '#1B2A4A';
const NAVY_DEEP = '#101A30';
const INK = '#1D1912';
const STONE = '#726B5C';
const BORDER = 'rgba(27,42,74,0.14)';
const RED = '#AC3A2C';
const GREEN = '#3D7A4C';

const BOOK_DEMO_URL = 'https://cal.com/vrushal-kitke-lg9txr/30min';

// Fabricated example activity lines for the hero ticker — a static, looping
// visual signal of product activity, not a live feed. No DB query involved.
const ACTIVITY_LINES = [
  'Rep scored 74 vs. Richard · 2m ago',
  'Objection Handling flagged weak · 5m ago',
  'New session started vs. Sandra · 8m ago',
  'Rep reached Qualified status · 12m ago',
];

// Deterministic bar heights for the hero waveform — must match between SSR
// and client render, so this is a fixed formula, not Math.random().
const WAVEFORM_HEIGHTS = Array.from({ length: 28 }, (_, i) =>
  Math.round(30 + Math.abs(Math.sin(i * 1.7)) * 70)
);

/* ---------- shared hooks / small building blocks ---------- */

function useRevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function useParallax(ref, factor = 0.15) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        node.style.transform = `translateY(${window.scrollY * factor}px)`;
        raf = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, factor]);
}

function Counter({ from, to, duration = 1400, suffix = '', style, className }) {
  const ref = useRef(null);
  const startedRef = useRef(false);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const startTime = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            setValue(Math.round(from + (to - from) * progress));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.unobserve(node);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(node);
    return () => obs.disconnect();
  }, [from, to, duration]);

  return <span ref={ref} className={className} style={style}>{value}{suffix}</span>;
}

function SkillBar({ label, pct, weak }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setVisible(true); obs.unobserve(node); }
      });
    }, { threshold: 0.3 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: INK, letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: weak ? RED : NAVY }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(27,42,74,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: visible ? `${pct}%` : '0%', background: weak ? RED : NAVY, borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
    </div>
  );
}

function Waveform() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 }}>
      {WAVEFORM_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="rr-wave-bar"
          style={{
            width: 3,
            height: `${h}%`,
            background: NAVY,
            borderRadius: 2,
            opacity: 0.4 + (h / 100) * 0.6,
            animationDelay: `${(i % 7) * 0.11}s`,
          }}
        />
      ))}
    </div>
  );
}

function TranscriptLine({ children, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setVisible(true); obs.unobserve(node); }
      });
    }, { threshold: 0.4 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <p
      ref={ref}
      style={{
        marginBottom: 10,
        opacity: 1,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: `transform 0.5s ease ${index * 0.09}s`,
      }}
    >
      {children}
    </p>
  );
}

function GradePill({ grade, color }) {
  return (
    <span style={{ display: 'inline-block', border: `1px solid ${color || NAVY}`, color: color || NAVY, borderRadius: 999, padding: '4px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      Grade {grade}
    </span>
  );
}

function ChromeFrame({ label, children }) {
  return (
    <div className="rr-card-hover" style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 24px 64px rgba(27,42,74,0.14)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 16px', background: CREAM_ALT, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(27,42,74,0.18)', display: 'inline-block' }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(27,42,74,0.24)', display: 'inline-block' }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(27,42,74,0.3)', display: 'inline-block' }} />
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: STONE, letterSpacing: '0.02em' }}>{label}</span>
      </div>
      <div style={{ background: '#fff', padding: 32 }}>{children}</div>
    </div>
  );
}

/* ---------- page ---------- */

export default function Home() {
  const [annual, setAnnual] = useState(false);
  const heroBlobRef = useRef(null);

  useRevealOnScroll();
  useParallax(heroBlobRef, 0.18);

  const teamSkills = [
    { label: 'Discovery Quality', pct: 58 },
    { label: 'Objection Handling', pct: 42, weak: true },
    { label: 'Price Defense', pct: 61 },
    { label: 'SME Knowledge', pct: 55 },
    { label: 'Communication', pct: 67 },
    { label: 'Emotional Resilience', pct: 74 },
  ];

  const sessionSkills = [
    { label: 'Discovery Quality', pct: 71 },
    { label: 'Objection Handling', pct: 58 },
    { label: 'Price Defense', pct: 80 },
    { label: 'SME Knowledge', pct: 65 },
    { label: 'Communication', pct: 70 },
    { label: 'Emotional Resilience', pct: 85 },
  ];

  const plans = [
    { name: 'Starter', monthly: 2499, annualPrice: 1999, badge: null, features: ['Up to 5 reps', '2 personas', 'Boardroom scoring', 'Email support'], cta: 'Get Started →', href: '/sign-in' },
    { name: 'Growth', monthly: 1999, annualPrice: 1599, badge: 'MOST POPULAR', features: ['6-20 reps', 'All personas', '6-dimension matrix', 'Manager dashboard', 'Priority support'], cta: 'Get Started →', href: '/sign-in' },
    { name: 'Scale', monthly: 1499, annualPrice: 1199, badge: null, features: ['21-100 reps', 'Everything in Growth', 'Qualification tracking', 'Slack reports'], cta: 'Get Started →', href: '/sign-in' },
    { name: 'Enterprise', monthly: null, annualPrice: null, badge: null, features: ['100+ reps or BFSI/regulated industries', 'Custom personas', 'Compliance docs', 'Dedicated onboarding'], cta: 'Book a Call →', href: BOOK_DEMO_URL },
  ];

  const badRepLines = [
    <><span style={{ color: INK, fontWeight: 700 }}>[Richard]</span> "You've got 3 minutes. What's your number?"</>,
    <><span style={{ color: NAVY, fontWeight: 700 }}>[Rep]</span> "So before I get to pricing I just want to understand your challenges—"</>,
    <><span style={{ color: INK, fontWeight: 700 }}>[Richard]</span> "I said skip the discovery. What. Is. Your. Number."</>,
    <><span style={{ color: NAVY, fontWeight: 700 }}>[Rep]</span> "We're very cost-effective compared to—"</>,
    <><span style={{ color: RED, fontWeight: 700 }}>[Richard]</span> <span style={{ color: RED }}>"I'm hanging up."</span></>,
  ];

  const goodRepLines = [
    <><span style={{ color: INK, fontWeight: 700 }}>[Richard]</span> "You've got 3 minutes. What's your number."</>,
    <><span style={{ color: NAVY, fontWeight: 700 }}>[Rep]</span> "₹40 lakhs a year in invoice delays. That's what Apex cost you last quarter. We fix that for less. Want the number now or after I show you the math?"</>,
    <><span style={{ color: INK, fontWeight: 700 }}>[Richard]</span> "...How do you know about the Apex outage."</>,
    <><span style={{ color: GREEN, fontWeight: 700 }}>[Rep]</span> <span style={{ color: GREEN }}>"Because I asked the right questions. Can we talk for 10 more minutes?"</span></>,
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: CREAM, fontFamily: FONT_BODY, color: INK, overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&display=swap');

        .reveal { opacity: 1; transform: translateY(28px); transition: transform 0.7s ease; }
        .reveal.is-visible { transform: translateY(0); }

        @keyframes rr-navy-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(27,42,74,0.35); } 50% { box-shadow: 0 0 0 14px rgba(27,42,74,0); } }
        .rr-navy-btn { animation: rr-navy-pulse 2.6s ease-in-out infinite; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .rr-navy-btn:hover { transform: translateY(-2px); }

        .rr-link-btn { transition: opacity 0.2s ease, transform 0.2s ease; }
        .rr-link-btn:hover { opacity: 0.65; transform: translateY(-1px); }

        .rr-card-hover { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .rr-card-hover:hover { transform: translateY(-4px); }

        @keyframes rr-wave-pulse { 0%, 100% { transform: scaleY(0.55); } 50% { transform: scaleY(1); } }
        .rr-wave-bar { animation: rr-wave-pulse 1.15s ease-in-out infinite; transform-origin: bottom; }

        @keyframes rr-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .rr-ticker-track { animation: rr-ticker 24s linear infinite; }

        .rr-grid-2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
        .rr-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .rr-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .rr-hero-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); gap: 64px; align-items: center; }

        @media (max-width: 860px) {
          .rr-grid-2, .rr-grid-3, .rr-grid-4, .rr-hero-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      ` }} />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: 'rgba(247,241,228,0.92)', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 200, backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${NAVY}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: NAVY, fontWeight: 900, fontSize: 14 }}>R</span>
          </div>
          <span style={{ color: INK, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 15, letterSpacing: '0.05em' }}>REP<span style={{ color: NAVY }}>READY</span></span>
        </Link>
        <Link href="/sign-in" className="rr-link-btn" style={{ background: NAVY, color: CREAM, padding: '9px 22px', fontSize: 11, fontWeight: 900, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Sign In</Link>
      </nav>

      {/* SECTION 1 — Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '140px 32px 100px', overflow: 'hidden' }}>
        <div
          ref={heroBlobRef}
          style={{ position: 'absolute', top: '-10%', right: '-10%', width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,42,74,0.09), transparent 70%)', pointerEvents: 'none', zIndex: 0 }}
        />
        <div className="rr-hero-grid" style={{ maxWidth: 1180, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(38px, 5.2vw, 62px)', fontWeight: 600, color: INK, letterSpacing: '-0.02em', lineHeight: 1.08, marginBottom: 28 }}>
              Find out which skill is{' '}
              <span style={{ fontStyle: 'italic', textDecoration: 'underline', textDecorationColor: NAVY, textDecorationThickness: '2px', textUnderlineOffset: '5px' }}>costing your team deals</span>
              {' '}— before next quarter does.
            </h1>
            <p style={{ fontSize: 17, color: STONE, maxWidth: 480, marginBottom: 44, lineHeight: 1.7 }}>
              RepReady runs your reps against hostile AI buyers and returns a skill diagnostic after session one. Voice-only. Scored across 6 dimensions.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" className="rr-navy-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: NAVY, color: CREAM, padding: '17px 40px', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Book a 30-min Demo
              </a>
              <Link href="/sign-in" className="rr-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: INK, padding: '17px 8px', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${BORDER}` }}>
                Reps: Try it free →
              </Link>
            </div>
            <div style={{ marginTop: 56, maxWidth: 460, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)', maskImage: 'linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)' }}>
              <div className="rr-ticker-track" style={{ display: 'flex', gap: 40, width: 'max-content' }}>
                {[...ACTIVITY_LINES, ...ACTIVITY_LINES].map((line, i) => (
                  <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 11, color: STONE, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                    <span style={{ color: NAVY, marginRight: 6 }}>●</span>{line}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ChromeFrame label="session-live — repready.site">
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: STONE, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 24 }}>
              Richard Vance · Hostile Buyer · Turn 7 of 12
            </div>
            <Waveform />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
              <div>
                <Counter from={0} to={73} style={{ fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 600, color: NAVY }} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 600, color: NAVY }}>/100</span>
              </div>
              <GradePill grade="B" />
            </div>
          </ChromeFrame>
        </div>
      </section>

      {/* SECTION 2 — Skill matrix */}
      <section className="reveal" style={{ padding: '120px 24px', background: CREAM_ALT, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: INK, textAlign: 'center', marginBottom: 48 }}>Session 1 tells you exactly where your team is leaking deals.</h2>
          <div>
            {teamSkills.map((s) => (
              <SkillBar key={s.label} label={s.label} pct={s.pct} weak={s.weak} />
            ))}
          </div>
          <p style={{ fontSize: 13, color: STONE, textAlign: 'center', marginTop: 32, marginBottom: 40, lineHeight: 1.7 }}>
            <span style={{ color: RED, fontWeight: 700 }}>Objection Handling</span> is your team's weakest skill. RepReady assigns targeted sessions automatically.
          </p>
          <div style={{ textAlign: 'center' }}>
            <a href="#session-report" className="rr-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: NAVY, fontSize: 12, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${NAVY}` }}>
              See a real session report ↓
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Real session report */}
      <section id="session-report" className="reveal" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: INK, textAlign: 'center', marginBottom: 12 }}>This is what your VP of Sales gets after session one.</h2>
          <p style={{ fontSize: 11, color: STONE, textAlign: 'center', marginBottom: 40, opacity: 0.8 }}>Illustrative example</p>
          <ChromeFrame label="session-report — repready.site">
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: STONE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>
              Rep: Anonymous Rep · Persona: Richard Vance · Date: July 2026
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'baseline', marginBottom: 28, borderBottom: `1px solid ${BORDER}`, paddingBottom: 24 }}>
              <div>
                <Counter from={0} to={73} style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 600, color: NAVY }} />
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 600, color: NAVY }}>/100</span>
              </div>
              <div style={{ fontSize: 14, color: STONE }}>Grade: <span style={{ color: INK, fontWeight: 700 }}>B</span></div>
              <div style={{ fontSize: 14, color: STONE }}>Hostility: <span style={{ color: INK, fontWeight: 700 }}>62%</span></div>
              <div style={{ fontSize: 14, color: STONE }}>Procurement: <span style={{ color: INK, fontWeight: 700 }}>78/100</span></div>
              <div style={{ fontSize: 14, color: STONE }}>Enablement: <span style={{ color: INK, fontWeight: 700 }}>65/100</span></div>
            </div>

            <div className="rr-grid-2" style={{ gap: 24, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', color: GREEN, textTransform: 'uppercase', marginBottom: 10 }}>What You Did Right</div>
                <p style={{ fontSize: 13, color: STONE, lineHeight: 1.8 }}>Postponed price discussion twice. Never apologized for list price. Forced Richard to reveal the freight crisis by holding on discovery.</p>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', color: RED, textTransform: 'uppercase', marginBottom: 10 }}>What You Did Wrong</div>
                <p style={{ fontSize: 13, color: STONE, lineHeight: 1.8 }}>Lost call control in turn 4. Responded to silence with a feature list instead of a question. Gave away the SLA commitment without trading for value.</p>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', color: NAVY, textTransform: 'uppercase', marginBottom: 10 }}>One Thing To Fix Next</div>
              <p style={{ fontSize: 13, color: INK, lineHeight: 1.8 }}>When Richard goes silent — count to 5 before speaking. Silence is his weapon. Make it yours.</p>
            </div>

            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, marginBottom: 24 }}>
              {sessionSkills.map((s) => (
                <SkillBar key={s.label} label={s.label} pct={s.pct} />
              ))}
            </div>

            <Link href="/coach" className="rr-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: NAVY, fontSize: 12, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
              See full coach report →
            </Link>
          </ChromeFrame>
        </div>
      </section>

      {/* SECTION 4 — Demo (failure and win) */}
      <section className="reveal" style={{ padding: '120px 24px', background: CREAM_ALT, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 600, color: INK, textAlign: 'center', marginBottom: 56 }}>Watch Richard destroy a bad pitch. Then watch the same rep win.</h2>
          <div className="rr-grid-2" style={{ gap: 24, marginBottom: 32 }}>
            <div className="rr-card-hover" style={{ border: `1px solid ${RED}`, background: '#fff', padding: 28, boxShadow: '0 16px 40px rgba(172,58,44,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: RED, display: 'inline-block' }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: STONE, textTransform: 'uppercase' }}>Live Call Transcript</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: RED, textTransform: 'uppercase', marginBottom: 20 }}>
                Session 1 · 31/100 · Grade F
              </div>
              <div style={{ fontSize: 13, color: STONE, lineHeight: 1.9, marginBottom: 24 }}>
                {badRepLines.map((line, i) => <TranscriptLine key={i} index={i}>{line}</TranscriptLine>)}
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, color: RED }}>31/100 <span style={{ fontFamily: FONT_BODY, fontSize: 16, color: STONE }}>Grade: F</span></div>
            </div>
            <div className="rr-card-hover" style={{ border: `1px solid ${GREEN}`, background: '#fff', padding: 28, boxShadow: '0 16px 40px rgba(61,122,76,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, display: 'inline-block' }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: STONE, textTransform: 'uppercase' }}>Live Call Transcript</span>
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: GREEN, textTransform: 'uppercase', marginBottom: 20 }}>
                Session 4 · 73/100 · Grade B
              </div>
              <div style={{ fontSize: 13, color: STONE, lineHeight: 1.9, marginBottom: 24 }}>
                {goodRepLines.map((line, i) => <TranscriptLine key={i} index={i}>{line}</TranscriptLine>)}
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, color: GREEN }}>73/100 <span style={{ fontFamily: FONT_BODY, fontSize: 16, color: STONE }}>Grade: B</span></div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: STONE, textAlign: 'center', maxWidth: 640, margin: '0 auto', lineHeight: 1.8 }}>
            Richard gets harder between sessions. Score 70+ at 62% hostility and your next session starts at 72% hostile. Difficulty is earned, not set.
          </p>
        </div>
      </section>

      {/* SECTION 5 — Pricing */}
      <section id="pricing" className="reveal" style={{ padding: '130px 24px', background: CREAM }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 600, color: INK, marginBottom: 12 }}>Transparent pricing. No surprises.</h2>
            <p style={{ fontSize: 14, color: STONE }}>Unlike US competitors, we show you the number.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '32px 0 64px' }}>
            <span style={{ fontSize: 12, color: annual ? STONE : INK, fontWeight: 700 }}>Monthly</span>
            <button
              onClick={() => setAnnual((a) => !a)}
              aria-label="Toggle annual billing"
              style={{ width: 44, height: 24, borderRadius: 12, border: `1px solid ${NAVY}`, background: annual ? NAVY : 'transparent', position: 'relative', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ position: 'absolute', top: 2, left: annual ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: annual ? CREAM : NAVY, transition: 'left 0.25s ease' }} />
            </button>
            <span style={{ fontSize: 12, color: annual ? INK : STONE, fontWeight: 700 }}>Annual <span style={{ color: NAVY }}>(Save 20%)</span></span>
          </div>
          <div className="rr-grid-4" style={{ gap: 24 }}>
            {plans.map((plan) => {
              const price = plan.monthly === null ? null : (annual ? plan.annualPrice : plan.monthly);
              return (
                <div key={plan.name} className="rr-card-hover" style={{ position: 'relative', border: `1px solid ${plan.badge ? NAVY : BORDER}`, background: '#fff', padding: plan.badge ? 34 : 28, boxShadow: plan.badge ? '0 20px 50px rgba(27,42,74,0.14)' : 'none' }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -12, left: 28, background: NAVY, color: CREAM, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', padding: '4px 12px' }}>{plan.badge}</div>
                  )}
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, color: INK, marginBottom: 14 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 20 }}>
                    {price === null ? (
                      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: INK }}>Custom pricing</span>
                    ) : (
                      <>
                        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 600, color: INK }}>₹{price.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: 11, color: STONE }}>/user/mo</span>
                      </>
                    )}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ fontSize: 12, color: STONE, display: 'flex', gap: 8 }}><span style={{ color: NAVY }}>✓</span>{f}</li>
                    ))}
                  </ul>
                  <a href={plan.href} target={plan.href.startsWith('http') ? '_blank' : undefined} rel={plan.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="rr-link-btn" style={{ display: 'block', textAlign: 'center', padding: '12px', background: plan.badge ? NAVY : 'transparent', border: plan.badge ? 'none' : `1px solid ${BORDER}`, color: plan.badge ? CREAM : INK, fontWeight: 900, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    {plan.cta}
                  </a>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'rgba(29,25,18,0.4)', letterSpacing: '0.05em' }}>
              DPDP Act 2023 Compliant · MongoDB Atlas Mumbai · Voice data never used to train AI · Delete anytime: privacy@repready.site
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Final CTA */}
      <section className="reveal" style={{ padding: '140px 24px', background: NAVY_DEEP, borderTop: `1px solid ${BORDER}`, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 600, color: CREAM, marginBottom: 16, lineHeight: 1.15 }}>Stop practicing on real prospects.</h2>
          <p style={{ fontSize: 14, color: 'rgba(247,241,228,0.65)', marginBottom: 36 }}>Book a 30-minute demo. We'll run your team through session one live.</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" className="rr-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: CREAM, color: NAVY_DEEP, padding: '18px 44px', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Book a Demo
            </a>
            <Link href="/sign-in" className="rr-link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: CREAM, padding: '18px 8px', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(247,241,228,0.3)' }}>
              Try it yourself free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', background: CREAM, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="/privacy" style={{ fontSize: 12, color: STONE, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: 12, color: STONE, textDecoration: 'none' }}>Terms</a>
            <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: STONE, textDecoration: 'none' }}>Contact</a>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(29,25,18,0.4)' }}>© 2026 RepReady</div>
        </div>
      </footer>
    </div>
  );
}
