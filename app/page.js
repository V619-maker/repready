'use client'

import { useState, useEffect } from 'react'

const DEMO_MAILTO = 'mailto:sales@repready.site?subject=RepReady%20Demo%20Request&body=Hi%2C%20I%27d%20like%20to%20book%20a%20demo%20for%20my%20team.'

const scenarios = [
  {
    label: 'CFO Pushback — Enterprise Deal',
    chat: [
      { side: 'b', spk: 'Richard Chen · VP Procurement', msg: "Your pricing is 40% above our budget. Justify every line item or we're done here." },
      { side: 'r', spk: 'You · AE', msg: 'Before we talk numbers — can we align on what your current process costs you annually?' },
      { side: 'b', spk: 'Richard Chen · VP Procurement', msg: 'Our process works fine. This is purely a price negotiation.' },
    ],
    coach: 'Good reframe attempt. Now anchor the cost of inaction before you concede anything. You had the stronger position.',
  },
  {
    label: 'Procurement Stall — Mid-Market',
    chat: [
      { side: 'b', spk: 'Sandra Meyers · CFO', msg: 'Legal needs to review the MSA. Could take 6–8 weeks minimum. Nothing I can do.' },
      { side: 'r', spk: 'You · AE', msg: 'I understand. What if we agree on commercial terms today and run legal in parallel?' },
      { side: 'b', spk: 'Sandra Meyers · CFO', msg: "That's not how our process works. Legal goes first — always." },
    ],
    coach: "Don't accept the stall as fixed. Ask who in legal owns it and what specifically they need. Create momentum or this deal dies here.",
  },
  {
    label: 'Budget Freeze — Q1 Enterprise',
    chat: [
      { side: 'b', spk: 'Richard Chen · VP Procurement', msg: "Just got word from the board — all discretionary spend is frozen until Q2. Nothing I can do." },
      { side: 'r', spk: 'You · AE', msg: 'I hear you. Is this a freeze on all spend or specifically new vendor onboarding?' },
      { side: 'b', spk: 'Richard Chen · VP Procurement', msg: "All discretionary. This isn't up for debate." },
    ],
    coach: "Weak pivot. Ask what problems still need solving in Q1 regardless of the freeze. Find the pain that doesn't pause — that's your lever.",
  },
  {
    label: 'Competitor Price Match',
    chat: [
      { side: 'b', spk: 'Sandra Meyers · CFO', msg: "Competitor X quoted us 35% less than your number. Match it or this conversation is over." },
      { side: 'r', spk: 'You · AE', msg: 'I want to understand that quote. Are you comparing the same seat count and feature set?' },
      { side: 'b', spk: 'Sandra Meyers · CFO', msg: "It's the same. They want the business and you apparently don't." },
    ],
    coach: "Good instinct to question the comparison. Push further — ask to see the quote. 80% of the time they can't produce it. Don't match on pressure alone.",
  },
  {
    label: 'Missing Decision Maker',
    chat: [
      { side: 'b', spk: 'Richard Chen · Champion', msg: "I love the product but my CEO needs to sign off and she's not available for 3 weeks." },
      { side: 'r', spk: 'You · AE', msg: "Understood. I'd love a 20-minute briefing with her — I can work around her calendar." },
      { side: 'b', spk: 'Richard Chen · Champion', msg: "She doesn't do vendor calls. I'll brief her internally and get back to you." },
    ],
    coach: "Don't let the deal go dark. Ask your champion what she specifically needs to say yes. Get the objection on the table now, not after 3 weeks of silence.",
  },
]

