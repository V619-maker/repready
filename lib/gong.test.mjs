import assert from 'node:assert/strict'
import { parseGongCreds, maskGong, isValidGongCallId, verifyGong, findGongUserId, forgetGongUsers, listGongCalls, getGongCall, isRepsCall, getGongTranscript, buildLabeledLines, GONG_USER_CACHE_TTL_MS } from './gong.mjs'

let n = 0
const t = async (fn) => { await fn(); n++ }
function fake(handler) {
  const calls = []
  const f = async (url, opts = {}) => {
    calls.push({ url, opts, body: opts.body ? JSON.parse(opts.body) : null })
    const { status = 200, json = {} } = await handler(url, opts)
    return { status, json: async () => json }
  }
  f.calls = calls
  return f
}
const K = 'KEY12345678', S = 'x'.repeat(30)

// ---- creds ----
const ok = parseGongCreds({ accessKey: K, accessSecret: S })
await t(() => assert.equal(ok.ok, true))
await t(() => assert.equal(ok.creds.baseUrl, 'https://api.gong.io'))
await t(() => assert.equal(parseGongCreds({ baseUrl: 'https://company-17.api.gong.io/', accessKey: K, accessSecret: S }).creds.baseUrl, 'https://company-17.api.gong.io'))
await t(() => assert.equal(maskGong(ok.creds), 'api.gong.io · key …5678'))
for (const b of ['http://api.gong.io', 'https://evil.com', 'https://api.gong.io.evil.com', 'https://evilapi.gong.io', 'https://api.gong.io:8443', 'https://u:p@api.gong.io', 'https://a.b.api.gong.io', 'nonsense'])
  await t(() => assert.equal(parseGongCreds({ baseUrl: b, accessKey: K, accessSecret: S }).ok, false, b))
await t(() => assert.equal(parseGongCreds({ accessKey: 'a', accessSecret: S }).ok, false))
await t(() => assert.equal(parseGongCreds({ accessKey: K, accessSecret: '' }).ok, false))
await t(() => assert.equal(isValidGongCallId('7782342274025937895'), true))
for (const bad of ['', 'abc', '12/../3', '1'.repeat(26), 5, null]) await t(() => assert.equal(isValidGongCallId(bad), false, String(bad)))

// ---- verify + auth header ----
{
  const f = fake(() => ({ json: { users: [] } }))
  await t(async () => assert.deepEqual(await verifyGong(f, ok.creds), { ok: true }))
  await t(() => assert.equal(f.calls[0].url, 'https://api.gong.io/v2/users'))
  await t(() => assert.equal(f.calls[0].opts.headers.Authorization, `Basic ${Buffer.from(`${K}:${S}`).toString('base64')}`))
  await t(() => assert.equal(f.calls[0].opts.redirect, 'manual'))
  const bad = await verifyGong(fake(() => ({ status: 401 })), ok.creds)
  await t(() => assert.equal(bad.ok, false))
  await t(() => assert.ok(!bad.error.includes(S)))
  await t(async () => assert.equal((await verifyGong(fake(() => { throw new Error('boom') }), ok.creds)).ok, false))
}

// ---- find user (paging, case, cache) ----
{
  forgetGongUsers()
  const f = fake((url) => (url.includes('cursor=P2')
    ? { json: { users: [{ id: 222, emailAddress: 'Rep@Acme.com' }], records: {} } }
    : { json: { users: [{ id: 111, emailAddress: 'other@acme.com' }], records: { cursor: 'P2' } } }))
  const r = await findGongUserId(f, ok.creds, 'rep@acme.com', 'w1', 1000)
  await t(() => assert.deepEqual([r.ok, r.userId], [true, '222']))
  await t(() => assert.equal(f.calls.length, 2))
  const r2 = await findGongUserId(f, ok.creds, 'REP@acme.com', 'w1', 2000)
  await t(() => assert.deepEqual([r2.userId, r2.cached, f.calls.length], ['222', true, 2]))
  const r3 = await findGongUserId(f, ok.creds, 'rep@acme.com', 'w1', 1000 + GONG_USER_CACHE_TTL_MS + 1)
  await t(() => assert.equal(r3.cached, undefined))
  const r4 = await findGongUserId(f, ok.creds, 'rep@acme.com', 'w2', 3000)
  await t(() => assert.equal(r4.cached, undefined)) // other workspace never shares
  const none = await findGongUserId(fake(() => ({ json: { users: [{ id: 1, emailAddress: 'a@b.co' }] } })), ok.creds, 'ghost@acme.com', 'w3')
  await t(() => assert.deepEqual(none, { ok: true, userId: null }))
  await t(async () => assert.equal((await findGongUserId(fake(() => ({ status: 403 })), ok.creds, 'a@b.co', 'w4')).ok, false))
  // an endless cursor cannot loop forever
  const loop = fake(() => ({ json: { users: [], records: { cursor: 'again' } } }))
  await findGongUserId(loop, ok.creds, 'x@y.co', 'w5')
  await t(() => assert.equal(loop.calls.length, 10))
}

