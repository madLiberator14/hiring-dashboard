// src/components/SharedComponents.jsx
// Reusable UI pieces used across multiple tabs

import C from "../theme";

// ── SHAP feature bar ──────────────────────────────────────────────────────────
export function SHAPBar({ feature, value, raw, isBias, mitigated }) {
  const pct   = Math.min(100, (Math.abs(value) / 2.5) * 100);
  const isPos = value >= 0;
  const color = mitigated && isBias ? C.muted2 : isBias ? C.yellow : isPos ? C.green : C.red;

  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: isBias && !mitigated ? C.yellow : C.text }}>
          {isBias && !mitigated ? "⚠ " : isBias && mitigated ? "✓ " : ""}
          {feature}
        </span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>
          {value >= 0 ? "+" : ""}
          {value.toFixed(2)}
          <span style={{ color: C.muted, fontWeight: 400 }}> ({raw})</span>
        </span>
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── LIME sensitivity bar ──────────────────────────────────────────────────────
export function LIMEBar({ feature, sensitivity, value }) {
  const pct   = Math.min(100, (Math.abs(sensitivity) / 1.5) * 100);
  const isPos = sensitivity >= 0;

  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: C.text }}>{feature}</span>
        <span style={{ fontSize: 11, color: isPos ? C.green : C.red, fontWeight: 700 }}>
          Δ{isPos ? "+" : ""}
          {sensitivity.toFixed(3)}
          <span style={{ color: C.muted, fontWeight: 400 }}> (val:{value})</span>
        </span>
      </div>
      <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: isPos ? C.green : C.red,
            borderRadius: 3,
            transition: "width 0.5s",
          }}
        />
      </div>
    </div>
  );
}

// ── Fairness metric gauge ─────────────────────────────────────────────────────
export function Gauge({ label, value, ideal, range }) {
  const inRange = value >= range[0] && value <= range[1];
  const color   = inRange ? C.green : C.red;

  return (
    <div
      style={{
        background: C.bg,
        borderRadius: 10,
        padding: "14px 16px",
        border: `1px solid ${inRange ? C.green + "44" : C.red + "44"}`,
      }}
    >
      <div style={{ fontSize: 10, color: C.muted, marginBottom: 3, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "monospace" }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
        Ideal: {ideal} · Fair range: [{range[0]}–{range[1]}]
      </div>
      <div style={{ marginTop: 6, height: 3, background: C.border, borderRadius: 2 }}>
        <div
          style={{
            height: "100%",
            width: `${Math.min(100, (value / (range[1] * 1.5)) * 100)}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.7s",
          }}
        />
      </div>
    </div>
  );
}
