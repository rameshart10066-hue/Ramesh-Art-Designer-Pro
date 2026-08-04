/**
 * Manufacturing Planner
 *
 * Plans manufacturing for an AI-generated design.
 * Calculates sheet requirements, material usage, and estimated cost.
 */

import type { SelectedComponent } from "./ComponentSelector";
import { splitIntoSheets, getSheetStats } from "@/manufacturing/SheetSplitter";
import { generateJoints } from "@/manufacturing/PuzzleJointGenerator";
import { generateBOM } from "@/manufacturing/BOMGenerator";
import { calculateCost } from "@/manufacturing/CostEstimator";
import { assignPartNumber, resetNumbering } from "@/manufacturing/PartNumbering";
import type { BOM } from "@/manufacturing/BOMGenerator";
import type { CostBreakdown } from "@/manufacturing/CostEstimator";

export interface ManufacturingPlan {
  sheetCount: number;
  parts: { id: number; name: string; width: number; height: number; partNumber: string }[];
  sheets: ReturnType<typeof splitIntoSheets>;
  joints: ReturnType<typeof generateJoints>;
  bom: BOM;
  cost: CostBreakdown;
  totalTime: number;
}

export function planManufacturing(components: SelectedComponent[]): ManufacturingPlan {
  resetNumbering();

  const parts = components.map((c, i) => ({
    id: i + 1,
    name: c.name,
    width: Math.round(c.width),
    height: Math.round(c.height),
    partNumber: assignPartNumber(i + 1),
  }));

  const sheets = splitIntoSheets(parts);
  const joints = generateJoints(parts.map((p) => ({ id: p.id, name: p.name, x: components[p.id - 1]?.x || 0, y: components[p.id - 1]?.y || 0, width: p.width, height: p.height, material: "thermocol", thickness: 25 })));

  const bomParts = parts.map((p) => ({
    partNumber: p.partNumber, name: p.name,
    material: "thermocol", thickness: 25, width: p.width, height: p.height, quantity: 1,
  }));

  const bom = generateBOM(bomParts, sheets, joints);
  const totalArea = bom.summary.totalArea;
  const cutLength = bom.summary.totalCutLength * 1000;
  const glueMl = parseInt(bom.summary.estimatedGlue) || 20;
  const machineTime = Math.round(cutLength / 2000 * 60);
  const cost = calculateCost(totalArea, cutLength, glueMl, machineTime);

  return { sheetCount: sheets.length, parts, sheets, joints, bom, cost, totalTime: machineTime };
}
