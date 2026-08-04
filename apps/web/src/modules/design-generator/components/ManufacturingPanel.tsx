"use client";

/**
 * Manufacturing Panel — complete production engine UI
 * Nesting controls, part list, material estimator, sheets, cut order, export
 */

import { useMemo, useState } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useManufacturingStore } from "@/stores/manufacturingStore";
import { STANDARD_SHEETS } from "@/types/manufacturing";
import { renderReportAsText, generateProductionReport, generateCostReport, generatePartReport, generateMaterialReport } from "@/services/manufacturing/reportGenerator";
import { exportSheetsSVG, exportSheetsDXF, exportCutReadySVG, exportLaserGCode } from "@/services/manufacturing/exportManager";
import type { Report } from "@/types/manufacturing";

export function ManufacturingPanel() {
  const objects = useEditorStoreV2((s) => s.objects);
  const sheets = useManufacturingStore((s) => s.sheets);
  const parts = useManufacturingStore((s) => s.parts);
  const estimates = useManufacturingStore((s) => s.estimates);
  const cutPlan = useManufacturingStore((s) => s.cutPlan);
  const selectedSheetIndex = useManufacturingStore((s) => s.selectedSheetIndex);
  const nestingConfig = useManufacturingStore((s) => s.nestingConfig);
  const toolpathMappings = useManufacturingStore((s) => s.toolpathMappings);
  const setSheetSize = useManufacturingStore((s) => s.setSheetSize);
  const setNestingConfig = useManufacturingStore((s) => s.setNestingConfig);
  const runNesting = useManufacturingStore((s) => s.runNestingFromObjects);
  const selectSheet = useManufacturingStore((s) => s.selectSheet);

  const [activeTab, setActiveTab] = useState<"nesting" | "parts" | "estimate" | "sheets" | "cut" | "export">("nesting");
  const [material, setMaterial] = useState("Thermocol");
  const [thickness, setThickness] = useState(12);
  const [reportText, setReportText] = useState<string | null>(null);

  const selectedSheet = sheets[selectedSheetIndex];

  const tabs = [
    { id: "nesting" as const, label: "Nesting" },
    { id: "parts" as const, label: `Parts (${parts.length})` },
    { id: "estimate" as const, label: "Estimate" },
    { id: "sheets" as const, label: `Sheets (${sheets.length})` },
    { id: "cut" as const, label: "Cut Order" },
    { id: "export" as const, label: "Export" },
  ];

  function handleRunNesting() {
    runNesting(objects, 1, material, thickness);
  }

  function handleGenerateReport(type: "production" | "material" | "part" | "cost") {
    if (!estimates) return;
    let report: Report;
    switch (type) {
      case "production": report = generateProductionReport(estimates, sheets, parts); break;
      case "material": report = generateMaterialReport(estimates, sheets, material); break;
      case "part": report = generatePartReport(parts); break;
      case "cost": report = generateCostReport(estimates); break;
    }
    setReportText(renderReportAsText(report));
  }

  async function handleExportSVG() {
    const svgs = exportSheetsSVG(sheets);
    for (let i = 0; i < svgs.length; i++) {
      const blob = new Blob([svgs[i]!], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sheet-${i + 1}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleExportDXF() {
    if (!cutPlan) return;
    const dxfs = exportSheetsDXF(sheets);
    for (let i = 0; i < dxfs.length; i++) {
      const blob = new Blob([dxfs[i]!], { type: "application/dxf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sheet-${i + 1}.dxf`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function handleExportLaser() {
    if (!cutPlan) return;
    const codes = exportLaserGCode(sheets, cutPlan);
    for (let i = 0; i < codes.length; i++) {
      const blob = new Blob([codes[i]!], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sheet-${i + 1}.nc`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap", borderBottom: "1px solid #374151", paddingBottom: 8 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              borderRadius: "4px 4px 0 0",
              background: activeTab === t.id ? "#1e3a8a" : "transparent",
              color: activeTab === t.id ? "#60a5fa" : "#94a3b8",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Nesting Tab ── */}
      {activeTab === "nesting" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h4 style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Sheet Size</h4>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {STANDARD_SHEETS.map((s) => (
              <button
                key={s.label}
                onClick={() => setSheetSize(s.width, s.height)}
                style={{
                  padding: "4px 8px", fontSize: 11, border: "1px solid #374151", borderRadius: 4, background: nestingConfig.sheetWidth === s.width ? "#1e3a8a" : "#1f2937", color: "#e2e8f0", cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ fontSize: 11, color: "#94a3b8" }}>
              Gap (mm)
              <input type="number" value={nestingConfig.gap} onChange={(e) => setNestingConfig({ gap: Number(e.target.value) })} style={inputStyle} />
            </label>
            <label style={{ fontSize: 11, color: "#94a3b8" }}>
              Margin (mm)
              <input type="number" value={nestingConfig.margin} onChange={(e) => setNestingConfig({ margin: Number(e.target.value) })} style={inputStyle} />
            </label>
          </div>

          <label style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={nestingConfig.allowRotation} onChange={(e) => setNestingConfig({ allowRotation: e.target.checked })} />
            Allow Rotation
          </label>

          <label style={{ fontSize: 11, color: "#94a3b8" }}>
            Material
            <select value={material} onChange={(e) => setMaterial(e.target.value)} style={inputStyle}>
              {["Thermocol", "Acrylic", "MDF", "Plywood", "Cardboard"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 11, color: "#94a3b8" }}>
            Thickness (mm)
            <input type="number" value={thickness} onChange={(e) => setThickness(Number(e.target.value))} style={inputStyle} />
          </label>

          <button onClick={handleRunNesting} style={primaryButtonStyle}>
            Run Nesting
          </button>
        </div>
      )}

      {/* ── Parts Tab ── */}
      {activeTab === "parts" && (
        <div style={{ maxHeight: 300, overflow: "auto" }}>
          {parts.length === 0 ? (
            <p style={{ color: "#6B7280", fontSize: 13 }}>Run nesting to generate parts</p>
          ) : (
            <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#94a3b8", borderBottom: "1px solid #374151" }}>
                  <th style={thStyle}>Part#</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>W</th>
                  <th style={thStyle}>H</th>
                  <th style={thStyle}>Area</th>
                  <th style={thStyle}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.objectId} style={{ borderBottom: "1px solid #1f2937" }}>
                    <td style={tdStyle}>{p.partNumber}</td>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>{Math.round(p.width)}</td>
                    <td style={tdStyle}>{Math.round(p.height)}</td>
                    <td style={tdStyle}>{(p.area / 100).toFixed(0)}cm²</td>
                    <td style={tdStyle}>{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Estimate Tab ── */}
      {activeTab === "estimate" && estimates && (
        <div style={{ display: "grid", gap: 8 }}>
          {[
            ["Parts", String(estimates.totalParts)],
            ["Sheets", String(estimates.sheetCount)],
            ["Total Area", `${(estimates.totalArea / 1e6).toFixed(2)} m²`],
            ["Waste", `${estimates.wastePercent}%`],
            ["Cut Length", `${(estimates.totalCutLength / 1000).toFixed(1)} m`],
            ["Material Cost", `₹${estimates.materialCost.toLocaleString("en-IN")}`],
            ["Machine Time", `${estimates.machineTime} min`],
            ["Production Cost", `₹${estimates.productionCost.toLocaleString("en-IN")}`],
            ["Cost Per Part", `₹${estimates.costPerPart.toLocaleString("en-IN")}`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: "#1f2937", borderRadius: 4 }}>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
              <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <button onClick={() => handleGenerateReport("production")} style={smallBtn}>Prod Report</button>
            <button onClick={() => handleGenerateReport("cost")} style={smallBtn}>Cost Report</button>
            <button onClick={() => handleGenerateReport("part")} style={smallBtn}>Part Report</button>
            <button onClick={() => handleGenerateReport("material")} style={smallBtn}>Material</button>
          </div>
          {reportText && (
            <pre style={{ fontSize: 10, color: "#94a3b8", background: "#0f172a", padding: 8, borderRadius: 4, maxHeight: 200, overflow: "auto", whiteSpace: "pre-wrap" }}>
              {reportText}
            </pre>
          )}
        </div>
      )}

      {/* ── Sheets Tab ── */}
      {activeTab === "sheets" && (
        <div>
          {sheets.length === 0 ? (
            <p style={{ color: "#6B7280", fontSize: 13 }}>Run nesting to generate sheets</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {sheets.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => selectSheet(i)}
                    style={{
                      padding: "6px 12px", fontSize: 11, borderRadius: 4,
                      border: selectedSheetIndex === i ? "2px solid #3b82f6" : "1px solid #374151",
                      background: selectedSheetIndex === i ? "#1e3a8a" : "#1f2937",
                      color: "#e2e8f0", cursor: "pointer",
                    }}
                  >
                    Sheet {i + 1}
                    <br />
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>
                      {s.placements.length} parts · {(s.efficiency * 100).toFixed(0)}%
                    </span>
                  </button>
                ))}
              </div>

              {selectedSheet && (
                <div style={{ background: "#0f172a", borderRadius: 4, padding: 8, minHeight: 150 }}>
                  <svg width="100%" height="150" viewBox={`0 0 ${selectedSheet.width} ${selectedSheet.height}`} preserveAspectRatio="xMidYMid meet">
                    <rect width={selectedSheet.width} height={selectedSheet.height} fill="#1e293b" stroke="#475569" />
                    {selectedSheet.placements.map((p, i) => (
                      <g key={i}>
                        <rect x={p.x} y={p.y} width={p.width} height={p.height} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="1" />
                        <text x={p.x + 2} y={p.y + 10} fontSize="8" fill="#94a3b8">{p.partNumber.replace("PART-", "")}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Cut Order Tab ── */}
      {activeTab === "cut" && cutPlan && (
        <div>
          <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Total Time: {(cutPlan.totalTime / 60).toFixed(1)} min</div>
            {cutPlan.actionGroups.map((g) => (
              <div key={g.action} style={{ display: "flex", justifyContent: "space-between", padding: "4px 8px", background: "#1f2937", borderRadius: 4, fontSize: 12 }}>
                <span style={{ color: "#e2e8f0" }}>{g.action}</span>
                <span style={{ color: "#94a3b8" }}>{(g.totalLength / 1000).toFixed(1)} m</span>
              </div>
            ))}
          </div>
          <div style={{ maxHeight: 200, overflow: "auto" }}>
            {cutPlan.instructions.map((instr, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 6px", fontSize: 10, borderBottom: "1px solid #1f2937" }}>
                <span style={{ color: "#94a3b8" }}>{instr.partNumber}</span>
                <span style={{ color: "#e2e8f0" }}>{instr.action}</span>
                <span style={{ color: "#64748b" }}>{instr.power}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Export Tab ── */}
      {activeTab === "export" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={handleExportSVG} style={primaryButtonStyle}>Export SVG</button>
          <button onClick={handleExportDXF} style={primaryButtonStyle}>Export DXF</button>
          <button onClick={handleExportLaser} style={primaryButtonStyle}>Export Laser (.nc)</button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  borderRadius: 4,
  border: "1px solid #374151",
  background: "#1f2937",
  color: "white",
  fontSize: 12,
  marginTop: 4,
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 6,
  border: "none",
  background: "#1e40af",
  color: "white",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const smallBtn: React.CSSProperties = {
  padding: "4px 8px", fontSize: 10, border: "1px solid #374151", borderRadius: 4,
  background: "#1f2937", color: "#94a3b8", cursor: "pointer",
};

const thStyle: React.CSSProperties = { padding: "4px 6px", textAlign: "left" as const, fontSize: 10 };
const tdStyle: React.CSSProperties = { padding: "3px 6px", fontSize: 10, color: "#e2e8f0" };
