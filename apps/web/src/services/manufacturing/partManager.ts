/**
 * Part Manager
 *
 * Generates part data from canvas objects for manufacturing.
 * Calculates area, perimeter, cut length, estimated time.
 */

import type { BaseObjectData } from "@/types/objects";
import type { PartData } from "@/types/manufacturing";

let partNumberCounter = 1;

export function resetPartNumbers() { partNumberCounter = 1; }

const MATERIAL_COST_PER_SQ_MM: Record<string, number> = {
  "Thermocol": 0.00045,
  "Acrylic": 0.0025,
  "MDF": 0.0012,
  "Plywood": 0.0008,
  "Cardboard": 0.0003,
};

/** Convert a canvas object to manufacturing part data */
export function objectToPartData(
  obj: BaseObjectData,
  scaleFactor: number = 1,   // pixels → mm
  material: string = "Thermocol",
  thickness: number = 12,    // mm
  quantity: number = 1,
): PartData {
  const w = obj.width * scaleFactor;
  const h = obj.height * scaleFactor;
  const area = w * h;
  const perimeter = 2 * (w + h);
  const cutLength = perimeter; // simplified — only edge cut
  const density = material === "Thermocol" ? 0.025 : material === "Acrylic" ? 1.18 : 0.7; // g/cm³

  // Ensure cutLength is non-zero
  const effectiveCutLength = Math.max(cutLength, 1);

  return {
    objectId: obj.id,
    partNumber: `PART-${String(partNumberCounter++).padStart(4, "0")}`,
    name: obj.name,
    width: w,
    height: h,
    area,
    perimeter,
    cutLength: effectiveCutLength,
    material,
    thickness,
    quantity,
    weight: area * thickness / 1000 * density / 1000, // g
    estimatedTime: effectiveCutLength / 20 * quantity, // seconds at 20mm/s
    color: obj.fill || "#cccccc",
    locked: obj.locked,
  };
}

/** Generate part data from all canvas objects */
export function generateParts(
  objects: BaseObjectData[],
  scaleFactor: number = 1,
  material: string = "Thermocol",
  thickness: number = 12,
): PartData[] {
  resetPartNumbers();
  return objects
    .filter((o) => o.visible && !o.locked)
    .map((obj) => objectToPartData(obj, scaleFactor, material, thickness));
}

/** Update material cost calculations */
export function calculateMaterialCost(
  parts: PartData[],
  material: string = "Thermocol",
): PartData[] {
  const costPerSqMm = MATERIAL_COST_PER_SQ_MM[material] || 0.00045;
  return parts.map((p) => ({
    ...p,
    // No direct cost field in PartData, but used by estimator
  }));
}

/** Get total metrics across parts */
export function getPartMetrics(parts: PartData[]) {
  return {
    totalParts: parts.length,
    totalArea: parts.reduce((s, p) => s + p.area, 0),
    totalCutLength: parts.reduce((s, p) => s + p.cutLength, 0),
    totalWeight: parts.reduce((s, p) => s + p.weight, 0),
    totalTime: parts.reduce((s, p) => s + p.estimatedTime, 0),
  };
}
