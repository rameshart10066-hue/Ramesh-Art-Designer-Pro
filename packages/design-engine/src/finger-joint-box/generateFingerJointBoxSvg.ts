import { wrapSvgDocument } from "../shared/svg";
import { computeFingerLayout } from "./computeFingerLayout";
import { buildFingerJointPanelOutline, type Point } from "./buildFingerJointPanelOutline";

export interface FingerJointBoxParams {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  materialThicknessMm: number;
  targetFingerWidthMm?: number;
}

const PANEL_SPACING_MM = 10;

function pointsToSvgAttr(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

/**
 * Generates an open-top box: a plain bottom panel plus four finger-jointed
 * wall panels (front, back, left, right), laid out side by side in one
 * SVG sheet. Front/back panels start their side edges protruding (tabs);
 * left/right panels start with a gap on the matching edge, so adjacent
 * walls interlock. Output is cut-path SVG only — no DXF, no kerf
 * compensation or machine profiles (see manufacturing-engine, out of
 * scope here).
 */
export function generateFingerJointBoxSvg(params: FingerJointBoxParams): string {
  const { widthMm, depthMm, heightMm, materialThicknessMm } = params;

  if (widthMm <= 0 || depthMm <= 0 || heightMm <= 0) {
    throw new Error("Box width, depth, and height must all be positive.");
  }
  if (materialThicknessMm <= 0) {
    throw new Error("Material thickness must be positive.");
  }

  const layout = computeFingerLayout(heightMm, params.targetFingerWidthMm);

  const front = buildFingerJointPanelOutline(widthMm, heightMm, materialThicknessMm, layout, true, false);
  const back = buildFingerJointPanelOutline(widthMm, heightMm, materialThicknessMm, layout, true, false);
  const left = buildFingerJointPanelOutline(depthMm, heightMm, materialThicknessMm, layout, false, true);
  const right = buildFingerJointPanelOutline(depthMm, heightMm, materialThicknessMm, layout, false, true);

  const panels: Array<{ points: Point[]; panelWidth: number; panelHeight: number }> = [
    {
      points: [
        { x: 0, y: 0 },
        { x: widthMm, y: 0 },
        { x: widthMm, y: depthMm },
        { x: 0, y: depthMm },
      ],
      panelWidth: widthMm,
      panelHeight: depthMm,
    }, // bottom (plain rect)
    { points: front, panelWidth: widthMm, panelHeight: heightMm },
    { points: back, panelWidth: widthMm, panelHeight: heightMm },
    { points: left, panelWidth: depthMm, panelHeight: heightMm },
    { points: right, panelWidth: depthMm, panelHeight: heightMm },
  ];

  let cursorX = 0;
  const maxHeight = Math.max(depthMm, heightMm);
  const groups: string[] = [];

  for (const panel of panels) {
    const outward = panel.points.some((p) => p.x < 0) ? materialThicknessMm : 0;
    groups.push(
      `<g transform="translate(${cursorX + outward}, 0)"><polygon points="${pointsToSvgAttr(panel.points)}" fill="none" stroke="black" stroke-width="0.1" /></g>`,
    );
    cursorX += panel.panelWidth + outward + PANEL_SPACING_MM;
  }

  const totalWidth = cursorX;
  return wrapSvgDocument(totalWidth, maxHeight, groups.join("\n"));
}
