import { describe, expect, it } from "vitest";
import type { BaseObjectData } from "@/types/objects";
import { getTemplate } from "@/services/templateEngine";
import { getMaterial } from "@/product-model/MaterialSystem";
import {
  DECORATION_TYPES,
  FT_TO_MM,
  buildWizardProject,
  fitObjectsToCanvas,
  resolveSizeMm,
} from "../newProjectService";

describe("decoration type presets", () => {
  it("maps every named preset to a real template in the existing engine", () => {
    for (const type of DECORATION_TYPES) {
      if (type.templateId) {
        expect(getTemplate(type.templateId), `${type.id} → ${type.templateId}`).toBeDefined();
      }
    }
  });
});

describe("resolveSizeMm", () => {
  it("converts preset sizes from feet to mm", () => {
    expect(resolveSizeMm("3x3")).toEqual({ widthMm: Math.round(3 * FT_TO_MM), heightMm: Math.round(3 * FT_TO_MM) });
    expect(resolveSizeMm("6x6").widthMm).toBe(Math.round(6 * FT_TO_MM));
  });

  it("converts custom sizes from feet, clamping to a sane minimum", () => {
    expect(resolveSizeMm("custom", { widthFt: 4.5, heightFt: 6 })).toEqual({
      widthMm: Math.round(4.5 * FT_TO_MM),
      heightMm: Math.round(6 * FT_TO_MM),
    });
    expect(resolveSizeMm("custom", { widthFt: 0.1, heightFt: 0.1 }).widthMm).toBe(Math.round(0.5 * FT_TO_MM));
  });
});

describe("buildWizardProject", () => {
  it("generates objects for a named preset using the template engine", () => {
    const project = buildWizardProject({ typeId: "royal-palace", sizeId: "4x4", materialId: "thermocol" });

    expect(project.objects.length).toBeGreaterThan(0);
    expect(project.designName).toBe("Royal Palace");
    expect(project.name).toContain("4×4");
    expect(project.widthMm).toBe(Math.round(4 * FT_TO_MM));
    expect(project.materialLabel).toBe("Thermocol");
    expect(project.thicknessMm).toBe(getMaterial("thermocol").defaultThickness);
  });

  it("applies the chosen material to the generated DNA", () => {
    const mdf = buildWizardProject({ typeId: "traditional", sizeId: "3x3", materialId: "mdf" });
    expect(mdf.materialId).toBe("mdf");
    expect(mdf.thicknessMm).toBe(getMaterial("mdf").defaultThickness);
  });

  it("fits objects within the chosen canvas bounds", () => {
    const project = buildWizardProject({ typeId: "temple", sizeId: "5x5", materialId: "pvc" });
    const margin = 40;
    for (const o of project.objects) {
      expect(o.x).toBeGreaterThanOrEqual(margin - 0.01);
      expect(o.y).toBeGreaterThanOrEqual(margin - 0.01);
      expect(o.x + o.width).toBeLessThanOrEqual(project.widthMm - margin + 0.01);
      expect(o.y + o.height).toBeLessThanOrEqual(project.heightMm - margin + 0.01);
    }
  });

  it("returns an empty-ish blank work area for the blank type", () => {
    const blank = buildWizardProject({ typeId: "blank", sizeId: "3x3", materialId: "mdf" });
    expect(blank.objects).toHaveLength(1);
    expect(blank.objects[0]!.metadata.workArea).toBe(true);
    expect(blank.designName).toBe("Blank");
    expect(blank.widthMm).toBe(Math.round(3 * FT_TO_MM));
  });

  it("builds a custom parametric base when custom has no gallery objects", () => {
    const custom = buildWizardProject({ typeId: "custom", sizeId: "3x3", materialId: "acrylic" });
    expect(custom.objects.length).toBeGreaterThan(0);
    expect(custom.designName).toBe("Custom Decoration");
    expect(custom.materialLabel).toBe("Acrylic");
  });
});

describe("fitObjectsToCanvas", () => {
  it("scales and recentres objects to fit the canvas with a margin", () => {
    const objects = [makeObject({ x: 0, y: 0, width: 100, height: 100 }), makeObject({ x: 100, y: 100, width: 100, height: 100 })];
    const fitted = fitObjectsToCanvas(objects, 500, 500, 40);

    expect(fitted).toHaveLength(2);
    for (const o of fitted) {
      expect(o.x).toBeGreaterThanOrEqual(40 - 0.01);
      expect(o.y).toBeGreaterThanOrEqual(40 - 0.01);
      expect(o.x + o.width).toBeLessThanOrEqual(500 - 40 + 0.01);
      expect(o.y + o.height).toBeLessThanOrEqual(500 - 40 + 0.01);
    }
  });

  it("returns the same array for empty input", () => {
    expect(fitObjectsToCanvas([], 500, 500)).toEqual([]);
  });

  it("keeps strokes proportional", () => {
    const [fitted] = fitObjectsToCanvas([makeObject({ width: 100, height: 100, strokeWidth: 2 })], 500, 500, 40);
    expect(fitted!.strokeWidth).toBeGreaterThanOrEqual(1);
  });
});

// ── helper ─────────────────────────────────────────────────────────

function makeObject(overrides: Partial<BaseObjectData>): BaseObjectData {
  return {
    id: Math.floor(Math.random() * 100000),
    type: "rectangle",
    category: "basic",
    name: "Test",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
    fill: "#fff",
    stroke: "#000",
    strokeWidth: 2,
    visible: true,
    locked: false,
    zIndex: 0,
    children: [],
    metadata: {},
    ...overrides,
  };
}
