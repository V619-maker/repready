'use client'

import { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PERSONA_LABELS = {
  richard: { name: 'Richard Vance', title: 'VP Procurement' },
  sandra: { name: 'Sandra Chen', title: 'Head of IT' },
}

const STAGES = ['Not Qualified', 'Getting Started', 'Developing', 'Qualified', 'Elite']

function scoreColor(score) {
  if (score >= 70) return '#22D3EE'
  if (score >= 40) return '#F5A623'
  return '#E63946'
}

// Mirrors the qualification formula in app/deck/page.js — used only as a fallback
// for sessions saved before `qualificationStatus` was persisted.
function inferQualificationStatus(hostilityReached, finalScore) {
  if (hostilityReached == null || finalScore == null) return null
  if (hostilityReached >= 90 && finalScore >= 70) return 'Elite'
  if (hostilityReached >= 78 && finalScore >= 70) return 'Qualified'
  if (hostilityReached >= 60 && finalScore >= 70) return 'Developing'
  if (finalScore >= 70) return 'Getting Started'
  return 'Not Qualified'
}

function DimensionBar({ label, score }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-[10px] font-bold text-white">{score}</span>
      </div>
      <div className="w-full h-1 bg-white/5 overflow-hidden">
        <div className="h-full transition-all duration-700" style={{ width: `${score}%`, background: scoreColor(score) }} />
      </div>
    </div>
  )
}