// ---- list calls ----
const NOW = Date.parse('2026-11-20T10:00:00Z')
const rec = (id, primary, started, parties) => ({ metaData: { id, title: 'Call ' + id, started, duration: 600, primaryUserId: primary }, parties: parties || [] })
{
  const f = fake(() => ({ json: { calls: [rec('100', '222', '2026-11-10T10:00:00Z'), rec('101', '999', '2026-11-18T10:00:00Z'), rec('102', '222', '2026-11-19T10:00:00Z'), rec('abc', '222', '2026-11-19T10:00:00Z')] } }))
  const r = await listGongCalls(f, ok.creds, '222', NOW)
  await t(() => assert.deepEqual(r.calls.map((c) => c.id), ['102', '100'])) // only the rep's, valid ids, newest first
  await t(() => assert.equal(f.calls[0].url, 'https://api.gong.io/v2/calls/extensive'))
  await t(() => assert.deepEqual(f.calls[0].body.filter.primaryUserIds, ['222']))
  await t(() => assert.equal(f.calls[0].body.filter.toDateTime, '2026-11-20T10:00:00.000Z'))
  await t(() => assert.equal(f.calls[0].body.filter.fromDateTime, '2026-10-21T10:00:00.000Z'))
}
await t(async () => assert.deepEqual(await listGongCalls(fake(() => ({})), ok.creds, null, NOW), { ok: true, calls: [] }))
await t(async () => assert.deepEqual(await listGongCalls(fake(() => ({ status: 404, json: { errors: ['none'] } })), ok.creds, '222', NOW), { ok: true, calls: [] }))
await t(async () => assert.equal((await listGongCalls(fake(() => ({ status: 403 })), ok.creds, '222', NOW)).ok, false))

// ---- get call + ownership ----
const parties = [{ id: 'p1', speakerId: 'S1', name: 'Rhea Rep', emailAddress: 'Rep@Acme.com', affiliation: 'Internal' }, { id: 'p2', speakerId: 'S2', name: 'Bob Buyer', emailAddress: 'bob@client.com', affiliation: 'External' }]
{
  const f = fake(() => ({ json: { calls: [rec('100', '999', '2026-11-10T10:00:00Z', parties)] } }))
  const g = await getGongCall(f, ok.creds, '100')
  await t(() => assert.equal(g.call.id, '100'))
  await t(() => assert.deepEqual(f.calls[0].body.filter.callIds, ['100']))
  await t(() => assert.equal(isRepsCall(g.call, '222', 'rep@acme.com'), true))   // participant by email
  await t(() => assert.equal(isRepsCall(g.call, '999', 'x@y.co'), true))         // primary user
  await t(() => assert.equal(isRepsCall(g.call, '222', 'other@acme.com'), false)) // someone else's call
  await t(() => assert.equal(isRepsCall(null, '1', 'a@b.co'), false))
  await t(() => assert.equal(isRepsCall(g.call, null, ''), false))
  // Gong returning a different call than asked is ignored
  const other = await getGongCall(fake(() => ({ json: { calls: [rec('555', '222', 'x')] } })), ok.creds, '100')
  await t(() => assert.equal(other.call, null))
}
for (const bad of ['../x', 'abc', '']) await t(async () => assert.equal((await getGongCall(fake(() => ({})), ok.creds, bad)).ok, false, bad))
await t(async () => assert.equal((await getGongCall(fake(() => ({ status: 404 })), ok.creds, '100')).call, null))

