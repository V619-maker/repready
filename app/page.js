'use client'

import { useState, useEffect, useRef } from 'react'
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
  Briefcase
} from 'lucide-react'

// Persona data
const PERSONAS = {
  richard: {
    id: 'richard',
    name: 'Richard',
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
    name: 'Sandra',
    title: 'IT Director',
    company: '800-person financial firm',
    difficulty: 4,
    avatar: 'S',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    description: 'Aggressively protects her team\'s bandwidth. Every response contains a blocker.',
    tactics: ['Claims zero implementation capacity', 'Demands SOC 2 Type II', 'Requires native SAML/SSO'],
    personality: 'Polite on the surface, but always has objections',
    firstMessage: "I've got a few minutes before my next meeting. We're looking at tools like yours, but my team has zero bandwidth for implementation this quarter. What makes you different from the other three vendors I'm evaluating?"
  }
}

// Coaching tips based on message count
const COACHING_TIPS = {
  early: "Tip: Don't mention price yet. Ask Richard about his biggest challenge with his current vendor first.",
  mid: "Tip: If Richard pushes on price, redirect to ROI. What does a bad vendor cost him per quarter?",
  late: "Tip: Create urgency by highlighting what competitors are doing. Don't beg — position yourself as the solution."
}

// Privacy Footer Component
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

