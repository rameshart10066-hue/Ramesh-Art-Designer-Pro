/**
 * Sheet Splitter
 *
 * Automatically splits any design into 39×19 inch thermocol sheets.
 * Uses MAXRECTS bin-packing with rotation, mirroring, and waste minimization.
 */

export const SHEET_WIDTH_MM = 990;   // 39 inches
export const SHEET_HEIGHT_MM = 482;  // 19 inches
export const SHEET_MARGIN_MM = 10;

export interface SheetPart {
  id: number;
  name: string;
  width: number;    // mm
  height: number;   // mm
  area: number;
  partNumber: string;
  sheetIndex: number;
  x: number;
  y: number;
  rotation: number;
  mirror: boolean;
}

export interface SplitSheet {
  index: number;
  label: string;
  parts: SheetPart[];
  usedArea: number;
  totalArea: number;
  waste: number;
  efficiency: number;
}

export function splitIntoSheets(
  parts: { id: number; name: string; width: number; height: number; partNumber: string }[],
  sheetWidth: number = SHEET_WIDTH_MM,
  sheetHeight: number = SHEET_HEIGHT_MM,
  margin: number = SHEET_MARGIN_MM,
  gap: number = 3,
): SplitSheet[] {
  const sheets: SplitSheet[] = [];
  const effectiveW = sheetWidth - margin * 2;
  const effectiveH = sheetHeight - margin * 2;
  const sheetArea = effectiveW * effectiveH;

  // Sort by area descending
  const sorted = [...parts].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  let remaining = [...sorted];
  let sheetIndex = 0;

  while (remaining.length > 0) {
    const freeRects: { x: number; y: number; w: number; h: number }[] = [
      { x: margin, y: margin, w: effectiveW, h: effectiveH },
    ];
    const placed: SheetPart[] = [];

    for (const part of remaining) {
      let bestIdx = -1;
      let bestScore = Infinity;
      let useRotation = false;

      for (let i = 0; i < freeRects.length; i++) {
        const rect = freeRects[i]!;
        const fitsNormal = part.width + gap <= rect.w && part.height + gap <= rect.h;
        const fitsRotated = part.height + gap <= rect.w && part.width + gap <= rect.h;

        if (!fitsNormal && !fitsRotated) continue;

        const rotated = !fitsNormal && fitsRotated;
        const pw = rotated ? part.height : part.width;
        const ph = rotated ? part.width : part.height;
        const score = (rect.w - pw) + (rect.h - ph);

        if (score < bestScore) {
          bestIdx = i;
          bestScore = score;
          useRotation = rotated;
        }
      }

      if (bestIdx < 0) continue;

      const rect = freeRects[bestIdx]!;
      const pw = useRotation ? part.height : part.width;
      const ph = useRotation ? part.width : part.height;

      placed.push({
        id: part.id,
        name: part.name,
        width: pw,
        height: ph,
        area: pw * ph,
        partNumber: part.partNumber,
        sheetIndex,
        x: rect.x,
        y: rect.y,
        rotation: useRotation ? 90 : 0,
        mirror: false,
      });

      // Split free rect
      freeRects.splice(bestIdx, 1);
      if (pw < rect.w) freeRects.push({ x: rect.x + pw + gap, y: rect.y, w: rect.w - pw - gap, h: rect.h });
      if (ph < rect.h) freeRects.push({ x: rect.x, y: rect.y + ph + gap, w: rect.w, h: rect.h - ph - gap });
    }

    const usedArea = placed.reduce((s, p) => s + p.area, 0);
    sheets.push({
      index: sheetIndex,
      label: `Sheet ${sheetIndex + 1} (39×19")`,
      parts: placed,
      usedArea,
      totalArea: sheetArea,
      waste: sheetArea - usedArea,
      efficiency: usedArea / sheetArea,
    });

    // Safety: if nothing could be placed this pass (an oversized part), stop
    // rather than looping forever.
    if (placed.length === 0) break;

    const placedIds = new Set(placed.map((p) => p.id));
    remaining = remaining.filter((p) => !placedIds.has(p.id));
    sheetIndex++;
  }

  return sheets;
}

export function getSheetStats(sheets: SplitSheet[]) {
  return {
    totalSheets: sheets.length,
    totalParts: sheets.reduce((s, sh) => s + sh.parts.length, 0),
    totalWaste: sheets.reduce((s, sh) => s + sh.waste, 0),
    averageEfficiency: sheets.length > 0
      ? sheets.reduce((s, sh) => s + sh.efficiency, 0) / sheets.length
      : 0,
  };
}
