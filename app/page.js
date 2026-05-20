'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Target, Zap, Activity, Radio, BarChart3, BotMessageSquare, BrainCircuit, Fingerprint, Mail } from 'lucide-react';

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
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0a0d14]" style={{ fontFamily: 'monospace' }}>

      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.06] pointer-events-none z-0"
        style={{ backgroundImage: 'linear-gradient(rgba(0,200,224,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,224,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Top nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 64,
        background: 'rgba(10,13,20,0.95)', borderBottom: '1px solid rgba(0,200,224,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px 0 130px', zIndex: 200, backdropFilter: 'blur(12px)'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, border: '2px solid #00c8e0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>R</span>
            <div style={{ position: 'absolute', top: 2, right: 2, width: 5, height: 5, background: '#e84545', borderRadius: '50%' }} />
          </div>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: '0.05em' }}>
            REP<span style={{ color: '#00c8e0' }}>READY</span>
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/pricing" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
            Pricing
          </Link>
          <Link href="/sign-in" style={{ background: '#fff', color: '#000', padding: '8px 20px', fontSize: 11, fontWeight: 900, textDecoration: 'none', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Left sidebar */}
      <div style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 100,
        background: '#050505', borderRight: '1px solid rgba(0,200,224,0.1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 80, zIndex: 100, gap: 8
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 0', width: '100%' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c8e0', boxShadow: '0 0 8px #00c8e0' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Active</span>
        </div>

        <Link href="/deck" style={{ textDecoration: 'none', width: '100%' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '16px 0', width: '100%', borderLeft: '3px solid #00c8e0',
            background: 'rgba(0,200,224,0.05)', cursor: 'pointer'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c8e0" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            <span style={{ color: '#00c8e0', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>Dash</span>
          </div>
        </Link>

        <Link href="/coach" style={{ textDecoration: 'none', width: '100%' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '16px 0', width: '100%', cursor: 'pointer'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Coach</span>
          </div>
        </Link>
      </div>

      {/* Main content */}
      <div style={{ paddingLeft: 100, paddingTop: 64 }}>

        {/* Hero */}
        <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 40px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', marginBottom: 32, padding: '8px 24px', border: '1px solid rgba(0,200,224,0.4)', background: 'rgba(0,200,224,0.05)', color: '#00c8e0', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', fontWeight: 900 }}>
            B2B Sales Simulation Engine V1.0
          </div>

          <h1 style={{ fontSize: 'clamp(48px, 8vw, 90px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 0.9, marginBottom: 32, textTransform: 'uppercase', fontStyle: 'italic' }}>
            Stop Practicing On<br />
            <span style={{ color: '#e84545' }}>Real Prospects.</span>
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.8 }}>
            Run live, voice-to-voice negotiations with hostile AI buyers. Get instant telemetry, frame-control analysis, and ruthless feedback from the AI Coach.
          </p>

          <Link href="/deck" style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            background: '#00c8e0', color: '#000', padding: '18px 48px',
            fontWeight: 900, fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase',
            textDecoration: 'none'
          }}>
            Start Free Trial
            <ChevronRight size={16} />
          </Link>
        </section>

        {/* System Architecture */}
        <section style={{ padding: '80px 40px', background: '#0d1117', borderTop: '1px solid rgba(0,200,224,0.1)', borderBottom: '1px solid rgba(0,200,224,0.1)', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
              <div>
                <h2 style={{ color: '#00c8e0', fontSize: 11, fontWeight: 900, letterSpacing: '0.5em', textTransform: 'uppercase', marginBottom: 40, borderLeft: '4px solid #00c8e0', paddingLeft: 16, fontStyle: 'italic' }}>
                  System Architecture
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {WORKFLOW_STEPS.map((step, index) => (
                    <div key={step.id} onClick={() => setActiveStep(index)}
                      style={{
                        padding: '24px', border: `1px solid ${activeStep === index ? 'rgba(0,200,224,0.5)' : 'rgba(255,255,255,0.05)'}`,
                        background: activeStep === index ? 'rgba(0,200,224,0.05)' : '#0a0d14',
                        cursor: 'pointer', transition: 'all 0.3s',
                        transform: activeStep === index ? 'translateX(8px)' : 'none'
                      }}>
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
              </div>

              <div style={{ position: 'sticky', top: 100, aspectRatio: '1', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(0,200,224,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,224,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <AnimatePresence mode="wait">
                  <motion.div key={activeStep}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: 40, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {activeStep === 0 && <Fingerprint size={48} color="#00c8e0" />}
                      {activeStep === 1 && <Radio size={48} color="#00c8e0" />}
                      {activeStep === 2 && <Zap size={48} color="#e84545" />}
                      {activeStep === 3 && <BarChart3 size={48} color="#00c8e0" />}
                      {activeStep === 4 && <BrainCircuit size={48} color="#00c8e0" />}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.2em', fontStyle: 'italic' }}>
                      {WORKFLOW_STEPS[activeStep].title}
                    </div>
                    <div style={{ width: 120, height: 1, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5, ease: 'linear' }} style={{ height: '100%', background: '#00c8e0' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.4em', textTransform: 'uppercase' }}>
                      Node // Sequence_{activeStep + 1}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: '80px 40px', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { icon: <Radio size={28} color="#00c8e0" />, title: 'Hostile Voice AI', desc: 'Ultra-low latency voice models trained to throw objections, break your frame, and test your BANT execution in real-time.' },
                { icon: <Activity size={28} color="#00c8e0" />, title: 'Instant Telemetry', desc: 'The second you hang up, the system generates a 0-100 aggregate score, isolating your discovery, value articulation, and presence.' },
                { icon: <BrainCircuit size={28} color="#00c8e0" />, title: 'Ruthless AI Coach', desc: 'Review your raw transcripts with an elite AI manager that quotes your exact mistakes and provides tactical fixes.' },
              ].map((f, i) => (
                <div key={i} style={{ padding: 32, border: '1px solid rgba(255,255,255,0.05)', background: '#0a0d14' }}>
                  <div style={{ marginBottom: 20 }}>{f.icon}</div>
                  <h3 style={{ color: '#fff', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontStyle: 'italic' }}>{f.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.8 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 80, paddingTop: 60, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <h2 style={{ color: '#fff', fontSize: 32, fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 16 }}>Need a Custom Deployment?</h2>
              <p style={{ color: 'rgba(255,255,255,0.3)', maxWidth: 480, margin: '0 auto 40px', fontSize: 13, lineHeight: 1.8 }}>
                Looking to train an entire revenue team or require custom hostile AI personas? Establish a direct link with our engineering team.
              </p>
              <a href="mailto:sales@repready.site" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 40px', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', textDecoration: 'none' }}>
                <Mail size={14} />
                Contact Support
              </a>
            </div>
          </div>
        </section>

        <footer style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
          © 2026 RepReady Systems // Professional Grade
        </footer>
      </div>
    </div>
  );
}
