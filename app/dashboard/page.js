'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function getScoreColor(score) {
  if (score >= 70) return '#22C55E'
  if (score >= 40) return '#F5A623'
  return '#E63946'
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orgId = user?.primaryEmailAddress?.emailAddress?.split('@')[1] || null

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/'); return }
    if (!orgId) return

    fetch(`/api/dashboard?orgId=${encodeURIComponent(orgId)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load dashboard.'); setLoading(false) })
  }, [isLoaded, user, orgId])

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Loading team data...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center">
      <p className="text-[#E63946]">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0D0D1A] text-white">
      {/* Header */}
      <div className="border-b border-border/50 bg-[#0A0A12] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#E63946] flex items-center justify-center">
            <span className="text-white text-sm font-bold">R</span>
          </div>
          <span className="font-bold text-lg">RepReady</span>
          <span className="text-muted-foreground/50 mx-2">|</span>
          <span className="text-muted-foreground text-sm">Manager Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">{orgId}</span>
          <Link href="/simulate" className="text-xs text-[#F5A623] hover:underline">
            ← Back to App
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">

        {/* Metric cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Avg team score', value: data?.avgScore ?? '—' },
            { label: 'Total sessions', value: data?.totalSessions ?? 0 },
            { label: 'Active reps', value: data?.totalReps ?? 0 },
            { label: 'Passing (≥70)', value: data?.passingReps ?? 0 },
          ].map((m) => (
            <div key={m.label} className="bg-[#0A0A12] border border-border/50 rounded-xl p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{m.label}</p>
              <p className="text-3xl font-black text-white">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Rep leaderboard */}
          <div className="bg-[#0A0A12] border border-border/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Rep leaderboard
            </h2>
            {!data?.reps?.length ? (
              <p className="text-muted-foreground text-sm">No sessions yet. Reps will appear here once they complete a simulation.</p>
            ) : (
              <div className="space-y-3">
                {data.reps.map((rep, i) => (
                  <div key={rep.userEmail} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-xs font-bold text-[#6366F1] flex-shrink-0">
                      {rep.userEmail[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rep.userEmail}</p>
                      <p className="text-xs text-muted-foreground">{rep.sessions} session{rep.sessions !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${rep.avgScore}%`, background: getScoreColor(rep.avgScore) }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8 text-right" style={{ color: getScoreColor(rep.avgScore) }}>
                      {rep.avgScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent sessions */}
          <div className="bg-[#0A0A12] border border-border/50 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Recent sessions
            </h2>
            {!data?.recentSessions?.length ? (
              <p className="text-muted-foreground text-sm">No sessions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentSessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-white">{s.userEmail}</p>
                      <p className="text-xs text-muted-foreground capitalize">{s.persona} · {s.mode}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(s.createdAt)}</span>
                    <span className="font-bold text-sm w-8 text-right" style={{ color: getScoreColor(s.finalScore) }}>
                      {s.finalScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Compliance notice */}
        <div className="border border-border/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-[#F5A623] text-lg">⚠</span>
          <div>
            <p className="text-xs text-muted-foreground">
              Session data is stored securely on MongoDB Atlas (Mumbai region) and is never used to train AI models.
              Reps are only visible here if they are on your team plan. Data is retained for 12 months.
              To request deletion contact <span className="text-[#F5A623]">privacy@repready.site</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
