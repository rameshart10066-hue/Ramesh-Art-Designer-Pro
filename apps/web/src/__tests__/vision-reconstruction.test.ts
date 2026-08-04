/**
 * Sprint 10.4 — Editable CAD Reconstruction — Unit Tests
 *
 * Covers CADReconstructor: matches → editable parametric objects, Design DNA
 * generation, parent–child hierarchy, and mirror-symmetry maintenance.
 */

import { describe, it, expect } from "vitest";
import type { BaseObjectData, ObjectType } from "@/types/objects";
import { getComponentByType } from "@/services/editor/componentRegistry";
import type { ComponentMatch } from "@/vision/ComponentMatcher";
import type { DetectedComponent } from "@/vision/ComponentDetector";
import { reconstructFromMatches } from "@/vision/CADReconstructor";

// ── Test helpers ─────────────────────────────────────────────────

function makeDetected(
  type: DetectedComponent["type"],
  box: { x: number; y: number; width: number; height: number },
  confidence: number,
  color: string,
  segmentId: number,
): DetectedComponent {
  return {
    type,
    confidence,
    segmentId,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    center: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    boundingBox: box,
    shape: "rectangular",
    color,
    area: box.width * box.height,
    fillRatio: 1,
    metadata: {},
  };
}

function makeMatch(
  type: DetectedComponent["type"],
  box: { x: number; y: number; width: number; height: number },
  confidence: number,
  color: string,
  segmentId: number,
): ComponentMatch {
  const detected = makeDetected(type, box, confidence, color, segmentId);
  const primary = getComponentByType(
    type === "frame" ? "rectangle" : type === "stage" ? "base-platform" : type === "om" ? "om-symbol" : type,
  )!;
  return {
    detected,
    primary,
    confidence,
    autoAccept: confidence >= 0.9,
    alternatives: [],
    draft: null,
    isDraft: false,
  };
}

function allIds(objects: BaseObjectData[]): Set<number> {
  return new Set(objects.map((o) => o.id));
}

// ── Reconstruction ───────────────────────────────────────────────

