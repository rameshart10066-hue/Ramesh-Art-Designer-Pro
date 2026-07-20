import { describe, expect, it } from "vitest";
import { nestForManufacturing } from "../nesting/nestForManufacturing";
import { generateManufacturingSvg } from "../svg-generator/generateManufacturingSvg";
import type { CutPath } from "../shared/geometry";

function placementToCutPath(x: number, y: number, w: number, h: number): CutPath {
  return {
    points: [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ],
  };
}

describe("manufacturing-engine integration: nesting -> manufacturing SVG", () => {
  it("renders every nested placement as a cut path in the resulting SVG", () => {
    const nesting = nestForManufacturing({
      parts: [
        { id: "a", widthMm: 30, heightMm: 20 },
        { id: "b", widthMm: 30, heightMm: 20 },
        { id: "c", widthMm: 40, heightMm: 25 },
      ],
      sheetWidthMm: 300,
      sheetHeightMm: 200,
      materialProfileId: "acrylic-3mm",
    });

    expect(nesting.placements).toHaveLength(3);

    const cutPaths = nesting.placements.map((p) =>
      placementToCutPath(p.x, p.y, p.widthMm, p.heightMm),
    );

    const svg = generateManufacturingSvg({
      widthMm: 300,
      heightMm: 200,
      cutPaths,
      materialProfileId: "acrylic-3mm",
    });

    const polygonCount = (svg.match(/<polygon/g) ?? []).length;
    expect(polygonCount).toBe(3);
  });

  it("a nesting result using a different material's kerf still renders (SVG generator doesn't re-validate the material)", () => {
    const nesting = nestForManufacturing({
      parts: [{ id: "a", widthMm: 30, heightMm: 20 }],
      sheetWidthMm: 100,
      sheetHeightMm: 100,
      materialProfileId: "acrylic-8mm",
    });

    const svg = generateManufacturingSvg({
      widthMm: 100,
      heightMm: 100,
      cutPaths: [placementToCutPath(0, 0, 30, 20)],
      materialProfileId: "acrylic-8mm",
    });

    expect(nesting.appliedSpacingMm).toBeCloseTo(0.4); // 2x 0.2mm kerf
    expect(svg).toContain("kerf: 0.2mm");
  });
});
