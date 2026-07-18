import { describe, expect, it } from "vitest";
import { generateManufacturingOutput } from "../generateManufacturingOutput";

const SQUARE = { points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }] };

describe("generateManufacturingOutput", () => {
  it("dispatches an svg request and returns svg output", () => {
    const result = generateManufacturingOutput({
      type: "svg",
      widthMm: 100,
      heightMm: 100,
      cutPaths: [SQUARE],
      materialProfileId: "acrylic-3mm",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.format).toBe("svg");
      expect(result.output).toContain("<svg");
    }
  });

  it("dispatches a dxf request and returns dxf output", () => {
    const result = generateManufacturingOutput({ type: "dxf", cutPaths: [SQUARE] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.format).toBe("dxf");
      expect(result.output).toContain("POLYLINE");
    }
  });

  it("normalizes a thrown error (unknown material) into an error response", () => {
    const result = generateManufacturingOutput({
      type: "svg",
      widthMm: 100,
      heightMm: 100,
      cutPaths: [SQUARE],
      materialProfileId: "unobtainium",
    });
    expect(result).toEqual({ success: false, error: expect.stringContaining("Unknown material profile") });
  });
});
