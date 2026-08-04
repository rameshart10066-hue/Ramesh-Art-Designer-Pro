/**
 * Sprint 10.5 — Manufacturing Automation — Unit Tests
 *
 * Verifies the one-shot generation of the full manufacturing package from
 * reconstructed editable canvas objects: 39×19" sheet split, joints,
 * registration marks, glue tabs, part numbers, assembly guide, BOM, cost,
 * DXF, SVG, and cut-ready SVGs.
 */

import { describe, it, expect } from "vitest";
import type { BaseObjectData, ObjectType } from "@/types/objects";
import { autoGenerateManufacturing } from "@/manufacturing/autoGenerate";

function makeObj(
  id: number,
  type: ObjectType,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  name: string,
): BaseObjectData {
  return {
    id,
    type,
    category: "ganpati",
    name,
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
    fill,
    stroke: "#000",
    strokeWidth: 2,
    visible: true,
    locked: false,
    zIndex: 0,
    children: [],
    metadata: {},
  };
}

function sampleDesign(): BaseObjectData[] {
  return [
    makeObj(1, "rectangle", 50, 50, 880, 780, "#d4a017", "Frame"),
    makeObj(2, "pillar", 90, 180, 60, 400, "#c4956a", "Pillar Left"),
    makeObj(3, "pillar", 750, 180, 60, 400, "#c4956a", "Pillar Right"),
    makeObj(4, "arch", 260, 120, 480, 260, "#8b6914", "Arch"),
    makeObj(5, "base-platform", 180, 620, 540, 90, "#6b5740", "Stage"),
  ];
}

describe("autoGenerateManufacturing", () => {
  it("produces all 11 manufacturing outputs", () => {
    const bundle = autoGenerateManufacturing(sampleDesign());

    // Sheet split: 39×19" (990×482 mm) labels.
    expect(bundle.sheets.length).toBeGreaterThanOrEqual(1);
    expect(bundle.sheets[0]!.label).toContain('39×19"');

    // Parts with part numbers.
    expect(bundle.parts.length).toBeGreaterThanOrEqual(5);
    for (const p of bundle.parts) {
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
      expect(p.partNumber).toMatch(/^P\d{3}$/);
    }

    // Part numbers map covers every part.
    for (const p of bundle.parts) {
      expect(bundle.partNumbers[p.id]).toMatch(/^P\d{3}$/);
    }

    // Joints, registration marks, glue tabs.
    expect(Array.isArray(bundle.joints)).toBe(true);
    expect(bundle.registrationMarks.length).toBeGreaterThan(0);
    expect(bundle.glueTabs.length).toBeGreaterThan(0);

    // Assembly guide + BOM.
    expect(bundle.assemblyGuide.totalSteps).toBeGreaterThanOrEqual(1);
    expect(bundle.bom.entries.length).toBe(bundle.parts.length);
    expect(bundle.bom.summary.totalParts).toBeGreaterThanOrEqual(1);

    // Cost.
    expect(bundle.cost.total).toBeGreaterThan(0);
    expect(bundle.cost.materialCost).toBeGreaterThan(0);

    // Exports: per-sheet DXF, SVG, cut-ready.
    expect(bundle.dxf.length).toBe(bundle.sheets.length);
    expect(bundle.svg.length).toBe(bundle.sheets.length);
    expect(bundle.cutReady.length).toBe(bundle.sheets.length);
    expect(bundle.dxf[0]).toContain("SECTION");
    expect(bundle.svg[0]).toContain("<svg");
    expect(bundle.cutReady[0]).toContain("<svg");

    // Summary.
    expect(bundle.summary.totalSheets).toBe(bundle.sheets.length);
    expect(bundle.summary.totalParts).toBe(bundle.parts.length);
    expect(bundle.summary.totalCost).toBeGreaterThan(0);
    expect(bundle.summary.sheetSize).toContain("39×19");
  });

  it("slices oversized parts so they fit on 39×19 sheets", () => {
    // A single huge part that cannot fit any sheet must be split, not hang.
    const huge = [makeObj(1, "rectangle", 0, 0, 2000, 1500, "#d4a017", "Huge Panel")];
    const bundle = autoGenerateManufacturing(huge);

    expect(bundle.parts.length).toBeGreaterThan(1); // sliced
    for (const p of bundle.parts) {
      expect(p.width).toBeLessThanOrEqual(990);
      expect(p.height).toBeLessThanOrEqual(482);
    }
    expect(bundle.sheets.length).toBeGreaterThanOrEqual(1);
  });

  it("handles an empty canvas", () => {
    const bundle = autoGenerateManufacturing([]);
    expect(bundle.parts).toHaveLength(0);
    expect(bundle.sheets).toHaveLength(0);
    expect(bundle.joints).toHaveLength(0);
    expect(bundle.dxf).toHaveLength(0);
    expect(bundle.cost.total).toBeGreaterThan(0); // zero-area cost still returns a breakdown
  });

  it("respects material and thickness options", () => {
    const bundle = autoGenerateManufacturing(sampleDesign(), { material: "Acrylic", thickness: 5 });
    expect(bundle.summary.material).toBe("Acrylic");
    expect(bundle.summary.thickness).toBe(5);
    for (const p of bundle.parts) {
      expect(p.material).toBe("Acrylic");
      expect(p.thickness).toBe(5);
    }
  });
});
