"use client";

/**
 * Export Dialog — Unified export for all formats
 *
 * SVG, DXF, Laser G-code, PDF Assembly Guide, BOM CSV, JSON
 * Batch export with format selection and summary.
 */

import { useState, useMemo } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useManufacturingStore } from "@/stores/manufacturingStore";
import { exportSheetsSVG, exportSheetsDXF, exportLaserGCode, exportCutReadySVG } from "@/services/manufacturing/exportManager";
import { renderReportAsText, generateProductionReport, generateMaterialReport } from "@/services/manufacturing/reportGenerator";
import type { Report } from "@/types/manufacturing";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = "svg" | "dxf" | "laser" | "cut-svg" | "pdf" | "csv" | "json";

const FORMATS: { id: ExportFormat; label: string; icon: string; description: string }[] = [
  { id: "svg",      label: "SVG",       icon: "📐", description: "Vector sheets with part labels" },
  { id: "dxf",      label: "DXF",       icon: "📏", description: "CAD-compatible DXF format" },
  { id: "laser",    label: "Laser G-Code", icon: "⚡", description: "Ruida/LightBurn .nc files" },
  { id: "cut-svg",  label: "Cut-Ready SVG", icon: "✂️", description: "Color-coded laser layers" },
  { id: "pdf",      label: "Assembly PDF", icon: "📄", description: "Step-by-step assembly guide" },
  { id: "csv",      label: "BOM CSV",    icon: "📊", description: "Bill of materials spreadsheet" },
  { id: "json",     label: "JSON Project", icon: "📦", description: "Full manufacturing data" },
];

export function ExportDialog({ open, onClose }: ExportDialogProps) {
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(new Set(["svg"]));
  const [status, setStatus] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  const objects = useEditorStoreV2((s) => s.objects);
  const sheets = useManufacturingStore((s) => s.sheets);
  const parts = useManufacturingStore((s) => s.parts);
  const estimates = useManufacturingStore((s) => s.estimates);
  const cutPlan = useManufacturingStore((s) => s.cutPlan);
  const toolpathMappings = useManufacturingStore((s) => s.toolpathMappings);

  const summary = useMemo(() => {
    if (!estimates) return null;
    return [
      { label: "Objects", value: String(objects.length) },
      { label: "Sheets", value: String(sheets.length) },
      { label: "Estimated Cost", value: `₹${estimates.productionCost.toLocaleString("en-IN")}` },
      { label: "Machine Time", value: `${estimates.machineTime} min` },
      { label: "Materials", value: parts.length > 0 ? parts[0]?.material || "N/A" : "N/A" },
    ];
  }, [estimates, sheets, parts, objects]);

  function toggleFormat(fmt: ExportFormat) {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(fmt)) next.delete(fmt);
      else next.add(fmt);
      return next;
    });
  }

  async function handleExport() {
    if (selectedFormats.size === 0) return;
    setExporting(true);
    setStatus("Preparing export...");

    try {
      for (const fmt of selectedFormats) {
        setStatus(`Exporting ${fmt.toUpperCase()}...`);

        switch (fmt) {
          case "svg": {
            const svgs = exportSheetsSVG(sheets);
            for (let i = 0; i < svgs.length; i++) {
              downloadBlob(svgs[i]!, `sheet-${i + 1}.svg`, "image/svg+xml");
            }
            break;
          }
          case "dxf": {
            const dxfs = exportSheetsDXF(sheets);
            for (let i = 0; i < dxfs.length; i++) {
              downloadBlob(dxfs[i]!, `sheet-${i + 1}.dxf`, "application/dxf");
            }
            break;
          }
          case "laser": {
            if (!cutPlan) break;
            const codes = exportLaserGCode(sheets, cutPlan);
            for (let i = 0; i < codes.length; i++) {
              downloadBlob(codes[i]!, `sheet-${i + 1}.nc`, "text/plain");
            }
            break;
          }
          case "cut-svg": {
            if (!cutPlan) break;
            const cutSvgs = exportCutReadySVG(sheets, cutPlan, toolpathMappings);
            for (let i = 0; i < cutSvgs.length; i++) {
              downloadBlob(cutSvgs[i]!, `cut-ready-${i + 1}.svg`, "image/svg+xml");
            }
            break;
          }
          case "csv": {
            if (parts.length === 0) break;
            const rows = [["Part#", "Name", "Material", "Width", "Height", "Area", "Cut Length"]];
            for (const p of parts) {
              rows.push([p.partNumber, p.name, p.material, String(Math.round(p.width)), String(Math.round(p.height)), String(Math.round(p.area)), String(Math.round(p.cutLength))]);
            }
            const csv = rows.map((r) => r.join(",")).join("\n");
            downloadBlob(csv, "bom.csv", "text/csv");
            break;
          }
          case "json": {
            const data = JSON.stringify({ objects, sheets, parts, estimates, cutPlan }, null, 2);
            downloadBlob(data, "manufacturing-project.json", "application/json");
            break;
          }
          case "pdf": {
            if (!estimates) break;
            const report = generateProductionReport(estimates, sheets, parts);
            const text = renderReportAsText(report);
            downloadBlob(text, "production-report.txt", "text/plain");
            break;
          }
        }
      }

      setStatus("Export complete!");
      setTimeout(() => { setStatus(""); onClose(); }, 1500);
    } catch (err: any) {
      setStatus(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  }

  function downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(2, 6, 23, 0.95)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#0f172a", borderRadius: 16, maxWidth: 600, width: "90%",
        maxHeight: "90vh", overflow: "auto", border: "1px solid #1e293b",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #1e293b" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>Export Manufacturing Files</h2>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#94a3b8" }}>Select formats to export for production</p>
        </div>

        {/* Summary */}
        {summary && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e293b", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {summary.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc" }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Format selection */}
        <div style={{ padding: "16px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {FORMATS.map((fmt) => {
            const isSelected = selectedFormats.has(fmt.id);
            return (
              <button
                key={fmt.id}
                onClick={() => toggleFormat(fmt.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  borderRadius: 8, border: isSelected ? "2px solid #3b82f6" : "1px solid #334155",
                  background: isSelected ? "rgba(59,130,246,0.1)" : "#1e293b",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 20 }}>{fmt.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{fmt.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{fmt.description}</div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  {isSelected ? <span style={{ color: "#3b82f6" }}>✓</span> : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Status + Actions */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: status.includes("Error") ? "#ef4444" : status ? "#22c55e" : "#64748b" }}>
            {status || `${selectedFormats.size} format(s) selected`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} disabled={exporting} style={{
              padding: "10px 20px", borderRadius: 6, border: "1px solid #334155",
              background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13,
              opacity: exporting ? 0.5 : 1,
            }}>
              Cancel
            </button>
            <button onClick={handleExport} disabled={exporting || selectedFormats.size === 0} style={{
              padding: "10px 24px", borderRadius: 6, border: "none",
              background: exporting ? "#475569" : "#3b82f6",
              color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer",
              opacity: selectedFormats.size === 0 ? 0.5 : 1,
            }}>
              {exporting ? "Exporting..." : `Export ${selectedFormats.size} Format(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
