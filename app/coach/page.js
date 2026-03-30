'use client';

import React, { useState, useRef, useEffect } from 'react';

// Custom Markdown Parser (Zero Dependencies)
const renderFormattedText = (text) => {
  return text.split('\n').map((line, index) => {
    // Handle empty lines as spacing
    if (!line.trim()) return <div key={index} className="h-2"></div>;

    // Detect bullet points
    const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
    const textToParse = isBullet ? line.trim().substring(2) : line;

    // Parse bold (**text**)
    const parts = textToParse.split(/(\*\*.*?\*\*)/g);
    
    const parsedLine = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-cyan-300 font-bold tracking-wide">{part.slice(2, -2)}</strong>;
      }
      
      // Parse italics (*text*)
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((iPart, j) => {
        if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
          return <em key={j} className="text-zinc-200 italic">{iPart.slice(1, -1)}</em>;
        }
        return iPart;
      });
    });

    // Render as bullet or standard paragraph
    if (isBullet) {
      return (
        <div key={index} className="flex gap-3 mt-2 mb-2 ml-2">
          <span className="text-cyan-500 font-bold">›</span>
          <span className="leading-relaxed">{parsedLine}</span>
        </div>
      );
    }
    
    return <div key={index} className="mb-3 last:mb-0 leading-relaxed">{parsedLine}</div>;
  });
};

export default function CoachPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "I've reviewed your recent simulation telemetry. Where are you losing frame control, and how can we tighten your anchors?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Secretly grab the latest scorecard from the $0 LocalStorage database
      const savedDebrief = localStorage.getItem('repready_latest_debrief');
      const contextString = savedDebrief 
        ? `The rep just finished a simulation. Here is their exact telemetry and JSON scorecard: ${savedDebrief}` 
        : "The rep hasn't completed a simulation yet, or the data is missing.";

      // 2. Fire it to your new "Swiss Army Knife" API route with the system context
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          system: `You are the RepReady AI Coach. Answer the user's questions based specifically on this telemetry data: ${contextString}`,
          messages: newMessages 
        })
      });

      if (!response.ok) throw new Error('Failed to fetch AI response');
      
      const data = await response.json();
      const aiResponseText = data.text || data.message || "System Error: Neural link severed.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponseText }]);
    } catch (error) {
      console.error("Coach API Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection to the AI Sales Manager was interrupted. Check your /api/coach route." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[85vh] flex flex-col">
      <div className="mb-8 flex-shrink-0">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-white mb-2 uppercase">AI Strategy Coach</h1>
        <p className="text-zinc-400 font-mono text-sm">REVIEW TRANSCRIPTS AND REFINE YOUR NEGOTIATION TACTICS WITH THE AI MENTOR.</p>
      </div>

      <div className="glass-panel rounded-xl border border-white/10 flex flex-col flex-1 overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.05)]">
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-cyan-900/30 border border-cyan-400/30' : 'bg-zinc-800 border border-white/10'}`}>
                <span className="material-symbols-outlined text-sm" style={{ color: msg.role === 'user' ? '#00f0ff' : '#b9cacb' }}>
                  {msg.role === 'user' ? 'person' : 'psychology'}
                </span>
              </div>
              <div className={`max-w-[85%] p-5 rounded-lg font-mono text-sm shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-cyan-400/10 border border-cyan-400/20 text-cyan-50' 
                  : 'bg-[#111111] border border-white/10 text-zinc-300'
              }`}>
                {/* Formatting applied right here */}
                {renderFormattedText(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
               <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-zinc-800 border border-white/10">
                <span className="material-symbols-outlined text-sm text-zinc-500 animate-spin">sync</span>
              </div>
              <div className="p-5 rounded-lg font-mono text-sm bg-[#111111] border border-white/10 text-zinc-500 animate-pulse">
                Analyzing telemetry...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-black/60 border-t border-white/10">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the coach for tactical advice..." 
              className="w-full bg-zinc-900 border border-white/10 focus:outline-none focus:border-cyan-400 rounded py-4 pl-4 pr-16 font-mono text-sm text-white transition-colors"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
