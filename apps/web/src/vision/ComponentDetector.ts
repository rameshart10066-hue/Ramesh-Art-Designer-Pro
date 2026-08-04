/**
 * Component Detector — Sprint 10.2
 *
 * Recognizes Ganpati decoration components in a preprocessed image
 * (Sprint 10.1 output) and reports, for each detection: a bounding box,
 * center, type, and confidence.
 *
 * Pipeline (see also ShapeClassifier + ObjectClassifier):
 *   PixelImage → color-connected region segmentation → per-region geometry
 *   → shape classification → semantic object classification → background.
 *
 * Detected types: frame, arch, pillar, lotus, bell, peacock, prabhavali,
 * border, stage, om, background.
 *
 * NOTE: No CAD generation here — this sprint stops at detection + geometry.
 */

import type { PixelImage } from "./types";
import { classifyShape, type ShapeName } from "./ShapeClassifier";
import { classifyObject, type ObjectFeatures, type ComponentType } from "./ObjectClassifier";
import { estimateBackgroundColors } from "./BackgroundRemoval";
import type { Segment } from "./SegmentationEngine";
import type { ImageAnalysis } from "./ImageAnalyzer";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A detected component. `center`, `boundingBox`, `area`, and `fillRatio` are
 * always populated by the detectors here; they are optional only so that
 * existing code constructing `DetectedComponent` literals keeps type-checking.
 */
export interface DetectedComponent {
  type: ComponentType;
  /** 0–1. */
  confidence: number;
  segmentId: number;
  /** Bounding-box top-left (px). */
  x: number;
  y: number;
  width: number;
  height: number;
  center?: { x: number; y: number };
  boundingBox?: BoundingBox;
  shape: string;
  color: string;
  area?: number;
  fillRatio?: number;
  metadata: Record<string, any>;
}

export interface DetectOptions {
  /** Drop detections below this confidence. Default 0.35. */
  minConfidence?: number;
  /** Drop regions with fewer foreground pixels. Default 24. */
  minArea?: number;
  /** Color-distance tolerance for region segmentation. Default 30. */
  tolerance?: number;
  /** Seed-scan step for segmentation (higher = faster, may miss tiny regions). Default 2. */
  step?: number;
}

interface Region {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  dominantColor: string;
}

const DEFAULT_OPTIONS: Required<DetectOptions> = {
  minConfidence: 0.35,
  minArea: 24,
  tolerance: 30,
  step: 2,
};

// ── Full-image detection ─────────────────────────────────────────

/**
 * Detect components directly from a preprocessed `PixelImage`. Regions are
 * found by color-connected segmentation that skips the background (transparent
 * pixels if background removal was applied, otherwise pixels near the border
 * color). Each region is classified and returned with box + center +
 * confidence. A "background" detection is appended last.
 */
export function detectComponentsFromImage(
  image: PixelImage,
  options: DetectOptions = {},
): DetectedComponent[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const regions = segmentRegions(image, opts);
  if (regions.length === 0) return [detectBackground(image, [])];

  const maxArea = Math.max(...regions.map((r) => r.area));
  const detected: DetectedComponent[] = [];

  for (const region of regions) {
    const shape = classifyShape(region.width, region.height, region.area);
    const features = regionToFeatures(region, image, shape.shape, region.area === maxArea);
    const classification = classifyObject(features);
    if (classification.confidence < opts.minConfidence) continue;

    detected.push(
      buildComponent(region, shape.shape, shape.fillRatio, classification, features),
    );
  }

  detected.sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
  detected.push(detectBackground(image, detected));
  return detected;
}

// ── Legacy segments adapter ──────────────────────────────────────

/**
 * Adapter over the older segments-based API (used by the detection VisionPanel
 * and existing tests). Maps each `Segment` to features and runs the same
 * deterministic object classifier. Returns one detection per segment.
 */
export function detectComponents(segments: Segment[], analysis: ImageAnalysis): DetectedComponent[] {
  const imageW = analysis.width;
  const imageH = analysis.height;
  const maxArea = segments.reduce((m, s) => Math.max(m, s.pixelCount), 0);

  const detected: DetectedComponent[] = [];
  for (const seg of segments) {
    const aspect = seg.width / Math.max(1, seg.height);
    const fill = seg.pixelCount / Math.max(1, seg.width * seg.height);
    const shape = classifyShape(seg.width, seg.height, seg.pixelCount);
    const features: ObjectFeatures = {
      x: seg.x,
      y: seg.y,
      width: seg.width,
      height: seg.height,
      area: seg.pixelCount,
      imageWidth: imageW,
      imageHeight: imageH,
      aspectRatio: aspect,
      fillRatio: Math.min(1, fill),
      shape: shape.shape,
      dominantColor: seg.dominantColor,
      isLargest: seg.pixelCount === maxArea,
    };
    const classification = classifyObject(features);
    detected.push(
      buildComponent(
        {
          id: seg.id,
          x: seg.x,
          y: seg.y,
          width: seg.width,
          height: seg.height,
          area: seg.pixelCount,
          dominantColor: seg.dominantColor,
        },
        shape.shape,
        shape.fillRatio,
        classification,
        features,
      ),
    );
  }

  return detected.sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
}

// ── Background detection ─────────────────────────────────────────

/**
 * Report the backdrop: the image extent not covered by detected components.
 * Confidence reflects how much of the frame is uniform/uncovered.
 */
