import { describe, expect, it } from "vitest";
import { computeFingerLayout } from "../computeFingerLayout";
import { buildFingerEdgePoints, buildFingerJointPanelOutline } from "../buildFingerJointPanelOutline";

describe("buildFingerEdgePoints", () => {
  it("produces exactly 2*count points", () => {
    const layout = computeFingerLayout(90, 10); // count = 9
    const points = buildFingerEdgePoints(layout, 3, true);
    expect(points).toHaveLength(2 * layout.count);
  });

  it("starts and ends at distance 0 and edgeLength", () => {
    const layout = computeFingerLayout(90, 10);
    const points = buildFingerEdgePoints(layout, 3, true);
    expect(points[0]?.distance).toBe(0);
    expect(points.at(-1)?.distance).toBeCloseTo(90);
  });

  it("alternates offset between 0 and thickness", () => {
    const layout = computeFingerLayout(90, 10);
    const points = buildFingerEdgePoints(layout, 3, true);
    expect(points[0]?.offset).toBe(3);
    expect(points.at(-1)?.offset).toBe(3); // odd count -> same phase at both ends
  });
});

describe("buildFingerJointPanelOutline", () => {
  it("produces a closed-ish outline starting and ending near the origin", () => {
    const layout = computeFingerLayout(50, 10);
    const outline = buildFingerJointPanelOutline(80, 50, 3, layout, true, false);
    const first = outline[0];
    const last = outline.at(-1);
    expect(first).toEqual({ x: 0, y: 0 });
    expect(last?.y).toBeCloseTo(0);
  });

  it("right edge protrudes beyond panelWidth when it starts protruding", () => {
    const layout = computeFingerLayout(50, 10);
    const outline = buildFingerJointPanelOutline(80, 50, 3, layout, true, false);
    expect(outline.some((p) => p.x > 80)).toBe(true);
  });
});
