"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { ActionButtons } from "./ActionButtons";
import { PartDetails } from "./PartDetails";
import { PartHeader } from "./PartHeader";
import { PartTable } from "./PartTable";
import { ProjectSummary } from "./ProjectSummary";
import { SheetPreview } from "./SheetPreview";
import { Statistics } from "./Statistics";

export function PartNumberingPage() {
  const router = useRouter();
  const project = useProjectStore((state) => state.project);
  const updateProject = useProjectStore((state) => state.updateProject);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const totalSheets = project.estimatedSheets;

  const partItems = [
    { partNumber: "P001", partName: "Left Pillar", sheet: "Sheet 01", quantity: "2", layer: "Layer 1", status: "Ready" },
    { partNumber: "P002", partName: "Right Pillar", sheet: "Sheet 01", quantity: "2", layer: "Layer 1", status: "Ready" },
    { partNumber: "P003", partName: "Halo", sheet: "Sheet 01", quantity: "1", layer: "Layer 2", status: "Pending" },
    { partNumber: "P004", partName: "Base Ring", sheet: "Sheet 02", quantity: "1", layer: "Layer 1", status: "Modified" },
    { partNumber: "P005", partName: "Border", sheet: "Sheet 02", quantity: "1", layer: "Layer 2", status: "Ready" },
  ];

  return (
    <main style={{ padding: 24, background: "#020617", minHeight: "100vh", color: "#f8fafc" }}>
      <div style={{ display: "grid", gap: 20 }}>
        <PartHeader
          title="Part Numbering Engine"
          breadcrumb={["Dashboard", "Manufacturing", "Part Numbering"]}
          projectName={project.projectName}
          designId={project.designId}
          customerName={project.customerName}
          totalParts="18"
          totalSheets={String(project.estimatedSheets)}
        />

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr) minmax(280px, 340px)", alignItems: "start" }}>
          <ProjectSummary
            designName={project.designName}
            selectedSize={`${project.width} × ${project.height}`}
            material={project.material}
            thickness={project.thickness}
            estimatedSheets={String(project.estimatedSheets)}
            estimatedParts="18"
            assemblyDifficulty="Medium"
          />

          <div style={{ display: "grid", gap: 20 }}>
            <SheetPreview
              sheetIndex={sheetIndex}
              totalSheets={totalSheets}
              onPrev={() => setSheetIndex((value) => (value === 0 ? totalSheets - 1 : value - 1))}
              onNext={() => setSheetIndex((value) => (value + 1) % totalSheets)}
              onToggleGrid={() => setShowGrid((value) => !value)}
              showGrid={showGrid}
            />
            <PartTable items={partItems} />
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <PartDetails
              partNumber="P001"
              partName="Left Pillar"
              sheetNumber="Sheet 01"
              layer="Layer 1"
              quantity="2"
              material="Thermocol"
              status="Ready"
            />
            <Statistics
              totalParts="18"
              largestPart="P004"
              smallestPart="P007"
              averageSize="320 × 180 mm"
              totalSheets={String(project.estimatedSheets)}
              assemblyTime="2.1 hrs"
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <ActionButtons />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { updateProject({ currentStep: "Part Numbering" }); router.push("/assembly-guide"); }} style={{ border: "1px solid rgba(34,211,238,0.24)", borderRadius: 999, padding: "10px 14px", background: "rgba(34,211,238,0.12)", color: "#a5f3fc", cursor: "pointer", fontWeight: 700 }}>Generate Assembly Guide</button>
            <button type="button" onClick={() => router.back()} style={{ border: "1px solid rgba(148,163,184,0.16)", borderRadius: 999, padding: "10px 14px", background: "rgba(15,23,42,0.8)", color: "#f8fafc", cursor: "pointer", fontWeight: 700 }}>Back</button>
          </div>
        </div>
      </div>
    </main>
  );
}