function Logo({ height = 34, repColor = '#0d1117' }) {
  return (
    <svg
      style={{ height, width: 'auto', overflow: 'visible' }}
      viewBox="0 0 228 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RepReady logo"
      role="img"
    >
      <title>RepReady</title>
      <g className="lhg">
        <polygon points="22,3 35,10.5 35,25.5 22,33 9,25.5 9,10.5" stroke="#00c8e0" strokeWidth="1.7" fill="#0d1117" />
        <g className="lch">
          <line x1="22" y1="0"  x2="22" y2="6"  stroke="#00c8e0" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="22" y1="30" x2="22" y2="36" stroke="#00c8e0" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="4"  y1="18" x2="10" y2="18" stroke="#00c8e0" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="34" y1="18" x2="40" y2="18" stroke="#00c8e0" strokeWidth="1.3" strokeLinecap="round" />
        </g>
        <line className="lscan" x1="10" y1="18" x2="34" y2="18" stroke="rgba(0,200,224,0.22)" strokeWidth="1" />
        <text x="22" y="23" textAnchor="middle" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="13" fill="#ffffff">R</text>
        <circle className="ldot" cx="28" cy="12" r="2.2" fill="#e84545" />
      </g>
      <text x="50" y="30" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="24" fontStyle="italic" fill={repColor} letterSpacing="0.5">REP</text>
      <text x="101" y="30" fontFamily="'Sora',sans-serif" fontWeight="800" fontSize="24" fontStyle="italic" fill="#00c8e0" letterSpacing="0.5">READY</text>
    </svg>
  )
}