// Star rating component
function DifficultyStars({ difficulty, size = 'default' }) {
  const sizeClass = size === 'small' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${i < difficulty ? 'fill-[#F5A623] text-[#F5A623]' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

// Score trend indicator
function ScoreTrend({ currentScore, previousScore }) {
  const diff = currentScore - previousScore
  if (diff > 0) return <TrendingUp className="w-5 h-5 text-[#F5A623]" />
  if (diff < 0) return <TrendingDown className="w-5 h-5 text-[#E63946]" />
  return <Minus className="w-5 h-5 text-muted-foreground" />
}

// Get score color based on value - Updated for amber/red
function getScoreColor(score) {
  if (score >= 70) return 'text-[#22C55E]'
  if (score >= 40) return 'text-[#F5A623]'
  return 'text-[#E63946]'
}

function getProgressColor(score) {
  if (score >= 70) return 'bg-[#22C55E]'
  if (score >= 40) return 'bg-[#F5A623]'
  return 'bg-[#E63946]'
}

// Get verdict styling
function getVerdictStyle(verdict) {
  const lower = verdict.toLowerCase()
  if (lower.startsWith('passed')) return { color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', icon: Trophy }
  if (lower.startsWith('needs work')) return { color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/10', icon: AlertTriangle }
  return { color: 'text-[#E63946]', bg: 'bg-[#E63946]/10', icon: XCircle }
}

// Demo Conversation Card Component
function DemoCard({ type, score, label, repMessage, richardReply }) {
  const isWrong = type === 'wrong'
  const bgColor = isWrong ? 'bg-[#E63946]/5' : 'bg-[#22C55E]/5'
  const borderColor = isWrong ? 'border-[#E63946]/20' : 'border-[#22C55E]/20'
  const labelColor = isWrong ? 'text-[#E63946]' : 'text-[#22C55E]'
  const barColor = isWrong ? 'bg-[#E63946]' : 'bg-[#22C55E]'
  
  return (
    <Card className={`${bgColor} border ${borderColor}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className={`${labelColor} border-current`}>
            {label}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${score}%` }} />
            </div>
            <span className={`text-sm font-mono-score font-bold ${labelColor}`}>{score}%</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="bg-[#6366F1] text-white rounded-2xl rounded-br-md px-3 py-2 max-w-[85%]">
              <p className="text-sm">{repMessage}</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="glass richard-bubble rounded-2xl rounded-bl-md px-3 py-2 max-w-[85%]">
              <p className="text-xs font-semibold text-[#F5A623] mb-1">Richard</p>
              <p className="text-sm">{richardReply}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Landing Page Component - REDESIGNED
function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0D0D1A] grid-pattern flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-[#0D0D1A]/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#E63946] flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">RepReady</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/pricing" className="text-sm text-muted-foreground hover:text-[#F5A623] transition-colors">
              Pricing
            </a>
            <Button 
              onClick={onGetStarted}
              className="bg-[#E63946] hover:bg-[#E63946]/90 text-white"
            >
              Challenge Richard Free →
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20 hover:bg-[#F5A623]/20">
              <Users className="w-3 h-3 mr-1" />
              Sessions Completed: 47
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
              Your Reps Are Practicing on{' '}
              <span className="text-gradient">Real Deals.</span>
              <br />
              <span className="text-[#E63946]">Stop That.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
              Practice the hardest sales conversations before they happen live.
            </p>
            
            <p className="text-lg text-[#F5A623] mb-8 max-w-2xl mx-auto font-medium">
              Richard, our AI VP Procurement, has an average opponent score of 34%. Most reps don&apos;t last 3 messages.
            </p>

            <Button 
              onClick={onGetStarted}
              size="lg"
              className="bg-[#E63946] hover:bg-[#E63946]/90 text-white h-14 px-8 text-lg gap-2 glow-red"
            >
              Challenge Richard Free →
            </Button>
          </div>

          {/* See What You're Up Against Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">See What You&apos;re Up Against</h2>
              <p className="text-muted-foreground">One wrong move and Richard smells blood. Here&apos;s how it plays out.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <DemoCard 
                type="wrong"
                score={15}
                label="Wrong Move"
                repMessage="I can do 20% off if you sign today."
                richardReply="Discount noted. I also need Net-90 terms or we're done."
              />
              <DemoCard 
                type="right"
                score={72}
                label="Right Move"
                repMessage="Before we discuss price — what's your biggest challenge with your current vendor?"
                richardReply="Fine. Delivery timelines are a problem. But I still need movement on price."
              />
            </div>
            
            <div className="text-center mt-8">
              <Button 
                onClick={onGetStarted}
                size="lg"
                className="bg-[#E63946] hover:bg-[#E63946]/90 text-white h-14 px-8 text-lg gap-2 glow-red"
              >
                Challenge Richard Free →
              </Button>
            </div>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-[#F5A623]/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#F5A623]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Zero-Risk Practice</h3>
                <p className="text-sm text-muted-foreground">
                  Make mistakes in simulation, not in front of your biggest prospect. Every session is a safe space to fail forward.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-[#E63946]/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-[#E63946]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Real-Time Coaching</h3>
                <p className="text-sm text-muted-foreground">
                  Get instant feedback on negotiation tactics. Our AI evaluates your responses and scores your performance live.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-[#6366F1]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Measurable Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Track improvement over time. See exactly where reps struggle and watch scores climb session over session.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PrivacyFooter />
    </div>
  )
}

// Email Gate Component
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

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      onComplete({ email: data.email, sessionsUsed: data.sessionsUsed })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D1A] grid-pattern flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-[#0D0D1A]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#E63946] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">RepReady</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md glass-card border-0">
          <CardHeader className="text-center pb-2">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${persona.color} mx-auto mb-4 flex items-center justify-center`}>
              <span className="text-3xl font-bold text-white">{persona.avatar}</span>
            </div>
            <CardTitle className="text-2xl">Battle-test your skills</CardTitle>
            <CardDescription className="text-base">
              against {persona.name}. Enter your email to begin.
            </CardDescription>
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
                  className="pl-10 h-12 bg-[#0D0D1A] border-border/50 focus:border-[#F5A623]"
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

              {error && (
                <p className="text-sm text-[#E63946]">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-[#E63946] hover:bg-[#E63946]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Starting...' : 'Challenge Richard Free →'}
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

// Pre-Call Briefing Screen - NEW
function PreCallBriefing({ persona, onStartCall }) {
  const selectedPersona = PERSONAS[persona]
  
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl glass-card border-0">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F5A623] to-[#E63946] mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Pre-Call Briefing</CardTitle>
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
                <p className="text-sm text-muted-foreground">{selectedPersona.name} has 3 competing vendors on his shortlist.</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onStartCall}
            size="lg"
            className="w-full h-14 bg-[#E63946] hover:bg-[#E63946]/90 text-white text-lg mt-6"
          >
            Start The Call →
          </Button>
        </CardContent>
      </Card>
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
      <Card className="w-full max-w-md glass-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F5A623]" />
            {submitted ? 'Request Received!' : 'Request Team Access'}
          </CardTitle>
          <CardDescription>
            {submitted 
              ? 'We\'ll be in touch within 24 hours.'
              : 'You\'ve used your 3 free sessions. Unlock unlimited access for your team.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <Button onClick={onClose} className="w-full bg-[#E63946] hover:bg-[#E63946]/90">
              Close
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-[#0D0D1A] border-border/50"
                required
              />
              <Input
                placeholder="Team size (e.g., 10-50)"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="bg-[#0D0D1A] border-border/50"
                required
              />
              <textarea
                placeholder="Tell us about your training needs..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-24 px-3 py-2 bg-[#0D0D1A] border border-border/50 rounded-md text-sm resize-none focus:outline-none focus:border-[#F5A623]"
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#E63946] hover:bg-[#E63946]/90"
                  disabled={isSubmitting}
                >
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

// Animated loading component for scorecard
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
        <h2 className="text-2xl font-bold mb-2">{personaName} is reviewing your performance{dots}</h2>
        <p className="text-muted-foreground">Analyzing negotiation tactics and strategies</p>
      </div>
    </div>
  )
}

// Premium Results Card
function ResultsCard({ scorecard, persona, onTryAgain }) {
  const selectedPersona = PERSONAS[persona]
  const verdictStyle = getVerdictStyle(scorecard.verdict)
  const VerdictIcon = verdictStyle.icon

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card className="glass-card border-0 overflow-hidden">
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
                <div className={`text-9xl font-black font-mono-score ${getScoreColor(scorecard.final_score)}`}>
                  {scorecard.final_score}
                </div>
                <div className="absolute -top-2 -right-6 text-3xl font-bold text-muted-foreground">/100</div>
              </div>
            </div>

            <div className={`${verdictStyle.bg} rounded-xl p-4 text-center border border-${verdictStyle.color.replace('text-', '')}/20`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <VerdictIcon className={`w-5 h-5 ${verdictStyle.color}`} />
                <span className={`font-bold text-lg ${verdictStyle.color}`}>
                  {scorecard.verdict.split(':')[0]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {scorecard.verdict}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  <h3 className="font-semibold text-[#22C55E]">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {scorecard.strengths?.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[#22C55E] mt-1">•</span>
                      <span>{strength}</span>
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
                  {scorecard.improvements?.map((improvement, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[#E63946] mt-1">•</span>
                      <span>{improvement}</span>
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
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{scorecard.biggest_mistake}&rdquo;
              </p>
            </div>

            <Button 
              onClick={onTryAgain} 
              size="lg" 
              className="w-full bg-[#E63946] hover:bg-[#E63946]/90 h-14 text-lg gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Challenge Richard Free →
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              RepReady • Powered by Gemini
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// App Sidebar Component
function AppSidebar({ activeTab, onTabChange, sessionsUsed }) {
  const navItems = [
    { id: 'practice', label: 'Practice Lab', icon: Beaker, active: true },
    { id: 'history', label: 'Session History', icon: History, active: true },
    { id: 'analytics', label: 'Team Analytics', icon: Users, badge: 'Coming Soon', active: false },
    { id: 'settings', label: 'Settings', icon: Settings, active: true },
  ]

  return (
    <div className="w-64 border-r border-border/50 bg-[#0A0A12] flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#E63946] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">RepReady</span>
        </div>
      </div>

      {/* Navigation */}
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
                    isActive 
                      ? 'bg-[#F5A623]/10 text-[#F5A623]' 
                      : item.active 
                        ? 'text-muted-foreground hover:bg-muted/50 hover:text-foreground' 
                        : 'text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#F5A623]/30 text-[#F5A623]">
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Session Counter */}
      <div className="p-4 border-t border-border/50">
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Free Sessions</span>
            <span className="font-mono-score text-[#F5A623]">{3 - sessionsUsed}/3</span>
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

// Persona Selection (inside Practice Lab)
function PersonaSelection({ onSelect }) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Practice Lab</h1>
          <p className="text-muted-foreground">
            Practice the hardest sales conversations before they happen live.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {Object.values(PERSONAS).map((persona) => (
            <Card 
              key={persona.id}
              className="glass-card border-0 cursor-pointer transition-all duration-300 hover:scale-[1.02] group"
              onClick={() => onSelect(persona.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className={`w-14 h-14 bg-gradient-to-br ${persona.color}`}>
                    <AvatarFallback className="text-lg font-bold text-white bg-transparent">
                      {persona.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg">{persona.name}</h3>
                      <DifficultyStars difficulty={persona.difficulty} size="small" />
                    </div>
                    <p className="text-sm text-muted-foreground">{persona.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 bg-muted/30 rounded-lg px-3 py-2">
                  <Building2 className="w-3 h-3" />
                  <span>{persona.company}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {persona.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {persona.tactics.map((tactic, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-border/50">
                      {tactic}
                    </Badge>
                  ))}
                </div>

                <Button className="w-full bg-[#E63946] hover:bg-[#E63946]/90 group-hover:glow-red text-white">
                  Challenge {persona.name} Free →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Coaching Tip Bar Component
function CoachingTipBar({ messageCount }) {
  let tip = COACHING_TIPS.early
  if (messageCount >= 3) {
    tip = COACHING_TIPS.mid
  }
  if (messageCount >= 6) {
    tip = COACHING_TIPS.late
  }
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#F5A623]/10 border-t border-[#F5A623]/20">
      <Lightbulb className="w-4 h-4 text-[#F5A623] flex-shrink-0" />
      <p className="text-xs text-[#F5A623]">{tip}</p>
    </div>
  )
}

// Chat Simulator
function ChatSimulator({ persona, userEmail, onBack, onShowResults, onSessionUsed }) {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentScore, setCurrentScore] = useState(50)
  const [previousScore, setPreviousScore] = useState(50)
  const [scoreReason, setScoreReason] = useState('Deal starts at neutral — make your pitch.')
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isEndingNegotiation, setIsEndingNegotiation] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showBriefing, setShowBriefing] = useState(true)
  const scrollRef = useRef(null)
  const selectedPersona = PERSONAS[persona]

  // Start the call - Richard sends first message
  const startCall = () => {
    setShowBriefing(false)
    // Add Richard's first message
    setMessages([{
      role: 'assistant',
      content: selectedPersona.firstMessage,
      score: 50,
      reason: 'Opening — Richard sets the tone. Handle this carefully.'
    }])
    setScoreReason('Opening — Richard sets the tone. Handle this carefully.')
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, streamingMessage])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    // Mark session as started on first message
    if (!sessionStarted) {
      setSessionStarted(true)
      onSessionUsed()
    }

    const userMessage = { role: 'user', content: inputValue.trim() }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setIsLoading(true)
    setStreamingMessage('')

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
        if (typeof data.deal_health_score === 'number') {
          setCurrentScore(data.deal_health_score)
        }
        if (data.score_reason) {
          setScoreReason(data.score_reason)
        }
        
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
        reason: 'Response parsing error — score held steady'
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
        // Save session
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            persona,
            messages,
            scorecard: data,
            finalScore: data.final_score
          })
        })
        onShowResults(data)
      } else {
        onShowResults({
          final_score: currentScore,
          verdict: currentScore >= 70 ? "Passed — Good effort in a challenging negotiation." : currentScore >= 40 ? "Needs Work — Some good moments but room for improvement." : "Failed — The deal slipped away.",
          strengths: ["Participated actively in the negotiation", "Showed willingness to engage"],
          improvements: ["Work on handling objections more effectively", "Build stronger value propositions"],
          biggest_mistake: "Unable to generate detailed analysis — try again for full feedback."
        })
      }

    } catch (error) {
      console.error('Scorecard error:', error)
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

  if (showBriefing) {
    return <PreCallBriefing persona={persona} onStartCall={startCall} />
  }

  if (isEndingNegotiation) {
    return <ScorecardLoading personaName={selectedPersona.name} />
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border/50 bg-[#0A0A12]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={`w-10 h-10 bg-gradient-to-br ${selectedPersona.color}`}>
              <AvatarFallback className="text-sm font-bold text-white bg-transparent">
                {selectedPersona.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">Live Call with {selectedPersona.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedPersona.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Larger Score Display */}
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Deal Health</div>
              <div className="flex items-center gap-2">
                <ScoreTrend currentScore={currentScore} previousScore={previousScore} />
                <span className={`text-4xl font-black font-mono-score ${getScoreColor(currentScore)}`}>
                  {currentScore}%
                </span>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={endNegotiation}
              disabled={isLoading || messages.length <= 1}
              className="gap-2 bg-[#E63946] hover:bg-[#E63946]/90"
            >
              <StopCircle className="w-4 h-4" />
              End Call
            </Button>
          </div>
        </div>
      </div>

      {/* Score Reason Bar */}
      <div className="px-4 py-2 bg-muted/20 border-b border-border/50">
        <p className="text-xs text-muted-foreground italic text-center">
          &ldquo;{scoreReason}&rdquo;
        </p>
      </div>

      {/* Chat Area with gradient border */}
      <div className="flex-1 relative gradient-border rounded-none">
        <ScrollArea className="h-full p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#6366F1] text-white rounded-br-md'
                      : 'glass richard-bubble rounded-bl-md'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#F5A623]">{selectedPersona.name}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="glass richard-bubble rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Coaching Tip Bar */}
      <CoachingTipBar messageCount={messages.filter(m => m.role === 'user').length} />

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-[#0A0A12]">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Respond to Richard..."
              className="flex-1 bg-muted/30 border-border/50 focus:border-[#F5A623] h-12"
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
            <Button variant="ghost" disabled className="gap-2 text-muted-foreground/50 cursor-not-allowed">
              <Mic className="w-4 h-4" />
              <span className="text-sm">Voice Mode (Pro)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Session History Component
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
          <h1 className="text-2xl font-bold mb-2">Session History</h1>
          <p className="text-muted-foreground">
            Review your past practice sessions and track your progress.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <Card className="glass-card border-0">
            <CardContent className="py-12 text-center">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No sessions yet</h3>
              <p className="text-sm text-muted-foreground">
                Start a practice session to see your history here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const personaData = PERSONAS[session.persona]
              return (
                <Card key={session.id} className="glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-10 h-10 bg-gradient-to-br ${personaData?.color || 'from-gray-500 to-gray-600'}`}>
                          <AvatarFallback className="text-sm font-bold text-white bg-transparent">
                            {personaData?.avatar || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{personaData?.name || 'Unknown'}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-black font-mono-score ${getScoreColor(session.finalScore || 50)}`}>
                          {session.finalScore || 50}%
                        </div>
                        <p className="text-xs text-muted-foreground">{session.messages?.length || 0} messages</p>
                      </div>
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

// Settings Component
function SettingsPanel({ userEmail, onLogout }) {
  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences.
          </p>
        </div>

        <Card className="glass-card border-0 mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
            <Separator className="bg-border/50" />
            <Button variant="outline" onClick={onLogout} className="w-full">
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">About RepReady</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Practice the hardest sales conversations before they happen live.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Main App Component
export default function App() {
  const [screen, setScreen] = useState('landing') // landing, emailGate, app
  const [user, setUser] = useState(null)
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [scorecard, setScorecard] = useState(null)
  const [activeTab, setActiveTab] = useState('practice')
  const [showAccessModal, setShowAccessModal] = useState(false)

  // Check for existing user in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('repready_user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setScreen('app')
    }
  }, [])

  const handleGetStarted = () => {
    setScreen('emailGate')
  }

  const handleEmailComplete = (userData) => {
    setUser(userData)
    localStorage.setItem('repready_user', JSON.stringify(userData))
    setScreen('app')
  }

  const handlePersonaSelect = (personaId) => {
    if (user.sessionsUsed >= 3) {
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
        body: JSON.stringify({ 
          email: user.email,
          currentSessionsUsed: user.sessionsUsed || 0
        })
      })
      const data = await response.json()
      const updatedUser = { ...user, sessionsUsed: data.sessionsUsed }
      setUser(updatedUser)
      localStorage.setItem('repready_user', JSON.stringify(updatedUser))
    } catch (error) {
      console.error('Error updating session count:', error)
      // Update locally even if API fails
      const updatedUser = { ...user, sessionsUsed: (user.sessionsUsed || 0) + 1 }
      setUser(updatedUser)
      localStorage.setItem('repready_user', JSON.stringify(updatedUser))
    }
  }

  const handleShowResults = (results) => {
    setScorecard(results)
  }

  const handleTryAgain = () => {
    setSelectedPersona(null)
    setScorecard(null)
    setActiveTab('practice')
  }

  const handleLogout = () => {
    localStorage.removeItem('repready_user')
    setUser(null)
    setScreen('landing')
    setSelectedPersona(null)
    setScorecard(null)
  }

  // Landing Page
  if (screen === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />
  }

  // Email Gate
  if (screen === 'emailGate') {
    return <EmailGate onComplete={handleEmailComplete} selectedPersona={selectedPersona} />
  }

  // Main App with Sidebar
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
        sessionsUsed={user?.sessionsUsed || 0}
      />

      <div className="flex-1 flex flex-col">
        {activeTab === 'practice' && (
          <>
            {scorecard ? (
              <ResultsCard 
                scorecard={scorecard} 
                persona={selectedPersona} 
                onTryAgain={handleTryAgain} 
              />
            ) : selectedPersona ? (
              <ChatSimulator 
                persona={selectedPersona}
                userEmail={user?.email}
                onBack={() => setSelectedPersona(null)}
                onShowResults={handleShowResults}
                onSessionUsed={handleSessionUsed}
              />
            ) : (
              <PersonaSelection onSelect={handlePersonaSelect} />
            )}
          </>
        )}

        {activeTab === 'history' && (
          <SessionHistory userEmail={user?.email} />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel userEmail={user?.email} onLogout={handleLogout} />
        )}

        <PrivacyFooter />
      </div>

      {showAccessModal && (
        <RequestAccessModal 
          email={user?.email} 
          onClose={() => setShowAccessModal(false)} 
        />
      )}
    </div>
  )
}
