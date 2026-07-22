"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { getProjectReadiness } from "@/lib/projectWorkflow";
import { ManufacturingHeader } from "./ManufacturingHeader";
import { ProductionSummary } from "./ProductionSummary";
import { SheetPreview } from "./SheetPreview";
import { AssemblyTable } from "./AssemblyTable";
import { Timeline } from "./Timeline";
import { JobSummary } from "./JobSummary";
import { ExportButtons } from "./ExportButtons";

export function ManufacturingStudio() {
  const router = useRouter();
  const project = useProjectStore((state) => state.project);
  const updateProject = useProjectStore((state) => state.updateProject);
  const [notice, setNotice] = useState<string | null>(null);

  const readiness = useMemo(() => getProjectReadiness(project), [project]);

  const sheets = [
    {
      id: "sheet-1",
      sheetNumber: "Sheet 01",
      parts: [
        { id: "p001", label: "P001 Left Pillar" },
        { id: "p002", label: "P002 Right Pillar" },
        { id: "p003", label: "P003 Halo" },
      ],
      utilization: 84,
      waste: 16,
    },
    {
      id: "sheet-2",
      sheetNumber: "Sheet 02",
      parts: [
        { id: "p004", label: "P004 Base Ring" },
        { id: "p005", label: "P005 Border" },
      ],
      utilization: 76,
      waste: 24,
    },
    {
      id: "sheet-3",
      sheetNumber: "Sheet 03",
      parts: [{ id: "p006", label: "P006 Decorative Frame" }],
      utilization: 68,
      waste: 32,
    },
  ];

  const assemblyItems = [
    { partNumber: "P001", partName: "Left Pillar", quantity: 2, sheetNumber: "Sheet 1" },
    { partNumber: "P002", partName: "Right Pillar", quantity: 2, sheetNumber: "Sheet 1" },
    { partNumber: "P003", partName: "Halo", quantity: 1, sheetNumber: "Sheet 2" },
    { partNumber: "P004", partName: "Base Ring", quantity: 1, sheetNumber: "Sheet 2" },
  ];

  const timelineSteps = [
    { label: "Generate Design", status: "done" as const },
    { label: "Generate Parts", status: "done" as const },
    { label: "Nest Sheets", status: "done" as const },
    { label: "Laser Cutting", status: "waiting" as const },
    { label: "Sorting", status: "waiting" as const },
    { label: "Assembly", status: "waiting" as const },
    { label: "Packing", status: "waiting" as const },
  ];

  return (
    <div style={{ padding: 20, background: "#020617", color: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "grid", gap: 20 }}>
        <ManufacturingHeader
          title="Manufacturing Center"
          projectName={project.projectName}
          designId={project.designId}
          customerName={project.customerName}
          orderNo={`ORD-${project.id}`}
          status="Ready for Production"
          productionDate="22 Jul 2026"
          deliveryDate="28 Jul 2026"
        />

        <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0, 1fr) 320px", gap: 20 }}>
          <div style={{ display: "grid", gap: 20 }}>
            <ProductionSummary
              designName={project.designName}
              designSize={`${project.width} × ${project.height}`}
              material={project.material}
              thickness={project.thickness}
              materialCost="₹18,500"
              labourCost="₹7,200"
              sellingPrice="₹34,000"
              profit="₹8,300"
            />
            <JobSummary
              totalSheets={String(project.estimatedSheets)}
              materialUsed="84%"
              materialWaste="16%"
              productionTime="6.5 hrs"
              deliveryDate="28 Jul 2026"
            />
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <SheetPreview sheets={sheets} />
            <ExportButtons
              buttons={[
                { label: "Generate SVG", icon: "⬢" },
                { label: "Generate PNG", icon: "🖼" },
                { label: "Generate PDF", icon: "⬇" },
                { label: "Generate Assembly Guide", icon: "🧩" },
                { label: "Generate BOM", icon: "☰" },
                { label: "Export Job Sheet", icon: "⇩" },
                { label: "Print", icon: "⎘" },
              ]}
            />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => {
                if (!readiness.isReady) {
                  setNotice(`Please complete the missing fields: ${readiness.missingFields.join(", ")}.`);
                  return;
                }
                updateProject({ currentStep: "Manufacturing" });
                setNotice("Manufacturing summary is ready for downstream generation.");
                router.push("/svg-generator");
              }} style={{ border: "1px solid rgba(34,211,238,0.24)", borderRadius: 999, padding: "10px 14px", background: "rgba(34,211,238,0.12)", color: "#a5f3fc", cursor: "pointer", fontWeight: 700 }}>Generate SVG</button>
              <button type="button" onClick={() => {
                if (!readiness.isReady) {
                  setNotice(`Unable to continue: ${readiness.missingFields.join(", ")}.`);
                  return;
                }
                setNotice("Assembly guide is now available for review.");
                router.push("/assembly-guide");
              }} style={{ border: "1px solid rgba(34,211,238,0.24)", borderRadius: 999, padding: "10px 14px", background: "rgba(34,211,238,0.12)", color: "#a5f3fc", cursor: "pointer", fontWeight: 700 }}>Assembly Guide</button>
              <button type="button" onClick={() => router.back()} style={{ border: "1px solid rgba(148,163,184,0.16)", borderRadius: 999, padding: "10px 14px", background: "rgba(15,23,42,0.8)", color: "#f8fafc", cursor: "pointer", fontWeight: 700 }}>Back</button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <section
              style={{
                border: "1px solid rgba(148, 163, 184, 0.16)",
                borderRadius: 20,
                padding: 18,
                background: "linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(15, 23, 42, 0.95))",
                boxShadow: "0 20px 50px rgba(2, 8, 23, 0.26)",
              }}
            >
              <h2 style={{ margin: 0, color: "#f8fafc", fontSize: 16, fontWeight: 700 }}>Manufacturing Details</h2>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {[
                  ["Number of Parts", "18"],
                  ["Estimated Sheets", String(project.estimatedSheets)],
                  ["Glue Required", "180 ml"],
                  ["Estimated Cutting Time", "3.2 hrs"],
                  ["Estimated Assembly Time", "2.1 hrs"],
                  ["Difficulty", "Medium"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: "rgba(15, 23, 42, 0.8)" }}>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </section>

            <Timeline steps={timelineSteps} />
            <AssemblyTable items={assemblyItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
