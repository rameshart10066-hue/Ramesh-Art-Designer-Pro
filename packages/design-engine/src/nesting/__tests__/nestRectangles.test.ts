import { describe, expect, it } from "vitest";
import { nestRectangles } from "../nestRectangles";

describe("nestRectangles", () => {
  it("places every shape exactly once", () => {
    const shapes = [
      { id: "a", widthMm: 30, heightMm: 20 },
      { id: "b", widthMm: 30, heightMm: 20 },
      { id: "c", widthMm: 30, heightMm: 20 },
    ];
    const result = nestRectangles(shapes, { widthMm: 100, heightMm: 100 }, 2);
    expect(result.placements).toHaveLength(3);
    expect(result.placements.map((p) => p.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("wraps to a new row when a shape doesn't fit the remaining width", () => {
    const shapes = [
      { id: "a", widthMm: 60, heightMm: 20 },
      { id: "b", widthMm: 60, heightMm: 20 },
    ];
    const result = nestRectangles(shapes, { widthMm: 100, heightMm: 100 }, 5);
    const [a, b] = result.placements;
    expect(a?.y).toBe(0);
    expect(b?.y).toBeGreaterThan(0);
  });

  it("starts a new sheet when a shape doesn't fit the remaining height", () => {
    const shapes = [
      { id: "a", widthMm: 90, heightMm: 90 },
      { id: "b", widthMm: 90, heightMm: 90 },
    ];
    const result = nestRectangles(shapes, { widthMm: 100, heightMm: 100 }, 5);
    expect(result.sheetsUsed).toBe(2);
    expect(result.placements.find((p) => p.id === "b")?.sheetIndex).toBe(1);
  });

  it("rejects a shape larger than the sheet in either dimension", () => {
    const shapes = [{ id: "too-big", widthMm: 150, heightMm: 20 }];
    expect(() => nestRectangles(shapes, { widthMm: 100, heightMm: 100 }, 2)).toThrow(
      /does not fit on the sheet/,
    );
  });

  it("rejects non-positive sheet dimensions or negative spacing", () => {
    expect(() => nestRectangles([], { widthMm: 0, heightMm: 100 }, 2)).toThrow(
      /must be positive/,
    );
    expect(() => nestRectangles([], { widthMm: 100, heightMm: 100 }, -1)).toThrow(
      /must not be negative/,
    );
  });

  it("returns zero sheets used for an empty shape list", () => {
    const result = nestRectangles([], { widthMm: 100, heightMm: 100 }, 2);
    expect(result.sheetsUsed).toBe(0);
    expect(result.placements).toHaveLength(0);
  });
});
