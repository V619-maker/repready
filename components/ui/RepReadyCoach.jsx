import { useState, useRef, useEffect, useCallback } from "react";
import { useRepMemory } from "../../hooks/useRepMemory";

const BUYER_SYSTEM = `You are a skeptical CFO who has just joined a vendor's sales call mid-way through. You are analytical, cost-focused, and do not tolerate vague answers. Push back on generic ROI claims. Ask pointed questions about implementation cost, timeline to value, and proof points. Keep every response to 2-3 sentences maximum. You're not hostile — just rigorous and time-constrained.`;

const COACH_SYSTEM = `You are a real-time B2B sales coach watching a live enterprise sales call. After the rep's last message, assess if there's a tactical coaching moment.
Respond ONLY with valid JSON, nothing else: {"tip": "one tactical sentence, or null if the rep handled it well", "quality": "good|needs_work"}
Only flag genuine issues. Never over-coach. Be brutally specific — not generic advice like "be more confident".`;

const DEBRIEF_SYSTEM = `You are a senior B2B sales coach. Analyze this sales call transcript and provide a crisp debrief.
Respond ONLY with valid JSON, nothing else:
{"scores":{"discovery":1-10,"objection_handling":1-10,"value_articulation":1-10,"executive_presence":1-10},"strengths":["one concrete sentence","one concrete sentence"],"gaps":["one concrete sentence","one concrete sentence"],"verdict":"one sentence overall verdict"}`;

const buildAdaptiveSystem = (memoryContext) =>
  `You are a sales training advisor with full visibility into this rep's training history.
${memoryContext}

Given the above history and the scores/gaps from their LATEST session, recommend the single best next scenario.
IMPORTANT: Never recommend a scenario already in their "scenarios done" list.
Respond ONLY with valid JSON, nothing else:
{"scenario_name":"catchy short name","scenario_type":"Cold Call|Objection Handling|Discovery|Executive Negotiation|Multi-stakeholder","why":"one sentence linking to their persistent weak spot across sessions","difficulty":"Beginner|Intermediate|Advanced","focus":"the specific micro-skill to sharpen"}`;

