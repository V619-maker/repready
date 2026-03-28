'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RepReadyHome() {
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [email, setEmail] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [showReport, setShowReport] = useState(false); // NEW: Report State

  // Add your ElevenLabs Agent IDs here
  const RICHARD_ID = "YOUR_RICHARD_ID";
  const SANDRA_ID = "YOUR_SANDRA_ID";

  const handleSignup = (e) => {
    e.preventDefault();
    if (email && hasAgreed) {
      setHasSignedUp(true);
    }
  };

  const terminateSession = () => {
    setActiveAgent(null);
    setShowReport(true); // Trigger the audit report
  };

  // --- STATE 1: THE SIGNUP GATE ---
  if (!hasSignedUp) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-[#111] p-10 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center mb-6">
              <span className="text-white text-3xl font-bold font-headline">R</span>
            </div>
            <h1 className="text-white text-3xl font-bold font-headline mb-2 uppercase tracking-tighter">Battle-test your skills</h1>
            <p className="text-zinc-400 text-sm">Against the industry's toughest personas.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <span className="material-symbols-outlined text-sm">mail</span>
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email" 
                className="w-full bg-[#EBF1FA] text-black rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-mono text-sm"
              />
            </div>

            <div className="flex items-start gap-3 bg-white/5 p-3 rounded border border-white/5">
              <input 
                type="checkbox" 
                id="legal-checkbox"
                required 
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500 cursor-pointer" 
              />
              <label htmlFor="legal-checkbox" className="text-[10px] text-zinc-400 leading-tight uppercase tracking-wide cursor-pointer select-none">
                I agree to the processing of my voice data per the <Link href="/terms" className="text-cyan-400 hover:underline">Privacy Protocols</Link> and acknowledge sessions are not used for AI training.
              </label>
            </div>

            <button 
              type="submit" 
              disabled={!hasAgreed}
              className={`w-full font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs
                ${hasAgreed 
                  ? 'bg-[#DC3545] hover:bg-[#C82333] text-white shadow-[0_0_20px_rgba(220,53,69,0.3)]' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed grayscale'
                }`}
            >
              {hasAgreed ? "Challenge Richard Free →" : "Accept Terms to Access"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN UI ---
  return (
    <div className="max-w-6xl mx-auto p-8 relative">
      <div className="mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-white mb-2 uppercase">Scenario Library</h1>
        <p className="text-zinc-400 font-mono text-sm max-w-xl">SELECT A TARGET PERSONA TO INITIALIZE THE NEGOTIATION SIMULATION ENGINE.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Richard Card */}
        <article className="glass-panel rounded-xl overflow-hidden group hover:border-cyan-400/40 transition-all duration-500 border border-white/10 p-8">
            <div className="flex gap-4 mb-6">
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&q=80" className="w-20 h-20 rounded grayscale group-hover:grayscale-0 transition-all border border-white/10" />
                <div>
                    <h2 className="text-xl font-bold text-white uppercase">Richard Vance</h2>
                    <p className="text-xs text-zinc-500 font-mono mb-2">VP of Procurement</p>
                    <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] border border-red-500/20 rounded-full">HARD-LINER</span>
                </div>
            </div>
            <button onClick={() => setActiveAgent(RICHARD_ID)} className="w-full py-4 border border-cyan-400 text-cyan-400 font-bold uppercase text-xs hover:bg-cyan-400/10 transition-all tracking-widest">Initialize Simulation</button>
        </article>

        {/* Sandra Card */}
        <article className="glass-panel rounded-xl overflow-hidden group hover:border-cyan-400/40 transition-all duration-500 border border-white/10 p-8">
            <div className="flex gap-4 mb-6">
                <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&q=80" className="w-20 h-20 rounded grayscale group-hover:grayscale-0 transition-all border border-white/10" />
                <div>
                    <h2 className="text-xl font-bold text-white uppercase">Sandra Chen</h2>
                    <p className="text-xs text-zinc-500 font-mono mb-2">Head of IT Ops</p>
                    <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-[10px] border border-cyan-400/20 rounded-full">ANALYTICAL</span>
                </div>
            </div>
            <button onClick={() => setActiveAgent(SANDRA_ID)} className="w-full py-4 border border-cyan-400 text-cyan-400 font-bold uppercase text-xs hover:bg-cyan-400/10 transition-all tracking-widest">Initialize Simulation</button>
        </article>
      </div>

      {/* --- LIVE SIMULATION MODAL --- */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
          <div className="glass-panel w-full max-w-5xl rounded-xl border border-white/20 overflow-hidden flex flex-col shadow-2xl">
            <div className="px-8 py-4 border-b border-white/10 bg-white/5 flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <h3 className="font-mono text-cyan-400 uppercase text-xs tracking-tighter">Protocol Active</h3>
            </div>
            <div className="p-12 flex flex-col items-center">
                <div className="flex gap-1 mb-12 h-20 items-center">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-2 bg-cyan-500/30 rounded-full animate-pulse" style={{height: `${Math.random()*100}%`}}></div>
                    ))}
                </div>
                <button onClick={terminateSession} className="px-12 py-4 border border-red-500 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all">End Simulation</button>
            </div>
          </div>
        </div>
      )}

      {/* --- POST-SIMULATION AUDIT REPORT (THE NEW SUCCESS MODAL) --- */}
      {showReport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/90 font-mono">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-cyan-500/30 p-10 shadow-[0_0_100px_rgba(6,182,212,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-[60px] font-bold">AUDIT</div>
            
            <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tighter italic">Simulation Complete</h2>
            <p className="text-zinc-500 text-xs mb-8 border-b border-white/5 pb-4 uppercase">Neural Analysis // Performance Review</p>
            
            <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Negotiation Score</p>
                    <p className="text-4xl font-bold text-cyan-400 italic">68<span className="text-sm text-zinc-600">/100</span></p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1">Frame Control</p>
                    <p className="text-4xl font-bold text-white italic">PRO</p>
                </div>
            </div>

            <div className="space-y-4 mb-10">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">ANCHORING STRENGTH</span>
                    <span className="text-green-400">OPTIMAL</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">EMOTIONAL REGULATION</span>
                    <span className="text-yellow-400">STABLE</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">CONCESSION STRATEGY</span>
                    <span className="text-red-400">WEAK</span>
                </div>
            </div>

            <div className="flex gap-4">
                <Link href="/coach" className="flex-1">
                    <button className="w-full py-4 bg-cyan-600 text-white font-bold uppercase text-xs tracking-widest hover:bg-cyan-500 transition-all">Review with AI Coach</button>
                </Link>
                <button onClick={() => setShowReport(false)} className="flex-1 py-4 border border-white/10 text-white font-bold uppercase text-xs tracking-widest hover:bg-white/5 transition-all">Try Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
