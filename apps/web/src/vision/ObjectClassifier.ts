/**
 * Object Classifier — Sprint 10.2
 *
 * Maps a region's geometric + spatial features to a semantic component type
 * from the Ganpati-decoration vocabulary: frame, arch, pillar, lotus, bell,
 * peacock, prabhavali, border, stage, om (and background, reported by the
 * detector rather than scored from a region).
 *
 * This is a deterministic, rule-based scorer (no ML / no random): each type
 * defines how well the observed features fit, and the best-fitting type wins.
 * Confidence reflects the winning score; ambiguity is captured by the runner-up.
 *
 * Pure functions — no DOM, Node-testable.
 */

import type { ShapeName } from "./ShapeClassifier";

export type ComponentType =
  | "frame"
  | "arch"
  | "pillar"
  | "lotus"
  | "bell"
  | "peacock"
  | "prabhavali"
  | "border"
  | "stage"
  | "om"
  | "background";

export const COMPONENT_TYPES: readonly ComponentType[] = [
  "frame",
  "arch",
  "pillar",
  "lotus",
  "bell",
  "peacock",
  "prabhavali",
  "border",
  "stage",
  "om",
  "background",
];

export interface ObjectFeatures {
  /** Bounding-box top-left (px). */
  x: number;
  y: number;
  /** Bounding-box size (px). */
  width: number;
  height: number;
  /** Foreground pixel count inside the box. */
  area: number;
  imageWidth: number;
  imageHeight: number;
  /** width / height. */
  aspectRatio: number;
  /** area / (width × height), 0–1. */
  fillRatio: number;
  shape: ShapeName;
  /** "#rrggbb" of the region's dominant color. */
  dominantColor: string;
  /** True when this is the largest foreground region by area. */
  isLargest: boolean;
}

export interface Classification {
  type: ComponentType;
  /** 0–1; higher = stronger fit. */
  confidence: number;
  runnerUp: { type: ComponentType; score: number } | null;
  reasons: string[];
}

// ── Scoring primitives ───────────────────────────────────────────

/** Ramp 0→1 across [lo, hi]. */
function stepUp(v: number, lo: number, hi: number): number {
  if (v <= lo) return 0;
  if (v >= hi) return 1;
  return (v - lo) / (hi - lo);
}

/** Ramp 1→0 across [hi, lo] (i.e. high is bad). */
function stepDown(v: number, hi: number, lo: number): number {
  return stepUp(v, lo, hi) === 0 ? 1 : 1 - stepUp(v, lo, hi);
}

/** Triangle peak: 1 at `center`, 0 beyond `center ± width`. */
function tri(v: number, center: number, width: number): number {
  const d = Math.abs(v - center);
  if (d >= width) return 0;
  return 1 - d / width;
}

/** 1 when near horizontal center, 0 at the edges. */
function centerFit(relX: number): number {
  return clamp(1 - Math.abs(relX - 0.5) * 2, 0, 1);
}

/** 1 when on the left/right third, 0 near the middle. */
function sideFit(relX: number): number {
  if (relX <= 0.35 || relX >= 0.65) return 1;
  if (relX >= 0.45 && relX <= 0.55) return 0;
  return 0.5;
}

const roundShape = (s: ShapeName): number =>
  s === "circle" || s === "ellipse" ? 1 : s === "triangle" ? 0.4 : s === "ring" ? 0.2 : 0;

const complexShape = (s: ShapeName): number =>
  s === "complex" || s === "triangle" ? 1 : s === "ellipse" ? 0.5 : 0;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// ── Per-type scorers ─────────────────────────────────────────────

function scoreFrame(f: ObjectFeatures): number {
  const hollow = stepDown(f.fillRatio, 0.5, 0.25);
  return (
    0.35 * stepUp(f.width / f.imageWidth, 0.55, 0.8) +
    0.35 * stepUp(f.height / f.imageHeight, 0.55, 0.8) +
    0.2 * hollow +
    0.1 * (f.isLargest ? 1 : 0)
  );
}

function scoreBorder(f: ObjectFeatures): number {
  const hollow = stepDown(f.fillRatio, 0.5, 0.25);
  return (
    0.25 * stepUp(f.width / f.imageWidth, 0.35, 0.6) +
    0.25 * stepUp(f.height / f.imageHeight, 0.35, 0.6) +
    0.25 * hollow +
    0.25 * (f.isLargest ? 0 : 1)
  );
}

function scoreArch(f: ObjectFeatures): number {
  const centerX = f.x + f.width / 2;
  const centerY = f.y + f.height / 2;
  const relY = centerY / f.imageHeight;
  const relW = f.width / f.imageWidth;
  return (
    0.4 * stepDown(relY, 0.35, 0.6) +
    0.3 * stepUp(relW, 0.35, 0.6) +
    0.3 * (f.aspectRatio >= 1.2 ? 1 : f.aspectRatio >= 0.9 ? 0.5 : 0.2)
  );
}

function scorePillar(f: ObjectFeatures): number {
  const centerX = f.x + f.width / 2;
  const centerY = f.y + f.height / 2;
  const relX = centerX / f.imageWidth;
  const relH = f.height / f.imageHeight;
  return (
    0.45 * stepDown(f.aspectRatio, 0.45, 0.2) +
    0.35 * sideFit(relX) +
    0.2 * stepUp(relH, 0.25, 0.5)
  );
}

