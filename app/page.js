'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Use your actual IDs
const RICHARD_ID = "agent_8601kmk3maq9f9a9csym74aj7s4e";
const SANDRA_ID = "agent_0301kmsnhr7tf11b62bvd7vsw9qq";

export default function RepReadyHome() {
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [email, setEmail] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://elevenlabs.io/convai-widget/index.js";
    script.async = true;
    script.type = "text/javascript";
    document.head.appendChild(script);
  }, []);

  const handleSignup = (e) => {
    e.preventDefault();
    if (email && hasAgreed) setHasSignedUp(true);
  };

  // --- 1. THE SIGNUP GATE (Restored to match your original sleek theme) ---
  if (!hasSignedUp) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] p-6 font-mono">
        <div className="glass-panel p-10 border border-white/10 rounded-2xl max-w-md w-full shadow-2xl">
          <h1 className="text-white text-4xl font-bold mb-2 uppercase italic tracking-tighter text-center">RepReady</h1>
          <p className="text-zinc-500 text-center text-[9px] mb-10 uppercase tracking-[0.4em]">Initialize Connection</p>
          
          <form onSubmit={handleSignup} className="space-y-6">
            <input 
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ENTER EMAIL" 
              className="w-full bg-zinc-900 border border-white/10 text-white rounded py-4 px-4 focus:outline-none focus:border-cyan-400 text-xs"
            />
            <div className="flex items-start gap-3">
              <input type="checkbox" required checked={hasAgreed} onChange={(e) => setHasAgreed(e.target.checked)} className="mt-1 accent-cyan-500" />
              <p className="text-[9px] text-zinc-500 uppercase leading-relaxed">I accept the <Link href="/terms" className="text-cyan-400 underline">Legal Protocols</Link></p>
            </div>
            <button type="submit" disabled={!hasAgreed} className={`w-full py-4 font-bold uppercase tracking-widest text-xs transition-all ${hasAgreed ? 'bg-cyan-600 text-white' : 'bg-zinc-800 text-zinc-600'}`}>
              Access Deck →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- 2. THE SCENARIO LIBRARY (How it was before) ---
  return (
    <div className="max-w-6xl mx-auto p-12 font-mono">
      <div className="mb-16">
        <h1 className="text-5xl font-bold text-white uppercase italic tracking-tighter">Scenario Deck</h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mt-2">Telemetry Active // Select Target</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Richard Vance */}
        <div className="border border-white/10 p-10 bg-[#0a0a0a] hover:border-cyan-500 transition-all group">
          <div className="flex gap-6 mb-8">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300" className="w-20 h-20 grayscale border border-white/10" />
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Richard Vance</h2>
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest">VP Procurement</p>
            </div>
          </div>
          <button onClick={() => setActiveAgent(RICHARD_ID)} className="w-full py-4 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Start Simulation</button>
        </div>

        {/* Sandra Chen */}
        <div className="border border-white/10 p-10 bg-[#0a0a0a] hover:border-cyan-500 transition-all group">
          <div className="flex gap-6 mb-8">
            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300" className="w-20 h-20 grayscale border border-white/10" />
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Sandra Chen</h2>
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest">Head of IT</p>
            </div>
          </div>
          <button onClick={() => setActiveAgent(SANDRA_ID)} className="w-full py-4 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Start Simulation</button>
        </div>
      </div>

      {/* --- 3. THE INTEGRATED MODAL (No double buttons) --- */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/95">
          <div className="w-full max-w-2xl bg-black border border-white/20 rounded-xl overflow-hidden flex flex-col items-center p-16 shadow-[0_0_100px_rgba(6,182,212,0.1)]">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mb-8"></div>
            
            <div className="mb-12">
               {/* This tag will now show the FULL widget inside our box */}
               <elevenlabs-convai agent-id={activeAgent}></elevenlabs-convai>
            </div>

            <button 
              onClick={() => setActiveAgent(null)} 
              className="px-12 py-3 border border-red-500 text-red-500 text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all font-bold"
            >
              Terminate Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
