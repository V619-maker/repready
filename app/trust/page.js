import Link from 'next/link';

export const metadata = {
  title: 'Trust & Compliance — RepReady',
  description: 'How RepReady protects your data: residency, retention, consent, sub-processors, and security practices.',
  alternates: { canonical: 'https://repready.site/trust' },
}

const FONT_DISPLAY = "'Newsreader', Georgia, 'Times New Roman', serif";
const FONT_BODY = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const CREAM = '#F7F1E4';
const CREAM_ALT = '#F0E8D6';
const NAVY = '#1B2A4A';
const INK = '#1D1912';
const STONE = '#726B5C';
const BORDER = 'rgba(27,42,74,0.14)';
const GREEN = '#3D7A4C';

const heading = { fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: INK, marginBottom: 12 };
const body = { fontSize: 14, color: STONE, lineHeight: 1.75, margin: 0 };
const strong = { color: INK, fontWeight: 700 };
const link = { color: NAVY, textDecoration: 'underline', textDecorationColor: BORDER };
const th = { textAlign: 'left', fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: STONE, padding: '0 16px 10px 0', borderBottom: `1px solid ${BORDER}` };
const td = { padding: '14px 16px 14px 0', borderBottom: `1px solid ${BORDER}`, color: STONE, verticalAlign: 'top' };

const SUB_PROCESSORS = [
  { name: 'ElevenLabs', purpose: 'Voice AI for practice personas', dpa: 'https://elevenlabs.io/dpa' },
  { name: 'MongoDB Atlas', purpose: 'Session data storage, Mumbai region (ap-south-1)', dpa: 'https://www.mongodb.com/legal/data-processing-agreement' },
  { name: 'Clerk', purpose: 'Authentication and user accounts', dpa: 'https://clerk.com/legal/dpa' },
  { name: 'Google Cloud', purpose: 'AI scoring engine (Gemini)', dpa: 'https://cloud.google.com/terms/data-processing-addendum' },
  { name: 'Vercel', purpose: 'Hosting and infrastructure', dpa: 'https://vercel.com/legal/dpa' },
];

const SECURITY_PRACTICES = [
  'Role-based access control — reps see only their own data; managers see only their own organization',
  'CORS locked to an explicit origin allowlist, not left wide open',
  'X-Frame-Options: DENY enforced site-wide to prevent clickjacking',
  'Session scores are independently re-derived from the transcript server-side, never trusted from the client alone',
];

export default function TrustPage() {
  return (
    <div style={{ minHeight: '100vh', background: CREAM, fontFamily: FONT_BODY, color: INK }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&display=swap');` }} />

      <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '56px 24px', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', background: CREAM_ALT, color: NAVY, border: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 999, marginBottom: 18 }}>Trust &amp; Compliance</span>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(30px, 4.5vw, 46px)', fontWeight: 600, color: INK, letterSpacing: '-0.01em', marginBottom: 10 }}>How we handle your data</h1>
        <p style={{ fontSize: 14, color: STONE }}>A factual summary for security and compliance review.</p>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px' }}>
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 40, display: 'flex', flexDirection: 'column', gap: 40 }}>

          <section>
            <h2 style={heading}>Data Residency</h2>
            <p style={body}>Session records — performance scores, qualification status, and skill dimensions — are stored in <strong style={strong}>MongoDB Atlas</strong>, hosted in the <strong style={strong}>Mumbai, India region (ap-south-1)</strong>. This data does not leave the region at rest.</p>
            <p style={{ ...body, marginTop: 12 }}>Voice conversation data captured during practice sessions is a separate case: it is processed and held by our voice AI sub-processor, <strong style={strong}>ElevenLabs</strong>, not MongoDB. This voice data is <strong style={strong}>not currently India-resident</strong> — India-only processing is available on ElevenLabs&rsquo; Enterprise plan, which we have not yet enabled. See Retention &amp; Deletion below for how long this data is kept.</p>
          </section>

          <section>
            <h2 style={heading}>Retention &amp; Deletion</h2>
            <p style={body}>Voice data captured by ElevenLabs during practice sessions is automatically and permanently deleted <strong style={strong}>90 days</strong> after the session, via a daily automated purge job we run ourselves — stricter than ElevenLabs&rsquo; own default 180-day inactivity retention window. Account information is retained only for as long as your account remains active.</p>
          </section>

          <section>
            <h2 style={heading}>Consent</h2>
            <p style={body}>Every voice session is preceded by a consent screen, compliant with India&rsquo;s Digital Personal Data Protection Act (DPDP), 2023. No recording begins until consent is given for that session.</p>
          </section>

          <section>
            <h2 style={heading}>Sub-processors</h2>
            <p style={{ ...body, marginBottom: 16 }}>These are the only third parties with any access to your data, each limited to the specific purpose below.</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={th}>Sub-processor</th>
                    <th style={th}>Purpose</th>
                    <th style={th}>Agreement</th>
                  </tr>
                </thead>
                <tbody>
                  {SUB_PROCESSORS.map((p) => (
                    <tr key={p.name}>
                      <td style={td}><strong style={strong}>{p.name}</strong></td>
                      <td style={td}>{p.purpose}</td>
                      <td style={td}><a href={p.dpa} target="_blank" rel="noopener noreferrer" style={link}>DPA →</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 style={heading}>Security Practices</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SECURITY_PRACTICES.map((s) => (
                <li key={s} style={{ ...body, display: 'flex', gap: 10 }}>
                  <span style={{ color: GREEN, flexShrink: 0 }}>✓</span>{s}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={heading}>Data Deletion Requests</h2>
            <p style={body}>To request deletion of your personal data — including voice recordings, transcripts, and performance scores — contact <a href="mailto:privacy@repready.site" style={link}>privacy@repready.site</a>. See our <Link href="/privacy" style={link}>Privacy Policy</Link> for the full disclosure.</p>
          </section>

        </div>
      </div>

      <div style={{ textAlign: 'center', paddingBottom: 56 }}>
        <Link href="/" style={{ fontSize: 13, color: NAVY, textDecoration: 'none', borderBottom: `1px solid ${NAVY}`, paddingBottom: 2 }}>← Back to RepReady</Link>
      </div>
    </div>
  );
}
