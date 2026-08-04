/**
 * Image Normalizer
 *
 * Contrast / brightness / grayscale operations for preprocessing uploaded
 * photos (including compressed WhatsApp images) before edge detection,
 * background removal, and scale estimation.
 *
 * All functions operate on `PixelImage` (see ./types) and are pure: they
 * never mutate their input and are safe to run in Node tests.
 */

import type { PixelImage } from "./types";
import { createPixelImage } from "./types";

export interface NormalizeOptions {
  /** Low luminance percentile for the auto-contrast stretch. Default 2. */
  lowPercentile?: number;
  /** High luminance percentile for the auto-contrast stretch. Default 98. */
  highPercentile?: number;
}

const clamp255 = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/** Convert an RGBA image to grayscale (luminance), preserving alpha. */
export function toGrayscale(image: PixelImage): PixelImage {
  const { width, height, data } = image;
  const out = createPixelImage(width, height);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(
      0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!,
    );
    out.data[i] = lum;
    out.data[i + 1] = lum;
    out.data[i + 2] = lum;
    out.data[i + 3] = data[i + 3]!;
  }
  return out;
}

/**
 * Auto-contrast (percentile stretch). Finds the low/high luminance
 * percentiles, then linearly remaps the RGB channels so the mid-range
 * fills the full 0–255 scale. Alpha is preserved unchanged.
 *
 * Percentile (rather than pure min/max) avoids amplifying noise from a
 * few outlier pixels — important for noisy mobile/WhatsApp photos.
 */
export function normalizeContrast(
  image: PixelImage,
  options: NormalizeOptions = {},
): PixelImage {
  const { width, height, data } = image;
  const total = width * height;
  if (total === 0) return createPixelImage(width, height);

  const lowP = Math.min(99, Math.max(0, options.lowPercentile ?? 2));
  const highP = Math.min(100, Math.max(lowP + 1, options.highPercentile ?? 98));

  // Luminance histogram.
  const hist = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(
      0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!,
    );
    hist[lum]!++;
  }

  const lowBound = percentile(hist, total, lowP);
  const highBound = percentile(hist, total, highP);
  const span = highBound - lowBound;

  const out = createPixelImage(width, height);
  if (span <= 0) {
    // Flat image — nothing to stretch; copy through.
    out.data.set(data);
    return out;
  }

  const scale = 255 / span;
  for (let i = 0; i < data.length; i += 4) {
    out.data[i] = clamp255((data[i]! - lowBound) * scale);
    out.data[i + 1] = clamp255((data[i + 1]! - lowBound) * scale);
    out.data[i + 2] = clamp255((data[i + 2]! - lowBound) * scale);
    out.data[i + 3] = data[i + 3]!;
  }
  return out;
}

/** Add a signed amount (−255…255) to every RGB channel, preserving alpha. */
export function adjustBrightness(image: PixelImage, delta: number): PixelImage {
  const { width, height, data } = image;
  const out = createPixelImage(width, height);
  for (let i = 0; i < data.length; i += 4) {
    out.data[i] = clamp255(data[i]! + delta);
    out.data[i + 1] = clamp255(data[i + 1]! + delta);
    out.data[i + 2] = clamp255(data[i + 2]! + delta);
    out.data[i + 3] = data[i + 3]!;
  }
  return out;
}

/**
 * Scale the RGB channels around 128 by `factor` (1 = unchanged,
 * >1 increases contrast, <1 decreases), preserving alpha.
 */
export function adjustContrastFactor(image: PixelImage, factor: number): PixelImage {
  const { width, height, data } = image;
  const out = createPixelImage(width, height);
  for (let i = 0; i < data.length; i += 4) {
    out.data[i] = clamp255((data[i]! - 128) * factor + 128);
    out.data[i + 1] = clamp255((data[i + 1]! - 128) * factor + 128);
    out.data[i + 2] = clamp255((data[i + 2]! - 128) * factor + 128);
    out.data[i + 3] = data[i + 3]!;
  }
  return out;
}

/**
 * One-shot "improve" used for compressed WhatsApp / mobile photos:
 * auto-contrast, then re-center the mean luminance toward 128 so a dark or
 * washed-out shot ends up balanced.
 */
export function improveImage(image: PixelImage): PixelImage {
  let out = normalizeContrast(image);

  const { data } = out;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
  }
  const mean = sum / (data.length / 4);
  out = adjustBrightness(out, 128 - mean);
  return out;
}

/** Compute the `p`-th percentile (0–100) luminance from a histogram. */
function percentile(hist: Uint32Array, total: number, p: number): number {
  if (p <= 0) {
    // Minimum value actually present (a p=0 target of zero would wrongly
    // return 0 even when no pixel is that dark).
    for (let v = 0; v < 256; v++) {
      if (hist[v]! > 0) return v;
    }
    return 0;
  }
  if (p >= 100) {
    // Maximum value actually present.
    for (let v = 255; v >= 0; v--) {
      if (hist[v]! > 0) return v;
    }
    return 255;
  }
  const target = Math.ceil((total * p) / 100);
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v]!;
    if (acc >= target) return v;
  }
  return 255;
}
