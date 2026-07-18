import { describe, expect, it } from "vitest";
import { computeFingerLayout } from "../computeFingerLayout";

describe("computeFingerLayout", () => {
  it("returns an odd segment count", () => {
    expect(computeFingerLayout(100, 10).count % 2).toBe(1);
    expect(computeFingerLayout(97, 9.5).count % 2).toBe(1);
  });

  it("divides the edge length evenly across segments", () => {
    const layout = computeFingerLayout(100, 10);
    expect(layout.segmentWidth * layout.count).toBeCloseTo(100);
  });

  it("enforces a minimum of 3 segments even for very short edges", () => {
    const layout = computeFingerLayout(5, 10);
    expect(layout.count).toBeGreaterThanOrEqual(3);
  });

  it("rejects a non-positive edge length or target width", () => {
    expect(() => computeFingerLayout(0, 10)).toThrow(/must be positive/);
    expect(() => computeFingerLayout(100, 0)).toThrow(/must be positive/);
  });
});
