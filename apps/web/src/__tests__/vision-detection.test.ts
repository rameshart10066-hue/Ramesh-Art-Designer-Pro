/**
 * Sprint 10.2 — Component Detection — Unit Tests
 *
 * Covers ShapeClassifier, ObjectClassifier, and the ComponentDetector
 * image pipeline (bounding box + center + confidence + type, background).
 *
 * Runs under the Node vitest environment on synthetic `PixelImage` fixtures.
 */

import { describe, it, expect } from "vitest";
import type { PixelImage } from "@/vision/types";
import { classifyShape } from "@/vision/ShapeClassifier";
import { classifyObject, COMPONENT_TYPES, type ObjectFeatures } from "@/vision/ObjectClassifier";
import {
  detectComponentsFromImage,
  detectBackground,
  detectComponents,
  type DetectedComponent,
} from "@/vision/ComponentDetector";
import type { Segment } from "@/vision/SegmentationEngine";
import type { ImageAnalysis } from "@/vision/ImageAnalyzer";

// ── Test helpers ─────────────────────────────────────────────────

function makeImage(width: number, height: number, fill: [number, number, number, number]): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3];
  }
  return { width, height, data };
}

function fillRect(img: PixelImage, x0: number, y0: number, x1: number, y1: number, c: [number, number, number, number]): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x >= 0 && x < img.width && y >= 0 && y < img.height) {
        const i = (y * img.width + x) * 4;
        img.data[i] = c[0];
        img.data[i + 1] = c[1];
        img.data[i + 2] = c[2];
        img.data[i + 3] = c[3];
      }
    }
  }
}

function find(detections: DetectedComponent[], type: string): DetectedComponent | undefined {
  return detections.find((d) => d.type === type);
}

function features(partial: Partial<ObjectFeatures> & Pick<ObjectFeatures, "width" | "height" | "area" | "x" | "y" | "imageWidth" | "imageHeight">): ObjectFeatures {
  return {
    x: partial.x,
    y: partial.y,
    width: partial.width,
    height: partial.height,
    area: partial.area,
    imageWidth: partial.imageWidth,
    imageHeight: partial.imageHeight,
    aspectRatio: partial.width / Math.max(1, partial.height),
    fillRatio: partial.area / Math.max(1, partial.width * partial.height),
    shape: partial.shape ?? "circle",
    dominantColor: partial.dominantColor ?? "#334155",
    isLargest: partial.isLargest ?? false,
  };
}

// ── ShapeClassifier ──────────────────────────────────────────────

describe("ShapeClassifier", () => {
  it("classifies tall, wide, round, hollow, and dot shapes", () => {
    expect(classifyShape(10, 70, 700).shape).toBe("tall-rect");
    expect(classifyShape(70, 15, 1050).shape).toBe("wide-rect");
    expect(classifyShape(30, 30, 900).shape).toBe("circle"); // aspect 1, full
    expect(classifyShape(30, 30, 400).shape).toBe("ring"); // hollow
    expect(classifyShape(2, 2, 4).shape).toBe("dot");
  });

  it("reports aspect ratio and fill ratio", () => {
    const result = classifyShape(10, 70, 700);
    expect(result.aspectRatio).toBeCloseTo(0.143, 2);
    expect(result.fillRatio).toBeCloseTo(1, 2);
    const hollow = classifyShape(30, 30, 400);
    expect(hollow.fillRatio).toBeCloseTo(0.444, 2);
  });
});

// ── ObjectClassifier ─────────────────────────────────────────────

describe("ObjectClassifier", () => {
  it("exposes all 11 component types", () => {
    expect(COMPONENT_TYPES).toHaveLength(11);
    expect(COMPONENT_TYPES).toContain("background");
    expect(COMPONENT_TYPES).toContain("prabhavali");
    expect(COMPONENT_TYPES).toContain("om");
  });

  it("classifies a tall left-side shape as pillar", () => {
    const cls = classifyObject(
      features({ x: 10, y: 20, width: 10, height: 70, area: 700, imageWidth: 100, imageHeight: 100, shape: "tall-rect" }),
    );
    expect(cls.type).toBe("pillar");
    expect(cls.confidence).toBeGreaterThan(0.6);
  });

  it("classifies a wide bottom shape as stage", () => {
    const cls = classifyObject(
      features({ x: 20, y: 75, width: 70, height: 15, area: 1050, imageWidth: 100, imageHeight: 100, shape: "wide-rect", isLargest: true }),
    );
    expect(cls.type).toBe("stage");
    expect(cls.confidence).toBeGreaterThan(0.6);
  });

  it("classifies a large hollow rectangle as frame", () => {
    const cls = classifyObject(
      features({ x: 5, y: 5, width: 90, height: 90, area: 1800, imageWidth: 100, imageHeight: 100, shape: "ring", isLargest: true }),
    );
    expect(cls.type).toBe("frame");
  });

  it("classifies a small central shape as om", () => {
    const cls = classifyObject(
      features({ x: 47, y: 47, width: 6, height: 6, area: 36, imageWidth: 100, imageHeight: 100, shape: "circle" }),
    );
    expect(cls.type).toBe("om");
  });
});