export default function HomePage() {
  const [activeScenario, setActiveScenario] = useState(0)
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('on'), i * 75)
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.07 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const s = scenarios[activeScenario]

  return (
    <>
      {/* NAV */}
      <nav style={{ boxShadow: scrolled ? '0 1px 30px rgba(0,0,0,0.08)' : 'none' }}>
        <a href="/" className="nav-logo" aria-label="RepReady home">
          <Logo height={32} repColor="#0d1117" />
        </a>
        <ul className="nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#scenarios">Scenarios</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-right">
          <a href="/sign-in"><button className="btn-ghost">Sign In</button></a>
          <a href="/deck"><button className="btn-primary">Start Free Trial</button></a>
        </div>
      </nav>

      {/* HERO - dark background */}
      <section className="hero hero-dark" aria-labelledby="hero-heading">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-glow2" aria-hidden="true" />
        <div className="hero-inner">
          <div className="reveal">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              B2B Sales Simulation Engine · V1.0
            </div>
            <h1 className="hero-h1" id="hero-heading">
              Train Your Sales Team on <em>AI Buyers.</em><br />Not Real Prospects.
            </h1>
            <p className="hero-sub">
              RepReady gives B2B sales reps live, voice-to-voice negotiation practice against hostile AI buyers — with real-time coaching, deal health scoring, and frame-control analysis. Stop losing deals to objections you never prepared for.
            </p>
            <div className="hero-ctas">
              <a href="/deck">
                <button className="btn-cta-main" aria-label="Start free trial">
                  Start Free Trial
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <path d="M2 6.5h9M7.5 2.5l4 4-4 4" stroke="#0a0d14" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </a>
              <a href={DEMO_MAILTO}>
                <button className="btn-cta-sec" aria-label="Book a team demo">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M5 5l3 1.5L5 8V5z" fill="currentColor" />
                  </svg>
                  Book a Team Demo
                </button>
              </a>
            </div>
            <div className="hero-proof" aria-label="Key statistics">
              <div className="proof-stat">
                <span className="proof-num">1,200<span>+</span></span>
                <span className="proof-lbl">Simulations run</span>
              </div>
              <div className="proof-sep" aria-hidden="true" />
              <div className="proof-stat">
                <span className="proof-num">2 <span>AI</span></span>
                <span className="proof-lbl">Buyer personas</span>
              </div>
              <div className="proof-sep" aria-hidden="true" />
              <div className="proof-stat">
                <span className="proof-num">8 <span>dim</span></span>
                <span className="proof-lbl">Coaching score</span>
              </div>
            </div>
          </div>

          <div
            className="mockup-wrap reveal"
            style={{ transitionDelay: '0.12s' }}
            role="img"
            aria-label="RepReady simulator showing a live CFO pushback negotiation with AI coach feedback"
          >
            <div className="mockup-card">
              <div className="mock-bar" aria-hidden="true">
                <div className="mac-dots">
                  <div className="mdc mdc-r" /><div className="mdc mdc-y" /><div className="mdc mdc-g" />
                </div>
                <div className="mock-title-bar">REPREADY · SIMULATOR · LIVE SESSION</div>
              </div>
              <div className="mock-body">
                <div className="scenario-chip"><div className="chip-dot" aria-hidden="true" />CFO Pushback — Enterprise Deal</div>
                <div className="chat">
                  <div className="bbl bbl-b"><div className="spk spk-b">Richard Chen · VP Procurement</div>Your pricing is 40% above our budget. Justify every line item or we walk.</div>
                  <div className="bbl bbl-r"><div className="spk spk-r">You · AE</div>Before we talk numbers — can we align on what your current process costs annually?</div>
                  <div className="bbl bbl-b"><div className="spk spk-b">Richard Chen · VP Procurement</div>Our process is fine. This is purely a price discussion.</div>
                </div>
                <div className="coach-tip">
                  <span aria-hidden="true">⚡</span>
                  <p className="coach-tip-text"><strong>AI Coach:</strong> Good reframe. Now anchor the cost of inaction before you concede on price.</p>
                </div>
                <div className="health-row" aria-label="Deal health: 62 out of 100">
                  <span className="hlbl">Deal Health</span>
                  <div className="htrack"><div className="hfill" /></div>
                  <span className="hscore">62 / 100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO STRIP — FIXED: removed extra > on div and p tag */}
      <div className="logo-strip" aria-label="Built for sales teams in">
        <div className="wrap">
          <p className="strip-lbl">Built for sales teams in</p>
          <div className="logos-row">
            {[
              ['#00c8e0','S','B2B SaaS'],
              ['#6db56d','E','EdTech'],
              ['#c4a040','H','HRO / FAO'],
            ].map(([color, letter, label]) => (
              <div className="logo-chip" key={label}>
                <div className="lcsq" style={{ background: `${color}22`, color }}>{letter}</div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="hiw-bg" id="how-it-works" aria-labelledby="hiw-heading">
        <div className="wrap">
          <div className="reveal">
            <p className="s-tag">How it works</p>
            <h2 className="s-title" id="hiw-heading">From zero to deal-ready<br />in under an hour.</h2>
            <p className="s-sub">Three steps. No IT setup. No scheduling. Your reps handle the toughest objections on AI that doesn&apos;t hold back.</p>
          </div>
          <div className="steps reveal">
            {[
              { n: '01', icon: '🎯', h: 'Choose Your Scenario', p: 'Pick from pre-built battles — CFO pushback, budget freeze, procurement stall — or configure your own with custom company and stakeholder context.' },
              { n: '02', icon: '🎙️', h: 'Run the Live Call', p: 'Go voice-to-voice with Richard or Sandra — AI buyers trained to push, stall, anchor low, and test conviction. Real pressure. Zero consequences.' },
              { n: '03', icon: '📊', h: 'Get Coached & Scored', p: 'Instant AI Coach feedback on frame control, objection handling, and deal health across 8 dimensions. See exactly where you lost ground.' },
            ].map((step, i) => (
              <div className="step" key={i}>
                <div className="step-n">Step {step.n}</div>
                <div className="step-ico" aria-hidden="true">{step.icon}</div>
                <h3 className="step-h">{step.h}</h3>
                <p className="step-p">{step.p}</p>
                {i < 2 && <div className="step-arr" aria-hidden="true">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section style={{ padding: '56px 5%' }} aria-label="Product facts">
        <div className="wrap">
          <div className="metrics-grid reveal">
            {[
              { n: '5',  s: '+',  d: 'battle-tested negotiation scenarios available on day one' },
              { n: '8',  s: '',   d: 'coaching dimensions scored on every single simulation' },
              { n: '2',  s: '',   d: 'fully voiced AI buyer personas — Richard Vance & Sandra Chen' },
              { n: '24', s: '/7', d: 'available — no scheduling, no manager time, no calendar coordination' },
            ].map((m, i) => (
              <div className="metric" key={i}>
                <div className="metric-n">{m.n}<span>{m.s}</span></div>
                <div className="metric-d">{m.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="feat-bg" id="features" aria-labelledby="feat-heading">
        <div className="wrap">
          <div className="reveal">
            <p className="s-tag">Platform features</p>
            <h2 className="s-title" id="feat-heading">Every tool your team needs<br />to <em>win harder deals.</em></h2>
          </div>
          <div className="feat-grid reveal">
            <div className="feat-card span2">
              <div>
                <div className="feat-ico ico-r" aria-hidden="true">🧠</div>
                <h3 className="feat-h">AI Sales Coach — Real-Time &amp; Post-Call</h3>
                <p className="feat-p">The AI Coach monitors every exchange live — flagging frame breaks, missed anchors, and weak concessions as they happen. Post-call, you get a full scored debrief: what worked, what didn&apos;t, and exactly how to fix it before the next real deal.</p>
                <div className="feat-tags">
                  <span className="ftag ft-c">Real-time feedback</span>
                  <span className="ftag ft-r">Frame analysis</span>
                  <span className="ftag ft-c">Post-call debrief</span>
                </div>
              </div>
              <div className="score-preview" role="img" aria-label="Sample AI coach debrief scores">
                <div className="sp-lbl">Coach Debrief · Session #14</div>
                {[
                  { name: 'Frame Control',      val: '7.4 / 10', w: 74, cls: 'srow-val',  bar: 'sbar-c' },
                  { name: 'Objection Handling', val: '8.1 / 10', w: 81, cls: 'srow-val',  bar: 'sbar-c' },
                  { name: 'Price Discipline',   val: '5.9 / 10', w: 59, cls: 'srow-val2', bar: 'sbar-r' },
                  { name: 'Listening Quality',  val: '7.8 / 10', w: 78, cls: 'srow-val',  bar: 'sbar-c' },
                ].map((row) => (
                  <div className="srow" key={row.name}>
                    <div className="srow-top">
                      <span className="srow-name">{row.name}</span>
                      <span className={row.cls}>{row.val}</span>
                    </div>
                    <div className="sbar"><div className={`sbar-fill ${row.bar}`} style={{ width: `${row.w}%` }} /></div>
                  </div>
                ))}
                <div className="coach-note">⚡ You conceded 8% discount before the buyer anchored. Next time: let them move first. You had the stronger position.</div>
              </div>
            </div>
            {[
              { ico: '🎙️', cls: 'ico-c', h: 'Voice-to-Voice Negotiations',  p: "Powered by ElevenLabs. Your reps speak, the AI buyer speaks back — with natural pauses, tone shifts, and pressure tactics baked in. As close to real as practice gets.", tags: [['ft-c','ElevenLabs voice'],['ft-c','Live audio']] },
              { ico: '📈', cls: 'ico-c', h: 'Deal Health Scoring',           p: 'Every call scored live across 8 dimensions. Watch the deal health meter react as you navigate objections — gamified pressure that builds real habits.', tags: [['ft-c','8-dimension score'],['ft-r','Live meter']] },
              { ico: '📋', cls: 'ico-c', h: 'Pre-Call Briefing Mode',        p: 'Before each simulation, reps see a full deal brief — company profile, stakeholder background, deal history. Builds thorough pre-call prep as muscle memory.', tags: [['ft-c','Deal context'],['ft-c','Stakeholder intel']] },
              { ico: '🎯', cls: 'ico-r', h: 'Adaptive Scenario Engine',      p: "RepReady tracks weak spots across sessions and surfaces the scenarios you need most. The more your reps practice, the harder it pushes where they're still losing.", tags: [['ft-r','Adaptive difficulty'],['ft-c','Progress tracking']] },
            ].map((f) => (
              <div className="feat-card" key={f.h}>
                <div className={`feat-ico ${f.cls}`} aria-hidden="true">{f.ico}</div>
                <h3 className="feat-h">{f.h}</h3>
                <p className="feat-p">{f.p}</p>
                <div className="feat-tags">{f.tags.map(([cls, label]) => <span className={`ftag ${cls}`} key={label}>{label}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section id="personas" aria-labelledby="persona-heading">
        <div className="wrap">
          <div className="reveal">
            <p className="s-tag">AI Buyer Personas</p>
            <h2 className="s-title" id="persona-heading">Meet the buyers your reps<br />will <em>face on every call.</em></h2>
            <p className="s-sub">Richard and Sandra aren&apos;t generic chatbots. They have full backstories, pressure tactics, and negotiation playbooks built to expose the real gaps in your team&apos;s approach.</p>
          </div>
          <div className="persona-grid reveal">
            <div className="persona">
              <div className="persona-accent-cyan" aria-hidden="true" />
              <div className="p-ava ava-c" aria-hidden="true">🧑‍💼</div>
              <h3 className="p-name">Richard Vance</h3>
              <p className="p-role">VP of Procurement · 500-person Logistics Firm</p>
              <ul className="p-traits">
                {[
                  'Anchors hard on price in the first 60 seconds. Expects you to flinch first.',
                  'Uses silence as a weapon — waits you out until you give something.',
                  'References 3 competing vendors whether they exist or not.',
                  'Escalates to CFO approval threat when backed into a corner.',
                ].map(t => (
                  <li className="p-trait" key={t}><div className="tpip tpip-c" aria-hidden="true" />{t}</li>
                ))}
              </ul>
            </div>
            <div className="persona">
              <div className="persona-accent-red" aria-hidden="true" />
              <div className="p-ava ava-r" aria-hidden="true">👩‍💼</div>
              <h3 className="p-name">Sandra Chen</h3>
              <p className="p-role">Head of IT · 800-person Financial Firm</p>
              <ul className="p-traits">
                {[
                  "Aggressively protects her team's bandwidth. Every response contains a blocker.",
                  'Claims zero implementation capacity this quarter.',
                  'Demands SOC 2 Type II before any further conversation.',
                  'Requires native SAML/SSO — uses it as a hard blocker.',
                ].map(t => (
                  <li className="p-trait" key={t}><div className="tpip tpip-r" aria-hidden="true" />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SCENARIOS EXPLORER */}
      <section className="scenarios-bg" id="scenarios" aria-labelledby="scenarios-heading">
        <div className="wrap">
          <div className="reveal">
            <p className="s-tag">Scenario Library</p>
            <h2 className="s-title" id="scenarios-heading">Every deal-killing situation.<br /><em>Simulated before it&apos;s real.</em></h2>
            <p className="s-sub">Click any scenario to see how it plays out. Built from the objections real B2B reps lose deals to every week.</p>
          </div>
          <div className="scenarios-container reveal">
            <div className="scenarios-list" role="list">
              {scenarios.map((sc, i) => (
                <button
                  key={i}
                  className={`scenario-btn${activeScenario === i ? ' active' : ''}`}
                  onClick={() => setActiveScenario(i)}
                  role="listitem"
                >
                  <div className={`sbtn-icon${activeScenario === i ? ' active' : ''}`} aria-hidden="true">
                    {['💰','⏳','🧊','⚔️','👻'][i]}
                  </div>
                  <div>
                    <div className="sbtn-title">{sc.label.split(' — ')[0]}</div>
                    <div className="sbtn-desc">{[
                      'Buyer reframes your value as cost. Demands line-item justification.',
                      'Champion goes quiet. Legal becomes an infinite delay loop.',
                      'Mid-call announcement: budgets frozen until Q2.',
                      'Buyer claims your competitor quoted 35% less. Match it or lose.',
                      "Your champion can't get the real decision maker in the room.",
                    ][i]}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="scenario-preview" aria-live="polite" aria-label="Scenario preview">
              <div className="sp-topbar" aria-hidden="true">
                <div className="sp-dots">
                  <div className="sp-dot" style={{ background: '#ff5f57' }} />
                  <div className="sp-dot" style={{ background: '#febc2e' }} />
                  <div className="sp-dot" style={{ background: '#28c840' }} />
                </div>
                <div className="sp-titlebar">REPREADY · LIVE PREVIEW</div>
              </div>
              <div className="sp-body">
                <div className="sp-scenario-label"><div className="chip-dot" />{s.label}</div>
                <div className="sp-chat">
                  {s.chat.map((c, i) => (
                    <div key={i} className={`sp-bbl sp-bbl-${c.side}`}>
                      <div className={`sp-spk sp-spk-${c.side}`}>{c.spk}</div>
                      {c.msg}
                    </div>
                  ))}
                </div>
                <div className="sp-coach"><strong>⚡ AI Coach:</strong> {s.coach}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="stats-bar" aria-hidden="true">
        <div className="stats-track">
          {[...Array(2)].flatMap((_, arrI) =>
            [
              { icon: '🎙️', label: 'Voice-to-voice negotiations powered by ElevenLabs' },
              { icon: '⚡',  label: 'Real-time coaching mid-call — not just post-debrief' },
              { icon: '📊', label: '8-dimension scoring on every session' },
              { icon: '🧠', label: 'Adaptive difficulty — gets harder as your reps improve' },
              { icon: '🔒', label: 'Encrypted session data — never shared or sold' },
              { icon: '🌏', label: 'Built for India & SEA B2B sales teams' },
            ].flatMap((item, itemI) => [
              <div className="stat-item" key={`item-${arrI}-${itemI}`}>
                <span className="stat-icon">{item.icon}</span>
                <span className="stat-text">{item.label}</span>
              </div>,
              <div className="stat-sep" key={`sep-${arrI}-${itemI}`} />,
            ])
          )}
        </div>
      </div>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-heading">
        <div className="wrap">
          <div className="reveal">
            <p className="s-tag">FAQ</p>
            <h2 className="s-title" id="faq-heading">Questions decision-makers ask<br /><em>before they say yes.</em></h2>
            <p className="s-sub">Whether you&apos;re a VP Sales, Founder, or CEO evaluating sales tools — these are the ones that matter.</p>
          </div>
          <div className="faq-grid reveal">
            {[
              { q: 'Will my reps actually use this, or will it sit unused?',       a: "RepReady is built for reps, not managers. Sessions take under 15 minutes, there's no scheduling overhead, and the gamified scoring creates a natural pull to improve. The AI buyers are hostile enough that reps find themselves wanting to win. Adoption comes from the product — not from enforcement." },
              { q: 'How is this different from just having managers do roleplay?',  a: "Manager roleplay is limited by time, availability, and the manager's willingness to be genuinely hostile. RepReady's AI buyers are available 24/7, consistently tough regardless of how many times you've run the same scenario, and give scored feedback that a manager can't replicate at scale." },
              { q: 'Can I see what my team is struggling with across sessions?',    a: 'Yes. The manager dashboard (Growth and Enterprise plans) shows aggregate coaching scores across your team — which objection types are consistently weak, where reps are giving away margin, and where confidence is improving. Visibility without sitting in on every call.' },
              { q: 'How fast can my team get up and running?',                      a: "Your first simulation runs in under 10 minutes from sign-up. No integration, no IT involvement, no calendar coordination. Add seats, send your reps a link, and they're in a live negotiation before your next standup." },
              { q: 'What does pricing look like and who handles the contract?',     a: 'RepReady starts at $49/seat/month with a 5-seat minimum. Volume discounts apply at 15+ seats. Enterprise plans come with an MSA and SLA. Payments processed via Paddle — works for Indian and global billing with proper invoicing.' },
              { q: 'Is our call and coaching data private?',                        a: "Yes. All session data is encrypted in transit and at rest. Your team's call recordings and coaching scores are not shared with third parties and are never used to train AI models without your explicit consent." },
            ].map((item, i) => (
              <div
                key={i}
                className={`faq-item${openFaq === i ? ' open' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <div className="faq-q">
                  {item.q}
                  <span className="faq-tog" aria-hidden="true">{openFaq === i ? '−' : '+'}</span>
                </div>
                {openFaq === i && <p className="faq-a">{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="price-bg" id="pricing" aria-labelledby="pricing-heading">
        <div className="wrap">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <p className="s-tag" style={{ textAlign: 'center' }}>Pricing</p>
            <h2 className="s-title" id="pricing-heading" style={{ textAlign: 'center', margin: '0 auto 12px' }}>
              Simple per-seat pricing.<br />No surprises.
            </h2>
            <p className="s-sub" style={{ margin: '0 auto', textAlign: 'center' }}>
              Minimum 5 seats. Volume discounts at 15+. Processed via Paddle — works for India and globally.
            </p>
          </div>
          <div className="pricing-grid reveal">
            {[
              {
                plan: 'Starter', price: '$49', per: '/seat/mo',
                desc: '5–14 seats. For teams getting started with AI sales training.',
                pop: false,
                features: [['check','All core scenarios'],['check','AI Coach post-call debrief'],['check','Deal health scoring'],['check','Text-based buyer personas'],['x','Voice personas (Richard & Sandra)'],['x','Manager analytics dashboard']],
                btn: 'Get Started', btnCls: 'bpo', href: '/deck',
              },
              {
                plan: 'Growth', price: '$79', per: '/seat/mo',
                desc: '5–14 seats. Full voice AI and real-time coaching for serious teams.',
                pop: true,
                features: [['check','Everything in Starter'],['check','Richard & Sandra voice personas'],['check','Real-time coaching mid-call'],['check','Pre-call briefing mode'],['check','Manager analytics dashboard'],['x','Custom scenarios']],
                btn: 'Start Free Trial', btnCls: 'bps', href: '/deck',
              },
              {
                plan: 'Enterprise', price: 'Custom', per: '',
                desc: '15+ seats. Volume pricing, custom scenarios, dedicated onboarding.',
                pop: false,
                features: [['check','Everything in Growth'],['check','Custom buyer personas'],['check','Custom scenario builder'],['check','Dedicated onboarding'],['check','SLA + priority support'],['check','MSA + SLA included']],
                btn: 'Talk to Sales', btnCls: 'bpo', href: DEMO_MAILTO,
              },
            ].map((card) => (
              <div key={card.plan} className={`price-card${card.pop ? ' pop' : ''}`}>
                {card.pop && <div className="pop-badge">Most Popular</div>}
                <div className="price-plan">{card.plan}</div>
                <div className="price-amt">{card.price}{card.per && <small>{card.per}</small>}</div>
                <p className="price-desc">{card.desc}</p>
                <hr className="price-hr" />
                <ul className="price-list">
                  {card.features.map(([type, label]) => (
                    <li key={label} className={type === 'x' ? 'off' : ''}>
                      <span className={type === 'check' ? 'pcheck' : 'px'}>{type === 'check' ? '✓' : '✗'}</span> {label}
                    </li>
                  ))}
                </ul>
                <a href={card.href}>
                  <button className={`btn-price ${card.btnCls}`}>{card.btn}</button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner" aria-labelledby="cta-heading">
        <div className="cta-glow" aria-hidden="true" />
        <div className="cta-grid" aria-hidden="true" />
        <div className="wrap">
          <h2 className="cta-h" id="cta-heading">
            Your reps are practising on<br /><em>real prospects. Every single day.</em>
          </h2>
          <p className="cta-sub">Stop paying that tuition in lost deals. Give your team a simulator that hits harder than reality — before they face the real thing.</p>
          <div className="cta-ctas">
            <a href="/deck">
              <button className="btn-cta-main">
                Start Free Trial — No Card Needed
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M2 6.5h9M7.5 2.5l4 4-4 4" stroke="#0a0d14" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </a>
            <a href={DEMO_MAILTO}>
              <button className="btn-cta-sec">Book a Team Demo</button>
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER — removed /about, /blog, /msa */}
      <footer role="contentinfo">
        <div className="ft-grid">
          <div>
            <a href="/" aria-label="RepReady home" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              <Logo height={26} repColor="#ffffff" />
            </a>
            <p className="ft-brand-desc">AI-powered B2B sales negotiation simulator. Built for reps who refuse to lose deals on preparation they could have done.</p>
          </div>
          <div>
            <p className="ft-col-h">Product</p>
            <ul className="ft-links">
              <li><a href="/deck">Simulator</a></li>
              <li><a href="/coach">AI Coach</a></li>
              <li><a href="/pricing">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="ft-col-h">Company</p>
            <ul className="ft-links">
              <li><a href="https://linkedin.com" rel="noopener">LinkedIn</a></li>
              <li><a href={DEMO_MAILTO}>Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="ft-col-h">Legal</p>
            <ul className="ft-links">
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="ft-bottom">
          <p className="ft-copy">© 2025 RepReady. Built in Navi Mumbai, India.</p>
          <div className="ft-legal">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </footer>
    </>
  )
}
