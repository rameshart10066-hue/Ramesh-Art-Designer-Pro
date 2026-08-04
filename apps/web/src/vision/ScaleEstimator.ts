/**
 * Scale Estimator
 *
 * Converts image pixels to physical millimetres. The primary, accurate
 * path is `estimateScaleFromReference`, which needs one known physical
 * dimension (e.g. the user enters "the decoration is 1200 mm wide").
 *
 * `estimateScalePxToMm` is a documented heuristic fallback that assumes a
 * typical decoration width when no reference is provided — it mirrors the
 * behaviour of the older `ImageAnalyzer` helper but lives here so the
 * preprocessing pipeline is self-contained.
 */

import type { PixelImage } from "./types";

export interface ScaleEstimate {
  /** Millimetres per pixel. */
  mmPerPixel: number;
  /** Pixels per millimetre. */
  pixelPerMm: number;
  /** The physical reference width used for the estimate. */
  referenceWidthMm: number;
  /** Estimated physical width of the image. */
  estimatedWidthMm: number;
  /** Estimated physical height of the image. */
  estimatedHeightMm: number;
}

/** Millimetres per pixel from a known reference width in pixels. */
export function estimateScaleFromReference(
  imageWidthPx: number,
  physicalWidthMm: number,
): ScaleEstimate {
  if (!Number.isFinite(imageWidthPx) || imageWidthPx <= 0) {
    throw new Error("estimateScaleFromReference: image width must be positive");
  }
  if (!Number.isFinite(physicalWidthMm) || physicalWidthMm <= 0) {
    throw new Error("estimateScaleFromReference: physical width must be positive");
  }
  const mmPerPixel = physicalWidthMm / imageWidthPx;
  return {
    mmPerPixel,
    pixelPerMm: 1 / mmPerPixel,
    referenceWidthMm: physicalWidthMm,
    estimatedWidthMm: physicalWidthMm,
    estimatedHeightMm: 0, // filled by estimatePhysicalDimensions
  };
}

/** Estimate the physical size of an image given mm-per-pixel. */
export function estimatePhysicalDimensions(
  image: PixelImage,
  mmPerPixel: number,
): { widthMm: number; heightMm: number } {
  return {
    widthMm: Math.round(image.width * mmPerPixel),
    heightMm: Math.round(image.height * mmPerPixel),
  };
}

/** Combine a reference-based scale with physical dimensions for an image. */
export function estimateImageScale(
  image: PixelImage,
  physicalWidthMm: number,
): ScaleEstimate {
  const base = estimateScaleFromReference(image.width, physicalWidthMm);
  const dims = estimatePhysicalDimensions(image, base.mmPerPixel);
  return {
    ...base,
    estimatedWidthMm: dims.widthMm,
    estimatedHeightMm: dims.heightMm,
  };
}

/**
 * Heuristic fallback: assume a typical decoration width and derive a scale.
 * Only use when the user has not supplied a reference dimension.
 */
export function estimateScalePxToMm(
  imageWidthPx: number,
  assumedWidthMm = 1200,
): number {
  if (imageWidthPx <= 0) return 0;
  return assumedWidthMm / imageWidthPx;
}

export function pixelsToMm(px: number, mmPerPixel: number): number {
  return px * mmPerPixel;
}

export function mmToPixels(mm: number, mmPerPixel: number): number {
  if (mmPerPixel <= 0) return 0;
  return mm / mmPerPixel;
}
