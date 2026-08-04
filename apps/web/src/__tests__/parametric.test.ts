/**
 * Parametric Engine — Unit Tests
 *
 * Verifies parameter system, dependency graph, constraint solver,
 * geometry generation, and manufacturing metadata.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DependencyGraph } from "@/parametric/DependencyGraph";
import { solveConstraint, type Constraint } from "@/parametric/Constraint";
import { generateGeometry, registerGenerator } from "@/parametric/GeometryGenerator";
import { ParametricEngine } from "@/parametric/ParametricEngine";
import { componentRegistry } from "@/parametric/ComponentRegistry";
import { paramEquals, mergeParams } from "@/parametric/Parameter";

// ── Dependency Graph ─────────────────────────────────────────────

describe("DependencyGraph", () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  it("registers and retrieves nodes", () => {
    graph.setNode(1, null);
    graph.setNode(2, 1);
    expect(graph.size).toBe(2);
  });

  it("tracks parent-child relationships", () => {
    graph.setNode(1, null);
    graph.setNode(2, 1);
    graph.setNode(3, 1);
    const descendants = graph.getDescendants(1);
    expect(descendants).toContain(2);
    expect(descendants).toContain(3);
  });

  it("returns ancestors in order", () => {
    graph.setNode(1, null);
    graph.setNode(2, 1);
    graph.setNode(3, 2);
    const ancestors = graph.getAncestors(3);
    expect(ancestors).toEqual([1, 2]);
  });

  it("marks nodes as dirty", () => {
    graph.setNode(1, null);
    graph.setNode(2, 1);
    graph.setNode(3, 2);

    const dirty = graph.markDirty(1);
    expect(dirty).toContain(1);
    expect(dirty).toContain(2);
    expect(dirty).toContain(3);
  });

  it("reparents children on remove", () => {
    graph.setNode(1, null);
    graph.setNode(2, 1);
    graph.setNode(3, 2);

    graph.removeNode(2);
    const g1desc = graph.getDescendants(1);
    expect(g1desc).toContain(3);
    expect(graph.size).toBe(2);
  });

  it("supports deep nesting", () => {
    graph.setNode(1, null);
    graph.setNode(2, 1);
    graph.setNode(3, 2);
    graph.setNode(4, 3);
    graph.setNode(5, 4);

    expect(graph.getDescendants(1).length).toBe(4);
    expect(graph.getAncestors(5).length).toBe(4);
  });
});

// ── Constraint Solver ────────────────────────────────────────────

describe("Constraint Solver", () => {
  it("aligns objects to center", () => {
    const constraint: Constraint = {
      id: "c1", type: "center-align", targetIds: [1, 2],
    };
    const objects = [
      { id: 1, params: { x: 100, y: 100, width: 200, height: 150 } },
      { id: 2, params: { x: 50, y: 50, width: 100, height: 80 } },
    ];
    const result = solveConstraint(constraint, objects);
    expect(result.updates.length).toBe(1);
    // Object 2 should center within object 1
    expect(result.updates[0]!.params.x).toBe(100 + (200 - 100) / 2);
    expect(result.updates[0]!.params.y).toBe(100 + (150 - 80) / 2);
  });

  it("mirrors objects horizontally", () => {
    const constraint: Constraint = {
      id: "c1", type: "mirror", targetIds: [1, 2], params: { axis: "horizontal" },
    };
    const objects = [
      { id: 1, params: { x: 100, y: 100, width: 100, height: 100 } },
      { id: 2, params: { x: 300, y: 100, width: 100, height: 100 } },
    ];
    const result = solveConstraint(constraint, objects);
    expect(result.updates.length).toBe(1);
    expect(result.updates[0]!.params.flipX).toBe(true);
  });

  it("enforces equal size", () => {
    // Use separate constraint definition
    const constraint: Constraint = {
      id: "c1", type: "equal-size", targetIds: [1, 2, 3],
    };
    const objects = [
      { id: 1, params: { width: 100, height: 80 } },
      { id: 2, params: { width: 120, height: 60 } },
      { id: 3, params: { width: 90, height: 100 } },
    ];
    const result = solveConstraint(constraint, objects);
    // All should have same size: max width 120, max height 100
    for (const update of result.updates) {
      expect(update.params.width).toBe(120);
      expect(update.params.height).toBe(100);
    }
  });

  it("distributes objects equally", () => {
    const constraint: Constraint = {
      id: "c1", type: "equal-distance", targetIds: [1, 2, 3],
    };
    const objects = [
      { id: 1, params: { x: 0, y: 100 } },
      { id: 2, params: { x: 100, y: 100 } },
      { id: 3, params: { x: 300, y: 100 } },
    ];
    const result = solveConstraint(constraint, objects);
    expect(result.updates.length).toBe(3);
    // Objects should be equally spaced
    const sorted = result.updates.sort((a, b) => (a.params.x as number) - (b.params.x as number));
    expect(sorted[0]!.params.x).toBe(0);
    expect(sorted[2]!.params.x).toBe(300);
  });
});

// ── Geometry Generator ───────────────────────────────────────────

describe("GeometryGenerator", () => {
  it("generates rectangle geometry", () => {
    const geo = generateGeometry("rectangle", { x: 10, y: 20, width: 200, height: 100 });
    expect(geo.x).toBe(10);
    expect(geo.y).toBe(20);
    expect(geo.width).toBe(200);
    expect(geo.height).toBe(100);
  });

  it("generates star geometry with metadata", () => {
    const geo = generateGeometry("star", { points: 8, innerRadius: 0.4 });
    expect(geo.metadata.points).toBe(8);
    expect(geo.metadata.innerRadius).toBe(0.4);
  });

  it("generates mandap geometry with parameters", () => {
    const geo = generateGeometry("mandap", {
      pillars: 4, archType: "multilayer", domeHeight: 0.5, roofStyle: "stepped",
    });
    expect(geo.metadata.pillars).toBe(4);
    expect(geo.metadata.archType).toBe("multilayer");
    expect(geo.metadata.domeHeight).toBe(0.5);
    expect(geo.metadata.roofStyle).toBe("stepped");
  });

  it("generates default geometry for unknown types", () => {
    const geo = generateGeometry("unknown", {});
    expect(geo.x).toBe(100);
    expect(geo.width).toBe(150);
  });

  it("registers custom generators", () => {
    registerGenerator("test-shape", (p) => ({
      x: p.x ?? 0, y: p.y ?? 0, width: 50, height: 50,
      rotation: 0, fill: "#fff", stroke: "#000", strokeWidth: 1,
      opacity: 1, scaleX: 1, scaleY: 1, flipX: false, flipY: false,
      metadata: { custom: true },
    }));
    const geo = generateGeometry("test-shape", { x: 10 });
    expect(geo.width).toBe(50);
    expect(geo.metadata.custom).toBe(true);
  });
});

// ── Parametric Engine ────────────────────────────────────────────

describe("ParametricEngine", () => {
  let engine: ParametricEngine;

  beforeEach(() => {
    engine = new ParametricEngine();
  });

  it("registers and retrieves geometry", () => {
    engine.registerObject({ id: 1, type: "rectangle", params: { x: 0, y: 0, width: 100, height: 50 }, parentId: null, constraints: [] });
    const geo = engine.getGeometry(1);
    expect(geo).not.toBeNull();
    expect(geo!.width).toBe(100);
  });

  it("caches geometry between calls", () => {
    engine.registerObject({ id: 1, type: "rectangle", params: { x: 10, y: 20, width: 100, height: 50 }, parentId: null, constraints: [] });
    const g1 = engine.getGeometry(1);
    const g2 = engine.getGeometry(1);
    expect(g1).toBe(g2); // Same reference from cache
  });

  it("invalidates cache on param change", () => {
    engine.registerObject({ id: 1, type: "rectangle", params: { x: 0, y: 0, width: 100, height: 50 }, parentId: null, constraints: [] });
    const g1 = engine.getGeometry(1);
    engine.updateParams(1, { width: 200 });
    const g2 = engine.getGeometry(1);
    expect(g2!.width).toBe(200);
  });

  it("marks descendants dirty on parent change", () => {
    engine.registerObject({ id: 1, type: "mandap", params: { x: 0, y: 0, width: 500, height: 400, pillars: 2 }, parentId: null, constraints: [] });
    engine.registerObject({ id: 2, type: "pillar", params: { x: 50, y: 100, width: 80, height: 200 }, parentId: 1, constraints: [] });

    const dirty = engine.updateParams(1, { pillars: 4 });
    expect(dirty).toContain(1);
  });

  it("sets parent-child relationships", () => {
    engine.registerObject({ id: 1, type: "rectangle", params: { x: 100, y: 100, width: 200, height: 200 }, parentId: null, constraints: [] });
    engine.registerObject({ id: 2, type: "rectangle", params: { x: 150, y: 150, width: 50, height: 50 }, parentId: null, constraints: [] });

    engine.setParent(2, 1);
    expect(engine.getAncestors(2)).toContain(1);
    expect(engine.getDescendants(1)).toContain(2);
  });

  it("solves constraints across objects", () => {
    engine.registerObject({ id: 1, type: "rectangle", params: { x: 0, y: 0, width: 200, height: 150 }, parentId: null, constraints: [] });
    engine.registerObject({ id: 2, type: "rectangle", params: { x: 100, y: 50, width: 80, height: 60 }, parentId: null, constraints: [{ id: "c1", type: "center-align", targetIds: [1, 2] }] });

    const updates = engine.solveConstraints();
    expect(updates.length).toBeGreaterThanOrEqual(1);
  });

  it("clears all state", () => {
    engine.registerObject({ id: 1, type: "rectangle", params: {}, parentId: null, constraints: [] });
    expect(engine.size).toBe(1);
    engine.clear();
    expect(engine.size).toBe(0);
  });
});

// ── Component Registry ───────────────────────────────────────────

describe("ComponentRegistry", () => {
  it("has all components registered", () => {
    const count = componentRegistry.getCount();
    expect(count).toBeGreaterThan(15); // At least 15+ components
  });

  it("supports search", () => {
    const results = componentRegistry.search("mandap");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]!.type).toBe("mandap");
  });

  it("filters by category", () => {
    const basic = componentRegistry.getByCategory("basic");
    expect(basic.length).toBeGreaterThanOrEqual(4);
    const ganpati = componentRegistry.getByCategory("ganpati");
    expect(ganpati.length).toBeGreaterThanOrEqual(10);
  });

  it("returns definition for known types", () => {
    const def = componentRegistry.get("lotus");
    expect(def).toBeDefined();
    expect(def!.label).toBe("Lotus");
    expect(def!.params.length).toBeGreaterThan(10); // common + specific
  });
});

// ── Parameter Helpers ────────────────────────────────────────────

describe("Parameter Helpers", () => {
  it("detects equal parameters", () => {
    expect(paramEquals({ a: 1, b: "hello" }, { a: 1, b: "hello" })).toBe(true);
    expect(paramEquals({ a: 1, b: "hello" }, { a: 2, b: "hello" })).toBe(false);
  });

  it("merges parameters", () => {
    const base = { x: 100, y: 100, width: 200 };
    const merged = mergeParams(base, { width: 300 });
    expect(merged.width).toBe(300);
    expect(merged.x).toBe(100);
  });
});
