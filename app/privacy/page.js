import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Privacy Policy - RepReady',
  description: 'Privacy Policy for RepReady AI-powered sales training simulator',
}

export default function PrivacyPolicy() {
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
            <h1 className="text-4xl font-bold mb-2 text-white">PRIVACY POLICY</h1>
            <p className="text-muted-foreground mb-8">Effective Date: March 7, 2026</p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to RepReady accessible at repready.site. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered sales training simulator.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect minimal personal information necessary to provide our service.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-white">Account Information:</strong> When you start your practice sessions, we collect your email address to create your profile and track your usage.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-white">Session Data:</strong> We collect the text inputs you provide during your simulated negotiations, the AI-generated responses, deal health scores, and usage metrics to generate your coaching feedback.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to provide, operate, and maintain the RepReady simulator, generate personalized sales coaching feedback and scorecards, manage your account and track your 3 free trial sessions, and respond to your customer service requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Processors</h2>
              <p className="text-muted-foreground leading-relaxed">
                RepReady utilizes the Google Gemini API to power our simulated procurement personas. By using our service, you acknowledge that your session data is transmitted to Google Cloud as a third-party processor to generate conversational responses. We restrict the transmission of personal data to only what is necessary for the simulation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your email and session data only for as long as your account is active or as reasonably necessary to fulfill the purposes outlined in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Privacy Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-white">GDPR (European Union):</strong> You have the right to access, rectify, or erase your personal data, restrict or object to our processing, and the right to data portability.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-white">CCPA (California, USA):</strong> You have the right to know what personal information we collect, the right to delete your data, and the right to opt-out of the sale or sharing of your personal information. RepReady does not sell your personal information.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-white">DPDP Act 2023 (India):</strong> You have the right to access a summary of your personal data, the right to correction and erasure, the right to readily available grievance redressal, and the right to withdraw your consent at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Data Deletion Requests</h2>
              <p className="text-muted-foreground leading-relaxed">
                You can request the complete deletion of your account, email address, and all associated session data at any time. Email us at <a href="mailto:vrushalkitke123@gmail.com" className="text-[#6366F1] hover:underline">vrushalkitke123@gmail.com</a> with the subject line "Data Deletion Request". We will process your request within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
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