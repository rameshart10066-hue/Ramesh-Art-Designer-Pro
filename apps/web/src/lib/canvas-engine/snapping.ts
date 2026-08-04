// ──────────────────────────────────────────────────────────────────
// Canvas Engine – Snapping & Smart Guides
// ──────────────────────────────────────────────────────────────────

import type { Point, Rect, SnapGuide, SnapResult } from "./types";

/**
 * Edge / center points of a rect (world coords).
 */
export interface AlignmentPoints {
  left: number;
  right: number;
  centerX: number;
  top: number;
  bottom: number;
  centerY: number;
}

export function getAlignmentPoints(rect: Rect): AlignmentPoints {
  return {
    left: rect.x,
    right: rect.x + rect.width,
    centerX: rect.x + rect.width / 2,
    top: rect.y,
    bottom: rect.y + rect.height,
    centerY: rect.y + rect.height / 2,
  };
}

/** A candidate snap alignment between two rects */
interface SnapCandidate {
  /** The position the object should snap to (world coord) */
  snapPosition: number;
  /** The guide line position (world coord) */
  guidePosition: number;
  /** Which axis */
  axis: "horizontal" | "vertical";
  /** What aligned */
  type: "edge" | "center";
  /** Id of the object we snapped to */
  relatedObjectId: number;
  /** Distance (absolute) — lower is better */
  distance: number;
}

/**
 * Find all snap candidates between a moving rect and a set of static rects.
 * This is the core snapping algorithm: it checks 6 alignments per pair
 * (3 vertical: left↔left, center↔center, right↔right, plus 3 horizontal).
 */
export function findSnapCandidates(
  moving: Rect,
  targets: Rect[],
  tolerance: number
): SnapCandidate[] {
  const mp = getAlignmentPoints(moving);
  const candidates: SnapCandidate[] = [];

  for (const target of targets) {
    const tp = getAlignmentPoints(target);

    // ── Vertical alignments (snap Y) ──
    // Top to top
    let dist = Math.abs(mp.top - tp.top);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.top,
        guidePosition: tp.top,
        axis: "horizontal",
        type: "edge",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
    // Bottom to bottom
    dist = Math.abs(mp.bottom - tp.bottom);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.bottom - moving.height,
        guidePosition: tp.bottom,
        axis: "horizontal",
        type: "edge",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
    // Center Y to center Y
    dist = Math.abs(mp.centerY - tp.centerY);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.centerY - moving.height / 2,
        guidePosition: tp.centerY,
        axis: "horizontal",
        type: "center",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
    // Top to bottom (adjacent)
    dist = Math.abs(mp.top - tp.bottom);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.bottom,
        guidePosition: tp.bottom,
        axis: "horizontal",
        type: "edge",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
    // Bottom to top (adjacent)
    dist = Math.abs(mp.bottom - tp.top);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.top - moving.height,
        guidePosition: tp.top,
        axis: "horizontal",
        type: "edge",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }

    // ── Horizontal alignments (snap X) ──
    // Left to left
    dist = Math.abs(mp.left - tp.left);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.left,
        guidePosition: tp.left,
        axis: "vertical",
        type: "edge",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
    // Right to right
    dist = Math.abs(mp.right - tp.right);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.right - moving.width,
        guidePosition: tp.right,
        axis: "vertical",
        type: "edge",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
    // Center X to center X
    dist = Math.abs(mp.centerX - tp.centerX);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.centerX - moving.width / 2,
        guidePosition: tp.centerX,
        axis: "vertical",
        type: "center",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
    // Left to right (adjacent)
    dist = Math.abs(mp.left - tp.right);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.right,
        guidePosition: tp.right,
        axis: "vertical",
        type: "edge",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
    // Right to left (adjacent)
    dist = Math.abs(mp.right - tp.left);
    if (dist <= tolerance) {
      candidates.push({
        snapPosition: tp.left - moving.width,
        guidePosition: tp.left,
        axis: "vertical",
        type: "edge",
        relatedObjectId: (target as any).id,
        distance: dist,
      });
    }
  }

  return candidates;
}

/**
 * Find snap candidates against canvas edges & center.
 */
