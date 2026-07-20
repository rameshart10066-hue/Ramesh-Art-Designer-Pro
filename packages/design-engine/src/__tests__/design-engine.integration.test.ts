import { describe, expect, it } from "vitest";
import { generateNameplateSvg } from "../nameplate/generateNameplateSvg";
import { generateFingerJointBoxSvg } from "../finger-joint-box/generateFingerJointBoxSvg";
import { nestRectangles } from "../nesting/nestRectangles";

describe("design-engine integration: nesting real part dimensions together", () => {
  it("nests the bounding boxes of a batch of nameplates onto a sheet", () => {
    const nameplateSpecs = [
      { text: "Karan", widthMm: 100, heightMm: 30 },
      { text: "Priya", widthMm: 100, heightMm: 30 },
      { text: "Ramesh Acrylics", widthMm: 150, heightMm: 40 },
    ];

    // Each nameplate must actually generate valid SVG before being nested —
    // this is the integration point: nesting operates on the same
    // dimensions used to produce real output, not arbitrary test numbers.
    for (const spec of nameplateSpecs) {
      expect(() => generateNameplateSvg(spec)).not.toThrow();
    }

    const result = nestRectangles(
      nameplateSpecs.map((spec, i) => ({ id: `nameplate-${i}`, widthMm: spec.widthMm, heightMm: spec.heightMm })),
      { widthMm: 300, heightMm: 200 },
      5,
    );

    expect(result.placements).toHaveLength(3);
    expect(result.sheetsUsed).toBe(1);
  });

  it("a finger-joint box's wall panels fit on the same sheet as its bottom panel", () => {
    const box = { widthMm: 100, depthMm: 80, heightMm: 40, materialThicknessMm: 3 };
    expect(() => generateFingerJointBoxSvg(box)).not.toThrow();

    // Panels: bottom (100x80), front/back (100x40 each), left/right (80x40 each)
    const panels = [
      { id: "bottom", widthMm: box.widthMm, heightMm: box.depthMm },
      { id: "front", widthMm: box.widthMm, heightMm: box.heightMm },
      { id: "back", widthMm: box.widthMm, heightMm: box.heightMm },
      { id: "left", widthMm: box.depthMm, heightMm: box.heightMm },
      { id: "right", widthMm: box.depthMm, heightMm: box.heightMm },
    ];

    const result = nestRectangles(panels, { widthMm: 400, heightMm: 300 }, 5);
    expect(result.placements).toHaveLength(5);
    expect(result.sheetsUsed).toBe(1);
  });
});
