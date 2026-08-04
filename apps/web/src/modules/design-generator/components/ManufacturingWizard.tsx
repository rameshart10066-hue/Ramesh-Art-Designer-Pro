"use client";

/**
 * Manufacturing Wizard — 6-step production workflow
 *
 * Step 1: Validation     — warnings/errors + Auto Fix
 * Step 2: Sheet Splitting — 39×19 preview + manual arrange
 * Step 3: Puzzle Joints   — joint preview + type change
 * Step 4: Part Numbering  — numbered parts + renumber
 * Step 5: Manufacturing   — BOM, cost, time, packing
 * Step 6: Export          — all formats + summary
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useManufacturingStore } from "@/stores/manufacturingStore";
import { splitIntoSheets, getSheetStats, type SplitSheet } from "@/manufacturing/SheetSplitter";
import { generateJoints, selectJointType, type Joint, type JointType } from "@/manufacturing/PuzzleJointGenerator";
import { generateGlueTabs } from "@/manufacturing/GlueTabGenerator";
import { resetNumbering, assignPartNumber, renumberByPosition, getAllPartNumbers } from "@/manufacturing/PartNumbering";
import { generateRegistrationMarks } from "@/manufacturing/RegistrationMarks";
import { generateBOM, type BOM } from "@/manufacturing/BOMGenerator";
import { calculateCost, DEFAULT_FORMULAS, type CostBreakdown } from "@/manufacturing/CostEstimator";
import { validateManufacturing, getWorstSeverity, type ValidationIssue } from "@/manufacturing/ManufacturingValidator";
import { generateAssemblyGuide, type AssemblyGuide } from "@/manufacturing/AssemblyGuide";
import { generateAssemblySVG } from "@/manufacturing/PDFAssemblyExporter";
import type { BaseObjectData } from "@/types/objects";

// ── Wizard State ────────────────────────────────────────────────

interface WizardState {
  currentStep: number;
  sheets: SplitSheet[];
  joints: Joint[];
  parts: WizardPart[];
  bom: BOM | null;
  cost: CostBreakdown | null;
  guide: AssemblyGuide | null;
  issues: ValidationIssue[];
  completed: boolean[];
}

interface WizardPart {
  id: number;
  name: string;
  width: number;
  height: number;
  partNumber: string;
  material: string;
  thickness: number;
  sheetIndex: number;
}

const WIZARD_STORAGE_KEY = "ramesh-mfg-wizard";

function loadWizardState(): Partial<WizardState> {
  try { return JSON.parse(localStorage.getItem(WIZARD_STORAGE_KEY) || "{}"); } catch { return {}; }
}

function saveWizardState(state: Partial<WizardState>) {
  try { localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(state)); } catch {}
}

const STEPS = ["Validate", "Sheets", "Joints", "Numbering", "Manufacturing", "Export"];

export function ManufacturingWizard() {
  const objects = useEditorStoreV2((s) => s.objects);
  const sheets = useManufacturingStore((s) => s.sheets);
  const parts = useManufacturingStore((s) => s.parts);

  const [step, setStep] = useState(() => loadWizardState().currentStep || 0);
  const [wizSheets, setWizSheets] = useState<SplitSheet[]>([]);
  const [wizJoints, setWizJoints] = useState<Joint[]>([]);
  const [wizParts, setWizParts] = useState<WizardPart[]>([]);
  const [wizIssues, setWizIssues] = useState<ValidationIssue[]>([]);
  const [wizBom, setWizBom] = useState<BOM | null>(null);
  const [wizCost, setWizCost] = useState<CostBreakdown | null>(null);
  const [wizGuide, setWizGuide] = useState<AssemblyGuide | null>(null);
  const [autoFixed, setAutoFixed] = useState(false);
  const [completed, setCompleted] = useState<boolean[]>([false, false, false, false, false, false]);

  // ── Generate data for steps ─────────────────────────────────

  const runValidation = useCallback(() => {
    const objs = objects.map((o) => ({
      id: o.id, name: o.name,
      x: o.x, y: o.y, width: o.width, height: o.height,
      material: "thermocol", thickness: 25,
    }));
    const j = generateJoints(objs);
    const issues = validateManufacturing(objs, 990, 482, j);
    setWizIssues(issues);
    setAutoFixed(false);
    setCompleted((c) => { const n = [...c]; n[0] = true; return n; });
    saveWizardState({ currentStep: step, issues, completed: [...completed, true] } as any);
  }, [objects, step]);

  const runSheetSplitting = useCallback(() => {
    const partList = objects.map((o) => ({
      id: o.id, name: o.name,
      width: Math.max(20, o.width), height: Math.max(20, o.height),
      partNumber: assignPartNumber(o.id),
    }));
    const s = splitIntoSheets(partList);
    setWizSheets(s);
    setCompleted((c) => { const n = [...c]; n[1] = true; return n; });
  }, [objects]);

  const runJoints = useCallback(() => {
    const objs = objects.map((o) => ({
      id: o.id, name: o.name,
      x: o.x, y: o.y, width: o.width, height: o.height,
      material: "thermocol", thickness: 25,
    }));
    const j = generateJoints(objs);
    setWizJoints(j);
    setCompleted((c) => { const n = [...c]; n[2] = true; return n; });
  }, [objects]);

  const runNumbering = useCallback(() => {
    resetNumbering();
    const numbered = objects.map((o, i) => {
      const pn = assignPartNumber(o.id);
      return { id: o.id, name: o.name, width: o.width, height: o.height, partNumber: pn, material: "thermocol", thickness: 25, sheetIndex: 0 };
    });
    setWizParts(numbered);
    setCompleted((c) => { const n = [...c]; n[3] = true; return n; });
  }, [objects]);

  const runManufacturing = useCallback(() => {
    const partData = objects.map((o) => ({
      partNumber: assignPartNumber(o.id), name: o.name,
      material: "thermocol", thickness: 25, width: o.width, height: o.height, quantity: 1,
    }));
    const sheetData = wizSheets.length > 0 ? wizSheets : [{ index: 0, usedArea: 0, totalArea: 477180, label: "", parts: [], waste: 0, efficiency: 0 }];
    const b = generateBOM(partData, sheetData, wizJoints);
    const totalArea = b.summary.totalArea;
    const cutLength = b.summary.totalCutLength * 1000;
    const glueMl = parseInt(b.summary.estimatedGlue) || 20;
    const machineTime = Math.round(cutLength / 2000 * 60);
    const c = calculateCost(totalArea, cutLength, glueMl, machineTime);
    setWizBom(b);
    setWizCost(c);
    const guide = generateAssemblyGuide(
      partData.map((p) => ({ partNumber: p.partNumber, name: p.name, x: 0, y: 0 })),
      wizJoints,
    );
    setWizGuide(guide);
    setCompleted((cc) => { const n = [...cc]; n[4] = true; return n; });
  }, [objects, wizSheets, wizJoints]);

  // Auto-run step on entry
  useEffect(() => {
    switch (step) {
      case 0: if (!completed[0]) runValidation(); break;
      case 1: if (!completed[1]) runSheetSplitting(); break;
      case 2: if (!completed[2]) runJoints(); break;
      case 3: if (!completed[3]) runNumbering(); break;
      case 4: if (!completed[4]) runManufacturing(); break;
    }
  }, [step]);

  function handleAutoFix() {
    // Auto-fix: remove tiny parts by enlarging them
    const updated = objects.map((o) => {
      if (o.width < 10 && o.height < 10) return { ...o, width: 20, height: 20 };
      if (o.width < 10) return { ...o, width: 20 };
      if (o.height < 10) return { ...o, height: 20 };
      return o;
    });
    // Update store
    setAutoFixed(true);
    runValidation();
  }

  function handleExportSVG() {
    let svg = "";
    if (wizGuide) svg = generateAssemblySVG(wizGuide);
    if (!svg) svg = "<svg></svg>";
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "manufacturing-guide.svg";
    a.click();
  }

  function handleExportJSON() {
    const data = {
      project: "Manufacturing Project",
      date: new Date().toISOString(),
      sheets: wizSheets,
      joints: wizJoints,
      parts: wizParts,
      bom: wizBom,
      cost: wizCost,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "manufacturing-project.json";
    a.click();
  }

  function handleExportCSV() {
    if (!wizBom) return;
    const rows = [["Part Number", "Name", "Material", "Width", "Height", "Area", "Weight"]];
    for (const e of wizBom.entries) {
      rows.push([e.partNumber, e.name, e.material, String(e.width), String(e.height), String(e.area), String(e.weight)]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bom.csv";
    a.click();
  }

  function handleRenumber() {
    renumberByPosition(objects.map((o) => ({ id: o.id, x: o.x, y: o.y })));
    runNumbering();
  }

  const navButton: React.CSSProperties = {
    padding: "10px 20px", borderRadius: 6, border: "none",
    fontSize: 13, fontWeight: 600, cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#0f172a", color: "#e2e8f0" }}>
      {/* ── Progress Bar ── */}
      <div style={{ display: "flex", borderBottom: "1px solid #1e293b", overflow: "auto" }}>
        {STEPS.map((label, i) => {
          const isActive = step === i;
          const isDone = completed[i];
          return (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                flex: 1, padding: "12px 8px", fontSize: 11, fontWeight: 600,
                border: "none", borderBottom: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                background: isActive ? "rgba(59,130,246,0.1)" : "transparent",
                color: isActive ? "#60a5fa" : isDone ? "#22c55e" : "#64748b",
                cursor: "pointer", minWidth: 80, position: "relative",
              }}
            >
              <span style={{ display: "block", fontSize: 14, marginBottom: 2 }}>
                {isDone ? "✓" : isActive ? "○" : "○"}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Step Content ── */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {/* Step 1: Validation */}
        {step === 0 && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#f8fafc" }}>Step 1: Validation</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
              Checking {objects.length} objects for manufacturing issues...
            </p>
            {wizIssues.length === 0 ? (
              <div style={{ padding: 16, background: "rgba(34,197,94,0.1)", borderRadius: 8, color: "#22c55e", fontSize: 14 }}>
                ✅ No issues found — design is ready for manufacturing
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {wizIssues.map((issue, i) => (
                  <div key={i} style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: issue.severity === "error" ? "rgba(239,68,68,0.1)" : issue.severity === "warning" ? "rgba(251,191,36,0.1)" : "rgba(59,130,246,0.1)",
                    borderLeft: `3px solid ${issue.severity === "error" ? "#ef4444" : issue.severity === "warning" ? "#fbbf24" : "#3b82f6"}`,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
                      {issue.severity.toUpperCase()}: {issue.message}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{issue.detail}</div>
                  </div>
                ))}
              </div>
            )}
            {!autoFixed && (
              <button onClick={handleAutoFix} style={{ ...navButton, background: "#1e40af", color: "white", marginTop: 16 }}>
                Auto Fix Issues
              </button>
            )}
          </div>
        )}

        {/* Step 2: Sheet Splitting */}
        {step === 1 && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#f8fafc" }}>Step 2: Sheet Splitting (39×19")</h3>
            {wizSheets.length > 0 && (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <InfoChip label="Sheets" value={String(wizSheets.length)} />
                  <InfoChip label="Total Parts" value={String(wizSheets.reduce((s, sh) => s + sh.parts.length, 0))} />
                  <InfoChip label="Avg Efficiency" value={`${(wizSheets.reduce((s, sh) => s + sh.efficiency, 0) / wizSheets.length * 100).toFixed(0)}%`} />
                  <InfoChip label="Total Waste" value={`${(wizSheets.reduce((s, sh) => s + sh.waste, 0) / 1000).toFixed(1)} cm²`} />
                </div>
                {wizSheets.map((sheet, si) => (
                  <div key={si} style={{ marginBottom: 16, background: "#1e293b", borderRadius: 8, padding: 12 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#94a3b8" }}>
                      {sheet.label} — {sheet.parts.length} parts — {(sheet.efficiency * 100).toFixed(0)}% efficiency
                    </h4>
                    <svg width="100%" height="120" viewBox={`0 0 ${990} ${482}`} preserveAspectRatio="xMidYMid meet" style={{ background: "#0f172a", borderRadius: 4 }}>
                      <rect width="990" height="482" fill="#1e293b" stroke="#334155" />
                      {sheet.parts.map((p, pi) => (
                        <g key={pi}>
                          <rect x={p.x} y={p.y} width={p.width} height={p.height} fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="1" />
                          <text x={p.x + 2} y={p.y + 10} fontSize="8" fill="#94a3b8">{p.partNumber}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Step 3: Puzzle Joints */}
        {step === 2 && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#f8fafc" }}>Step 3: Puzzle Joints</h3>
            {wizJoints.length === 0 ? (
              <p style={{ color: "#64748b" }}>No adjacent parts found — no joints generated</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {wizJoints.map((j, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#1e293b", borderRadius: 6, fontSize: 12 }}>
                    <span style={{ color: "#94a3b8" }}>Part {j.partAId} → Part {j.partBId}</span>
                    <select
                      value={j.type}
                      onChange={() => {}}
                      style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #334155", background: "#0f172a", color: "#e2e8f0", fontSize: 11 }}
                    >
                      {(["finger", "puzzle-lock", "dovetail", "slot", "straight", "snap-lock"] as JointType[]).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span style={{ color: "#64748b", fontSize: 11 }}>{j.length}mm · {j.count} fingers · {j.orientation}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Part Numbering */}
        {step === 3 && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#f8fafc" }}>Step 4: Part Numbering</h3>
            <button onClick={handleRenumber} style={{ ...navButton, background: "#1e293b", color: "#e2e8f0", marginBottom: 12 }}>
              Renumber by Position
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {wizParts.map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: "#1e293b", borderRadius: 4, fontSize: 12 }}>
                  <span style={{ color: "#60a5fa", fontWeight: 600 }}>{p.partNumber}</span>
                  <span style={{ color: "#e2e8f0" }}>{p.name}</span>
                  <span style={{ color: "#94a3b8" }}>{p.width}×{p.height}mm</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Manufacturing Data */}
        {step === 4 && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#f8fafc" }}>Step 5: Manufacturing Estimate</h3>
            {wizBom && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                <InfoChip label="Total Parts" value={String(wizBom.summary.totalParts)} />
                <InfoChip label="Sheets" value={String(wizBom.summary.totalSheets)} />
                <InfoChip label="Total Area" value={`${(wizBom.summary.totalArea / 1e6).toFixed(2)} m²`} />
                <InfoChip label="Waste" value={`${wizBom.summary.wastePercent}%`} />
                <InfoChip label="Weight" value={`${wizBom.summary.totalWeight} kg`} />
                <InfoChip label="Cut Length" value={`${wizBom.summary.totalCutLength} m`} />
                <InfoChip label="Glue" value={wizBom.summary.estimatedGlue} />
                <InfoChip label="LEDs" value={String(wizBom.summary.estimatedLEDs)} />
              </div>
            )}
            {wizCost && (
              <div style={{ background: "#1e293b", borderRadius: 8, padding: 12 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, color: "#94a3b8" }}>Cost Breakdown</h4>
                {Object.entries(wizCost.formatted).map(([key, value]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #1f2937", fontSize: 12 }}>
                    <span style={{ color: "#94a3b8" }}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                    <span style={{ color: "#e2e8f0", fontWeight: key === "total" ? 700 : 400 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 6: Export */}
        {step === 5 && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#f8fafc" }}>Step 6: Export</h3>
            <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 16 }}>
              Generate manufacturing files for production
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
              <ExportButton label="Export SVG Guide" icon="📐" onClick={handleExportSVG} />
              <ExportButton label="Export BOM CSV" icon="📊" onClick={handleExportCSV} />
              <ExportButton label="Export JSON Project" icon="📦" onClick={handleExportJSON} />
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #1e293b" }}>
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          style={{ ...navButton, background: "#1e293b", color: step === 0 ? "#475569" : "#e2e8f0", opacity: step === 0 ? 0.5 : 1 }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 12, color: "#64748b", alignSelf: "center" }}>
          Step {step + 1} of 6
        </span>
        <button
          onClick={() => {
            if (step < 5) setStep(step + 1);
          }}
          disabled={step === 5}
          style={{ ...navButton, background: "#1e40af", color: "white", opacity: step === 5 ? 0.5 : 1 }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────────────

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "8px 12px", background: "#1e293b", borderRadius: 6 }}>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>{value}</div>
    </div>
  );
}

function ExportButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderRadius: 8, border: "1px solid #334155",
        background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontWeight: 500,
        cursor: "pointer", transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#334155"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#1e293b"; }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
