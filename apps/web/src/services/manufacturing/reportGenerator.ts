/**
 * Report Generator
 *
 * Generates production, material, part, sheet layout, cost, and machine time reports.
 */

import type { Report, ReportSection, MaterialEstimate, Sheet, PartData, CutOrderPlan } from "@/types/manufacturing";

export function generateProductionReport(
  estimate: MaterialEstimate,
  sheets: Sheet[],
  parts: PartData[],
): Report {
  return {
    title: "Production Report",
    date: new Date().toISOString().split("T")[0]!,
    sections: [
      {
        title: "Production Summary",
        lines: [
          `Total Parts: ${estimate.totalParts}`,
          `Sheets Required: ${estimate.sheetCount}`,
          `Total Cut Length: ${(estimate.totalCutLength / 1000).toFixed(1)} m`,
          `Machine Time: ${estimate.machineTime} min`,
          `Labor Time: ${estimate.laborTime} min`,
        ],
      },
      {
        title: "Material Usage",
        lines: [
          `Total Area: ${(estimate.totalArea / 1_000_000).toFixed(2)} m²`,
          `Used Area: ${(estimate.usedArea / 1_000_000).toFixed(2)} m²`,
          `Waste Area: ${(estimate.wasteArea / 1_000_000).toFixed(2)} m²`,
          `Waste: ${estimate.wastePercent}%`,
        ],
      },
      {
        title: "Sheet Breakdown",
        lines: sheets.map((s, i) =>
          `Sheet ${i + 1}: ${s.placements.length} parts, ${(s.efficiency * 100).toFixed(0)}% efficiency`,
        ),
      },
    ],
    summary: [
      { label: "Total Cost", value: `₹${estimate.productionCost.toLocaleString("en-IN")}` },
      { label: "Cost Per Part", value: `₹${estimate.costPerPart.toLocaleString("en-IN")}` },
      { label: "Production Time", value: `${(estimate.machineTime + estimate.laborTime)} min` },
    ],
  };
}

export function generateMaterialReport(
  estimate: MaterialEstimate,
  sheets: Sheet[],
  material: string,
): Report {
  return {
    title: "Material Report",
    date: new Date().toISOString().split("T")[0]!,
    sections: [
      {
        title: "Material Specification",
        lines: [
          `Material: ${material}`,
          `Sheet Size: ${sheets[0]?.width} × ${sheets[0]?.height} mm` || "N/A",
          `Sheets: ${estimate.sheetCount}`,
        ],
      },
      {
        title: "Cost Breakdown",
        lines: [
          `Material Cost: ₹${estimate.materialCost.toLocaleString("en-IN")}`,
          `Machine Time: ${estimate.machineTime} min`,
          `Labor Time: ${estimate.laborTime} min`,
          `Production Cost: ₹${estimate.productionCost.toLocaleString("en-IN")}`,
        ],
      },
    ],
    summary: [
      { label: "Material", value: material },
      { label: "Waste", value: `${estimate.wastePercent}%` },
      { label: "Cost", value: `₹${estimate.materialCost.toLocaleString("en-IN")}` },
    ],
  };
}

export function generatePartReport(parts: PartData[]): Report {
  return {
    title: "Part Report",
    date: new Date().toISOString().split("T")[0]!,
    sections: [
      {
        title: "Part List",
        lines: parts.map((p) =>
          `${p.partNumber}: ${p.name} — ${p.width}×${p.height}mm, ${(p.area / 100).toFixed(1)}cm²`,
        ),
      },
    ],
    summary: [
      { label: "Total Parts", value: String(parts.length) },
      { label: "Total Area", value: `${(parts.reduce((s, p) => s + p.area, 0) / 1_000_000).toFixed(2)} m²` },
    ],
  };
}

export function generateCostReport(estimate: MaterialEstimate): Report {
  const machineCost = Math.round(estimate.machineTime / 60 * 500);
  const laborCost = Math.round(estimate.laborTime / 60 * 300);
  return {
    title: "Cost Report",
    date: new Date().toISOString().split("T")[0]!,
    sections: [
      {
        title: "Cost Breakdown",
        lines: [
          `Material Cost: ₹${estimate.materialCost.toLocaleString("en-IN")}`,
          `Machine Cost: ₹${machineCost.toLocaleString("en-IN")} (${estimate.machineTime} min @ ₹500/hr)`,
          `Labor Cost: ₹${laborCost.toLocaleString("en-IN")} (${estimate.laborTime} min @ ₹300/hr)`,
          `---`,
          `Total Production Cost: ₹${estimate.productionCost.toLocaleString("en-IN")}`,
          `Cost Per Part: ₹${estimate.costPerPart.toLocaleString("en-IN")}`,
        ],
      },
    ],
    summary: [
      { label: "Material", value: `₹${estimate.materialCost.toLocaleString("en-IN")}` },
      { label: "Machine", value: `₹${machineCost.toLocaleString("en-IN")}` },
      { label: "Labor", value: `₹${laborCost.toLocaleString("en-IN")}` },
      { label: "Total", value: `₹${estimate.productionCost.toLocaleString("en-IN")}` },
    ],
  };
}

export function renderReportAsText(report: Report): string {
  const lines = [
    `========================================`,
    `  ${report.title}`,
    `  ${report.date}`,
    `========================================`,
    "",
  ];
  for (const section of report.sections) {
    lines.push(`── ${section.title} ──`);
    lines.push(...section.lines);
    lines.push("");
  }
  lines.push(`── Summary ──`);
  for (const s of report.summary) {
    lines.push(`  ${s.label}: ${s.value}`);
  }
  lines.push(`========================================`);
  return lines.join("\n");
}
