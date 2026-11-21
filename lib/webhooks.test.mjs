import assert from 'node:assert/strict'
import {
  isPrivateOrLocalAddress, validateIntegrationUrl, maskUrl, signBody, generateWebhookSecret,
  buildSessionPayload, buildTestPayload, formatSlack, formatTeams, toCsv,
} from './webhooks.mjs'

let n = 0
const t = (fn) => { fn(); n++ }

// --- addresses that must never be called (server-side request forgery) ---
for (const a of ['localhost', 'a.localhost', 'db.internal', 'x.local', '127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255',
  '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '::1', '::', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '224.0.0.1'])
  t(() => assert.equal(isPrivateOrLocalAddress(a), true, a))
for (const a of ['8.8.8.8', 'hooks.slack.com', '172.32.0.1', '172.15.0.1', 'example.com'])
  t(() => assert.equal(isPrivateOrLocalAddress(a), false, a))

// --- url validation ---
t(() => assert.equal(validateIntegrationUrl('slack', 'https://hooks.slack.com/services/T0/B0/xyz').ok, true))
t(() => assert.equal(validateIntegrationUrl('slack', 'http://hooks.slack.com/services/T0/B0/xyz').ok, false))   // not https
t(() => assert.equal(validateIntegrationUrl('slack', 'https://evil.com/hooks.slack.com').ok, false))
t(() => assert.equal(validateIntegrationUrl('slack', 'https://hooks.slack.com.evil.com/x').ok, false))
t(() => assert.equal(validateIntegrationUrl('teams', 'https://prod-12.westus.logic.azure.com:443/workflows/abc').ok, true))
t(() => assert.equal(validateIntegrationUrl('teams', 'https://contoso.webhook.office.com/webhookb2/abc').ok, true))
t(() => assert.equal(validateIntegrationUrl('teams', 'https://evil.com/x').ok, false))
t(() => assert.equal(validateIntegrationUrl('webhook', 'https://hooks.example.com/repready').ok, true))
t(() => assert.equal(validateIntegrationUrl('webhook', 'https://127.0.0.1/x').ok, false))
t(() => assert.equal(validateIntegrationUrl('webhook', 'https://localhost/x').ok, false))
t(() => assert.equal(validateIntegrationUrl('webhook', 'https://169.254.169.254/latest').ok, false))
t(() => assert.equal(validateIntegrationUrl('webhook', 'https://[::1]/x').ok, false))
t(() => assert.equal(validateIntegrationUrl('webhook', 'https://user:pw@example.com/x').ok, false))
t(() => assert.equal(validateIntegrationUrl('webhook', 'ftp://example.com').ok, false))
t(() => assert.equal(validateIntegrationUrl('webhook', 'not a url').ok, false))
t(() => assert.equal(validateIntegrationUrl('other', 'https://example.com').ok, false))

// --- secrets never shown in full ---
t(() => assert.equal(maskUrl('https://hooks.slack.com/services/T0/B0/SECRETTOKEN'), 'hooks.slack.com/…OKEN'))
t(() => assert.equal(maskUrl('nope'), null))

// --- signature ---
t(() => assert.equal(signBody('key', 'The quick brown fox jumps over the lazy dog'), 'sha256=f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8'))  // published HMAC-SHA256 test vector
t(() => assert.match(signBody('k', 'body'), /^sha256=[0-9a-f]{64}$/))
t(() => assert.notEqual(signBody('k1', 'body'), signBody('k2', 'body')))
t(() => assert.equal(signBody('k', 'body'), signBody('k', 'body')))
t(() => assert.match(generateWebhookSecret(), /^[0-9a-f]{48}$/))

// --- payload and message formats ---
const session = { id: 's1', createdAt: '2026-11-21T10:00:00Z', userEmail: 'a@acme.com', persona: 'sandra', finalScore: 81, grade: 'A',
  procurementScore: 80, enablementScore: 83, qualificationStatus: 'Qualified', dimensions: { x: 70 }, verdict: 'Strong.', transcript: 'SECRET', consentGiven: true }
const p = buildSessionPayload(session)
t(() => assert.equal(p.event, 'session.completed'))
t(() => assert.equal(p.score.overall, 81))
t(() => assert.equal(JSON.stringify(p).includes('SECRET'), false))              // transcript never included
t(() => assert.equal('consentGiven' in p, false))
t(() => assert.equal(buildSessionPayload({ ...session, verdict: 'x'.repeat(999) }).verdict.length, 300))
t(() => assert.equal(buildSessionPayload({ id: 'z' }).score.overall, null))      // missing fields tolerated
t(() => assert.ok(formatSlack(p).text.includes('*81*')))
t(() => assert.ok(formatSlack(buildSessionPayload({ ...session, userEmail: '<!channel>@x.com' })).text.includes('&lt;!channel&gt;')))  // no @channel injection
t(() => assert.equal(formatTeams(p).attachments[0].content.type, 'AdaptiveCard'))
t(() => assert.ok(buildTestPayload().verdict.includes('test')))

// --- csv ---
const csv = toCsv([{ a: 'x,y', b: '=HYPERLINK("http://e")', c: 'say "hi"', d: null }], ['a', 'b', 'c', 'd'])
t(() => assert.equal(csv, 'a,b,c,d\r\n"x,y","\'=HYPERLINK(""http://e"")","say ""hi""",\r\n'))

console.log(`webhooks: ${n} assertions passed`)
