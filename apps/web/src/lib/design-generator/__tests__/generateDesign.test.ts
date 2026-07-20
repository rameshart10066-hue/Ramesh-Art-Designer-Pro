import { describe, expect, it } from "vitest";
import { generateDesign } from "../generateDesign";

describe("generateDesign", () => {
  it("dispatches a nameplate request and returns SVG", () => {
    const result = generateDesign({ type: "nameplate", text: "Karan", widthMm: 100, heightMm: 30 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.svg).toContain("<svg");
  });

  it("dispatches a finger-joint-box request and returns SVG", () => {
    const result = generateDesign({
      type: "finger-joint-box",
      widthMm: 100,
      depthMm: 80,
      heightMm: 40,
      materialThicknessMm: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.svg).toContain("<polygon");
  });

  it("dispatches a nesting request and returns SVG", () => {
    const result = generateDesign({
      type: "nesting",
      shapes: [{ id: "a", widthMm: 30, heightMm: 20 }],
      sheetWidthMm: 100,
      sheetHeightMm: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.svg).toContain("<rect");
  });

  it("normalizes a thrown validation error into an error response instead of throwing", () => {
    const result = generateDesign({ type: "nameplate", text: "", widthMm: 100, heightMm: 30 });
    expect(result).toEqual({ success: false, error: expect.stringContaining("must not be empty") });
  });
});
