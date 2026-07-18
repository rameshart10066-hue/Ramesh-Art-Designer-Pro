import type { FingerLayout } from "./computeFingerLayout";

export interface Point {
  x: number;
  y: number;
}

/**
 * Traces one finger-jointed edge as a sequence of {distance, offset}
 * points: `distance` runs 0..edgeLength along the edge, `offset` is 0
 * (flush) or `thicknessMm` (protruding), stepping at each segment
 * boundary. Two consecutive points sharing the same `distance` represent
 * the small perpendicular "step" between a tab and a gap.
 */
export function buildFingerEdgePoints(
  layout: FingerLayout,
  thicknessMm: number,
  startsProtruding: boolean,
): Array<{ distance: number; offset: number }> {
  const points: Array<{ distance: number; offset: number }> = [];
  let protruding = startsProtruding;

  points.push({ distance: 0, offset: protruding ? thicknessMm : 0 });

  for (let segment = 1; segment <= layout.count; segment++) {
    const distance = segment * layout.segmentWidth;
    points.push({ distance, offset: protruding ? thicknessMm : 0 });

    if (segment < layout.count) {
      protruding = !protruding;
      points.push({ distance, offset: protruding ? thicknessMm : 0 });
    }
  }

  return points;
}

/**
 * Builds a closed panel outline: straight top/bottom edges, finger-jointed
 * left/right edges. `rightStartsProtruding`/`leftStartsProtruding` control
 * whether each side starts with a tab or a gap — mating panels use
 * opposite values so their fingers interlock rather than collide.
 *
 * Simplification (documented, not hidden): the top and bottom edges are
 * always straight. A slotted/glued bottom-panel joint is a reasonable
 * follow-up but is out of scope for this generator.
 */
export function buildFingerJointPanelOutline(
  widthMm: number,
  heightMm: number,
  thicknessMm: number,
  layout: FingerLayout,
  rightStartsProtruding: boolean,
  leftStartsProtruding: boolean,
): Point[] {
  const points: Point[] = [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
  ];

  const rightEdge = buildFingerEdgePoints(layout, thicknessMm, rightStartsProtruding);
  for (const p of rightEdge) {
    points.push({ x: widthMm + p.offset, y: p.distance });
  }

  points.push({ x: widthMm, y: heightMm }, { x: 0, y: heightMm });

  const leftEdge = buildFingerEdgePoints(layout, thicknessMm, leftStartsProtruding)
    .slice()
    .reverse()
    .map((p) => ({ x: -p.offset, y: p.distance }));
  for (const p of leftEdge) {
    points.push(p);
  }

  return points;
}
