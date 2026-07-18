import { describe, expect, it } from "vitest";
import { packRectangles } from "../packRectangles";

describe("packRectangles", () => {
  it("places every shape exactly once", () => {
    const shapes = [
      { id: "a", widthMm: 30, heightMm: 20 },
      { id: "b", widthMm: 30, heightMm: 20 },
      { id: "c", widthMm: 30, heightMm: 20 },
    ];
    const result = packRectangles(shapes, { widthMm: 100, heightMm: 100 }, 2);
    expect(result.placements).toHaveLength(3);
  });

  it("wraps to a new row when a shape doesn't fit the remaining width", () => {
    const shapes = [
      { id: "a", widthMm: 60, heightMm: 20 },
      { id: "b", widthMm: 60, heightMm: 20 },
    ];
    const result = packRectangles(shapes, { widthMm: 100, heightMm: 100 }, 5);
    expect(result.placements[1]?.y).toBeGreaterThan(0);
  });

  it("starts a new sheet when a shape doesn't fit the remaining height", () => {
    const shapes = [
      { id: "a", widthMm: 90, heightMm: 90 },
      { id: "b", widthMm: 90, heightMm: 90 },
    ];
    const result = packRectangles(shapes, { widthMm: 100, heightMm: 100 }, 5);
    expect(result.sheetsUsed).toBe(2);
  });

  it("rejects a shape larger than the sheet", () => {
    expect(() =>
      packRectangles([{ id: "big", widthMm: 150, heightMm: 20 }], { widthMm: 100, heightMm: 100 }, 2),
    ).toThrow(/does not fit on the sheet/);
  });

  it("rejects non-positive sheet dimensions or negative spacing", () => {
    expect(() => packRectangles([], { widthMm: 0, heightMm: 100 }, 2)).toThrow(/must be positive/);
    expect(() => packRectangles([], { widthMm: 100, heightMm: 100 }, -1)).toThrow(
      /must not be negative/,
    );
  });

  it("returns zero sheets used for an empty shape list", () => {
    const result = packRectangles([], { widthMm: 100, heightMm: 100 }, 2);
    expect(result.sheetsUsed).toBe(0);
  });
});
