/**
 * Material Estimator
 *
 * Calculates total material cost, waste, machine time, and production cost.
 */

import type { Sheet, MaterialEstimate, PartData } from "@/types/manufacturing";

const MACHINE_RATE = 500;   // ₹/hour
const LABOR_RATE = 300;     // ₹/hour
const MATERIAL_COST_PER_SQ_MM: Record<string, number> = {
  "Thermocol": 0.00045,
  "Acrylic": 0.0025,
  "MDF": 0.0012,
  "Plywood": 0.0008,
  "Cardboard": 0.0003,
};

export function calculateEstimate(
  parts: PartData[],
  sheets: Sheet[],
  material: string = "Thermocol",
): MaterialEstimate {
  const costPerSqMm = MATERIAL_COST_PER_SQ_MM[material] || 0.00045;
  const totalArea = parts.reduce((s, p) => s + p.area, 0);
  const totalCutLength = parts.reduce((s, p) => s + p.cutLength, 0);
  const sheetCount = sheets.length;
  const totalSheetArea = sheets.reduce((s, sh) => s + sh.width * sh.height, 0);
  const usedArea = sheets.reduce((s, sh) => s + sh.usedArea, 0);
  const wasteArea = totalSheetArea - usedArea;
  const wastePercent = totalSheetArea > 0 ? (wasteArea / totalSheetArea) * 100 : 0;

  const materialCost = Math.round(totalArea * costPerSqMm);
  const machineTime = Math.round(totalCutLength / 2000 * 60); // minutes at 33mm/s
  const laborTime = Math.round(machineTime * 0.4);
  const machineCost = Math.round(machineTime / 60 * MACHINE_RATE);
  const laborCost = Math.round(laborTime / 60 * LABOR_RATE);
  const productionCost = materialCost + machineCost + laborCost;

  return {
    totalParts: parts.length,
    totalArea,
    totalCutLength,
    sheetCount,
    usedArea,
    wasteArea,
    wastePercent: Math.round(wastePercent * 10) / 10,
    materialCost,
    machineTime,
    laborTime,
    productionCost,
    costPerPart: parts.length > 0 ? Math.round(productionCost / parts.length) : 0,
  };
}
