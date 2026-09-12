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

const INACTIVITY_THRESHOLD_DAYS = 7

function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

const QUALIFICATION_COLORS = {
  'Not Qualified': 'rgba(255,255,255,0.3)',
  'Getting Started': '#f5a623',
  'Developing': '#f5a623',
  'Qualified': '#00c8e0',
  'Elite': '#ffd700',
}
function getQualificationColor(status) {
  return QUALIFICATION_COLORS[status] || 'rgba(255,255,255,0.3)'
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const orgId = user?.primaryEmailAddress?.emailAddress?.split('@')[1] || null
  const selfEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || null

  // publicMetadata (unlike privateMetadata) is exposed to the client by Clerk, so
  // this is safe to read directly — the server independently re-checks role on
  // every /api/admin/reps call, this is only what gates rendering the section.
  const isManager = user?.publicMetadata?.role === 'manager'
  const [adminReps, setAdminReps] = useState([])
  const [adminLoading, setAdminLoading] = useState(true)
  const [adminError, setAdminError] = useState('')
  const [pendingEmail, setPendingEmail] = useState(null)
  const [rowErrors, setRowErrors] = useState({})

  const [criteria, setCriteria] = useState([])
  const [criteriaLoading, setCriteriaLoading] = useState(true)
  const [criteriaError, setCriteriaError] = useState('')
  const [criteriaSaving, setCriteriaSaving] = useState(false)
  const [criteriaSaved, setCriteriaSaved] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
    if (!orgId) return
    fetch(`/api/dashboard?orgId=${encodeURIComponent(orgId)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Failed to load dashboard.'); setLoading(false) })
  }, [isLoaded, user, orgId])

  // Reps never fire this request at all — not just "fire it and get a 403 back" —
  // so there is zero behavior change for a rep account beyond one client-side
  // publicMetadata.role read.
  useEffect(() => {
    if (!isLoaded || !user || !isManager) { setAdminLoading(false); return }
    setAdminLoading(true)
    fetch('/api/admin/reps')
      .then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Failed to load reps.')
        setAdminReps(json.reps || [])
        setAdminLoading(false)
      })
      .catch(e => { setAdminError(e.message); setAdminLoading(false) })
  }, [isLoaded, user, isManager])

  useEffect(() => {
    if (!isLoaded || !user || !isManager) { setCriteriaLoading(false); return }
    setCriteriaLoading(true)
    fetch('/api/admin/criteria')
      .then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Failed to load criteria.')
        setCriteria(json.criteria || [])
        setCriteriaLoading(false)
      })
      .catch(e => { setCriteriaError(e.message); setCriteriaLoading(false) })
  }, [isLoaded, user, isManager])

  function updateCriterionField(index, field, value) {
    setCriteriaSaved(false)
    setCriteria(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  function addCriterion() {
    setCriteriaSaved(false)
    setCriteria(prev => [...prev, { name: '', description: '' }])
  }

  function removeCriterion(index) {
    setCriteriaSaved(false)
    setCriteria(prev => prev.filter((_, i) => i !== index))
  }

  async function saveCriteria() {
    setCriteriaSaving(true)
    setCriteriaError('')
    setCriteriaSaved(false)
    try {
      const res = await fetch('/api/admin/criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria: criteria.map(c => ({ name: c.name, description: c.description })) })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save criteria.')
      setCriteria(json.criteria || [])
      setCriteriaSaved(true)
    } catch (e) {
      setCriteriaError(e.message)
    } finally {
      setCriteriaSaving(false)
    }
  }

  async function resetCriteria() {
    setCriteriaSaving(true)
    setCriteriaError('')
    setCriteriaSaved(false)
    try {
      const res = await fetch('/api/admin/criteria', { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to reset criteria.')
      setCriteria(json.criteria || [])
      setCriteriaSaved(true)
    } catch (e) {
      setCriteriaError(e.message)
    } finally {
      setCriteriaSaving(false)
    }
  }

  async function handleRoleChange(rep) {
    const newRole = rep.role === 'manager' ? 'rep' : 'manager'
    setPendingEmail(rep.userEmail)
    setRowErrors(prev => ({ ...prev, [rep.userEmail]: '' }))
    try {
      const res = await fetch('/api/admin/reps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: rep.userEmail, newRole })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update role.')
      // Only ever mutate local state from the server's confirmed response — never
      // optimistically, so a failed request can never leave the displayed role out
      // of sync with what's actually stored.
      setAdminReps(prev => prev.map(r => r.userEmail === rep.userEmail ? { ...r, role: json.role } : r))
    } catch (e) {
      setRowErrors(prev => ({ ...prev, [rep.userEmail]: e.message }))
    } finally {
      setPendingEmail(null)
    }
  }

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

        {/* SECTION 1 — Metric tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'QUALIFIED REPS', value: data?.qualifiedReps ?? 0 },
            { label: 'TEAM AVG SCORE', value: data?.avgScore ?? '—' },
            { label: 'TOTAL SESSIONS', value: data?.totalSessions ?? 0 },
            { label: 'ELITE REPS', value: data?.eliteReps ?? 0 },
          ].map((m) => (
            <div key={m.label} style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: '20px 24px' }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginBottom: 10 }}>{m.label}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#00c8e0' }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* SECTION 2 — Team skill matrix */}
        <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>TEAM SKILL MATRIX</div>
          {!data?.dimensionAverages ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No dimension data yet — this is tracked on sessions run since dimensions scoring was added.</p>
          ) : (
            <>
              {(data.criteria || []).map((c) => {
                const value = data.dimensionAverages[c.key]
                const isWeakest = c.key === data.weakestDimension
                return (
                  <div key={c.key} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: isWeakest ? '#e84545' : 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>{c.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: isWeakest ? '#e84545' : '#fff' }}>{value ?? '—'}</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${value ?? 0}%`, height: '100%', background: isWeakest ? '#e84545' : '#00c8e0' }} />
                    </div>
                  </div>
                )
              })}
              {data.weakestDimension && (
                <p style={{ marginTop: 16, fontSize: 12, color: '#e84545' }}>
                  Weakest skill: {data.criteria?.find(c => c.key === data.weakestDimension)?.name || data.weakestDimension}. Focus coaching here.
                </p>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

          {/* SECTION 3 — Rep leaderboard */}
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>REP LEADERBOARD</div>
            {!data?.reps?.length ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No sessions yet. Reps appear here after completing a simulation.</p>
            ) : data.reps.map((rep, i) => {
              const msSinceLastSession = rep.lastSession ? Date.now() - new Date(rep.lastSession).getTime() : null
              const isInactive = msSinceLastSession != null && msSinceLastSession > INACTIVITY_THRESHOLD_DAYS * 86400000
              const inactiveDays = rep.lastSession ? daysSince(rep.lastSession) : null
              return (
              <div key={rep.userEmail} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', width: 16 }}>{i + 1}</span>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,200,224,0.1)', border: '1px solid rgba(0,200,224,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#00c8e0', flexShrink: 0 }}>
                  {rep.userEmail[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rep.userEmail}</span>
                    {isInactive && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#f5a623', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        ⚠️ Inactive {inactiveDays}d
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {rep.sessions} session{rep.sessions !== 1 ? 's' : ''}
                    {rep.bestHostility != null ? ` · ${rep.bestHostility}% best hostility` : ''}
                  </div>
                  {rep.bestQualificationStatus && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: getQualificationColor(rep.bestQualificationStatus) }}>
                      {rep.bestQualificationStatus.toUpperCase()}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 14, fontWeight: 900, width: 32, textAlign: 'right', color: getScoreColor(rep.bestScore) }}>{rep.bestScore}</span>
              </div>
              )
            })}
          </div>

          {/* SECTION 4 — Recent sessions (unchanged) */}
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

        {/* SECTION 5 — Team management (manager-only, self-serve promote/demote) */}
        {isManager && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>TEAM MANAGEMENT</div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
              Only reps with at least one completed session appear here.
            </p>
            {adminLoading ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading team…</p>
            ) : adminError ? (
              <p style={{ color: '#e84545', fontSize: 13 }}>{adminError}</p>
            ) : !adminReps.length ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No reps yet. They'll appear here after completing a simulation.</p>
            ) : adminReps.map((rep, i) => {
              // rep.userEmail can be '' — POST /api/sessions is unauthenticated and
              // stores body.userEmail as-is (Known Issue 5a in REPREADY_CONTEXT.md,
              // out of scope here), so a crafted session can produce an empty-email
              // row. Guard the display rather than assume a real address.
              const displayEmail = rep.userEmail || '(unknown)'
              const isSelf = !!rep.userEmail && rep.userEmail.toLowerCase() === selfEmail
              const isUnresolved = rep.role == null
              const isPending = pendingEmail === rep.userEmail
              const roleLabel = isUnresolved ? 'UNRESOLVED' : rep.role.toUpperCase()
              const roleColor = isUnresolved ? '#f5a623' : rep.role === 'manager' ? '#00c8e0' : 'rgba(255,255,255,0.4)'
              return (
                <div key={rep.userEmail || `unknown-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,200,224,0.1)', border: '1px solid rgba(0,200,224,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#00c8e0', flexShrink: 0 }}>
                    {displayEmail[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                      {rep.sessions} session{rep.sessions !== 1 ? 's' : ''}
                    </div>
                    {rowErrors[rep.userEmail] && (
                      <div style={{ fontSize: 10, color: '#e84545', marginTop: 2 }}>{rowErrors[rep.userEmail]}</div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: roleColor, width: 70, textAlign: 'right' }}>
                    {roleLabel}
                  </span>
                  {isSelf ? (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', width: 110, textAlign: 'right' }}>THIS IS YOU</span>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(rep)}
                      disabled={isUnresolved || isPending}
                      style={{
                        width: 110,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        fontFamily: 'monospace',
                        background: 'transparent',
                        border: `1px solid ${rep.role === 'manager' ? 'rgba(245,166,35,0.4)' : 'rgba(0,200,224,0.4)'}`,
                        color: isUnresolved || isPending ? 'rgba(255,255,255,0.2)' : rep.role === 'manager' ? '#f5a623' : '#00c8e0',
                        padding: '6px 8px',
                        cursor: isUnresolved || isPending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isPending ? 'UPDATING…' : rep.role === 'manager' ? 'DEMOTE TO REP' : 'MAKE MANAGER'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* SECTION 6 — Scoring criteria (manager-only, same role-gate pattern as Team Management) */}
        {isManager && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>SCORING CRITERIA</div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              These are the skill dimensions reps are scored on. All criteria are weighted equally.
            </p>
            <p style={{ fontSize: 11, color: '#f5a623', marginBottom: 20 }}>
              Renaming a criterion does not retroactively relabel past sessions scored under the old name — historical sessions keep showing the dimension name they were scored with.
            </p>
            {criteriaLoading ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading criteria…</p>
            ) : (
              <>
                {criteriaError && <p style={{ color: '#e84545', fontSize: 12, marginBottom: 12 }}>{criteriaError}</p>}
                {criteria.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 12 }}>
                    <input
                      value={c.name}
                      onChange={(e) => updateCriterionField(i, 'name', e.target.value)}
                      placeholder="Name (e.g. Discovery Quality)"
                      style={{
                        flex: '0 0 200px', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px'
                      }}
                    />
                    <input
                      value={c.description}
                      onChange={(e) => updateCriterionField(i, 'description', e.target.value)}
                      placeholder="Description / rubric for the AI grader"
                      style={{
                        flex: 1, background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px'
                      }}
                    />
                    <button
                      onClick={() => removeCriterion(i)}
                      disabled={criteria.length <= 1}
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace',
                        background: 'transparent', border: '1px solid rgba(232,69,69,0.4)',
                        color: criteria.length <= 1 ? 'rgba(255,255,255,0.2)' : '#e84545',
                        padding: '8px 10px', cursor: criteria.length <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      REMOVE
                    </button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                  <button
                    onClick={addCriterion}
                    disabled={criteria.length >= 10}
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace',
                      background: 'transparent', border: '1px solid rgba(0,200,224,0.4)',
                      color: criteria.length >= 10 ? 'rgba(255,255,255,0.2)' : '#00c8e0',
                      padding: '8px 14px', cursor: criteria.length >= 10 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    + ADD CRITERION
                  </button>
                  <button
                    onClick={saveCriteria}
                    disabled={criteriaSaving}
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace',
                      background: '#00c8e0', border: '1px solid #00c8e0', color: '#0a0d14',
                      padding: '8px 14px', cursor: criteriaSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {criteriaSaving ? 'SAVING…' : 'SAVE'}
                  </button>
                  <button
                    onClick={resetCriteria}
                    disabled={criteriaSaving}
                    style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)',
                      padding: '8px 14px', cursor: criteriaSaving ? 'not-allowed' : 'pointer'
                    }}
                  >
                    RESET TO DEFAULTS
                  </button>
                  {criteriaSaved && !criteriaSaving && (
                    <span style={{ fontSize: 11, color: '#00c8e0', alignSelf: 'center' }}>Saved.</span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ border: '1px solid rgba(0,200,224,0.1)', padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          SESSION DATA · MONGODB ATLAS MUMBAI · NEVER USED TO TRAIN AI · DPDP ACT 2023 COMPLIANT · DELETE: privacy@repready.site
        </div>

      </div>
    </div>
  )
}
