/**
 * Sprint 10.3 — Component Matching — Unit Tests
 *
 * Covers ComponentMatcher: registry search, primary/alternative matches,
 * confidence, auto-accept at ≥90%, draft creation below 90%, and manual
 * replacement.
 */

import { describe, it, expect } from "vitest";
import type { DetectedComponent } from "@/vision/ComponentDetector";
import {
  matchComponent,
  matchComponents,
  replaceMatch,
  createDraftComponent,
  draftToComponentDef,
  AUTO_ACCEPT_THRESHOLD,
} from "@/vision/ComponentMatcher";

function makeDetected(overrides: Partial<DetectedComponent>): DetectedComponent {
  return {
    type: "pillar",
    confidence: 1,
    segmentId: 1,
    x: 10,
    y: 20,
    width: 80,
    height: 400,
    center: { x: 50, y: 220 },
    boundingBox: { x: 10, y: 20, width: 80, height: 400 },
    shape: "tall-rect",
    color: "#c4956a",
    area: 32000,
    fillRatio: 1,
    metadata: {},
    ...overrides,
  };
}

describe("ComponentMatcher", () => {
  it("auto-accepts a confident, geometrically matching pillar", () => {
    const match = matchComponent(makeDetected({}));
    expect(match.autoAccept).toBe(true);
    expect(match.confidence).toBeGreaterThanOrEqual(AUTO_ACCEPT_THRESHOLD);
    expect(match.primary.label).toBe("Pillar (Classic)");
    expect(match.isDraft).toBe(false);
    expect(match.draft).toBeNull();
  });

  it("returns alternatives for the primary match", () => {
    const match = matchComponent(makeDetected({}));
    expect(match.alternatives.length).toBeGreaterThan(0);
    expect(match.alternatives.map((a) => a.label)).toContain("Pillar (Fluted)");
  });

  it("creates a draft when confidence is below 90%", () => {
    const match = matchComponent(
      makeDetected({
        type: "bell",
        segmentId: 2,
        x: 50,
        y: 10,
        width: 30,
        height: 200,
        center: { x: 65, y: 110 },
        boundingBox: { x: 50, y: 10, width: 30, height: 200 },
        confidence: 0.4,
        shape: "tall-rect",
        color: "#d4a017",
        area: 6000,
      }),
    );

    expect(match.confidence).toBeLessThan(AUTO_ACCEPT_THRESHOLD);
    expect(match.isDraft).toBe(true);
    expect(match.draft).not.toBeNull();
    expect(match.draft!.sourceType).toBe("bell");
    expect(match.draft!.suggested.width).toBe(30);
    expect(match.draft!.suggested.height).toBe(200);
    expect(match.draft!.primaryHint).not.toBeNull();
    expect(match.draft!.primaryHint!.label).toBe("Temple Bell");
  });

  it("matches a square frame to a frame registry variant", () => {
    const match = matchComponent(
      makeDetected({
        type: "frame",
        segmentId: 3,
        x: 5,
        y: 5,
        width: 90,
        height: 90,
        center: { x: 50, y: 50 },
        boundingBox: { x: 5, y: 5, width: 90, height: 90 },
        shape: "ring",
        color: "#d4a017",
        area: 4000,
        fillRatio: 0.49,
      }),
    );
    expect(match.autoAccept).toBe(true);
    expect(match.primary.tags).toContain("frame");
  });

  it("manually replaces the primary with an alternative", () => {
    const match = matchComponent(makeDetected({}));
    const fluted = match.alternatives.find((a) => a.label === "Pillar (Fluted)")!;

    const replaced = replaceMatch(match, fluted);
    expect(replaced.primary.label).toBe("Pillar (Fluted)");
    expect(replaced.confidence).toBe(1);
    expect(replaced.autoAccept).toBe(true);
    expect(replaced.isDraft).toBe(false);
    expect(replaced.draft).toBeNull();
    // The previous primary becomes an alternative.
    expect(replaced.alternatives.map((a) => a.label)).toContain("Pillar (Classic)");
  });

  it("matchComponents skips the background detection", () => {
    const bg = makeDetected({
      type: "background",
      segmentId: 0,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      center: { x: 50, y: 50 },
      boundingBox: { x: 0, y: 0, width: 100, height: 100 },
      shape: "complex",
      color: "#64748b",
    });
    const matches = matchComponents([makeDetected({}), bg]);
    expect(matches).toHaveLength(1);
    expect(matches[0]!.detected.type).toBe("pillar");
  });

  it("createDraftComponent and draftToComponentDef round-trip", () => {
    const detected = makeDetected({
      type: "om",
      segmentId: 9,
      width: 20,
      height: 20,
      boundingBox: { x: 0, y: 0, width: 20, height: 20 },
      color: "#d4a017",
    });
    const draft = createDraftComponent(detected, null);
    expect(draft.label).toBe("Draft om");

    const def = draftToComponentDef(draft);
    expect(def.type).toBe("om");
    expect(def.defaultWidth).toBe(20);
    expect(def.defaultHeight).toBe(20);
    expect(def.tags).toContain("draft");
  });
});
