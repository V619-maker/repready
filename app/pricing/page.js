import Link from 'next/link'
import { Check, ChevronDown } from 'lucide-react'

export const metadata = {
  title: 'Pricing — RepReady AI Sales Negotiation Simulator',
  description: 'Simple per-seat pricing for RepReady. Start free, no credit card required. Volume discounts at 15+ seats. Processed via Paddle for India and globally.',
}

const pricingTiers = [
  {
    name: 'Starter',
    price: '$49',
    period: '/seat/mo',
    description: '5–14 seats. For teams getting started with AI sales training.',
    features: [
      'All core scenarios',
      'AI Coach post-call debrief',
      'Deal health scoring',
      'Text-based buyer personas',
    ],
    notIncluded: [
      'Voice personas (Richard & Sandra)',
      'Manager analytics dashboard',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/simulate',
    popular: false,
  },
  {
    name: 'Growth',
    price: '$79',
    period: '/seat/mo',
    description: '5–14 seats. Full voice AI and real-time coaching for serious teams.',
    features: [
      'Everything in Starter',
      'Richard & Sandra voice personas',
      'Real-time coaching mid-call',
      'Pre-call briefing mode',
      'Manager analytics dashboard',
    ],
    notIncluded: [
      'Custom scenarios',
    ],
    cta: 'Start Free Trial',
    ctaLink: '/simulate',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: '15+ seats. Volume pricing, custom scenarios, dedicated onboarding.',
    features: [
      'Everything in Growth',
      'Custom buyer personas',
      'Custom scenario builder',
      'Dedicated onboarding',
      'SLA + priority support',
      'MSA included',
    ],
    notIncluded: [],
    cta: 'Talk to Sales',
ctaLink: 'mailto:sales@repready.site?subject=RepReady%20Enterprise%20Enquiry',
    popular: false,
  },
]

const faqs = [
  {
    question: 'Is there a free trial?',
    answer: 'Yes — you can start simulating with no credit card required. Free access gives you core scenarios so your team can evaluate RepReady before committing.',
  },
  {
    question: 'What is the minimum team size?',
    answer: 'RepReady is priced per seat with a minimum of 5 seats. It\'s designed for sales teams, not individual reps.',
  },
  {
    question: 'How does billing work?',
    answer: 'Payments are processed via Paddle, which handles invoicing and tax for India, Southeast Asia, and globally. You\'ll receive a proper invoice every billing cycle.',
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel at any time. Your access continues until the end of your current billing period.',
  },
  {
    question: 'Do you offer volume discounts?',
    answer: 'Yes — volume discounts apply at 15+ seats. Contact us for Enterprise pricing if your team is larger.',
  },
  {
    question: 'Is our data private?',
    answer: 'Yes. All session data is encrypted in transit and at rest. Your team\'s recordings and coaching data are never used to train AI models without your explicit written consent.',
  },
]

function FAQItem({ question, answer }) {
  return (
    <details className="group border-b border-slate-100 last:border-0">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none">
        <span className="font-semibold text-slate-800 text-sm">{question}</span>
        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" />
      </summary>
      <p className="pb-4 text-slate-500 text-sm leading-relaxed">{answer}</p>
    </details>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-10 text-center">
        <span className="inline-block bg-cyan-50 text-cyan-700 border border-cyan-200 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
          Pricing
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
          Simple per-seat pricing.<br className="hidden md:block" /> No surprises.
        </h1>
        <p className="text-slate-500 text-base max-w-lg mx-auto font-light">
          Minimum 5 seats. Volume discounts at 15+. Start free — no card needed.
          Processed via Paddle for India and globally.
        </p>
      </div>

      {/* ── PRICING CARDS ── */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl p-7 flex flex-col transition-all duration-200 hover:-translate-y-1 ${
                tier.popular
                  ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-100'
                  : 'border border-slate-200 hover:border-cyan-200 hover:shadow-md'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{tier.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`font-black text-slate-900 leading-none ${tier.price === 'Custom' ? 'text-3xl' : 'text-4xl'}`}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-slate-400 text-sm font-normal mb-1">{tier.period}</span>
                  )}
                </div>
                <p className="text-slate-500 text-xs leading-snug">{tier.description}</p>
              </div>

              <div className="border-t border-slate-100 pt-5 mb-6 flex-1">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <span className="w-4 h-4 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-cyan-500" strokeWidth={3} />
                      </span>
                      {feature}
                    </li>
                  ))}
                  {tier.notIncluded.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-300 text-xs leading-none">✗</span>
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {tier.ctaLink.startsWith('mailto:') ? (
                <a href={tier.ctaLink}>
                  <button className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
                    tier.popular
                      ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}>
                    {tier.cta}
                  </button>
                </a>
              ) : (
                <Link href={tier.ctaLink}>
                  <button className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
                    tier.popular
                      ? 'bg-cyan-500 text-white hover:bg-cyan-400'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}>
                    {tier.cta}
                  </button>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* ── PADDLE NOTE ── */}
        <p className="text-center text-xs text-slate-400 mt-6">
          All plans billed in USD. Payments processed by Paddle — includes proper invoicing for Indian and global companies.
          Enterprise plans include an MSA and SLA.
        </p>
      </div>

      {/* ── FAQ ── */}
      <div className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-black text-slate-900 text-center mb-8 tracking-tight">
          Questions before you commit
        </h2>
        <div className="bg-white rounded-2xl border border-slate-200 px-7 py-2">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>

      {/* ── CTA STRIP ── */}
      <div className="bg-slate-900 py-12 px-6 text-center">
        <h2 className="text-white font-black text-xl mb-2 tracking-tight">
          Not sure which plan fits?
        </h2>
        <p className="text-slate-400 text-sm mb-6 font-light">
          Start free — no card needed. Or talk to us if you have a team of 15+.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/simulate">
            <button className="bg-cyan-500 text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-cyan-400 transition-all">
              Start Free Trial
            </button>
          </Link>
         <a href="mailto:sales@repready.site?subject=RepReady%20Enterprise%20Enquiry">
            <button className="bg-transparent text-slate-300 font-semibold text-sm px-6 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-all">
              Talk to Sales
            </button>
          </a>
        </div>
      </div>

    </div>
  )
}
