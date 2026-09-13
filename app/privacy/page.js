export const metadata = {
  title: 'Privacy Policy — RepReady',
  description: 'RepReady privacy policy. How we collect, use, and protect your data.',
  alternates: { canonical: 'https://repready.site/privacy' },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <div className="bg-white border-b border-slate-100 px-6 py-12 text-center">
        <span className="inline-block bg-cyan-50 text-cyan-700 border border-cyan-200 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">Legal</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-slate-400 text-sm">Effective Date: March 7, 2026</p>
      </div>
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8">
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">1. Introduction</h2>
            <p className="text-slate-500 text-sm leading-relaxed">Welcome to RepReady accessible at repready.site. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered sales training simulator.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 leading-relaxed">
              <li>Account information (name, email address) via Clerk authentication</li>
              <li>Voice recordings captured during your simulation sessions with our AI buyer personas</li>
              <li>Session transcripts generated from those voice recordings</li>
              <li>Coaching scores and performance metrics generated during and after sessions</li>
              <li>Usage data such as scenarios run and time spent</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 leading-relaxed">
              <li>To provide and operate the RepReady simulator</li>
              <li>To track session credits and usage limits</li>
              <li>To generate AI coaching feedback during and after simulations</li>
              <li>To improve the product based on aggregate usage patterns</li>
              <li>To communicate with you about your account</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">4. Data Storage and Security</h2>
            <p className="text-slate-500 text-sm leading-relaxed">Session records — including transcripts and performance scores — are encrypted in transit and at rest, and stored in MongoDB Atlas hosted in the Mumbai, India region. Voice conversation data captured during practice sessions is a separate case: it is processed and held by ElevenLabs, our voice AI sub-processor, not MongoDB, and is not currently India-resident (India-only processing requires ElevenLabs' Enterprise plan, which we have not yet enabled). Account data is managed through Clerk, which maintains industry-standard security practices. We do not store payment information — all billing is handled by Paddle.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">5. Data Retention</h2>
            <p className="text-slate-500 text-sm leading-relaxed">Voice conversation data held by ElevenLabs is automatically and permanently deleted 90 days after the session. Your session transcripts and performance scores in MongoDB Atlas are retained for as long as your account remains active, so your progress history stays available to you — you may delete them yourself at any time from your account, or request deletion; see Section 10 (Your Rights) below.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">6. AI Training</h2>
            <p className="text-slate-500 text-sm leading-relaxed">Your session recordings and coaching data are never used to train AI models without your explicit written consent. Your data is yours.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">7. Third-Party Services</h2>
            <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 leading-relaxed">
              <li><strong className="text-slate-700">Clerk</strong> — authentication and user management</li>
              <li><strong className="text-slate-700">ElevenLabs</strong> — AI voice generation and processing of voice recordings for buyer personas</li>
              <li><strong className="text-slate-700">Google Gemini</strong> — AI coaching, scoring, and scenario responses</li>
              <li><strong className="text-slate-700">MongoDB Atlas (Mumbai, India region)</strong> — storage of session data, transcripts, and performance scores</li>
              <li><strong className="text-slate-700">Paddle</strong> — payment processing and billing</li>
              <li><strong className="text-slate-700">Vercel</strong> — hosting and deployment</li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">8. Sub-processors</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-3">We use the following sub-processors to operate RepReady. Each processes a specific, limited category of your data as described below; see their own Data Processing Agreement for how they handle it.</p>
            <ul className="list-disc list-inside text-slate-500 text-sm space-y-1 leading-relaxed">
              <li><strong className="text-slate-700">ElevenLabs</strong> — voice AI for practice personas — <a href="https://elevenlabs.io/dpa" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">Data Processing Agreement</a></li>
              <li><strong className="text-slate-700">MongoDB Atlas</strong> — session data storage, Mumbai region (ap-south-1) — <a href="https://www.mongodb.com/legal/data-processing-agreement" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">Data Processing Agreement</a></li>
              <li><strong className="text-slate-700">Clerk</strong> — authentication and user accounts — <a href="https://clerk.com/legal/dpa" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">Data Processing Agreement</a></li>
              <li><strong className="text-slate-700">Google Gemini</strong> — AI scoring engine — <a href="https://cloud.google.com/terms/data-processing-addendum" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">Data Processing Addendum</a></li>
              <li><strong className="text-slate-700">Vercel</strong> — hosting and infrastructure — <a href="https://vercel.com/legal/dpa" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">Data Processing Agreement</a></li>
            </ul>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">9. Data Sharing</h2>
            <p className="text-slate-500 text-sm leading-relaxed">We do not sell your personal information. We do not share your data with third parties except the service providers listed above who are necessary to operate the product.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">10. Your Rights</h2>
            <p className="text-slate-500 text-sm leading-relaxed">You may request access to, correction of, or deletion of your personal data — including voice recordings, transcripts, and performance scores — at any time by contacting us at <a href="mailto:privacy@repready.site" className="text-cyan-600 hover:underline">privacy@repready.site</a>. We will respond within 30 days.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">11. Grievance Redressal</h2>
            <p className="text-slate-500 text-sm leading-relaxed">In accordance with the Digital Personal Data Protection Act, 2023, RepReady has designated a Grievance Officer to address complaints regarding the processing of your personal data. You may raise a grievance by writing to our Grievance Officer at <a href="mailto:privacy@repready.site" className="text-cyan-600 hover:underline">privacy@repready.site</a>. We will acknowledge and respond to all grievances within 30 days of receipt.</p>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 mb-3">12. Contact</h2>
            <p className="text-slate-500 text-sm leading-relaxed">For any privacy-related questions, contact us at <a href="mailto:privacy@repready.site" className="text-cyan-600 hover:underline">privacy@repready.site</a></p>
          </div>
        </div>
      </div>
      <div className="text-center pb-12">
        <a href="/" className="text-sm text-cyan-600 hover:underline">← Back to RepReady</a>
      </div>
    </div>
  )
}
