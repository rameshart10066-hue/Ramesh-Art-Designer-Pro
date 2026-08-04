/**
 * Image Loader
 *
 * Loads JPG / PNG / WebP files (including WhatsApp / mobile camera photos)
 * into a `PixelImage` for the preprocessing pipeline.
 *
 * Responsibilities:
 *  - File-type validation with helpful errors (HEIC is rejected explicitly).
 *  - EXIF orientation applied automatically via `createImageBitmap`
 *    (`imageOrientation: "from-image"`), with an `Image` fallback.
 *  - Downscaling the longer edge to a bounded `maxDimension` so large
 *    camera / WhatsApp images (often 4000+ px) do not exhaust memory.
 *  - Producing a data URL for preview and for "save to project".
 *
 * The decode path is browser-only; the pure helpers
 * (`isSupportedFile`, `isWhatsAppImage`, `computeDownscaledSize`) are
 * exported and unit-tested in Node.
 */

import type { PixelImage } from "./types";

export const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DEFAULT_MAX_DIMENSION = 1600;

export interface ImageLoadOptions {
  /** Cap the longer edge in px. Default 1600. */
  maxDimension?: number;
  /** Output MIME for the data URL. PNG preserves transparency. */
  format?: "image/png" | "image/jpeg";
  /** JPEG quality (0–1) when `format` is `image/jpeg`. Default 0.92. */
  quality?: number;
}

export interface LoadedImage {
  pixel: PixelImage;
  /** Data URL of the loaded (downscaled) image, for preview / saving. */
  dataUrl: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  mimeType: string;
  fileName: string;
  isWhatsApp: boolean;
}

/** Accept a file by MIME or by a common image extension (covers empty-MIME uploads). */
export function isSupportedFile(file: { type: string; name: string }): boolean {
  if (SUPPORTED_MIME_TYPES.includes(file.type)) return true;
  return /\.(jpe?g|png|webp)$/i.test(file.name);
}

/**
 * Heuristic detection of WhatsApp / Android gallery photo names, e.g.
 * `IMG-20210101-WA0000.jpg`, `IMG_20210101_123456.jpg`, `WhatsApp Image 2021-….jpg`.
 */
export function isWhatsAppImage(file: { name: string }): boolean {
  return /(WA\d{4}|-WA|IMG_\d{8}_|whatsapp)/i.test(file.name);
}

/** Pure downscale computation (testable): returns the target width/height. */
export function computeDownscaledSize(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number,
): { width: number; height: number } {
  const maxDim = Math.max(1, maxDimension);
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: 1, height: 1 };
  }
  const longest = Math.max(originalWidth, originalHeight);
  if (longest <= maxDim) {
    return { width: originalWidth, height: originalHeight };
  }
  const scale = maxDim / longest;
  return {
    width: Math.max(1, Math.round(originalWidth * scale)),
    height: Math.max(1, Math.round(originalHeight * scale)),
  };
}

/**
 * Load and decode an image file. Throws a descriptive `Error` on
 * unsupported formats or decode failures.
 */
export async function loadImageFromFile(
  file: File,
  options: ImageLoadOptions = {},
): Promise<LoadedImage> {
  if (!isSupportedFile(file)) {
    const hint = /\.heic$/i.test(file.name)
      ? " HEIC is not supported — convert to JPG or PNG first."
      : "";
    throw new Error(
      `Unsupported file "${file.name}" (${file.type || "unknown type"}). Use JPG, PNG, or WebP.${hint}`,
    );
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const format = options.format ?? "image/png";
  const quality = options.quality ?? 0.92;

  const source = await decodeImage(file);
  const originalWidth = source.width;
  const originalHeight = source.height;
  const { width, height } = computeDownscaledSize(originalWidth, originalHeight, maxDimension);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const dataUrl = canvas.toDataURL(format, quality);

  closeImage(source);

  return {
    pixel: {
      width,
      height,
      data: imageData.data,
    },
    dataUrl,
    width,
    height,
    originalWidth,
    originalHeight,
    mimeType: file.type || "image/png",
    fileName: file.name,
    isWhatsApp: isWhatsAppImage(file),
  };
}

/** Decode to an ImageBitmap (EXIF-aware) or Image (fallback). */
async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Some engines reject certain bitmaps; fall through to Image.
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not decode "${file.name}"`));
    };
    img.src = url;
  });
}

function closeImage(source: ImageBitmap | HTMLImageElement): void {
  // ImageBitmap has a `close` method to release GPU memory; HTMLImageElement does not.
  if ("close" in source) {
    source.close();
  }
}
