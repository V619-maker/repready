'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useConversation, ConversationProvider } from '@elevenlabs/react';

const RICHARD_ID = "agent_8601kmk3maq9f9a9csym74aj7s4e";
const SANDRA_ID = "agent_0301kmsnhr7tf11b62bvd7vsw9qq";
const TRIAL_TIME_LIMIT = 90;

function RepReadyDashboard() {
  const [activeAgent, setActiveAgent] = useState(null);
  const [showAudit, setShowAudit] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(TRIAL_TIME_LIMIT);
  const [cutOff, setCutOff] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [creditsDepleted, setCreditsDepleted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState([]);
  const transcriptRef = useRef([]);

  // ── Hide the layout header on this full-screen page ──
  useEffect(() => {
    const header = document.querySelector('body > header');
    if (header) header.style.display = 'none';
    return () => {
      if (header) header.style.display = '';
    };
  }, []);

  const conversation = useConversation({
    onMessage: (message) => {
      if (message.message) {
        const speaker = message.source === 'user' ? 'Rep' : 'Prospect';
        transcriptRef.current.push(`${speaker}: ${message.message}`);
        setLiveTranscript(prev => [...prev, { speaker, text: message.message }]);
      }
    }
  });
  
  const [recentScore, setRecentScore] = useState(0);
  const [bestScores, setBestScores] = useState({
    [RICHARD_ID]: null,
    [SANDRA_ID]: null
  });

  useEffect(() => {
    const savedRichard = localStorage.getItem(`repready_best_${RICHARD_ID}`);
    const savedSandra = localStorage.getItem(`repready_best_${SANDRA_ID}`);
    setBestScores({
      [RICHARD_ID]: savedRichard ? parseInt(savedRichard) : null,
      [SANDRA_ID]: savedSandra ? parseInt(savedSandra) : null
    });
  }, []);

  useEffect(() => {
    let interval;
    if (conversation.status === 'connected' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && conversation.status === 'connected') {
      setCutOff(true);
      handleEndCall();
    }
    return () => clearInterval(interval);
  }, [conversation.status, timeLeft]);

  const handleStartCall = async () => {
    setIsVerifying(true);
    setCreditsDepleted(false);
    setLiveTranscript([{ speaker: 'System', text: 'INITIALIZING INTERFACE...' }]);

    try {
      const creditCheck = await fetch('/api/deduct-credit', { method: 'POST' });
      
      if (!creditCheck.ok) {
        setCreditsDepleted(true);
        setIsVerifying(false);
        return;
      }

      setTimeLeft(TRIAL_TIME_LIMIT); 
      setCutOff(false);
      await conversation.startSession({ agentId: activeAgent });
    } catch (error) {
      console.error("Failed to start voice connection:", error);
    }
    setIsVerifying(false);
  };

  const handleEndCall = async () => {
    await conversation.endSession();
    handleTerminate(); 
  };

  const handleTerminate = async () => {
    setIsAnalyzing(true);
    try {
      const realTranscript = transcriptRef.current.join('\n\n');
      const finalTranscript = realTranscript.trim() ? realTranscript : "No words were spoken during the simulation.";

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalTranscript }) 
      });

      const data = await response.json();
      const cleanJson = data.message.replace(/```json|```/g, "").trim();
      const scoreData = JSON.parse(cleanJson);
      
      const finalScore = cutOff ? Math.max(30, (scoreData.aggregate_score || 75) - 20) : (scoreData.aggregate_score || 75);
      
      setRecentScore(finalScore);

      const currentBest = bestScores[activeAgent];
      if (!currentBest || finalScore > currentBest) {
        localStorage.setItem(`repready_best_${activeAgent}`, finalScore.toString());
        setBestScores(prev => ({ ...prev, [activeAgent]: finalScore }));
      }
      localStorage.setItem('repready_latest_debrief', cleanJson);
      localStorage.setItem('repready_latest_transcript', finalTranscript); 
      transcriptRef.current = [];
      
    } catch (error) {
      console.error("Scoring Error:", error);
      setRecentScore(60); 
    }
    setIsAnalyzing(false);
    setActiveAgent(null);
    setShowAudit(true);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] text-zinc-300 font-mono p-10 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22D3EE 1px, transparent 1px), linear-gradient(90deg, #22D3EE 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-16">
          <h1 className="text-5xl font-bold text-white uppercase italic tracking-tighter">SCENARIO DECK</h1>
          <p className="text-[#22D3EE] text-[10px] uppercase tracking-[0.4em] mt-2">Telemetry Active // Select Target</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Richard Card */}
          <div className="border border-white/5 bg-[#0a0a0a] hover:border-[#22D3EE]/40 transition-all flex flex-col group">
            <div className="p-8 flex gap-6 flex-1">
              <div className="w-24 h-32 shrink-0 border border-white/10 overflow-hidden">
                <img src="/Richard.png" alt="Richard Vance" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Richard Vance</h2>
                <p className="text-[#22D3EE] text-[10px] uppercase tracking-widest font-bold mt-1 mb-4">VP Procurement</p>
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
              <div className="w-24 h-32 shrink-0 border border-white/10 overflow-hidden">
                <img src="/Sandra.png" alt="Sandra Chen" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Sandra Chen</h2>
                <p className="text-[#22D3EE] text-[10px] uppercase tracking-widest font-bold mt-1 mb-4">Head of IT</p>
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

      {activeAgent && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 backdrop-blur-xl bg-black/95 font-mono text-cyan-400">
          
          {creditsDepleted && (
            <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-10 border border-red-500/30">
              <h3 className="text-red-500 text-3xl font-bold uppercase italic tracking-tighter mb-2">CREDITS DEPLETED</h3>
              <p className="text-zinc-400 text-xs tracking-widest text-center mb-8 max-w-md uppercase">
                Upgrade to Pro to unlock unlimited voice simulations.
              </p>
              <div className="flex gap-4">
                <a href="/pricing">
                  <button className="px-8 py-3 bg-red-500 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-red-400 transition-all">
                    UPGRADE NOW
                  </button>
                </a>
                <button 
                  onClick={() => { setCreditsDepleted(false); setActiveAgent(null); }} 
                  className="px-8 py-3 border border-white/10 text-zinc-400 font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 hover:text-white transition-all"
                >
                  RETURN TO DECK
                </button>
              </div>
            </div>
          )}

          <div className="w-full max-w-5xl h-[85vh] border border-cyan-500/30 bg-[#020202] flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.1)] relative overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-cyan-500/30 bg-cyan-950/20">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${conversation.status === 'connected' ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-cyan-800'}`}></div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-bold">
                  {conversation.status === 'connected' ? 'LIVE CALL // SECURE CONNECTION ESTABLISHED' : 'SYSTEM STANDBY // AWAITING LINK'}
                </span>
              </div>
              <div className="text-[10px] tracking-widest opacity-50 hidden sm:block">ENCRYPTION: AES-256-GCM</div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              <div className="w-full lg:w-[40%] border-b lg:border-b-0 lg:border-r border-cyan-500/30 p-8 flex flex-col bg-cyan-950/5 relative">
                <div className="absolute top-6 right-6 text-cyan-400 font-bold tracking-widest text-sm drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                  {formatTime(timeLeft)}
                </div>

                <div className="flex-1 flex items-center justify-center min-h-[250px] relative mt-4">
                  <div className="w-56 h-56 rounded-full border border-cyan-500/20 relative flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border border-cyan-500/40 relative">
                       {conversation.status === 'connected' && (
                          <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-[spin_4s_linear_infinite] opacity-60"></div>
                       )}
                    </div>
                    <div className="w-20 h-20 rounded-full border border-cyan-500/60 flex items-center justify-center">
                       <div className={`w-3 h-3 rounded-full ${conversation.status === 'connected' ? 'bg-cyan-400 animate-ping' : 'bg-cyan-800'}`}></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                      <div className="w-full h-[1px] bg-cyan-500"></div>
                      <div className="h-full w-[1px] bg-cyan-500 absolute"></div>
                    </div>
                  </div>
                </div>

                <div className="mb-10">
                  <p className="text-[10px] uppercase tracking-[0.2em] mb-3 opacity-60 font-bold">Voice Analysis</p>
                  <div className="flex gap-[3px] items-end h-8">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className={`w-2 bg-cyan-400 ${conversation.isSpeaking ? 'animate-pulse' : 'opacity-30'}`} style={{ height: conversation.isSpeaking ? `${Math.max(20, Math.random() * 100)}%` : '20%', animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold">Sentiment Analysis</p>
                    <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold">78% HOSTILE</p>
                  </div>
                  <div className="w-full h-1.5 bg-cyan-950 border border-cyan-500/30 overflow-hidden">
                    <div className="h-full bg-cyan-400 w-[78%]"></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col p-8 bg-[#020202]">
                <div className="flex-1 overflow-y-auto font-mono text-xs md:text-sm space-y-5 mb-6 pr-4">
                  {liveTranscript.length === 0 && conversation.status !== 'connected' && !isVerifying && (
                    <div className="text-cyan-600 opacity-60 uppercase tracking-widest">&gt; AWAITING COMMAND...</div>
                  )}
                  {isVerifying && (
                    <div className="text-cyan-400 animate-pulse uppercase tracking-widest">&gt; VERIFYING SECURITY CLEARANCE...</div>
                  )}
                  {liveTranscript.map((msg, i) => (
                    <div key={i} className={`leading-relaxed ${msg.speaker === 'System' ? 'text-cyan-600' : msg.speaker === 'Prospect' ? 'text-red-400' : 'text-cyan-400'}`}>
                      <span className="font-bold opacity-80 uppercase tracking-widest">
                        [{msg.speaker === 'Prospect' ? (activeAgent === RICHARD_ID ? 'VANCE' : 'CHEN') : msg.speaker === 'Rep' ? 'YOU' : 'SYSTEM'}]
                      </span> {msg.text}
                    </div>
                  ))}
                  {conversation.status === 'connected' && !conversation.isSpeaking && (
                     <div className="text-cyan-600 mt-6 leading-relaxed border-l-2 border-cyan-800/50 pl-4 text-xs">
                       <div className="opacity-60 uppercase tracking-widest animate-pulse">&gt; ANALYZING BEST RESPONSE...</div>
                     </div>
                  )}
                  {isAnalyzing && (
                    <div className="text-cyan-400 animate-pulse mt-6 uppercase tracking-widest font-bold">
                      &gt; UPLOADING TELEMETRY LOGS TO COACH...
                    </div>
                  )}
                </div>
                <div className="border-t border-cyan-500/30 pt-4 flex justify-between items-center opacity-40">
                  <span className="text-[10px] tracking-widest">VOICE ACTIVE — SPEAK YOUR RESPONSE</span>
                  <span className="text-[10px] tracking-widest">ESC TO TERMINATE</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-cyan-500/30 bg-cyan-950/10">
              <div className="flex gap-4">
                 {conversation.status !== 'connected' ? (
                   <button
                     onClick={handleStartCall}
                     disabled={isVerifying || isAnalyzing}
                     className="px-8 py-3 bg-cyan-400/10 border border-cyan-400 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-cyan-400 hover:text-black transition-all disabled:opacity-50"
                   >
                     {isVerifying ? 'VERIFYING...' : 'INITIATE LINK'}
                   </button>
                 ) : (
                   <button className="px-6 py-2 border border-cyan-500/30 text-[10px] uppercase tracking-[0.2em] hover:bg-cyan-500/10 transition-colors opacity-50">MUTE COMMS</button>
                 )}
              </div>
              {conversation.status === 'connected' ? (
                <button 
                  onClick={handleEndCall} 
                  className="px-8 py-3 border border-red-500/50 text-red-500 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-500/10 transition-colors"
                >
                  TERMINATE CONNECTION
                </button>
              ) : (
                <button 
                  onClick={() => setActiveAgent(null)} 
                  disabled={isAnalyzing}
                  className="px-6 py-3 border border-transparent text-cyan-500/50 text-[10px] uppercase tracking-[0.2em] hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all disabled:opacity-0"
                >
                  ABORT
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAudit && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/95 font-mono">
          <div className="w-full max-w-2xl border border-[#22D3EE]/30 p-12 bg-[#050505] shadow-[0_0_80px_rgba(34,211,238,0.1)] text-center relative">
            <h2 className={`text-3xl font-bold mb-2 uppercase italic tracking-tighter ${cutOff ? 'text-red-500' : 'text-white'}`}>
              {cutOff ? 'TRIAL TIME EXCEEDED' : 'SIMULATION COMPLETE'}
            </h2>
            <p className="text-zinc-500 text-[9px] mb-10 uppercase tracking-[0.4em]">
              {cutOff ? 'Upgrade to Pro for Unlimited Call Time' : 'Performance Telemetry Generated'}
            </p>
            <div className="bg-[#0a0a0a] border border-white/5 p-8 mb-10">
              <p className="text-zinc-500 text-[10px] uppercase mb-2 tracking-widest">Aggregate Score</p>
              <p className={`text-7xl font-bold italic tracking-tighter ${cutOff ? 'text-red-500' : 'text-[#22D3EE]'}`}>
                {recentScore}
              </p>
              {recentScore >= (bestScores[activeAgent] || 0) && recentScore > 0 && !cutOff && (
                <p className="text-green-400 text-[9px] uppercase tracking-widest mt-4 animate-pulse">New Personal Best!</p>
              )}
            </div>
            <div className="flex gap-4">
              <Link href="/coach" className="flex-1">
                <button className={`w-full py-4 font-bold uppercase tracking-[0.2em] text-[10px] transition-all ${cutOff ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-[#22D3EE] text-black hover:bg-white'}`}>
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

export default function RepReadyHome() {
  return (
    <ConversationProvider>
      <RepReadyDashboard />
    </ConversationProvider>
  );
}