describe("CADReconstructor", () => {
  it("builds editable parametric objects for every match", () => {
    const matches = [
      makeMatch("frame", { x: 5, y: 5, width: 90, height: 90 }, 0.95, "#d4a017", 1),
      makeMatch("pillar", { x: 15, y: 25, width: 10, height: 50 }, 0.9, "#c4956a", 2),
      makeMatch("pillar", { x: 75, y: 25, width: 10, height: 50 }, 0.9, "#c4956a", 3),
      makeMatch("arch", { x: 30, y: 10, width: 40, height: 30 }, 0.85, "#8b6914", 4),
      makeMatch("stage", { x: 20, y: 75, width: 60, height: 12 }, 0.9, "#6b5740", 5),
    ];
    const result = reconstructFromMatches(matches, 100, 100);

    expect(result.objects.length).toBe(5);
    const ids = allIds(result.objects);
    expect(ids.size).toBe(5); // unique ids

    for (const obj of result.objects) {
      expect(Number.isFinite(obj.x)).toBe(true);
      expect(Number.isFinite(obj.y)).toBe(true);
      expect(Number.isFinite(obj.width)).toBe(true);
      expect(Number.isFinite(obj.height)).toBe(true);
      expect(typeof obj.metadata).toBe("object");
      expect(obj.materialThickness).toBe(25);
      expect(obj.visible).toBe(true);
    }

    // Types map to renderable canvas objects.
    const byType = (t: string) => result.objects.filter((o) => o.type === t);
    expect(byType("rectangle").length).toBeGreaterThanOrEqual(1); // frame
    expect(byType("pillar").length).toBe(2);
    expect(byType("arch").length).toBe(1);
    expect(byType("base-platform").length).toBe(1);

    // ComponentDef default params are carried into metadata (editable).
    const frame = byType("rectangle")[0]!;
    expect(frame.metadata).toHaveProperty("borderWidth");
  });

  it("generates Design DNA reflecting the composition and colors", () => {
    const matches = [
      makeMatch("frame", { x: 5, y: 5, width: 90, height: 90 }, 0.95, "#d4a017", 1),
      makeMatch("pillar", { x: 15, y: 25, width: 10, height: 50 }, 0.9, "#c4956a", 2),
      makeMatch("arch", { x: 30, y: 10, width: 40, height: 30 }, 0.85, "#8b6914", 3),
      makeMatch("stage", { x: 20, y: 75, width: 60, height: 12 }, 0.9, "#6b5740", 4),
    ];
    const { dna } = reconstructFromMatches(matches, 100, 100);

    expect(dna.style).toBe("traditional");
    expect(dna.symmetry).toBe("mirror");
    expect(dna.primaryColor).toBe("#d4a017");
    expect(dna.secondaryColor).toBe("#c4956a");
    expect(dna.accentColor).toBe("#8b6914");
    expect(dna.frame).toBe("lotus-frame");
    expect(dna.pillar).toBe("classic");
    expect(dna.stage).toBe("3-tier");
  });

  it("builds a parent→child hierarchy by spatial containment", () => {
    const matches = [
      makeMatch("frame", { x: 5, y: 5, width: 90, height: 90 }, 0.95, "#d4a017", 1),
      makeMatch("pillar", { x: 15, y: 25, width: 10, height: 50 }, 0.9, "#c4956a", 2),
      makeMatch("pillar", { x: 75, y: 25, width: 10, height: 50 }, 0.9, "#c4956a", 3),
      makeMatch("stage", { x: 20, y: 75, width: 60, height: 12 }, 0.9, "#6b5740", 4),
    ];
    const { objects, hierarchy } = reconstructFromMatches(matches, 100, 100);
    const ids = allIds(objects);

    // Every parentId / children reference is valid.
    for (const o of objects) {
      if (o.parentId !== undefined) expect(ids.has(o.parentId)).toBe(true);
      for (const c of o.children) expect(ids.has(c)).toBe(true);
    }

    // The frame (rectangle container) is the root and holds the rest.
    const frame = objects.find((o) => o.type === "rectangle")!;
    expect(frame.children.length).toBeGreaterThanOrEqual(3);
    const pillars = objects.filter((o) => o.type === "pillar");
    for (const p of pillars) expect(p.parentId).toBe(frame.id);

    expect(hierarchy.length).toBeGreaterThan(0);
    const root = hierarchy[0]!;
    expect(root.children.length).toBeGreaterThanOrEqual(3);
  });

  it("maintains symmetry: detects a pillar pair as one group", () => {
    const matches = [
      makeMatch("frame", { x: 5, y: 5, width: 90, height: 90 }, 0.95, "#d4a017", 1),
      makeMatch("pillar", { x: 15, y: 25, width: 10, height: 50 }, 0.9, "#c4956a", 2),
      makeMatch("pillar", { x: 75, y: 25, width: 10, height: 50 }, 0.9, "#c4956a", 3),
    ];
    const { objects, symmetryGroups } = reconstructFromMatches(matches, 100, 100);

    // Frame centered + pillar pair centered about the axis → no mirrors.
    expect(objects.length).toBe(3);
    expect(symmetryGroups.length).toBe(1);
    const group = symmetryGroups[0]!;
    expect(group.type).toBe("pillar");
    expect(group.generated).toBe(false);
    expect(group.leftObjectId).not.toBe(group.rightObjectId);
  });

  it("generates a mirror partner for an unpaired off-center component", () => {
    const matches = [makeMatch("pillar", { x: 15, y: 25, width: 10, height: 50 }, 0.9, "#c4956a", 1)];
    const { objects, symmetryGroups } = reconstructFromMatches(matches, 100, 100);

    expect(objects.length).toBe(2);
    expect(symmetryGroups.length).toBe(1);
    expect(symmetryGroups[0]!.generated).toBe(true);

    const mirror = objects.find((o) => o.name.includes("Mirror"))!;
    expect(mirror).toBeDefined();
    expect(mirror.flipX).toBe(true);
    expect(mirror.metadata.symmetry.side).toBe("right");
  });

  it("carries draft component suggestions into the object", () => {
    const detected = makeDetected("lotus", { x: 45, y: 45, width: 10, height: 10 }, 0.6, "#f5c6ec", 9);
    const lotusDef = getComponentByType("lotus")!;
    const draftMatch: ComponentMatch = {
      detected,
      primary: lotusDef,
      confidence: 0.6,
      autoAccept: false,
      alternatives: [],
      draft: {
        id: "draft-lotus-9",
        sourceType: "lotus",
        label: "Draft lotus",
        detected,
        suggested: { width: 12, height: 12, aspectRatio: 1, fill: "#ffffff", stroke: "#000000" },
        primaryHint: lotusDef,
      },
      isDraft: true,
    };
    const { objects } = reconstructFromMatches([draftMatch], 100, 100);

    const lotus = objects[0]!;
    expect(lotus.type).toBe("lotus");
    expect(lotus.fill).toBe("#ffffff"); // from draft suggestion
    expect(lotus.metadata.vision.isDraft).toBe(true);
    expect(lotus.metadata.vision.draftLabel).toBe("Draft lotus");
  });

  it("handles an empty match list", () => {
    const result = reconstructFromMatches([], 100, 100);
    expect(result.objects).toHaveLength(0);
    expect(result.hierarchy).toHaveLength(0);
    expect(result.symmetryGroups).toHaveLength(0);
    expect(result.dna.style).toBe("minimal");
  });
});
