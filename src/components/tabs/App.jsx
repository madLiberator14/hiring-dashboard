// src/App.jsx

// Main orchestrator — connected to real Python ML backend
// Falls back to simulation if backend is offline

import { useState, useEffect } from "react";
import { generateCandidates, scoreBiased, scoreFair, computeFairness, getSHAP, getLIME } from "./utils/dataUtils";
import { checkHealth, fetchCandidates, fetchFairness, fetchSHAP, fetchLIME } from "./utils/api";

import CandidatesTab  from "./components/tabs/CandidatesTab";
import UploadTab      from "./components/tabs/UploadTab";
import FairnessTab    from "./components/tabs/FairnessTab";
import ExplainTab     from "./components/tabs/ExplainTab";
import MitigationTab  from "./components/tabs/MitigationTab";
import ChatTab        from "./components/tabs/ChatTab";

const C = { bg: "#07090f", panel: "#0d1117", panel2: "#111827", border: "#1a2535", accent: "#00d4ff", accent2: "#7c3aed", green: "#10b981", red: "#ef4444", yellow: "#f59e0b", orange: "#f97316", text: "#e2e8f0", muted: "#4b5563", muted2: "#6b7280" };


const TABS = [
  ["candidates", "👥 Candidates"],
  ["upload",     "📂 Upload CSV"],
  ["fairness",   "📊 Fairness"],
  ["explain",    "🔍 Explain"],
  ["mitigation", "⚖ Mitigation"],
  ["chat",       "💬 Ask AI"],
];

