'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const RICHARD_ID = "agent_8601kmk3maq9f9a9csym74aj7s4e";
const SANDRA_ID = "agent_0301kmsnhr7tf11b62bvd7vsw9qq";

export default function RepReadyHome() {
  const [activeAgent, setActiveAgent] = useState(null);
  const [showAudit, setShowAudit] = useState(false);
  
  // --- STATE FOR TRACKING SCORES ---
  const [recentScore, setRecentScore] = useState(0);
  const [bestScores, setBestScores] = useState({
    [RICHARD_ID]: null,
    [SANDRA_ID]: null
  });

  // --- INITIALIZE SCRIPT & LOAD SCORES FROM BROWSER STORAGE ---
  useEffect(() => {
    // 1. Load ElevenLabs Script
    if (typeof window !== 'undefined' && !document.getElementById('elevenlabs-convai-script')) {
      const script = document.createElement('script');
      script.id = 'elevenlabs-convai-script';
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.head.appendChild(script);
    }

    // 2. Fetch saved scores from LocalStorage
    const savedRichard = localStorage.getItem(`repready_best_${RICHARD_ID}`);
    const savedSandra = localStorage.getItem(`repready_best_${SANDRA_ID}`);
    
    setBestScores({
      [RICHARD_ID]: savedRichard ? parseInt(savedRichard) : null,
      [SANDRA_ID]: savedSandra ? parseInt(savedSandra) : null
    });
  }, []);

  // --- THE "END SIMULATION" LOGIC ---
  const handleTerminate = () => {
    // 1. Generate a mock score based on call time/metrics (Random 60-95 for MVP)
    const generatedScore = Math.floor(Math.random() * (95 - 60 + 1)) + 60;
    setRecentScore(generatedScore);

    // 2. Check if it's a new High Score
    const currentBest = bestScores[activeAgent];
    if (!currentBest || generatedScore > currentBest) {
      localStorage.setItem(`repready_best_${activeAgent}`, generatedScore.toString());
      setBestScores(prev => ({ ...prev, [activeAgent]: generatedScore }));
    }

    // 3. Switch views
    setActiveAgent(null);
    setShowAudit(true);
  };

  return (
    // Removed min-h-screen so it respects your existing sidebar layout
    <div className="w-full h-full bg-[#050505] text-zinc-300 font-mono p-10 relative">
      
      {/* Background Grid Polish */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22D3EE 1px, transparent 1px), linear-gradient(90deg, #22D3EE 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="mb-16">
          <h1 className="text-5xl font-bold text-white uppercase italic tracking-tighter">SCENARIO DECK</h1>
          <p className="text-[#22D3EE] text-[10px] uppercase tracking-[0.4em] mt-2">Telemetry Active // Select Target</p>
        </header>

        {/* --- SCENARIO CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Richard Card */}
          <div className="border border-white/5 bg-[#0a0a0a] hover:border-[#22D3EE]/40 transition-all flex flex-col group">
            <div className="p-8 flex gap-6 flex-1">
              {/* FIXED IMAGE CONTAINER: Prevents stretching, uses portrait crop */}
              <div className="w-24 h-32 shrink-0 border border-white/10 overflow-hidden">
                <img src="/Richard.jpg" alt="Richard Vance" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Richard Vance</h2>
                <p className="text-[#22D3EE] text-[10px] uppercase tracking-widest font-bold mt-1 mb-4">VP Procurement</p>
                
                {/* THE HIGH SCORE DISPLAY */}
                <div className="mt-auto">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Personal Best</p>
                  {bestScores[RICHARD_ID] ? (
                    <p className="text-xl font-bold text-white">{bestScores[RICHARD_ID]}<span className="text-xs text-zinc-500">/100</span></p>
                  ) : (
                    <p className="text-xs font-bold text-zinc-600 tracking-widest">UNTESTED</p>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setActiveAgent(RICHARD_ID)} className="w-full py-4 border-t border-white/5 text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/5 transition-all">
              START SIMULATION
            </button>
          </div>

          {/* Sandra Card */}
          <div className="border border-white/5 bg-[#0a0a0a] hover:border-[#22D3EE]/40 transition-all flex flex-col group">
            <div className="p-8 flex gap-6 flex-1">
              {/* FIXED IMAGE CONTAINER */}
              <div className="w-24 h-32 shrink-0 border border-white/10 overflow-hidden">
                <img src="/Sandra.jpg" alt="Sandra Chen" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Sandra Chen</h2>
                <p className="text-[#22D3EE] text-[10px] uppercase tracking-widest font-bold mt-1 mb-4">Head of IT</p>
                
                {/* THE HIGH SCORE DISPLAY */}
                <div className="mt-auto">
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Personal Best</p>
                  {bestScores[SANDRA_ID] ? (
                    <p className="text-xl font-bold text-white">{bestScores[SANDRA_ID]}<span className="text-xs text-zinc-500">/100</span></p>
                  ) : (
                    <p className="text-xs font-bold text-zinc-600 tracking-widest">UNTESTED</p>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setActiveAgent(SANDRA_ID)} className="w-full py-4 border-t border-white/5 text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white/5 transition-all">
              START SIMULATION
            </button>
          </div>

        </div>
      </div>

      {/* --- 3. THE CLEAN MODAL OVERLAY --- */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/95">
          <div className="w-full max-w-3xl bg-[#030303] border border-white/10 rounded-lg overflow-hidden flex flex-col items-center p-16 shadow-[0_0_100px_rgba(0,0,0,1)] relative">
            
            <div className="absolute top-6 left-6 flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
               <span className="text-zinc-500 text-[9px] uppercase tracking-[0.2em]">Live Connection</span>
            </div>

            <div className="mb-12 mt-8 w-full flex justify-center scale-110">
               <elevenlabs-convai agent-id={activeAgent} variant="full"></elevenlabs-convai>
            </div>

            <button 
              onClick={handleTerminate} 
              className="px-12 py-3 border border-red-500/50 text-red-500 text-[10px] uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all font-bold"
            >
              TERMINATE SESSION
            </button>
          </div>
        </div>
      )}

      {/* --- 4. THE POST-SIMULATION AUDIT SCORECARD --- */}
      {showAudit && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/95 font-mono">
          <div className="w-full max-w-2xl border border-[#22D3EE]/30 p-12 rounded-xl bg-[#050505] shadow-[0_0_80px_rgba(34,211,238,0.1)] text-center relative overflow-hidden">
            
            <h2 className="text-3xl font-bold text-white mb-2 uppercase italic tracking-tighter">SIMULATION COMPLETE</h2>
            <p className="text-zinc-500 text-[9px] mb-10 uppercase tracking-[0.4em]">Performance Telemetry Generated</p>
            
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded mb-10">
              <p className="text-zinc-500 text-[10px] uppercase mb-2 tracking-widest">Aggregate Score</p>
              <p className="text-7xl font-bold text-[#22D3EE] italic tracking-tighter shadow-cyan-500 drop-shadow-lg">
                {recentScore}
              </p>
              {recentScore >= (bestScores[activeAgent] || 0) && recentScore > 0 && (
                <p className="text-green-400 text-[9px] uppercase tracking-widest mt-4 animate-pulse">New Personal Best!</p>
              )}
            </div>

            <div className="flex gap-4">
              <Link href="/coach" className="flex-1">
                <button className="w-full py-4 bg-[#22D3EE] text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-white transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                  ANALYZE WITH COACH
                </button>
              </Link>
              <button 
                onClick={() => setShowAudit(false)} 
                className="flex-1 py-4 border border-white/10 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 transition-all"
              >
                RETURN TO DECK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
