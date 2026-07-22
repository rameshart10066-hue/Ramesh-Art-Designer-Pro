"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { getProjectReadiness } from "@/lib/projectWorkflow";
import { ExportButtons } from "./ExportButtons";
import { ProjectDetails } from "./ProjectDetails";
import { SVGHeader } from "./SVGHeader";
import { SVGPreview } from "./SVGPreview";
import { SVGSettings, type SVGSettingsState } from "./SVGSettings";
import { ValidationPanel } from "./ValidationPanel";

const initialSettings: SVGSettingsState = {
  addPartNumbers: true,
  addSlotNumbers: true,
  addAlignmentMarks: true,
  addSheetNumbers: true,
  showCutOrder: true,
  kerfCompensation: "0.10",
  cutDirection: "Clockwise",
  optimize: true,
};

export function SVGGeneratorPage() {
  const router = useRouter();
  const project = useProjectStore((state) => state.project);
  const updateProject = useProjectStore((state) => state.updateProject);
  const [notice, setNotice] = useState<string | null>(null);
  const readiness = useMemo(() => getProjectReadiness(project), [project]);
  const [settings, setSettings] = useState<SVGSettingsState>(initialSettings);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [showPartNumbers, setShowPartNumbers] = useState(true);
  const [showSlots, setShowSlots] = useState(true);
  const [showCutOrder, setShowCutOrder] = useState(true);

  const isOptimized = useMemo(() => settings.optimize && settings.showCutOrder, [settings.optimize, settings.showCutOrder]);

  const toggleSetting = (key: keyof SVGSettingsState) => {
    if (key === "optimize") {
      setSettings((value) => ({ ...value, optimize: !value.optimize }));
      return;
    }

    setSettings((value) => ({ ...value, [key]: !value[key] }));
  };

  const updateSetting = (key: keyof Pick<SVGSettingsState, "kerfCompensation" | "cutDirection">, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  return (
    <main style={{ padding: 24, background: "#020617", minHeight: "100vh", color: "#f8fafc" }}>
      <div style={{ display: "grid", gap: 20 }}>
        <SVGHeader title="SVG Generation Center" breadcrumb={["Dashboard", "Manufacturing", "SVG Generator"]} />

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr) minmax(280px, 340px)", alignItems: "start" }}>
          <ProjectDetails
            designName={project.designName}
            customer={project.customerName}
            orderNo={`ORD-${project.id}`}
            designSize={`${project.width} × ${project.height}`}
            material={project.material}
            thickness={project.thickness}
            estimatedSheets={String(project.estimatedSheets)}
            totalParts="18"
          />

          <div style={{ display: "grid", gap: 20 }}>
            <SVGPreview 
              zoom={zoom}
              showGrid={showGrid}
              showPartNumbers={showPartNumbers}
              showSlots={showSlots}
              showCutOrder={showCutOrder}
              onZoomIn={() => setZoom((value) => Math.min(value + 10, 200))}
              onZoomOut={() => setZoom((value) => Math.max(value - 10, 60))}
              onResetView={() => {
                setZoom(100);
                setShowGrid(true);
                setShowPartNumbers(true);
                setShowSlots(true);
                setShowCutOrder(true);
              }}
            />
            <ValidationPanel
              closedPaths="42"
              openPaths="0"
              duplicateLines="0"
              overlappingLines="2"
              warnings="Minor tolerance warning"
              status={isOptimized ? "Ready for Export" : "Needs Review"}
            />
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <SVGSettings
              value={settings}
              onToggle={(key) => {
                toggleSetting(key);
                if (key === "addPartNumbers") setShowPartNumbers((value) => !value);
                if (key === "addSlotNumbers") setShowSlots((value) => !value);
                if (key === "showCutOrder") setShowCutOrder((value) => !value);
              }}
              onChange={updateSetting}
            />
            <section style={{ border: "1px solid rgba(148, 163, 184, 0.16)", borderRadius: 22, padding: 18, background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.96))", boxShadow: "0 16px 40px rgba(2, 8, 23, 0.24)" }}>
              <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>Preview Controls</h2>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {[
                  ["Grid", showGrid, () => setShowGrid((value) => !value)],
                  ["Show Part Numbers", showPartNumbers, () => setShowPartNumbers((value) => !value)],
                  ["Show Slots", showSlots, () => setShowSlots((value) => !value)],
                  ["Show Cut Order", showCutOrder, () => setShowCutOrder((value) => !value)],
                ].map(([label, enabled, handler]) => (
                  <button key={label as string} type="button" onClick={handler as () => void} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(148, 163, 184, 0.18)", background: enabled ? "rgba(34, 211, 238, 0.12)" : "rgba(15, 23, 42, 0.72)", color: enabled ? "#a5f3fc" : "#94a3b8" }}>
                    <span>{label as string}</span>
                    <span>{enabled ? "On" : "Off"}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <ExportButtons />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => {
              if (!readiness.isReady) {
                setNotice(`Please complete the missing fields: ${readiness.missingFields.join(", ")}.`);
                return;
              }
              updateProject({ currentStep: "SVG Generator" });
              setNotice("SVG generation is ready for nesting.");
              router.push("/nesting");
            }} style={{ border: "1px solid rgba(34,211,238,0.24)", borderRadius: 999, padding: "10px 14px", background: "rgba(34,211,238,0.12)", color: "#a5f3fc", cursor: "pointer", fontWeight: 700 }}>Generate Nesting</button>
            <button type="button" onClick={() => router.back()} style={{ border: "1px solid rgba(148,163,184,0.16)", borderRadius: 999, padding: "10px 14px", background: "rgba(15,23,42,0.8)", color: "#f8fafc", cursor: "pointer", fontWeight: 700 }}>Back</button>
          </div>
        </div>
      </div>
    </main>
  );
}
