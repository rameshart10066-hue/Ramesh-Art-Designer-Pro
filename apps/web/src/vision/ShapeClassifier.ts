/**
 * Shape Classifier — Sprint 10.2
 *
 * Classifies the GEOMETRY of a connected image region from its bounding-box
 * dimensions and foreground area. It is deliberately conservative: it reports
 * reliable numeric features (aspect ratio, fill ratio) alongside a coarse
 * shape label, and leaves the semantic decision (frame vs arch vs pillar…) to
 * `ObjectClassifier`, which combines shape with position, size, and context.
 *
 * All functions are pure over region measurements — no DOM, Node-testable.
 */

export type ShapeName =
  | "dot"
  | "tall-rect"
  | "wide-rect"
  | "circle"
  | "ellipse"
  | "triangle"
  | "ring"
  | "complex";

export interface ShapeResult {
  shape: ShapeName;
  /** 0–1 measure of how decisively the label fits the geometry. */
  confidence: number;
  /** width / height (≥ 0). */
  aspectRatio: number;
  /** foreground area / bounding-box area (0–1); low = hollow/open. */
  fillRatio: number;
}

/**
 * Classify the shape of a region.
 *
 * @param width  bounding-box width (px)
 * @param height bounding-box height (px)
 * @param area   number of foreground pixels inside the box
 */
export function classifyShape(width: number, height: number, area: number): ShapeResult {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const aspect = w / h;
  const fill = Math.max(0, Math.min(1, area / (w * h)));

  if (w < 3 || h < 3 || area < 3) {
    return { shape: "dot", confidence: 1, aspectRatio: aspect, fillRatio: fill };
  }

  // Tall & narrow → pillar-like.
  if (aspect < 0.45) {
    const confidence = clamp(1 - (aspect - 0.2) / 0.25, 0.3, 1);
    return { shape: "tall-rect", confidence, aspectRatio: aspect, fillRatio: fill };
  }

  // Wide & short → stage/platform-like.
  if (aspect > 2.4) {
    const confidence = clamp(1 - (2.4 - Math.min(aspect, 6)) / 1.6, 0.3, 1);
    return { shape: "wide-rect", confidence, aspectRatio: aspect, fillRatio: fill };
  }

  // Hollow (low fill) → an outline / ring (frame, border, prabhavali halo).
  if (fill < 0.5) {
    const confidence = clamp(1 - fill / 0.5, 0.3, 1);
    return { shape: "ring", confidence, aspectRatio: aspect, fillRatio: fill };
  }

  // Partially filled → pointed / angled (arch top, bell, peacock).
  if (fill < 0.7) {
    const confidence = clamp((fill - 0.5) / 0.2, 0.3, 1);
    return { shape: "triangle", confidence, aspectRatio: aspect, fillRatio: fill };
  }

  // Solid and near-square → circular-ish (lotus, bell, om).
  if (aspect >= 0.8 && aspect <= 1.3) {
    // Rounded (circle) when fill is below a full square; squarer → ellipse-ish.
    const confidence = fill < 0.92 ? 0.9 : 0.7;
    return { shape: "circle", confidence, aspectRatio: aspect, fillRatio: fill };
  }

  return { shape: "ellipse", confidence: 0.75, aspectRatio: aspect, fillRatio: fill };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
