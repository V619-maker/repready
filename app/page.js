'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// --- 1. CLEAN AGENT IDs (NO HTML TAGS HERE) ---
const RICHARD_ID = "agent_8601kmk3maq9f9a9csym74aj7s4e";
const SANDRA_ID = "agent_0301kmsnhr7tf11b62bvd7vsw9qq";

export default function RepReadyHome() {
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [email, setEmail] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // --- 2. MULTI-LAYER SCRIPT LOADER (For Vercel Stability) ---
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('elevenlabs-convai-script')) {
      const script = document.createElement('script');
      script.id = 'elevenlabs-convai-script';
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.head.appendChild(script);
    }
  }, []);

  const handleSignup = (e) => {
    e.preventDefault();
    if (email && hasAgreed) setHasSignedUp(true);
  };

  const terminateSession = () => {
    setActiveAgent(null);
    setShowReport(true);
  };

  // --- STATE 1: SIGNUP & LEGAL GATE ---
  if (!hasSignedUp) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-[#111] p-10 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center mb-6">
              <span className="text-white text-3xl font-bold italic font-headline">R</span>
            </div>
            <h1 className="text-white text-3xl font-bold font-headline mb-2 uppercase italic tracking-tighter">Initialize Link</h1>
            <p className="text-zinc-500 text-xs">Authorize credentials to access the simulation deck.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <input 
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@email.com" 
              className="w-full bg-[#EBF1FA] text-black rounded-lg py-3 px-4 focus:outline-none font-mono text-sm"
            />
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded border border-white/5">
              <input 
                type="checkbox" id="legal" required checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 accent-cyan-500 cursor-pointer" 
              />
              <label htmlFor="legal" className="text-[10px] text-zinc-400 uppercase tracking-widest leading-tight cursor-pointer">
                I accept the <Link href="/terms" className="text-cyan-400 underline">Neural Protocols</Link> & Data Privacy.
              </label>
            </div>
            <button 
              type="submit" disabled={!hasAgreed}
              className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest text-xs transition-all shadow-lg
                ${hasAgreed ? 'bg-[#DC3545] text-white' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
            >
              {hasAgreed ? "Challenge Richard Free →" : "Accept Terms to Access"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- STATE 2: THE SCENARIO LIBRARY ---
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-12 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-bold text-white uppercase tracking-tighter italic font-headline">Scenario Deck</h1>
        <p className="text-zinc-500 font-mono text-xs mt-1">TELEMETRY ACTIVE // SELECT TARGET PERSONA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Richard Card */}
        <div className="glass-panel p-8 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all group">
          <div className="flex gap-4 mb-6">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200" className="w-16 h-16 rounded grayscale group-hover:grayscale-0 transition-all border border-white/10" />
            <div>
              <h2 className="text-white font-bold uppercase font-headline">Richard Vance</h2>
              <p className="text-[10px] text-zinc-500 font-mono uppercase">VP Procurement // Hard-Liner</p>
            </div>
          </div>
          <button onClick={() => setActiveAgent(RICHARD_ID)} className="w-full py-3 border border-cyan-400 text-cyan-400 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400/10 transition-all">Start Simulation</button>
        </div>

        {/* Sandra Card */}
        <div className="glass-panel p-8 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all group">
          <div className="flex gap-4 mb-6">
            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200" className="w-16 h-16 rounded grayscale group-hover:grayscale-0 transition-all border border-white/10" />
            <div>
              <h2 className="text-white font-bold uppercase font-headline">Sandra Chen</h2>
              <p className="text-[10px] text-zinc-500 font-mono uppercase">Head of IT // Analytical Blocker</p>
            </div>
          </div>
          <button onClick={() => setActiveAgent(SANDRA_ID)} className="w-full py-3 border border-cyan-400 text-cyan-400 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400/10 transition-all">Start Simulation</button>
        </div>
      </div>

      {/* --- STATE 3: LIVE SIMULATION MODAL (WITH TELEMETRY) --- */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
          <div className="glass-panel w-full max-w-5xl rounded-xl border border-white/20 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-8 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>
                <h3 className="font-mono text-cyan-400 uppercase text-xs">Negotiation Protocol Active</h3>
              </div>
            </div>
            
            <div className="p-10 grid grid-cols-1 md:grid-cols-5 gap-8 overflow-y-auto bg-black/40">
              <div className="md:col-span-3 flex flex-col gap-6">
                <div className="h-48 flex flex-col items-center justify-center border border-white/10 rounded bg-[#0a0a0a] p-6 relative">
                  <elevenlabs-convai agent-id={activeAgent}></elevenlabs-convai>
                  <p className="absolute bottom-4 text-[8px] text-zinc-600 tracking-[0.3em] uppercase">Encrypted_Voice_Auth</p>
                </div>
              </div>

              <div className="md:col-span-2 bg-black/60 border border-white/5 rounded-lg p-6">
                <h4 className="font-mono text-cyan-400 text-[10px] uppercase mb-6 tracking-widest">Live Telemetry</h4>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-2 text-zinc-500"><span>FRAME CONTROL</span><span>74%</span></div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 w-[74%]"></div></div>
                  </div>
                  <div className="bg-[#0a0a0a] p-4 rounded font-mono text-[9px] text-zinc-500 space-y-2">
                    <p className="text-cyan-400">&gt; Target is skeptical of your timeline.</p>
                    <p className="text-red-400 animate-pulse">&gt; WARNING: Concession imminent.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 border-t border-white/10 bg-white/5 text-center">
              <button onClick={terminateSession} className="px-12 py-3 border border-red-500 text-red-500 font-bold uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">End Simulation</button>
            </div>
          </div>
        </div>
      )}

      {/* --- POST-SIMULATION AUDIT --- */}
      {showReport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/90 font-mono">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-cyan-500/30 p-12 text-center shadow-2xl">
            <h2 className="text-3xl font-headline font-bold text-white uppercase italic mb-2 tracking-tighter">Audit Complete</h2>
            <div className="my-10">
                <p className="text-zinc-600 text-[10px] uppercase mb-1 tracking-widest">Performance Score</p>
                <p className="text-6xl font-bold text-cyan-400 italic font-headline tracking-tighter">72<span className="text-lg text-zinc-700">/100</span></p>
            </div>
            <div className="flex gap-4">
              <Link href="/coach" className="flex-1 bg-cyan-600 text-white py-4 font-bold uppercase text-[10px] tracking-widest hover:bg-cyan-500 transition-all">Review Feedback</Link>
              <button onClick={() => setShowReport(false)} className="flex-1 border border-white/10 text-white py-4 font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all">Try Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
