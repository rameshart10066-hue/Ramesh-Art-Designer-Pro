import { wrapSvgDocument } from "../shared/svg";
import { nestRectangles, type NestingShape, type NestingSheet } from "./nestRectangles";

export interface NestingParams {
  shapes: NestingShape[];
  sheet: NestingSheet;
  spacingMm?: number;
}

const DEFAULT_SPACING_MM = 5;
const SHEET_GAP_MM = 20;

/**
 * Renders the result of nestRectangles as SVG: each sheet drawn as a
 * bordered rectangle, stacked vertically, with every placed shape drawn
 * as a rect inside it. Multi-sheet layouts are all included in one SVG
 * document (one <g> per sheet) rather than returning separate files.
 */
export function generateNestingSvg(params: NestingParams): string {
  if (params.shapes.length === 0) {
    throw new Error("At least one shape is required for nesting.");
  }

  const spacing = params.spacingMm ?? DEFAULT_SPACING_MM;
  const { placements, sheetsUsed } = nestRectangles(params.shapes, params.sheet, spacing);

  const groups: string[] = [];
  for (let sheetIndex = 0; sheetIndex < sheetsUsed; sheetIndex++) {
    const sheetY = sheetIndex * (params.sheet.heightMm + SHEET_GAP_MM);
    const sheetOutline = `<rect x="0" y="${sheetY}" width="${params.sheet.widthMm}" height="${params.sheet.heightMm}" fill="none" stroke="#999" stroke-width="0.2" stroke-dasharray="2,2" />`;

    const shapeRects = placements
      .filter((p) => p.sheetIndex === sheetIndex)
      .map(
        (p) =>
          `<rect x="${p.x}" y="${sheetY + p.y}" width="${p.widthMm}" height="${p.heightMm}" fill="none" stroke="black" stroke-width="0.1" />`,
      )
      .join("\n");

    groups.push(`${sheetOutline}\n${shapeRects}`);
  }

  const totalHeight = sheetsUsed * params.sheet.heightMm + (sheetsUsed - 1) * SHEET_GAP_MM;
  return wrapSvgDocument(params.sheet.widthMm, totalHeight, groups.join("\n"));
}
