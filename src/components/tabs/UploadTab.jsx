// src/components/tabs/UploadTab.jsx
import { useRef } from "react";

const C = { bg: "#07090f", panel: "#0d1117", panel2: "#111827", border: "#1a2535", accent: "#00d4ff", accent2: "#7c3aed", green: "#10b981", red: "#ef4444", yellow: "#f59e0b", orange: "#f97316", text: "#e2e8f0", muted: "#4b5563", muted2: "#6b7280" };

const SAMPLE_CSV = [
  "name,gender,ethnicity,education,gpa,years_exp,technical_skills,soft_skills,certifications",
  "Alex Chen,Male,Group A,Masters,3.8,5,8,7,2",
  "Maria Garcia,Female,Group B,Bachelors,3.4,3,6,8,1",
  "David Kim,Male,Group C,PhD,3.9,8,9,6,3",
  "Priya Patel,Female,Group A,Bachelors,3.2,2,7,9,1",
  "James Wilson,Male,Group B,Masters,3.6,6,7,7,2",
  "Aisha Mohammed,Female,Group C,Masters,3.7,4,8,8,2",
].join("\n");

export default function UploadTab({ csvError, onFileUpload, onReset }) {
  const fileRef   = useRef(null);
  const dragRef   = useRef(false);

  function handleDrop(e) {
    e.preventDefault();
    dragRef.current = false;
    onFileUpload(e.dataTransfer.files[0]);
  }

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "sample_candidates.csv";
    a.click();
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: 14, fontSize: 11, color: C.muted }}>
        Upload your own candidate CSV to test bias detection on custom data.
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); }}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${C.border}`,
          borderRadius: 14,
          padding: 40,
          textAlign: "center",
          cursor: "pointer",
          background: C.panel,
          transition: "all 0.2s",
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
        <div style={{ fontSize: 13, color: C.text, marginBottom: 6 }}>
          Drop CSV here or click to browse
        </div>
        <div style={{ fontSize: 10, color: C.muted }}>
          Required columns: name, gender, ethnicity, education, gpa, years_exp,
          technical_skills, soft_skills, certifications
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={e => onFileUpload(e.target.files[0])}
        />
      </div>

      {/* Error message */}
      {csvError && (
        <div style={{ background: C.red + "11", border: `1px solid ${C.red}33`, borderRadius: 8, padding: 12, fontSize: 11, color: C.red, marginBottom: 14 }}>
          ⚠ {csvError}
        </div>
      )}

      {/* Template preview */}
      <div style={{ background: C.panel, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 10 }}>📋 CSV Template</div>
        <div style={{ background: C.bg, borderRadius: 8, padding: 12, fontSize: 10, fontFamily: "monospace", color: C.green, overflowX: "auto", lineHeight: 1.8 }}>
          {SAMPLE_CSV.split("\n").map((row, i) => (
            <div key={i}>{row}</div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button
            onClick={downloadSample}
            style={{ background: C.accent2, border: "none", color: "#fff", padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}
          >
            ↓ Download Sample CSV
          </button>
          <button
            onClick={onReset}
            style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.muted2, padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}
          >
            Reset to Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
