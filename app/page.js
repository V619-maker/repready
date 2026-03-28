'use client';

import React, { useState } from 'react';

export default function RepReadyHome() {
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [email, setEmail] = useState('');
  const [activeAgent, setActiveAgent] = useState(null);

  // Add your ElevenLabs Agent IDs here
  const RICHARD_ID = "YOUR_RICHARD_ID";
  const SANDRA_ID = "YOUR_SANDRA_ID";

  const handleSignup = (e) => {
    e.preventDefault();
    if (email) {
      // Here you would normally send the email to your database
      setHasSignedUp(true);
    }
  };

  // --- STATE 1: THE SIGNUP GATE (From your screenshot) ---
  if (!hasSignedUp) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-[#111] p-10 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-[#F97316] rounded-full flex items-center justify-center mb-6">
              <span className="text-white text-3xl font-bold font-headline">R</span>
            </div>
            <h1 className="text-white text-3xl font-bold font-headline mb-2">Battle-test your skills</h1>
            <p className="text-zinc-400">against Richard. Enter your email to begin.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com" 
                className="w-full bg-[#EBF1FA] text-black rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" required className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-[#E13B45] focus:ring-[#E13B45]" />
              <p className="text-sm text-zinc-400 leading-tight">
                I agree to processing of my data per the <span className="text-yellow-500">Privacy Policy</span> and that sessions are not used to train AI models.
              </p>
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#DC3545] hover:bg-[#C82333] text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Challenge Richard Free &rarr;
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>3 free sessions included. No credit card required.</span>
          </div>
        </div>
      </div>
    );
  }

  // --- STATE 2: THE SCENARIO LIBRARY (Unlocked) ---
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-white mb-2 uppercase">Scenario Library</h1>
        <p className="text-zinc-400 font-mono text-sm max-w-xl">SELECT A TARGET PERSONA TO INITIALIZE THE NEGOTIATION SIMULATION ENGINE.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Richard Dossier Card */}
        <article className="glass-panel rounded-xl overflow-hidden group hover:border-cyan-400/40 transition-all duration-500">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded border border-white/10 overflow-hidden relative grayscale contrast-125 brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500">
                  <img 
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&q=80" 
                    alt="Richard Vance" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border border-transparent group-hover:border-cyan-400/50 transition-all z-10"></div>
                </div>

                <div>
                  <h2 className="font-headline text-xl font-bold text-white tracking-wide uppercase">Richard Vance</h2>
                  <p className="font-mono text-xs text-zinc-400 mb-3">VP of Procurement // Global Logistics</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] font-mono border border-red-500/20 rounded-full">20% DISCOUNT MANDATE</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-mono border border-white/5 rounded-full">HARD-LINER</span>
                  </div>
                </div>
              </div>
              <div className="text-cyan-400/20 group-hover:text-cyan-400/60 transition-colors">
                <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
              </div>
            </div>
            
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">Vance is known for aggressive anchoring and "take it or leave it" ultimatums. Success requires maintaining frame control while offering tiered concessions.</p>
            
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5 mb-6">
              <div className="text-center">
                <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Difficulty</p>
                <p className="text-cyan-400 font-mono text-sm">LVL 08</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Success Rate</p>
                <p className="text-white font-mono text-sm">14.2%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Avg. Duration</p>
                <p className="text-white font-mono text-sm">12:45</p>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveAgent(RICHARD_ID)}
              className="w-full py-4 bg-transparent border border-cyan-400 text-cyan-400 font-headline font-bold uppercase tracking-widest text-sm hover:bg-cyan-400/10 transition-all duration-300"
            >
              Initialize Simulation
            </button>
          </div>
        </article>

        {/* Sandra Dossier Card */}
        <article className="glass-panel rounded-xl overflow-hidden group hover:border-cyan-400/40 transition-all duration-500">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded border border-white/10 overflow-hidden relative grayscale contrast-125 brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500">
                  <img 
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&q=80" 
                    alt="Sandra Chen" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 border border-transparent group-hover:border-cyan-400/50 transition-all z-10"></div>
                </div>

                <div>
                  <h2 className="font-headline text-xl font-bold text-white tracking-wide uppercase">Sandra Chen</h2>
                  <p className="font-mono text-xs text-zinc-400 mb-3">Head of IT Operations // Fintech</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-[10px] font-mono border border-cyan-400/20 rounded-full">SECURITY OBSESSED</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-mono border border-white/5 rounded-full">ANALYTICAL</span>
                  </div>
                </div>
              </div>
              <div className="text-cyan-400/20 group-hover:text-cyan-400/60 transition-colors">
                <span className="material-symbols-outlined text-3xl">terminal</span>
              </div>
            </div>
            
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">Chen focuses on implementation risk and security protocols. She will drill into technical debt and service level agreements (SLAs).</p>
            
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-white/5 mb-6">
              <div className="text-center">
                <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Difficulty</p>
                <p className="text-cyan-400 font-mono text-sm">LVL 06</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Success Rate</p>
                <p className="text-white font-mono text-sm">31.8%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-zinc-500 mb-1 uppercase">Avg. Duration</p>
                <p className="text-white font-mono text-sm">18:10</p>
              </div>
            </div>
            
            <button 
              onClick={() => setActiveAgent(SANDRA_ID)}
              className="w-full py-4 bg-transparent border border-cyan-400 text-cyan-400 font-headline font-bold uppercase tracking-widest text-sm hover:bg-cyan-400/10 transition-all duration-300"
            >
              Initialize Simulation
            </button>
          </div>
        </article>
      </div>

      {/* THE LIVE OVERRIDE MODAL */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
          <div className="glass-panel w-full max-w-3xl rounded-xl overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.1)] border border-white/20">
            
            <div className="px-8 py-4 border-b border-white/10 flex items-center gap-4 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>
              <h3 className="font-mono text-cyan-400 uppercase tracking-tighter text-sm">Negotiation Protocol Active</h3>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="relative h-24 flex items-center justify-center bg-[#111] rounded border border-white/5">
                <div className="flex items-center justify-center gap-1.5 h-16">
                  <div className="w-1.5 bg-cyan-400 cyber-bar-1 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                  <div className="w-1.5 bg-cyan-400 cyber-bar-2 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                  <div className="w-1.5 bg-cyan-400 cyber-bar-3 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                  <div className="w-1.5 bg-cyan-400 cyber-bar-4 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                  <div className="w-1.5 bg-cyan-400 cyber-bar-5 shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                </div>
                <div className="absolute top-2 right-4 font-mono text-[10px] text-cyan-400/40">VOICE_RECOGNITION_ON</div>
              </div>

              <div className="flex justify-center border border-white/10 rounded-lg p-4 bg-black/40">
                 {/* @ts-ignore */}
                <elevenlabs-convai agent-id={activeAgent}></elevenlabs-convai>
              </div>
            </div>
            
            <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-center">
              <button 
                onClick={() => setActiveAgent(null)}
                className="px-8 py-3 border border-red-500 text-red-500 text-xs font-headline font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all"
              >
                END SIMULATION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
