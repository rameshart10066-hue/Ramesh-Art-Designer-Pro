"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { ExportButtons } from "./ExportButtons";
import { MaterialSettings } from "./MaterialSettings";
import { NestingCanvas } from "./NestingCanvas";
import { NestingHeader } from "./NestingHeader";
import { OptimizationPanel } from "./OptimizationPanel";
import { StatisticsPanel } from "./StatisticsPanel";

export function NestingPage() {
  const router = useRouter();
  const project = useProjectStore((state) => state.project);
  const updateProject = useProjectStore((state) => state.updateProject);
  const [sheetIndex, setSheetIndex] = useState(0);
  const totalSheets = project.estimatedSheets;

  return (
    <main style={{ padding: 24, background: "#020617", minHeight: "100vh", color: "#f8fafc" }}>
      <div style={{ display: "grid", gap: 20 }}>
        <NestingHeader title="Auto Sheet Nesting" breadcrumb={["Dashboard", "Manufacturing", "SVG Generator", "Auto Nesting"]} />

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr) minmax(280px, 340px)", alignItems: "start" }}>
          <MaterialSettings
            boardSize="39 × 19 inch"
            material={project.material}
            thickness={project.thickness}
            kerf="0.15 mm"
            margin="5 mm"
            spacing="3 mm"
            optimization="Maximum Material Saving"
          />

          <div style={{ display: "grid", gap: 20 }}>
            <NestingCanvas
              sheetIndex={sheetIndex}
              totalSheets={totalSheets}
              onPrev={() => setSheetIndex((value) => (value === 0 ? totalSheets - 1 : value - 1))}
              onNext={() => setSheetIndex((value) => (value + 1) % totalSheets)}
            />
            <OptimizationPanel
              bestRotation="90°"
              bestArrangement="Interlocked"
              estimatedSavings="11.8%"
              optimizationScore="92/100"
              warnings="Minor edge clearance warning"
            />
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <StatisticsPanel
              totalSheets={String(project.estimatedSheets)}
              usedArea="68%"
              unusedArea="32%"
              utilization="84%"
              waste="16%"
              totalParts="18"
              cuttingTime="3.2 hrs"
              materialCost="₹18,500"
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <ExportButtons />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { updateProject({ currentStep: "Auto Nesting" }); router.push("/part-numbering"); }} style={{ border: "1px solid rgba(34,211,238,0.24)", borderRadius: 999, padding: "10px 14px", background: "rgba(34,211,238,0.12)", color: "#a5f3fc", cursor: "pointer", fontWeight: 700 }}>Generate Part Numbers</button>
            <button type="button" onClick={() => router.back()} style={{ border: "1px solid rgba(148,163,184,0.16)", borderRadius: 999, padding: "10px 14px", background: "rgba(15,23,42,0.8)", color: "#f8fafc", cursor: "pointer", fontWeight: 700 }}>Back</button>
          </div>
        </div>
      </div>
    </main>
  );
}
