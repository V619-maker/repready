'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Target, Zap, Activity, Radio, BarChart3, BotMessageSquare, BrainCircuit, Fingerprint, Mail, Shield, Lock, Globe } from 'lucide-react';

const WORKFLOW_STEPS = [
  { id: '01', title: 'Adversary Init', desc: 'Configure AI buyer hostility and objection profile.', icon: Target },
  { id: '02', title: 'Voice Link', desc: 'Ultra-low latency, real-time voice connection.', icon: Radio },
  { id: '03', title: 'Combat', desc: 'AI stress-tests frame control and negotiation skills.', icon: Zap },
  { id: '04', title: 'Telemetry', desc: 'Deep-dive processing of audio and tonality metrics.', icon: BarChart3 },
  { id: '05', title: 'Review', desc: 'Personalized AI coaching and performance feedback.', icon: BotMessageSquare }
];

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActiveStep(p => (p + 1) % WORKFLOW_STEPS.length), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal-section');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#0a0d14', fontFamily: 'monospace', color: '#fff' }}>

      <div style={{ position: 'fixed', inset: 0, opacity: 0.06, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(0,200,224,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,224,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: 'rgba(10,13,20,0.95)', borderBottom: '1px solid rgba(0,200,224,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 0 130px', zIndex: 200, backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, border: '2px solid #00c8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>R</span>
            <div style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, background: '#e84545', borderRadius: '50%' }} />
          </div>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: '0.05em' }}>REP<span style={{ color: '#00c8e0' }}>READY</span></span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/pricing" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>Pricing</Link>
          <Link href="/sign-in" style={{ background: '#fff', color: '#000', padding: '8px 20px', fontSize: 11, fontWeight: 900, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Sign In</Link>
        </div>
      </nav>

      {/* Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 100, background: '#050505', borderRight: '1px solid rgba(0,200,224,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, zIndex: 100, gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 0', width: '100%' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c8e0', boxShadow: '0 0 8px #00c8e0' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Active</span>
        </div>
        <Link href="/deck" style={{ textDecoration: 'none', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 0', width: '100%', borderLeft: '3px solid #00c8e0', background: 'rgba(0,200,224,0.05)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c8e0" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            <span style={{ color: '#00c8e0', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Dash</span>
          </div>
        </Link>
        <Link href="/coach" style={{ textDecoration: 'none', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px 0', width: '100%' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Coach</span>
          </div>
        </Link>
      </div>

      <div style={{ paddingLeft: 100, paddingTop: 64 }}>

        {/* Hero */}
        <section className="reveal-section" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 40px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', marginBottom: 32, padding: '8px 24px', border: '1px solid rgba(0,200,224,0.4)', background: 'rgba(0,200,224,0.05)', color: '#00c8e0', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', fontWeight: 900 }}>
            B2B Sales Simulation Engine V1.0
          </div>
          <h1 style={{ fontSize: 'clamp(48px, 8vw, 90px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 0.9, marginBottom: 32, textTransform: 'uppercase', fontStyle: 'italic' }}>
            Stop Practicing On<br /><span style={{ color: '#e84545' }}>Real Prospects.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.8 }}>
            Run live, voice-to-voice negotiations with hostile AI buyers. Get instant telemetry, frame-control analysis, and ruthless feedback from the AI Coach.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/deck" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#00c8e0', color: '#000', padding: '18px 48px', fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Start Free Trial <ChevronRight size={16} />
            </Link>
            <a href="mailto:sales@repready.site" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '18px 48px', fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none' }}>
              Book a Demo
            </a>
          </div>
        </section>

        {/* Trust bar */}
        <div style={{ background: '#0d1117', borderTop: '1px solid rgba(0,200,224,0.1)', borderBottom: '1px solid rgba(0,200,224,0.1)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
          {[
            { icon: <Lock size={14} />, text: 'AES-256 Encrypted' },
            { icon: <Shield size={14} />, text: 'DPDP Act 2023 Aligned' },
            { icon: <Globe size={14} />, text: 'Built for India & SEA' },
            { icon: <Shield size={14} />, text: 'Data never used to train AI' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <span style={{ color: '#00c8e0' }}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        {/* Stats */}
        <section className="reveal-section" style={{ padding: '80px 40px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(0,200,224,0.1)' }}>
            {[
              { n: '1,200+', label: 'Simulations run' },
              { n: '2', label: 'Hostile AI buyer personas' },
              { n: '8', label: 'Coaching dimensions scored' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0a0d14', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: '#00c8e0', fontStyle: 'italic', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Built for */}
        <section className="reveal-section" style={{ padding: '80px 40px', background: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ color: '#00c8e0', fontSize: 10, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>Who it's for</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Built for every person<br />on your revenue team.</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'rgba(255,255,255,0.05)' }}>
              {[
                { role: 'SDRs', desc: 'Handle cold call objections before they cost you a meeting. Practice the first 60 seconds until it\'s automatic.' },
                { role: 'AEs', desc: 'Sharpen discovery, price defense, and multi-stakeholder navigation. Win the deals you should already be closing.' },
                { role: 'Sales Managers', desc: 'See exactly where each rep loses ground. Coach to specific objection patterns, not gut feel.' },
                { role: 'VP Sales', desc: 'Ramp new hires faster. Reduce lost deals from poor preparation. Track team readiness with real data.' },
              ].map((r, i) => (
                <div key={i} style={{ background: '#0d1117', padding: '32px 24px' }}>
                  <div style={{ fontSize: 11, color: '#00c8e0', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16, borderBottom: '1px solid rgba(0,200,224,0.2)', paddingBottom: 12 }}>{r.role}</div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8 }}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="reveal-section" style={{ padding: '80px 40px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 40, color: '#00c8e0', lineHeight: 1, marginBottom: 24, opacity: 0.4 }}>"</div>
            <p style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', color: '#fff', fontStyle: 'italic', fontWeight: 700, lineHeight: 1.5, marginBottom: 32, letterSpacing: '-0.01em' }}>
              Richard is more aggressive than any real CFO I've met. After 10 sessions I stopped flinching on price completely.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,200,224,0.1)', border: '1px solid rgba(0,200,224,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00c8e0', fontWeight: 900, fontSize: 14 }}>A</div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>AE, B2B SaaS</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Early Access User</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="reveal-section" style={{ padding: '80px 40px', background: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ color: '#00c8e0', fontSize: 10, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>How it works</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>From zero to deal-ready<br />in under an hour.</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.05)' }}>
              {[
                { n: '01', title: 'Choose Your Scenario', desc: 'Pick from CFO pushback, budget freeze, procurement stall, or competitor price match. Each scenario has a fully briefed hostile AI buyer.' },
                { n: '02', title: 'Run the Live Call', desc: 'Go voice-to-voice with Richard or Sandra. Real pressure, real objections, real-time deal health scoring. Zero consequences.' },
                { n: '03', title: 'Get Coached & Scored', desc: 'Instant AI Coach feedback across 8 dimensions. See exactly where you lost ground and what to fix before the next real deal.' },
              ].map((step, i) => (
                <div key={i} style={{ background: '#0d1117', padding: '40px 32px', position: 'relative' }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: 'rgba(0,200,224,0.15)', fontStyle: 'italic', lineHeight: 1, marginBottom: 20 }}>{step.n}</div>
                  <h3 style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontStyle: 'italic' }}>{step.title}</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.8 }}>{step.desc}</p>
                  {i < 2 && <div style={{ position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)', color: '#00c8e0', fontSize: 20, zIndex: 1 }}>→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Meet the buyers */}
        <section className="reveal-section" style={{ padding: '80px 40px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ color: '#00c8e0', fontSize: 10, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>AI Buyer Personas</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Meet the buyers your reps<br />face on every call.</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 16, maxWidth: 500, margin: '16px auto 0' }}>Richard and Sandra aren't generic chatbots. They have full backstories, pressure tactics, and negotiation playbooks built to expose the real gaps in your team's approach.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {[
                { name: 'Richard Vance', role: 'VP Procurement', company: '500-person Logistics Firm', img: '/Richard.png', color: '#00c8e0', traits: ['Anchors hard on price in the first 60 seconds', 'Uses silence as a weapon — waits you out', 'References 3 competing vendors whether they exist or not', 'Escalates to CFO approval threat when cornered'] },
                { name: 'Sandra Chen', role: 'Head of IT', company: '800-person Financial Firm', img: '/Sandra.png', color: '#e84545', traits: ["Aggressively protects her team's bandwidth", 'Claims zero implementation capacity this quarter', 'Demands SOC 2 Type II before any conversation', 'Requires native SAML/SSO as a hard blocker'] }
              ].map((p, i) => (
                <div key={i} style={{ border: `1px solid ${p.color}22`, background: '#0d1117', padding: 32 }}>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
                    <div style={{ width: 80, height: 100, border: `1px solid ${p.color}33`, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', opacity: 0.8 }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.01em' }}>{p.name}</h3>
                      <div style={{ color: p.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>{p.role}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>{p.company}</div>
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {p.traits.map((t, j) => (
                      <li key={j} style={{ display: 'flex', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                        <span style={{ color: p.color, flexShrink: 0 }}>›</span>{t}
                      </li>
                    ))}
                  </ul>
                  <Link href="/deck" style={{ display: 'block', marginTop: 24, padding: '12px', textAlign: 'center', border: `1px solid ${p.color}44`, color: p.color, fontSize: 10, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    Challenge {p.name.split(' ')[0]} →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* System Architecture */}
        <section className="reveal-section" style={{ padding: '80px 40px', background: '#0d1117', borderTop: '1px solid rgba(0,200,224,0.1)', borderBottom: '1px solid rgba(0,200,224,0.1)', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ color: '#00c8e0', fontSize: 10, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>Under the hood</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>System Architecture</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {WORKFLOW_STEPS.map((step, index) => (
                  <div key={step.id} onClick={() => setActiveStep(index)} style={{ padding: 24, border: `1px solid ${activeStep === index ? 'rgba(0,200,224,0.5)' : 'rgba(255,255,255,0.05)'}`, background: activeStep === index ? 'rgba(0,200,224,0.05)' : '#0a0d14', cursor: 'pointer', transition: 'all 0.3s', transform: activeStep === index ? 'translateX(8px)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <span style={{ fontSize: 40, fontWeight: 900, fontStyle: 'italic', color: activeStep === index ? '#00c8e0' : 'rgba(255,255,255,0.1)' }}>{step.id}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: activeStep === index ? '#fff' : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{step.title}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{step.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ position: 'sticky', top: 100, aspectRatio: '1', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(0,200,224,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,224,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <AnimatePresence mode="wait">
                  <motion.div key={activeStep} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: 40, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activeStep === 0 && <Fingerprint size={48} color="#00c8e0" />}
                      {activeStep === 1 && <Radio size={48} color="#00c8e0" />}
                      {activeStep === 2 && <Zap size={48} color="#e84545" />}
                      {activeStep === 3 && <BarChart3 size={48} color="#00c8e0" />}
                      {activeStep === 4 && <BrainCircuit size={48} color="#00c8e0" />}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.2em', fontStyle: 'italic' }}>{WORKFLOW_STEPS[activeStep].title}</div>
                    <div style={{ width: 120, height: 1, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }} style={{ height: '100%', background: '#00c8e0' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.4em', textTransform: 'uppercase' }}>Node // Sequence_{activeStep + 1}</div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="reveal-section" style={{ padding: '80px 40px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ color: '#00c8e0', fontSize: 10, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>Platform features</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, color: '#fff', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Every tool your team needs<br />to win harder deals.</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { icon: <Radio size={28} color="#00c8e0" />, title: 'Hostile Voice AI', desc: 'Ultra-low latency voice models trained to throw objections, break your frame, and test your BANT execution in real-time.' },
                { icon: <Activity size={28} color="#00c8e0" />, title: 'Instant Telemetry', desc: 'The second you hang up, the system generates a 0-100 aggregate score isolating your discovery, value articulation, and presence.' },
                { icon: <BrainCircuit size={28} color="#00c8e0" />, title: 'Ruthless AI Coach', desc: 'Review raw transcripts with an elite AI manager that quotes your exact mistakes and provides tactical fixes.' },
              ].map((f, i) => (
                <div key={i} style={{ padding: 32, border: '1px solid rgba(255,255,255,0.05)', background: '#0d1117' }}>
                  <div style={{ marginBottom: 20 }}>{f.icon}</div>
                  <h3 style={{ color: '#fff', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontStyle: 'italic' }}>{f.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.8 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="reveal-section" style={{ padding: '100px 40px', background: '#050505', borderTop: '1px solid rgba(0,200,224,0.1)', textAlign: 'center', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,200,224,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 900, color: '#fff', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1 }}>
              Your reps are practicing on<br /><span style={{ color: '#e84545' }}>real prospects. Every day.</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 48, lineHeight: 1.8 }}>
              Stop paying that tuition in lost deals. Give your team a simulator that hits harder than reality — before they face the real thing.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/deck" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#00c8e0', color: '#000', padding: '18px 48px', fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Start Free Trial — No Card Needed <ChevronRight size={16} />
              </Link>
              <a href="mailto:sales@repready.site" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', padding: '18px 48px', fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Book a Team Demo
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '48px 40px', background: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 24, height: 24, border: '2px solid #00c8e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 12 }}>R</span>
                </div>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>REP<span style={{ color: '#00c8e0' }}>READY</span></span>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.8, maxWidth: 240 }}>AI-powered B2B sales negotiation simulator. Built for reps who refuse to lose deals on preparation they could have done.</p>
            </div>
            {[
              { title: 'Product', links: [{ label: 'Simulator', href: '/deck' }, { label: 'AI Coach', href: '/coach' }, { label: 'Pricing', href: '/pricing' }] },
              { title: 'Company', links: [{ label: 'LinkedIn', href: 'https://linkedin.com' }, { label: 'Contact', href: 'mailto:sales@repready.site' }] },
              { title: 'Legal', links: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map((l, j) => (
                    <a key={j} href={l.href} style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ maxWidth: 1000, margin: '32px auto 0', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em' }}>© 2026 RepReady Systems // Professional Grade // Built in Navi Mumbai, India</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <a href="/privacy" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>Privacy</a>
              <a href="/terms" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>Terms</a>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
