export interface PackingShape {
  id: string;
  widthMm: number;
  heightMm: number;
}

export interface PackingSheet {
  widthMm: number;
  heightMm: number;
}

export interface Placement {
  id: string;
  sheetIndex: number;
  x: number;
  y: number;
  widthMm: number;
  heightMm: number;
}

export interface PackingResult {
  placements: Placement[];
  sheetsUsed: number;
}

/**
 * Shelf (row-based) bin packing: places shapes left-to-right, starting a
 * new row when a shape doesn't fit the remaining width, and a new sheet
 * when a shape doesn't fit any remaining height. Not optimal (true 2D bin
 * packing is NP-hard) but simple, deterministic, and good enough for
 * laying out laser-cut parts on standard sheet stock.
 *
 * See the file-level TODO: this duplicates design-engine's nestRectangles
 * (built on a parallel, not-yet-merged branch) intentionally, pending
 * consolidation at merge time.
 */
export function packRectangles(
  shapes: PackingShape[],
  sheet: PackingSheet,
  spacingMm: number,
): PackingResult {
  if (sheet.widthMm <= 0 || sheet.heightMm <= 0) {
    throw new Error("Sheet width and height must be positive.");
  }
  if (spacingMm < 0) {
    throw new Error("Spacing must not be negative.");
  }

  const oversized = shapes.find((s) => s.widthMm > sheet.widthMm || s.heightMm > sheet.heightMm);
  if (oversized) {
    throw new Error(
      `Shape "${oversized.id}" (${oversized.widthMm}x${oversized.heightMm}mm) does not fit on the sheet (${sheet.widthMm}x${sheet.heightMm}mm).`,
    );
  }

  const placements: Placement[] = [];

  let sheetIndex = 0;
  let cursorX = 0;
  let cursorY = 0;
  let shelfHeight = 0;

  for (const shape of shapes) {
    if (cursorX + shape.widthMm > sheet.widthMm) {
      cursorX = 0;
      cursorY += shelfHeight + spacingMm;
      shelfHeight = 0;
    }

    if (cursorY + shape.heightMm > sheet.heightMm) {
      sheetIndex += 1;
      cursorX = 0;
      cursorY = 0;
      shelfHeight = 0;
    }

    placements.push({
      id: shape.id,
      sheetIndex,
      x: cursorX,
      y: cursorY,
      widthMm: shape.widthMm,
      heightMm: shape.heightMm,
    });

    cursorX += shape.widthMm + spacingMm;
    shelfHeight = Math.max(shelfHeight, shape.heightMm);
  }

  const sheetsUsed =
    placements.length === 0 ? 0 : Math.max(...placements.map((p) => p.sheetIndex)) + 1;

  return { placements, sheetsUsed };
}