export function findCanvasSnapCandidates(
  moving: Rect,
  canvasWidth: number,
  canvasHeight: number,
  tolerance: number
): SnapCandidate[] {
  const mp = getAlignmentPoints(moving);
  const candidates: SnapCandidate[] = [];

  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  // Canvas edges
  let dist = Math.abs(mp.left);
  if (dist <= tolerance) {
    candidates.push({
      snapPosition: 0,
      guidePosition: 0,
      axis: "vertical",
      type: "edge",
      relatedObjectId: -1,
      distance: dist,
    });
  }
  dist = Math.abs(mp.right - canvasWidth);
  if (dist <= tolerance) {
    candidates.push({
      snapPosition: canvasWidth - moving.width,
      guidePosition: canvasWidth,
      axis: "vertical",
      type: "edge",
      relatedObjectId: -1,
      distance: dist,
    });
  }
  dist = Math.abs(mp.top);
  if (dist <= tolerance) {
    candidates.push({
      snapPosition: 0,
      guidePosition: 0,
      axis: "horizontal",
      type: "edge",
      relatedObjectId: -1,
      distance: dist,
    });
  }
  dist = Math.abs(mp.bottom - canvasHeight);
  if (dist <= tolerance) {
    candidates.push({
      snapPosition: canvasHeight - moving.height,
      guidePosition: canvasHeight,
      axis: "horizontal",
      type: "edge",
      relatedObjectId: -1,
      distance: dist,
    });
  }

  // Canvas center
  dist = Math.abs(mp.centerX - canvasCenterX);
  if (dist <= tolerance) {
    candidates.push({
      snapPosition: canvasCenterX - moving.width / 2,
      guidePosition: canvasCenterX,
      axis: "vertical",
      type: "center",
      relatedObjectId: -1,
      distance: dist,
    });
  }
  dist = Math.abs(mp.centerY - canvasCenterY);
  if (dist <= tolerance) {
    candidates.push({
      snapPosition: canvasCenterY - moving.height / 2,
      guidePosition: canvasCenterY,
      axis: "horizontal",
      type: "center",
      relatedObjectId: -1,
      distance: dist,
    });
  }

  return candidates;
}

/**
 * Given X and Y snap candidates, pick the best (closest) for each axis
 * and return the final snap result with guides.
 */
export function resolveSnap(
  movingX: number,
  movingY: number,
  candidates: SnapCandidate[]
): SnapResult {
  const xCandidates = candidates.filter((c) => c.axis === "vertical");
  const yCandidates = candidates.filter((c) => c.axis === "horizontal");

  let snappedX = false;
  let snappedY = false;
  const guides: SnapGuide[] = [];

  // Pick closest X candidate
  if (xCandidates.length > 0) {
    const best = xCandidates.reduce((a, b) => (a.distance <= b.distance ? a : b));
    movingX = best.snapPosition;
    snappedX = true;
    guides.push({
      position: best.guidePosition,
      axis: "vertical",
      type: best.type,
      relatedObjectIds:
        best.relatedObjectId >= 0 ? [best.relatedObjectId] : [],
    });
  }

  // Pick closest Y candidate
  if (yCandidates.length > 0) {
    const best = yCandidates.reduce((a, b) => (a.distance <= b.distance ? a : b));
    movingY = best.snapPosition;
    snappedY = true;
    guides.push({
      position: best.guidePosition,
      axis: "horizontal",
      type: best.type,
      relatedObjectIds:
        best.relatedObjectId >= 0 ? [best.relatedObjectId] : [],
    });
  }

  // Deduplicate guides at the same position on the same axis
  const deduplicated = deduplicateGuides(guides);

  return { x: movingX, y: movingY, guides: deduplicated, snappedX, snappedY };
}

/**
 * Remove duplicate guides (same axis + same position).
 */
function deduplicateGuides(guides: SnapGuide[]): SnapGuide[] {
  const seen = new Set<string>();
  return guides.filter((g) => {
    const key = `${g.axis}:${g.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Helper: check if a value is within tolerance of any grid line.
 * Returns the snapped value (or null if none).
 */
export function snapToGridLine(
  value: number,
  gridSize: number,
  tolerance: number
): number | null {
  const snapped = Math.round(value / gridSize) * gridSize;
  if (Math.abs(value - snapped) <= tolerance) {
    return snapped;
  }
  return null;
}

/**
 * Check if a point is on any guide within tolerance.
 */
export function isPointOnGuide(
  point: Point,
  guides: SnapGuide[],
  tolerance: number
): boolean {
  return guides.some((g) => {
    if (g.axis === "vertical") {
      return Math.abs(point.x - g.position) <= tolerance;
    }
    return Math.abs(point.y - g.position) <= tolerance;
  });
}