export default function MyStatsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [sessions, setSessions] = useState(null)
  const [error, setError] = useState('')

  const userEmail = user?.primaryEmailAddress?.emailAddress || ''

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    if (!userEmail) return
    fetch(`/api/sessions?email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => setSessions(Array.isArray(d) ? d : []))
      .catch(() => setError('Failed to load session history.'))
  }, [isLoaded, user, userEmail])

  const stats = useMemo(() => {
    if (!sessions) return null
    const sorted = [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const latest = sorted[0] || null
    const currentStage = latest
      ? (latest.qualificationStatus || inferQualificationStatus(latest.hostilityReached, latest.finalScore))
      : null

    const trend = sorted.slice(0, 5).reverse()

    const dimensionSession = sorted.find(s => s.dimensions && typeof s.dimensions === 'object')

    const byPersona = {}
    for (const s of sorted) {
      const key = s.persona || 'unknown'
      if (!byPersona[key]) byPersona[key] = { count: 0, best: null }
      byPersona[key].count += 1
      if (typeof s.finalScore === 'number') {
        byPersona[key].best = byPersona[key].best == null ? s.finalScore : Math.max(byPersona[key].best, s.finalScore)
      }
    }

    return { latest, currentStage, trend, dimensionSession, byPersona }
  }, [sessions])

  if (!isLoaded || (isLoaded && user && sessions === null && !error)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#22D3EE] text-xs uppercase tracking-[0.3em]">Loading telemetry...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#E63946] text-sm">{error}</p>
      </div>
    )
  }

  const hasSessions = sessions && sessions.length > 0
  const stageIndex = stats?.currentStage ? STAGES.indexOf(stats.currentStage) : -1

  return (
    <div className="min-h-screen bg-black text-white px-6 md:px-16 py-16">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16 flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-bold text-white uppercase italic tracking-tighter">My Stats</h1>
            <p className="text-[#22D3EE] text-[10px] uppercase tracking-[0.4em] mt-2">Performance Telemetry</p>
          </div>
          <Link href="/deck" className="text-[10px] text-zinc-500 hover:text-[#22D3EE] uppercase tracking-widest transition-colors mt-2">
            ← Back to Deck
          </Link>
        </header>

        {!hasSessions ? (
          <div className="border border-white/5 bg-[#0a0a0a] p-12 text-center">
            <p className="text-zinc-500 text-sm">No simulations completed yet. Run a session from the Scenario Deck to see your stats here.</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* 1. Qualification journey */}
            <div className="border border-white/5 bg-[#0a0a0a] p-6">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Qualification Journey</h3>
              {stageIndex === -1 ? (
                <p className="text-zinc-600 text-xs">Not enough data on your most recent session to determine status.</p>
              ) : (
                <div className="flex items-center">
                  {STAGES.map((stage, i) => (
                    <div key={stage} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full transition-all"
                          style={{
                            background: i <= stageIndex ? '#22D3EE' : 'transparent',
                            border: `1px solid ${i <= stageIndex ? '#22D3EE' : 'rgba(255,255,255,0.15)'}`,
                          }}
                        />
                        <span
                          className="text-[9px] uppercase tracking-widest whitespace-nowrap"
                          style={{ color: i === stageIndex ? '#22D3EE' : i < stageIndex ? '#fff' : 'rgba(255,255,255,0.3)' }}
                        >
                          {stage}
                        </span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className="flex-1 h-px mx-2" style={{ background: i < stageIndex ? '#22D3EE' : 'rgba(255,255,255,0.1)' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Score trend over last 5 sessions */}
            <div className="border border-white/5 bg-[#0a0a0a] p-6">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Score Trend — Last {stats.trend.length} Sessions</h3>
              <div className="flex items-end gap-4 h-40">
                {stats.trend.map((s, i) => (
                  <div key={s.id || i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-bold text-white mb-1">{s.finalScore ?? '—'}</span>
                    <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                      <div
                        className="w-full max-w-[40px] transition-all duration-700"
                        style={{
                          height: `${Math.max(4, s.finalScore || 0)}%`,
                          background: scoreColor(s.finalScore || 0),
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-600 uppercase tracking-widest mt-2">
                      {s.hostilityReached != null ? `${s.hostilityReached}% hostile` : '—'}
                    </span>
                    <span className="text-[9px] text-zinc-700 mt-0.5">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Skill matrix from most recent session with dimensions */}
            <div className="border border-white/5 bg-[#0a0a0a] p-6">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Skill Matrix</h3>
              {stats.dimensionSession ? (
                <>
                  <p className="text-[9px] text-zinc-700 uppercase tracking-widest mb-4">
                    From session on {new Date(stats.dimensionSession.createdAt).toLocaleDateString()}
                  </p>
                  <DimensionBar label="Discovery Quality" score={stats.dimensionSession.dimensions.discoveryQuality} />
                  <DimensionBar label="Objection Handling" score={stats.dimensionSession.dimensions.objectionHandling} />
                  <DimensionBar label="Price Defense" score={stats.dimensionSession.dimensions.priceDefense} />
                  <DimensionBar label="SME Knowledge" score={stats.dimensionSession.dimensions.smeKnowledge} />
                  <DimensionBar label="Communication" score={stats.dimensionSession.dimensions.communication} />
                  <DimensionBar label="Emotional Resilience" score={stats.dimensionSession.dimensions.emotionalResilience} />
                </>
              ) : (
                <p className="text-zinc-600 text-xs">No dimension data yet — this is tracked on sessions run since dimensions scoring was added.</p>
              )}
            </div>

            {/* 4 & 5. Persona breakdown: sessions completed + personal best */}
            <div className="border border-white/5 bg-[#0a0a0a] p-6">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">By Persona</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stats.byPersona).map(([persona, data]) => {
                  const label = PERSONA_LABELS[persona] || { name: persona, title: '' }
                  return (
                    <div key={persona} className="border border-white/5 p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{label.name}</p>
                        {label.title && <p className="text-[9px] text-[#22D3EE] uppercase tracking-widest mt-0.5">{label.title}</p>}
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-3">{data.count} session{data.count !== 1 ? 's' : ''} completed</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1">Personal Best</p>
                        {data.best != null ? (
                          <p className="text-2xl font-bold" style={{ color: scoreColor(data.best) }}>{data.best}<span className="text-xs text-zinc-500">/100</span></p>
                        ) : (
                          <p className="text-xs font-bold text-zinc-600 tracking-widest">—</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