export function detectBackground(
  image: PixelImage,
  components: DetectedComponent[],
): DetectedComponent {
  const covered = components.reduce(
    (sum, c) => sum + (c.area ?? c.width * c.height),
    0,
  );
  const total = image.width * image.height;
  const uncovered = Math.max(0, 1 - covered / Math.max(1, total));
  const hasTransparency = hasAnyTransparency(image);
  const confidence = clamp(0.3 + 0.5 * uncovered + (hasTransparency ? 0.2 : 0), 0, 1);

  return {
    type: "background",
    confidence: Math.round(confidence * 100) / 100,
    segmentId: 0,
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
    center: { x: image.width / 2, y: image.height / 2 },
    boundingBox: { x: 0, y: 0, width: image.width, height: image.height },
    shape: "complex",
    color: "#64748b",
    area: Math.round(total - covered),
    fillRatio: uncovered,
    metadata: { backdrop: true, hasTransparency },
  };
}

/** Get the first region of interest for a specific component type. */
export function getComponentROI(
  detected: DetectedComponent[],
  type: string,
): DetectedComponent | undefined {
  return detected.find((d) => d.type === type);
}

// ── Internal helpers ─────────────────────────────────────────────

function buildComponent(
  region: Region,
  shape: ShapeName,
  fillRatio: number,
  classification: ReturnType<typeof classifyObject>,
  features: ObjectFeatures,
): DetectedComponent {
  return {
    type: classification.type,
    confidence: Math.round(classification.confidence * 100) / 100,
    segmentId: region.id,
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    center: { x: region.x + region.width / 2, y: region.y + region.height / 2 },
    boundingBox: {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
    },
    shape,
    color: region.dominantColor,
    area: region.area,
    fillRatio,
    metadata: {
      ...classification,
      features: {
        aspectRatio: features.aspectRatio,
        fillRatio: features.fillRatio,
        relWidth: features.width / features.imageWidth,
        relHeight: features.height / features.imageHeight,
      },
    },
  };
}

function regionToFeatures(
  region: Region,
  image: PixelImage,
  shape: ShapeName,
  isLargest: boolean,
): ObjectFeatures {
  return {
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    area: region.area,
    imageWidth: image.width,
    imageHeight: image.height,
    aspectRatio: region.width / Math.max(1, region.height),
    fillRatio: region.area / Math.max(1, region.width * region.height),
    shape,
    dominantColor: region.dominantColor,
    isLargest,
  };
}

/**
 * Segment a preprocessed image into color-connected foreground regions.
 * Background pixels (transparent, or near the dominant border color when the
 * image is fully opaque) are skipped.
 */
function segmentRegions(image: PixelImage, opts: Required<DetectOptions>): Region[] {
  const { width, height, data } = image;
  const visited = new Uint8Array(width * height);
  const regions: Region[] = [];
  const hasAlpha = hasAnyTransparency(image);
  const bgColors = hasAlpha ? [] : estimateBackgroundColors(image, 8, 2);
  const step = Math.max(1, opts.step);
  let regionId = 1;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      const px = idx * 4;
      if (isBackground(data, px, hasAlpha, bgColors)) {
        visited[idx] = 1;
        continue;
      }

      const region = floodFillColor(image, x, y, visited, hasAlpha, bgColors, opts.tolerance);
      if (region.area >= opts.minArea) {
        regions.push({ id: regionId++, ...region });
      }
    }
  }

  return regions;
}

function isBackground(
  data: Uint8ClampedArray,
  px: number,
  hasAlpha: boolean,
  bgColors: { r: number; g: number; b: number }[],
): boolean {
  if (data[px + 3]! < 128) return true; // transparent
  if (!hasAlpha) {
    const r = data[px]!;
    const g = data[px + 1]!;
    const b = data[px + 2]!;
    for (const c of bgColors) {
      const dist = Math.sqrt((r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2);
      if (dist < 60) return true;
    }
  }
  return false;
}

function floodFillColor(
  image: PixelImage,
  startX: number,
  startY: number,
  visited: Uint8Array,
  hasAlpha: boolean,
  bgColors: { r: number; g: number; b: number }[],
  tolerance: number,
): Omit<Region, "id"> {
  const { width, height, data } = image;
  const stack: number[] = [startY * width + startX];
  const seed = startY * width + startX;
  const seedPx = seed * 4;
  const baseR = data[seedPx]!;
  const baseG = data[seedPx + 1]!;
  const baseB = data[seedPx + 2]!;

  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;
  let area = 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;

  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (visited[idx]) continue;
    const x = idx % width;
    const y = (idx / width) | 0;
    const px = idx * 4;

    if (isBackground(data, px, hasAlpha, bgColors)) {
      visited[idx] = 1;
      continue;
    }
    const r = data[px]!;
    const g = data[px + 1]!;
    const b = data[px + 2]!;
    const diff = Math.abs(r - baseR) + Math.abs(g - baseG) + Math.abs(b - baseB);
    if (diff > tolerance) continue;

    visited[idx] = 1;
    area++;
    rSum += r;
    gSum += g;
    bSum += b;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    if (x > 0) stack.push(idx - 1);
    if (x < width - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - width);
    if (y < height - 1) stack.push(idx + width);
  }

  const hex = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    area,
    dominantColor: `#${hex(rSum / area)}${hex(gSum / area)}${hex(bSum / area)}`,
  };
}

function hasAnyTransparency(image: PixelImage): boolean {
  const { data } = image;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i]! < 200) return true;
  }
  return false;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