// ---- transcript ----
{
  const f = fake(() => ({ json: { callTranscripts: [{ callId: '100', transcript: [{ speakerId: 'S1', sentences: [{ text: 'Hi' }] }] }] } }))
  const r = await getGongTranscript(f, ok.creds, '100', '2026-11-10T10:00:00Z')
  await t(() => assert.equal(r.transcript.length, 1))
  await t(() => assert.equal(f.calls[0].url, 'https://api.gong.io/v2/calls/transcript'))
  await t(() => assert.deepEqual(f.calls[0].body.filter.callIds, ['100']))
  await t(() => assert.equal(f.calls[0].body.filter.fromDateTime, '2026-11-09T10:00:00.000Z'))
  // a transcript for a different call id is never returned
  const wrong = await getGongTranscript(fake(() => ({ json: { callTranscripts: [{ callId: '999', transcript: [{}] }] } })), ok.creds, '100', null)
  await t(() => assert.equal(wrong.transcript, null))
}
await t(async () => assert.equal((await getGongTranscript(fake(() => ({ status: 404 })), ok.creds, '100', null)).transcript, null))
await t(async () => assert.equal((await getGongTranscript(fake(() => ({ status: 429 })), ok.creds, '100', null)).ok, false))
await t(async () => assert.equal((await getGongTranscript(fake(() => ({})), ok.creds, 'bad', null)).ok, false))

// ---- labelled lines ----
{
  const mono = [
    { speakerId: 'S1', sentences: [{ text: 'Hi Bob.' }, { text: 'Thanks for joining.' }] },
    { speakerId: 'S1', sentences: [{ text: 'Shall we start?' }] },
    { speakerId: 'S2', sentences: [{ text: 'Sure.\nGo ahead: please' }] },
    { speakerId: 'S2', sentences: [] },
  ]
  const r = buildLabeledLines(parties, mono)
  await t(() => assert.deepEqual(r.labels, ['Rhea Rep', 'Bob Buyer']))
  await t(() => assert.deepEqual(r.labelBySpeaker, { S1: 'Rhea Rep', S2: 'Bob Buyer' }))
  await t(() => assert.equal(r.lines.length, 2))                       // same-speaker turns merged
  await t(() => assert.equal(r.lines[0].text, 'Hi Bob. Thanks for joining. Shall we start?'))
  await t(() => assert.equal(r.lines[1].text, 'Sure. Go ahead: please')) // newline flattened
  // the lines survive the app's own line parser regex
  const re = /^([A-Za-z][A-Za-z0-9 ._-]{0,40}):\s*(.+)$/
  for (const l of r.lines) await t(() => assert.equal(re.exec(`${l.label}: ${l.text}`)[1], l.label))
}
{
  // unknown speakers, odd names, duplicate names
  const r = buildLabeledLines([{ speakerId: 'A', name: 'Sam: The "Man"' }, { speakerId: 'B', name: 'Sam The Man' }, { speakerId: 'C', name: '12345' }, { speakerId: 'D', name: '李雷' }],
    [{ speakerId: 'A', sentences: [{ text: 'a' }] }, { speakerId: 'B', sentences: [{ text: 'b' }] }, { speakerId: 'C', sentences: [{ text: 'c' }] }, { speakerId: 'D', sentences: [{ text: 'd' }] }, { speakerId: 'Z', sentences: [{ text: 'z' }] }])
  await t(() => assert.equal(new Set(r.labels.map((l) => l.toLowerCase())).size, r.labels.length)) // all unique
  await t(() => assert.ok(r.labels.every((l) => /^[A-Za-z][A-Za-z0-9 ._-]{0,40}$/.test(l)), r.labels.join('|')))
  await t(() => assert.equal(r.labels.length, 5))
}
await t(() => assert.deepEqual(buildLabeledLines([], []), { lines: [], labels: [], chars: 0, labelBySpeaker: {} }))
await t(() => assert.deepEqual(buildLabeledLines(null, [{ speakerId: null, sentences: [{ text: 'x' }] }]).lines, []))
await t(() => assert.ok(buildLabeledLines(parties, [{ speakerId: 'S1', sentences: [{ text: 'x'.repeat(1000) }] }]).chars > 1000))

console.log(`gong: ${n} assertions passed`)
