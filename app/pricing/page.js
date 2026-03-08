import Link from 'next/link'
import { Target, Check, Star, HelpCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Pricing - RepReady',
  description: 'Simple, transparent pricing for RepReady AI-powered sales training simulator',
}

const pricingTiers = [
  {
    name: 'Starter',
    price: '₹4,999',
    period: '/month',
    description: 'Perfect for small sales teams getting started',
    features: [
      'Up to 5 reps',
      '2 personas',
      'Session history',
      'Email support'
    ],
    cta: 'Start Free Trial',
    ctaLink: '/',
    popular: false,
    highlight: false
  },
  {
    name: 'Growth',
    price: '₹14,999',
    period: '/month',
    description: 'For growing teams that need more power',
    features: [
      'Up to 25 reps',
      'All personas',
      'Manager dashboard',
      'Priority support'
    ],
    cta: 'Start Free Trial',
    ctaLink: '/',
    popular: true,
    highlight: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: ' pricing',
    description: 'For large organizations with custom needs',
    features: [
      'Unlimited reps',
      'Custom personas',
      'CRM integration',
      'Dedicated success manager',
      'SOC 2 ready'
    ],
    cta: 'Book a Demo',
    ctaLink: 'mailto:vrushalkitke123@gmail.com?subject=RepReady Enterprise Demo Request',
    popular: false,
    highlight: false
  }
]

const faqs = [
  {
    question: 'Is there a free trial?',
    answer: 'Yes, 3 sessions free, no credit card required.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, GDPR and DPDP compliant.'
  },
  {
    question: 'Do you offer annual billing?',
    answer: 'Yes, 20% discount on annual plans.'
  }
]

function FAQItem({ question, answer }) {
  return (
    <details className="group border-b border-border/50 last:border-0">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
        <span className="font-medium text-foreground">{question}</span>
        <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <p className="pb-4 text-muted-foreground">{answer}</p>
    </details>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-[#0A0F1E]/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#6366F1] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#0A0F1E]" />
            </div>
            <span className="text-xl font-bold">RepReady</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-[#00FF88] font-medium">
              Pricing
            </Link>
            <Link href="/">
              <Button className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white">
                Start Practicing
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Pricing Header */}
      <main className="flex-1 px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20">
              Simple Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose the right plan for your team
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with 3 free sessions. No credit card required. Upgrade when you&apos;re ready.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.name}
                className={`relative glass-card border-0 ${
                  tier.highlight 
                    ? 'ring-2 ring-[#6366F1] shadow-lg shadow-[#6366F1]/20' 
                    : ''
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#6366F1] text-white border-0 px-3 py-1">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-8 pb-4">
                  <CardTitle className="text-xl mb-2">{tier.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-[#00FF88]/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-[#00FF88]" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {tier.ctaLink.startsWith('mailto:') ? (
                    <a href={tier.ctaLink}>
                      <Button 
                        className={`w-full ${
                          tier.highlight 
                            ? 'bg-[#6366F1] hover:bg-[#6366F1]/90 text-white' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                        size="lg"
                      >
                        {tier.cta}
                      </Button>
                    </a>
                  ) : (
                    <Link href={tier.ctaLink}>
                      <Button 
                        className={`w-full ${
                          tier.highlight 
                            ? 'bg-[#6366F1] hover:bg-[#6366F1]/90 text-white' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                        size="lg"
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="w-12 h-12 rounded-full bg-[#6366F1]/10 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-6 h-6 text-[#6366F1]" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about RepReady pricing</p>
            </div>
            
            <Card className="glass-card border-0">
              <CardContent className="pt-6">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-4 px-6 bg-[#060A14]">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-muted-foreground transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
