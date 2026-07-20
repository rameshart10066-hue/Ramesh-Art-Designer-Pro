import { describe, expect, it } from "vitest";
import { generateNestingSvg } from "../generateNestingSvg";

describe("generateNestingSvg", () => {
  it("renders one rect per shape plus one outline per sheet", () => {
    const svg = generateNestingSvg({
      shapes: [
        { id: "a", widthMm: 30, heightMm: 20 },
        { id: "b", widthMm: 30, heightMm: 20 },
      ],
      sheet: { widthMm: 100, heightMm: 100 },
    });
    // 2 shape rects + 1 sheet outline rect = 3 <rect> elements
    expect((svg.match(/<rect/g) ?? []).length).toBe(3);
  });

  it("rejects an empty shape list", () => {
    expect(() =>
      generateNestingSvg({ shapes: [], sheet: { widthMm: 100, heightMm: 100 } }),
    ).toThrow(/at least one shape/i);
  });
});
