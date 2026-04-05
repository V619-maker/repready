import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'RepReady // AI Sales Simulation Engine',
  description: 'High-stakes negotiation simulation engine for enterprise teams.',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
        </head>
        <body className="bg-white text-slate-900 font-sans antialiased selection:bg-cyan-100 relative min-h-screen flex flex-col">
          
          {/* THE FIXED HEADER */}
          <header className="fixed top-0 left-0 right-0 w-full z-[100] flex justify-between items-center px-8 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
            
            {/* THE ANIMATED TACTICAL LOGO */}
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative w-10 h-10 flex items-center justify-center">
                {/* Rotating Outer Reticle */}
                <svg viewBox="0 0 100 100" className="absolute w-full h-full animate-[spin_15s_linear_infinite] opacity-20">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="black" strokeWidth="1" strokeDasharray="5 10" />
                </svg>
                
                {/* The Hexagon 'R' Frame */}
                <div className="relative w-7 h-7 flex items-center justify-center bg-white border-2 border-cyan-500 rounded-sm rotate-45 group-hover:rotate-[135deg] transition-transform duration-700">
                  <span className="text-black font-black text-base -rotate-45 group-hover:-rotate-[135deg] transition-transform duration-700">R</span>
                  {/* The Red Dot Pulse */}
                  <div className="absolute top-1 right-1 w-1 h-1 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                </div>
              </div>
              <span className="text-black font-black tracking-tighter uppercase text-xl italic">
                Rep<span className="text-cyan-500">Ready</span>
              </span>
            </Link>

            {/* NAVIGATION */}
            <div className="flex items-center gap-8">
              <Link href="/pricing" className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 hover:text-black transition-colors">
                Pricing
              </Link>
              <Link href="/sign-in" className="bg-black text-white px-8 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all">
                Sign In
              </Link>
            </div>
          </header>

          {/* MAIN CONTENT AREA: pt-20 prevents overlapping with header */}
          <main className="relative pt-20 flex-grow z-10">
            {children}
          </main>

          {/* GLOBAL GRID BACKGROUND */}
          <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" 
               style={{backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '60px 60px'}}>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}