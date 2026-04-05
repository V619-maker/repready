import { useState, useCallback } from "react";

const MEMORY_KEY = "repready_memory_v1";

const DEFAULT_MEMORY = {
  sessions_completed: 0,
  avg_scores: {
    discovery: 0,
    objection_handling: 0,
    value_articulation: 0,
    executive_presence: 0,
  },
  recurring_gaps: [],
  scenarios_done: [],
  session_history: [],
};

function loadMemory() {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return { ...DEFAULT_MEMORY };
    return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

function saveMemory(mem) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
  } catch {
    console.warn("RepReady: could not save memory to localStorage");
  }
}

function rollingAvg(current, newVal, n) {
  if (n === 1) return newVal;
  return Math.round(((current * (n - 1) + newVal * 1.4) / (n + 0.4)) * 10) / 10;
}

export function useRepMemory() {
  const [memory, setMemory] = useState(() => loadMemory());

  const commitSession = useCallback((debrief, scenarioName) => {
    setMemory(prev => {
      const n = prev.sessions_completed + 1;

      const avg_scores = {};
      for (const key of Object.keys(prev.avg_scores)) {
        const newScore = debrief.scores?.[key] ?? 0;
        avg_scores[key] = rollingAvg(prev.avg_scores[key], newScore, n);
      }

      const newGaps = debrief.gaps ?? [];
      const allGaps = [...new Set([...newGaps, ...prev.recurring_gaps])].slice(0, 6);

      const scenarios_done = prev.scenarios_done.includes(scenarioName)
        ? prev.scenarios_done
        : [...prev.scenarios_done, scenarioName].slice(-20);

      const session_history = [
        ...prev.session_history,
        {
          date: new Date().toISOString().split("T")[0],
          scenario: scenarioName,
          scores: debrief.scores,
          verdict: debrief.verdict,
        },
      ].slice(-10);

      const updated = {
        sessions_completed: n,
        avg_scores,
        recurring_gaps: allGaps,
        scenarios_done,
        session_history,
      };

      saveMemory(updated);
      return updated;
    });
  }, []);

  const resetMemory = useCallback(() => {
    localStorage.removeItem(MEMORY_KEY);
    setMemory({ ...DEFAULT_MEMORY });
  }, []);

  const memoryContext = `
Rep's training history:
- Sessions completed: ${memory.sessions_completed}
- Average skill scores (rolling): ${JSON.stringify(memory.avg_scores)}
- Recurring gaps across sessions: ${memory.recurring_gaps.length > 0 ? memory.recurring_gaps.join("; ") : "none yet"}
- Scenarios already done: ${memory.scenarios_done.length > 0 ? memory.scenarios_done.join(", ") : "none yet"}
`.trim();

  return { memory, commitSession, resetMemory, memoryContext };
}
