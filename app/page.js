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
    <div className="relative min-h-screen bg-[#0a0d14] selection:bg-cyan-900">
      
      <div className="fixed inset-0 opacity-[0.06] pointer-events-none z-0" 
           style={{ backgroundImage: 'linear-gradient(rgba(0,200,224,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,224,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <section className="relative pt-40 pb-24 flex flex-col items-center text-center px-6 z-10">
        <div className="inline-block mb-10 px-6 py-2 border border-cyan-500/40 bg-cyan-500/5 text-cyan-400 text-[11px] uppercase tracking-[0.4em] font-black">
          B2B Sales Simulation Engine V1.0
        </div>
        
        <h1 className="text-6xl md:text-[90px] font-black text-white tracking-tighter leading-[0.9] mb-10 uppercase italic">
          Stop Practicing On <br/>
          <span className="text-[#e84545]">Real Prospects.</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-16 font-mono leading-relaxed">
          Run live, voice-to-voice negotiations with hostile AI buyers. Get instant telemetry, frame-control analysis, and ruthless feedback from the AI Coach.
        </p>

        <Link href="/deck" className="group bg-cyan-500 text-black px-16 py-5 font-black uppercase text-sm tracking-[0.3em] hover:bg-cyan-400 transition-all flex items-center gap-4">
          Start Free Trial
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </section>

      <section className="py-32 bg-[#0d1117] border-y border-slate-800 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            
            <div className="space-y-4">
              <h2 className="text-cyan-400 text-sm font-black uppercase tracking-[0.5em] mb-12 border-l-4 border-cyan-500 pl-4 italic">
                System Architecture
              </h2>
              
              {WORKFLOW_STEPS.map((step, index) => (
                <div 
                  key={step.id}
                  onClick={() => setActiveStep(index)}
                  className={`p-8 border transition-all duration-500 group cursor-pointer relative overflow-hidden
                    ${activeStep === index ? 'bg-cyan-500/5 border-cyan-500/50 translate-x-2' : 'bg-[#0a0d14] border-slate-800 hover:border-slate-600'}
                  `}
                >
                  <div className="flex gap-8 items-center relative z-10">
                    <div className={`text-5xl font-black italic transition-colors 
                      ${activeStep === index ? 'text-cyan-400' : 'text-slate-700 group-hover:text-slate-500'}
                    `}>
                      {step.id}
                    </div>
                    <div>
                      <h3 className={`text-lg font-black uppercase tracking-widest mb-2 italic transition-colors
                        ${activeStep === index ? 'text-white' : 'text-slate-400'}
                      `}>
                        {step.title}
                      </h3>
                      <p className={`text-sm font-medium leading-relaxed transition-colors
                        ${activeStep === index ? 'text-slate-400' : 'text-slate-600'}
                      `}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:sticky lg:top-40 aspect-square bg-[#0a0d14] border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(rgba(0,200,224,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,224,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeStep}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-10 relative z-10 p-12 text-center w-full"
                >
                  <div className="relative">
                    <div className="w-32 h-32 flex items-center justify-center bg-slate-900 border border-slate-700 rounded-full">
                      {activeStep === 0 && <Fingerprint className="w-16 h-16 text-cyan-400 animate-pulse" />}
                      {activeStep === 1 && <Radio className="w-16 h-16 text-cyan-400 animate-bounce" />}
                      {activeStep === 2 && <Zap className="w-16 h-16 text-[#e84545] animate-pulse" />}
                      {activeStep === 3 && <BarChart3 className="w-16 h-16 text-cyan-400 animate-pulse" />}
                      {activeStep === 4 && <BrainCircuit className="w-16 h-16 text-cyan-400 animate-pulse" />}
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="text-3xl font-black text-white uppercase tracking-[0.2em] italic">
                      {WORKFLOW_STEPS[activeStep].title}
                    </div>
                    <div className="w-full h-px bg-slate-800 overflow-hidden max-w-[200px] mx-auto">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="h-full bg-cyan-500"
                      />
                    </div>
                    <div className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.5em]">
                      Node // Sequence_{activeStep + 1}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#0a0d14] relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 border border-slate-800 hover:border-cyan-500/50 transition-colors group">
              <Radio className="w-8 h-8 text-cyan-500 mb-8 group-hover:animate-pulse" />
              <h3 className="text-xl font-black uppercase tracking-widest mb-4 italic text-white">Hostile Voice AI</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Ultra-low latency voice models trained to throw objections, break your frame, and test your BANT execution in real-time.
              </p>
            </div>
            <div className="p-10 border border-slate-800 hover:border-cyan-500/50 transition-colors group">
              <Activity className="w-8 h-8 text-cyan-500 mb-8 group-hover:animate-pulse" />
              <h3 className="text-xl font-black uppercase tracking-widest mb-4 italic text-white">Instant Telemetry</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                The second you hang up, the system generates a 0-100 aggregate score, isolating your discovery, value articulation, and presence.
              </p>
            </div>
            <div className="p-10 border border-slate-800 hover:border-cyan-500/50 transition-colors group">
              <BrainCircuit className="w-8 h-8 text-cyan-500 mb-8 group-hover:animate-pulse" />
              <h3 className="text-xl font-black uppercase tracking-widest mb-4 italic text-white">Ruthless AI Coach</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Review your raw transcripts side-by-side with an elite AI manager that quotes your exact mistakes and provides tactical fixes.
              </p>
            </div>
          </div>

          <div className="mt-32 pt-20 border-t border-slate-900 text-center">
            <h2 className="text-4xl font-black uppercase italic mb-6 tracking-tight text-white">Need a Custom Deployment?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
              Looking to train an entire revenue team or require custom hostile AI personas? Establish a direct link with our engineering team.
            </p>
            <a href="mailto:sales@repready.site" className="inline-flex items-center gap-4 px-12 py-5 border border-slate-700 font-black uppercase text-xs tracking-[0.3em] hover:border-cyan-500 hover:text-cyan-400 transition-all text-slate-400">
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
      </section>

      <footer className="py-16 text-center text-slate-700 text-[11px] uppercase tracking-[0.6em] font-black bg-[#0a0d14] border-t border-slate-900">
        © 2026 RepReady Systems // Professional Grade
      </footer>
    </div>
  );
}
