// src/components/tabs/CandidatesTab.jsx

export default function CandidatesTab({
  candidates,
  selected,
  mitigated,
  mitigating,
  searchText,
  filterGender,
  filterEducation,
  filterOutcome,
  sortKey,
  genderOptions,
  educationOptions,
  onSearchTextChange,
  onFilterGenderChange,
  onFilterEducationChange,
  onFilterOutcomeChange,
  onSortKeyChange,
  onSelectCandidate,
  onRegenerate,
  onMitigate,
  onRemoveMitigation,
  C,
}) {
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 11, color: C.muted }}>
          {candidates.filter(c => c.hired).length} hired / {candidates.length} total · Click any card for explanation
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onRegenerate}
            style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.accent, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}
          >
            ↺ Regenerate
          </button>
          {!mitigated ? (
            <button
              onClick={onMitigate}
              disabled={mitigating}
              style={{ background: mitigating ? C.muted : C.accent2, border: "none", color: "#fff", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}
            >
              {mitigating ? "⚙ Processing..." : "⚖ Apply Mitigation"}
            </button>
          ) : (
            <button
              onClick={onRemoveMitigation}
              style={{ background: C.panel2, border: `1px solid ${C.yellow}`, color: C.yellow, padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}
            >
              ✕ Remove Mitigation
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 10, marginBottom: 16, alignItems: "center", rowGap: 10 }}>
        <input
          value={searchText}
          onChange={e => onSearchTextChange(e.target.value)}
          placeholder="Search name, gender, ethnicity, education"
          style={{ width: "100%", background: C.panel2, border: `1px solid ${C.border}`, color: C.text, padding: "8px 12px", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
        />
        <select
          value={filterGender}
          onChange={e => onFilterGenderChange(e.target.value)}
          style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
        >
          {genderOptions.map(option => (
            <option key={option} value={option}>{option === "all" ? "Gender: All" : option}</option>
          ))}
        </select>
        <select
          value={filterEducation}
          onChange={e => onFilterEducationChange(e.target.value)}
          style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
        >
          {educationOptions.map(option => (
            <option key={option} value={option}>{option === "all" ? "Education: All" : option}</option>
          ))}
        </select>
        <select
          value={filterOutcome}
          onChange={e => onFilterOutcomeChange(e.target.value)}
          style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
        >
          <option value="all">Outcome: All</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
        <select
          value={sortKey}
          onChange={e => onSortKeyChange(e.target.value)}
          style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text, padding: "8px 10px", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
        >
          <option value="scoreDesc">Sort: Score ↓</option>
          <option value="scoreAsc">Sort: Score ↑</option>
          <option value="expDesc">Sort: Experience ↓</option>
          <option value="expAsc">Sort: Experience ↑</option>
        </select>
      </div>

      {/* Candidate grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
        {candidates.map(c => (
          <div
            key={c.id}
            onClick={() => onSelectCandidate(c)}
            style={{
              background: C.panel,
              border: `1px solid ${selected?.id === c.id ? C.accent : c.hired ? C.green + "44" : C.border}`,
              borderRadius: 10,
              padding: 14,
              cursor: "pointer",
              transition: "border-color 0.2s",
              borderLeft: `3px solid ${c.hired ? C.green : C.red}`,
            }}
          >
            {/* Name + badge */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>{c.name}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                background: c.hired ? C.green + "22" : C.red + "22",
                color: c.hired ? C.green : C.red,
              }}>
                {c.hired ? "HIRED" : "REJECTED"}
              </span>
            </div>

            {/* Demographics */}
            <div style={{ fontSize: 10, color: C.muted2, marginBottom: 7 }}>
              {c.gender} · {c.ethnicity} · {c.education}
            </div>

            {/* Quick stats */}
            <div style={{ display: "flex", gap: 10, fontSize: 10 }}>
              <span>GPA <b style={{ color: C.accent }}>{c.gpa}</b></span>
              <span>Exp <b style={{ color: C.accent }}>{c.years_exp}y</b></span>
              <span>Tech <b style={{ color: C.accent }}>{c.technical_skills}</b></span>
            </div>

            {/* Score bar */}
            <div style={{ marginTop: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                <span style={{ color: C.muted }}>Score</span>
                <span style={{ fontWeight: 700, color: c.score >= 6.5 ? C.green : C.red }}>
                  {c.score}/10
                  {mitigated && c.biasedScore !== c.fairScore && (
                    <span style={{ fontSize: 9, color: c.fairScore > c.biasedScore ? C.green : C.red, marginLeft: 4 }}>
                      {c.fairScore > c.biasedScore
                        ? `▲+${(c.fairScore - c.biasedScore).toFixed(2)}`
                        : `▼${(c.fairScore - c.biasedScore).toFixed(2)}`}
                    </span>
                  )}
                </span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${c.score * 10}%`, background: c.score >= 6.5 ? C.green : C.red, borderRadius: 3, transition: "width 0.5s" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
