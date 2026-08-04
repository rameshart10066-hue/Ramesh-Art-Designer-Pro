/**
 * Manufacturing Automation — Sprint 10.5
 *
 * One-shot generation of the full manufacturing package from the reconstructed
 * editable canvas objects (Sprint 10.4):
 *
 *   39×19" sheet split · puzzle joints · registration marks · glue tabs ·
 *   part numbers · assembly guide · BOM · cost · DXF · SVG · cut-ready project
 *
 * Reuses the existing manufacturing engine (SheetSplitter, PuzzleJointGenerator,
 * RegistrationMarks, GlueTabGenerator, PartNumbering, AssemblyGuide, BOMGenerator,
 * CostEstimator, exportManager) behind a single entry point.
 *
 * Pure functions — no DOM, Node-testable.
 */

import type { BaseObjectData } from "@/types/objects";
import type { Sheet, NestedPlacement, CutOrderPlan } from "@/types/manufacturing";
import { DEFAULT_TOOLPATH_MAP } from "@/types/manufacturing";
import { splitIntoSheets, type SplitSheet } from "./SheetSplitter";
import { generateJoints, type Joint } from "./PuzzleJointGenerator";
import {
  generateRegistrationMarks,
  type RegistrationMark,
  type RegistrationConfig,
} from "./RegistrationMarks";
import { generateGlueTabs, type GlueTab, type GlueTabConfig } from "./GlueTabGenerator";
import { renumberByPosition, getPartNumber } from "./PartNumbering";
import { generateAssemblyGuide, type AssemblyGuide } from "./AssemblyGuide";
import { generateBOM, type BOM } from "./BOMGenerator";
import { calculateCost, type CostBreakdown } from "./CostEstimator";
import { generateParts } from "@/services/manufacturing/partManager";
import { exportSheetsSVG, exportSheetsDXF, exportCutReadySVG } from "@/services/manufacturing/exportManager";

// ── Configuration ────────────────────────────────────────────────

export interface ManufacturingAutomationOptions {
  material?: string;
  /** mm. Default 25 (thermocol). */
  thickness?: number;
  /** Canvas units → mm. Default 1 (the design canvas works in mm). */
  pixelsToMm?: number;
  /** 39 inches in mm. */
  sheetWidth?: number;
  /** 19 inches in mm. */
  sheetHeight?: number;
  sheetMargin?: number;
  sheetGap?: number;
  glueTabConfig?: GlueTabConfig;
  registrationConfig?: RegistrationConfig;
}

// ── Outputs ──────────────────────────────────────────────────────

export interface CutPart {
  id: number;
  name: string;
  partNumber: string;
  width: number;
  height: number;
  area: number;
  cutLength: number;
  material: string;
  thickness: number;
  color: string;
  /** Design-layout position (mm) — used for joint generation. */
  x: number;
  y: number;
  parentId: number | null;
}

export interface ManufacturingBundle {
  parts: CutPart[];
  sheets: SplitSheet[];
  joints: Joint[];
  registrationMarks: RegistrationMark[];
  glueTabs: GlueTab[];
  partNumbers: Record<number, string>;
  assemblyGuide: AssemblyGuide;
  bom: BOM;
  cost: CostBreakdown;
  /** Per-sheet DXF files. */
  dxf: string[];
  /** Per-sheet SVG files. */
  svg: string[];
  /** Per-sheet cut-ready SVGs (color-coded layers). */
  cutReady: string[];
  summary: ManufacturingSummary;
}

export interface ManufacturingSummary {
  totalParts: number;
  totalSheets: number;
  totalJoints: number;
  totalArea: number;
  wastePercent: number;
  totalCost: number;
  machineTimeMinutes: number;
  material: string;
  thickness: number;
  sheetSize: string;
}

// ── Public API ───────────────────────────────────────────────────

