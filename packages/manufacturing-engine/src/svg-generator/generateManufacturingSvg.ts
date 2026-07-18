import { requireMaterialProfile } from "../material-profiles/materialProfiles";
import type { CutPath, Point } from "../shared/geometry";

export interface EngraveText {
  x: number;
  y: number;
  text: string;
  fontSizeMm?: number;
}

export interface ManufacturingSvgInput {
  widthMm: number;
  heightMm: number;
  cutPaths: CutPath[];
  engraveTexts?: EngraveText[];
  materialProfileId: string;
}

const CUT_STROKE_COLOR = "#FF0000"; // LightBurn convention: red = cut
const ENGRAVE_FILL_COLOR = "#0000FF"; // LightBurn convention: blue = engrave/fill

function pointsToAttr(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
}

function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Renders cut paths and engrave text as machine-ready SVG: cut paths use
 * a hairline red stroke, engrave text uses a solid blue fill — the
 * stroke/fill color convention LightBurn (and most laser software) uses
 * to auto-assign cut vs. engrave operations on import.
 *
 * Note on kerf: this generator does NOT offset path geometry by the
 * material's kerf (that requires polygon offsetting / Minkowski-sum math,
 * out of scope for this pass). The resolved kerf value is embedded as an
 * SVG comment for traceability; true kerf-compensated outlines are a
 * documented follow-up, not silently skipped.
 */
export function generateManufacturingSvg(input: ManufacturingSvgInput): string {
  if (input.widthMm <= 0 || input.heightMm <= 0) {
    throw new Error("Sheet width and height must be positive.");
  }
  if (input.cutPaths.length === 0) {
    throw new Error("At least one cut path is required.");
  }

  const material = requireMaterialProfile(input.materialProfileId);

  const cutElements = input.cutPaths.map((path) => {
    const tag = path.closed === false ? "polyline" : "polygon";
    return `<${tag} points="${pointsToAttr(path.points)}" fill="none" stroke="${CUT_STROKE_COLOR}" stroke-width="0.01" />`;
  });

  const engraveElements = (input.engraveTexts ?? []).map(
    (t) =>
      `<text x="${t.x}" y="${t.y}" font-size="${t.fontSizeMm ?? 10}" fill="${ENGRAVE_FILL_COLOR}" text-anchor="middle" dominant-baseline="middle">${escapeSvgText(t.text)}</text>`,
  );

  const metadata = `<!-- material: ${material.name} (${material.thicknessMm}mm), kerf: ${material.kerfMm}mm -- kerf compensation not applied to path geometry, see generateManufacturingSvg doc comment -->`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${input.widthMm}mm" height="${input.heightMm}mm" viewBox="0 0 ${input.widthMm} ${input.heightMm}">`,
    metadata,
    ...cutElements,
    ...engraveElements,
    `</svg>`,
  ].join("\n");
}
