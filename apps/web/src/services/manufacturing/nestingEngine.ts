/**
 * Auto-Nesting Engine
 *
 * Box-packing algorithm (MAXRECTS variant) to arrange parts
 * onto sheets with configurable rotation, margins, and gap.
 */

import type { NestingConfig, PartData, NestedPlacement, Sheet, MaterialEstimate } from "@/types/manufacturing";

interface Rect { x: number; y: number; w: number; h: number; placed: boolean; }

/** Run nesting for a set of parts, returning populated sheets */
export function runNesting(
  parts: PartData[],
  config: NestingConfig,
): { sheets: Sheet[]; estimate: MaterialEstimate } {
  const { sheetWidth, sheetHeight, gap, margin, allowRotation, sortBy } = config;
  const effectiveW = sheetWidth - margin * 2;
  const effectiveH = sheetHeight - margin * 2;

  // Sort parts
  const sorted = [...parts].sort((a, b) => {
    if (sortBy === "area") return (b.width * b.height) - (a.width * a.height);
    if (sortBy === "width") return b.width - a.width;
    if (sortBy === "height") return b.height - a.height;
    if (sortBy === "perimeter") return (b.width + b.height) - (a.width + a.height);
    return 0;
  });

  const sheets: Sheet[] = [];
  let sheetIndex = 0;
  let remaining: PartData[] = [...sorted];

  while (remaining.length > 0) {
    const placements = packSheet(remaining, effectiveW, effectiveH, gap, allowRotation);
    if (placements.length === 0) break;

    const usedArea = placements.reduce((sum, p) => sum + p.width * p.height, 0);
    const sheetArea = effectiveW * effectiveH;
    const efficiency = usedArea / sheetArea;

    sheets.push({
      index: sheetIndex,
      label: `Sheet ${sheetIndex + 1}`,
      width: sheetWidth,
      height: sheetHeight,
      placements,
      usedArea,
      wasteArea: sheetArea - usedArea,
      efficiency,
      materialCost: estimateSheetCost(sheetWidth, sheetHeight),
      machineTime: estimateMachineTime(placements),
    });

    // Remove placed parts from remaining
    const placedIds = new Set(placements.map((p) => p.objectId));
    remaining = remaining.filter((p) => !placedIds.has(p.objectId));
    sheetIndex++;
  }

  const totalArea = parts.reduce((s, p) => s + p.width * p.height, 0);
  const totalSheetArea = sheets.length * effectiveW * effectiveH;
  const totalCutLength = parts.reduce((s, p) => s + p.cutLength, 0);

  return {
    sheets,
    estimate: {
      totalParts: parts.length,
      totalArea,
      totalCutLength,
      sheetCount: sheets.length,
      usedArea: totalArea,
      wasteArea: totalSheetArea - totalArea,
      wastePercent: totalSheetArea > 0 ? (totalSheetArea - totalArea) / totalSheetArea * 100 : 0,
      materialCost: sheets.reduce((s, sh) => s + sh.materialCost, 0),
      machineTime: sheets.reduce((s, sh) => s + sh.machineTime, 0),
      laborTime: sheets.reduce((s, sh) => s + sh.machineTime * 0.3, 0),
      productionCost: 0,
      costPerPart: 0,
    },
  };
}

/** Pack parts into a single sheet using MAXRECTS algorithm */
function packSheet(
  parts: PartData[],
  sheetW: number,
  sheetH: number,
  gap: number,
  allowRotation: boolean,
): NestedPlacement[] {
  const freeRects: Rect[] = [
    { x: 0, y: 0, w: sheetW, h: sheetH, placed: false },
  ];
  const placements: NestedPlacement[] = [];

  for (const part of parts) {
    let bestRect: Rect | null = null;
    let bestScore = Infinity;
    let useRotation = false;

    for (const free of freeRects) {
      if (free.placed) continue;
      const fits = (
        (part.width + gap <= free.w && part.height + gap <= free.h) ||
        (allowRotation && part.height + gap <= free.w && part.width + gap <= free.h)
      );
      if (!fits) continue;

      const rotated = allowRotation && part.height + gap <= free.w && part.width + gap <= free.h;
      const pw = rotated ? part.height : part.width;
      const ph = rotated ? part.width : part.height;
      const score = (free.w - pw) + (free.h - ph);

      if (score < bestScore) {
        bestRect = free;
        bestScore = score;
        useRotation = rotated;
      }
    }

    if (!bestRect) continue;

    const pw = useRotation ? part.height : part.width;
    const ph = useRotation ? part.width : part.height;

    placements.push({
      partNumber: part.partNumber,
      objectId: part.objectId,
      x: bestRect.x,
      y: bestRect.y,
      width: pw,
      height: ph,
      rotation: useRotation ? 90 : 0,
      mirror: false,
      sheetIndex: 0,
    });

    // Split free rectangle
    const remaining: Rect[] = [];
    for (const r of freeRects) {
      if (r === bestRect) continue;
      remaining.push(r);
    }

    if (pw < bestRect.w) {
      remaining.push({ x: bestRect.x + pw + gap, y: bestRect.y, w: bestRect.w - pw - gap, h: bestRect.h, placed: false });
    }
    if (ph < bestRect.h) {
      remaining.push({ x: bestRect.x, y: bestRect.y + ph + gap, w: bestRect.w, h: bestRect.h - ph - gap, placed: false });
    }

    freeRects.length = 0;
    freeRects.push(...remaining);
  }

  return placements;
}

function estimateSheetCost(w: number, h: number): number {
  const area = w * h / 1_000_000; // m²
  const costPerSqM = 450; // ₹ per m² for thermocol
  return Math.round(area * costPerSqM);
}

function estimateMachineTime(placements: NestedPlacement[]): number {
  const totalCut = placements.reduce((s, p) => s + p.width + p.height, 0);
  return Math.round(totalCut / 100 * 1.5); // rough estimate in minutes
}
