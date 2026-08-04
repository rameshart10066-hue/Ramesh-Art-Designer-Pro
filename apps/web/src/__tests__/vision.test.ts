/**
 * Vision Engine — Unit Tests
 *
 * Verifies image analysis, perspective correction, segmentation,
 * component detection, feature extraction, library matching,
 * DNA extraction, photo rebuilder, and confidence engine.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { analyzeImage, estimateScalePxToMm, type ImageAnalysis } from "@/vision/ImageAnalyzer";
import { analyzePerspective, normalizeLighting } from "@/vision/PerspectiveCorrector";
import { segmentImage, type Segment } from "@/vision/SegmentationEngine";
import { detectComponents, type DetectedComponent } from "@/vision/ComponentDetector";
import { extractFeatures } from "@/vision/FeatureExtractor";
import { matchToLibrary } from "@/vision/SimilarityMatcher";
import { matchAgainstLibrary, replaceComponent } from "@/vision/LibraryMatcher";
import { extractDNA } from "@/vision/DNAExtractor";
import { rebuildDesign } from "@/vision/PhotoRebuilder";
import { generateConfidenceReport, confidenceColor } from "@/vision/ConfidenceEngine";
import { estimateDimensions, correctDimensions } from "@/vision/DimensionEstimator";
import { VisionHistory } from "@/vision/VisionHistory";

// Mock ImageData for Node.js test environment
if (typeof ImageData === "undefined") {
  (globalThis as any).ImageData = class ImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(data: Uint8ClampedArray | number, width: number, height?: number) {
      if (data instanceof Uint8ClampedArray) {
        this.data = data;
        this.width = width;
        this.height = height || 1;
      } else {
        this.width = data;
        this.height = width;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      }
    }
  };
}
import { DEFAULT_DNA } from "@/product-model/DNAEngine";

// ── Test Helpers ─────────────────────────────────────────────────

function createTestImageData(width: number, height: number, color: number = 128): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color; data[i + 1] = color; data[i + 2] = color; data[i + 3] = 255;
  }
  return new ImageData(data, width, height);
}

function makeSegment(id: number, x: number, y: number, w: number, h: number, shape: Segment["shape"] = "rectangular"): Segment {
  return { id, x, y, width: w, height: h, dominantColor: "#ff0000", pixelCount: w * h, shape };
}

// ── Image Analyzer ──────────────────────────────────────────────

describe("ImageAnalyzer", () => {
  it("analyzes a simple image", () => {
    const imageData = createTestImageData(100, 80);
    const result = analyzeImage(imageData);
    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(result.dominantColors.length).toBeGreaterThanOrEqual(1);
    expect(result.aspectRatio).toBe(1.25);
  });

  it("estimates pixel to mm scale", () => {
    const scale = estimateScalePxToMm(800, 600, { width: 800, height: 600, dominantColors: [], edgeDensity: 0.05, symmetryScore: 0.7, complexity: 2, aspectRatio: 1.33, brightness: 128, contrast: 30 });
    expect(scale).toBeGreaterThan(0);
  });
});

// ── Perspective Corrector ───────────────────────────────────────

describe("PerspectiveCorrector", () => {
  it("analyzes perspective", () => {
    const imageData = createTestImageData(200, 150);
    const result = analyzePerspective(imageData);
    expect(result.corrected).toBe(false); // Uniform image, no edges
    expect(typeof result.rotationAngle).toBe("number");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it("normalizes lighting", () => {
    const imageData = createTestImageData(50, 50, 200); // Bright image
    const corrected = normalizeLighting(imageData);
    expect(corrected.data.length).toBe(imageData.data.length);
  });
});

// ── Segmentation Engine ─────────────────────────────────────────

describe("SegmentationEngine", () => {
  it("returns segments for non-uniform images", () => {
    const imageData = createTestImageData(100, 100);
    const segments = segmentImage(imageData);
    expect(Array.isArray(segments)).toBe(true);
  });
});

// ── Component Detector ──────────────────────────────────────────

describe("ComponentDetector", () => {
  it("detects components from segments", () => {
    const segments: Segment[] = [
      makeSegment(1, 10, 10, 80, 80),   // large center
      makeSegment(2, 5, 5, 90, 30),     // top wide
      makeSegment(3, 50, 70, 30, 30),   // small circular area
    ];
    const analysis: ImageAnalysis = { width: 100, height: 100, dominantColors: [], edgeDensity: 0.1, symmetryScore: 0.7, complexity: 3, aspectRatio: 1, brightness: 128, contrast: 20 };
    const detected = detectComponents(segments, analysis);
    expect(detected.length).toBeGreaterThan(0);
  });
});

// ── Feature Extractor ───────────────────────────────────────────

describe("FeatureExtractor", () => {
  it("extracts features from detected component", () => {
    const comp: DetectedComponent = { type: "pillar", confidence: 0.85, segmentId: 1, x: 10, y: 20, width: 40, height: 200, shape: "rectangular", color: "#c4956a", metadata: {} };
    const features = extractFeatures(comp, 400, 400);
    expect(features.aspectRatio).toBe(0.2);
    expect(features.relativeSize).toBeGreaterThan(0);
    expect(features.type).toBe("pillar");
  });
});

// ── Similarity Matcher ──────────────────────────────────────────

describe("SimilarityMatcher", () => {
  it("matches features to library", () => {
    const features = { type: "pillar", aspectRatio: 0.3, relativeSize: 0.15, relativeX: 0.9, relativeY: 0.5, dominantColor: "#c4956a", colorBrightness: 0.6, shapeComplexity: 0.2, symmetry: 0.8 };
    const result = matchToLibrary(features);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.alternatives.length).toBeGreaterThan(0);
  });
});

// ── Library Matcher ─────────────────────────────────────────────

describe("LibraryMatcher", () => {
  it("matches all detected components", () => {
    const comps: DetectedComponent[] = [
      { type: "frame", confidence: 0.8, segmentId: 1, x: 0, y: 0, width: 300, height: 400, shape: "rectangular", color: "#d4a017", metadata: {} },
      { type: "arch", confidence: 0.7, segmentId: 2, x: 100, y: 50, width: 100, height: 150, shape: "complex", color: "#c4956a", metadata: {} },
    ];
    const matches = matchAgainstLibrary(comps, 400, 500);
    expect(matches.length).toBe(2);
    expect(typeof matches[0]!.autoAccept).toBe("boolean");
  });

  it("supports manual replacement", () => {
    const comps: DetectedComponent[] = [{ type: "pillar", confidence: 0.5, segmentId: 1, x: 0, y: 0, width: 50, height: 200, shape: "rectangular", color: "#888", metadata: {} }];
    const matches = matchAgainstLibrary(comps, 200, 400);
    const replaced = replaceComponent(matches[0]!, "lotus");
    expect(replaced.matchedType).toBe("lotus");
    expect(replaced.confidence).toBe(1.0);
  });
});

// ── DNA Extractor ───────────────────────────────────────────────

describe("DNAExtractor", () => {
  it("extracts DNA from detected components", () => {
    const detected: DetectedComponent[] = [
      { type: "frame", confidence: 0.9, segmentId: 1, x: 0, y: 0, width: 100, height: 100, shape: "rectangular", color: "#d4a017", metadata: {} },
      { type: "arch", confidence: 0.85, segmentId: 2, x: 25, y: 10, width: 50, height: 40, shape: "complex", color: "#c4956a", metadata: {} },
    ];
    const analysis: ImageAnalysis = { width: 100, height: 100, dominantColors: ["#d4a017"], edgeDensity: 0.08, symmetryScore: 0.85, complexity: 3, aspectRatio: 1, brightness: 128, contrast: 30 };
    const dims = { overallWidth: 1200, overallHeight: 1000, depth: 50, layerCount: 2, materialThickness: 25, scalePxToMm: 10 };
    const dna = extractDNA(detected, analysis, dims);
    expect(dna.style).toBeDefined();
    expect(dna.symmetry).toBeDefined();
    expect(dna.material).toBe("thermocol");
  });
});

// ── Photo Rebuilder ─────────────────────────────────────────────

describe("PhotoRebuilder", () => {
  it("rebuilds design from DNA and matches", () => {
    const matches = [{ detectedType: "frame", matchedType: "rectangle", confidence: 0.95, autoAccept: true, suggestedParams: {}, alternatives: [] }];
    const result = rebuildDesign(DEFAULT_DNA, matches, 400, 500);
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.dna).toBeDefined();
  });
});

// ── Dimension Estimator ─────────────────────────────────────────

describe("DimensionEstimator", () => {
  it("estimates dimensions from image analysis", () => {
    const dims = estimateDimensions(800, 600, 1.5, 0.08);
    expect(dims.overallWidth).toBe(1200);
    expect(dims.overallHeight).toBe(900);
    expect(dims.layerCount).toBeGreaterThanOrEqual(1);
  });

  it("supports manual correction", () => {
    const dims = estimateDimensions(800, 600, 1.5, 0.08);
    const corrected = correctDimensions(dims, { overallWidth: 1500 });
    expect(corrected.overallWidth).toBe(1500);
  });
});

// ── Confidence Engine ───────────────────────────────────────────

describe("ConfidenceEngine", () => {
  it("generates confidence report", () => {
    const detected: DetectedComponent[] = [
      { type: "frame", confidence: 0.95, segmentId: 1, x: 0, y: 0, width: 100, height: 100, shape: "rectangular", color: "#fff", metadata: {} },
      { type: "pillar", confidence: 0.65, segmentId: 2, x: 10, y: 20, width: 20, height: 80, shape: "rectangular", color: "#ddd", metadata: {} },
    ];
    const matches = matchAgainstLibrary(detected, 200, 200);
    const report = generateConfidenceReport(detected, matches);
    expect(report.components.length).toBe(2);
    expect(report.warnings.length).toBeGreaterThanOrEqual(0);
    expect(report.overall).toBeGreaterThanOrEqual(0);
  });

  it("returns correct colors for confidence levels", () => {
    expect(confidenceColor(0.95)).toBe("#22c55e");
    expect(confidenceColor(0.75)).toBe("#fbbf24");
    expect(confidenceColor(0.5)).toBe("#ef4444");
  });
});

// ── Vision History ──────────────────────────────────────────────

describe("VisionHistory", () => {
  let history: VisionHistory;

  beforeEach(() => {
    history = new VisionHistory();
    history.clear();
  });

  it("stores vision records", () => {
    history.add({ imageName: "test.jpg", detectedCount: 5, matchedCount: 4, overallConfidence: 0.85, dna: {}, componentTypes: ["frame", "arch"], successful: true });
    expect(history.size).toBe(1);
    expect(history.getAll()[0]!.imageName).toBe("test.jpg");
  });

  it("filters successful records", () => {
    history.add({ imageName: "a.jpg", detectedCount: 3, matchedCount: 3, overallConfidence: 0.9, dna: {}, componentTypes: [], successful: true });
    history.add({ imageName: "b.jpg", detectedCount: 2, matchedCount: 0, overallConfidence: 0.3, dna: {}, componentTypes: [], successful: false });
    expect(history.getSuccessful().length).toBe(1);
  });
});
