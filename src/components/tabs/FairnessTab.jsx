// src/components/tabs/FairnessTab.jsx

import C from "../../theme";
import { Gauge } from "../SharedComponents";

export default function FairnessTab({ candidates, fairness }) {
  if (!fairness) return null;

  return (
    <div>
      <div style={{ marginBottom: 14, fontSize: 11, color: C.muted }}>
        Fairness metrics · Threshold: 6.5/10 · Protected attributes: Gender & Ethnicity
      </div>

      {/* Metric gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 18 }}>
        <Gauge label="Disparate Impact Ratio (DIR)" value={fairness.dir}            ideal="1.0" range={[0.8, 1.25]} />
        <Gauge label="Statistical Parity Diff (SPD)" value={Math.abs(fairness.spd)} ideal="0.0" range={[0, 0.1]}   />
        <Gauge label="Equal Opportunity Diff (EOD)"  value={Math.abs(fairness.eod)} ideal="0.0" range={[0, 0.1]}   />
      </div>

      {/* Breakdown charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Gender */}
        <div style={{ background: C.panel, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 12 }}>Hiring Rate by Gender</div>
          {["Male", "Female"].map(g => {
            const grp  = candidates.filter(c => c.gender === g);
            const rate = grp.length ? +(grp.filter(c => c.hired).length / grp.length * 100).toFixed(0) : 0;
            return (
              <div key={g} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span>{g} ({grp.length})</span>
                  <span style={{ fontWeight: 700, color: rate >= 50 ? C.green : C.yellow }}>{rate}%</span>
                </div>
                <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${rate}%`, background: g === "Male" ? C.accent : C.accent2, borderRadius: 4, transition: "width 0.8s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Ethnicity */}
        <div style={{ background: C.panel, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 12 }}>Hiring Rate by Ethnicity</div>
          {["Group A", "Group B", "Group C"].map((g, gi) => {
            const grp    = candidates.filter(c => c.ethnicity === g);
            const rate   = grp.length ? +(grp.filter(c => c.hired).length / grp.length * 100).toFixed(0) : 0;
            const colors = [C.accent, C.green, C.orange];
            return (
              <div key={g} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span>{g} ({grp.length})</span>
                  <span style={{ fontWeight: 700, color: colors[gi] }}>{rate}%</span>
                </div>
                <div style={{ height: 8, background: C.border, borderRadius: 4 }}>
                  <div style={{ height: "100%", width: `${rate}%`, background: colors[gi], borderRadius: 4, transition: "width 0.8s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verdict banner */}
      <div style={{
        background: fairness.dir < 0.8 ? C.red + "11" : C.green + "11",
        border: `1px solid ${fairness.dir < 0.8 ? C.red + "33" : C.green + "33"}`,
        borderRadius: 10, padding: 14, fontSize: 11,
      }}>
        {fairness.dir < 0.8
          ? `⚠ DIR of ${fairness.dir} is below the 0.8 threshold — significant gender discrimination detected. Female candidates are hired at ${(fairness.femaleRate * 100).toFixed(0)}% vs male at ${(fairness.maleRate * 100).toFixed(0)}%. Navigate to the Mitigation tab to apply reweighting.`
          : `✓ DIR of ${fairness.dir} is within the fair range [0.8–1.25]. Gender parity is maintained. SPD of ${Math.abs(fairness.spd)} indicates acceptable parity.`}
      </div>
    </div>
  );
}
