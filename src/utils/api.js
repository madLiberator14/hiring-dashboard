// src/utils/api.js
// All calls to the Python Flask backend go through here.
// If the backend is offline, functions fall back to simulated data gracefully.

const BASE = "http://localhost:5000/api";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || `API error: ${res.status}`);
  if (json?.status !== "ok") throw new Error(json?.message || "Unknown API response");
  return json.data;
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || `API error: ${res.status}`);
  if (json?.status !== "ok") throw new Error(json?.message || "Unknown API response");
  return json.data;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Check if backend is running */
export async function checkHealth() {
  try {
    await get("/health");
    return true;
  } catch {
    return false;
  }
}

/** Fetch scored candidates from trained RF model */
export async function fetchCandidates(n = 20) {
  return get(`/candidates?n=${n}`);
}

/** Fetch LR + RF model performance metrics */
export async function fetchPerformance() {
  return get("/performance");
}

/** Fetch fairness metrics (DIR, SPD, EOD) */
export async function fetchFairness(mitigated = false) {
  return get(`/fairness?mitigated=${mitigated}`);
}

/** Fetch real SHAP values for a candidate */
export async function fetchSHAP(candidateIdx, model = "rf") {
  return get(`/explain/shap/${candidateIdx}?model=${model}`);
}

/** Fetch real LIME explanation for a candidate */
export async function fetchLIME(candidateIdx, model = "rf") {
  return get(`/explain/lime/${candidateIdx}?model=${model}`);
}

/** Fetch global SHAP feature importance */
export async function fetchGlobalSHAP() {
  return get("/explain/global");
}

export async function fetchAI(body) {
  return post("/ai/claude", body);
}

/** Fetch score distribution by gender (for charts) */
export async function fetchDistribution() {
  return get("/distribution");
}

/** Predict for a custom candidate profile */
export async function predictCandidate(profile) {
  return post("/predict", profile);
}
