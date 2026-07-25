'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const FONT_HEAD = "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const GOLD = '#F59E0B';
const RED = '#EF4444';
const CYAN = '#22D3EE';
const ZINC = '#A1A1AA';

/* ---------- shared hooks / small building blocks ---------- */

function useSpotlight(ref) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const isTouch = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;
    const handleMove = (e) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--x', `${e.clientX - rect.left}px`);
      node.style.setProperty('--y', `${e.clientY - rect.top}px`);
    };
    node.addEventListener('mousemove', handleMove);
    return () => node.removeEventListener('mousemove', handleMove);
  }, [ref]);
}

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

function Counter({ from, to, duration = 1600, suffix = '', style, className }) {
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

function HostilityMeter() {
  const ref = useRef(null);
  const startedRef = useRef(false);
  const [pct, setPct] = useState(40);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const startTime = performance.now();
          const duration = 2400;
          const tick = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            setPct(Math.round(40 + (78 - 40) * progress));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.unobserve(node);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const label = pct < 50 ? 'LOW' : pct < 65 ? 'MEDIUM' : pct < 78 ? 'HIGH' : 'HOSTILE';

  return (
    <div ref={ref}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.15em', color: ZINC, textTransform: 'uppercase' }}>Hostility</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', color: RED }}>{label}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}, ${RED})`, transition: 'width 0.2s linear' }} />
      </div>
    </div>
  );
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
    <div ref={ref} style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#fff', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: weak ? RED : GOLD }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: visible ? `${pct}%` : '0%', background: weak ? RED : GOLD, borderRadius: 3, transition: 'width 1.3s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
    </div>
  );
}

const QUAL_STAGES = [
  { label: 'Not Qualified', desc: 'First session. Baseline score only.' },
  { label: 'Getting Started', desc: '3+ sessions logged. Patterns start to show.' },
  { label: 'Developing', desc: 'Consistent scoring across all 6 dimensions.' },
  { label: 'Qualified', desc: 'Score 70+. Richard starts getting harder.' },
  { label: 'Elite', desc: 'Holds up under max hostility, every time.' },
];

function QualificationJourney() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setVisible(true); obs.unobserve(node); }
      });
    }, { threshold: 0.25 });
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="rr-grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
      {QUAL_STAGES.map((s, i) => {
        const isQualified = i === 3;
        return (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', margin: '0 auto 16px',
              border: `2px solid ${GOLD}`,
              background: visible ? (isQualified ? GOLD : 'rgba(245,158,11,0.3)') : 'transparent',
              boxShadow: visible && isQualified ? `0 0 14px rgba(245,158,11,0.65)` : 'none',
              transition: 'background 0.5s ease, box-shadow 0.5s ease',
              transitionDelay: `${i * 180}ms`,
            }} />
            <div style={{ fontFamily: FONT_HEAD, fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: ZINC, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- page ---------- */

export default function Home() {
  const heroRef = useRef(null);
  const ctaRef = useRef(null);
  const [annual, setAnnual] = useState(false);
  const [hoveredPersona, setHoveredPersona] = useState(null);

  useSpotlight(heroRef);
  useSpotlight(ctaRef);
  useRevealOnScroll();

  const plans = [
    { name: 'Starter', monthly: 1999, badge: null, features: ['Up to 5 reps', 'Richard + Sandra personas', 'Boardroom scoring', 'Basic coach feedback', 'Email support'], cta: 'Get Started', href: '/sign-in' },
    { name: 'Growth', monthly: 3499, badge: 'MOST POPULAR', features: ['Up to 20 reps', 'All personas', '6-dimension skill matrix', 'Manager dashboard', 'Qualification tracking', 'Priority support'], cta: 'Get Started', href: '/sign-in' },
    { name: 'Enterprise', monthly: null, badge: null, features: ['Unlimited reps', 'Custom personas', 'DPDP compliance docs + DPA', 'Dedicated onboarding', 'BFSI-ready compliance'], cta: 'Book a Demo', href: 'mailto:demo@repready.site' },
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0A0A', fontFamily: FONT_BODY, color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

        .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .reveal.is-visible { opacity: 1; transform: translateY(0); }

        @keyframes rr-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(10px); } }
        @keyframes rr-gold-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); } 50% { box-shadow: 0 0 0 14px rgba(245,158,11,0); } }
        @keyframes rr-red-pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.55); } 50% { opacity: 0.55; box-shadow: 0 0 0 7px rgba(239,68,68,0); } }
        @keyframes rr-waveform { 0%, 100% { transform: scaleY(0.25); } 50% { transform: scaleY(1); } }

        .rr-gold-btn { animation: rr-gold-pulse 2.6s ease-in-out infinite; }
        .rr-red-dot { animation: rr-red-pulse 1.8s ease-in-out infinite; }
        .rr-bounce { animation: rr-bounce 1.8s ease-in-out infinite; }

        .rr-persona-card { transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease; }
        .rr-persona-card.hovered { transform: translateY(-8px); }

        .rr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
        .rr-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
        .rr-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); }

        @media (max-width: 860px) {
          .rr-grid-2, .rr-grid-3, .rr-grid-4, .rr-grid-5 { grid-template-columns: 1fr !important; }
          .rr-hide-mobile { display: none !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: 'rgba(10,10,10,0.9)', borderBottom: `1px solid rgba(245,158,11,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 200, backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>R</span>
          </div>
          <span style={{ color: '#fff', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, letterSpacing: '0.05em' }}>REP<span style={{ color: GOLD }}>READY</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <a href="#pricing" style={{ color: ZINC, fontSize: 11, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Pricing</a>
          <Link href="/sign-in" style={{ background: GOLD, color: '#000', padding: '9px 22px', fontSize: 11, fontWeight: 900, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Sign In</Link>
        </div>
      </nav>

      {/* SECTION 1 — Hero */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(600px circle at var(--x, 50%) var(--y, 30%), rgba(245,158,11,0.08), transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          <div style={{ display: 'inline-block', marginBottom: 32, padding: '8px 20px', border: `1px solid rgba(34,211,238,0.4)`, background: 'rgba(34,211,238,0.05)', color: CYAN, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700 }}>
            AI Sales Simulation · Built for India
          </div>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 28 }}>
            Your reps are losing deals<br />they should be winning.
          </h1>
          <p style={{ fontSize: 17, color: ZINC, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            RepReady puts them in front of hostile AI buyers before the real call. Voice-only. Boardroom-scored. DPDP compliant.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40 }}>
            <a href="mailto:demo@repready.site" className="rr-gold-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: GOLD, color: '#000', padding: '17px 40px', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Book a Demo
            </a>
            <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', padding: '17px 8px', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
              Try Free →
            </Link>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: ZINC, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            DPDP Compliant · Mumbai Data Residency · BFSI-Ready · No Credit Card
          </div>
        </div>
        <div className="rr-bounce" style={{ position: 'absolute', bottom: 36, color: ZINC, fontSize: 22 }}>↓</div>
      </section>

      {/* SECTION 2 — Simulation preview */}
      <section className="reveal" style={{ padding: '100px 24px', background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', marginBottom: 12 }}>Watch Richard destroy a bad pitch.</h2>
            <p style={{ fontSize: 15, color: ZINC }}>Then watch a good rep win.</p>
          </div>
          <div className="rr-grid-2" style={{ gap: 24 }}>
            <div style={{ border: `1px solid rgba(245,158,11,0.25)`, background: '#0A0A0A', padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <span className="rr-red-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: RED, display: 'inline-block' }} />
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#fff', textTransform: 'uppercase' }}>Richard Vance · VP Procurement</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 36, marginBottom: 24 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <span key={i} style={{ width: 4, height: '100%', background: CYAN, opacity: 0.7, transformOrigin: 'bottom', animation: `rr-waveform ${0.7 + (i % 4) * 0.15}s ease-in-out infinite`, animationDelay: `${i * 0.08}s` }} />
                ))}
              </div>
              <div style={{ marginBottom: 24 }}>
                <HostilityMeter />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.15em', color: ZINC, textTransform: 'uppercase' }}>Live Score</span>
                </div>
                <Counter from={75} to={45} duration={2400} style={{ fontFamily: FONT_HEAD, fontSize: 32, fontWeight: 700, color: RED }} />
              </div>
              <div style={{ fontSize: 13, color: ZINC, lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                <p style={{ marginBottom: 8 }}><span style={{ color: '#fff', fontWeight: 700 }}>[Rep]</span> So before I get to pricing I just want to understand—</p>
                <p><span style={{ color: GOLD, fontWeight: 700 }}>[Richard]</span> I said skip the discovery. What's your number.</p>
              </div>
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#0A0A0A', padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: '0.2em', color: ZINC, textTransform: 'uppercase', marginBottom: 20 }}>Simulation Complete</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 48, fontWeight: 700, color: RED }}>45/100</span>
                  <span style={{ fontFamily: FONT_HEAD, fontSize: 24, fontWeight: 700, color: ZINC }}>Grade: D</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', color: RED, textTransform: 'uppercase', marginBottom: 10 }}>What You Did Wrong</div>
                <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.7 }}>Led with discovery when prospect demanded numbers.</p>
              </div>
              <Link href="/sign-in" style={{ display: 'block', marginTop: 28, padding: '14px', textAlign: 'center', background: GOLD, color: '#000', fontWeight: 900, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Try again →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Numbers */}
      <section className="reveal" style={{ padding: '90px 24px' }}>
        <div className="rr-grid-4" style={{ maxWidth: 1080, margin: '0 auto', gap: 1, background: 'rgba(255,255,255,0.06)' }}>
          {[
            { from: 0, to: 6, suffix: '', label: 'Dimensions Scored Per Session' },
            { from: 0, to: 5, suffix: '', label: 'Qualification Stages' },
            { from: 0, to: 90, suffix: '%', label: 'Max Hostility Reached' },
            { from: 0, to: 0, suffix: '', label: 'Deals Lost In Practice' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#0A0A0A', padding: '48px 28px', textAlign: 'center' }}>
              <Counter from={s.from} to={s.to} suffix={s.suffix} style={{ fontFamily: FONT_HEAD, fontSize: 48, fontWeight: 700, color: GOLD, display: 'block' }} />
              <div style={{ fontSize: 11, color: ZINC, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 14 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — How it works */}
      <section className="reveal" style={{ padding: '100px 24px', background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="rr-grid-3" style={{ gap: 32 }}>
            {[
              { n: '01', title: 'Face Richard', desc: "VP Procurement. CFO-mandated 20% cut. 22 years buying software. He's heard every pitch. He starts at 40% hostile." },
              { n: '02', title: 'Get Scored', desc: 'The boardroom scores you across 6 dimensions. Procurement analyst + Enablement critic + Executive summarizer.' },
              { n: '03', title: 'Get Harder', desc: 'Score 70+ and Richard starts your next session more aggressive. The only simulator where difficulty is earned.' },
            ].map((step) => (
              <div key={step.n}>
                <div style={{ fontFamily: FONT_HEAD, fontSize: 40, fontWeight: 700, color: GOLD, marginBottom: 16 }}>{step.n}</div>
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: ZINC, lineHeight: 1.8 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — Personas */}
      <section className="reveal" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 56 }}>Choose your opponent.</h2>
          <div className="rr-grid-2" style={{ gap: 24 }}>
            {[
              { key: 'richard', name: 'Richard Vance', role: 'VP Procurement', color: RED, img: '/Richard.png', stars: 5, desc: 'CFO-mandated 20% cost reduction. 22 years experience. He\'s seen every vendor tactic in existence.', tags: null, hostility: '40% → 90%' },
              { key: 'sandra', name: 'Sandra Chen', role: 'Head of IT', color: CYAN, img: '/Sandra.png', stars: 4, desc: "Aggressively protects her team's bandwidth. Every response contains a blocker.", tags: ['Claims zero implementation capacity', 'Demands SOC 2'], hostility: null },
            ].map((p) => {
              const isHovered = hoveredPersona === p.key;
              return (
                <div
                  key={p.key}
                  className={`rr-persona-card${isHovered ? ' hovered' : ''}`}
                  onMouseEnter={() => setHoveredPersona(p.key)}
                  onMouseLeave={() => setHoveredPersona(null)}
                  style={{ border: `1px solid ${isHovered ? p.color : 'rgba(255,255,255,0.1)'}`, background: '#0d0d0d', padding: 28, boxShadow: isHovered ? `0 12px 32px rgba(0,0,0,0.5)` : 'none' }}
                >
                  <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                    <div style={{ width: 72, height: 90, border: `1px solid ${p.color}55`, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', opacity: 0.85 }} />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: FONT_HEAD, fontSize: 19, fontWeight: 700, color: '#fff' }}>{p.name}</h3>
                      <div style={{ color: p.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '4px 0' }}>{p.role}</div>
                      <div style={{ color: RED, fontSize: 13, letterSpacing: '2px' }}>{'★'.repeat(p.stars)}<span style={{ color: 'rgba(255,255,255,0.15)' }}>{'★'.repeat(5 - p.stars)}</span></div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: ZINC, lineHeight: 1.7, marginBottom: 16 }}>{p.desc}</p>
                  {p.hostility && (
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: RED, letterSpacing: '0.05em', marginBottom: 16 }}>Hostility range: {p.hostility}</div>
                  )}
                  {p.tags && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                      {p.tags.map((t) => (
                        <span key={t} style={{ fontSize: 11, color: CYAN, border: `1px solid rgba(34,211,238,0.35)`, padding: '5px 10px', opacity: isHovered ? 1 : 0.6, transition: 'opacity 0.3s ease' }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <Link href="/sign-in" style={{ display: 'block', marginTop: 8, padding: '12px', textAlign: 'center', border: `1px solid ${p.color}66`, color: p.color, fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    Challenge {p.name.split(' ')[0]} →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6 — Qualification journey */}
      <section className="reveal" style={{ padding: '100px 24px', background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 60 }}>The only simulator where difficulty is earned.</h2>
          <QualificationJourney />
        </div>
      </section>

      {/* SECTION 7 — Skill matrix */}
      <section className="reveal" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 12 }}>Know exactly which skill is costing your team deals.</h2>
          <div style={{ marginTop: 56 }}>
            <SkillBar label="Discovery Quality" pct={78} />
            <SkillBar label="Objection Handling" pct={61} />
            <SkillBar label="Price Defense" pct={42} weak />
            <SkillBar label="SME Knowledge" pct={68} />
            <SkillBar label="Communication" pct={75} />
            <SkillBar label="Emotional Resilience" pct={85} />
          </div>
          <p style={{ fontSize: 13, color: ZINC, textAlign: 'center', marginTop: 32, lineHeight: 1.7 }}>
            <span style={{ color: RED, fontWeight: 700 }}>Price Defense</span> is your team's weakest skill. RepReady identifies it after session 1.
          </p>
        </div>
      </section>

      {/* SECTION 8 — India section */}
      <section className="reveal" style={{ padding: '100px 24px', background: GOLD, color: '#000' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 700, color: '#000', textAlign: 'center', marginBottom: 60, lineHeight: 1.15 }}>
            Built for Indian enterprise sales.<br />Not adapted from US tools.
          </h2>
          <div className="rr-grid-3" style={{ gap: 40 }}>
            {[
              { title: 'DPDP Act 2023 Compliant', desc: 'Voice data processed with explicit consent. Session data stored in Mumbai. Never used to train AI.' },
              { title: 'Mumbai Data Residency', desc: 'MongoDB Atlas Mumbai region. Your data never leaves India.' },
              { title: 'India Pricing', desc: "Transparent pricing in INR. No 'contact sales'. No USD pricing. No hidden fees." },
            ].map((c) => (
              <div key={c.title}>
                <h3 style={{ fontFamily: FONT_HEAD, fontSize: 15, fontWeight: 700, color: '#000', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>{c.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.7)', lineHeight: 1.8 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — Pricing */}
      <section id="pricing" className="reveal" style={{ padding: '100px 24px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>Transparent pricing. No surprises.</h2>
            <p style={{ fontSize: 14, color: ZINC }}>Unlike US competitors, we show you the price.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '32px 0 56px' }}>
            <span style={{ fontSize: 12, color: annual ? ZINC : '#fff', fontWeight: 700 }}>Monthly</span>
            <button
              onClick={() => setAnnual((a) => !a)}
              aria-label="Toggle annual billing"
              style={{ width: 44, height: 24, borderRadius: 12, border: `1px solid ${GOLD}`, background: annual ? GOLD : 'transparent', position: 'relative', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ position: 'absolute', top: 2, left: annual ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: annual ? '#000' : GOLD, transition: 'left 0.25s ease' }} />
            </button>
            <span style={{ fontSize: 12, color: annual ? '#fff' : ZINC, fontWeight: 700 }}>Annual <span style={{ color: GOLD }}>(Save 20%)</span></span>
          </div>
          <div className="rr-grid-3" style={{ gap: 24 }}>
            {plans.map((plan) => {
              const price = plan.monthly === null ? null : (annual ? Math.round(plan.monthly * 0.8) : plan.monthly);
              return (
                <div key={plan.name} style={{ position: 'relative', border: `1px solid ${plan.badge ? GOLD : 'rgba(255,255,255,0.1)'}`, background: '#0d0d0d', padding: 32 }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -12, left: 32, background: GOLD, color: '#000', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', padding: '4px 12px' }}>{plan.badge}</div>
                  )}
                  <h3 style={{ fontFamily: FONT_HEAD, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 24 }}>
                    {price === null ? (
                      <span style={{ fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 700, color: '#fff' }}>Custom</span>
                    ) : (
                      <>
                        <span style={{ fontFamily: FONT_HEAD, fontSize: 32, fontWeight: 700, color: '#fff' }}>₹{price.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: 12, color: ZINC }}>/user/month</span>
                      </>
                    )}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ fontSize: 13, color: ZINC, display: 'flex', gap: 8 }}><span style={{ color: GOLD }}>✓</span>{f}</li>
                    ))}
                  </ul>
                  <a href={plan.href} style={{ display: 'block', textAlign: 'center', padding: '13px', background: plan.badge ? GOLD : 'transparent', border: plan.badge ? 'none' : '1px solid rgba(255,255,255,0.2)', color: plan.badge ? '#000' : '#fff', fontWeight: 900, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    {plan.cta}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 10 — Final CTA */}
      <section ref={ctaRef} className="reveal" style={{ position: 'relative', padding: '140px 24px', background: '#050505', borderTop: '1px solid rgba(245,158,11,0.15)', textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(245,158,11,0.08), transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 700, color: '#fff', marginBottom: 32, lineHeight: 1.15 }}>Stop practicing on real prospects.</h2>
          <a href="mailto:demo@repready.site" className="rr-gold-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: GOLD, color: '#000', padding: '20px 52px', fontWeight: 900, fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', marginBottom: 20 }}>
            Book a Demo
          </a>
          <p style={{ fontSize: 12, color: ZINC }}>60-second setup. No credit card required for free trial.</p>
        </div>
      </section>

      {/* SECTION 11 — Footer */}
      <footer style={{ padding: '40px 24px', background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, border: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 12 }}>R</span>
            </div>
            <span style={{ color: '#fff', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14 }}>REP<span style={{ color: GOLD }}>READY</span></span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="/privacy" style={{ fontSize: 12, color: ZINC, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: 12, color: ZINC, textDecoration: 'none' }}>Terms</a>
            <a href="mailto:demo@repready.site" style={{ fontSize: 12, color: ZINC, textDecoration: 'none' }}>Contact</a>
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em', textAlign: 'right' }}>
            SESSION DATA · MONGODB ATLAS MUMBAI · NEVER USED TO TRAIN AI · DPDP ACT 2023 COMPLIANT
          </div>
        </div>
      </footer>
    </div>
  );
}
