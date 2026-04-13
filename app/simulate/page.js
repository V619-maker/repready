'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useConversation, ConversationProvider } from '@elevenlabs/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Star, 
  Mic, 
  Send, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Building2,
  Target,
  StopCircle,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Award,
  Beaker,
  History,
  Users,
  Settings,
  ChevronRight,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  Lock,
  Mail,
  Lightbulb,
  Phone,
  FileText,
  Briefcase,
  Radio
} from 'lucide-react'
import Link from 'next/link'

// ElevenLabs Agent IDs
const RICHARD_AGENT_ID = "agent_8601kmk3maq9f9a9csym74aj7s4e"
const SANDRA_AGENT_ID = "agent_0301kmsnhr7tf11b62bvd7vsw9qq"
const TRIAL_TIME_LIMIT = 90

// Persona data
const PERSONAS = {
  richard: {
    id: 'richard',
    agentId: RICHARD_AGENT_ID,
    name: 'Richard',
    fullName: 'Richard Vance',
    title: 'VP Procurement',
    company: '500-person logistics firm',
    difficulty: 5,
    avatar: 'R',
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    description: '20 years of vendor negotiation. CFO mandated 15% cost reduction. His bonus is tied to savings.',
    tactics: ['Threatens vendor consolidation', 'Demands Net-90 terms', 'Pushes for 20% discount'],
    personality: 'Curt, impatient, never shows genuine interest',
    firstMessage: "You've got 3 minutes. We're evaluating four vendors this quarter and my CFO wants 20% off our software spend. Tell me exactly why I should not just go with the cheaper option."
  },
  sandra: {
    id: 'sandra',
    agentId: SANDRA_AGENT_ID,
    name: 'Sandra',
    fullName: 'Sandra Chen',
    title: 'IT Director',
    company: '800-person financial firm',
    difficulty: 4,
    avatar: 'S',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    description: "Aggressively protects her team's bandwidth. Every response contains a blocker.",
    tactics: ['Claims zero implementation capacity', 'Demands SOC 2 Type II', 'Requires native SAML/SSO'],
    personality: 'Polite on the surface, but always has objections',
    firstMessage: "I've got a few minutes before my next meeting. We're looking at tools like yours, but my team has zero bandwidth for implementation this quarter. What makes you different from the other three vendors I'm evaluating?"
  }
}

// Coaching tips based on message count
const COACHING_TIPS = {
  early: "Tip: Don't mention price yet. Ask about their biggest challenge with their current vendor first.",
  mid: "Tip: If they push on price, redirect to ROI. What does a bad vendor cost them per quarter?",
  late: "Tip: Create urgency by highlighting what competitors are doing. Don't beg — position yourself as the solution."
}

// Privacy Footer
function PrivacyFooter() {
  return (
    <footer className="border-t border-border/50 py-4 px-6 bg-[#0A0A12]">
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
        <a href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</a>
        <a href="/terms" className="hover:text-muted-foreground transition-colors">Terms of Service</a>
      </div>
    </footer>
  )
}

