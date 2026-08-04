/**
 * Sprint 10.1 — Vision Preprocessing Pipeline — Unit Tests
 *
 * Covers ImageLoader (pure helpers), ImageNormalizer, PerspectiveCorrection,
 * BackgroundRemoval, EdgeDetector, and ScaleEstimator.
 *
 * The pure modules operate on `PixelImage` (no DOM / no global ImageData), so
 * all tests run under the Node vitest environment without polyfills.
 */

import { describe, it, expect } from "vitest";
import type { PixelImage } from "@/vision/types";
import { isSupportedFile, isWhatsAppImage, computeDownscaledSize } from "@/vision/ImageLoader";
import { toGrayscale, normalizeContrast, adjustBrightness, adjustContrastFactor, improveImage } from "@/vision/ImageNormalizer";
import { estimateDeskewAngle, rotateImage, straightenImage, warpQuadToRect } from "@/vision/PerspectiveCorrection";
import { removeBackground } from "@/vision/BackgroundRemoval";
import { detectEdges } from "@/vision/EdgeDetector";
import {
  estimateScaleFromReference,
  estimateImageScale,
  estimateScalePxToMm,
  pixelsToMm,
  mmToPixels,
} from "@/vision/ScaleEstimator";

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

function setPixel(img: PixelImage, x: number, y: number, c: [number, number, number, number]): void {
  const i = (y * img.width + x) * 4;
  img.data[i] = c[0];
  img.data[i + 1] = c[1];
  img.data[i + 2] = c[2];
  img.data[i + 3] = c[3];
}

function getPixel(img: PixelImage, x: number, y: number): [number, number, number, number] {
  const i = (y * img.width + x) * 4;
  return [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!, img.data[i + 3]!];
}

/** Draw an axis-aligned rectangle. */
function fillRect(img: PixelImage, x0: number, y0: number, x1: number, y1: number, c: [number, number, number, number]): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x >= 0 && x < img.width && y >= 0 && y < img.height) setPixel(img, x, y, c);
    }
  }
}

/**
 * Draw a rectangle rotated `deg` (CCW) about the image center, blended onto a
 * white background with 4×4 supersampled anti-aliasing. Anti-aliased edges are
 * essential: a hard binary boundary produces staircased horizontal/vertical
 * steps that dominate a gradient-angle histogram, whereas real photos have
 * smooth diagonal edges.
 */
function fillRotatedRect(img: PixelImage, cx: number, cy: number, w: number, h: number, deg: number, c: [number, number, number, number]): void {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(-rad);
  const sin = Math.sin(-rad);
  const SS = 4; // supersampling factor per axis
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let inside = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          const dx = px - cx;
          const dy = py - cy;
          const rx = dx * cos - dy * sin;
          const ry = dx * sin + dy * cos;
          if (Math.abs(rx) <= w / 2 && Math.abs(ry) <= h / 2) inside++;
        }
      }
      const cov = inside / (SS * SS);
      if (cov > 0) {
        // Blend the white background with the shape color by coverage.
        setPixel(img, x, y, [
          Math.round(255 * (1 - cov) + c[0] * cov),
          Math.round(255 * (1 - cov) + c[1] * cov),
          Math.round(255 * (1 - cov) + c[2] * cov),
          Math.round(255 * (1 - cov) + c[3] * cov),
        ]);
      }
    }
  }
}

// ── ImageLoader (pure helpers) ───────────────────────────────────

