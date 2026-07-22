"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { ActionButtons } from "./ActionButtons";
import { AssemblyCanvas } from "./AssemblyCanvas";
import { AssemblyHeader } from "./AssemblyHeader";
import { AssemblySidebar } from "./AssemblySidebar";
import { AssemblyTimeline } from "./AssemblyTimeline";
import { Checklist } from "./Checklist";
import { PartTable } from "./PartTable";
import { StepDetails } from "./StepDetails";

const navigationItems = ["Overview", "Required Materials", "Sheet List", "Part List", "Assembly Steps", "Quality Check", "Packing Checklist"];

const timelineSteps = [
  { step: "1", label: "Prepare Parts", active: true },
  { step: "2", label: "Arrange Base", active: false },
  { step: "3", label: "Install Pillars", active: false },
  { step: "4", label: "Install Center Arch", active: false },
  { step: "5", label: "Install Halo", active: false },
  { step: "6", label: "Install Decorative Elements", active: false },
  { step: "7", label: "Quality Inspection", active: false },
  { step: "8", label: "Packing", active: false },
];

const checklistItems = ["All Parts Available", "Correct Sheet Used", "Glue Applied", "Alignment Verified", "Final Inspection", "Ready for Packing"];

const partItems = [
  { partNumber: "P001", partName: "Base Frame", sheetNumber: "Sheet 01", quantity: "2", status: "Ready" },
  { partNumber: "P002", partName: "Left Pillar", sheetNumber: "Sheet 01", quantity: "2", status: "Ready" },
  { partNumber: "P003", partName: "Center Arch", sheetNumber: "Sheet 02", quantity: "1", status: "Pending" },
  { partNumber: "P004", partName: "Halo", sheetNumber: "Sheet 02", quantity: "1", status: "Pending" },
];

export function AssemblyGuidePage() {
  const router = useRouter();
  const project = useProjectStore((state) => state.project);
  const updateProject = useProjectStore((state) => state.updateProject);
  const [selectedNav, setSelectedNav] = useState("Assembly Steps");
  const [selectedPart, setSelectedPart] = useState("P001");
  const [stepIndex, setStepIndex] = useState(0);

  const story = useMemo(() => {
    const steps = [
      {
        stepNumber: "Step 01",
        description: "Prepare and verify all laser-cut parts",
        requiredParts: "P001, P002, P003",
        requiredGlue: "White Glue",
        estimatedTime: "10 min",
        warnings: "Do not force-fit the base frame",
        tips: "Keep parts sorted by sheet",
        checklist: ["All Parts Available", "Correct Sheet Used"],
      },
      {
        stepNumber: "Step 02",
        description: "Arrange the base frame and dry-fit connections",
        requiredParts: "P001, P002",
        requiredGlue: "White Glue",
        estimatedTime: "12 min",
        warnings: "Verify alignment before gluing",
        tips: "Use the alignment guide for center symmetry",
        checklist: ["Correct Sheet Used", "Alignment Verified"],
      },
      {
        stepNumber: "Step 03",
        description: "Install the side pillars and lock the base",
        requiredParts: "P002, P003",
        requiredGlue: "Epoxy Adhesive",
        estimatedTime: "18 min",
        warnings: "Keep pillars vertical",
        tips: "Support the structure while curing",
        checklist: ["Glue Applied", "Alignment Verified"],
      },
    ] as const;

    return steps[stepIndex] ?? steps[0];
  }, [stepIndex]);

  return (
    <main style={{ padding: 24, background: "#020617", minHeight: "100vh", color: "#f8fafc" }}>
      <div style={{ display: "grid", gap: 20 }}>
        <AssemblyHeader
          title="Interactive Assembly Guide"
          breadcrumb={["Dashboard", "Manufacturing", "Assembly Guide"]}
          projectName={project.projectName}
          designId={project.designId}
          customerName={project.customerName}
          currentVersion="v1.2"
          assemblyStatus="In Progress"
          estimatedAssemblyTime="2.1 hrs"
        />

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(240px, 280px) minmax(0, 1fr) minmax(280px, 340px)", alignItems: "start" }}>
          <AssemblySidebar items={navigationItems} selected={selectedNav} onSelect={setSelectedNav} />

          <div style={{ display: "grid", gap: 20 }}>
            <AssemblyCanvas
              currentStep={stepIndex + 1}
              onPrev={() => setStepIndex((value) => (value === 0 ? 2 : value - 1))}
              onNext={() => setStepIndex((value) => (value + 1) % 3)}
              onZoomIn={() => undefined}
              onZoomOut={() => undefined}
              onRotate={() => undefined}
              onFit={() => undefined}
            />
            <AssemblyTimeline steps={timelineSteps.map((step, index) => ({ ...step, active: index === stepIndex }))} />
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <StepDetails
              stepNumber={story.stepNumber}
              description={story.description}
              requiredParts={story.requiredParts}
              requiredGlue={story.requiredGlue}
              estimatedTime={story.estimatedTime}
              warnings={story.warnings}
              tips={story.tips}
              checklist={[...story.checklist]}
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 320px)", alignItems: "start" }}>
          <PartTable items={partItems} selectedPart={selectedPart} onSelectPart={setSelectedPart} />
          <Checklist items={checklistItems} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <ActionButtons />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => { updateProject({ currentStep: "Assembly Guide" }); router.push("/dashboard"); }} style={{ border: "1px solid rgba(34,211,238,0.24)", borderRadius: 999, padding: "10px 14px", background: "rgba(34,211,238,0.12)", color: "#a5f3fc", cursor: "pointer", fontWeight: 700 }}>Back to Dashboard</button>
            <button type="button" onClick={() => router.back()} style={{ border: "1px solid rgba(148,163,184,0.16)", borderRadius: 999, padding: "10px 14px", background: "rgba(15,23,42,0.8)", color: "#f8fafc", cursor: "pointer", fontWeight: 700 }}>Back</button>
          </div>
        </div>
      </div>
    </main>
  );
}