// Star rating
function DifficultyStars({ difficulty, size = 'default' }) {
  const sizeClass = size === 'small' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`${sizeClass} ${i < difficulty ? 'fill-[#F5A623] text-[#F5A623]' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  )
}

function ScoreTrend({ currentScore, previousScore }) {
  const diff = currentScore - previousScore
  if (diff > 0) return <TrendingUp className="w-5 h-5 text-[#F5A623]" />
  if (diff < 0) return <TrendingDown className="w-5 h-5 text-[#E63946]" />
  return <Minus className="w-5 h-5 text-muted-foreground" />
}

function getScoreColor(score) {
  if (score >= 70) return 'text-[#22C55E]'
  if (score >= 40) return 'text-[#F5A623]'
  return 'text-[#E63946]'
}

function getVerdictStyle(verdict) {
  const lower = verdict.toLowerCase()
  if (lower.startsWith('passed')) return { color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', icon: Trophy }
  if (lower.startsWith('needs work')) return { color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/10', icon: AlertTriangle }
  return { color: 'text-[#E63946]', bg: 'bg-[#E63946]/10', icon: XCircle }
}

// Email Gate
function EmailGate({ onComplete, selectedPersona }) {
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const persona = PERSONAS[selectedPersona || 'richard']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!consent) {
      setError('Please agree to the privacy policy to continue.')
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Registration failed')
      onComplete({ email: data.email, sessionsUsed: data.sessionsUsed })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] flex flex-col">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-[#0D0D1A]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#E63946] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">RepReady</span>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md bg-[#0D0D1A] border border-border/50">
          <CardHeader className="text-center pb-2">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${persona.color} mx-auto mb-4 flex items-center justify-center`}>
              <span className="text-3xl font-bold text-white">{persona.avatar}</span>
            </div>
            <CardTitle className="text-2xl text-white">Battle-test your skills</CardTitle>
            <CardDescription className="text-base">against {persona.name}. Enter your email to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email to begin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-[#0D0D1A] border-border/50 focus:border-[#F5A623] text-white"
                />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={setConsent}
                  className="mt-1 border-border/50 data-[state=checked]:bg-[#E63946] data-[state=checked]:border-[#E63946]"
                />
                <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to processing of my data per the{' '}
                  <a href="/privacy" className="text-[#F5A623] hover:underline">Privacy Policy</a>
                  {' '}and that sessions are not used to train AI models.
                </label>
              </div>
              {error && <p className="text-sm text-[#E63946]">{error}</p>}
              <Button type="submit" className="w-full h-12 bg-[#E63946] hover:bg-[#E63946]/90 text-white" disabled={isLoading}>
                {isLoading ? 'Starting...' : `Challenge ${persona.name} Free →`}
              </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground mt-4">
              <Lock className="w-3 h-3 inline mr-1" />
              3 free sessions included. No credit card required.
            </p>
          </CardContent>
        </Card>
      </main>
      <PrivacyFooter />
    </div>
  )
}

