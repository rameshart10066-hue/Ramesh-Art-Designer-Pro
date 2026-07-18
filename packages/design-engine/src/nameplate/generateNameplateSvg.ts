import { escapeSvgText, wrapSvgDocument } from "../shared/svg";

export interface NameplateParams {
  text: string;
  /** Plate dimensions in millimeters. */
  widthMm: number;
  heightMm: number;
  /** Corner radius in millimeters; 0 for sharp corners. */
  cornerRadiusMm?: number;
  fontSizeMm?: number;
}

const DEFAULT_CORNER_RADIUS_MM = 4;
const DEFAULT_FONT_SIZE_MM = 10;

/**
 * Generates an engraving-ready nameplate: a rounded-rect outline (the cut
 * path) with centered text (the engrave path). Output is plain SVG only —
 * no DXF, no kerf/machine-specific data. Manufacturing concerns (export
 * format, cut-vs-engrave layer separation for a specific machine) belong
 * in manufacturing-engine, out of scope here.
 */
export function generateNameplateSvg(params: NameplateParams): string {
  if (!params.text.trim()) {
    throw new Error("Nameplate text must not be empty.");
  }
  if (params.widthMm <= 0 || params.heightMm <= 0) {
    throw new Error("Nameplate width and height must be positive.");
  }

  const cornerRadius = params.cornerRadiusMm ?? DEFAULT_CORNER_RADIUS_MM;
  const fontSize = params.fontSizeMm ?? DEFAULT_FONT_SIZE_MM;
  const centerX = params.widthMm / 2;
  const centerY = params.heightMm / 2;

  const outline = `<rect x="0" y="0" width="${params.widthMm}" height="${params.heightMm}" rx="${cornerRadius}" ry="${cornerRadius}" fill="none" stroke="black" stroke-width="0.1" />`;

  const label = `<text x="${centerX}" y="${centerY}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">${escapeSvgText(params.text)}</text>`;

  return wrapSvgDocument(params.widthMm, params.heightMm, `${outline}\n${label}`);
}
