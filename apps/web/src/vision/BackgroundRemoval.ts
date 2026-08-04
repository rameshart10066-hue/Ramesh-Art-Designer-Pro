/**
 * Background Removal
 *
 * Heuristic background removal for photos with a relatively uniform
 * backdrop (typical of product / decoration photos): the background color
 * is estimated by clustering the image border pixels, then every pixel
 * within a color-distance tolerance of that background is made transparent.
 *
 * This is intentionally a non-ML approach — it is fast, deterministic,
 * and adequate for clean-background images. Complex backgrounds require
 * semantic segmentation (out of scope for Sprint 10.1).
 *
 * Pure over `PixelImage` — Node-testable.
 */

import type { PixelImage } from "./types";
import { createPixelImage } from "./types";

export interface BackgroundRemovalOptions {
  /**
   * Normalized color-distance tolerance (0–255) to the sampled background
   * color. Higher removes more. Default 45.
   */
  tolerance?: number;
  /** How many pixels to sample per border side. Default 12. */
  samplesPerSide?: number;
  /** Max background color clusters to model. Default 2. */
  maxClusters?: number;
  /** Box-blur the alpha channel by this many pixels to soften the edge (0 = hard). Default 1. */
  feather?: number;
}

export interface BackgroundRemovalResult {
  image: PixelImage;
  backgroundColors: { r: number; g: number; b: number }[];
  removedPixelRatio: number;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function removeBackground(
  image: PixelImage,
  options: BackgroundRemovalOptions = {},
): BackgroundRemovalResult {
  const { width, height, data } = image;
  const tolerance = options.tolerance ?? 45;
  const maxClusters = Math.max(1, options.maxClusters ?? 2);

  const backgroundColors = estimateBackgroundColors(image, options.samplesPerSide ?? 12, maxClusters);

  const out = createPixelImage(width, height);
  out.data.set(data);

  let removed = 0;
  const total = width * height;
  for (let i = 0; i < data.length; i += 4) {
    const dist = minColorDistance(data[i]!, data[i + 1]!, data[i + 2]!, backgroundColors);
    if (dist <= tolerance) {
      out.data[i + 3] = 0;
      removed++;
    }
  }

  const feather = Math.max(0, options.feather ?? 1);
  if (feather > 0) {
    boxBlurAlpha(out, feather);
  }

  return {
    image: out,
    backgroundColors,
    removedPixelRatio: total > 0 ? Math.round((removed / total) * 1000) / 1000 : 0,
  };
}

/**
 * Estimate the background color(s) by clustering pixels sampled along the
 * image border. Uses a simple online clustering: a sample joins the first
 * cluster within the color tolerance, otherwise it seeds a new cluster.
 */
export function estimateBackgroundColors(
  image: PixelImage,
  samplesPerSide: number,
  maxClusters: number,
): Rgb[] {
  const { width, height, data } = image;
  const samples: Rgb[] = [];
  const side = Math.max(1, samplesPerSide);

  // Top / bottom rows.
  for (let i = 0; i < side; i++) {
    const x = Math.min(width - 1, Math.round((i * (width - 1)) / Math.max(1, side - 1)));
    samples.push(sampleRgb(data, x, 0, width));
    samples.push(sampleRgb(data, x, height - 1, width));
  }
  // Left / right columns.
  for (let i = 0; i < side; i++) {
    const y = Math.min(height - 1, Math.round((i * (height - 1)) / Math.max(1, side - 1)));
    samples.push(sampleRgb(data, 0, y, width));
    samples.push(sampleRgb(data, width - 1, y, width));
  }

  const clusters: Rgb[] = [];
  for (const s of samples) {
    let placed = false;
    for (const c of clusters) {
      if (colorDistance(c, s) <= 60) {
        // Merge into cluster (running average keeps it stable).
        c.r = Math.round((c.r + s.r) / 2);
        c.g = Math.round((c.g + s.g) / 2);
        c.b = Math.round((c.b + s.b) / 2);
        placed = true;
        break;
      }
    }
    if (!placed && clusters.length < maxClusters) {
      clusters.push({ r: s.r, g: s.g, b: s.b });
    }
  }

  // Drop a cluster if it is essentially covered by another (keeps the model tight).
  const distinct: Rgb[] = [];
  for (const c of clusters) {
    if (!distinct.some((d) => colorDistance(d, c) <= 8)) distinct.push(c);
  }
  return distinct.length > 0 ? distinct : [{ r: 255, g: 255, b: 255 }];
}

function sampleRgb(data: Uint8ClampedArray, x: number, y: number, width: number): Rgb {
  const i = (y * width + x) * 4;
  return { r: data[i]!, g: data[i + 1]!, b: data[i + 2]! };
}

/** Normalized (0–255) color distance between two RGB colors. */
export function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) / Math.sqrt(3);
}

function minColorDistance(r: number, g: number, b: number, colors: Rgb[]): number {
  let min = Infinity;
  for (const c of colors) {
    const d = colorDistance({ r, g, b }, c);
    if (d < min) min = d;
  }
  return min;
}

/** Separable box blur on the alpha channel only (softens removal edges). */
function boxBlurAlpha(image: PixelImage, radius: number): void {
  const { width, height, data } = image;
  const tmp = new Float32Array(width * height);

  // Read alpha.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tmp[y * width + x] = data[(y * width + x) * 4 + 3]!;
    }
  }

  const w = width;
  const h = height;
  const r = radius;
  const src = new Float32Array(tmp);

  // Horizontal pass.
  for (let y = 0; y < h; y++) {
    let sum = 0;
    const start = y * w;
    for (let x = -r; x <= r; x++) sum += src[start + clampX(x, w)]!;
    tmp[start] = sum / (2 * r + 1);
    for (let x = 1; x < w; x++) {
      sum += src[start + clampX(x + r, w)]! - src[start + clampX(x - r - 1, w)]!;
      tmp[start + x] = sum / (2 * r + 1);
    }
  }

  const mid = new Float32Array(tmp);

  // Vertical pass.
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += mid[clampY(y, h) * w + x]!;
    tmp[x] = sum / (2 * r + 1);
    for (let y = 1; y < h; y++) {
      sum += mid[clampY(y + r, h) * w + x]! - mid[clampY(y - r - 1, h) * w + x]!;
      tmp[y * w + x] = sum / (2 * r + 1);
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      data[(y * w + x) * 4 + 3] = Math.round(tmp[y * w + x]!);
    }
  }
}

function clampX(x: number, w: number): number {
  return x < 0 ? 0 : x >= w ? w - 1 : x;
}

function clampY(y: number, h: number): number {
  return y < 0 ? 0 : y >= h ? h - 1 : y;
}
