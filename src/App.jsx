// src/App.jsx
// Main orchestrator — all heavy logic lives in tabs/ and utils/

import { useState, useEffect } from "react";
import themes from "./theme";
import {
  generateCandidates,
  parseCSV,
  scoreBiased,
  scoreFair,
  computeFairness,
  getSHAP,
  getLIME,
} from "./utils/dataUtils";

import CandidatesTab  from "./components/tabs/CandidatesTab";
import UploadTab      from "./components/tabs/UploadTab";
import FairnessTab    from "./components/tabs/FairnessTab";
import ExplainTab     from "./components/tabs/ExplainTab";
import MitigationTab  from "./components/tabs/MitigationTab";
import ChatTab        from "./components/tabs/ChatTab";

const TABS = [
  ["candidates", "👥 Candidates"],
  ["upload",     "📂 Upload CSV"],
  ["fairness",   "📊 Fairness"],
  ["explain",    "🔍 Explain"],
  ["mitigation", "⚖ Mitigation"],
  ["chat",       "💬 Ask AI"],
];

export default function App() {
  // ── State ────────────────────────────────────────────────────────────────
  const [rawCandidates,  setRawCandidates]  = useState([]);
  const [mitigated,      setMitigated]      = useState(false);
  const [mitigating,     setMitigating]     = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selected,       setSelected]       = useState(null);
  const [explanation,    setExplanation]    = useState("");
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [tab,            setTab]            = useState("candidates");
  const [csvError,       setCsvError]       = useState("");
  const [mode,           setMode]           = useState("dark");
  const [searchText,     setSearchText]     = useState("");
  const [filterGender,   setFilterGender]   = useState("all");
  const [filterEducation, setFilterEducation] = useState("all");
  const [filterOutcome,  setFilterOutcome]  = useState("all");
  const [sortKey,        setSortKey]        = useState("scoreDesc");

  const C = themes[mode];

  // ── Derived data ─────────────────────────────────────────────────────────
  const candidates = rawCandidates.map(c => {
    const biasedScore = scoreBiased(c);
    const fairScore   = scoreFair(c);
    const score       = mitigated ? fairScore : biasedScore;
    return { ...c, score, biasedScore, fairScore, hired: score >= 6.5 };
  });

  const fairness       = candidates.length    ? computeFairness(candidates)    : null;
  const fairnessBefore = rawCandidates.length ? computeFairness(rawCandidates.map(c => ({ ...c, hired: scoreBiased(c) >= 6.5 }))) : null;
  const fairnessAfter  = rawCandidates.length ? computeFairness(rawCandidates.map(c => ({ ...c, hired: scoreFair(c)  >= 6.5 }))) : null;

  const genderOptions = ["all", ...Array.from(new Set(rawCandidates.map(c => c.gender))).sort()];
  const educationOptions = ["all", ...Array.from(new Set(rawCandidates.map(c => c.education))).sort()];

  const filteredCandidates = candidates
    .filter(c => {
      const search = searchText.trim().toLowerCase();
      const matchesSearch = !search || [c.name, c.gender, c.ethnicity, c.education].some(value => value.toLowerCase().includes(search));
      const matchesGender = filterGender === "all" || c.gender === filterGender;
      const matchesEducation = filterEducation === "all" || c.education === filterEducation;
      const matchesOutcome = filterOutcome === "all" || (filterOutcome === "hired" ? c.hired : !c.hired);
      return matchesSearch && matchesGender && matchesEducation && matchesOutcome;
    })
    .sort((a, b) => {
      if (sortKey === "scoreDesc") return b.score - a.score;
      if (sortKey === "scoreAsc") return a.score - b.score;
      if (sortKey === "expDesc") return b.years_exp - a.years_exp;
      if (sortKey === "expAsc") return a.years_exp - b.years_exp;
      return 0;
    });

  useEffect(() => { setRawCandidates(generateCandidates(16)); }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function loadCSV(text) {
    try {
      const parsed = parseCSV(text);
      if (!parsed.length) throw new Error("No rows found");
      setRawCandidates(parsed);
      setMitigated(false); setSelected(null); setExplanation(""); setCsvError(""); setTab("candidates");
      setSearchText(""); setFilterGender("all"); setFilterEducation("all"); setFilterOutcome("all"); setSortKey("scoreDesc");
    } catch {
      setCsvError("Could not parse CSV. Ensure headers: name, gender, ethnicity, education, gpa, years_exp, technical_skills, soft_skills, certifications");
    }
  }

  function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => loadCSV(e.target.result);
    reader.readAsText(file);
  }

  async function runMitigation() {
    setMitigating(true);
    await new Promise(r => setTimeout(r, 1400)); // simulate processing delay
    setMitigated(true); setMitigating(false); setShowComparison(true); setTab("mitigation");
  }

  async function explainCandidate(c) {
    setSelected(c); setTab("explain"); setLoadingExplain(true); setExplanation("");

    const shap = getSHAP(c, mitigated);
    const lime = getLIME(c, mitigated);

    const prompt = `You are an AI hiring system auditor for a university research project on bias in AI recruitment.

Candidate: ${c.name} | Gender: ${c.gender} | Ethnicity: ${c.ethnicity} | Education: ${c.education}
GPA: ${c.gpa} | Experience: ${c.years_exp}yrs | Tech Skills: ${c.technical_skills}/10 | Soft Skills: ${c.soft_skills}/10
Score: ${c.score}/10 | Decision: ${c.hired ? "HIRED ✓" : "REJECTED ✗"} | Mitigation: ${mitigated ? "APPLIED" : "NOT applied"}

SHAP contributions:
${shap.map(s => `  ${s.feature}: ${s.value >= 0 ? "+" : ""}${s.value.toFixed(2)} (${s.raw})${s.isBias ? " ← BIAS" : ""}`).join("\n")}

LIME sensitivities:
${lime.map(l => `  ${l.feature}: Δ${l.sensitivity >= 0 ? "+" : ""}${l.sensitivity} per unit`).join("\n")}

Write 4-5 sentences: (1) Top merit factors. (2) How bias impacted the score. (3) What mitigation did or would do. (4) One recommendation.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setExplanation(data.content?.[0]?.text || "Unable to generate explanation.");
    } catch { setExplanation("Error connecting to explanation service."); }
    setLoadingExplain(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: C.bg, minHeight: "100vh", color: C.text }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.bg} 0%, ${C.panel2} 100%)`, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, color: C.accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 2 }}>
           Kago Kebonye · Explainable AI
          </div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, letterSpacing: -0.5 }}>
            AI Hiring <span style={{ color: C.accent }}>Transparency</span> & Bias Audit Dashboard
          </h1>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <button
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}
          >
            {mode === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Mitigation</div>
            <div style={{ fontSize: 11, color: mitigated ? C.green : C.yellow, fontWeight: 700 }}>
              {mitigated ? "✓ APPLIED" : "⚠ INACTIVE"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Fairness</div>
            <div style={{ fontSize: 11, color: fairness?.dir >= 0.8 ? C.green : C.red, fontWeight: 700 }}>
              {fairness?.dir >= 0.8 ? "✓ FAIR" : "⚠ BIASED"}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, display: "flex", padding: "0 20px", overflowX: "auto" }}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: "none", border: "none",
              color: tab === key ? C.accent : C.muted2,
              padding: "10px 14px", cursor: "pointer", fontSize: 11,
              fontWeight: tab === key ? 700 : 400,
              borderBottom: tab === key ? `2px solid ${C.accent}` : "2px solid transparent",
              fontFamily: "'Courier New', monospace", whiteSpace: "nowrap", transition: "color 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: 20 }}>
        {tab === "candidates" && (
          <CandidatesTab
            candidates={filteredCandidates}
            selected={selected}
            mitigated={mitigated}
            mitigating={mitigating}
            searchText={searchText}
            filterGender={filterGender}
            filterEducation={filterEducation}
            filterOutcome={filterOutcome}
            sortKey={sortKey}
            genderOptions={genderOptions}
            educationOptions={educationOptions}
            onSearchTextChange={setSearchText}
            onFilterGenderChange={setFilterGender}
            onFilterEducationChange={setFilterEducation}
            onFilterOutcomeChange={setFilterOutcome}
            onSortKeyChange={setSortKey}
            onSelectCandidate={explainCandidate}
            onRegenerate={() => {
              setRawCandidates(generateCandidates(16));
              setMitigated(false);
              setSelected(null);
              setSearchText("");
              setFilterGender("all");
              setFilterEducation("all");
              setFilterOutcome("all");
              setSortKey("scoreDesc");
            }}
            onMitigate={runMitigation}
            onRemoveMitigation={() => { setMitigated(false); setShowComparison(false); }}
            C={C}
          />
        )}
        {tab === "upload" && (
          <UploadTab
            csvError={csvError}
            onFileUpload={handleFileUpload}
            onReset={() => { setRawCandidates(generateCandidates(16)); setMitigated(false); setTab("candidates"); }}
            C={C}
          />
        )}
        {tab === "fairness" && (
          <FairnessTab candidates={candidates} fairness={fairness} C={C} />
        )}
        {tab === "explain" && (
          <ExplainTab
            selected={selected}
            mitigated={mitigated}
            explanation={explanation}
            loadingExplain={loadingExplain}
            C={C}
          />
        )}
        {tab === "mitigation" && (
          <MitigationTab
            rawCandidates={rawCandidates}
            fairnessBefore={fairnessBefore}
            fairnessAfter={fairnessAfter}
            showComparison={showComparison}
            mitigating={mitigating}
            onRunMitigation={runMitigation}
            C={C}
          />
        )}
        {tab === "chat" && (
          <ChatTab
            candidates={candidates}
            fairness={fairness}
            fairnessBefore={fairnessBefore}
            fairnessAfter={fairnessAfter}
            mitigated={mitigated}
            C={C}
          />
        )}
      </div>
    </div>
  );
}
