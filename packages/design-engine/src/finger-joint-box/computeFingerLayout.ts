export interface FingerLayout {
  /** Number of finger segments along the edge — always odd, so both ends of the edge match. */
  count: number;
  /** Actual width of each segment in mm (recomputed from the target to divide the edge evenly). */
  segmentWidth: number;
}

const DEFAULT_TARGET_FINGER_WIDTH_MM = 10;
const MIN_FINGER_SEGMENTS = 3;

/**
 * Computes how many equal-width finger segments fit along an edge, given
 * a target width. Forces an odd count so the edge starts and ends with
 * the same segment type (both tabs or both gaps) — otherwise a box's
 * opposite panels wouldn't line up.
 */
export function computeFingerLayout(
  edgeLengthMm: number,
  targetFingerWidthMm: number = DEFAULT_TARGET_FINGER_WIDTH_MM,
): FingerLayout {
  if (edgeLengthMm <= 0) {
    throw new Error("Edge length must be positive.");
  }
  if (targetFingerWidthMm <= 0) {
    throw new Error("Target finger width must be positive.");
  }

  let count = Math.round(edgeLengthMm / targetFingerWidthMm);
  if (count < MIN_FINGER_SEGMENTS) count = MIN_FINGER_SEGMENTS;
  if (count % 2 === 0) count += 1;

  return { count, segmentWidth: edgeLengthMm / count };
}
