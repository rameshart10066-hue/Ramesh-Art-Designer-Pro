/**
 * Edge Detector
 *
 * Sobel-gradient edge detection for preprocessed images. Produces a
 * grayscale edge-strength map, a binary edge mask, and edge statistics
 * (count + density) used by the pipeline for perspective correction and
 * scale hints.
 *
 * Pure functions over `PixelImage` — Node-testable, no DOM dependency.
 */

import type { PixelImage } from "./types";
import { createPixelImage } from "./types";
import { toGrayscale } from "./ImageNormalizer";

export interface EdgeDetectionOptions {
  /** Minimum Sobel magnitude (0–1020) for a pixel to count as an edge. Default 120. */
  threshold?: number;
  /** Subsample factor used to compute the edge histogram (for speed). Default 2. */
  step?: number;
}

export interface EdgeDetectionResult {
  /** Grayscale edge-strength map (black background, brighter = stronger edge). */
  strength: PixelImage;
  /** Binary edge mask: edge pixels kept (RGB = edge), non-edge transparent. */
  binary: PixelImage;
  edgePixelCount: number;
  totalPixels: number;
  /** edgePixelCount / totalPixels (0–1). */
  edgeDensity: number;
}

/**
 * Run Sobel edge detection. Border pixels are treated as non-edges because
 * the Sobel kernel requires a 3×3 neighborhood.
 */
export function detectEdges(
  image: PixelImage,
  options: EdgeDetectionOptions = {},
): EdgeDetectionResult {
  const { width, height } = image;
  const gray = toGrayscale(image);
  const threshold = options.threshold ?? 120;
  const step = Math.max(1, options.step ?? 2);

  const strength = createPixelImage(width, height);
  const binary = createPixelImage(width, height);

  const w = width;
  const g = gray.data;

  let edgeCount = 0;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const i = (y * w + x) * 4;
      // Sobel kernels (operating on luminance channel).
      const x0 = x - 1;
      const x2 = x + 1;
      const y0 = y - 1;
      const y2 = y + 1;
      const tl = g[(y0 * w + x0) * 4]!;
      const tm = g[(y0 * w + x) * 4]!;
      const tr = g[(y0 * w + x2) * 4]!;
      const ml = g[(y * w + x0) * 4]!;
      const mr = g[(y * w + x2) * 4]!;
      const bl = g[(y2 * w + x0) * 4]!;
      const bm = g[(y2 * w + x) * 4]!;
      const br = g[(y2 * w + x2) * 4]!;

      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tm - tr + bl + 2 * bm + br;
      const mag = Math.round(Math.sqrt(gx * gx + gy * gy));

      // Write strength at full resolution, binary at sampled resolution.
      strength.data[i] = mag;
      strength.data[i + 1] = mag;
      strength.data[i + 2] = mag;
      strength.data[i + 3] = 255;

      if (mag >= threshold) {
        edgeCount++;
        binary.data[i] = mag;
        binary.data[i + 1] = mag;
        binary.data[i + 2] = mag;
        binary.data[i + 3] = 255;
      }
    }
  }

  const totalPixels = width * height;
  return {
    strength,
    binary,
    edgePixelCount: edgeCount,
    totalPixels,
    edgeDensity: totalPixels > 0 ? Math.round((edgeCount / totalPixels) * 1000) / 1000 : 0,
  };
}

/** Convenience: return only the binary edge mask. */
export function detectEdgesBinary(image: PixelImage, threshold?: number): PixelImage {
  return detectEdges(image, threshold === undefined ? {} : { threshold }).binary;
}
