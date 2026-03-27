'use client';

import React from 'react';

export default function RepReadyCommandCenter() {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-cyan-400/30 selection:text-cyan-400 relative overflow-hidden pb-20">
      
      {/* Safe Font & CSS Injection for React */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=JetBrains+Mono:wght@400&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .font-headline { font-family: 'Space Grotesk', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .glass-panel { background: rgba(14, 14, 14, 0.6); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.05); }
        
        @keyframes cyber-pulse { 0%, 100% { height: 20%; } 50% { height: 100%; } }
        .cyber-bar-1 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0s; }
        .cyber-bar-2 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.15s; }
        .cyber-bar-3 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.3s; }
        .cyber-bar-4 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.45s; }
        .cyber-bar-5 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.6s; }
      `}} />

      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-cyan-400/10 rounded-lg border border-cyan-400/30">
            <span className="material-symbols-outlined text-cyan-400 text-xl" style={{fontVariationSettings: "'FILL' 1"}}>deployed_code</span>
          </div>
          <span className="font-headline font-bold text-cyan-400 tracking-tighter text-xl uppercase">Sovereign Protocol</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-headline tracking-widest uppercase text-xs">
          <a className="text-cyan-400 font-bold" href="#">Dashboard</a>
          <a className="text-zinc-400 hover:text-cyan-400 hover:bg-white/5 transition-all px-2 py-1 rounded" href="#">Simulator</a>
        </nav>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border border-cyan-400/50 p-0.5 overflow-hidden bg-zinc-800"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-6 lg:px-32 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-white mb-2 uppercase">Scenario Library</h1>
          <p className="text-zinc-400 font-mono text-sm max-w-xl">SELECT A TARGET PERSONA TO INITIALIZE THE NEGOTIATION SIMULATION ENGINE.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Richard Card */}
          <article className="glass-panel rounded-xl overflow-hidden group hover:border-cyan-400/40 transition-all duration-500">
            <div className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 bg-zinc-800 rounded border border-white/10 relative">
                  <div className="absolute inset-0 border border-transparent group-hover:border-cyan-400/50 transition-all"></div>
                </div>
                <div>
                  <h2 className="font-headline text-xl font-bold text-white tracking-wide uppercase">Richard Vance</h2>
                  <p className="font-mono text-xs text-zinc-400 mb-3">VP of Procurement // Global Logistics</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] font-mono border border-red-500/20 rounded-full">20% DISCOUNT MANDATE</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-8">Vance is known for aggressive anchoring and "take it or leave it" ultimatums. Success requires maintaining frame control while offering tiered concessions.</p>
              
              <button className="w-full py-4 bg-transparent border border-cyan-400 text-cyan-400 font-headline font-bold uppercase tracking-widest text-sm hover:bg-cyan-400/10 transition-all duration-300">
                Initialize Simulation
              </button>
            </div>
          </article>

          {/* Sandra Card */}
          <article className="glass-panel rounded-xl overflow-hidden group hover:border-cyan-400/40 transition-all duration-500">
            <div className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 bg-zinc-800 rounded border border-white/10 relative">
                  <div className="absolute inset-0 border border-transparent group-hover:border-cyan-400/50 transition-all"></div>
                </div>
                <div>
                  <h2 className="font-headline text-xl font-bold text-white tracking-wide uppercase">Sandra Chen</h2>
                  <p className="font-mono text-xs text-zinc-400 mb-3">Head of IT Operations // Fintech</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-[10px] font-mono border border-cyan-400/20 rounded-full">SECURITY OBSESSED</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-8">Chen focuses on implementation risk and security protocols. She will drill into technical debt and service level agreements (SLAs).</p>
              
              <button className="w-full py-4 bg-transparent border border-cyan-400 text-cyan-400 font-headline font-bold uppercase tracking-widest text-sm hover:bg-cyan-400/10 transition-all duration-300">
                Initialize Simulation
              </button>
            </div>
          </article>
        </div>
      </main>

      {/* ACTIVE CALL MODAL (Currently visible for testing!) */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
        <div className="glass-panel w-full max-w-3xl rounded-xl overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.1)] border-white/20">
          
          <div className="px-8 py-4 border-b border-white/10 flex items-center gap-4 bg-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <h3 className="font-mono text-cyan-400 uppercase tracking-tighter text-sm">Richard Vance // Negotiation Protocol Active</h3>
          </div>
          
          <div className="p-8 space-y-8">
            {/* INJECTED ANIMATED AUDIO VISUALIZER */}
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

            {/* User Input placeholder */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400">
                <span className="material-symbols-outlined">mic</span>
              </div>
              <input className="w-full bg-black/40 border border-white/10 focus:outline-none focus:border-cyan-400 rounded py-4 pl-12 pr-4 font-mono text-sm text-white" placeholder="Respond with Voice or Text..." type="text" />
            </div>
          </div>
          
          <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-center">
            <button className="px-8 py-3 border border-red-500 text-red-500 text-xs font-headline font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all">
              END SIMULATION
            </button>
          </div>
        </div>
      </div>

      {/* Background Dots */}
      <div className="fixed inset-0 opacity-[0.05] pointer-events-none z-[-1]" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
    </div>
  );
}
