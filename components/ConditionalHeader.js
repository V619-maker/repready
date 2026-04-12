'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ConditionalHeader() {
  const pathname = usePathname()

  // Hide header on full-screen product pages that have their own UI
  const hideHeader =
    pathname.startsWith('/deck') ||
    pathname.startsWith('/coach') ||
    pathname.startsWith('/simulate')

  // Add top padding to main content only when header is visible
  // This is handled via a wrapper div below
  if (hideHeader) return null

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-[100] flex justify-between items-center px-8 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">

      {/* LOGO */}
      <Link href="/" className="flex items-center gap-4 group">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="absolute w-full h-full animate-[spin_15s_linear_infinite] opacity-20">
            <circle cx="50" cy="50" r="45" fill="none" stroke="black" strokeWidth="1" strokeDasharray="5 10" />
          </svg>
          <div className="relative w-7 h-7 flex items-center justify-center bg-white border-2 border-cyan-500 rounded-sm rotate-45 group-hover:rotate-[135deg] transition-transform duration-700">
            <span className="text-black font-black text-base -rotate-45 group-hover:-rotate-[135deg] transition-transform duration-700">R</span>
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
  )
}
