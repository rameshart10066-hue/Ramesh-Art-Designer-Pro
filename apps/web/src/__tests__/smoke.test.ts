/**
 * Automated Smoke Tests
 *
 * Verifies every major system initializes and operates without errors.
 * Run with: npx vitest run src/__tests__/smoke.test.ts
 */

import { describe, it, expect } from "vitest";
import { ObjectFactory } from "@/objects/ObjectFactory";
import { RectangleObject, CircleObject, StarObject } from "@/objects/shapes";
import { LotusObject, MandapObject, KalashObject } from "@/objects/ganpati";
import { PeacockObject, BellObject, SwastikObject } from "@/objects/parametric";
import { shapeToPath, booleanOperation, clonePathData } from "@/services/editor/pathUtils";
import { createCommandHistory, createAddCommand, createDeleteCommand, executeCommand } from "@/services/editor/commandHistoryService";
import { alignObjects, flipObjects, flipObjectTransform } from "@/services/editor/alignmentUtils";
import { createGroup, ungroup } from "@/services/editor/groupUtils";
import { createProjectFile } from "@/services/projectService";
import { DESIGN_TEMPLATES, instantiateTemplate } from "@/services/templateEngine";
import { DEFAULT_NESTING_CONFIG, DEFAULT_TOOLPATH_MAP } from "@/types/manufacturing";
import type { BaseObjectData } from "@/types/objects";

// ── Helpers ──────────────────────────────────────────────────────

function makeRect(id: number): BaseObjectData {
  return {
    id, type: "rectangle", category: "basic", name: `Rect ${id}`,
    x: 100, y: 100, width: 150, height: 100,
    rotation: 0, scaleX: 1, scaleY: 1, flipX: false, flipY: false,
    opacity: 1, fill: "#ff0000", stroke: "#000", strokeWidth: 1,
    visible: true, locked: false, zIndex: 0, children: [], metadata: {},
  };
}

// ── Object System Tests ──────────────────────────────────────────

describe("Object System", () => {
  it("creates a RectangleObject via factory", () => {
    const obj = ObjectFactory.create("rectangle", { x: 0, y: 0, width: 100, height: 50 });
    expect(obj).toBeInstanceOf(RectangleObject);
    const data = obj.getData();
    expect(data.width).toBe(100);
    expect(data.height).toBe(50);
  });

  it("creates a CircleObject", () => {
    const obj = ObjectFactory.create("circle", { x: 0, y: 0, width: 80, height: 80 });
    expect(obj).toBeInstanceOf(CircleObject);
  });

  it("creates a StarObject", () => {
    const obj = ObjectFactory.create("star", { x: 0, y: 0, width: 100, height: 100 });
    expect(obj).toBeInstanceOf(StarObject);
  });

  it("creates Ganpati objects", () => {
    expect(ObjectFactory.create("lotus", {})).toBeInstanceOf(LotusObject);
    expect(ObjectFactory.create("mandap", {})).toBeInstanceOf(MandapObject);
    expect(ObjectFactory.create("kalash", {})).toBeInstanceOf(KalashObject);
  });

  it("creates parametric components", () => {
    expect(ObjectFactory.create("peacock", {})).toBeInstanceOf(PeacockObject);
    expect(ObjectFactory.create("bell", {})).toBeInstanceOf(BellObject);
    expect(ObjectFactory.create("swastik", {})).toBeInstanceOf(SwastikObject);
  });

  it("duplicates an object with offset", () => {
    const obj = ObjectFactory.create("rectangle", { x: 100, y: 100 });
    const dup = obj.duplicate();
    const d = dup.getData();
    expect(d.x).toBe(120); // offset by +20
    expect(d.y).toBe(120);
  });

  it("serializes and deserializes", () => {
    const obj = ObjectFactory.create("rectangle", { x: 10, y: 20, width: 200, height: 100 });
    const ser = obj.serialize();
    expect(ser.version).toBe("1.0.0");
    expect(ser.data.x).toBe(10);
    const restored = ObjectFactory.deserialize(ser.data);
    expect(restored.getData().x).toBe(10);
  });

  it("hit-tests correctly", () => {
    const obj = ObjectFactory.create("rectangle", { x: 0, y: 0, width: 100, height: 100 });
    expect(obj.hitTest({ x: 50, y: 50 })).toBe(true);
    expect(obj.hitTest({ x: 150, y: 50 })).toBe(false);
    expect(obj.hitTest({ x: -1, y: 50 })).toBe(false);
  });
});

// ── Path System Tests ────────────────────────────────────────────