async function callCoach(messages, system, maxTokens = 300) {
  const res = await fetch("/api/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  if (!data.text) throw new Error("No response from API");
  return data.text;
}

function userMsg(text) {
  return { role: "user", parts: [{ text }] };
}

function toGeminiHistory(messages) {
  return messages.map(m => ({
    role: m.role === "buyer" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function safeParseJSON(str) {
  try {
    return JSON.parse(str.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

function ScoreBar({ label, score, prevScore }) {
  const color = score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#f43f5e";
  const delta = prevScore != null ? Math.round((score - prevScore) * 10) / 10 : null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
        <span style={{ color: "#9ca3af", fontFamily: "'DM Mono', monospace", letterSpacing: "0.03em" }}>{label}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {delta !== null && delta !== 0 && (
            <span style={{ fontSize: 10, color: delta > 0 ? "#10b981" : "#f43f5e", fontFamily: "'DM Mono', monospace" }}>
              {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
            </span>
          )}
          <span style={{ fontWeight: 600, color, fontFamily: "'DM Mono', monospace" }}>{score}/10</span>
        </div>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${score * 10}%`, background: color, borderRadius: 2, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
      </div>
    </div>
  );
}

function MemoryBadge({ memory }) {
  if (memory.sessions_completed === 0) return null;
  return (
    <div style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(109,40,217,0.2)", border: "1px solid rgba(139,92,246,0.3)", fontSize: 10, color: "#a78bfa", fontFamily: "'DM Mono', monospace" }}>
      {memory.sessions_completed} session{memory.sessions_completed !== 1 ? "s" : ""}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "rgba(255,255,255,0.05)", borderRadius: "4px 12px 12px 12px", width: 52, alignItems: "center" }}>
      {[0, 0.18, 0.36].map((d, i) => (
        <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#6b7280", animation: `repBounce 1.1s ease-in-out ${d}s infinite` }} />
      ))}
    </div>
  );
}

const SCENARIO_NAME = "CFO Pushback";
const diffPalette = { Beginner: "#10b981", Intermediate: "#f59e0b", Advanced: "#f43f5e" };

export default function RepReadyCoach() {
  const { memory, commitSession, resetMemory, memoryContext } = useRepMemory();

  const [phase, setPhase] = useState("live");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tips, setTips] = useState([]);
  const [debrief, setDebrief] = useState(null);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [nextDrill, setNextDrill] = useState(null);
  const [nextLoading, setNextLoading] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const startCall = useCallback(async () => {
    setBusy(true);
    setCallActive(false);
    try {
      const opener = await callCoach(
        [userMsg("Start the call. One brief sentence intro, then immediately ask your hardest first question about business justification or ROI.")],
        BUYER_SYSTEM, 90
      );
      setMessages([{ role: "buyer", content: opener }]);
    } catch {
      setMessages([{ role: "buyer", content: "I was just pulled into this — walk me through the actual business case here. What problem are we solving and what's the cost?" }]);
    }
    setBusy(false);
    setCallActive(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => { startCall(); }, [startCall]);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, busy]);

  async function handleSend() {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);
    setBusy(true);

    const history = toGeminiHistory(updated);
    const exchangeNum = updated.filter(m => m.role === "user").length;

    const [buyerRes, coachRes] = await Promise.allSettled([
      callCoach(history, BUYER_SYSTEM, 100),
      callCoach(
        [userMsg(`Exchange #${exchangeNum} in a CFO pushback scenario. Rep just said: "${text}"`)],
        COACH_SYSTEM, 90
      ),
    ]);

    if (buyerRes.status === "fulfilled") {
      setMessages(prev => [...prev, { role: "buyer", content: buyerRes.value }]);
    } else {
      setMessages(prev => [...prev, { role: "buyer", content: "Let me stop you there — can you give me a specific number? What's the measurable outcome?" }]);
    }

    if (coachRes.status === "fulfilled") {
      const parsed = safeParseJSON(coachRes.value);
      if (parsed?.tip) {
        setTips(prev => [...prev.slice(-4), { text: parsed.tip, id: Date.now(), rating: null }]);
      }
    }

    setBusy(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function rateTip(id, rating) {
    setTips(prev => prev.map(t => t.id === id ? { ...t, rating } : t));
  }

  async function handleEndCall() {
    setPhase("debrief");
    setDebriefLoading(true);
    const transcript = messages.map(m => `${m.role === "buyer" ? "CFO" : "Rep"}: ${m.content}`).join("\n\n");
    const res = await callCoach(
      [userMsg(`Full transcript:\n\n${transcript}`)],
      DEBRIEF_SYSTEM, 400
    ).catch(() => null);
    const parsed = res ? safeParseJSON(res) : null;
    const result = parsed || {
      scores: { discovery: 5, objection_handling: 6, value_articulation: 7, executive_presence: 5 },
      strengths: ["Maintained composure under unexpected executive pressure", "Attempted to anchor value early in the conversation"],
      gaps: ["Didn't probe the CFO's specific success metrics before pitching", "Relied on generic ROI language instead of proof points"],
      verdict: "Solid foundation, but needs sharper executive-level precision to close at this level",
    };
    setDebrief(result);
    commitSession(result, SCENARIO_NAME);
    setDebriefLoading(false);
  }

  async function handleGetNextDrill() {
    if (!debrief) return;
    setNextLoading(true);
    const res = await callCoach(
      [userMsg(`Scores: ${JSON.stringify(debrief.scores)}. Identified gaps: ${debrief.gaps.join("; ")}`)],
      buildAdaptiveSystem(memoryContext),
      200
    ).catch(() => null);
    const parsed = res ? safeParseJSON(res) : null;
    setNextDrill(parsed || {
      scenario_name: "The Budget Freeze",
      scenario_type: "Executive Negotiation",
      why: "Your discovery and executive presence scores show you need more reps probing C-suite priorities before presenting ROI",
      difficulty: "Advanced",
      focus: "Executive-level discovery before pitching",
    });
    setNextLoading(false);
    setPhase("next_drill");
  }

  function fullReset() {
    setMessages([]);
    setTips([]);
    setDebrief(null);
    setNextDrill(null);
    setPhase("live");
    setCallActive(false);
    startCall();
  }

  const base = {
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: "#0f0f12",
    minHeight: 520,
    color: "#e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  };

  return (
    <div style={base}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes repBounce { 0%,80%,100%{transform:translateY(0);opacity:0.35} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes repFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes repPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .rep-input:focus { outline: none; border-color: rgba(139,92,246,0.6) !important; }
        .rep-btn-primary:hover { background: #7c3aed !important; }
        .rep-btn-primary:active { transform: scale(0.98); }
        .rep-btn-end:hover { background: rgba(244,63,94,0.15) !important; border-color: rgba(244,63,94,0.4) !important; color: #f43f5e !important; }
        .rep-tip { animation: repFadeIn 0.35s ease; }
        .rep-msg { animation: repFadeIn 0.25s ease; }
        .thumb-btn { background: none; border: none; cursor: pointer; padding: 2px 5px; border-radius: 4px; font-size: 12px; opacity: 0.4; transition: opacity 0.15s; }
        .thumb-btn:hover { opacity: 1; }
        .thumb-btn.active { opacity: 1; }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0d0d10" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#6d28d9,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>R</span>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: 13, color: "#f3f4f6" }}>RepReady</span>
            <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>/ CFO Pushback</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MemoryBadge memory={memory} />
          {memory.sessions_completed > 0 && (
            <button onClick={resetMemory} style={{ background: "none", border: "none", color: "#374151", fontSize: 10, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}>
              reset memory
            </button>
          )}
          {[["live", "Live call"], ["debrief", "Debrief"], ["next_drill", "Next drill"]].map(([p, label], i) => (
            <div key={p} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <span style={{ color: "#374151", fontSize: 10, margin: "0 4px" }}>›</span>}
              <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500,
                background: phase === p ? "rgba(109,40,217,0.25)" : "transparent",
                color: phase === p ? "#a78bfa" : "#4b5563",
                border: phase === p ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
              }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE PHASE */}
      {phase === "live" && (
        <div style={{ display: "flex", height: 456 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 20px", minWidth: 0 }}>
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", paddingRight: 4, marginBottom: 12 }}>
              {messages.map((m, i) => (
                <div key={i} className="rep-msg" style={{ marginBottom: 14, display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>
                    {m.role === "buyer" ? "CFO" : "YOU"}
                  </div>
                  <div style={{
                    maxWidth: "78%", padding: "10px 14px",
                    borderRadius: m.role === "buyer" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                    background: m.role === "buyer" ? "rgba(255,255,255,0.06)" : "rgba(109,40,217,0.4)",
                    border: m.role === "buyer" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(139,92,246,0.35)",
                    color: m.role === "buyer" ? "#d1d5db" : "#e9d5ff",
                    fontSize: 13, lineHeight: 1.6,
                  }}>{m.content}</div>
                </div>
              ))}
              {busy && messages[messages.length - 1]?.role === "user" && <TypingDots />}
              {!callActive && messages.length === 0 && (
                <div style={{ textAlign: "center", paddingTop: 60, color: "#4b5563", fontSize: 13 }}>Connecting to buyer...</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                className="rep-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && !busy && handleSend()}
                placeholder={busy ? "Buyer is responding..." : "Your response..."}
                disabled={busy}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f3f4f6", fontSize: 13, transition: "border-color 0.2s" }}
              />
              <button className="rep-btn-primary" onClick={handleSend} disabled={busy || !input.trim()}
                style={{ padding: "10px 16px", borderRadius: 8, background: "#6d28d9", color: "#fff", border: "none", cursor: busy || !input.trim() ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, opacity: busy || !input.trim() ? 0.45 : 1, transition: "all 0.15s" }}>
                Send
              </button>
              {messages.length >= 3 && (
                <button className="rep-btn-end" onClick={handleEndCall}
                  style={{ padding: "10px 12px", borderRadius: 8, background: "transparent", color: "#6b7280", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontSize: 12, transition: "all 0.15s", whiteSpace: "nowrap" }}>
                  End call
                </button>
              )}
            </div>
          </div>

          {/* Coach sidebar */}
          <div style={{ width: 210, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0e", display: "flex", flexDirection: "column", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "repPulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", fontWeight: 500 }}>AI COACH</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {tips.length === 0 ? (
                <div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.7 }}>
                  Coach is watching every exchange. Tactical tips will surface here when there's something worth flagging.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {tips.map((tip, i) => (
                    <div key={tip.id} className="rep-tip" style={{
                      padding: "10px 12px", borderRadius: 8,
                      background: i === tips.length - 1 ? "rgba(109,40,217,0.15)" : "rgba(255,255,255,0.03)",
                      borderLeft: `2px solid ${i === tips.length - 1 ? "#8b5cf6" : "#374151"}`,
                      fontSize: 12, lineHeight: 1.6, color: i === tips.length - 1 ? "#c4b5fd" : "#4b5563",
                      transition: "all 0.3s",
                    }}>
                      <div style={{ fontSize: 9, color: i === tips.length - 1 ? "#7c3aed" : "#374151", fontWeight: 600, marginBottom: 5, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>TIP #{i + 1}</div>
                      {tip.text}
                      <div style={{ marginTop: 6, display: "flex", gap: 2 }}>
                        <button className={`thumb-btn${tip.rating === "up" ? " active" : ""}`} onClick={() => rateTip(tip.id, "up")}>👍</button>
                        <button className={`thumb-btn${tip.rating === "down" ? " active" : ""}`} onClick={() => rateTip(tip.id, "down")}>👎</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {memory.sessions_completed > 0 ? (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 9, color: "#374151", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", marginBottom: 8 }}>YOUR AVERAGES</div>
                {Object.entries(memory.avg_scores).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "#4b5563", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                    <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: v >= 7 ? "#10b981" : v >= 5 ? "#f59e0b" : "#f43f5e" }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "#374151", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", marginBottom: 6 }}>SCENARIO</div>
                <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.6 }}>CFO joined mid-call. VP Procurement is also on. ROI is being questioned.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DEBRIEF PHASE */}
      {phase === "debrief" && (
        <div style={{ padding: "24px 24px 20px" }}>
          {debriefLoading ? (
            <div style={{ textAlign: "center", padding: "70px 0" }}>
              <div style={{ fontSize: 12, color: "#4b5563", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", animation: "repPulse 1.5s infinite" }}>ANALYZING SESSION...</div>
            </div>
          ) : debrief && (
            <div>
              <div style={{ padding: "13px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 8, marginBottom: 20, border: "1px solid rgba(255,255,255,0.07)", fontSize: 14, color: "#d1d5db", lineHeight: 1.6 }}>
                {debrief.verdict}
              </div>
              <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: 18, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 9, color: "#6b7280", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 20 }}>
                    SKILL SCORES {memory.sessions_completed > 1 ? "· vs your avg" : ""}
                  </div>
                  <ScoreBar label="Discovery" score={debrief.scores.discovery} prevScore={memory.sessions_completed > 1 ? memory.avg_scores.discovery : null} />
                  <ScoreBar label="Objection handling" score={debrief.scores.objection_handling} prevScore={memory.sessions_completed > 1 ? memory.avg_scores.objection_handling : null} />
                  <ScoreBar label="Value articulation" score={debrief.scores.value_articulation} prevScore={memory.sessions_completed > 1 ? memory.avg_scores.value_articulation : null} />
                  <ScoreBar label="Executive presence" score={debrief.scores.executive_presence} prevScore={memory.sessions_completed > 1 ? memory.avg_scores.executive_presence : null} />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ flex: 1, padding: 16, background: "rgba(16,185,129,0.05)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.15)" }}>
                    <div style={{ fontSize: 9, color: "#10b981", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 12 }}>STRENGTHS</div>
                    {debrief.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #10b981" }}>{s}</div>
                    ))}
                  </div>
                  <div style={{ flex: 1, padding: 16, background: "rgba(245,158,11,0.05)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div style={{ fontSize: 9, color: "#f59e0b", fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 12 }}>GAPS TO CLOSE</div>
                    {debrief.gaps.map((g, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #f59e0b" }}>{g}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#4b5563", textAlign: "center", marginBottom: 14, fontFamily: "'DM Mono', monospace" }}>
                Session #{memory.sessions_completed} saved to memory
              </div>
              <button className="rep-btn-primary" onClick={handleGetNextDrill}
                style={{ width: "100%", padding: "12px", borderRadius: 8, background: "#6d28d9", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                What should I drill next? →
              </button>
            </div>
          )}
        </div>
      )}

      {/* NEXT DRILL PHASE */}
      {phase === "next_drill" && (
        <div style={{ padding: "24px 24px 20px" }}>
          {nextLoading ? (
            <div style={{ textAlign: "center", padding: "70px 0" }}>
              <div style={{ fontSize: 12, color: "#4b5563", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", animation: "repPulse 1.5s infinite" }}>
                SCANNING {memory.sessions_completed} SESSION{memory.sessions_completed !== 1 ? "S" : ""} FOR PATTERNS...
              </div>
            </div>
          ) : nextDrill && (
            <div>
              <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 18, fontFamily: "'DM Mono', monospace" }}>
                COACH RECOMMENDATION — based on {memory.sessions_completed} session{memory.sessions_completed !== 1 ? "s" : ""}
              </div>
              <div style={{ padding: 22, background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: "#f3f4f6", marginBottom: 5 }}>{nextDrill.scenario_name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", fontFamily: "'DM Mono', monospace" }}>{nextDrill.scenario_type}</div>
                  </div>
                  <span style={{
                    fontSize: 10, padding: "4px 12px", borderRadius: 20, fontWeight: 600, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em",
                    background: `${(diffPalette[nextDrill.difficulty] || "#6d28d9")}18`,
                    color: diffPalette[nextDrill.difficulty] || "#a78bfa",
                    border: `1px solid ${(diffPalette[nextDrill.difficulty] || "#6d28d9")}40`,
                  }}>{nextDrill.difficulty?.toUpperCase()}</span>
                </div>
                <div style={{ padding: "12px 14px", background: "rgba(109,40,217,0.12)", borderRadius: 8, borderLeft: "3px solid #7c3aed", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "#7c3aed", fontWeight: 600, marginBottom: 6, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>WHY THIS DRILL</div>
                  <div style={{ fontSize: 13, color: "#c4b5fd", lineHeight: 1.6 }}>{nextDrill.why}</div>
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 22 }}>
                  Focus skill: <span style={{ fontWeight: 500, color: "#d1d5db" }}>{nextDrill.focus}</span>
                </div>
                {memory.recurring_gaps.length > 0 && (
                  <div style={{ marginBottom: 22, padding: "12px 14px", background: "rgba(245,158,11,0.06)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div style={{ fontSize: 9, color: "#f59e0b", fontWeight: 600, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>PERSISTENT GAPS ACROSS SESSIONS</div>
                    {memory.recurring_gaps.slice(0, 3).map((g, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, marginBottom: 4 }}>· {g}</div>
                    ))}
                  </div>
                )}
                <button className="rep-btn-primary" onClick={fullReset}
                  style={{ width: "100%", padding: "12px", borderRadius: 8, background: "#6d28d9", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  Start this drill →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
