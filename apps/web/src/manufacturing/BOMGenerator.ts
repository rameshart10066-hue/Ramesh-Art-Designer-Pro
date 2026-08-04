/**
 * Bill of Materials Generator
 *
 * Generates complete BOM with material usage, sheet count, area,
 * waste percentage, glue estimate, LED estimate, packing, weight.
 */

export interface BOMEntry {
  partNumber: string;
  name: string;
  material: string;
  thickness: number;
  width: number;
  height: number;
  quantity: number;
  area: number;
  weight: number;
  cutLength: number;
  jointCount: number;
  notes: string;
}

export interface BOM {
  title: string;
  date: string;
  entries: BOMEntry[];
  summary: {
    totalParts: number;
    totalSheets: number;
    totalArea: number;
    wastePercent: number;
    totalWeight: number;
    totalCutLength: number;
    estimatedGlue: string;
    estimatedLEDs: number;
    packingVolume: string;
    notes: string[];
  };
}

export function generateBOM(
  parts: { partNumber: string; name: string; material: string; thickness: number; width: number; height: number; quantity: number }[],
  sheets: { index: number; usedArea: number; totalArea: number }[],
  joints: { partAId: number }[],
): BOM {
  const totalArea = parts.reduce((s, p) => s + p.width * p.height * p.quantity, 0);
  const totalSheetArea = sheets.reduce((s, sh) => s + sh.totalArea, 0);
  const wastePercent = totalSheetArea > 0 ? Math.round((1 - totalSheetArea / (totalArea || 1)) * 100) : 0;
  const totalWeight = parts.reduce((s, p) => s + p.width * p.height * p.thickness * 0.000025 * p.quantity, 0); // thermocol density
  const totalCutLength = parts.reduce((s, p) => s + 2 * (p.width + p.height) * p.quantity, 0);

  // Glue estimate: ~2ml per joint
  const glueMl = Math.max(20, joints.length * 2);

  // LEDs: estimate 1 per 100cm²
  const totalAreaCm = totalArea / 100;
  const estimatedLEDs = Math.max(0, Math.round(totalAreaCm / 100));

  const entries: BOMEntry[] = parts.map((p) => ({
    partNumber: p.partNumber,
    name: p.name,
    material: p.material,
    thickness: p.thickness,
    width: p.width,
    height: p.height,
    quantity: p.quantity,
    area: p.width * p.height,
    weight: p.width * p.height * p.thickness * 0.000025,
    cutLength: 2 * (p.width + p.height),
    jointCount: joints.filter((j) => String(j.partAId) === p.partNumber).length,
    notes: "",
  }));

  return {
    title: "Bill of Materials",
    date: new Date().toISOString().split("T")[0]!,
    entries,
    summary: {
      totalParts: parts.length,
      totalSheets: sheets.length,
      totalArea,
      wastePercent,
      totalWeight: Math.round(totalWeight * 100) / 100,
      totalCutLength: Math.round(totalCutLength / 1000 * 100) / 100,
      estimatedGlue: `${glueMl} ml`,
      estimatedLEDs,
      packingVolume: `${Math.ceil(totalArea / 1_000_000 * 10) / 10} m³`,
      notes: [
        "All dimensions in mm unless specified",
        "Weight calculated at thermocol density (25 kg/m³)",
        "Glue estimate based on 2ml per joint",
        "LED estimate based on 1 LED per 100cm²",
      ],
    },
  };
}
