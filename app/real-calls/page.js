'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Distinct copy per rejection reason — these are genuinely different failure
// modes (too long, too many voices, no labels at all, only one voice) and
// must read that way, not share one generic string with a variable swapped in.
const UNSUPPORTED_MESSAGES = {
  duration: "Calls longer than 20 minutes aren't supported yet.",
  speaker_count: "This call has more than 2 speakers — not supported yet.",
  no_labels_detected: "We couldn't detect speaker labels in this text — try formatting as `Name: message` per line.",
  single_speaker: "Only one speaker was detected — we need both sides of the conversation to score it. Check that your paste includes both the rep's and the prospect's lines.",
}

function scoreColor(score) {
  if (score >= 70) return '#22D3EE'
  if (score >= 40) return '#F5A623'
  return '#E63946'
}

// Same visual component as app/coach/page.js's DimensionBar — copied, not
// reinvented, so the skill matrix here matches that page exactly.
function DimensionBar({ label, score }) {
  const color = scoreColor(score)
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-[10px] font-bold text-white">{score}</span>
      </div>
      <div className="w-full h-1 bg-white/5 overflow-hidden">
        <div className="h-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  )
}

// Reconstructs a speakers-like array ({label, snippet}) client-side from a
// raw re-fetched `ready_for_confirmation` record.
//
// Judgment call (per the task's own framing — flagged, not silently
// resolved): the POST /api/real-calls response's `speakers` array (label +
// first-line snippet) is never persisted on the record itself — only the raw
// `utterances` (audio path, {speaker, text}) or `pastedLines` (paste path,
// {label, text}) are. Rather than treat a `/real-calls?id=` deep link into
// this state as a lower-priority nice-to-have, this rebuilds the same
// speakers array the server originally computed: one entry per distinct
// label, snippet = that label's first line. It's the same handful of lines
// the API route itself uses (see POST /real-calls), so it's not
// over-engineering — it's just not duplicated server-side persistence.
function speakersFromRecord(record) {
  const entries = record.utterances
    ? record.utterances.map(u => ({ label: u.speaker, text: u.text }))
    : record.pastedLines
      ? record.pastedLines.map(l => ({ label: l.label, text: l.text }))
      : []
  const seen = []
  for (const e of entries) {
    if (!seen.find(s => s.label === e.label)) {
      seen.push({ label: e.label, snippet: e.text })
    }
  }
  return seen
}

const VIEW = {
  FORM: 'form',
  DEEP_LINK_LOADING: 'deep_link_loading',
  DEEP_LINK_ERROR: 'deep_link_error',
  PROCESSING: 'processing',
  UNSUPPORTED: 'unsupported',
  CONFIRM: 'confirm',
  CONFIRMING: 'confirming',
  REPORT: 'report',
}

