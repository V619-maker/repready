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
  Mail
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
    personality: 'Curt, impatient, never shows genuine interest'
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
    personality: 'Polite on the surface, but always has objections'
  }
}

// Privacy Footer Component
function PrivacyFooter() {
  return (
    <footer className="border-t border-border/50 py-4 px-6 bg-[#060A14]">
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
          className={`${sizeClass} ${i < difficulty ? 'fill-[#00FF88] text-[#00FF88]' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

// Score trend indicator
function ScoreTrend({ currentScore, previousScore }) {
  const diff = currentScore - previousScore
  if (diff > 0) return <TrendingUp className="w-4 h-4 text-[#00FF88]" />
  if (diff < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
  return <Minus className="w-4 h-4 text-muted-foreground" />
}

// Get score color based on value
function getScoreColor(score) {
  if (score >= 70) return 'text-[#00FF88]'
  if (score >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

function getProgressColor(score) {
  if (score >= 70) return 'bg-[#00FF88]'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

// Get verdict styling
function getVerdictStyle(verdict) {
  const lower = verdict.toLowerCase()
  if (lower.startsWith('passed')) return { color: 'text-[#00FF88]', bg: 'bg-[#00FF88]/10', icon: Trophy }
  if (lower.startsWith('needs work')) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: AlertTriangle }
  return { color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle }
}

// Landing Page Component
function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#0A0F1E] grid-pattern flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-[#0A0F1E]/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#6366F1] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#0A0F1E]" />
            </div>
            <span className="text-xl font-bold">RepReady</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/pricing" className="text-sm text-muted-foreground hover:text-[#00FF88] transition-colors">
              Pricing
            </a>
            <Button 
              onClick={onGetStarted}
              className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white"
            >
              Start Practicing
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20 hover:bg-[#6366F1]/20">
            AI-Powered Sales Training
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your Reps Are Practicing on{' '}
            <span className="text-gradient">Real Deals.</span>
            <br />
            <span className="text-[#00FF88]">Stop That.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Practice the hardest sales conversations before they happen live.
          </p>

          <Button 
            onClick={onGetStarted}
            size="lg"
            className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white h-14 px-8 text-lg gap-2 glow-violet"
          >
            Start Free Practice Session
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24">
          <Card className="glass-card border-0">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-[#00FF88]/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#00FF88]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Zero-Risk Practice</h3>
              <p className="text-sm text-muted-foreground">
                Make mistakes in simulation, not in front of your biggest prospect. Every session is a safe space to fail forward.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#6366F1]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Real-Time Coaching</h3>
              <p className="text-sm text-muted-foreground">
                Get instant feedback on negotiation tactics. Our AI evaluates your responses and scores your performance live.
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Measurable Progress</h3>
              <p className="text-sm text-muted-foreground">
                Track improvement over time. See exactly where reps struggle and watch scores climb session over session.
              </p>
            </CardContent>
          </Card>
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

    if (!email || !email.includes('@')) {
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
    <div className="min-h-screen bg-[#0A0F1E] grid-pattern flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-[#0A0F1E]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#6366F1] flex items-center justify-center">
            <Target className="w-5 h-5 text-[#0A0F1E]" />
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
                  className="pl-10 h-12 bg-[#0A0F1E] border-border/50 focus:border-[#6366F1]"
                />
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={setConsent}
                  className="mt-1 border-border/50 data-[state=checked]:bg-[#6366F1] data-[state=checked]:border-[#6366F1]"
                />
                <label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to processing of my data per the{' '}
                  <a href="/privacy" className="text-[#6366F1] hover:underline">Privacy Policy</a>
                  {' '}and that sessions are not used to train AI models.
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-[#6366F1] hover:bg-[#6366F1]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Starting...' : 'Start Practice Session'}
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
            <Users className="w-5 h-5 text-[#6366F1]" />
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
            <Button onClick={onClose} className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90">
              Close
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-[#0A0F1E] border-border/50"
                required
              />
              <Input
                placeholder="Team size (e.g., 10-50)"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="bg-[#0A0F1E] border-border/50"
                required
              />
              <textarea
                placeholder="Tell us about your training needs..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-24 px-3 py-2 bg-[#0A0F1E] border border-border/50 rounded-md text-sm resize-none focus:outline-none focus:border-[#6366F1]"
              />
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#6366F1] hover:bg-[#6366F1]/90"
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
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 mx-auto flex items-center justify-center">
            <Award className="w-12 h-12 text-[#6366F1] animate-pulse" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-[#6366F1]/20 border-t-[#6366F1] animate-spin" />
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
              <Sparkles className="w-4 h-4 text-[#00FF88]" />
              <span>Performance Review</span>
              <Sparkles className="w-4 h-4 text-[#00FF88]" />
            </div>
            <CardTitle className="text-lg font-medium text-muted-foreground">
              Negotiation with {selectedPersona.name}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 pb-8">
            <div className="text-center py-6">
              <div className="relative inline-block">
                <div className={`text-8xl font-bold font-mono-score ${getScoreColor(scorecard.final_score)}`}>
                  {scorecard.final_score}
                </div>
                <div className="absolute -top-2 -right-4 text-2xl font-medium text-muted-foreground">/100</div>
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
              <div className="bg-[#00FF88]/5 border border-[#00FF88]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00FF88]" />
                  <h3 className="font-semibold text-[#00FF88]">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {scorecard.strengths?.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-[#00FF88] mt-1">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-red-500">Areas to Improve</h3>
                </div>
                <ul className="space-y-2">
                  {scorecard.improvements?.map((improvement, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-amber-500">Key Learning</h3>
              </div>
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{scorecard.biggest_mistake}&rdquo;
              </p>
            </div>

            <Button 
              onClick={onTryAgain} 
              size="lg" 
              className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 h-14 text-lg gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
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
    <div className="w-64 border-r border-border/50 bg-[#060A14] flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#6366F1] flex items-center justify-center">
            <Target className="w-5 h-5 text-[#0A0F1E]" />
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
                      ? 'bg-[#6366F1]/10 text-[#6366F1]' 
                      : item.active 
                        ? 'text-muted-foreground hover:bg-muted/50 hover:text-foreground' 
                        : 'text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-[#6366F1]/30 text-[#6366F1]">
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
            <span className="font-mono-score text-[#00FF88]">{3 - sessionsUsed}/3</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#00FF88] to-[#6366F1] rounded-full transition-all"
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

                <Button className="w-full bg-[#6366F1] hover:bg-[#6366F1]/90 group-hover:glow-violet">
                  Start Practice
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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
  const scrollRef = useRef(null)
  const selectedPersona = PERSONAS[persona]

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

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let latestObject = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk

        try {
          const jsonMatch = accumulatedText.match(/\{[^{}]*"message"[^{}]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            latestObject = parsed
            if (parsed.message) setStreamingMessage(parsed.message)
            if (typeof parsed.deal_health_score === 'number') {
              setPreviousScore(currentScore)
              setCurrentScore(parsed.deal_health_score)
            }
            if (parsed.score_reason) setScoreReason(parsed.score_reason)
          }
        } catch (e) {
          const msgMatch = accumulatedText.match(/"message"\s*:\s*"([^"]*)/)
          if (msgMatch && msgMatch[1]) setStreamingMessage(msgMatch[1])
        }
      }

      if (latestObject && latestObject.message) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: latestObject.message,
          score: latestObject.deal_health_score,
          reason: latestObject.score_reason
        }])
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: streamingMessage || 'Let me stop you there.',
          score: 50,
          reason: 'Response parsing error — score held steady'
        }])
      }
      setStreamingMessage('')

    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Let me stop you there.',
        score: 50,
        reason: 'Response parsing error — score held steady'
      }])
      setStreamingMessage('')
    } finally {
      setIsLoading(false)
    }
  }

  const endNegotiation = async () => {
    if (messages.length === 0) {
      alert('Start a conversation first before ending the negotiation.')
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

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let scorecard = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
      }

      await minLoadingTime

      try {
        let braceCount = 0
        let startIndex = -1
        let endIndex = -1
        
        for (let i = 0; i < accumulatedText.length; i++) {
          if (accumulatedText[i] === '{') {
            if (startIndex === -1) startIndex = i
            braceCount++
          } else if (accumulatedText[i] === '}') {
            braceCount--
            if (braceCount === 0 && startIndex !== -1) {
              endIndex = i + 1
              break
            }
          }
        }
        
        if (startIndex !== -1 && endIndex !== -1) {
          const jsonStr = accumulatedText.slice(startIndex, endIndex)
          scorecard = JSON.parse(jsonStr)
        }
      } catch (parseError) {
        console.error('Parse error:', parseError)
      }

      if (scorecard && scorecard.final_score) {
        // Save session
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            persona,
            messages,
            scorecard,
            finalScore: scorecard.final_score
          })
        })
        onShowResults(scorecard)
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

  if (isEndingNegotiation) {
    return <ScorecardLoading personaName={selectedPersona.name} />
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border/50 bg-[#060A14]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={`w-10 h-10 bg-gradient-to-br ${selectedPersona.color}`}>
              <AvatarFallback className="text-sm font-bold text-white bg-transparent">
                {selectedPersona.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">Negotiation with {selectedPersona.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedPersona.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              <div className="text-xs text-muted-foreground mb-1">Deal Health</div>
              <div className="flex items-center gap-2">
                <ScoreTrend currentScore={currentScore} previousScore={previousScore} />
                <span className={`text-2xl font-bold font-mono-score ${getScoreColor(currentScore)}`}>
                  {currentScore}%
                </span>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={endNegotiation}
              disabled={isLoading || messages.length === 0}
              className="gap-2"
            >
              <StopCircle className="w-4 h-4" />
              End Session
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
            {messages.length === 0 && !streamingMessage && (
              <div className="text-center py-12">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedPersona.color} mx-auto mb-4 flex items-center justify-center`}>
                  <span className="text-3xl font-bold text-white">{selectedPersona.avatar}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Your Negotiation</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You&apos;re about to pitch a $50,000 SaaS contract to {selectedPersona.name}. 
                  Make your opening statement to begin.
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[#6366F1] text-white rounded-br-md'
                      : 'glass rounded-bl-md'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#00FF88]">{selectedPersona.name}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3 glass">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#00FF88]">{selectedPersona.name}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{streamingMessage}</p>
                </div>
              </div>
            )}

            {isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{selectedPersona.name} is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50 bg-[#060A14]">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Make your pitch or respond to objections..."
              className="flex-1 bg-muted/30 border-border/50 focus:border-[#6366F1] h-12"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !inputValue.trim()} 
              className="bg-[#6366F1] hover:bg-[#6366F1]/90 h-12 px-6"
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
                        <div className={`text-2xl font-bold font-mono-score ${getScoreColor(session.finalScore || 50)}`}>
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
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
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
    <div className="min-h-screen bg-[#0A0F1E] flex">
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
