import { describe, expect, it } from "vitest";
import { generateFingerJointBoxSvg } from "../generateFingerJointBoxSvg";

describe("generateFingerJointBoxSvg", () => {
  it("produces one SVG containing 5 panels (bottom + 4 walls)", () => {
    const svg = generateFingerJointBoxSvg({
      widthMm: 100,
      depthMm: 80,
      heightMm: 40,
      materialThicknessMm: 3,
    });
    const polygonCount = (svg.match(/<polygon/g) ?? []).length;
    expect(polygonCount).toBe(5);
  });

  it("rejects non-positive dimensions", () => {
    expect(() =>
      generateFingerJointBoxSvg({ widthMm: 0, depthMm: 80, heightMm: 40, materialThicknessMm: 3 }),
    ).toThrow(/must all be positive/);
  });

  it("rejects non-positive material thickness", () => {
    expect(() =>
      generateFingerJointBoxSvg({
        widthMm: 100,
        depthMm: 80,
        heightMm: 40,
        materialThicknessMm: 0,
      }),
    ).toThrow(/thickness must be positive/);
  });
});