// Pre-Call Briefing
function PreCallBriefing({ persona, onStartTextCall, onStartVoiceCall }) {
  const selectedPersona = PERSONAS[persona]
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl bg-[#0D0D1A] border border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E63946] mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">Pre-Call Briefing</CardTitle>
          <CardDescription>Review the intel before you go live with {selectedPersona.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-[#6366F1]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F5A623]">YOUR ROLE</p>
                <p className="text-sm text-muted-foreground">Account Executive selling a $50,000 SaaS contract.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-[#E63946]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#E63946]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F5A623]">ABOUT {selectedPersona.name.toUpperCase()}</p>
                <p className="text-sm text-muted-foreground">{selectedPersona.title} at a {selectedPersona.company}. CFO has mandated 15% cost reduction this quarter.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F5A623]">YOUR OBJECTIVE</p>
                <p className="text-sm text-muted-foreground">Get {selectedPersona.name} to agree to a discovery call.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#F5A623]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F5A623]">INTEL</p>
                <p className="text-sm text-muted-foreground">{selectedPersona.name} has 3 competing vendors on the shortlist.</p>
              </div>
            </div>
          </div>

          {/* Mode selection */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button
              onClick={onStartTextCall}
              size="lg"
              variant="outline"
              className="h-14 border-border/50 text-white hover:bg-muted/30 flex flex-col gap-1"
            >
              <Send className="w-4 h-4" />
              <span className="text-xs">Text Mode</span>
            </Button>
            <Button
              onClick={onStartVoiceCall}
              size="lg"
              className="h-14 bg-[#E63946] hover:bg-[#E63946]/90 text-white flex flex-col gap-1"
            >
              <Mic className="w-4 h-4" />
              <span className="text-xs">Voice Mode</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Voice Call Modal — ported from deck page, styled to match new UI
function VoiceCallModal({ persona, onClose, onShowResults, userEmail }) {
  const selectedPersona = PERSONAS[persona]
  const [isVerifying, setIsVerifying] = useState(false)
  const [creditsDepleted, setCreditsDepleted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TRIAL_TIME_LIMIT)
  const [cutOff, setCutOff] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState([])
  const [recentScore, setRecentScore] = useState(0)
  const [showAudit, setShowAudit] = useState(false)
  const transcriptRef = useRef([])

  const conversation = useConversation({
    onMessage: (message) => {
      if (message.message) {
        const speaker = message.source === 'user' ? 'You' : selectedPersona.name
        transcriptRef.current.push(`${speaker}: ${message.message}`)
        setLiveTranscript(prev => [...prev, { speaker, text: message.message }])
      }
    }
  })

  useEffect(() => {
    let interval
    if (conversation.status === 'connected' && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && conversation.status === 'connected') {
      setCutOff(true)
      handleEndCall()
    }
    return () => clearInterval(interval)
  }, [conversation.status, timeLeft])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleStartCall = async () => {
    setIsVerifying(true)
    setCreditsDepleted(false)
    setLiveTranscript([{ speaker: 'System', text: 'Initializing secure connection...' }])
    try {
      const creditCheck = await fetch('/api/deduct-credit', { method: 'POST' })
      if (!creditCheck.ok) {
        setCreditsDepleted(true)
        setIsVerifying(false)
        return
      }
      setTimeLeft(TRIAL_TIME_LIMIT)
      setCutOff(false)
      await conversation.startSession({ agentId: selectedPersona.agentId, connectionType: 'webrtc' })
    } catch (error) {
      console.error('Failed to start voice connection:', error)
    }
    setIsVerifying(false)
  }

  const handleEndCall = async () => {
    await conversation.endSession()
    handleTerminate()
  }

  const handleTerminate = async () => {
    setIsAnalyzing(true)
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000))
    try {
      const realTranscript = transcriptRef.current.join('\n\n')
      const finalTranscript = realTranscript.trim() ? realTranscript : 'No words were spoken during the simulation.'

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: finalTranscript })
      })
      const data = await response.json()
      const cleanJson = data.message.replace(/```json|```/g, '').trim()
      const scoreData = JSON.parse(cleanJson)
      const finalScore = cutOff
        ? Math.max(30, (scoreData.aggregate_score || 75) - 20)
        : (scoreData.aggregate_score || 75)

      setRecentScore(finalScore)

      localStorage.setItem('repready_latest_debrief', cleanJson)
      localStorage.setItem('repready_latest_transcript', finalTranscript)

      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          persona,
          messages: transcriptRef.current,
          scorecard: scoreData,
          finalScore
        })
      })

      transcriptRef.current = []
      await minLoadingTime
      setShowAudit(true)
    } catch (error) {
      console.error('Scoring error:', error)
      setRecentScore(60)
      await minLoadingTime
      setShowAudit(true)
    }
    setIsAnalyzing(false)
  }

  const handleViewResults = () => {
    onShowResults({
      final_score: recentScore,
      verdict: recentScore >= 70
        ? 'Passed — Strong performance.'
        : recentScore >= 40
          ? 'Needs Work — Room to improve.'
          : 'Failed — The deal slipped away.',
      strengths: ['Voice delivery', 'Active engagement'],
      improvements: ['Objection handling', 'Value articulation'],
      biggest_mistake: 'Review the full debrief in the Coach tab for detailed analysis.'
    })
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-xl bg-black/95">

      {/* Credits depleted overlay */}
      {creditsDepleted && (
        <div className="absolute inset-0 bg-[#0D0D1A]/98 z-50 flex flex-col items-center justify-center p-10 border border-[#E63946]/30">
          <XCircle className="w-16 h-16 text-[#E63946] mb-4" />
          <h3 className="text-[#E63946] text-3xl font-bold mb-2">Credits Depleted</h3>
          <p className="text-muted-foreground text-sm text-center mb-8 max-w-md">
            Upgrade to Pro to unlock unlimited voice simulations.
          </p>
          <div className="flex gap-4">
            <a href="/pricing">
              <Button className="bg-[#E63946] hover:bg-[#E63946]/90 text-white px-8">Upgrade Now</Button>
            </a>
            <Button variant="outline" onClick={() => { setCreditsDepleted(false); onClose(); }}>
              Return to Deck
            </Button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl h-[85vh] border border-border/50 bg-[#0D0D1A] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border/50 bg-[#0A0A12]">
          <div className="flex items-center gap-3">
            <Avatar className={`w-10 h-10 bg-gradient-to-br ${selectedPersona.color}`}>
              <AvatarFallback className="text-sm font-bold text-white bg-transparent">{selectedPersona.avatar}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">Live Voice Call — {selectedPersona.fullName}</h3>
                <div className={`w-2 h-2 rounded-full ${conversation.status === 'connected' ? 'bg-[#E63946] animate-pulse' : 'bg-muted-foreground/30'}`} />
              </div>
              <p className="text-xs text-muted-foreground">{selectedPersona.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {conversation.status === 'connected' && (
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#E63946] animate-pulse" />
                <span className="text-sm font-mono font-bold text-[#F5A623]">{formatTime(timeLeft)}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-white">✕</Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">

          {/* Voice visualizer panel */}
          <div className="w-56 border-r border-border/50 p-6 flex flex-col items-center justify-center bg-[#0A0A12] gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-border/30" />
              <div className={`absolute inset-2 rounded-full border border-border/50 ${conversation.status === 'connected' ? 'border-t-[#F5A623] animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              <div className="w-12 h-12 rounded-full border border-border/50 flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ${conversation.status === 'connected' ? 'bg-[#F5A623] animate-ping' : 'bg-muted-foreground/30'}`} />
              </div>
            </div>

            <div className="w-full">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 text-center">Voice</p>
              <div className="flex gap-[2px] items-end h-6 justify-center">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-sm ${conversation.isSpeaking ? 'bg-[#F5A623] animate-pulse' : 'bg-muted-foreground/20'}`}
                    style={{ height: conversation.isSpeaking ? `${Math.max(20, Math.random() * 100)}%` : '20%', animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            <div className="w-full text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Status</p>
              <p className={`text-xs font-semibold ${conversation.status === 'connected' ? 'text-[#22C55E]' : 'text-muted-foreground'}`}>
                {conversation.status === 'connected' ? 'Connected' : isVerifying ? 'Connecting...' : 'Standby'}
              </p>
            </div>
          </div>

          {/* Transcript */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {liveTranscript.length === 0 && !isVerifying && (
                  <p className="text-muted-foreground/50 text-sm text-center mt-8">
                    Click "Start Call" to connect with {selectedPersona.name}
                  </p>
                )}
                {isVerifying && (
                  <p className="text-[#F5A623] text-sm animate-pulse text-center mt-8">Verifying credentials...</p>
                )}
                {isAnalyzing && (
                  <p className="text-[#F5A623] text-sm animate-pulse text-center mt-4">Analyzing your performance...</p>
                )}
                {liveTranscript.map((msg, i) => (
                  <div key={i} className={`flex ${msg.speaker === 'You' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.speaker === 'You'
                        ? 'bg-[#6366F1] text-white rounded-br-md'
                        : msg.speaker === 'System'
                          ? 'bg-muted/20 border border-border/30 text-muted-foreground text-xs rounded-lg'
                          : 'bg-muted/30 border border-border/50 rounded-bl-md'
                    }`}>
                      {msg.speaker !== 'You' && msg.speaker !== 'System' && (
                        <p className="text-xs font-semibold text-[#F5A623] mb-1">{selectedPersona.name}</p>
                      )}
                      <p className="text-sm leading-relaxed text-white">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 text-center">
              <p className="text-xs text-muted-foreground/50">
                {conversation.status === 'connected'
                  ? '🎙 Speak your response — Richard is listening'
                  : 'Voice mode active — your mic will open when the call starts'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex justify-between items-center p-4 border-t border-border/50 bg-[#0A0A12]">
          <div>
            {conversation.status !== 'connected' ? (
              <Button
                onClick={handleStartCall}
                disabled={isVerifying || isAnalyzing}
                className="bg-[#E63946] hover:bg-[#E63946]/90 text-white gap-2"
              >
                <Mic className="w-4 h-4" />
                {isVerifying ? 'Connecting...' : 'Start Call'}
              </Button>
            ) : (
              <Button variant="outline" disabled className="gap-2 text-muted-foreground/50 cursor-not-allowed">
                <Mic className="w-4 h-4" />
                Live
              </Button>
            )}
          </div>
          {conversation.status === 'connected' ? (
            <Button
              onClick={handleEndCall}
              variant="destructive"
              className="gap-2 bg-[#E63946] hover:bg-[#E63946]/90"
            >
              <StopCircle className="w-4 h-4" />
              End Call
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isAnalyzing}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Post-call audit modal */}
      {showAudit && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-50 p-6">
          <Card className="w-full max-w-md bg-[#0D0D1A] border border-border/50 text-center">
            <CardHeader className="pb-2 pt-8">
              <div className="flex justify-center mb-4">
                <Award className={`w-16 h-16 ${cutOff ? 'text-[#E63946]' : 'text-[#F5A623]'}`} />
              </div>
              <CardTitle className={`text-2xl ${cutOff ? 'text-[#E63946]' : 'text-white'}`}>
                {cutOff ? 'Trial Time Exceeded' : 'Simulation Complete'}
              </CardTitle>
              <CardDescription>
                {cutOff ? 'Upgrade to Pro for unlimited call time' : 'Performance telemetry generated'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <div className="bg-muted/20 border border-border/50 rounded-xl p-6">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Aggregate Score</p>
                <p className={`text-7xl font-black ${cutOff ? 'text-[#E63946]' : getScoreColor(recentScore)}`}>
                  {recentScore}
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/coach" className="flex-1">
                  <Button className="w-full bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-bold">
                    Analyze with Coach
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleViewResults}
                >
                  View Scorecard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Scorecard Loading
function ScorecardLoading({ personaName }) {
  const [dots, setDots] = useState('')
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F5A623]/20 to-[#F5A623]/5 mx-auto flex items-center justify-center">
            <Award className="w-12 h-12 text-[#F5A623] animate-pulse" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-[#F5A623]/20 border-t-[#F5A623] animate-spin" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">{personaName} is reviewing your performance{dots}</h2>
        <p className="text-muted-foreground">Analyzing negotiation tactics and strategies</p>
      </div>
    </div>
  )
}

// Results Card
function ResultsCard({ scorecard, persona, onTryAgain }) {
  const selectedPersona = PERSONAS[persona]
  const verdictStyle = getVerdictStyle(scorecard.verdict)
  const VerdictIcon = verdictStyle.icon
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card className="bg-[#0D0D1A] border border-border/50 overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${selectedPersona.color}`} />
          <CardHeader className="text-center pb-2 pt-8">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
              <span>Performance Review</span>
              <Sparkles className="w-4 h-4 text-[#F5A623]" />
            </div>
            <CardTitle className="text-lg font-medium text-muted-foreground">
              Negotiation with {selectedPersona.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <div className="text-center py-6">
              <div className="relative inline-block">
                <div className={`text-9xl font-black ${getScoreColor(scorecard.final_score)}`}>{scorecard.final_score}</div>
                <div className="absolute -top-2 -right-6 text-3xl font-bold text-muted-foreground">/100</div>
              </div>
            </div>
            <div className={`${verdictStyle.bg} rounded-xl p-4 text-center`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <VerdictIcon className={`w-5 h-5 ${verdictStyle.color}`} />
                <span className={`font-bold text-lg ${verdictStyle.color}`}>{scorecard.verdict.split(':')[0]}</span>
              </div>
              <p className="text-sm text-muted-foreground">{scorecard.verdict}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  <h3 className="font-semibold text-[#22C55E]">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {scorecard.strengths?.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white">
                      <span className="text-[#22C55E] mt-1">•</span><span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#E63946]/5 border border-[#E63946]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-[#E63946]" />
                  <h3 className="font-semibold text-[#E63946]">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {scorecard.improvements?.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white">
                      <span className="text-[#E63946] mt-1">•</span><span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-[#F5A623]" />
                <h3 className="font-semibold text-[#F5A623]">Key Learning</h3>
              </div>
              <p className="text-sm text-muted-foreground italic">&ldquo;{scorecard.biggest_mistake}&rdquo;</p>
            </div>
            <Button onClick={onTryAgain} size="lg" className="w-full bg-[#E63946] hover:bg-[#E63946]/90 h-14 text-lg gap-2">
              <RotateCcw className="w-5 h-5" />Try Again →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Sidebar
function AppSidebar({ activeTab, onTabChange, sessionsUsed }) {
  const navItems = [
    { id: 'practice', label: 'Practice Lab', icon: Beaker, active: true },
    { id: 'history', label: 'Session History', icon: History, active: true },
    { id: 'analytics', label: 'Team Analytics', icon: Users, badge: 'Coming Soon', active: false },
    { id: 'settings', label: 'Settings', icon: Settings, active: true },
  ]
  return (
    <div className="w-64 border-r border-border/50 bg-[#0A0A12] flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#E63946] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">RepReady</span>
        </div>
      </div>
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => item.active && onTabChange(item.id)}
                  disabled={!item.active}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive ? 'bg-[#F5A623]/10 text-[#F5A623]'
                    : item.active ? 'text-muted-foreground hover:bg-muted/50 hover:text-white'
                    : 'text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#F5A623]/30 text-[#F5A623]">{item.badge}</Badge>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-border/50">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Free Sessions</span>
            <span className="text-[#F5A623]">{3 - sessionsUsed}/3</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F5A623] to-[#E63946] rounded-full transition-all"
              style={{ width: `${((3 - sessionsUsed) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Persona Selection
function PersonaSelection({ onSelect }) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-white">Choose Your Adversary</h1>
          <p className="text-muted-foreground">Practice the hardest sales conversations before they happen live.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {Object.values(PERSONAS).map((persona) => (
            <Card
              key={persona.id}
              className="bg-[#0D0D1A] border border-border/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-[#F5A623]/50 group"
              onClick={() => onSelect(persona.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className={`w-14 h-14 bg-gradient-to-br ${persona.color}`}>
                    <AvatarFallback className="text-lg font-bold text-white bg-transparent">{persona.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg text-white">{persona.name}</h3>
                      <DifficultyStars difficulty={persona.difficulty} size="small" />
                    </div>
                    <p className="text-sm text-muted-foreground">{persona.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 bg-muted/30 rounded-lg px-3 py-2">
                  <Building2 className="w-3 h-3" /><span>{persona.company}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{persona.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {persona.tactics.map((tactic, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-border/50 text-muted-foreground">{tactic}</Badge>
                  ))}
                </div>
                <Button className="w-full bg-[#E63946] hover:bg-[#E63946]/90 text-white">
                  Challenge {persona.name} →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Coaching Tip Bar
function CoachingTipBar({ messageCount }) {
  let tip = COACHING_TIPS.early
  if (messageCount >= 3) tip = COACHING_TIPS.mid
  if (messageCount >= 6) tip = COACHING_TIPS.late
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#F5A623]/10 border-t border-[#F5A623]/20">
      <Lightbulb className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
      <p className="text-xs text-[#F5A623]">{tip}</p>
    </div>
  )
}

// Chat Simulator (text mode)
function ChatSimulator({ persona, userEmail, onBack, onShowResults, onSessionUsed }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentScore, setCurrentScore] = useState(50)
  const [previousScore, setPreviousScore] = useState(50)
  const [scoreReason, setScoreReason] = useState('Deal starts at neutral — make your pitch.')
  const [isEndingNegotiation, setIsEndingNegotiation] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const scrollRef = useRef(null)
  const selectedPersona = PERSONAS[persona]

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: selectedPersona.firstMessage,
      score: 50,
      reason: 'Opening — they set the tone. Handle this carefully.'
    }])
    setScoreReason('Opening — they set the tone. Handle this carefully.')
  }, [persona])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    if (!sessionStarted) {
      setSessionStarted(true)
      onSessionUsed()
    }
    const userMessage = { role: 'user', content: inputValue.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setIsLoading(true)
    try {
      const response = await fetch('/api/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      if (!response.ok) throw new Error('Failed to get response')
      const data = await response.json()
      if (data.message) {
        setPreviousScore(currentScore)
        if (typeof data.deal_health_score === 'number') setCurrentScore(data.deal_health_score)
        if (data.score_reason) setScoreReason(data.score_reason)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          score: data.deal_health_score,
          reason: data.score_reason
        }])
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Let me stop you there.',
        score: 50,
        reason: 'Response error — score held steady'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const endNegotiation = async () => {
    if (messages.length <= 1) {
      alert('Have a conversation first before ending the negotiation.')
      return
    }
    setIsEndingNegotiation(true)
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000))
    try {
      const response = await fetch('/api/scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      if (!response.ok) throw new Error('Failed to get scorecard')
      const data = await response.json()
      await minLoadingTime
      if (data.final_score) {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail, persona, messages, scorecard: data, finalScore: data.final_score })
        })
        onShowResults(data)
      } else {
        onShowResults({
          final_score: currentScore,
          verdict: currentScore >= 70 ? "Passed — Good effort." : currentScore >= 40 ? "Needs Work — Room for improvement." : "Failed — The deal slipped away.",
          strengths: ["Participated actively", "Showed willingness to engage"],
          improvements: ["Work on handling objections", "Build stronger value propositions"],
          biggest_mistake: "Unable to generate detailed analysis."
        })
      }
    } catch (error) {
      await minLoadingTime
      onShowResults({
        final_score: currentScore,
        verdict: currentScore >= 70 ? "Passed — Good effort." : currentScore >= 40 ? "Needs Work — Room for improvement." : "Failed — The deal slipped away.",
        strengths: ["Participated actively", "Showed willingness to engage"],
        improvements: ["Work on handling objections", "Build stronger value propositions"],
        biggest_mistake: "Unable to generate detailed analysis."
      })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isEndingNegotiation) return <ScorecardLoading personaName={selectedPersona.name} />

  return (
    <div className="flex-1 flex flex-col">
      {/* Voice modal */}
      {showVoiceModal && (
        <VoiceCallModal
          persona={persona}
          userEmail={userEmail}
          onClose={() => setShowVoiceModal(false)}
          onShowResults={(results) => {
            setShowVoiceModal(false)
            onShowResults(results)
          }}
        />
      )}

      <div className="p-4 border-b border-border/50 bg-[#0A0A12]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={`w-10 h-10 bg-gradient-to-br ${selectedPersona.color}`}>
              <AvatarFallback className="text-sm font-bold text-white bg-transparent">{selectedPersona.avatar}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-white">Live Call with {selectedPersona.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedPersona.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Deal Health</div>
              <div className="flex items-center gap-2">
                <ScoreTrend currentScore={currentScore} previousScore={previousScore} />
                <span className={`text-4xl font-black ${getScoreColor(currentScore)}`}>{currentScore}%</span>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={endNegotiation}
              disabled={isLoading || messages.length <= 1}
              className="gap-2 bg-[#E63946] hover:bg-[#E63946]/90"
            >
              <StopCircle className="w-4 h-4" />End Call
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-muted/20 border-b border-border/50">
        <p className="text-xs text-muted-foreground italic text-center">&ldquo;{scoreReason}&rdquo;</p>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#6366F1] text-white rounded-br-md'
                    : 'bg-muted/30 border border-border/50 rounded-bl-md'
                }`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#F5A623]">{selectedPersona.name}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-white">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted/30 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#F5A623] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#F5A623] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#F5A623] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{selectedPersona.name} is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <CoachingTipBar messageCount={messages.filter(m => m.role === 'user').length} />

      <div className="p-4 border-t border-border/50 bg-[#0A0A12]">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Respond to ${selectedPersona.name}...`}
              className="flex-1 bg-muted/30 border-border/50 focus:border-[#F5A623] h-12 text-white"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-[#E63946] hover:bg-[#E63946]/90 h-12 px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-center mt-3">
            <Button
              variant="ghost"
              onClick={() => setShowVoiceModal(true)}
              className="gap-2 text-[#F5A623] hover:text-[#F5A623]/80 hover:bg-[#F5A623]/10"
            >
              <Mic className="w-4 h-4" />
              <span className="text-sm">Switch to Voice Mode</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Session History
function SessionHistory({ userEmail }) {
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`/api/sessions?email=${encodeURIComponent(userEmail)}`)
        const data = await response.json()
        setSessions(data)
      } catch (error) {
        console.error('Error fetching sessions:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSessions()
  }, [userEmail])
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-white">Session History</h1>
          <p className="text-muted-foreground">Review your past practice sessions and track your progress.</p>
        </div>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <Card className="bg-[#0D0D1A] border border-border/50">
            <CardContent className="py-12 text-center">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-white">No sessions yet</h3>
              <p className="text-sm text-muted-foreground">Start a practice session to see your history here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const personaData = PERSONAS[session.persona]
              return (
                <Card key={session.id} className="bg-[#0D0D1A] border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-10 h-10 bg-gradient-to-br ${personaData?.color || 'from-gray-500 to-gray-600'}`}>
                          <AvatarFallback className="text-sm font-bold text-white bg-transparent">{personaData?.avatar || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-white">{personaData?.name || 'Unknown'}</h3>
                          <p className="text-xs text-muted-foreground">{new Date(session.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={`text-3xl font-black ${getScoreColor(session.finalScore || 50)}`}>{session.finalScore || 50}%</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Settings
function SettingsPanel({ userEmail, onLogout }) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-white">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>
        <Card className="bg-[#0D0D1A] border border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-white">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-white">Email</p>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
            <Separator className="bg-border/50" />
            <Button variant="outline" onClick={onLogout} className="w-full">Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Request Team Access Modal
function RequestAccessModal({ email, onClose }) {
  const [company, setCompany] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company, teamSize, message })
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-[#0D0D1A] border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-[#F5A623]" />
            {submitted ? 'Request Received!' : 'Request Team Access'}
          </CardTitle>
          <CardDescription>
            {submitted ? "We'll be in touch within 24 hours." : "You've used your 3 free sessions. Unlock unlimited access for your team."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <Button onClick={onClose} className="w-full bg-[#E63946] hover:bg-[#E63946]/90">Close</Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Company name" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-[#0D0D1A] border-border/50 text-white" required />
              <Input placeholder="Team size (e.g., 10-50)" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="bg-[#0D0D1A] border-border/50 text-white" required />
              <textarea
                placeholder="Tell us about your training needs..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-24 px-3 py-2 bg-[#0D0D1A] border border-border/50 rounded-md text-sm text-white resize-none focus:outline-none focus:border-[#F5A623]"
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1 bg-[#E63946] hover:bg-[#E63946]/90" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Request Access'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Main App (inner, needs ConversationProvider above)
function SimulatePageInner() {
  const { user: clerkUser } = useUser()
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [scorecard, setScorecard] = useState(null)
  const [activeTab, setActiveTab] = useState('practice')
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [sessionsUsed, setSessionsUsed] = useState(0)

  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || ''

  const handlePersonaSelect = (personaId) => {
    if (sessionsUsed >= 3) {
      setShowAccessModal(true)
      return
    }
    setSelectedPersona(personaId)
    setScorecard(null)
  }

  const handleSessionUsed = async () => {
    try {
      const response = await fetch('/api/user/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, currentSessionsUsed: sessionsUsed })
      })
      const data = await response.json()
      setSessionsUsed(data.sessionsUsed)
    } catch (error) {
      setSessionsUsed(prev => prev + 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] flex">
      <AppSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          if (tab === 'practice') {
            setSelectedPersona(null)
            setScorecard(null)
          }
        }}
        sessionsUsed={sessionsUsed}
      />
      <div className="flex-1 flex flex-col">
        {activeTab === 'practice' && (
          <>
            {scorecard ? (
              <ResultsCard
                scorecard={scorecard}
                persona={selectedPersona}
                onTryAgain={() => { setSelectedPersona(null); setScorecard(null); setActiveTab('practice') }}
              />
            ) : selectedPersona ? (
              <ChatSimulator
                persona={selectedPersona}
                userEmail={userEmail}
                onBack={() => setSelectedPersona(null)}
                onShowResults={(results) => setScorecard(results)}
                onSessionUsed={handleSessionUsed}
              />
            ) : (
              <PersonaSelection onSelect={handlePersonaSelect} />
            )}
          </>
        )}
        {activeTab === 'history' && <SessionHistory userEmail={userEmail} />}
        {activeTab === 'settings' && <SettingsPanel userEmail={userEmail} onLogout={() => {}} />}
        <PrivacyFooter />
      </div>
      {showAccessModal && (
        <RequestAccessModal email={userEmail} onClose={() => setShowAccessModal(false)} />
      )}
    </div>
  )
}

// Wrap with ConversationProvider so useConversation works
export default function SimulatePage() {
  return (
    <ConversationProvider>
      <SimulatePageInner />
    </ConversationProvider>
  )
}
