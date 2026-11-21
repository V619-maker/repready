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

  // Product documents (private to this workspace; see /api/product-docs).
  // The server decides who may manage them (manager, or the sole owner of a
  // personal free-email workspace) and returns canManage - the client only
  // uses that to decide whether to render the section.
  const [docsMeta, setDocsMeta] = useState(null)
  const [docsLoading, setDocsLoading] = useState(true)
  const [docsError, setDocsError] = useState('')
  const [docName, setDocName] = useState('')
  const [docText, setDocText] = useState('')
  const [docSaving, setDocSaving] = useState(false)
  const [docDeletingId, setDocDeletingId] = useState(null)

  function loadProductDocs() {
    return fetch('/api/product-docs')
      .then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || 'Failed to load product documents.')
        setDocsMeta(json)
        setDocsLoading(false)
      })
      .catch(e => { setDocsError(e.message); setDocsLoading(false) })
  }

  useEffect(() => {
    if (!isLoaded || !user) { setDocsLoading(false); return }
    loadProductDocs()
  }, [isLoaded, user])

  function handleDocFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setDocsError('')
    if (!/\.(txt|md|markdown|csv)$/i.test(file.name) && !(file.type || '').startsWith('text/')) {
      setDocsError('Only plain-text files (.txt, .md, .csv) for now. For a PDF or Word file, copy the text and paste it below.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setDocText(String(reader.result || ''))
      if (!docName) setDocName(file.name.replace(/\.[^.]+$/, ''))
    }
    reader.onerror = () => setDocsError('Could not read that file.')
    reader.readAsText(file)
    e.target.value = ''
  }

  async function saveProductDoc() {
    setDocSaving(true)
    setDocsError('')
    try {
      const res = await fetch('/api/product-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: docName, text: docText })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save document.')
      setDocName('')
      setDocText('')
      await loadProductDocs()
    } catch (e) {
      setDocsError(e.message)
    } finally {
      setDocSaving(false)
    }
  }

  const [switchSaving, setSwitchSaving] = useState(false)

  async function setUseInCalls(enabled) {
    setSwitchSaving(true)
    setDocsError('')
    try {
      const res = await fetch('/api/product-docs/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save the setting.')
      await loadProductDocs()
    } catch (e) {
      setDocsError(e.message)
    } finally {
      setSwitchSaving(false)
    }
  }

  // Integrations (Slack / Teams / webhook). Addresses are secrets: the server only
  // ever returns them masked, and the signing secret exactly once.
  const [integ, setInteg] = useState(null)
  const [integInputs, setIntegInputs] = useState({ slack: '', teams: '', webhook: '' })
  const [integBusy, setIntegBusy] = useState('')
  const [integMsg, setIntegMsg] = useState({})
  const [newSecret, setNewSecret] = useState('')

  useEffect(() => {
    if (!docsMeta?.canManage) return
    fetch('/api/admin/integrations')
      .then(async r => { const j = await r.json(); if (r.ok) setInteg(j.configured) })
      .catch(() => {})
  }, [docsMeta?.canManage])

  async function saveIntegration(kind, url) {
    setIntegBusy(kind)
    setIntegMsg(m => ({ ...m, [kind]: '' }))
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, url })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save.')
      setInteg(json.configured)
      setIntegInputs(v => ({ ...v, [kind]: '' }))
      if (json.newSecret) setNewSecret(json.newSecret)
      setIntegMsg(m => ({ ...m, [kind]: url ? 'Saved.' : 'Removed.' }))
    } catch (e) {
      setIntegMsg(m => ({ ...m, [kind]: e.message }))
    } finally {
      setIntegBusy('')
    }
  }

  async function testIntegration(kind) {
    setIntegBusy(kind)
    setIntegMsg(m => ({ ...m, [kind]: '' }))
    try {
      const res = await fetch('/api/admin/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind })
      })
      const json = await res.json()
      setIntegMsg(m => ({ ...m, [kind]: json.detail || json.error || 'Failed.' }))
    } catch (e) {
      setIntegMsg(m => ({ ...m, [kind]: 'Failed.' }))
    } finally {
      setIntegBusy('')
    }
  }

  // CRM link (HubSpot / Salesforce / Zoho). Credentials are secrets: the server returns a masked label only.
  const CRM_FORMS = {
    hubspot: {
      fields: [{ key: 'token', label: 'Private app access token (starts with pat-)', secret: true }],
      help: 'In HubSpot, a super admin creates a private app (Development, then Legacy apps, then Create legacy app, then Private) and copies its access token. ' +
        'Scopes: crm.objects.deals.read and crm.objects.owners.read. Optional: crm.schemas.deals.read (stage names). For writing notes back, also crm.objects.deals.write and crm.objects.contacts.write.',
    },
    salesforce: {
      fields: [
        { key: 'domain', label: 'My Domain address, like https://yourcompany.my.salesforce.com' },
        { key: 'clientId', label: 'Consumer Key', secret: true },
        { key: 'clientSecret', label: 'Consumer Secret', secret: true },
      ],
      help: 'In Salesforce Setup, a system admin creates an External Client App (or Connected App), turns on the Client Credentials flow, and picks a "Run As" user. ' +
        'Give the app the "api" scope and make sure the Run As user can read Opportunities and create Tasks. Paste your My Domain address and the app\'s Consumer Key and Secret here. ' +
        'Important: Salesforce lets this app see whatever the Run As user can see, so Salesforce itself will not limit it to one rep. RepReady shows each rep only the Opportunities where the owner\'s email matches their own sign-in email.',
    },
    zoho: {
      fields: [
        { key: 'dc', label: 'Zoho data centre', type: 'select', options: [['com', 'zoho.com (US)'], ['in', 'zoho.in (India)'], ['eu', 'zoho.eu (Europe)'], ['com.au', 'zoho.com.au (Australia)'], ['jp', 'zoho.jp (Japan)']] },
        { key: 'clientId', label: 'Client ID', secret: true },
        { key: 'clientSecret', label: 'Client Secret', secret: true },
        { key: 'orgId', label: 'Zoho CRM organisation ID (digits)' },
      ],
      help: 'In the Zoho API Console (use the console for your data centre), create a Self Client (server-based client). Allow these scopes: ZohoCRM.modules.deals.READ, ZohoCRM.users.READ and ZohoCRM.modules.notes.CREATE. ' +
        'Paste its Client ID and Secret, and your CRM organisation ID. Zoho\'s access is account-wide, so RepReady shows each rep only the deals owned by the user whose email matches their own sign-in email.',
    },
  }
  const [crm, setCrm] = useState(null)
  const [crmProvider, setCrmProvider] = useState('hubspot')
  const [crmForm, setCrmForm] = useState({})
  const [crmBusy, setCrmBusy] = useState(false)
  const [crmMsg, setCrmMsg] = useState('')

  useEffect(() => {
    if (!docsMeta?.canManage) return
    fetch('/api/admin/crm')
      .then(async r => { const j = await r.json(); if (r.ok) setCrm(j) })
      .catch(() => {})
  }, [docsMeta?.canManage])

  async function crmCall(url, method, body, okMsg) {
    setCrmBusy(true)
    setCrmMsg('')
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Request failed.')
      setCrm(json)
      if (okMsg) setCrmMsg(okMsg)
      return true
    } catch (e) {
      setCrmMsg(e.message)
      return false
    } finally {
      setCrmBusy(false)
    }
  }

  // Gong import (keys are secrets: the server returns a masked label only).
  const [gong, setGong] = useState(null)
  const [gongForm, setGongForm] = useState({ baseUrl: '', accessKey: '', accessSecret: '' })
  const [gongBusy, setGongBusy] = useState(false)
  const [gongMsg, setGongMsg] = useState('')

  useEffect(() => {
    if (!docsMeta?.canManage) return
    fetch('/api/admin/gong')
      .then(async r => { const j = await r.json(); if (r.ok) setGong(j) })
      .catch(() => {})
  }, [docsMeta?.canManage])

  async function gongCall(url, method, body, okMsg) {
    setGongBusy(true)
    setGongMsg('')
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Request failed.')
      setGong(json)
      if (okMsg) setGongMsg(okMsg)
      return true
    } catch (e) {
      setGongMsg(e.message)
      return false
    } finally {
      setGongBusy(false)
    }
  }

  // Assigned practice (manager only; the server re-checks the role).
  const [asg, setAsg] = useState(null)
  const [asgForm, setAsgForm] = useState({ title: '', persona: 'richard', focus: '', dueDate: '', minScore: '', assignees: '', note: '' })
  const [asgBusy, setAsgBusy] = useState(false)
  const [asgMsg, setAsgMsg] = useState('')
  const [asgOpen, setAsgOpen] = useState('')

  async function loadAssignments() {
    try {
      const r = await fetch('/api/admin/assignments')
      const j = await r.json()
      if (r.ok) { setAsg(j); setAsgMsg('') } else { setAsg({ assignments: [] }); setAsgMsg(j.error || '') }
    } catch (e) { /* leave as is */ }
  }
  useEffect(() => {
    if (!isLoaded || !user || !isManager) return
    loadAssignments()
  }, [isLoaded, user, isManager])

  async function createAssignment() {
    setAsgBusy(true); setAsgMsg('')
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asgForm)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed.')
      setAsgForm({ title: '', persona: asgForm.persona, focus: '', dueDate: '', minScore: '', assignees: '', note: '' })
      setAsgMsg('Assigned. Reps will see it on the call-selection screen.')
      await loadAssignments()
    } catch (e) { setAsgMsg(e.message) } finally { setAsgBusy(false) }
  }
  async function deleteAssignment(id) {
    setAsgBusy(true); setAsgMsg('')
    try {
      const res = await fetch(`/api/admin/assignments?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed.')
      await loadAssignments()
    } catch (e) { setAsgMsg(e.message) } finally { setAsgBusy(false) }
  }

  // Custom buyer scenarios (manager / personal-workspace owner; the server re-checks).
  const [scn, setScn] = useState(null)
  const [scnForm, setScnForm] = useState({ name: '', buyerRole: '', company: '', situation: '', personality: 'skeptical', difficulty: '3', objections: '', hiddenMotivation: '' })
  const [scnBusy, setScnBusy] = useState(false)
  const [scnMsg, setScnMsg] = useState('')

  async function loadScenarios() {
    try {
      const r = await fetch('/api/scenarios')
      const j = await r.json()
      if (r.ok) setScn(j)
    } catch (e) { /* leave as is */ }
  }
  useEffect(() => {
    if (!docsMeta?.canManage) return
    loadScenarios()
  }, [docsMeta?.canManage])

  async function createScenario() {
    setScnBusy(true); setScnMsg('')
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scnForm)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed.')
      setScnForm({ name: '', buyerRole: '', company: '', situation: '', personality: 'skeptical', difficulty: '3', objections: '', hiddenMotivation: '' })
      setScnMsg('Saved.')
      await loadScenarios()
    } catch (e) { setScnMsg(e.message) } finally { setScnBusy(false) }
  }
  async function deleteScenario(id) {
    setScnBusy(true); setScnMsg('')
    try {
      const res = await fetch(`/api/scenarios?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed.')
      await loadScenarios()
    } catch (e) { setScnMsg(e.message) } finally { setScnBusy(false) }
  }

  async function deleteProductDoc(id) {
    setDocDeletingId(id)
    setDocsError('')
    try {
      const res = await fetch(`/api/product-docs?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete document.')
      await loadProductDocs()
    } catch (e) {
      setDocsError(e.message)
    } finally {
      setDocDeletingId(null)
    }
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
              These are the skill dimensions reps are scored on. All criteria are weighted equally.{orgId ? ` They apply to everyone who signs in with an @${orgId} email, and to no one else.` : ''}
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

        {/* SECTION 7 - Product documents (shown only when the server says this user can manage them) */}
        {docsMeta?.canManage && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>PRODUCT DOCUMENTS</div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              Product sheets, pricing guides and FAQs for your team's products. Stored in {docsMeta.workspaceLabel} only
              {docsMeta.workspaceKind === 'company' ? ` (everyone signed in with an @${docsMeta.workspaceLabel} email belongs to it; only managers can add or delete).` : '.'}
              {' '}You can delete a document at any time and it is removed from our database.
            </p>
            <div style={{ border: '1px solid rgba(245,166,35,0.35)', padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#f5a623', marginBottom: 8 }}>
                USE IN PRACTICE CALLS: {docsMeta.useInPracticeCalls ? 'ON' : 'OFF'}
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
                When this is on, the AI buyer in practice calls knows your products and asks about them. To do that, the text of your documents
                (newest first, up to about 12,000 characters) is sent to ElevenLabs, our voice provider, at the start of each call. ElevenLabs
                processes it outside India. Everyone in your workspace who practises receives it in their browser during the call. It is not
                sent to the scoring AI. Turning this off stops all future sending. Deleting a document removes it from our database;
                copies already sent during calls follow ElevenLabs' retention, and we delete call records after 90 days.
              </p>
              <button
                onClick={() => setUseInCalls(!docsMeta.useInPracticeCalls)}
                disabled={switchSaving || (!docsMeta.useInPracticeCalls && docsMeta.docs.length === 0)}
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace',
                  background: docsMeta.useInPracticeCalls ? 'transparent' : '#f5a623',
                  border: '1px solid #f5a623',
                  color: docsMeta.useInPracticeCalls ? '#f5a623' : '#0a0d14',
                  padding: '8px 14px', cursor: switchSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {switchSaving ? 'SAVING…' : docsMeta.useInPracticeCalls ? 'TURN OFF' : 'I UNDERSTAND, TURN ON'}
              </button>
              {!docsMeta.useInPracticeCalls && docsMeta.docs.length === 0 && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 12 }}>Add a document first.</span>
              )}
            </div>
            {docsError && <p style={{ color: '#e84545', fontSize: 12, marginBottom: 12 }}>{docsError}</p>}
            {docsMeta.docs.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 16 }}>No documents yet.</p>
            ) : (
              <div style={{ marginBottom: 16 }}>
                {docsMeta.docs.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ flex: 1, fontSize: 12, color: '#fff' }}>{d.name}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{d.chars.toLocaleString()} characters</span>
                    <button
                      onClick={() => deleteProductDoc(d.id)}
                      disabled={docDeletingId === d.id}
                      style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace',
                        background: 'transparent', border: '1px solid rgba(232,69,69,0.4)', color: '#e84545',
                        padding: '6px 10px', cursor: docDeletingId === d.id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {docDeletingId === d.id ? 'DELETING…' : 'DELETE'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="Document name (e.g. Product A pricing guide)"
              style={{
                width: '100%', boxSizing: 'border-box', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px', marginBottom: 8
              }}
            />
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste the document text here, or choose a .txt / .md file below"
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px', marginBottom: 8
              }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" accept=".txt,.md,.markdown,.csv,text/*" onChange={handleDocFile} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
              <button
                onClick={saveProductDoc}
                disabled={docSaving || docsMeta.docs.length >= docsMeta.limits.maxDocs}
                style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace',
                  background: '#00c8e0', border: '1px solid #00c8e0', color: '#0a0d14',
                  padding: '8px 14px', cursor: docSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {docSaving ? 'SAVING…' : 'SAVE DOCUMENT'}
              </button>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                Up to {docsMeta.limits.maxDocs} documents, {docsMeta.limits.maxCharsPerDoc.toLocaleString()} characters each.
              </span>
            </div>
          </div>
        )}

        {/* SECTION 8 - Integrations (same visibility rule as product documents) */}
        {docsMeta?.canManage && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>INTEGRATIONS</div>
            <p style={{ fontSize: 11, color: '#f5a623', lineHeight: 1.6, marginBottom: 16 }}>
              When a rep finishes a practice call, RepReady sends one message to each address you add below: the rep's email, the buyer,
              the score, grade and status, and a one-sentence verdict. It never sends the transcript or any recording. Anyone who can read that
              Slack channel or receive that webhook will see it. Remove an address to stop sending.
            </p>
            {[
              { kind: 'slack', label: 'SLACK', hint: 'Slack incoming webhook address (https://hooks.slack.com/...)' },
              { kind: 'teams', label: 'MICROSOFT TEAMS', hint: 'Teams Workflows (Power Automate) webhook address' },
              { kind: 'webhook', label: 'GENERIC WEBHOOK', hint: 'Any https address (for Zapier, n8n, your CRM or learning system)' },
            ].map(({ kind, label, hint }) => (
              <div key={kind} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
                  {label}{integ?.[kind] ? `  ·  connected (${integ[kind]})` : '  ·  not connected'}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    value={integInputs[kind]}
                    onChange={(e) => setIntegInputs(v => ({ ...v, [kind]: e.target.value }))}
                    placeholder={hint}
                    style={{ flex: 1, minWidth: 220, background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px' }}
                  />
                  <button
                    onClick={() => saveIntegration(kind, integInputs[kind])}
                    disabled={integBusy === kind || !integInputs[kind]}
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: '#00c8e0', border: '1px solid #00c8e0', color: '#0a0d14', padding: '8px 14px', cursor: integBusy === kind ? 'not-allowed' : 'pointer' }}
                  >
                    SAVE
                  </button>
                  {integ?.[kind] && (
                    <>
                      <button
                        onClick={() => testIntegration(kind)}
                        disabled={integBusy === kind}
                        style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: 'transparent', border: '1px solid rgba(0,200,224,0.4)', color: '#00c8e0', padding: '8px 14px', cursor: 'pointer' }}
                      >
                        SEND TEST
                      </button>
                      <button
                        onClick={() => saveIntegration(kind, null)}
                        disabled={integBusy === kind}
                        style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: 'transparent', border: '1px solid rgba(232,69,69,0.4)', color: '#e84545', padding: '8px 14px', cursor: 'pointer' }}
                      >
                        REMOVE
                      </button>
                    </>
                  )}
                </div>
                {integMsg[kind] && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>{integMsg[kind]}</p>}
              </div>
            ))}
            {newSecret && (
              <div style={{ border: '1px solid rgba(245,166,35,0.35)', padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#f5a623', marginBottom: 6 }}>
                  Webhook signing secret. Copy it now: it is shown only once. Your system can use it to check that a message really came from RepReady (header X-RepReady-Signature).
                </p>
                <code style={{ fontSize: 12, color: '#fff', wordBreak: 'break-all' }}>{newSecret}</code>
              </div>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>EXPORT SCORES</div>
              <a
                href="/api/admin/export-sessions"
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', border: '1px solid rgba(0,200,224,0.4)', color: '#00c8e0', padding: '8px 14px', textDecoration: 'none', display: 'inline-block' }}
              >
                DOWNLOAD CSV
              </a>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 12 }}>One row per practice call, up to 5,000. Opens in Excel or Google Sheets.</span>
            </div>
          </div>
        )}

        {/* SECTION 9 - CRM link: HubSpot, Salesforce or Zoho (same visibility rule as the other settings) */}
        {docsMeta?.canManage && (() => {
          const label = crm?.providerLabel || 'your CRM'
          const form = CRM_FORMS[crmProvider]
          const inputStyle = { flex: 1, minWidth: 220, background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px' }
          const toggleBtn = (on) => ({ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: on ? 'transparent' : '#f5a623', border: '1px solid #f5a623', color: on ? '#f5a623' : '#0a0d14', padding: '8px 14px', cursor: crmBusy ? 'not-allowed' : 'pointer' })
          const ready = form.fields.every(f => f.type === 'select' ? true : (crmForm[f.key] || '').trim())
          return (
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              CRM {crm?.connected ? `· ${crm.providerLabel.toUpperCase()} CONNECTED (${crm.credentials})` : '· NOT CONNECTED'}
            </div>
            {!crm?.connected ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {(crm?.providers || [{ id: 'hubspot', label: 'HubSpot' }, { id: 'salesforce', label: 'Salesforce' }, { id: 'zoho', label: 'Zoho CRM' }]).map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setCrmProvider(p.id); setCrmForm({}); setCrmMsg('') }}
                      style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: crmProvider === p.id ? '#00c8e0' : 'transparent', border: '1px solid #00c8e0', color: crmProvider === p.id ? '#0a0d14' : '#00c8e0', padding: '6px 12px', cursor: 'pointer' }}
                    >
                      {p.label.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 12 }}>
                  {form.help} If a step fails with a permission message, add the permission it names. Credentials are stored privately on our server and are never shown again.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {form.fields.map(f => f.type === 'select' ? (
                    <select
                      key={f.key}
                      value={crmForm[f.key] || f.options[0][0]}
                      onChange={(e) => setCrmForm(v => ({ ...v, [f.key]: e.target.value }))}
                      style={inputStyle}
                    >
                      {f.options.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
                    </select>
                  ) : (
                    <input
                      key={f.key}
                      type={f.secret ? 'password' : 'text'}
                      autoComplete="off"
                      value={crmForm[f.key] || ''}
                      onChange={(e) => setCrmForm(v => ({ ...v, [f.key]: e.target.value }))}
                      placeholder={f.label}
                      style={inputStyle}
                    />
                  ))}
                  <button
                    onClick={async () => {
                      const payload = { provider: crmProvider }
                      for (const f of form.fields) payload[f.key] = f.type === 'select' ? (crmForm[f.key] || f.options[0][0]) : (crmForm[f.key] || '').trim()
                      if (await crmCall('/api/admin/crm', 'POST', payload, 'Connected.')) setCrmForm({})
                    }}
                    disabled={crmBusy || !ready}
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: '#00c8e0', border: '1px solid #00c8e0', color: '#0a0d14', padding: '8px 14px', cursor: crmBusy ? 'not-allowed' : 'pointer' }}
                  >
                    {crmBusy ? 'CHECKING…' : 'CONNECT'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ border: '1px solid rgba(245,166,35,0.35)', padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#f5a623', marginBottom: 8 }}>
                    REHEARSE REAL DEALS: {crm.useDealContext ? 'ON' : 'OFF'}
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
                    When on, a rep can pick one of their own open {label} deals (matched by their sign-in email) before a practice call. The deal name, company (where {label} has one), value,
                    stage, expected close date and deal notes (up to about 1,000 characters) are sent to ElevenLabs, our voice provider, at the start of that call,
                    so the AI buyer can play that deal. ElevenLabs processes it outside India. Reps only see deals whose owner email matches their own. Nothing is sent unless the rep picks a deal.
                  </p>
                  <button onClick={() => crmCall('/api/admin/crm/settings', 'POST', { useDealContext: !crm.useDealContext })} disabled={crmBusy} style={toggleBtn(crm.useDealContext)}>
                    {crm.useDealContext ? 'TURN OFF' : 'I UNDERSTAND, TURN ON'}
                  </button>
                </div>
                <div style={{ border: '1px solid rgba(245,166,35,0.35)', padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#f5a623', marginBottom: 8 }}>
                    WRITE RESULTS TO THE DEAL: {crm.writeback ? 'ON' : 'OFF'}
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
                    When on, after a rep rehearses a deal, RepReady adds one {crm.provider === 'salesforce' ? 'completed activity (Task)' : 'note'} to that deal in {label}: the buyer, score, grade, status, the one-sentence verdict
                    and skill scores. Anyone who can see that deal in {label} can read it. It never includes the transcript.
                  </p>
                  <button onClick={() => crmCall('/api/admin/crm/settings', 'POST', { writeback: !crm.writeback })} disabled={crmBusy} style={toggleBtn(crm.writeback)}>
                    {crm.writeback ? 'TURN OFF' : 'I UNDERSTAND, TURN ON'}
                  </button>
                </div>
                <button
                  onClick={() => crmCall('/api/admin/crm', 'DELETE', null, 'Disconnected. The credentials were deleted from our server.')}
                  disabled={crmBusy}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: 'transparent', border: '1px solid rgba(232,69,69,0.4)', color: '#e84545', padding: '8px 14px', cursor: crmBusy ? 'not-allowed' : 'pointer' }}
                >
                  DISCONNECT {label.toUpperCase()}
                </button>
              </>
            )}
            {crmMsg && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>{crmMsg}</p>}
          </div>
          )
        })()}

        {/* SECTION 10 - Gong import (same visibility rule as the other settings) */}
        {docsMeta?.canManage && (() => {
          const inputStyle = { flex: 1, minWidth: 220, background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px' }
          return (
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>
              GONG {gong?.connected ? `· CONNECTED (${gong.credentials})` : '· NOT CONNECTED'}
            </div>
            {!gong?.connected ? (
              <>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 12 }}>
                  In Gong, a technical administrator opens Settings, then Ecosystem, then API, and creates an Access Key and Secret with these permissions: read calls (basic and extensive), read transcripts and read users.
                  Paste them here. Leave the address blank unless Gong gave you a company-specific one (like https://company-17.api.gong.io).
                  Gong keys can see every call in your account, so RepReady shows each rep only calls they hosted or took part in, matched by their sign-in email.
                  The keys are stored privately on our server and never shown again.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input type="text" autoComplete="off" value={gongForm.baseUrl} onChange={(e) => setGongForm(v => ({ ...v, baseUrl: e.target.value }))} placeholder="API address (optional)" style={inputStyle} />
                  <input type="password" autoComplete="off" value={gongForm.accessKey} onChange={(e) => setGongForm(v => ({ ...v, accessKey: e.target.value }))} placeholder="Access Key" style={inputStyle} />
                  <input type="password" autoComplete="off" value={gongForm.accessSecret} onChange={(e) => setGongForm(v => ({ ...v, accessSecret: e.target.value }))} placeholder="Access Key Secret" style={inputStyle} />
                  <button
                    onClick={async () => { if (await gongCall('/api/admin/gong', 'POST', gongForm, 'Connected.')) setGongForm({ baseUrl: '', accessKey: '', accessSecret: '' }) }}
                    disabled={gongBusy || !gongForm.accessKey.trim() || !gongForm.accessSecret.trim()}
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: '#00c8e0', border: '1px solid #00c8e0', color: '#0a0d14', padding: '8px 14px', cursor: gongBusy ? 'not-allowed' : 'pointer' }}
                  >
                    {gongBusy ? 'CHECKING…' : 'CONNECT'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ border: '1px solid rgba(245,166,35,0.35)', padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#f5a623', marginBottom: 8 }}>
                    LET REPS IMPORT THEIR GONG CALLS: {gong.enabled ? 'ON' : 'OFF'}
                  </div>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
                    When on, a rep can pick one of their own recent Gong calls (last 30 days, up to 20) on the Real Calls page. RepReady then copies that call&apos;s transcript, which includes your customer&apos;s words,
                    into RepReady (MongoDB Atlas, Mumbai) and sends it to Google&apos;s Gemini to be scored. Only the calls a rep chooses are copied. Calls over about 30,000 characters or with more than two speakers are not supported yet.
                    Turn this on only if the people on those calls know calls are recorded and analysed.
                  </p>
                  <button
                    onClick={() => gongCall('/api/admin/gong/settings', 'POST', { enabled: !gong.enabled })}
                    disabled={gongBusy}
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: gong.enabled ? 'transparent' : '#f5a623', border: '1px solid #f5a623', color: gong.enabled ? '#f5a623' : '#0a0d14', padding: '8px 14px', cursor: gongBusy ? 'not-allowed' : 'pointer' }}
                  >
                    {gong.enabled ? 'TURN OFF' : 'I UNDERSTAND, TURN ON'}
                  </button>
                </div>
                <button
                  onClick={() => gongCall('/api/admin/gong', 'DELETE', null, 'Disconnected. The keys were deleted from our server.')}
                  disabled={gongBusy}
                  style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: 'transparent', border: '1px solid rgba(232,69,69,0.4)', color: '#e84545', padding: '8px 14px', cursor: gongBusy ? 'not-allowed' : 'pointer' }}
                >
                  DISCONNECT GONG
                </button>
              </>
            )}
            {gongMsg && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>{gongMsg}</p>}
          </div>
          )
        })()}

        {/* SECTION 11 - Assigned practice (manager-only) */}
        {isManager && (() => {
          const inputStyle = { background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px', minWidth: 140 }
          const STATUS = { done: ['DONE', '#3ecf8e'], done_late: ['DONE LATE', '#f5a623'], attempted: ['TRIED, BELOW TARGET', '#f5a623'], overdue: ['OVERDUE', '#e84545'], pending: ['NOT STARTED', 'rgba(255,255,255,0.4)'] }
          const NAMES = { richard: 'Richard Vance', sandra: 'Sandra Chen', priya: 'Priya Malhotra', rakesh: 'Rakesh Iyer' }
          return (
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>ASSIGNED PRACTICE</div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 12 }}>
              Ask your reps to practise a specific buyer by a date. A rep counts as done when they finish a call with that buyer after you create the assignment
              (and score at least the minimum, if you set one). Leave the email box empty to assign everyone who has practised before; list emails to include people who have not started yet.
              Due dates end at midnight India time.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <input style={{ ...inputStyle, flex: 1, minWidth: 220 }} placeholder="Title, e.g. Hold your price against procurement" value={asgForm.title} onChange={e => setAsgForm(f => ({ ...f, title: e.target.value }))} />
              <select style={inputStyle} value={asgForm.persona} onChange={e => setAsgForm(f => ({ ...f, persona: e.target.value }))}>
                {Object.entries(NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select style={inputStyle} value={asgForm.focus} onChange={e => setAsgForm(f => ({ ...f, focus: e.target.value }))}>
                <option value="">Focus skill (optional)</option>
                {criteria.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <input style={inputStyle} type="date" value={asgForm.dueDate} onChange={e => setAsgForm(f => ({ ...f, dueDate: e.target.value }))} />
              <input style={{ ...inputStyle, minWidth: 110, width: 110 }} type="number" min="1" max="100" placeholder="Min score" value={asgForm.minScore} onChange={e => setAsgForm(f => ({ ...f, minScore: e.target.value }))} />
            </div>
            <textarea style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 8 }} rows={2} placeholder="Emails of the reps to assign (optional, comma or line separated)" value={asgForm.assignees} onChange={e => setAsgForm(f => ({ ...f, assignees: e.target.value }))} />
            <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', marginBottom: 8 }} placeholder="Note to reps (optional)" value={asgForm.note} onChange={e => setAsgForm(f => ({ ...f, note: e.target.value }))} />
            <button
              onClick={createAssignment}
              disabled={asgBusy || !asgForm.title.trim()}
              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: '#00c8e0', border: '1px solid #00c8e0', color: '#0a0d14', padding: '8px 14px', cursor: asgBusy ? 'not-allowed' : 'pointer' }}
            >
              {asgBusy ? 'SAVING…' : 'ASSIGN'}
            </button>
            {asgMsg && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>{asgMsg}</p>}

            {(asg?.assignments || []).map(a => (
              <div key={a.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 16, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#fff' }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {NAMES[a.persona] || a.persona}{a.focus ? ` · focus: ${a.focus}` : ''}{a.dueDate ? ` · due ${a.dueDate}` : ''}{a.minScore ? ` · min score ${a.minScore}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#fff' }}>
                      {a.progress.completionPct == null ? 'No reps yet' : `${a.progress.done} of ${a.progress.total} done (${a.progress.completionPct}%)`}
                      {a.progress.overdue > 0 && <span style={{ color: '#e84545' }}> · {a.progress.overdue} overdue</span>}
                    </div>
                    <button onClick={() => setAsgOpen(asgOpen === a.id ? '' : a.id)} style={{ fontSize: 10, background: 'none', border: 'none', color: '#00c8e0', cursor: 'pointer', fontFamily: 'monospace', padding: 0, marginRight: 12 }}>
                      {asgOpen === a.id ? 'HIDE REPS' : 'SHOW REPS'}
                    </button>
                    <button onClick={() => deleteAssignment(a.id)} disabled={asgBusy} style={{ fontSize: 10, background: 'none', border: 'none', color: '#e84545', cursor: 'pointer', fontFamily: 'monospace', padding: 0 }}>DELETE</button>
                  </div>
                </div>
                {asgOpen === a.id && (
                  <div style={{ marginTop: 8 }}>
                    {a.progress.reps.length === 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Nobody to show yet: no rep in your company has practised, and no emails were listed.</div>}
                    {a.progress.reps.map(r => (
                      <div key={r.email} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', color: 'rgba(255,255,255,0.7)' }}>
                        <span>{r.email}</span>
                        <span style={{ color: (STATUS[r.status] || STATUS.pending)[1] }}>
                          {(STATUS[r.status] || STATUS.pending)[0]}{r.bestScore != null ? ` · best ${r.bestScore}` : ''}{r.attempts ? ` · ${r.attempts} call${r.attempts > 1 ? 's' : ''}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          )
        })()}

        {/* SECTION 12 - Custom buyer scenarios (same visibility rule as the other settings) */}
        {docsMeta?.canManage && (() => {
          const inputStyle = { background: '#0a0d14', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontFamily: 'monospace', padding: '8px 10px', width: '100%', boxSizing: 'border-box', marginBottom: 8 }
          const agentReady = !!process.env.NEXT_PUBLIC_CUSTOM_AGENT_ID
          return (
          <div style={{ background: '#0d1117', border: '1px solid rgba(0,200,224,0.15)', padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>YOUR COMPANY&apos;S BUYERS</div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 12 }}>
              Describe a buyer your reps meet in real life and they can practise against it. The text you write is shown to your own reps when they start the call and is sent to ElevenLabs, our voice provider (outside India), so the AI can play the buyer. It is not sent to the scoring model.
              Do not paste customer names or confidential figures you would not want in a voice provider&apos;s hands.
            </p>
            {!agentReady && (
              <p style={{ fontSize: 11, color: '#f5a623', lineHeight: 1.6, marginBottom: 12 }}>
                Reps will not see these buyers yet: the one-time &quot;Custom Buyer&quot; voice setup has not been done on this deployment.
              </p>
            )}
            <input style={inputStyle} placeholder="Scenario name, e.g. Procurement squeeze at renewal" value={scnForm.name} onChange={e => setScnForm(f => ({ ...f, name: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input style={{ ...inputStyle, flex: 1, minWidth: 180, width: 'auto' }} placeholder="Buyer's job title" value={scnForm.buyerRole} onChange={e => setScnForm(f => ({ ...f, buyerRole: e.target.value }))} />
              <input style={{ ...inputStyle, flex: 1, minWidth: 180, width: 'auto' }} placeholder="Company (optional), e.g. 800-person logistics firm" value={scnForm.company} onChange={e => setScnForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <textarea style={inputStyle} rows={3} placeholder="Situation: what the call is about, what the buyer wants and what they are comparing you with" value={scnForm.situation} onChange={e => setScnForm(f => ({ ...f, situation: e.target.value }))} />
            <textarea style={inputStyle} rows={3} placeholder="Objections, one per line (up to 5), e.g. Your price is 15% above the other quote" value={scnForm.objections} onChange={e => setScnForm(f => ({ ...f, objections: e.target.value }))} />
            <input style={inputStyle} placeholder="What the buyer really cares about but will not say unless the rep earns it (optional)" value={scnForm.hiddenMotivation} onChange={e => setScnForm(f => ({ ...f, hiddenMotivation: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <select style={{ ...inputStyle, width: 'auto', minWidth: 170 }} value={scnForm.personality} onChange={e => setScnForm(f => ({ ...f, personality: e.target.value }))}>
                {['skeptical', 'analytical', 'impatient', 'friendly but guarded'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select style={{ ...inputStyle, width: 'auto', minWidth: 150 }} value={scnForm.difficulty} onChange={e => setScnForm(f => ({ ...f, difficulty: e.target.value }))}>
                {[1, 2, 3, 4, 5].map(d => <option key={d} value={String(d)}>Difficulty {d} of 5</option>)}
              </select>
              <button
                onClick={createScenario}
                disabled={scnBusy || !scnForm.name.trim() || !scnForm.buyerRole.trim() || !scnForm.situation.trim()}
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'monospace', background: '#00c8e0', border: '1px solid #00c8e0', color: '#0a0d14', padding: '8px 14px', marginBottom: 8, cursor: scnBusy ? 'not-allowed' : 'pointer' }}
              >
                {scnBusy ? 'SAVING…' : 'SAVE BUYER'}
              </button>
            </div>
            {scnMsg && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{scnMsg}</p>}
            {(scn?.scenarios || []).map(sc => (
              <div key={sc.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#fff' }}>{sc.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sc.buyerRole}{sc.company ? `, ${sc.company}` : ''} · {sc.personality} · difficulty {sc.difficulty}/5</div>
                </div>
                <button onClick={() => deleteScenario(sc.id)} disabled={scnBusy} style={{ fontSize: 10, background: 'none', border: 'none', color: '#e84545', cursor: 'pointer', fontFamily: 'monospace' }}>DELETE</button>
              </div>
            ))}
          </div>
          )
        })()}

        <div style={{ border: '1px solid rgba(0,200,224,0.1)', padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          SESSION DATA · MONGODB ATLAS MUMBAI · NEVER USED TO TRAIN AI · DPDP ACT 2023 COMPLIANT · DELETE: privacy@repready.site
        </div>

      </div>
    </div>
  )
}
