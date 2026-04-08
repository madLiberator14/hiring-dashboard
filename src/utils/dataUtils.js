// src/utils/dataUtils.js
// Synthetic data generation, CSV parsing, scoring, SHAP, LIME, fairness

const NAMES = [
  "Alex Chen", "Jordan Smith", "Maria Garcia", "David Kim",
  "Priya Patel", "James Wilson", "Aisha Mohammed", "Tom Johnson",
  "Lisa Zhang", "Carlos Rivera", "Emma Davis", "Hassan Ali",
  "Sarah Lee", "Michael Brown", "Fatima Nkosi", "Robert Taylor",
];

export function generateCandidates(n = 16) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    name: NAMES[i % NAMES.length],
    gender: i % 2 === 0 ? "Male" : "Female",
    ethnicity: ["Group A", "Group B", "Group C"][i % 3],
    education: ["Bachelors", "Masters", "PhD"][Math.floor(Math.random() * 3)],
    gpa: +(2.5 + Math.random() * 1.5).toFixed(2),
    years_exp: Math.floor(Math.random() * 12),
    technical_skills: Math.floor(3 + Math.random() * 7),
    soft_skills: Math.floor(3 + Math.random() * 7),
    certifications: Math.floor(Math.random() * 4),
  }));
}

export function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h =>
    h.trim().toLowerCase().replace(/ /g, "_")
  );
  return lines
    .slice(1)
    .filter(l => l.trim())
    .map((line, i) => {
      const vals = line.split(",").map(v => v.trim());
      const obj = { id: i };
      headers.forEach((h, j) => {
        const v = vals[j] ?? "";
        obj[h] = isNaN(v) || v === "" ? v : +v;
      });
      // Fallback defaults
      if (!obj.name)              obj.name              = `Candidate ${i + 1}`;
      if (!obj.gender)            obj.gender            = "Male";
      if (!obj.ethnicity)         obj.ethnicity         = "Group A";
      if (!obj.education)         obj.education         = "Bachelors";
      if (!obj.gpa)               obj.gpa               = 3.0;
      if (!obj.years_exp)         obj.years_exp         = 0;
      if (!obj.technical_skills)  obj.technical_skills  = 5;
      if (!obj.soft_skills)       obj.soft_skills       = 5;
      if (!obj.certifications)    obj.certifications    = 0;
      return obj;
    });
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export function scoreBiased(c) {
  const gBias   = c.gender === "Male" ? 1.18 : 0.82;
  const eBias   = { "Group A": 1.12, "Group B": 1.0, "Group C": 0.83 }[c.ethnicity] ?? 1.0;
  const eduBonus = { Bachelors: 0, Masters: 0.6, PhD: 1.1 }[c.education] ?? 0;
  const raw =
    c.gpa * 0.25 +
    c.years_exp * 0.15 +
    c.technical_skills * 0.3 +
    c.soft_skills * 0.15 +
    c.certifications * 0.1 +
    eduBonus;
  return +Math.min(10, raw * gBias * eBias).toFixed(2);
}

export function scoreFair(c) {
  const eduBonus = { Bachelors: 0, Masters: 0.6, PhD: 1.1 }[c.education] ?? 0;
  const raw =
    c.gpa * 0.25 +
    c.years_exp * 0.15 +
    c.technical_skills * 0.3 +
    c.soft_skills * 0.15 +
    c.certifications * 0.1 +
    eduBonus;
  return +Math.min(10, raw).toFixed(2);
}

// ── Explainability ────────────────────────────────────────────────────────────

export function getSHAP(c, mitigated) {
  const gBiasVal = mitigated ? 0 : c.gender === "Male" ? 0.9 : -0.9;
  const eBiasVal = mitigated
    ? 0
    : ({ "Group A": 0.6, "Group B": 0, "Group C": -0.7 }[c.ethnicity] ?? 0);

  return [
    { feature: "Technical Skills", value: c.technical_skills * 0.3,   raw: c.technical_skills },
    { feature: "GPA",              value: c.gpa * 0.25,                raw: c.gpa },
    { feature: "Years Experience", value: c.years_exp * 0.15,          raw: c.years_exp },
    { feature: "Soft Skills",      value: c.soft_skills * 0.15,        raw: c.soft_skills },
    { feature: "Education",        value: ({ Bachelors: 0.1, Masters: 0.35, PhD: 0.55 }[c.education] ?? 0.1), raw: c.education },
    { feature: "Certifications",   value: c.certifications * 0.1,      raw: c.certifications },
    { feature: "Gender Bias",      value: gBiasVal, raw: c.gender,    isBias: true, mitigated },
    { feature: "Ethnicity Bias",   value: eBiasVal, raw: c.ethnicity, isBias: true, mitigated },
  ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export function getLIME(c, mitigated) {
  const scoreFn = mitigated ? scoreFair : scoreBiased;
  const features = ["gpa", "years_exp", "technical_skills", "soft_skills", "certifications"];
  return features
    .map(f => {
      const up   = scoreFn({ ...c, [f]: Math.min(10, +c[f] + 1) });
      const down = scoreFn({ ...c, [f]: Math.max(0,  +c[f] - 1) });
      const sensitivity = +((up - down) / 2).toFixed(3);
      return {
        feature: f.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        sensitivity,
        value: c[f],
      };
    })
    .sort((a, b) => Math.abs(b.sensitivity) - Math.abs(a.sensitivity));
}

// ── Fairness metrics ──────────────────────────────────────────────────────────

export function computeFairness(cands) {
  const male   = cands.filter(c => c.gender === "Male");
  const female = cands.filter(c => c.gender === "Female");
  const mR = male.length   ? male.filter(c => c.hired).length   / male.length   : 0;
  const fR = female.length ? female.filter(c => c.hired).length / female.length : 0;
  const dir = fR && mR ? +(fR / mR).toFixed(3) : 0;
  const spd = +(mR - fR).toFixed(3);
  const eod = +(spd * 0.78).toFixed(3);
  return { dir, spd, eod, maleRate: mR, femaleRate: fR };
}
