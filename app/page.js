'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// --- 1. PASTE YOUR AGENT IDs HERE ---
const RICHARD_ID = "<elevenlabs-convai agent-id="agent_8601kmk3maq9f9a9csym74aj7s4e"></elevenlabs-convai><script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>";
const SANDRA_ID = "<elevenlabs-convai agent-id="agent_0301kmsnhr7tf11b62bvd7vsw9qq"></elevenlabs-convai><script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>";

export default function RepReadyHome() {
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [email, setEmail] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // --- 2. LOAD THE ELEVENLABS WIDGET SCRIPT ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "text/javascript";
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleSignup = (e) => {
    e.preventDefault();
    if (email && hasAgreed) setHasSignedUp(true);
  };

  const terminateSession = () => {
    setActiveAgent(null);
    setShowReport(true);
  };

  // --- STATE 1: SIGNUP GATE ---
  if (!hasSignedUp) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-[#111] p-10 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center mb-6">
              <span className="text-white text-3xl font-bold italic">R</span>
            </div>
            <h1 className="text-white text-2xl font-bold uppercase tracking-tighter">Initialize Link</h1>
            <p className="text-zinc-500 text-xs mt-2">Enter credentials to access simulation deck.</p>
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
              <label htmlFor="legal" className="text-[10px] text-zinc-400 uppercase tracking-widest leading-tight">
                I accept the <Link href="/terms" className="text-cyan-400 underline">Neural Protocols</Link> & Data Privacy.
              </label>
            </div>
            <button 
              type="submit" disabled={!hasAgreed}
              className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest text-xs transition-all
                ${hasAgreed ? 'bg-[#DC3545] text-white shadow-lg' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
            >
              Access Simulation →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- STATE 2: DASHBOARD ---
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-12 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-bold text-white uppercase tracking-tighter italic">Scenario Deck</h1>
        <p className="text-zinc-500 font-mono text-xs mt-1">TELEMETRY ACTIVE // SELECT TARGET</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RICHARD CARD */}
        <div className="glass-panel p-8 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all group">
          <div className="flex gap-4 mb-6">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200" className="w-16 h-16 rounded grayscale group-hover:grayscale-0 transition-all" />
            <div>
              <h2 className="text-white font-bold uppercase">Richard Vance</h2>
              <p className="text-[10px] text-zinc-500 uppercase">VP Procurement // Hard-Liner</p>
            </div>
          </div>
          <button onClick={() => setActiveAgent(RICHARD_ID)} className="w-full py-3 border border-cyan-400 text-cyan-400 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400/10">Start Session</button>
        </div>

        {/* SANDRA CARD */}
        <div className="glass-panel p-8 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all group">
          <div className="flex gap-4 mb-6">
            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200" className="w-16 h-16 rounded grayscale group-hover:grayscale-0 transition-all" />
            <div>
              <h2 className="text-white font-bold uppercase">Sandra Chen</h2>
              <p className="text-[10px] text-zinc-500 uppercase">Head of IT // Analytical</p>
            </div>
          </div>
          <button onClick={() => setActiveAgent(SANDRA_ID)} className="w-full py-3 border border-cyan-400 text-cyan-400 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-400/10">Start Session</button>
        </div>
      </div>

      {/* --- LIVE SIMULATION MODAL --- */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
          <div className="glass-panel w-full max-w-xl rounded-xl border border-white/20 p-12 flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping mb-4"></div>
            <h3 className="text-cyan-400 font-mono text-xs uppercase mb-12">Neural Link Established</h3>
            
            <div className="mb-12">
              <elevenlabs-convai agent-id={activeAgent}></elevenlabs-convai>
            </div>

            <button onClick={terminateSession} className="px-8 py-3 border border-red-500 text-red-500 font-bold uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">End Simulation</button>
          </div>
        </div>
      )}

      {/* --- SUCCESS REPORT --- */}
      {showReport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/90 font-mono">
          <div className="glass-panel w-full max-w-md rounded-xl border border-cyan-500/30 p-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-2 uppercase italic">Audit Complete</h2>
            <p className="text-4xl font-bold text-cyan-400 my-8 italic">74<span className="text-sm text-zinc-600">/100</span></p>
            <div className="flex gap-4">
              <Link href="/coach" className="flex-1 px-4 py-3 bg-cyan-600 text-white font-bold uppercase text-[10px]">Review Feedback</Link>
              <button onClick={() => setShowReport(false)} className="flex-1 px-4 py-3 border border-white/10 text-white font-bold uppercase text-[10px]">Retry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
