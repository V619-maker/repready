'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function getScoreColor(score) {
  if (score >= 70) return '#00c8e0'
  if (score >= 40) return '#f5a623'
  return '#e84545'
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
    if (!user) { router.push('/sign-in'); return }
    if (!orgId) return
    fetch(`/api/dashboard?orgId=${encodeURIComponent(orgId)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load dashboard.'); setLoading(false) })
  }, [isLoaded, user, orgId])

  if (!isLoaded || loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#00c8e0', fontFamily: 'monospace', letterSpacing: '0.1em' }}>LOADING TELEMETRY...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#e84545' }}>{error}</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: '#fff', fontFamily: 'monospace' }}>

      <div style={{ borderBottom: '1px solid rgba(0,200,224,0.15)', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d1117' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#00c8e0', fontWeight: 900, fontSize: 16, letterSpacing: '0.1em' }}>REPREADY</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>//</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: '0.15em' }}>MANAGER DASHBOARD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>{orgId?.toUpperCase()}</span>
          <Link href="/deck" style={{ fontSize: 11, color: '#00c8e0', textDecoration: 'none', letterSpacing: '0.1em' }}>← BACK TO APP</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'AVG TEAM SCORE', value: data?.avgScore ?? '—' },
            { label: 'TOTAL SESSIONS', value: data?.totalSessions ?? 0 },
            { label: 'ACTIVE REPS', value: data?.totalReps ?? 0 },
            { label: 'PASSING ≥70', value: data?.passingReps ?? 0 },
          ].map((m) => (
            <div key={m.label} style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: '20px 24px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginBottom: 10 }}>{m.label}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#00c8e0' }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>REP LEADERBOARD</div>
            {!data?.reps?.length ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No sessions yet. Reps appear here after completing a simulation.</p>
            ) : data.reps.map((rep, i) => (
              <div key={rep.userEmail} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 16 }}>{i + 1}</span>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,200,224,0.1)', border: '1px solid rgba(0,200,224,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#00c8e0', flexShrink: 0 }}>
                  {rep.userEmail[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rep.userEmail}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{rep.sessions} session{rep.sessions !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ width: 60, height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ width: `${rep.avgScore}%`, height: '100%', background: getScoreColor(rep.avgScore) }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, width: 32, textAlign: 'right', color: getScoreColor(rep.avgScore) }}>{rep.avgScore}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>RECENT SESSIONS</div>
            {!data?.recentSessions?.length ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No sessions recorded yet.</p>
            ) : data.recentSessions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontSize: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.userEmail}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>   {s.persona} · {s.mode}{s.hostilityReached ? ` · ${s.hostilityReached}% hostile` : ''}{s.qualificationStatus ? ` · ${s.qualificationStatus}` : ''} </div>
                </div>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{timeAgo(s.createdAt)}</span>
                <span style={{ fontWeight: 900, fontSize: 14, width: 32, textAlign: 'right', color: getScoreColor(s.finalScore) }}>{s.finalScore}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: '1px solid rgba(0,200,224,0.1)', padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          SESSION DATA · MONGODB ATLAS MUMBAI · NEVER USED TO TRAIN AI · DPDP ACT 2023 COMPLIANT · DELETE: privacy@repready.site
        </div>

      </div>
    </div>
  )
}