export default function App() {
  const [rawCandidates,  setRawCandidates]  = useState([]);
  const [mitigated,      setMitigated]      = useState(false);
  const [mitigating,     setMitigating]     = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selected,       setSelected]       = useState(null);
  const [explanation,    setExplanation]    = useState("");
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [tab,            setTab]            = useState("candidates");
  const [csvError,       setCsvError]       = useState("");
  const [backendOnline,  setBackendOnline]  = useState(false);
  const [backendChecked, setBackendChecked] = useState(false);
  const [fairnessData,   setFairnessData]   = useState(null);

  const candidates = rawCandidates.map(c => {
    const biasedScore = c.biasedScore ?? scoreBiased(c);
    const fairScore   = c.fairScore   ?? scoreFair(c);
    const score       = mitigated ? fairScore : biasedScore;
    return { ...c, score, biasedScore, fairScore, hired: score >= 6.5 };
  });

  const fairness       = fairnessData ?? (candidates.length ? computeFairness(candidates) : null);
  const fairnessBefore = rawCandidates.length ? computeFairness(rawCandidates.map(c => ({ ...c, hired: scoreBiased(c) >= 6.5 }))) : null;
  const fairnessAfter  = rawCandidates.length ? computeFairness(rawCandidates.map(c => ({ ...c, hired: scoreFair(c)  >= 6.5 }))) : null;

  useEffect(() => {
    async function init() {
      const online = await checkHealth();
      setBackendOnline(online);
      setBackendChecked(true);
      if (online) {
        try {
          const [cands, fair] = await Promise.all([fetchCandidates(20), fetchFairness(false)]);
          const mapped = cands.map(c => ({ ...c, biasedScore: c.score, fairScore: Math.min(10, c.score * 0.88) }));
          setRawCandidates(mapped);
          setFairnessData({ dir: fair.gender.dir, spd: fair.gender.spd, eod: fair.gender.eod, maleRate: fair.gender.privileged_rate, femaleRate: fair.gender.unprivileged_rate });
        } catch { setRawCandidates(generateCandidates(16)); }
      } else {
        setRawCandidates(generateCandidates(16));
      }
    }
    init();
  }, []);

  function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const lines   = e.target.result.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/ /g, "_"));
        const parsed  = lines.slice(1).filter(l => l.trim()).map((line, i) => {
          const vals = line.split(",").map(v => v.trim());
          const obj  = { id: i };
          headers.forEach((h, j) => { const v = vals[j] ?? ""; obj[h] = isNaN(v) || v === "" ? v : +v; });
          if (!obj.name)             obj.name             = `Candidate ${i+1}`;
          if (!obj.gender)           obj.gender           = "Male";
          if (!obj.ethnicity)        obj.ethnicity        = "Group A";
          if (!obj.education)        obj.education        = "Bachelors";
          if (!obj.gpa)              obj.gpa              = 3.0;
          if (!obj.years_exp)        obj.years_exp        = 0;
          if (!obj.technical_skills) obj.technical_skills = 5;
          if (!obj.soft_skills)      obj.soft_skills      = 5;
          if (!obj.certifications)   obj.certifications   = 0;
          return obj;
        });
        if (!parsed.length) throw new Error("empty");
        setRawCandidates(parsed); setMitigated(false); setSelected(null); setExplanation(""); setCsvError(""); setTab("candidates");
      } catch { setCsvError("Could not parse CSV. Check column headers match the template."); }
    };
    reader.readAsText(file);
  }

  async function runMitigation() {
    setMitigating(true);
    await new Promise(r => setTimeout(r, 1400));
    if (backendOnline) {
      try {
        const fair = await fetchFairness(true);
        setFairnessData({ dir: fair.gender.dir, spd: fair.gender.spd, eod: fair.gender.eod, maleRate: fair.gender.privileged_rate, femaleRate: fair.gender.unprivileged_rate });
      } catch {}
    }
    setMitigated(true); setMitigating(false); setShowComparison(true); setTab("mitigation");
  }

  async function explainCandidate(c) {
    setSelected(c); setTab("explain"); setLoadingExplain(true); setExplanation("");
    let shapData = getSHAP(c, mitigated);
    let limeData = getLIME(c, mitigated);
    if (backendOnline && c.id !== undefined) {
      try {
        const [realShap, realLime] = await Promise.all([fetchSHAP(c.id), fetchLIME(c.id)]);
        shapData = realShap.map(s => ({ feature: s.feature, value: s.shap_value, raw: s.feature_value, isBias: s.is_bias, mitigated }));
        limeData = realLime.map(l => ({ feature: l.feature, sensitivity: l.weight, value: "" }));
      } catch {}
    }
    const prompt = `You are an AI hiring system auditor for a BIUST final year research project on bias in AI recruitment systems.

Candidate: ${c.name} | Gender: ${c.gender} | Ethnicity: ${c.ethnicity} | Education: ${c.education}
GPA: ${c.gpa} | Experience: ${c.years_exp}yrs | Tech: ${c.technical_skills}/10 | Soft: ${c.soft_skills}/10
Score: ${c.score}/10 | Decision: ${c.hired ? "HIRED ✓" : "REJECTED ✗"} | Model: ${backendOnline ? "Real scikit-learn RF" : "Simulated"} | Mitigation: ${mitigated ? "APPLIED" : "NOT applied"}

Top SHAP contributions:
${shapData.slice(0, 5).map(s => `  ${s.feature}: ${typeof s.value === "number" ? (s.value >= 0 ? "+" : "") + s.value.toFixed(3) : s.value}${s.isBias ? " ← BIAS" : ""}`).join("\n")}

Write 4-5 sentences: (1) Main merit factors driving this decision. (2) How bias factors impacted the score. (3) What mitigation did or would do. (4) One concrete recommendation for fairer hiring.`;

    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      setExplanation(data.content?.[0]?.text || "Unable to generate explanation.");
    } catch { setExplanation("Error connecting to explanation service."); }
    setLoadingExplain(false);
  }

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: C.bg, minHeight: "100vh", color: C.text }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.bg} 0%, ${C.panel2} 100%)`, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: C.accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 2 }}>BIUST · Kago Kebonye · Final Year Project 2025</div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: -0.5 }}>AI Hiring <span style={{ color: C.accent }}>Transparency</span> & Bias Audit Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {backendChecked && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Backend</div>
              <div style={{ fontSize: 11, color: backendOnline ? C.green : C.yellow, fontWeight: 700 }}>{backendOnline ? "🟢 LIVE ML" : "🟡 SIMULATED"}</div>
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Mitigation</div>
            <div style={{ fontSize: 11, color: mitigated ? C.green : C.yellow, fontWeight: 700 }}>{mitigated ? "✓ APPLIED" : "⚠ INACTIVE"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Fairness</div>
            <div style={{ fontSize: 11, color: fairness?.dir >= 0.8 ? C.green : C.red, fontWeight: 700 }}>{fairness?.dir >= 0.8 ? "✓ FAIR" : "⚠ BIASED"}</div>
          </div>
        </div>
      </div>

      {/* Offline banner */}
      {backendChecked && !backendOnline && (
        <div style={{ background: C.yellow + "22", borderBottom: `1px solid ${C.yellow}44`, padding: "8px 24px", fontSize: 11, color: C.yellow }}>
          ⚠ Python backend offline — running in simulation mode. To enable real ML:
          <code style={{ background: C.bg, padding: "1px 8px", borderRadius: 3, marginLeft: 8 }}>cd hiring-backend && python app.py</code>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 20px", overflowX: "auto" }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ background: "none", border: "none", color: tab === key ? C.accent : C.muted2, padding: "10px 14px", cursor: "pointer", fontSize: 11, fontWeight: tab === key ? 700 : 400, borderBottom: tab === key ? `2px solid ${C.accent}` : "2px solid transparent", fontFamily: "'Courier New', monospace", whiteSpace: "nowrap", transition: "color 0.2s" }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        {tab === "candidates"  && <CandidatesTab candidates={candidates} selected={selected} mitigated={mitigated} mitigating={mitigating} onSelectCandidate={explainCandidate} onRegenerate={() => { setRawCandidates(generateCandidates(16)); setMitigated(false); setSelected(null); setFairnessData(null); }} onMitigate={runMitigation} onRemoveMitigation={() => { setMitigated(false); setShowComparison(false); setFairnessData(null); }} />}
        {tab === "upload"      && <UploadTab csvError={csvError} onFileUpload={handleFileUpload} onReset={() => { setRawCandidates(generateCandidates(16)); setMitigated(false); setTab("candidates"); }} />}
        {tab === "fairness"    && <FairnessTab candidates={candidates} fairness={fairness} />}
        {tab === "explain"     && <ExplainTab selected={selected} mitigated={mitigated} explanation={explanation} loadingExplain={loadingExplain} backendOnline={backendOnline} />}
        {tab === "mitigation"  && <MitigationTab rawCandidates={rawCandidates} fairnessBefore={fairnessBefore} fairnessAfter={fairnessAfter} showComparison={showComparison} mitigating={mitigating} onRunMitigation={runMitigation} />}
        {tab === "chat"        && <ChatTab candidates={candidates} fairness={fairness} fairnessBefore={fairnessBefore} fairnessAfter={fairnessAfter} mitigated={mitigated} backendOnline={backendOnline} />}
      </div>
    </div>
  );
}
