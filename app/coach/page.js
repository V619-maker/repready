'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CoachDashboard() {
  const [debrief, setDebrief] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedDebrief = localStorage.getItem('repready_latest_debrief');
    const savedTranscript = localStorage.getItem('repready_latest_transcript');

    if (savedDebrief) {
      try {
        setDebrief(JSON.parse(savedDebrief));
      } catch (e) {
        console.error("Failed to parse debrief telemetry");
      }
    }
    if (savedTranscript) {
      setTranscript(savedTranscript);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen bg-[#050505] text-[#22D3EE] flex items-center justify-center font-mono text-sm tracking-widest animate-pulse uppercase">Retrieving Telemetry...</div>;
  }

  if (!debrief && !transcript) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col justify-center items-center font-mono p-10 text-center">
        <h1 className="text-red-500 text-3xl font-bold uppercase italic tracking-tighter mb-4">NO TELEMETRY FOUND</h1>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-8 max-w-md">The AI Coach requires raw data. Run a simulation in the Scenario Deck to generate a post-action report.</p>
        <Link href="/deck">
          <button className="px-8 py-3 border border-[#22D3EE]/50 text-[#22D3EE] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#22D3EE]/10 transition-all">RETURN TO DECK</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#050505] text-zinc-300 font-mono p-4 md:p-10 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22D3EE 1px, transparent 1px), linear-gradient(90deg, #22D3EE 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white uppercase italic tracking-tighter">AI COACH</h1>
            <p className="text-[#22D3EE] text-[10px] uppercase tracking-[0.4em] mt-2">Post-Action Report // Analysis Complete</p>
          </div>
          <Link href="/deck">
            <button className="px-6 py-3 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
              BACK TO DECK
            </button>
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scores & Feedback */}
          <div className="lg:col-span-2 space-y-8">
            {debrief && (
              <>
                <div className="bg-[#0a0a0a] border border-white/5 p-8 flex items-center justify-between">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Aggregate Score</p>
                    <p className="text-6xl font-bold italic tracking-tighter text-[#22D3EE]">
                      {debrief.aggregate_score || "--"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Simulation Status</p>
                    <p className="text-white text-sm font-bold tracking-widest uppercase">TERMINATED</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-green-500/20 bg-green-950/5 p-6">
                    <h3 className="text-green-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Strengths</h3>
                    <ul className="space-y-3">
                      {(debrief.strengths || ["Maintained professional tone."]).map((item, i) => (
                        <li key={i} className="text-sm text-zinc-400 leading-relaxed border-l border-green-500/30 pl-3">{item}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="border border-red-500/20 bg-red-950/5 p-6">
                    <h3 className="text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Critical Weaknesses</h3>
                    <ul className="space-y-3">
                      {(debrief.weaknesses || ["Failed to establish firm next steps."]).map((item, i) => (
                        <li key={i} className="text-sm text-zinc-400 leading-relaxed border-l border-red-500/30 pl-3">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="border border-[#22D3EE]/20 bg-[#22D3EE]/5 p-6">
                  <h3 className="text-[#22D3EE] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Actionable Advice</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {debrief.actionable_advice || "Review the transcript to identify missed buying signals. Focus on tighter discovery questions in your next attempt."}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right Column: Raw Transcript */}
          <div className="bg-[#020202] border border-white/5 p-6 flex flex-col h-[600px]">
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4">Raw Comm Log</h3>
            <div className="flex-1 overflow-y-auto pr-4 space-y-4 text-xs">
              {transcript ? (
                transcript.split('\n\n').map((block, i) => {
                  const isRep = block.startsWith('Rep:') || block.startsWith('YOU:');
                  return (
                    <div key={i} className={`${isRep ? 'text-[#22D3EE]' : 'text-red-400'} opacity-80 leading-relaxed`}>
                      {block}
                    </div>
                  );
                })
              ) : (
                <div className="text-zinc-600 italic">No communication logged.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
