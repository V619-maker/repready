export const metadata = {
  title: 'Terms of Service — RepReady',
  description: 'RepReady terms of service. Your agreement with RepReady.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <div className="bg-white border-b border-slate-100 px-6 py-12 text-center">
        <span className="inline-block bg-cyan-50 text-cyan-700 border border-cyan-200 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Legal</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Terms of Service</h1>
        <p className="text-slate-400 text-sm">Effective Date: March 7, 2026</p>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8">
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p className="text-slate-500 text-sm leading-relaxed">By accessing or using RepReady at repready.site, you agree to be bound by these Terms of Service. If you do not agree, do not use the product.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">2. Description of Service</h2>
            <p className="text-slate-500 text-sm leading-relaxed">RepReady is an AI-powered B2B sales negotiation simulator. It provides voice-to-voice simulation sessions with AI buyer personas, real-time coaching, and post-call scoring. The service is designed for sales training purposes only.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">3. Accounts and Credits</h2>
            <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 leading-relaxed">
              <li>New users receive 3 free simulation sessions upon signup</li>
              <li>Additional sessions require a paid plan</li>
              <li>Credits are non-transferable and non-refundable</li>
              <li>You are responsible for all activity under your account</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">4. Acceptable Use</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 leading-relaxed">
              <li>Use RepReady for any unlawful purpose</li>
              <li>Attempt to reverse engineer, scrape, or extract AI model data</li>
              <li>Share account credentials with others</li>
              <li>Use the service to harass, deceive, or harm others</li>
              <li>Attempt to circumvent credit or session limits</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">5. Payments and Billing</h2>
            <p className="text-slate-500 text-sm leading-relaxed">Paid plans are billed per seat per month. Payments are processed by Paddle. All prices are in USD unless stated otherwise. Subscriptions renew automatically unless cancelled. Cancellations take effect at the end of the current billing period.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">6. Intellectual Property</h2>
            <p className="text-slate-500 text-sm leading-relaxed">All content, AI personas, scenarios, coaching frameworks, and product design are the intellectual property of RepReady. You may not reproduce, distribute, or create derivative works without written permission.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-slate-500 text-sm leading-relaxed">RepReady is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that AI coaching feedback will result in improved sales performance.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">8. Limitation of Liability</h2>
            <p className="text-slate-500 text-sm leading-relaxed">To the maximum extent permitted by law, RepReady shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">9. Changes to Terms</h2>
            <p className="text-slate-500 text-sm leading-relaxed">We may update these terms at any time. Continued use of RepReady after changes constitutes acceptance of the new terms. We will notify users of material changes by email.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">10. Contact</h2>
            <p className="text-slate-500 text-sm leading-relaxed">For questions about these terms, contact <a href="mailto:sales@repready.site" className="text-cyan-600 hover:underline">sales@repready.site</a></p>
          </div>
        </div>
      </div>
      <div className="text-center pb-12">
        <a href="/" className="text-sm text-cyan-600 hover:underline">← Back to RepReady</a>
      </div>
    </div>
  )
}
