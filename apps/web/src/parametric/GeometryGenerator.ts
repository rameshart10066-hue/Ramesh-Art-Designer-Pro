/**
 * Geometry Generator
 *
 * Takes component type + parameters and produces drawable geometry.
 * Each component type has its own generator function.
 * Output: { x, y, width, height, rotation, fill, stroke, metadata }
 */

import type { ParamValues } from "./Parameter";

export interface GeneratedGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
  cornerRadius?: number;
  metadata: Record<string, any>;
}

type GeneratorFn = (params: ParamValues) => GeneratedGeometry;

const generators = new Map<string, GeneratorFn>();

/** Register a geometry generator for a component type */
export function registerGenerator(type: string, fn: GeneratorFn): void {
  generators.set(type, fn);
}

/** Generate geometry for a component type */
export function generateGeometry(type: string, params: ParamValues): GeneratedGeometry {
  const fn = generators.get(type);
  if (fn) return fn(params);

  // Default fallback: rect from params
  return {
    x: params.x ?? 100,
    y: params.y ?? 100,
    width: params.width ?? 150,
    height: params.height ?? 100,
    rotation: params.rotation ?? 0,
    fill: params.fill ?? "#3b82f6",
    stroke: params.stroke ?? "#1e40af",
    strokeWidth: params.strokeWidth ?? 2,
    opacity: params.opacity ?? 1,
    scaleX: params.scaleX ?? 1,
    scaleY: params.scaleY ?? 1,
    flipX: params.flipX ?? false,
    flipY: params.flipY ?? false,
    cornerRadius: params.cornerRadius,
    metadata: params.metadata ?? {},
  };
}

// ── Built-in Generators ──────────────────────────────────────────

registerGenerator("rectangle", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 150, height: p.height ?? 100,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#3b82f6", stroke: p.stroke ?? "#1e40af",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false, cornerRadius: p.cornerRadius,
  metadata: { points: p.points, innerRadius: p.innerRadius },
}));

registerGenerator("circle", (p) => {
  const size = Math.min(p.width ?? 100, p.height ?? 100);
  return {
    x: p.x ?? 100, y: p.y ?? 100, width: size, height: size,
    rotation: p.rotation ?? 0, fill: p.fill ?? "#3b82f6", stroke: p.stroke ?? "#1e40af",
    strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
    flipX: false, flipY: false, metadata: {},
  };
});

registerGenerator("star", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 120, height: p.height ?? 120,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#f1c40f", stroke: p.stroke ?? "#f39c12",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { points: p.points ?? 5, innerRadius: p.innerRadius ?? 0.5 },
}));

registerGenerator("mandap", (p) => {
  const w = p.width ?? 600;
  const h = p.height ?? 500;
  return {
    x: p.x ?? 200, y: p.y ?? 150, width: w, height: h,
    rotation: p.rotation ?? 0, fill: p.fill ?? "#c4956a", stroke: p.stroke ?? "#8b7355",
    strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
    flipX: false, flipY: false,
    metadata: {
      pillars: p.pillars ?? 2, pillarWidth: p.pillarWidth ?? 0.1,
      archType: p.archType ?? "pointed", domeHeight: p.domeHeight ?? 0.4,
      baseHeight: p.baseHeight ?? 0.15, roofStyle: p.roofStyle ?? "pointed",
      ornamentDensity: p.ornamentDensity ?? 0.5, hasFinial: p.hasFinial ?? true,
    },
  };
});

registerGenerator("lotus", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 200, height: p.height ?? 200,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#f5c6ec", stroke: p.stroke ?? "#e091c8",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { petals: p.petals ?? 8, layers: p.layers ?? 2, innerRadiusRatio: p.innerRadiusRatio ?? 0.6, petalShape: p.petalShape ?? 0.5 },
}));

registerGenerator("peacock", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 300, height: p.height ?? 350,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#1a5276", stroke: p.stroke ?? "#154360",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { featherCount: p.featherCount ?? 12, tailAngle: p.tailAngle ?? 120, bodySize: p.bodySize ?? 0.4, eyeSize: p.eyeSize ?? 0.3 },
}));

registerGenerator("kalash", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 150, height: p.height ?? 200,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#d4a017", stroke: p.stroke ?? "#8b6914",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { neckHeight: p.neckHeight ?? 0.25, neckWidth: p.neckWidth ?? 0.35, baseWidth: p.baseWidth ?? 0.8, hasMangoLeaves: p.hasMangoLeaves ?? true, leafCount: p.leafCount ?? 3 },
}));

registerGenerator("bell", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 100, height: p.height ?? 150,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#d4a017", stroke: p.stroke ?? "#8b6914",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { bellWidth: p.bellWidth ?? 0.7, clapperSize: p.clapperSize ?? 0.15, hasRing: p.hasRing ?? true },
}));

registerGenerator("prabhavali", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 350, height: p.height ?? 400,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#f39c12", stroke: p.stroke ?? "#e67e22",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { rayCount: p.rayCount ?? 24, rayLength: p.rayLength ?? 0.3, innerRadius: p.innerRadius ?? 0.4, hasGlow: p.hasGlow ?? true },
}));

registerGenerator("swastik", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 120, height: p.height ?? 120,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#d4a017", stroke: p.stroke ?? "#8b6914",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { armWidth: p.armWidth ?? 0.2, armLength: p.armLength ?? 0.6 },
}));

registerGenerator("pillar", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 80, height: p.height ?? 400,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#c4956a", stroke: p.stroke ?? "#8b7355",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { sections: p.sections ?? 3, hasBase: p.hasBase ?? true, hasCapital: p.hasCapital ?? true, fluted: p.fluted ?? false, fluteCount: p.fluteCount ?? 8 },
}));

registerGenerator("arch", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 400, height: p.height ?? 300,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#c4956a", stroke: p.stroke ?? "#8b7355",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { archType: p.archType ?? "rounded", depth: p.depth ?? 0.3, layers: p.layers ?? 1, hasKeystone: p.hasKeystone ?? true },
}));

registerGenerator("dome", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 300, height: p.height ?? 250,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#d4a017", stroke: p.stroke ?? "#8b6914",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { domeType: p.domeType ?? "rounded", layers: p.layers ?? 1, finialSize: p.finialSize ?? 8 },
}));

registerGenerator("base-platform", (p) => ({
  x: p.x ?? 100, y: p.y ?? 100, width: p.width ?? 500, height: p.height ?? 150,
  rotation: p.rotation ?? 0, fill: p.fill ?? "#8b7355", stroke: p.stroke ?? "#6b5740",
  strokeWidth: p.strokeWidth ?? 2, opacity: p.opacity ?? 1, scaleX: 1, scaleY: 1,
  flipX: false, flipY: false,
  metadata: { tiers: p.tiers ?? 3, tierHeight: p.tierHeight ?? 0.3 },
}));
