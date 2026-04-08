// src/components/tabs/ExplainTab.jsx

import { useState } from "react";
import { SHAPBar, LIMEBar } from "../SharedComponents";
import { getSHAP, getLIME } from "../../utils/dataUtils";

export default function ExplainTab({ selected, mitigated, explanation, loadingExplain, C }) {
  const [explainMode, setExplainMode] = useState("shap"); // "shap" | "lime" | "compare"

  if (!selected) {
    return (
      <div style={{ textAlign: "center", padding: 50, color: C.muted }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
        <div style={{ marginBottom: 6, fontSize: 12 }}>Select a candidate from the Candidates tab</div>
        <div style={{ fontSize: 10 }}>Supports SHAP · LIME · Side-by-side comparison</div>
      </div>
    );
  }

  const shap = getSHAP(selected, mitigated);
  const lime = getLIME(selected, mitigated);

  const AIPanel = () => (
    <div style={{ background: C.panel, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 12 }}>
        AI Audit Explanation (Claude-powered)
      </div>
      {loadingExplain ? (
        <div style={{ textAlign: "center", padding: 30, color: C.muted, fontSize: 11 }}>⚙ Generating explanation...</div>
      ) : explanation ? (
        <div style={{ fontSize: 11, lineHeight: 1.8, color: C.text }}>{explanation}</div>
      ) : (
        <div style={{ color: C.muted, fontSize: 11 }}>Explanation loading...</div>
      )}
    </div>
  );

  return (
    <div>
      {/* Candidate header */}
      <div style={{
        background: C.panel, borderRadius: 10, padding: 14,
        border: `1px solid ${C.border}`, marginBottom: 14,
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>EXPLAINING DECISION FOR</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{selected.name}</div>
          <div style={{ fontSize: 10, color: C.muted2, marginTop: 3 }}>
            {selected.gender} · {selected.ethnicity} · {selected.education} · GPA {selected.gpa} · {selected.years_exp}yr exp
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span style={{
            background: selected.hired ? C.green + "22" : C.red + "22",
            color: selected.hired ? C.green : C.red,
            padding: "3px 10px", borderRadius: 5, fontSize: 12, fontWeight: 700,
          }}>
            {selected.hired ? "✓ HIRED" : "✗ REJECTED"} · {selected.score}/10
          </span>
          {/* Mode switcher */}
          <div style={{ display: "flex", gap: 5 }}>
            {["shap", "lime", "compare"].map(m => (
              <button
                key={m}
                onClick={() => setExplainMode(m)}
                style={{
                  background: explainMode === m ? C.accent2 : C.panel2,
                  border: `1px solid ${explainMode === m ? C.accent2 : C.border}`,
                  color: explainMode === m ? "#fff" : C.muted2,
                  padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                  fontSize: 10, fontFamily: "monospace", fontWeight: 700,
                }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SHAP view ── */}
      {explainMode === "shap" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: C.panel, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 12 }}>
              SHAP Feature Contributions
            </div>
            {shap.map(s => <SHAPBar key={s.feature} {...s} C={C} />)}
            <div style={{ fontSize: 9, color: C.muted, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              ⚠ Yellow = bias factor · Green = positive · Red = negative
              {mitigated ? " · Bias neutralized" : ""}
            </div>
          </div>
          <AIPanel />
        </div>
      )}

      {/* ── LIME view ── */}
      {explainMode === "lime" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: C.panel, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 }}>
              LIME Local Explanation
            </div>
            <div style={{ fontSize: 9, color: C.muted, marginBottom: 12 }}>
              How much the hiring score changes per ±1 unit in each feature
            </div>
            {lime.map(l => <LIMEBar key={l.feature} {...l} />)}
            <div style={{ fontSize: 9, color: C.muted, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              LIME perturbs inputs locally to estimate marginal feature impact on the model output
            </div>
          </div>
          <AIPanel />
        </div>
      )}

      {/* ── Compare view ── */}
      {explainMode === "compare" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ background: C.panel, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 12 }}>SHAP Values</div>
            {shap.map(s => <SHAPBar key={s.feature} {...s} C={C} />)}
          </div>
          <div style={{ background: C.panel, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.accent2, marginBottom: 12 }}>LIME Sensitivities</div>
            {lime.map(l => <LIMEBar key={l.feature} {...l} C={C} />)}
          </div>
          <AIPanel />
        </div>
      )}
    </div>
  );
}
