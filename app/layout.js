import './globals.css';

export const metadata = {
  title: 'RepReady // Sovereign Protocol',
  description: 'High-stakes negotiation simulation engine.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`
          body { background-color: #000000; color: #e2e2e2; }
          .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
          .font-headline { font-family: 'Space Grotesk', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
          .glass-panel { background: rgba(14, 14, 14, 0.6); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.05); }
          
          /* Visualizer Animations */
          @keyframes cyber-pulse { 0%, 100% { height: 20%; } 50% { height: 100%; } }
          .cyber-bar-1 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0s; }
          .cyber-bar-2 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.15s; }
          .cyber-bar-3 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.3s; }
          .cyber-bar-4 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.45s; }
          .cyber-bar-5 { animation: cyber-pulse 1.2s ease-in-out infinite; animation-delay: 0.6s; }
        `}</style>
      </head>
      <body className="font-sans antialiased selection:bg-cyan-400/30 selection:text-cyan-400 relative">
        
        {/* GLOBAL HEADER */}
        <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-cyan-400/10 rounded-lg border border-cyan-400/30">
              <span className="material-symbols-outlined text-cyan-400 text-xl" style={{fontVariationSettings: "'FILL' 1"}}>deployed_code</span>
            </div>
            <span className="font-headline font-bold text-cyan-400 tracking-tighter text-xl uppercase">Sovereign Protocol</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full border border-cyan-400/50 bg-zinc-800"></div>
          </div>
        </header>

        {/* GLOBAL SIDEBAR */}
        <aside className="fixed left-4 top-20 bottom-4 w-20 rounded-xl bg-[#0E0E0E]/80 backdrop-blur-3xl border border-white/10 shadow-2xl z-40 hidden lg:flex flex-col items-center py-8 gap-8 font-mono text-xs tracking-tighter">
          <div className="flex flex-col items-center gap-1 mb-4">
            <div className="w-2 h-2 rounded-full bg-cyan-400 mb-2 shadow-[0_0_10px_#00F0FF]"></div>
            <span className="text-zinc-500 text-[10px]">ACTIVE</span>
          </div>
          <nav className="flex flex-col gap-6 w-full items-center">
            {/* You can add actual links (href="/coach") to these buttons later */}
            <button className="bg-cyan-400/10 text-cyan-400 border-r-2 border-cyan-400 w-full py-4 flex flex-col items-center gap-1">
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>grid_view</span>
              <span>DASH</span>
            </button>
            <button className="text-zinc-500 hover:text-cyan-400 hover:bg-white/5 w-full py-4 flex flex-col items-center gap-1 transition-all">
              <span className="material-symbols-outlined">psychology</span>
              <span>COACH</span>
            </button>
            <button className="text-zinc-500 hover:text-cyan-400 hover:bg-white/5 w-full py-4 flex flex-col items-center gap-1 transition-all">
              <span className="material-symbols-outlined">history</span>
              <span>HIST</span>
            </button>
          </nav>
        </aside>

        {/* THIS IS WHERE YOUR PAGES RENDER */}
        {/* We add padding to push the content away from the header and sidebar */}
        <main className="pt-24 px-6 lg:pl-32 lg:pr-12 pb-12 min-h-screen">
          {children}
        </main>

        {/* Global Background Grid Pattern */}
        <div className="fixed inset-0 opacity-[0.05] pointer-events-none z-[-1]" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>
      </body>
    </html>
  );
}