describe("Path System", () => {
  it("converts rectangle to path", () => {
    const data = makeRect(1);
    const path = shapeToPath(data);
    expect(path).not.toBeNull();
    expect(path!.nodes.length).toBe(4);
    expect(path!.closed).toBe(true);
  });

  it("converts star to path", () => {
    const data = makeRect(1);
    data.type = "star";
    data.metadata = { points: 5, innerRadius: 0.5 };
    const path = shapeToPath(data);
    expect(path).not.toBeNull();
    expect(path!.nodes.length).toBe(10);
  });

  it("clones path data", () => {
    const data = makeRect(1);
    const path = shapeToPath(data)!;
    const cloned = clonePathData(path);
    expect(cloned.nodes.length).toBe(path.nodes.length);
    expect(cloned.closed).toBe(path.closed);
  });
});

// ── Command History Tests ────────────────────────────────────────

describe("Undo/Redo", () => {
  it("executes and undoes a command", () => {
    const history = createCommandHistory();
    const obj = makeRect(1);
    const cmd = createAddCommand(obj);
    const r1 = executeCommand(history, [], cmd);
    expect(r1.objects.length).toBe(1);

    const delCmd = createDeleteCommand(obj);
    const r2 = executeCommand(r1.history, r1.objects, delCmd);
    expect(r2.objects.length).toBe(0);
  });
});

// ── Alignment Tests ──────────────────────────────────────────────

describe("Alignment", () => {
  it("aligns objects left", () => {
    const objs = [makeRect(1), { ...makeRect(2), x: 200 }];
    const result = alignObjects(objs, [1, 2], "left");
    expect(result[1]!.x).toBe(100);
  });

  it("flips objects using transform", () => {
    const obj = makeRect(1);
    const result = flipObjectTransform(obj, "horizontal");
    expect(result.flipX).toBe(true);
    expect(result.scaleX).toBe(-1);
  });
});

// ── Group Tests ──────────────────────────────────────────────────

describe("Groups", () => {
  it("creates and ungroups", () => {
    const group = createGroup([10, 20, 30], "Test Group");
    expect(group.childIds.length).toBe(3);

    const { freedIds } = ungroup([group], group.id);
    expect(freedIds.length).toBe(3);
  });
});

// ── Project Tests ────────────────────────────────────────────────

describe("Project Service", () => {
  it("creates a project file", () => {
    const project = createProjectFile([makeRect(1), makeRect(2)]);
    expect(project.metadata.version).toBe("1.0");
    expect(project.canvas.objects.length).toBe(2);
  });
});

// ── Manufacturing Tests ──────────────────────────────────────────

describe("Manufacturing", () => {
  it("has default nesting config", () => {
    expect(DEFAULT_NESTING_CONFIG.gap).toBe(3);
    expect(DEFAULT_NESTING_CONFIG.sheetWidth).toBe(1220);
  });

  it("has toolpath mappings", () => {
    expect(DEFAULT_TOOLPATH_MAP.length).toBe(6);
    expect(DEFAULT_TOOLPATH_MAP[0]!.action).toBe("cut");
  });
});

// ── Design_001 ──────────────────────────────────────────────────

describe("Design_001 - Royal Palace", () => {

  it("loads as the first built-in template", () => {
    const d1 = DESIGN_TEMPLATES[0]!;
    expect(d1).toBeDefined();
    expect(d1.id).toBe("design-001");
    expect(d1.name).toContain("Royal Palace");
  });

  it("has all 10 required component types", () => {
    const d1 = DESIGN_TEMPLATES[0]!;
    expect(d1.extraComponents).toBeDefined();
    const names = d1.extraComponents!.map((c: any) => c.name || "");
    expect(names.some((n: string) => n.includes("Frame"))).toBe(true);
    expect(names.some((n: string) => n.includes("Pillar"))).toBe(true);
    expect(names.some((n: string) => n.includes("Arch"))).toBe(true);
    expect(names.some((n: string) => n.includes("Platform"))).toBe(true);
    expect(names.some((n: string) => n.includes("Border"))).toBe(true);
    expect(names.some((n: string) => n.includes("Om"))).toBe(true);
    expect(names.some((n: string) => n.includes("Prabhavali"))).toBe(true);
    expect(names.some((n: string) => n.includes("Bell"))).toBe(true);
    expect(names.some((n: string) => n.includes("Peacock"))).toBe(true);
    expect(names.some((n: string) => n.includes("Name Plate"))).toBe(true);
  });

  it("instantiates all components on canvas", () => {
    const d1 = DESIGN_TEMPLATES[0]!;
    const objects = instantiateTemplate(d1);
    expect(objects.length).toBeGreaterThanOrEqual(10);
  });

  it("has correct royal style DNA", () => {
    const d1 = DESIGN_TEMPLATES[0]!;
    expect(d1.dna.style).toBe("royal");
    expect(d1.dna.primaryColor).toBe("#d4a017");
    expect(d1.dna.ornamentDensity).toBeGreaterThan(0.8);
  });
});