// ── ComponentDetector (image pipeline) ───────────────────────────

describe("ComponentDetector", () => {
  it("detects pillar + stage + background from a synthetic image", () => {
    const img = makeImage(100, 100, [240, 240, 240, 255]);
    fillRect(img, 8, 20, 18, 85, [40, 40, 40, 255]); // tall pillar, left
    fillRect(img, 25, 78, 92, 92, [40, 40, 40, 255]); // wide stage, bottom

    const detections = detectComponentsFromImage(img);

    expect(detections.length).toBeGreaterThanOrEqual(3);

    const pillar = find(detections, "pillar");
    expect(pillar).toBeDefined();
    expect(pillar!.confidence).toBeGreaterThan(0.5);
    expect(pillar!.center).toBeDefined();
    expect(pillar!.boundingBox).toBeDefined();

    const stage = find(detections, "stage");
    expect(stage).toBeDefined();
    expect(stage!.confidence).toBeGreaterThan(0.5);

    // Background is reported last and covers the image extent.
    const background = detections[detections.length - 1]!;
    expect(background.type).toBe("background");
    expect(background.boundingBox).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });

  it("detects a small central om symbol", () => {
    const img = makeImage(100, 100, [240, 240, 240, 255]);
    fillRect(img, 47, 47, 52, 52, [40, 40, 40, 255]); // 6×6 center

    const detections = detectComponentsFromImage(img, { minArea: 20, step: 1 });
    const om = find(detections, "om");
    expect(om).toBeDefined();
    expect(om!.confidence).toBeGreaterThan(0.5);
  });

  it("detects a hollow rectangle as frame with a center", () => {
    const img = makeImage(100, 100, [240, 240, 240, 255]);
    // Draw a frame outline: border pixels dark, interior stays light.
    fillRect(img, 8, 8, 91, 91, [40, 40, 40, 255]); // outer ring
    fillRect(img, 16, 16, 83, 83, [240, 240, 240, 255]); // clear interior

    const detections = detectComponentsFromImage(img, { minArea: 60, step: 1 });
    const frame = find(detections, "frame");
    expect(frame).toBeDefined();
    expect(frame!.type).toBe("frame");
    expect(frame!.center).toBeDefined();
    expect(Math.abs(frame!.center!.x - 50)).toBeLessThanOrEqual(8);
  });

  it("detectBackground reports the backdrop extent", () => {
    const img = makeImage(80, 60, [200, 200, 200, 255]);
    const bg = detectBackground(img, []);
    expect(bg.type).toBe("background");
    expect(bg.boundingBox).toEqual({ x: 0, y: 0, width: 80, height: 60 });
    expect(bg.confidence).toBeGreaterThan(0);
  });

  it("legacy segments adapter still returns detections", () => {
    const segments: Segment[] = [
      { id: 1, x: 10, y: 10, width: 80, height: 80, dominantColor: "#ff0000", pixelCount: 6400, shape: "rectangular" },
      { id: 2, x: 5, y: 5, width: 90, height: 30, dominantColor: "#00ff00", pixelCount: 2700, shape: "rectangular" },
    ];
    const analysis: ImageAnalysis = {
      width: 100, height: 100, dominantColors: [], edgeDensity: 0.1,
      symmetryScore: 0.7, complexity: 3, aspectRatio: 1, brightness: 128, contrast: 20,
    };
    const detected = detectComponents(segments, analysis);
    expect(detected.length).toBeGreaterThan(0);
    expect(detected[0]).toHaveProperty("confidence");
  });
});