function scoreStage(f: ObjectFeatures): number {
  const centerY = f.y + f.height / 2;
  const relY = centerY / f.imageHeight;
  const relW = f.width / f.imageWidth;
  const relH = f.height / f.imageHeight;
  return (
    0.4 * stepUp(relY, 0.6, 0.8) +
    0.3 * stepUp(relW, 0.4, 0.7) +
    0.3 * stepDown(relH, 0.4, 0.2)
  );
}

function scoreLotus(f: ObjectFeatures): number {
  const centerX = f.x + f.width / 2;
  const relX = centerX / f.imageWidth;
  const relW = f.width / f.imageWidth;
  const solid = stepUp(f.fillRatio, 0.55, 0.8);
  // A lotus is a MID-SIZE round motif. Gate on size so tiny central shapes
  // (which are more likely an "om") don't inherit the round+solid base score.
  const sizeFit = stepUp(relW, 0.08, 0.15) * tri(relW, 0.22, 0.15);
  return (
    0.5 * (roundShape(f.shape) * sizeFit) +
    0.2 * solid +
    0.15 * centerFit(relX) +
    0.15 * tri(relW, 0.22, 0.15)
  );
}

function scoreBell(f: ObjectFeatures): number {
  const centerX = f.x + f.width / 2;
  const centerY = f.y + f.height / 2;
  const relX = centerX / f.imageWidth;
  const relY = centerY / f.imageHeight;
  const relW = f.width / f.imageWidth;
  const shapeFit = Math.max(roundShape(f.shape), f.shape === "triangle" ? 0.8 : 0);
  return (
    0.4 * tri(relW, 0.08, 0.08) +
    0.3 * shapeFit +
    0.3 * (stepDown(relY, 0.5, 0.75) * (0.5 + 0.5 * sideFit(relX)))
  );
}

function scorePeacock(f: ObjectFeatures): number {
  const centerX = f.x + f.width / 2;
  const centerY = f.y + f.height / 2;
  const relX = centerX / f.imageWidth;
  const relY = centerY / f.imageHeight;
  const relW = f.width / f.imageWidth;
  return (
    0.4 * complexShape(f.shape) +
    0.3 * tri(relW, 0.2, 0.15) +
    0.3 * (0.5 * sideFit(relX) + 0.5 * stepDown(relY, 0.7, 0.9))
  );
}

function scorePrabhavali(f: ObjectFeatures): number {
  const centerX = f.x + f.width / 2;
  const relX = centerX / f.imageWidth;
  const relW = f.width / f.imageWidth;
  const round = 1 - clamp(Math.abs(f.aspectRatio - 1), 0, 1);
  return (
    0.5 * (f.shape === "ring" ? 1 : 0) +
    0.2 * round +
    0.2 * tri(relW, 0.3, 0.15) +
    0.1 * centerFit(relX)
  );
}

function scoreOm(f: ObjectFeatures): number {
  const centerX = f.x + f.width / 2;
  const relX = centerX / f.imageWidth;
  const relW = f.width / f.imageWidth;
  const distinctive = f.shape === "complex" || f.shape === "triangle" || f.shape === "dot" ? 1 : 0.5;
  return (
    0.4 * tri(relW, 0.05, 0.05) +
    0.3 * centerFit(relX) +
    0.3 * distinctive
  );
}

// ── Public API ───────────────────────────────────────────────────

const SCORERS: ReadonlyArray<{ type: ComponentType; score: (f: ObjectFeatures) => number; reason: string }> = [
  { type: "frame", score: scoreFrame, reason: "large hollow rectangle" },
  { type: "border", score: scoreBorder, reason: "inner hollow ring" },
  { type: "arch", score: scoreArch, reason: "wide, upper position" },
  { type: "pillar", score: scorePillar, reason: "tall and narrow" },
  { type: "stage", score: scoreStage, reason: "wide, lower position" },
  { type: "lotus", score: scoreLotus, reason: "roundish, mid-size" },
  { type: "bell", score: scoreBell, reason: "small round/triangle" },
  { type: "peacock", score: scorePeacock, reason: "complex side motif" },
  { type: "prabhavali", score: scorePrabhavali, reason: "halo ring" },
  { type: "om", score: scoreOm, reason: "tiny central symbol" },
];

/**
 * Classify a region into the best-fitting component type. Returns the winner
 * with its confidence (the raw score, clamped 0–1) and the runner-up so
 * callers can gauge ambiguity.
 */
export function classifyObject(features: ObjectFeatures): Classification {
  const scored = SCORERS.map((s) => ({
    type: s.type,
    score: s.score(features),
    reason: s.reason,
  })).sort((a, b) => b.score - a.score);

  const winner = scored[0];
  const second = scored[1];

  if (!winner) {
    return { type: "background", confidence: 0, runnerUp: null, reasons: [] };
  }

  const runnerUp = second && second.type !== winner.type ? second : null;
  return {
    type: winner.type,
    confidence: clamp(winner.score, 0, 1),
    runnerUp: runnerUp ? { type: runnerUp.type, score: runnerUp.score } : null,
    reasons: [winner.reason],
  };
}
