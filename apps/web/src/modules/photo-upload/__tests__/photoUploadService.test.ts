import { describe, expect, it } from "vitest";
import type { PixelImage } from "@/vision/types";
import {
  formatBytes,
  imageTypeLabel,
  isHeicFile,
  isSupportedImage,
  prepareImagePixel,
} from "../photoUploadService";

describe("isSupportedImage", () => {
  it("accepts PNG / JPG / JPEG / WebP / HEIC / HEIF by extension", () => {
    for (const name of ["a.png", "a.jpg", "a.jpeg", "a.webp", "a.heic", "a.heif", "IMG-2021-WA0001.jpg"]) {
      expect(isSupportedImage({ name, type: "" }), name).toBe(true);
    }
  });

  it("accepts files by MIME type", () => {
    expect(isSupportedImage({ name: "photo", type: "image/png" })).toBe(true);
    expect(isSupportedImage({ name: "photo", type: "image/heic" })).toBe(true);
  });

  it("rejects non-image files", () => {
    expect(isSupportedImage({ name: "notes.txt", type: "text/plain" })).toBe(false);
    expect(isSupportedImage({ name: "doc.pdf", type: "application/pdf" })).toBe(false);
  });
});

describe("isHeicFile", () => {
  it("detects HEIC / HEIF by extension and MIME", () => {
    expect(isHeicFile({ name: "shot.heic", type: "" })).toBe(true);
    expect(isHeicFile({ name: "shot.heif", type: "" })).toBe(true);
    expect(isHeicFile({ name: "shot.png", type: "image/heic" })).toBe(true);
    expect(isHeicFile({ name: "shot.jpg", type: "image/jpeg" })).toBe(false);
  });
});

describe("imageTypeLabel", () => {
  it("returns a readable format label", () => {
    expect(imageTypeLabel({ name: "photo.png", type: "image/png" })).toBe("PNG");
    expect(imageTypeLabel({ name: "photo.HEIC", type: "" })).toBe("HEIC");
    expect(imageTypeLabel({ name: "photo", type: "image/jpeg" })).toBe("JPEG");
  });
});

describe("formatBytes", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("prepareImagePixel", () => {
  it("runs the preparation pipeline without throwing and returns a valid buffer", () => {
    const pixel = makeGradient(24, 24);
    const { pixel: result, steps } = prepareImagePixel(pixel);

    // Steps can vary (e.g. deskew may or may not apply), but the result must
    // be a valid, self-consistent pixel buffer.
    expect(Array.isArray(steps)).toBe(true);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.data.length).toBe(result.width * result.height * 4);
  });
});

// ── helpers ───────────────────────────────────────────────────────

function makeGradient(width: number, height: number): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (i / 4) % 255; // r
    data[i + 1] = 128; // g
    data[i + 2] = 255 - ((i / 4) % 255); // b
    data[i + 3] = 255; // a
  }
  return { width, height, data };
}
