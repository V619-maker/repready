'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const FONT_HEAD = "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const CYAN = '#22D3EE';
const RED = '#EF4444';
const GREEN = '#22C55E';
const ZINC = '#A1A1AA';

const BOOK_DEMO_URL = 'https://cal.com/vrushal-kitke-lg9txr/30min';

// Fabricated example activity lines for the hero ticker — a static, looping
// visual signal of product activity, not a live feed. No DB query involved.
const ACTIVITY_LINES = [
  'Rep scored 74 vs. Richard · 2m ago',
  'Objection Handling flagged weak · 5m ago',
  'New session started vs. Sandra · 8m ago',
  'Rep reached Qualified status · 12m ago',
];

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
        <span style={{ fontSize: 12, color: '#fff', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: weak ? RED : CYAN }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: visible ? `${pct}%` : '0%', background: weak ? RED : CYAN, borderRadius: 3, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function Home() {
  const [annual, setAnnual] = useState(false);

  useRevealOnScroll();

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

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0A0A0A', fontFamily: FONT_BODY, color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap');

        .reveal { opacity: 1; transform: translateY(28px); transition: transform 0.7s ease; }
        .reveal.is-visible { transform: translateY(0); }

        @keyframes rr-cyan-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.4); } 50% { box-shadow: 0 0 0 14px rgba(34,211,238,0); } }
        .rr-cyan-btn { animation: rr-cyan-pulse 2.6s ease-in-out infinite; }

        @keyframes rr-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .rr-ticker-track { animation: rr-ticker 24s linear infinite; }

        .rr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; }
        .rr-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
        .rr-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); }

        @media (max-width: 860px) {
          .rr-grid-2, .rr-grid-3, .rr-grid-4 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: 'rgba(10,10,10,0.9)', borderBottom: `1px solid rgba(34,211,238,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 200, backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${CYAN}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>R</span>
          </div>
          <span style={{ color: '#fff', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, letterSpacing: '0.05em' }}>REP<span style={{ color: CYAN }}>READY</span></span>
        </Link>
        <Link href="/sign-in" style={{ background: CYAN, color: '#000', padding: '9px 22px', fontSize: 11, fontWeight: 900, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Sign In</Link>
      </nav>

      {/* SECTION 1 — Hero */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '140px 24px 100px' }}>
        <div style={{ maxWidth: 880 }}>
          <h1 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(44px, 7.5vw, 84px)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.02, marginBottom: 36 }}>
            Find out which skill is costing your team deals — before next quarter does.
          </h1>
          <p style={{ fontSize: 17, color: ZINC, maxWidth: 620, margin: '0 auto 48px', lineHeight: 1.7 }}>
            RepReady runs your reps against hostile AI buyers and returns a skill diagnostic after session one. Voice-only. Scored across 6 dimensions.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" className="rr-cyan-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: CYAN, color: '#000', padding: '17px 40px', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Book a 30-min Demo
            </a>
            <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', padding: '17px 8px', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
              Reps: Try it free →
            </Link>
          </div>
          <div style={{ marginTop: 64, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)', maskImage: 'linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)' }}>
            <div className="rr-ticker-track" style={{ display: 'flex', gap: 40, width: 'max-content' }}>
              {[...ACTIVITY_LINES, ...ACTIVITY_LINES].map((line, i) => (
                <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 11, color: ZINC, letterSpacing: '0.02em', whiteSpace: 'nowrap', opacity: 0.65 }}>
                  <span style={{ color: CYAN, marginRight: 6 }}>●</span>{line}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Skill matrix */}
      <section className="reveal" style={{ padding: '120px 24px', background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 48 }}>Session 1 tells you exactly where your team is leaking deals.</h2>
          <div>
            {teamSkills.map((s) => (
              <SkillBar key={s.label} label={s.label} pct={s.pct} weak={s.weak} />
            ))}
          </div>
          <p style={{ fontSize: 13, color: ZINC, textAlign: 'center', marginTop: 32, marginBottom: 40, lineHeight: 1.7 }}>
            <span style={{ color: RED, fontWeight: 700 }}>Objection Handling</span> is your team's weakest skill. RepReady assigns targeted sessions automatically.
          </p>
          <div style={{ textAlign: 'center' }}>
            <a href="#session-report" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: CYAN, fontSize: 12, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${CYAN}` }}>
              See a real session report ↓
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 3 — Real session report */}
      <section id="session-report" className="reveal" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 12 }}>This is what your VP of Sales gets after session one.</h2>
          <p style={{ fontSize: 11, color: ZINC, textAlign: 'center', marginBottom: 40, opacity: 0.7 }}>Illustrative example</p>
          <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 16px', background: '#050505', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'inline-block' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(255,255,255,0.24)', display: 'inline-block' }} />
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: ZINC, opacity: 0.5, letterSpacing: '0.02em' }}>session-report — repready.site</span>
            </div>
            <div style={{ background: '#0d0d0d', padding: 32 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: ZINC, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>
              Rep: Anonymous Rep · Persona: Richard Vance · Date: July 2026
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'baseline', marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 24 }}>
              <div>
                <Counter from={0} to={73} style={{ fontFamily: FONT_HEAD, fontSize: 40, fontWeight: 700, color: CYAN }} />
                <span style={{ fontFamily: FONT_HEAD, fontSize: 40, fontWeight: 700, color: CYAN }}>/100</span>
              </div>
              <div style={{ fontSize: 14, color: ZINC }}>Grade: <span style={{ color: '#fff', fontWeight: 700 }}>B</span></div>
              <div style={{ fontSize: 14, color: ZINC }}>Hostility: <span style={{ color: '#fff', fontWeight: 700 }}>62%</span></div>
              <div style={{ fontSize: 14, color: ZINC }}>Procurement: <span style={{ color: '#fff', fontWeight: 700 }}>78/100</span></div>
              <div style={{ fontSize: 14, color: ZINC }}>Enablement: <span style={{ color: '#fff', fontWeight: 700 }}>65/100</span></div>
            </div>

            <div className="rr-grid-2" style={{ gap: 24, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', color: GREEN, textTransform: 'uppercase', marginBottom: 10 }}>What You Did Right</div>
                <p style={{ fontSize: 13, color: ZINC, lineHeight: 1.8 }}>Postponed price discussion twice. Never apologized for list price. Forced Richard to reveal the freight crisis by holding on discovery.</p>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', color: RED, textTransform: 'uppercase', marginBottom: 10 }}>What You Did Wrong</div>
                <p style={{ fontSize: 13, color: ZINC, lineHeight: 1.8 }}>Lost call control in turn 4. Responded to silence with a feature list instead of a question. Gave away the SLA commitment without trading for value.</p>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.15em', color: CYAN, textTransform: 'uppercase', marginBottom: 10 }}>One Thing To Fix Next</div>
              <p style={{ fontSize: 13, color: '#fff', lineHeight: 1.8 }}>When Richard goes silent — count to 5 before speaking. Silence is his weapon. Make it yours.</p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, marginBottom: 24 }}>
              {sessionSkills.map((s) => (
                <SkillBar key={s.label} label={s.label} pct={s.pct} />
              ))}
            </div>

            <Link href="/coach" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: CYAN, fontSize: 12, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
              See full coach report →
            </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Demo (failure and win) */}
      <section className="reveal" style={{ padding: '120px 24px', background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 700, color: '#fff', textAlign: 'center', marginBottom: 56 }}>Watch Richard destroy a bad pitch. Then watch the same rep win.</h2>
          <div className="rr-grid-2" style={{ gap: 24, marginBottom: 32 }}>
            <div style={{ border: `1px solid ${RED}`, background: '#0A0A0A', padding: 28, boxShadow: '0 16px 40px rgba(239,68,68,0.08)' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: RED, textTransform: 'uppercase', marginBottom: 20 }}>Bad Rep</div>
              <div style={{ fontSize: 13, color: ZINC, lineHeight: 1.9, marginBottom: 24 }}>
                <p style={{ marginBottom: 10 }}><span style={{ color: '#fff', fontWeight: 700 }}>[Richard]</span> "You've got 3 minutes. What's your number?"</p>
                <p style={{ marginBottom: 10 }}><span style={{ color: CYAN, fontWeight: 700 }}>[Rep]</span> "So before I get to pricing I just want to understand your challenges—"</p>
                <p style={{ marginBottom: 10 }}><span style={{ color: '#fff', fontWeight: 700 }}>[Richard]</span> "I said skip the discovery. What. Is. Your. Number."</p>
                <p style={{ marginBottom: 10 }}><span style={{ color: CYAN, fontWeight: 700 }}>[Rep]</span> "We're very cost-effective compared to—"</p>
                <p><span style={{ color: '#fff', fontWeight: 700 }}>[Richard]</span> "I'm hanging up."</p>
              </div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 24, fontWeight: 700, color: RED }}>31/100 <span style={{ fontSize: 16, color: ZINC }}>Grade: F</span></div>
            </div>
            <div style={{ border: `1px solid ${GREEN}`, background: '#0A0A0A', padding: 28, boxShadow: '0 16px 40px rgba(34,197,94,0.08)' }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: GREEN, textTransform: 'uppercase', marginBottom: 20 }}>Same Rep, Session 4</div>
              <div style={{ fontSize: 13, color: ZINC, lineHeight: 1.9, marginBottom: 24 }}>
                <p style={{ marginBottom: 10 }}><span style={{ color: '#fff', fontWeight: 700 }}>[Richard]</span> "You've got 3 minutes. What's your number."</p>
                <p style={{ marginBottom: 10 }}><span style={{ color: CYAN, fontWeight: 700 }}>[Rep]</span> "₹40 lakhs a year in invoice delays. That's what Apex cost you last quarter. We fix that for less. Want the number now or after I show you the math?"</p>
                <p style={{ marginBottom: 10 }}><span style={{ color: '#fff', fontWeight: 700 }}>[Richard]</span> "...How do you know about the Apex outage."</p>
                <p><span style={{ color: CYAN, fontWeight: 700 }}>[Rep]</span> "Because I asked the right questions. Can we talk for 10 more minutes?"</p>
              </div>
              <div style={{ fontFamily: FONT_HEAD, fontSize: 24, fontWeight: 700, color: GREEN }}>73/100 <span style={{ fontSize: 16, color: ZINC }}>Grade: B</span></div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: ZINC, textAlign: 'center', maxWidth: 640, margin: '0 auto', lineHeight: 1.8 }}>
            Richard gets harder between sessions. Score 70+ at 62% hostility and your next session starts at 72% hostile. Difficulty is earned, not set.
          </p>
        </div>
      </section>

      {/* SECTION 5 — Pricing */}
      <section id="pricing" className="reveal" style={{ padding: '130px 24px', background: '#0A0A0A' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 700, color: '#fff', marginBottom: 12 }}>Transparent pricing. No surprises.</h2>
            <p style={{ fontSize: 14, color: ZINC }}>Unlike US competitors, we show you the number.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '32px 0 64px' }}>
            <span style={{ fontSize: 12, color: annual ? ZINC : '#fff', fontWeight: 700 }}>Monthly</span>
            <button
              onClick={() => setAnnual((a) => !a)}
              aria-label="Toggle annual billing"
              style={{ width: 44, height: 24, borderRadius: 12, border: `1px solid ${CYAN}`, background: annual ? CYAN : 'transparent', position: 'relative', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ position: 'absolute', top: 2, left: annual ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: annual ? '#000' : CYAN, transition: 'left 0.25s ease' }} />
            </button>
            <span style={{ fontSize: 12, color: annual ? '#fff' : ZINC, fontWeight: 700 }}>Annual <span style={{ color: CYAN }}>(Save 20%)</span></span>
          </div>
          <div className="rr-grid-4" style={{ gap: 24 }}>
            {plans.map((plan) => {
              const price = plan.monthly === null ? null : (annual ? plan.annualPrice : plan.monthly);
              return (
                <div key={plan.name} style={{ position: 'relative', border: `1px solid ${plan.badge ? CYAN : 'rgba(255,255,255,0.1)'}`, background: '#0d0d0d', padding: plan.badge ? 34 : 28, boxShadow: plan.badge ? '0 20px 50px rgba(34,211,238,0.12)' : 'none' }}>
                  {plan.badge && (
                    <div style={{ position: 'absolute', top: -12, left: 28, background: CYAN, color: '#000', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', padding: '4px 12px' }}>{plan.badge}</div>
                  )}
                  <h3 style={{ fontFamily: FONT_HEAD, fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 14 }}>{plan.name}</h3>
                  <div style={{ marginBottom: 20 }}>
                    {price === null ? (
                      <span style={{ fontFamily: FONT_HEAD, fontSize: 22, fontWeight: 700, color: '#fff' }}>Custom pricing</span>
                    ) : (
                      <>
                        <span style={{ fontFamily: FONT_HEAD, fontSize: 28, fontWeight: 700, color: '#fff' }}>₹{price.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: 11, color: ZINC }}>/user/mo</span>
                      </>
                    )}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ fontSize: 12, color: ZINC, display: 'flex', gap: 8 }}><span style={{ color: CYAN }}>✓</span>{f}</li>
                    ))}
                  </ul>
                  <a href={plan.href} target={plan.href.startsWith('http') ? '_blank' : undefined} rel={plan.href.startsWith('http') ? 'noopener noreferrer' : undefined} style={{ display: 'block', textAlign: 'center', padding: '12px', background: plan.badge ? CYAN : 'transparent', border: plan.badge ? 'none' : '1px solid rgba(255,255,255,0.2)', color: plan.badge ? '#000' : '#fff', fontWeight: 900, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    {plan.cta}
                  </a>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <p style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
              DPDP Act 2023 Compliant · MongoDB Atlas Mumbai · Voice data never used to train AI · Delete anytime: privacy@repready.site
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Final CTA */}
      <section className="reveal" style={{ padding: '140px 24px', background: '#050505', borderTop: '1px solid rgba(34,211,238,0.15)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: FONT_HEAD, fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.15 }}>Stop practicing on real prospects.</h2>
          <p style={{ fontSize: 14, color: ZINC, marginBottom: 36 }}>Book a 30-minute demo. We'll run your team through session one live.</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" className="rr-cyan-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: CYAN, color: '#000', padding: '18px 44px', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Book a Demo
            </a>
            <Link href="/sign-in" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', padding: '18px 8px', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
              Try it yourself free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="/privacy" style={{ fontSize: 12, color: ZINC, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/terms" style={{ fontSize: 12, color: ZINC, textDecoration: 'none' }}>Terms</a>
            <a href={BOOK_DEMO_URL} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: ZINC, textDecoration: 'none' }}>Contact</a>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>© 2026 RepReady</div>
        </div>
      </footer>
    </div>
  );
}