describe("ImageLoader", () => {
  it("accepts supported MIME types and extensions", () => {
    expect(isSupportedFile({ type: "image/jpeg", name: "a.jpg" })).toBe(true);
    expect(isSupportedFile({ type: "image/png", name: "a.png" })).toBe(true);
    expect(isSupportedFile({ type: "image/webp", name: "a.webp" })).toBe(true);
    expect(isSupportedFile({ type: "application/pdf", name: "a.pdf" })).toBe(false);
    expect(isSupportedFile({ type: "", name: "IMG_1234.JPEG" })).toBe(true);
    expect(isSupportedFile({ type: "", name: "photo.HEIC" })).toBe(false);
  });

  it("detects WhatsApp / Android gallery photo names", () => {
    expect(isWhatsAppImage({ name: "IMG-20210101-WA0000.jpg" })).toBe(true);
    expect(isWhatsAppImage({ name: "WhatsApp Image 2021-01-01 at 12.00.00.jpeg" })).toBe(true);
    expect(isWhatsAppImage({ name: "IMG_20210101_123456.jpg" })).toBe(true);
    expect(isWhatsAppImage({ name: "vacation.jpg" })).toBe(false);
  });

  it("computes downscaled size, capping the longer edge", () => {
    expect(computeDownscaledSize(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(computeDownscaledSize(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
    expect(computeDownscaledSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(computeDownscaledSize(0, 0, 1600)).toEqual({ width: 1, height: 1 });
  });
});

// ── ImageNormalizer ──────────────────────────────────────────────

describe("ImageNormalizer", () => {
  it("converts a red pixel to its luminance gray value", () => {
    const img = makeImage(1, 1, [255, 0, 0, 255]);
    const gray = toGrayscale(img);
    expect(getPixel(gray, 0, 0)[0]).toBe(Math.round(0.299 * 255));
    expect(getPixel(gray, 0, 0)[3]).toBe(255);
  });

  it("preserves alpha during grayscale conversion", () => {
    const img = makeImage(2, 2, [10, 20, 30, 128]);
    const gray = toGrayscale(img);
    expect(getPixel(gray, 0, 0)[3]).toBe(128);
  });

  it("normalizes contrast with min/max percentiles", () => {
    const img = makeImage(10, 10, [30, 30, 30, 255]);
    fillRect(img, 0, 0, 9, 4, [225, 225, 225, 255]); // top half bright
    const out = normalizeContrast(img, { lowPercentile: 0, highPercentile: 100 });
    expect(getPixel(out, 1, 6)[0]).toBeLessThanOrEqual(2); // dark → ~0
    expect(getPixel(out, 1, 1)[0]).toBeGreaterThanOrEqual(253); // bright → ~255
  });

  it("adjusts brightness with clamping", () => {
    const img = makeImage(1, 1, [100, 100, 100, 255]);
    expect(getPixel(adjustBrightness(img, 50), 0, 0)[0]).toBe(150);
    expect(getPixel(adjustBrightness(img, -200), 0, 0)[0]).toBe(0);
    expect(getPixel(adjustBrightness(img, 300), 0, 0)[0]).toBe(255);
  });

  it("adjusts contrast factor around 128", () => {
    const img = makeImage(1, 1, [100, 100, 100, 255]);
    expect(getPixel(adjustContrastFactor(img, 2), 0, 0)[0]).toBe(72);
    const mid = makeImage(1, 1, [128, 128, 128, 255]);
    expect(getPixel(adjustContrastFactor(mid, 2), 0, 0)[0]).toBe(128);
  });

  it("improveImage preserves dimensions and alpha", () => {
    const img = makeImage(8, 8, [120, 120, 120, 200]);
    const out = improveImage(img);
    expect(out.width).toBe(8);
    expect(out.height).toBe(8);
    expect(getPixel(out, 0, 0)[3]).toBe(200);
  });
});

// ── PerspectiveCorrection ────────────────────────────────────────

describe("PerspectiveCorrection", () => {
  it("rotates a solid image by 90° with correct bounds", () => {
    const img = makeImage(10, 6, [200, 0, 0, 255]);
    const rotated = rotateImage(img, 90);
    expect(rotated.width).toBe(6);
    expect(rotated.height).toBe(10);
    expect(getPixel(rotated, 0, 0)[0]).toBe(200);
    expect(getPixel(rotated, 5, 9)[3]).toBe(255);
  });

  it("returns a copy for a ~0 rotation", () => {
    const img = makeImage(4, 4, [10, 20, 30, 255]);
    const rotated = rotateImage(img, 0);
    expect(rotated.data).toEqual(img.data);
  });

  it("estimates the deskew angle of a +5° tilted rectangle", () => {
    const img = makeImage(100, 100, [255, 255, 255, 255]);
    fillRotatedRect(img, 50, 50, 60, 40, 5, [0, 0, 0, 255]);
    const angle = estimateDeskewAngle(img);
    expect(angle).toBeGreaterThanOrEqual(-6);
    expect(angle).toBeLessThanOrEqual(-4);
  });

  it("straightens a tilted rectangle", () => {
    const img = makeImage(100, 100, [255, 255, 255, 255]);
    fillRotatedRect(img, 50, 50, 60, 40, -5, [0, 0, 0, 255]);
    const { angle } = straightenImage(img);
    expect(angle).toBeGreaterThanOrEqual(4);
    expect(angle).toBeLessThanOrEqual(6);
  });

  it("returns 0 when the image has no edges", () => {
    const img = makeImage(20, 20, [128, 128, 128, 255]);
    expect(estimateDeskewAngle(img)).toBe(0);
  });

  it("warpQuadToRect is identity for a full-image quad", () => {
    const img = makeImage(20, 20, [255, 255, 255, 255]);
    setPixel(img, 2, 2, [200, 0, 0, 255]);
    const quad = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 20, y: 0 },
      bottomRight: { x: 20, y: 20 },
      bottomLeft: { x: 0, y: 20 },
    };
    const out = warpQuadToRect(img, quad, 20, 20);
    expect(out.width).toBe(20);
    expect(out.height).toBe(20);
    expect(getPixel(out, 2, 2)[0]).toBe(200);
  });

  it("warpQuadToRect throws on a degenerate quad", () => {
    const img = makeImage(20, 20, [255, 255, 255, 255]);
    const degenerate = {
      topLeft: { x: 5, y: 5 },
      topRight: { x: 5, y: 5 },
      bottomRight: { x: 5, y: 5 },
      bottomLeft: { x: 5, y: 5 },
    };
    expect(() => warpQuadToRect(img, degenerate, 20, 20)).toThrow();
  });

  it("warpQuadToRect rejects non-positive destination size", () => {
    const img = makeImage(20, 20, [255, 255, 255, 255]);
    const quad = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 20, y: 0 },
      bottomRight: { x: 20, y: 20 },
      bottomLeft: { x: 0, y: 20 },
    };
    expect(() => warpQuadToRect(img, quad, 0, 20)).toThrow();
  });
});

// ── BackgroundRemoval ────────────────────────────────────────────

describe("BackgroundRemoval", () => {
  it("removes a uniform white background, keeping the foreground", () => {
    const img = makeImage(30, 30, [255, 255, 255, 255]);
    fillRect(img, 10, 10, 19, 19, [200, 20, 20, 255]); // red center square
    const { image, removedPixelRatio } = removeBackground(img, { tolerance: 40, feather: 0 });

    expect(getPixel(image, 1, 1)[3]).toBe(0); // white corner → transparent
    expect(getPixel(image, 15, 15)[3]).toBe(255); // red center → kept
    expect(getPixel(image, 15, 15)[0]).toBe(200);
    expect(removedPixelRatio).toBeGreaterThan(0);
    expect(removedPixelRatio).toBeLessThan(1);
  });

  it("reports the estimated background colors", () => {
    const img = makeImage(10, 10, [200, 200, 200, 255]);
    const { backgroundColors } = removeBackground(img, { feather: 0 });
    expect(backgroundColors.length).toBeGreaterThanOrEqual(1);
    const bg = backgroundColors[0]!;
    expect(Math.abs(bg.r - 200)).toBeLessThanOrEqual(5);
    expect(Math.abs(bg.g - 200)).toBeLessThanOrEqual(5);
    expect(Math.abs(bg.b - 200)).toBeLessThanOrEqual(5);
  });
});

// ── EdgeDetector ─────────────────────────────────────────────────

describe("EdgeDetector", () => {
  it("detects a strong vertical edge", () => {
    const img = makeImage(20, 20, [255, 255, 255, 255]);
    fillRect(img, 9, 0, 11, 19, [0, 0, 0, 255]); // 3px black bar
    const result = detectEdges(img, { threshold: 50, step: 1 });

    expect(result.edgePixelCount).toBeGreaterThan(0);
    expect(result.edgeDensity).toBeGreaterThan(0);
    expect(result.edgeDensity).toBeLessThanOrEqual(1);
    // Strength near the left boundary of the bar is high.
    const strength = getPixel(result.strength, 8, 10)[0];
    expect(strength).toBeGreaterThan(50);
    // Non-edge area has near-zero strength.
    expect(getPixel(result.strength, 0, 0)[0]).toBe(0);
    // Binary mask keeps alpha for edge pixels.
    expect(getPixel(result.binary, 8, 10)[3]).toBe(255);
  });

  it("reports no edges for a uniform image", () => {
    const img = makeImage(10, 10, [128, 128, 128, 255]);
    const result = detectEdges(img, { threshold: 50, step: 1 });
    expect(result.edgePixelCount).toBe(0);
    expect(result.edgeDensity).toBe(0);
  });
});

// ── ScaleEstimator ───────────────────────────────────────────────

describe("ScaleEstimator", () => {
  it("computes mm-per-pixel from a known reference", () => {
    const scale = estimateScaleFromReference(1000, 1200);
    expect(scale.mmPerPixel).toBeCloseTo(1.2, 5);
    expect(scale.pixelPerMm).toBeCloseTo(1 / 1.2, 5);
    expect(scale.referenceWidthMm).toBe(1200);
  });

  it("estimates physical dimensions for an image", () => {
    const img = makeImage(1000, 500, [0, 0, 0, 255]);
    const scale = estimateImageScale(img, 1200);
    expect(scale.estimatedWidthMm).toBe(1200);
    expect(scale.estimatedHeightMm).toBe(600);
  });

  it("provides the heuristic fallback and unit conversions", () => {
    expect(estimateScalePxToMm(1000, 1200)).toBeCloseTo(1.2, 5);
    expect(estimateScalePxToMm(0)).toBe(0);
    expect(pixelsToMm(100, 2)).toBe(200);
    expect(mmToPixels(200, 2)).toBe(100);
    expect(mmToPixels(100, 0)).toBe(0);
  });

  it("rejects invalid reference inputs", () => {
    expect(() => estimateScaleFromReference(0, 1200)).toThrow();
    expect(() => estimateScaleFromReference(1000, 0)).toThrow();
  });
});