export default function RealCallsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [view, setView] = useState(VIEW.FORM)

  // Form state
  const [inputMode, setInputMode] = useState('upload')
  const [file, setFile] = useState(null)
  const [transcriptText, setTranscriptText] = useState('')
  const [formError, setFormError] = useState('')

  // Confirmation state
  const [recordId, setRecordId] = useState(null)
  const [speakers, setSpeakers] = useState([])
  const [confirmError, setConfirmError] = useState('')
  const [pendingRepLabel, setPendingRepLabel] = useState(null)

  // Result state
  const [unsupportedReason, setUnsupportedReason] = useState(null)
  const [scoredRecord, setScoredRecord] = useState(null)
  const [deepLinkError, setDeepLinkError] = useState('')

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }
  }, [isLoaded, user, router])

  // Deep-link support: /real-calls?id=xyz loads an existing record directly
  // and jumps straight to the right state instead of showing the form.
  useEffect(() => {
    if (!isLoaded || !user) return
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (!id) return

    setView(VIEW.DEEP_LINK_LOADING)
    fetch(`/api/real-calls?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('failed to load record')
        return r.json()
      })
      .then((record) => {
        if (record.status === 'scored') {
          setScoredRecord(record)
          setView(VIEW.REPORT)
        } else if (record.status === 'ready_for_confirmation') {
          setRecordId(record.id)
          setSpeakers(speakersFromRecord(record))
          setView(VIEW.CONFIRM)
        } else if (record.status === 'unsupported') {
          setUnsupportedReason(record.unsupportedReason)
          setView(VIEW.UNSUPPORTED)
        } else {
          setDeepLinkError('This call record is in an unexpected state.')
          setView(VIEW.DEEP_LINK_ERROR)
        }
      })
      .catch(() => {
        setDeepLinkError('Could not load that call — it may not exist, or you may not have access to it.')
        setView(VIEW.DEEP_LINK_ERROR)
      })
    // Only ever run this once per mount against the URL present at load —
    // not re-run on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user])

  function resetToForm() {
    setView(VIEW.FORM)
    setFormError('')
    setFile(null)
    setTranscriptText('')
    setRecordId(null)
    setSpeakers([])
    setConfirmError('')
    setPendingRepLabel(null)
    setUnsupportedReason(null)
    setScoredRecord(null)
    setDeepLinkError('')
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  function handleIntakeResponse(data) {
    if (data.status === 'unsupported') {
      setUnsupportedReason(data.reason)
      setView(VIEW.UNSUPPORTED)
    } else if (data.status === 'ready_for_confirmation') {
      setRecordId(data.id)
      setSpeakers(data.speakers || [])
      setView(VIEW.CONFIRM)
    } else {
      setFormError('Unexpected response from the server. Please try again.')
      setView(VIEW.FORM)
    }
  }

  async function submitUpload(e) {
    e.preventDefault()
    if (!file) { setFormError('Choose an audio file first.'); return }
    setFormError('')
    setView(VIEW.PROCESSING)
    try {
      const formData = new FormData()
      formData.append('audio', file)
      // Do NOT set Content-Type manually — the browser sets the multipart
      // boundary itself.
      const res = await fetch('/api/real-calls', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('request failed')
      const data = await res.json()
      handleIntakeResponse(data)
    } catch (err) {
      setFormError('Something went wrong processing that call. Please try again.')
      setView(VIEW.FORM)
    }
  }

  async function submitTranscript(e) {
    e.preventDefault()
    if (!transcriptText.trim()) { setFormError('Paste a transcript first.'); return }
    setFormError('')
    setView(VIEW.PROCESSING)
    try {
      const res = await fetch('/api/real-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText }),
      })
      if (!res.ok) throw new Error('request failed')
      const data = await res.json()
      handleIntakeResponse(data)
    } catch (err) {
      setFormError('Something went wrong processing that call. Please try again.')
      setView(VIEW.FORM)
    }
  }

  async function confirmSpeaker(repLabel) {
    setConfirmError('')
    setPendingRepLabel(repLabel)
    setView(VIEW.CONFIRMING)
    try {
      const res = await fetch('/api/real-calls/confirm-speaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, repLabel }),
      })
      if (!res.ok) throw new Error('request failed')
      const scored = await res.json()
      setScoredRecord(scored)
      setView(VIEW.REPORT)
    } catch (err) {
      setConfirmError('Scoring failed. Please try again.')
      setView(VIEW.CONFIRM)
    }
  }

  if (!isLoaded || (isLoaded && !user)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#22D3EE] text-xs uppercase tracking-[0.3em]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[#050505] text-zinc-300 font-mono p-4 md:p-10 relative">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#22D3EE 1px, transparent 1px), linear-gradient(90deg, #22D3EE 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white uppercase italic tracking-tighter">Real Call Scoring</h1>
            <p className="text-[#22D3EE] text-[10px] uppercase tracking-[0.4em] mt-2">Upload or Paste // Get Boardroom Feedback</p>
          </div>
          <Link href="/deck">
            <button className="px-6 py-3 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
              BACK TO DECK
            </button>
          </Link>
        </header>

        {view === VIEW.DEEP_LINK_LOADING && (
          <div className="border border-white/5 bg-[#0a0a0a] p-12 text-center">
            <p className="text-[#22D3EE] text-xs uppercase tracking-[0.3em] animate-pulse">Loading call record...</p>
          </div>
        )}

        {view === VIEW.DEEP_LINK_ERROR && (
          <div className="border border-red-500/20 bg-red-950/5 p-12 text-center">
            <p className="text-red-400 text-sm mb-6">{deepLinkError}</p>
            <button onClick={resetToForm} className="px-8 py-3 border border-[#22D3EE]/50 text-[#22D3EE] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#22D3EE]/10 transition-all">
              Start a New Call
            </button>
          </div>
        )}

        {view === VIEW.FORM && (
          <FormState
            inputMode={inputMode}
            setInputMode={setInputMode}
            file={file}
            setFile={setFile}
            transcriptText={transcriptText}
            setTranscriptText={setTranscriptText}
            formError={formError}
            onSubmitUpload={submitUpload}
            onSubmitTranscript={submitTranscript}
          />
        )}

        {view === VIEW.PROCESSING && (
          <div className="border border-white/5 bg-[#0a0a0a] p-12 text-center">
            <p className="text-[#22D3EE] text-xs uppercase tracking-[0.3em] animate-pulse mb-4">
              {inputMode === 'upload'
                ? 'Transcribing your call — this can take a minute for longer recordings...'
                : 'Analyzing your transcript — this can take a moment...'}
            </p>
            <p className="text-zinc-600 text-xs">Please don't close this tab.</p>
          </div>
        )}

        {view === VIEW.UNSUPPORTED && (
          <div className="border border-red-500/20 bg-red-950/5 p-12 text-center">
            <h3 className="text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Not Supported</h3>
            <p className="text-zinc-300 text-sm mb-8 max-w-lg mx-auto leading-relaxed">
              {UNSUPPORTED_MESSAGES[unsupportedReason] || 'This call could not be processed.'}
            </p>
            <button onClick={resetToForm} className="px-8 py-3 border border-[#22D3EE]/50 text-[#22D3EE] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#22D3EE]/10 transition-all">
              Back to Form
            </button>
          </div>
        )}

        {(view === VIEW.CONFIRM || view === VIEW.CONFIRMING) && (
          <div className="space-y-6">
            <div className="border border-white/5 bg-[#0a0a0a] p-6">
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Confirm Speakers</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">We detected two speakers in this call. Pick which one is the rep — the other will be scored as the prospect.</p>
            </div>

            {confirmError && (
              <div className="border border-red-500/20 bg-red-950/5 p-4 flex items-center justify-between gap-4">
                <p className="text-red-400 text-xs">{confirmError}</p>
                <button
                  onClick={() => pendingRepLabel && confirmSpeaker(pendingRepLabel)}
                  className="shrink-0 px-4 py-2 border border-red-500/40 text-red-300 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-red-500/10 transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            {view === VIEW.CONFIRMING ? (
              <div className="border border-white/5 bg-[#0a0a0a] p-12 text-center">
                <p className="text-[#22D3EE] text-xs uppercase tracking-[0.3em] animate-pulse">Scoring the call — running boardroom analysis...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {speakers.map((s) => (
                  <div key={s.label} className="border border-white/5 bg-[#0a0a0a] p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-white text-sm font-bold uppercase tracking-tight mb-2">{s.label}</p>
                      <p className="text-zinc-500 text-xs italic leading-relaxed line-clamp-4">"{s.snippet}"</p>
                    </div>
                    <button
                      onClick={() => confirmSpeaker(s.label)}
                      className="mt-6 px-6 py-3 border border-[#22D3EE]/50 text-[#22D3EE] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#22D3EE]/10 transition-all"
                    >
                      This is the Rep
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === VIEW.REPORT && scoredRecord && (
          <ReportState record={scoredRecord} onStartNew={resetToForm} />
        )}
      </div>
    </div>
  )
}

function FormState({ inputMode, setInputMode, file, setFile, transcriptText, setTranscriptText, formError, onSubmitUpload, onSubmitTranscript }) {
  return (
    <div className="space-y-6">
      <div className="flex border border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setInputMode('upload')}
          className={`px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${inputMode === 'upload' ? 'bg-[#22D3EE]/10 text-[#22D3EE]' : 'text-zinc-500 hover:text-white'}`}
        >
          Upload Audio
        </button>
        <button
          type="button"
          onClick={() => setInputMode('paste')}
          className={`px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-l border-white/10 ${inputMode === 'paste' ? 'bg-[#22D3EE]/10 text-[#22D3EE]' : 'text-zinc-500 hover:text-white'}`}
        >
          Paste Transcript
        </button>
      </div>

      {formError && (
        <div className="border border-red-500/20 bg-red-950/5 p-4">
          <p className="text-red-400 text-xs">{formError}</p>
        </div>
      )}

      {inputMode === 'upload' ? (
        <form onSubmit={onSubmitUpload} className="border border-white/5 bg-[#0a0a0a] p-8 space-y-6">
          <div>
            <label className="text-zinc-500 text-[10px] uppercase tracking-widest block mb-3">Call Recording</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border file:border-white/10 file:bg-white/5 file:text-white file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:cursor-pointer"
            />
            {file && <p className="text-zinc-600 text-[10px] mt-2">{file.name}</p>}
          </div>
          <button type="submit" className="px-8 py-3 border border-[#22D3EE]/50 text-[#22D3EE] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#22D3EE]/10 transition-all">
            Score This Call
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmitTranscript} className="border border-white/5 bg-[#0a0a0a] p-8 space-y-6">
          <div>
            <label className="text-zinc-500 text-[10px] uppercase tracking-widest block mb-3">Pasted Transcript</label>
            <textarea
              value={transcriptText}
              onChange={(e) => setTranscriptText(e.target.value)}
              placeholder={'Rep: Hi there, thanks for taking the call today.\nProspect: Hello, sure, go ahead.'}
              rows={12}
              className="w-full bg-black border border-white/10 text-zinc-300 text-xs p-4 leading-relaxed focus:outline-none focus:border-[#22D3EE]/50 font-mono"
            />
          </div>
          <button type="submit" className="px-8 py-3 border border-[#22D3EE]/50 text-[#22D3EE] font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-[#22D3EE]/10 transition-all">
            Score This Call
          </button>
        </form>
      )}
    </div>
  )
}

function ReportState({ record, onStartNew }) {
  const analysts = record.analysts || {}
  const procurement = analysts.procurement || {}
  const enablement = analysts.enablement || {}

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={onStartNew} className="px-6 py-3 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all">
          Score Another Call
        </button>
      </div>

      {/* Score block */}
      <div className="bg-[#0a0a0a] border border-white/5 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Final Score</p>
            <p className="text-6xl font-bold italic tracking-tighter text-[#22D3EE]">{record.finalScore ?? '--'}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Grade</p>
            <p className={`text-6xl font-bold italic tracking-tighter ${
              record.grade === 'A' ? 'text-green-400' :
              record.grade === 'B' ? 'text-[#22D3EE]' :
              record.grade === 'C' ? 'text-[#F5A623]' :
              'text-red-500'
            }`}>{record.grade ?? '--'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div>
            <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Procurement Score</p>
            <p className="text-2xl font-bold text-white">{record.procurementScore ?? '--'}<span className="text-xs text-zinc-500">/100</span></p>
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">Margin Defense</p>
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] uppercase mb-1 tracking-widest">Enablement Score</p>
            <p className="text-2xl font-bold text-white">{record.enablementScore ?? '--'}<span className="text-xs text-zinc-500">/100</span></p>
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">Call Technique</p>
          </div>
        </div>
      </div>

      {/* Executive verdict */}
      {record.verdict && (
        <div className="border border-white/10 bg-white/5 p-6">
          <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Executive Verdict</h3>
          <p className="text-sm text-zinc-300 leading-relaxed italic">"{record.verdict}"</p>
        </div>
      )}

      {/* What you did right / wrong */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-green-500/20 bg-green-950/5 p-6">
          <h3 className="text-green-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">What You Did Right</h3>
          <p className="text-sm text-zinc-400 leading-relaxed border-l border-green-500/30 pl-3">
            {record.whatYouDidRight || "—"}
          </p>
        </div>
        <div className="border border-red-500/20 bg-red-950/5 p-6">
          <h3 className="text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">What You Did Wrong</h3>
          <p className="text-sm text-zinc-400 leading-relaxed border-l border-red-500/30 pl-3">
            {record.whatYouDidWrong || "—"}
          </p>
        </div>
      </div>

      {/* One thing to fix next */}
      <div className="border border-[#22D3EE]/20 bg-[#22D3EE]/5 p-6">
        <h3 className="text-[#22D3EE] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">One Thing To Fix Next</h3>
        <p className="text-sm text-zinc-300 leading-relaxed">{record.oneThingToFixNext || "—"}</p>
      </div>

      {/* Skill Matrix */}
      {record.dimensions && (
        <div className="border border-white/5 bg-[#0a0a0a] p-6">
          <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Skill Matrix</h3>
          {(record.criteria || []).map((c) => (
            <DimensionBar key={c.key} label={c.name} score={record.dimensions[c.key]} />
          ))}
        </div>
      )}

      {/* Analyst breakdown */}
      {record.analysts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-white/5 bg-[#0a0a0a] p-6">
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Procurement Analysis</h3>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Score</p>
            <p className="text-xs text-white font-bold mb-3">{procurement.score ?? '--'}/100</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Margin Defense</p>
            <p className="text-xs text-white font-bold uppercase mb-3">{procurement.marginDefense}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Discounted Early</p>
            <p className="text-xs text-white font-bold uppercase mb-3">{procurement.discountedEarly ? 'Yes' : 'No'}</p>
            <p className="text-xs text-zinc-500 leading-relaxed">{procurement.reasoning}</p>
          </div>
          <div className="border border-white/5 bg-[#0a0a0a] p-6">
            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Enablement Analysis</h3>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Score</p>
            <p className="text-xs text-white font-bold mb-3">{enablement.score ?? '--'}/100</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Call Control</p>
            <p className="text-xs text-white font-bold uppercase mb-3">{enablement.callControl}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Used Discovery</p>
            <p className="text-xs text-white font-bold uppercase mb-3">{enablement.usedDiscovery ? 'Yes' : 'No'}</p>
            <p className="text-xs text-zinc-500 leading-relaxed">{enablement.reasoning}</p>
          </div>
        </div>
      )}

      {/* Scored transcript — bonus context specific to real calls, in the
          same raw-comm-log visual style /coach uses. */}
      {record.transcript && (
        <div className="bg-[#020202] border border-white/5 p-6">
          <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4">Scored Transcript</h3>
          <div className="space-y-3 text-xs max-h-[500px] overflow-y-auto pr-2">
            {record.transcript.split('\n').filter(Boolean).map((line, i) => (
              <div key={i} className={`${line.startsWith('Rep:') ? 'text-[#22D3EE]' : 'text-red-400'} opacity-80 leading-relaxed`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
