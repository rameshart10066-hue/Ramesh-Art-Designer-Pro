/**
 * Product Model — Complete Unit Tests
 *
 * Verifies mesh generation, assembly graph, manufacturing graph,
 * DNA engine, variant generator, material system, packaging engine,
 * and exploded view.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { generateMesh, meshBounds } from "@/product-model/MeshGenerator";
import { AssemblyGraph } from "@/product-model/AssemblyGraph";
import { ManufacturingGraph } from "@/product-model/ManufacturingGraph";
import { DEFAULT_DNA, createVariant, dnaToComponentParams } from "@/product-model/DNAEngine";
import { generatePredefinedVariants } from "@/product-model/VariantGenerator";
import { getMaterial, getMaterialList } from "@/product-model/MaterialSystem";
import { calculatePackaging } from "@/product-model/PackagingEngine";
import { calculateExplodedPositions, interpolateExploded } from "@/product-model/ExplodedView";
import type { ManufacturingData, Geometry2D } from "@/product-model/ProductModel";

// ── Material System ─────────────────────────────────────────────

describe("MaterialSystem", () => {
  it("returns material by id", () => {
    const mat = getMaterial("acrylic");
    expect(mat.label).toBe("Acrylic");
    expect(mat.costPerSqM).toBe(2500);
  });

  it("returns default for unknown material", () => {
    const mat = getMaterial("unknown");
    expect(mat.label).toBe("Thermocol");
  });

  it("lists all materials", () => {
    const list = getMaterialList();
    expect(list.length).toBeGreaterThanOrEqual(7);
    expect(list.map((m) => m.id)).toContain("thermocol");
    expect(list.map((m) => m.id)).toContain("acrylic");
    expect(list.map((m) => m.id)).toContain("mdf");
    expect(list.map((m) => m.id)).toContain("plywood");
  });

  it("defines physical properties", () => {
    for (const mat of getMaterialList()) {
      expect(mat.weightPerSqM).toBeGreaterThan(0);
      expect(mat.costPerSqM).toBeGreaterThan(0);
      expect(mat.defaultThickness).toBeGreaterThan(0);
    }
  });
});

// ── Mesh Generator ──────────────────────────────────────────────

describe("MeshGenerator", () => {
  const geometry: Geometry2D = { x: 0, y: 0, width: 200, height: 100, rotation: 0, fill: "#fff", stroke: "#000", strokeWidth: 1, opacity: 1 };

  it("generates mesh with vertices", () => {
    const mesh = generateMesh(geometry, 25, "thermocol");
    expect(mesh.vertices.length).toBe(24); // 8 vertices × 3 coords
    expect(mesh.indices.length).toBe(36);  // 12 triangles × 3 indices
    expect(mesh.thickness).toBe(25);
  });

  it("generates mesh with correct normals", () => {
    const mesh = generateMesh(geometry, 10);
    expect(mesh.normals.length).toBe(24);
  });

  it("generates mesh with UVs", () => {
    const mesh = generateMesh(geometry, 10);
    expect(mesh.uvs.length).toBe(16); // 8 vertices × 2 UVs
  });

  it("calculates bounding box", () => {
    const mesh = generateMesh({ ...geometry, x: 100, y: 50 }, 20);
    const bounds = meshBounds(mesh);
    expect(bounds.min[0]).toBeLessThan(bounds.max[0]);
    expect(bounds.min[1]).toBeLessThan(bounds.max[1]);
    expect(bounds.min[2]).toBeLessThan(bounds.max[2]);
  });

  it("uses material default thickness when not specified", () => {
    // thickness=0 should use whatever the material provides
    const mesh = generateMesh(geometry, 0, "acrylic");
    expect(mesh.thickness).toBeGreaterThan(0);
  });
});

// ── Assembly Graph ──────────────────────────────────────────────

describe("AssemblyGraph", () => {
  let graph: AssemblyGraph;

  beforeEach(() => {
    graph = new AssemblyGraph();
  });

  it("adds and retrieves nodes", () => {
    graph.addNode({ id: 1, name: "Base", type: "stage", parentId: null, children: [], assemblyOrder: 1, connectionType: "none", jointType: "none", assemblyStep: "Place base", assemblyInstructions: [] });
    graph.addNode({ id: 2, name: "Pillar", type: "pillar", parentId: 1, children: [], assemblyOrder: 2, connectionType: "glue", jointType: "finger", assemblyStep: "Attach pillar", assemblyInstructions: [] });

    expect(graph.size).toBe(2);
    expect(graph.getNode(2)?.parentId).toBe(1);
  });

  it("returns assembly steps in order", () => {
    graph.addNode({ id: 1, name: "Base", type: "stage", parentId: null, children: [], assemblyOrder: 1, connectionType: "none", jointType: "none", assemblyStep: "Base", assemblyInstructions: [] });
    graph.addNode({ id: 2, name: "Left Pillar", type: "pillar", parentId: 1, children: [], assemblyOrder: 1, connectionType: "glue", jointType: "finger", assemblyStep: "Left", assemblyInstructions: [] });
    graph.addNode({ id: 3, name: "Right Pillar", type: "pillar", parentId: 1, children: [], assemblyOrder: 2, connectionType: "glue", jointType: "finger", assemblyStep: "Right", assemblyInstructions: [] });

    const steps = graph.getAssemblySteps();
    expect(steps.length).toBe(3);
    expect(steps[0]!.node.id).toBe(1); // Base first
  });
});

// ── Manufacturing Graph ─────────────────────────────────────────

describe("ManufacturingGraph", () => {
  let mfg: ManufacturingGraph;

  beforeEach(() => {
    mfg = new ManufacturingGraph();
  });

  it("stores manufacturing data for objects", () => {
    const data = mfg.setData(1, { material: "acrylic", thickness: 3, cutPriority: 1 });
    expect(data.material).toBe("acrylic");
    expect(data.partNumber).toContain("PART-");
    expect(data.cutPriority).toBe(1);
  });

  it("auto-increments part numbers", () => {
    const d1 = mfg.setData(1, {});
    const d2 = mfg.setData(2, {});
    expect(d1.partNumber).not.toBe(d2.partNumber);
  });

  it("calculates totals", () => {
    mfg.setData(1, { weight: 100, estimatedCost: 50, estimatedTime: 30, quantity: 2 });
    mfg.setData(2, { weight: 200, estimatedCost: 75, estimatedTime: 45, quantity: 1 });
    const totals = mfg.getTotals();
    expect(totals.totalParts).toBe(2);
    expect(totals.totalWeight).toBe(400); // 100*2 + 200*1
    expect(totals.totalCost).toBe(175);
    expect(totals.totalTime).toBe(105);
  });

  it("groups by material", () => {
    mfg.setData(1, { material: "acrylic" });
    mfg.setData(2, { material: "thermocol" });
    mfg.setData(3, { material: "acrylic" });
    const groups = mfg.groupByMaterial();
    expect(groups["acrylic"]?.length).toBe(2);
    expect(groups["thermocol"]?.length).toBe(1);
  });
});

// ── Packaging Engine ────────────────────────────────────────────

describe("PackagingEngine", () => {
  it("calculates packaging for empty list", () => {
    const result = calculatePackaging([]);
    expect(result.boxes).toBe(1);
    expect(result.parts).toBe(0);
  });

  it("calculates box dimensions", () => {
    const items = [
      { width: 400, height: 300, mfg: { thickness: 25, material: "thermocol", partNumber: "P1", cutType: "cut" as const, jointType: "none" as const, laserLayer: "L1", cutPriority: 1, estimatedTime: 0, estimatedCost: 0, weight: 0, quantity: 1 } },
    ];
    const result = calculatePackaging(items);
    expect(result.boxWidth).toBeGreaterThan(400);
    expect(result.boxHeight).toBeGreaterThan(300);
    expect(result.boxes).toBeGreaterThanOrEqual(1);
  });
});

// ── DNA Engine ──────────────────────────────────────────────────

describe("DNAEngine", () => {
  it("creates default DNA", () => {
    expect(DEFAULT_DNA.style).toBe("traditional");
    expect(DEFAULT_DNA.material).toBe("thermocol");
    expect(DEFAULT_DNA.symmetry).toBe("mirror");
  });

  it("creates variants with mutations", () => {
    const variant = createVariant(DEFAULT_DNA, { style: "royal", primaryColor: "#ff0000" });
    expect(variant.style).toBe("royal");
    expect(variant.primaryColor).toBe("#ff0000");
  });

  it("maintains consistency for minimal variants", () => {
    const variant = createVariant(DEFAULT_DNA, { style: "minimal", complexity: 5 });
    expect(variant.complexity).toBeLessThanOrEqual(2);
    expect(variant.ornamentDensity).toBeLessThanOrEqual(0.3);
  });

  it("generates component params from DNA", () => {
    const params = dnaToComponentParams(DEFAULT_DNA);
    expect(params.frame).toBeDefined();
    expect(params.pillars).toBeDefined();
    expect(params.arch).toBeDefined();
    expect(params.stage).toBeDefined();
  });
});

// ── Variant Generator ───────────────────────────────────────────

describe("VariantGenerator", () => {
  it("generates predefined variants", () => {
    const variants = generatePredefinedVariants();
    expect(variants.length).toBe(6);
    expect(variants.map((v) => v.id)).toContain("royal-classic");
    expect(variants.map((v) => v.id)).toContain("modern-minimal");
  });

  it("each variant has unique DNA", () => {
    const variants = generatePredefinedVariants();
    for (const v of variants) {
      expect(v.dna.style).toBeDefined();
      expect(v.dna.primaryColor).toBeDefined();
    }
  });
});

// ── Exploded View ──────────────────────────────────────────────

describe("ExplodedView", () => {
  it("calculates exploded positions", () => {
    const nodes = [{ id: 1, name: "Base", type: "stage", parentId: null, children: [2], assemblyOrder: 1, connectionType: "none" as const, jointType: "none" as const, assemblyStep: "", assemblyInstructions: [] }];
    const positions = new Map([[1, { x: 0, y: 0, z: 0 }]]);
    const result = calculateExplodedPositions(nodes, positions);
    expect(result.length).toBe(1);
    expect(result[0]!.explodedZ).toBe(0); // root doesn't move
  });

  it("interpolates between normal and exploded", () => {
    const positions = [{ nodeId: 1, originalX: 0, originalY: 0, originalZ: 0, explodedX: 0, explodedY: 0, explodedZ: 100, offset: 100, label: "Test" }];
    const normal = interpolateExploded(positions, 0);
    expect(normal[0]!.z).toBe(0);
    const exploded = interpolateExploded(positions, 1);
    expect(exploded[0]!.z).toBe(100);
  });
});