export function autoGenerateManufacturing(
  objects: BaseObjectData[],
  options: ManufacturingAutomationOptions = {},
): ManufacturingBundle {
  const material = options.material ?? "Thermocol";
  const thickness = options.thickness ?? 25;
  const px2mm = options.pixelsToMm ?? 1;
  const sheetWidth = options.sheetWidth ?? 990; // 39"
  const sheetHeight = options.sheetHeight ?? 482; // 19"
  const margin = options.sheetMargin ?? 10;
  const gap = options.sheetGap ?? 3;
  const glueTabConfig = options.glueTabConfig;
  const registrationConfig = options.registrationConfig;

  // 1. Visible, unlocked objects → parts (mm), sliced so each fits a sheet.
  const source = generateParts(objects, px2mm, material, thickness);
  const rawParts: CutPart[] = objects
    .filter((o) => o.visible && !o.locked)
    .map((obj, i) => {
      const pd = source[i]!;
      return {
        id: obj.id,
        name: obj.name,
        partNumber: pd.partNumber,
        width: pd.width,
        height: pd.height,
        area: pd.area,
        cutLength: pd.cutLength,
        material,
        thickness,
        color: pd.color,
        x: obj.x * px2mm,
        y: obj.y * px2mm,
        parentId: obj.parentId ?? null,
      };
    });

  const parts = sliceToFit(rawParts, sheetWidth - 2 * margin - gap, sheetHeight - 2 * margin - gap);

  // 2. Part numbers (P001, P002…) ordered by layout position.
  renumberByPosition(parts, "P");
  const partNumbers: Record<number, string> = {};
  for (const p of parts) {
    p.partNumber = getPartNumber(p.id) ?? p.partNumber;
    partNumbers[p.id] = p.partNumber;
  }

  // 3. 39×19" sheet split.
  const sheets = splitIntoSheets(parts, sheetWidth, sheetHeight, margin, gap);

  // 4. Puzzle joints between adjacent parts in the assembled layout.
  const joints = generateJoints(parts);

  // 5. Registration marks + glue tabs per part.
  const registrationMarks: RegistrationMark[] = [];
  const glueTabs: GlueTab[] = [];
  for (const p of parts) {
    registrationMarks.push(...generateRegistrationMarks(p.id, p.partNumber, p.width, p.height, p.name, registrationConfig));
    glueTabs.push(...generateGlueTabs(p.id, p.width, p.height, glueTabConfig));
  }

  // 6. Assembly guide + BOM.
  const assemblyGuide = generateAssemblyGuide(parts, joints);
  const bom = generateBOM(
    parts.map((p) => ({
      partNumber: p.partNumber,
      name: p.name,
      material: p.material,
      thickness: p.thickness,
      width: p.width,
      height: p.height,
      quantity: 1,
    })),
    sheets,
    joints,
  );

  // 7. Cost.
  const totalArea = parts.reduce((s, p) => s + p.area, 0);
  const totalCutLength = parts.reduce((s, p) => s + p.cutLength, 0);
  const glueMl = Math.max(20, joints.length * 2);
  const machineTimeMinutes = parts.reduce((s, p) => s + p.cutLength, 0) / (20 * 60);
  const cost = calculateCost(totalArea, totalCutLength, glueMl, machineTimeMinutes);

  // 8. Exports: SVG, DXF, cut-ready (color-coded) per sheet.
  const exportSheets = toExportSheets(sheets, sheetWidth, sheetHeight);
  const svg = exportSheetsSVG(exportSheets);
  const dxf = exportSheetsDXF(exportSheets);
  const cutPlan = buildCutPlan(exportSheets);
  const cutReady = exportCutReadySVG(exportSheets, cutPlan, DEFAULT_TOOLPATH_MAP);

  // 9. Summary.
  const wastePercent = sheets.length > 0
    ? Math.round(sheets.reduce((s, sh) => s + sh.waste, 0) / Math.max(1, sheets.reduce((s, sh) => s + sh.totalArea, 0)) * 100)
    : 0;

  return {
    parts,
    sheets,
    joints,
    registrationMarks,
    glueTabs,
    partNumbers,
    assemblyGuide,
    bom,
    cost,
    dxf,
    svg,
    cutReady,
    summary: {
      totalParts: parts.length,
      totalSheets: sheets.length,
      totalJoints: joints.length,
      totalArea: Math.round(totalArea),
      wastePercent,
      totalCost: cost.total,
      machineTimeMinutes: Math.round(machineTimeMinutes * 10) / 10,
      material,
      thickness,
      sheetSize: `${sheetWidth}×${sheetHeight} mm (39×19")`,
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Slice parts that are too large for a sheet into a grid of fitting pieces so
 * the bin-packer always terminates. Each slice keeps the parent reference and
 * gets a positional suffix (e.g. "Frame A1").
 */
function sliceToFit(parts: CutPart[], maxW: number, maxH: number): CutPart[] {
  const out: CutPart[] = [];
  for (const part of parts) {
    const cols = Math.max(1, Math.ceil(part.width / maxW));
    const rows = Math.max(1, Math.ceil(part.height / maxH));
    if (cols === 1 && rows === 1) {
      out.push(part);
      continue;
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pw = Math.min(maxW, part.width - c * maxW);
        const ph = Math.min(maxH, part.height - r * maxH);
        out.push({
          ...part,
          id: part.id * 1000 + r * 100 + c,
          name: `${part.name} ${String.fromCharCode(65 + r)}${c + 1}`,
          width: pw,
          height: ph,
          area: pw * ph,
          cutLength: 2 * (pw + ph),
          x: part.x + c * maxW,
          y: part.y + r * maxH,
        });
      }
    }
  }
  return out;
}

/** Convert the splitter's sheets into the export manager's `Sheet` shape. */
function toExportSheets(sheets: SplitSheet[], sheetWidth: number, sheetHeight: number): Sheet[] {
  return sheets.map((ss) => ({
    index: ss.index,
    label: ss.label,
    width: sheetWidth,
    height: sheetHeight,
    placements: ss.parts.map(
      (p): NestedPlacement => ({
        partNumber: p.partNumber,
        objectId: p.id,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        rotation: p.rotation,
        mirror: p.mirror,
        sheetIndex: ss.index,
      }),
    ),
    usedArea: ss.usedArea,
    wasteArea: ss.waste,
    efficiency: ss.efficiency,
    materialCost: 0,
    machineTime: 0,
  }));
}

/** Minimal cut order: one bounding-rect cut per placement. */
function buildCutPlan(sheets: Sheet[]): CutOrderPlan {
  const instructions = sheets.flatMap((s) =>
    s.placements.map((p) => ({
      partNumber: p.partNumber,
      action: "cut" as const,
      priority: 1,
      path: `M${p.x},${p.y} L${p.x + p.width},${p.y} L${p.x + p.width},${p.y + p.height} L${p.x},${p.y + p.height} Z`,
      length: 2 * (p.width + p.height),
      estimatedTime: (2 * (p.width + p.height)) / 20,
      power: 100,
      speed: 20,
      passes: 1,
    })),
  );
  return {
    instructions,
    totalTime: instructions.reduce((s, i) => s + i.estimatedTime, 0),
    travelDistance: 0,
    actionGroups: [{ action: "cut", totalLength: instructions.reduce((s, i) => s + i.length, 0) }],
  };
}
