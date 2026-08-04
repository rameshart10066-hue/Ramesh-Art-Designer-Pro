/**
 * Manufacturing Production Engine — Core Types
 *
 * Types for auto-nesting, part management, material estimation,
 * multi-sheet support, cut order, toolpath mapping, and reports.
 */

import type { BaseObjectData } from "./objects";

// ── Sheet / Material Types ───────────────────────────────────────

export interface SheetSize {
  width: number;   // mm
  height: number;  // mm
  label: string;
}

export const STANDARD_SHEETS: SheetSize[] = [
  { width: 1220, height: 915,  label: "4×3 ft"   },
  { width: 2440, height: 1220, label: "8×4 ft"   },
  { width: 2440, height: 1830, label: "8×6 ft"   },
  { width: 3000, height: 1500, label: "Custom"   },
];

// ── Nesting Config ───────────────────────────────────────────────

export interface NestingConfig {
  sheetWidth: number;
  sheetHeight: number;
  gap: number;           // mm between parts
  margin: number;        // mm from sheet edge
  allowRotation: boolean;
  allowMirror: boolean;
  packingAlgorithm: "shelf" | "guillotine" | "maxrects";
  sortBy: "area" | "width" | "height" | "perimeter";
  efficiencyTarget: number; // 0-1
}

export const DEFAULT_NESTING_CONFIG: NestingConfig = {
  sheetWidth: 1220,
  sheetHeight: 915,
  gap: 3,
  margin: 10,
  allowRotation: true,
  allowMirror: false,
  packingAlgorithm: "maxrects",
  sortBy: "area",
  efficiencyTarget: 0.85,
};

// ── Part Data ────────────────────────────────────────────────────

export interface PartData {
  objectId: number;
  partNumber: string;
  name: string;
  width: number;        // mm (scaled from pixels)
  height: number;       // mm
  area: number;         // mm²
  perimeter: number;    // mm
  cutLength: number;    // mm
  material: string;
  thickness: number;    // mm
  quantity: number;
  weight: number;       // g
  estimatedTime: number; // seconds
  color: string;        // fill color — maps to toolpath
  locked: boolean;
}

// ── Nested Placement ─────────────────────────────────────────────

export interface NestedPlacement {
  partNumber: string;
  objectId: number;
  x: number;            // sheet-local mm
  y: number;
  width: number;
  height: number;
  rotation: number;     // degrees
  mirror: boolean;
  sheetIndex: number;
}

// ── Sheet ────────────────────────────────────────────────────────

export interface Sheet {
  index: number;
  label: string;
  width: number;
  height: number;
  placements: NestedPlacement[];
  usedArea: number;
  wasteArea: number;
  efficiency: number;
  materialCost: number;
  machineTime: number;  // minutes
}

// ── Material Estimator ───────────────────────────────────────────

export interface MaterialEstimate {
  totalParts: number;
  totalArea: number;         // mm²
  totalCutLength: number;    // mm
  sheetCount: number;
  usedArea: number;
  wasteArea: number;
  wastePercent: number;
  materialCost: number;      // currency
  machineTime: number;       // minutes
  laborTime: number;         // minutes
  productionCost: number;
  costPerPart: number;
}

// ── Cut Order ────────────────────────────────────────────────────

export type CutAction = "cut" | "score" | "engrave" | "mark" | "drill";

export interface CutInstruction {
  partNumber: string;
  action: CutAction;
  priority: number;       // 1 = first
  path: string;           // SVG path data
  length: number;         // mm
  estimatedTime: number;  // seconds
  power: number;          // 0-100%
  speed: number;          // mm/s
  passes: number;
}

export interface CutOrderPlan {
  instructions: CutInstruction[];
  totalTime: number;
  travelDistance: number;
  actionGroups: { action: CutAction; totalLength: number }[];
}

// ── Color → Toolpath Mapping ─────────────────────────────────────

export interface ToolpathMapping {
  color: string;
  action: CutAction;
  power: number;
  speed: number;
  passes: number;
  label: string;
  layerName: string;
}

export const DEFAULT_TOOLPATH_MAP: ToolpathMapping[] = [
  { color: "#ff0000", action: "cut",    power: 100, speed: 20,  passes: 1, label: "Cut Outer",     layerName: "Cut" },
  { color: "#0000ff", action: "cut",    power: 80,  speed: 25,  passes: 1, label: "Cut Inner",     layerName: "Cut" },
  { color: "#00ff00", action: "score",  power: 40,  speed: 50,  passes: 1, label: "Score",         layerName: "Score" },
  { color: "#000000", action: "engrave",power: 30,  speed: 200, passes: 1, label: "Engrave",       layerName: "Engrave" },
  { color: "#ff00ff", action: "mark",   power: 20,  speed: 100, passes: 1, label: "Mark",          layerName: "Mark" },
  { color: "#ffff00", action: "drill",  power: 100, speed: 10,  passes: 1, label: "Drill/Dot",     layerName: "Drill" },
];

// ── Report Types ─────────────────────────────────────────────────

export interface ReportSection {
  title: string;
  lines: string[];
}

export interface Report {
  title: string;
  date: string;
  sections: ReportSection[];
  summary: { label: string; value: string }[];
}

// ── Manufacturing State ──────────────────────────────────────────

export interface ManufacturingState {
  sheets: Sheet[];
  parts: PartData[];
  nestingConfig: NestingConfig;
  toolpathMappings: ToolpathMapping[];
  estimates: MaterialEstimate | null;
  cutPlan: CutOrderPlan | null;
  selectedSheetIndex: number;
  scaleFactor: number;  // pixels → mm conversion
}
