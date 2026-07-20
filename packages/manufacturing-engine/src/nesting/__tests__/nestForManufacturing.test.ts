import { describe, expect, it } from "vitest";
import { nestForManufacturing } from "../nestForManufacturing";

describe("nestForManufacturing", () => {
  it("derives spacing from the material's kerf (2x kerf, no extra)", () => {
    const result = nestForManufacturing({
      parts: [{ id: "a", widthMm: 30, heightMm: 20 }],
      sheetWidthMm: 100,
      sheetHeightMm: 100,
      materialProfileId: "acrylic-3mm", // kerf 0.15mm
    });
    expect(result.appliedSpacingMm).toBeCloseTo(0.3);
  });

  it("adds extraSpacingMm on top of the kerf-derived minimum", () => {
    const result = nestForManufacturing({
      parts: [{ id: "a", widthMm: 30, heightMm: 20 }],
      sheetWidthMm: 100,
      sheetHeightMm: 100,
      materialProfileId: "acrylic-3mm",
      extraSpacingMm: 5,
    });
    expect(result.appliedSpacingMm).toBeCloseTo(5.3);
  });

  it("places all parts and reports the material profile used", () => {
    const result = nestForManufacturing({
      parts: [
        { id: "a", widthMm: 30, heightMm: 20 },
        { id: "b", widthMm: 30, heightMm: 20 },
      ],
      sheetWidthMm: 100,
      sheetHeightMm: 100,
      materialProfileId: "acrylic-5mm",
    });
    expect(result.placements).toHaveLength(2);
    expect(result.materialProfileId).toBe("acrylic-5mm");
  });

  it("throws for an unknown material profile", () => {
    expect(() =>
      nestForManufacturing({
        parts: [{ id: "a", widthMm: 30, heightMm: 20 }],
        sheetWidthMm: 100,
        sheetHeightMm: 100,
        materialProfileId: "unobtainium",
      }),
    ).toThrow(/Unknown material profile/);
  });
});
