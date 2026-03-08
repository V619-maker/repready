import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Terms of Service - RepReady',
  description: 'Terms of Service for RepReady AI-powered sales training simulator',
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm bg-[#0A0F1E]/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00FF88] to-[#6366F1] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#0A0F1E]" />
            </div>
            <span className="text-xl font-bold">RepReady</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-invert prose-lg max-w-none">
            <h1 className="text-4xl font-bold mb-2 text-white">TERMS OF SERVICE</h1>
            <p className="text-muted-foreground mb-8">Effective Date: March 7, 2026</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using RepReady at repready.site, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. SaaS Usage and Free Trial</h2>
              <p className="text-muted-foreground leading-relaxed">
                RepReady provides an AI-powered B2B sales negotiation simulator. We offer new users 3 free practice sessions associated with their registered email address. Once these free sessions are exhausted, further access requires an active subscription or upgrade to a paid team plan.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree to use RepReady strictly for professional sales training. You may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Reverse engineer or attempt to extract the source code or underlying AI prompts of the service</li>
                <li>Input sensitive personal information into the chat simulator</li>
                <li>Use the service to generate harmful, illegal, or abusive content</li>
                <li>Attempt to bypass the 3-session trial limit through automated or fraudulent accounts</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. No Liability for Training Outcomes</h2>
              <p className="text-muted-foreground leading-relaxed">
                RepReady is a simulated educational tool. We make no representations, warranties, or guarantees that using RepReady will result in actual closed deals, improved sales quotas, or higher win rates. The AI personas are simulations and may not accurately reflect real-world procurement officers. RepReady and its creators shall not be held liable for any lost revenue, failed negotiations, or business damages resulting from tactics practiced on our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All rights, title, and interest in and to the RepReady platform, including its design, branding, and proprietary persona prompts, remain the exclusive property of RepReady.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your access at any time without notice for conduct that violates these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Email: <a href="mailto:vrushalkitke123@gmail.com" className="text-[#6366F1] hover:underline">vrushalkitke123@gmail.com</a>
              </p>
            </section>
          </article>
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