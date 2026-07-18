import { describe, expect, it } from "vitest";
import { generateManufacturingSvg } from "../generateManufacturingSvg";

const SQUARE = { points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }] };

describe("generateManufacturingSvg", () => {
  it("renders cut paths with the red LightBurn cut-layer stroke color", () => {
    const svg = generateManufacturingSvg({
      widthMm: 100,
      heightMm: 100,
      cutPaths: [SQUARE],
      materialProfileId: "acrylic-3mm",
    });
    expect(svg).toContain('stroke="#FF0000"');
    expect(svg).toContain("<polygon");
  });

  it("renders engrave text with the blue engrave-layer fill color", () => {
    const svg = generateManufacturingSvg({
      widthMm: 100,
      heightMm: 100,
      cutPaths: [SQUARE],
      engraveTexts: [{ x: 25, y: 25, text: "Hello" }],
      materialProfileId: "acrylic-3mm",
    });
    expect(svg).toContain('fill="#0000FF"');
    expect(svg).toContain(">Hello<");
  });

  it("uses polyline for explicitly open paths", () => {
    const svg = generateManufacturingSvg({
      widthMm: 100,
      heightMm: 100,
      cutPaths: [{ points: SQUARE.points, closed: false }],
      materialProfileId: "acrylic-3mm",
    });
    expect(svg).toContain("<polyline");
  });

  it("embeds the resolved material's kerf value in a comment", () => {
    const svg = generateManufacturingSvg({
      widthMm: 100,
      heightMm: 100,
      cutPaths: [SQUARE],
      materialProfileId: "acrylic-5mm",
    });
    expect(svg).toContain("kerf: 0.18mm");
  });

  it("throws for an unknown material profile", () => {
    expect(() =>
      generateManufacturingSvg({
        widthMm: 100,
        heightMm: 100,
        cutPaths: [SQUARE],
        materialProfileId: "unobtainium",
      }),
    ).toThrow(/Unknown material profile/);
  });

  it("throws when no cut paths are provided", () => {
    expect(() =>
      generateManufacturingSvg({
        widthMm: 100,
        heightMm: 100,
        cutPaths: [],
        materialProfileId: "acrylic-3mm",
      }),
    ).toThrow(/at least one cut path/i);
  });
});
