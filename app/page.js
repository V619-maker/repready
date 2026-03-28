'use client';

import React, { useState } from 'react';

export default function ScenarioLibrary() {
  const [activeAgent, setActiveAgent] = useState(null);

  // Add your ElevenLabs Agent IDs here
  const RICHARD_ID = "YOUR_RICHARD_ID";
  const SANDRA_ID = "YOUR_SANDRA_ID";

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
            <div className="flex gap-4 mb-6">
              
              {/* Richard's Image */}
              <div className="w-20 h-20 rounded border border-white/10 overflow-hidden relative grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                <img 
  src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&q=80" 
  alt="Richard Vance" 
  className="w-full h-full object-cover"
/>
                <div className="absolute inset-0 border border-transparent group-hover:border-cyan-400/50 transition-all z-10"></div>
              </div>

              <div>
                <h2 className="font-headline text-xl font-bold text-white tracking-wide uppercase">Richard Vance</h2>
                <p className="font-mono text-xs text-zinc-400 mb-3">VP of Procurement // Global Logistics</p>
                <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] font-mono border border-red-500/20 rounded-full">20% DISCOUNT MANDATE</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">Vance is known for aggressive anchoring and "take it or leave it" ultimatums. Success requires maintaining frame control while offering tiered concessions.</p>
            
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
            <div className="flex gap-4 mb-6">
              
              {/* Sandra's Image */}
              <div className="w-20 h-20 rounded border border-white/10 overflow-hidden relative grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
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
                <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-[10px] font-mono border border-cyan-400/20 rounded-full">SECURITY OBSESSED</span>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-8">Chen focuses on implementation risk and security protocols. She will drill into technical debt and service level agreements (SLAs).</p>
            
            <button 
              onClick={() => setActiveAgent(SANDRA_ID)}
              className="w-full py-4 bg-transparent border border-cyan-400 text-cyan-400 font-headline font-bold uppercase tracking-widest text-sm hover:bg-cyan-400/10 transition-all duration-300"
            >
              Initialize Simulation
            </button>
          </div>
        </article>
      </div>

      {/* THE LIVE OVERRIDE MODAL (Only shows when an agent is selected) */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
          <div className="glass-panel w-full max-w-3xl rounded-xl overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.1)] border border-white/20">
            
            {/* Modal Header */}
            <div className="px-8 py-4 border-b border-white/10 flex items-center gap-4 bg-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>
              <h3 className="font-mono text-cyan-400 uppercase tracking-tighter text-sm">Negotiation Protocol Active</h3>
            </div>
            
            <div className="p-8 space-y-8">
              {/* THE NEON AUDIO VISUALIZER */}
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

              {/* ELEVENLABS WIDGET INJECTION */}
              <div className="flex justify-center border border-white/10 rounded-lg p-4 bg-black/40">
                 {/* @ts-ignore */}
                <elevenlabs-convai agent-id={activeAgent}></elevenlabs-convai>
              </div>
            </div>
            
            {/* Modal Footer (Close Button) */}
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
