// src/components/tabs/ChatTab.jsx

import { useRef, useEffect, useState } from "react";

const SUGGESTIONS = [
  "What does DIR < 0.8 mean?",
  "How does SHAP differ from LIME?",
  "Why is gender bias harmful?",
  "How does reweighting reduce bias?",
  "What is the 80% rule?",
  "Explain statistical parity",
  "How do I improve my model?",
  "What is a black-box AI?",
];

export default function ChatTab({ candidates, fairness, fairnessBefore, fairnessAfter, mitigated, C }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput,   setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatLoading(true);
    const newHistory = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHistory);

    const sys = `You are an expert AI fairness auditor helping Kago Kebonye (BIUST final year student) understand their AI hiring bias dashboard.
Current: ${candidates.length} candidates, ${candidates.filter(c => c.hired).length} hired, mitigation ${mitigated ? "APPLIED" : "NOT applied"}.
Metrics: DIR=${fairness?.dir}, SPD=${fairness?.spd}, EOD=${fairness?.eod}.
Before mitigation DIR=${fairnessBefore?.dir}, After=${fairnessAfter?.dir}.
Be educational, reference SHAP, LIME, AIF360, Fairlearn, DIR/SPD/EOD concepts. Keep answers to 3-5 sentences.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: sys,
          messages: newHistory,
        }),
      });
      const data = await res.json();
      setChatHistory([...newHistory, { role: "assistant", content: data.content?.[0]?.text || "Error." }]);
    } catch {
      setChatHistory([...newHistory, { role: "assistant", content: "Connection error." }]);
    }
    setChatLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 210px)" }}>
      {/* Message list */}
      <div style={{ flex: 1, overflowY: "auto", marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {chatHistory.length === 0 && (
          <div style={{ textAlign: "center", padding: 30, color: C.muted }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
            <div style={{ marginBottom: 14, fontSize: 11 }}>
              Ask the AI auditor anything about bias, fairness, or your results
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
              {SUGGESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => setChatInput(q)}
                  style={{
                    background: C.panel, border: `1px solid ${C.border}`, color: C.accent,
                    padding: "5px 10px", borderRadius: 14, fontSize: 9, cursor: "pointer", fontFamily: "monospace",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "78%",
              background: msg.role === "user" ? C.accent2 + "33" : C.panel,
              border: `1px solid ${msg.role === "user" ? C.accent2 + "55" : C.border}`,
              borderRadius: 10, padding: "10px 14px", fontSize: 11, lineHeight: 1.7,
            }}
          >
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
              {msg.role === "user" ? "YOU" : "AI AUDITOR"}
            </div>
            {msg.content}
          </div>
        ))}

        {chatLoading && (
          <div style={{ alignSelf: "flex-start", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 11, color: C.muted }}>
            ⚙ Thinking...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendChat()}
          placeholder="Ask about bias, fairness metrics, SHAP, LIME, mitigation..."
          style={{
            flex: 1, background: C.panel, border: `1px solid ${C.border}`,
            color: C.text, borderRadius: 8, padding: "10px 14px",
            fontSize: 11, fontFamily: "monospace", outline: "none",
          }}
        />
        <button
          onClick={sendChat}
          disabled={chatLoading}
          style={{
            background: C.accent, color: C.bg, border: "none", borderRadius: 8,
            padding: "10px 18px", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "monospace",
          }}
        >
          SEND →
        </button>
      </div>
    </div>
  );
}
