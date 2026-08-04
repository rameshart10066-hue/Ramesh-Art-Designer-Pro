/**
 * Photo Upload — service layer (Sprint 11.5).
 *
 * Pure, testable helpers for the Upload Customer Photo page:
 *   - format detection (PNG / JPG / JPEG / WebP / HEIC / HEIF)
 *   - HEIC → JPEG conversion (via `heic2any`, loaded lazily)
 *   - the "prepare" pipeline, which reuses the existing vision preprocessing
 *     modules (`straightenImage`, `improveImage`, `removeBackground`) to get a
 *     customer photo CAD-ready. No AI is implemented here — this only connects
 *     the upload entry into the existing Vision pipeline.
 */

import type { PixelImage } from "@/vision/types";
import type { LoadedImage } from "@/vision/ImageLoader";
import { straightenImage } from "@/vision/PerspectiveCorrection";
import { improveImage } from "@/vision/ImageNormalizer";
import { removeBackground } from "@/vision/BackgroundRemoval";

export const SUPPORTED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "heic", "heif"];
export const SUPPORTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];

/** Accept a file by MIME or a common image extension (covers empty-MIME uploads). */
export function isSupportedImage(file: { type: string; name: string }): boolean {
  if (SUPPORTED_MIME_TYPES.includes(file.type)) return true;
  return /\.(png|jpe?g|webp|heic|heif)$/i.test(file.name);
}

/** Detect Apple HEIC / HEIF files (these need conversion before decoding). */
export function isHeicFile(file: { type: string; name: string }): boolean {
  return /\.(heic|heif)$/i.test(file.name) || /^image\/(heic|heif)/i.test(file.type);
}

/** Human-readable format label, e.g. "PNG", "HEIC". */
export function imageTypeLabel(file: { type: string; name: string }): string {
  const dot = file.name.lastIndexOf(".");
  const hasExtension = dot > 0 && dot < file.name.length - 1;
  if (hasExtension) {
    const ext = file.name.slice(dot + 1).toUpperCase();
    if (ext.length <= 5 && /^[A-Z0-9]+$/.test(ext)) return ext;
  }
  return (file.type.split("/")[1] || "Image").toUpperCase();
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Convert a HEIC/HEIF file to a JPEG `File` (browser-only). The heavy
 * `heic2any` bundle is imported lazily so it never loads for JPG/PNG uploads.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
  const blob = Array.isArray(result) ? (result[0] as Blob) : result;
  const name = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

export interface PreparedImage {
  pixel: PixelImage;
  /** Data URL of the prepared image (for preview / handoff to the Vision tab). */
  dataUrl: string;
  width: number;
  height: number;
  /** Human-readable list of the preparation steps that were applied. */
  steps: string[];
}

/**
 * Run the auto-prepare pipeline over a pixel buffer. Each step is best-effort —
 * if a preprocessing module throws (e.g. an unusual image), we keep the best
 * result so far. Pure (no DOM), so it is unit-testable in Node.
 */
export function prepareImagePixel(source: PixelImage): { pixel: PixelImage; steps: string[] } {
  const steps: string[] = [];
  let current = source;

  try {
    const straightened = straightenImage(current);
    if (straightened.image && straightened.image.width > 0 && straightened.image.height > 0) {
      current = straightened.image;
      steps.push("Auto-straighten");
    }
  } catch {
    // Keep the original — not all photos need deskewing.
  }

  try {
    const improved = improveImage(current);
    if (improved && improved.data.length === improved.width * improved.height * 4) {
      current = improved;
      steps.push("Contrast & brightness");
    }
  } catch {
    // Keep whatever we have.
  }

  try {
    const removed = removeBackground(current);
    if (removed.image && removed.image.width > 0 && removed.image.height > 0) {
      current = removed.image;
      steps.push("Background removal");
    }
  } catch {
    // Background removal is best-effort; a busy photo may keep its background.
  }

  return { pixel: current, steps };
}

/** Prepare a loaded customer image into a previewable, handoff-ready result. */
export function prepareCustomerImage(source: LoadedImage): PreparedImage {
  const { pixel, steps } = prepareImagePixel(source.pixel);
  return {
    pixel,
    dataUrl: pixelToDataUrl(pixel),
    width: pixel.width,
    height: pixel.height,
    steps,
  };
}

/** Convert a `PixelImage` buffer into a PNG data URL (browser-only). */
export function pixelToDataUrl(pixel: PixelImage): string {
  const canvas = document.createElement("canvas");
  canvas.width = pixel.width;
  canvas.height = pixel.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const imageData = new ImageData(pixel.data as Uint8ClampedArray<ArrayBuffer>, pixel.width, pixel.height);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
