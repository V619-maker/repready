'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

function DimensionBar({ label, score }) {
  const color = score >= 70 ? '#22D3EE' : score >= 40 ? '#F5A623' : '#E63946'
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-[10px] font-bold text-white">{score}</span>
      </div>
      <div className="w-full h-1 bg-white/5 overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function CoachDashboard() {
  const [debrief, setDebrief] = useState(null);
  const [debriefType, setDebriefType] = useState('coach');
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedDebrief = localStorage.getItem('repready_latest_debrief');
    const savedTranscript = localStorage.getItem('repready_latest_transcript');
    const savedType = localStorage.getItem('repready_debrief_type') || 'coach';

    if (savedDebrief) {
      try {
        const parsed = JSON.parse(savedDebrief);
        setDebrief(parsed);
        setDebriefType(savedType);
      } catch (e) {
        console.error("Failed to parse debrief telemetry");
        setDebrief(null);
      }
    } else {
      setDebrief(null);
    }

    if (savedTranscript) {
      setTranscript(savedTranscript);
    } else {
      setTranscript('');
    }

    setIsLoading(false);
  }, [typeof window !== 'undefined' ? window.location.href : '']);

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

  const isBoardroom = debriefType === 'boardroom';

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
          <div className="lg:col-span-2 space-y-8">
            {debrief && (
              <>
                {/* Score block */}
                {isBoardroom ? (
                  <div className="bg-[#0a0a0a] border border-white/5 p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Final Score</p>
                        <p className="text-6xl font-bold italic tracking-tighter text-[#22D3EE]">
                          {debrief.finalScore || "--"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Grade</p>
                        <p className={`text-6xl font-bold italic tracking-tighter ${
                          debrief.grade === 'A' ? 'text-green-400' :
                          debrief.grade === 'B' ? 'text-[#22D3EE]' :
                          debrief.grade === 'C' ? 'text-[#F5A623]' :
                          'text-red-500'
                        }`}>{debrief.grade || "--"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Procurement Score</p>
                        <p className="text-2xl font-bold text-white">{debrief.procurementScore || "--"}<span className="text-xs text-zinc-500">/100</span></p>
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">Margin Defense</p>
                      </div>
                      <div>
                        <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Enablement Score</p>
                        <p className="text-2xl font-bold text-white">{debrief.enablementScore || "--"}<span className="text-xs text-zinc-500">/100</span></p>
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">Call Technique</p>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}

                {/* Executive verdict */}
                {isBoardroom && debrief.verdict && (
                  <div className="border border-white/10 bg-white/5 p-6">
                    <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Executive Verdict</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">"{debrief.verdict}"</p>
                  </div>
                )}

                {/* What you did right / wrong */}
                {isBoardroom ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-green-500/20 bg-green-950/5 p-6">
                      <h3 className="text-green-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">What You Did Right</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed border-l border-green-500/30 pl-3">
                        {debrief.whatYouDidRight || "—"}
                      </p>
                    </div>
                    <div className="border border-red-500/20 bg-red-950/5 p-6">
                      <h3 className="text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">What You Did Wrong</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed border-l border-red-500/30 pl-3">
                        {debrief.whatYouDidWrong || "—"}
                      </p>
                    </div>
                  </div>
                ) : (
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
                )}

                {/* One thing to fix */}
                <div className="border border-[#22D3EE]/20 bg-[#22D3EE]/5 p-6">
                  <h3 className="text-[#22D3EE] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                    {isBoardroom ? 'One Thing To Fix Next' : 'Actionable Advice'}
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {isBoardroom
                      ? (debrief.oneThingToFixNext || "—")
                      : (debrief.actionable_advice || "Review the transcript to identify missed buying signals.")}
                  </p>
                </div>

                {/* 6 Dimension Skill Matrix */}
                {isBoardroom && debrief.dimensions && (
                  <div className="border border-white/5 bg-[#0a0a0a] p-6">
                    <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Skill Matrix</h3>
                    <DimensionBar label="Discovery Quality" score={debrief.dimensions.discoveryQuality} />
                    <DimensionBar label="Objection Handling" score={debrief.dimensions.objectionHandling} />
                    <DimensionBar label="Price Defense" score={debrief.dimensions.priceDefense} />
                    <DimensionBar label="SME Knowledge" score={debrief.dimensions.smeKnowledge} />
                    <DimensionBar label="Communication" score={debrief.dimensions.communication} />
                    <DimensionBar label="Emotional Resilience" score={debrief.dimensions.emotionalResilience} />
                  </div>
                )}

                {/* Analyst breakdown */}
                {isBoardroom && debrief.analysts && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-white/5 bg-[#0a0a0a] p-6">
                      <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Procurement Analysis</h3>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Margin Defense</p>
                      <p className="text-xs text-white font-bold uppercase mb-3">{debrief.analysts.procurement.marginDefense}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{debrief.analysts.procurement.reasoning}</p>
                    </div>
                    <div className="border border-white/5 bg-[#0a0a0a] p-6">
                      <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Enablement Analysis</h3>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Call Control</p>
                      <p className="text-xs text-white font-bold uppercase mb-3">{debrief.analysts.enablement.callControl}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{debrief.analysts.enablement.reasoning}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Raw Transcript */}
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
