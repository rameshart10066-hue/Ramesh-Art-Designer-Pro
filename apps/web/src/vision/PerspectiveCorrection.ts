/**
 * Perspective Correction
 *
 * Two cooperating operations:
 *
 * 1. `estimateDeskewAngle` / `straightenImage` — automatic straightening of
 *    a small tilt by analyzing the dominant signed deviation of strong edges
 *    from the horizontal/vertical axes. This handles the common case of a
 *    slightly rotated photo (typical ±2–8°).
 *
 * 2. `warpQuadToRect` — a true perspective (homography) warp of a source
 *    quadrilateral to a rectangle, for manually-corrected corners. Used when
 *    the auto-deskew is not enough (e.g. keystone distortion).
 *
 * All functions are pure over `PixelImage` — Node-testable, no DOM.
 */

import type { PixelImage, Point, Quad } from "./types";
import { createPixelImage, clonePixelImage } from "./types";

export interface StraightenResult {
  image: PixelImage;
  /** Signed rotation (degrees, CCW positive) that was applied. */
  angle: number;
}

/**
 * Estimate the signed rotation (degrees) that would straighten the image.
 * Positive = rotate counter-clockwise. Returns 0 when the image is already
 * straight or too rotated to safely auto-correct.
 */
export function estimateDeskewAngle(image: PixelImage, maxAngle = 10): number {
  const { width, height, data } = image;
  if (width < 4 || height < 4) return 0;

  const HIST_SIZE = 91; // bins for deviation −45…+45
  const weights = new Float64Array(HIST_SIZE);
  const step = 2;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const { gx, gy } = sobelAt(data, width, x, y);
      const mag = Math.abs(gx) + Math.abs(gy);
      if (mag < 60) continue;

      // Fold the gradient angle into the *edge line* orientation, mod 180.
      // (Gradient direction depends on which side of the edge is brighter —
      // parallel edges give opposite gradient signs. Folding removes that
      // ambiguity so they vote together.)
      const g = Math.atan2(gy, gx) * (180 / Math.PI); // −180…180
      const h = ((g % 180) + 180) % 180; // 0…180
      const phi = (h - 90 + 180) % 180; // edge orientation 0…180
      const m = phi % 90; // 0…90
      const dev = m <= 45 ? m : m - 90; // signed −45…+45
      const idx = Math.round(dev) + 45;
      if (idx >= 0 && idx < HIST_SIZE) weights[idx]! += mag;
    }
  }

  let total = 0;
  for (let i = 0; i < HIST_SIZE; i++) total += weights[i]!;
  if (total < 100) return 0; // not enough edge signal

  // Weighted median of the signed deviation.
  const half = total / 2;
  let acc = 0;
  for (let i = 0; i < HIST_SIZE; i++) {
    acc += weights[i]!;
    if (acc >= half) {
      const dev = i - 45;
      // Only auto-correct small tilts; larger rotation is left to the manual warp.
      if (Math.abs(dev) <= maxAngle && Math.abs(dev) >= 0.5) {
        return Math.round(-dev * 10) / 10;
      }
      return 0;
    }
  }
  return 0;
}

/** Rotate the image by `angleDeg` (CCW positive), expanding bounds and filling gaps with transparency. */
export function rotateImage(image: PixelImage, angleDeg: number): PixelImage {
  if (Math.abs(angleDeg) < 0.001) return clonePixelImage(image);

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const W = image.width;
  const H = image.height;

  // Subtract a tiny epsilon so float error (e.g. cos(90°) ≈ 6e-17) never
  // inflates the ceil to the next pixel.
  const EPS = 1e-9;
  const newW = Math.max(1, Math.ceil(Math.abs(W * cos) + Math.abs(H * sin) - EPS));
  const newH = Math.max(1, Math.ceil(Math.abs(W * sin) + Math.abs(H * cos) - EPS));

  // Pixel-grid centers (pixel i spans [i, i+1), so its center is i + 0.5).
  // Using (size-1)/2 keeps even-sized images pixel-aligned after rotation and
  // avoids losing the first row/column on exact 90°/180°/270° turns.
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const ncx = (newW - 1) / 2;
  const ncy = (newH - 1) / 2;

  const out = createPixelImage(newW, newH);
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const dx = x - ncx;
      const dy = y - ncy;
      const sx = cos * dx + sin * dy + cx;
      const sy = -sin * dx + cos * dy + cy;
      // Skip only pixels fully outside the source; sampleBilinear clamps the rest.
      // A tiny negative epsilon absorbs float error (e.g. cos(90°) ≈ 6e-17
      // making an exact boundary land at −1e-16).
      const BOUND_EPS = 1e-9;
      if (sx < -BOUND_EPS || sy < -BOUND_EPS || sx >= W || sy >= H) continue;
      const [r, g, b, a] = sampleBilinear(image, sx, sy);
      const o = (y * newW + x) * 4;
      out.data[o] = r;
      out.data[o + 1] = g;
      out.data[o + 2] = b;
      out.data[o + 3] = a;
    }
  }
  return out;
}

/** Auto-straighten a slightly tilted image. */
export function straightenImage(image: PixelImage, maxAngle = 10): StraightenResult {
  const angle = estimateDeskewAngle(image, maxAngle);
  if (angle === 0) return { image: clonePixelImage(image), angle: 0 };
  return { image: rotateImage(image, angle), angle };
}

/**
 * Warp the source quadrilateral `quad` onto a `destWidth × destHeight`
 * rectangle using a projective (homography) transform. The quad corners are
 * mapped to the destination corners in the same clockwise order.
 */
export function warpQuadToRect(
  image: PixelImage,
  quad: Quad,
  destWidth: number,
  destHeight: number,
): PixelImage {
  if (destWidth <= 0 || destHeight <= 0) {
    throw new Error("warpQuadToRect: destination size must be positive");
  }
  const corners: [Point, Point, Point, Point] = [
    quad.topLeft,
    quad.topRight,
    quad.bottomRight,
    quad.bottomLeft,
  ];
  const h = solveHomography(corners, destWidth, destHeight);
  if (!h) {
    throw new Error("warpQuadToRect: degenerate quadrilateral");
  }
  const [a, b, c, d, e, f, g, hh] = h;

  const out = createPixelImage(destWidth, destHeight);
  const sw = image.width;
  const sh = image.height;

  for (let y = 0; y < destHeight; y++) {
    for (let x = 0; x < destWidth; x++) {
      const denom = g! * x + hh! * y + 1;
      if (Math.abs(denom) < 1e-12) continue;
      const sx = (a! * x + b! * y + c!) / denom;
      const sy = (d! * x + e! * y + f!) / denom;
      // Skip only pixels fully outside the source; sampleBilinear clamps the rest.
      const BOUND_EPS = 1e-9;
      if (sx < -BOUND_EPS || sy < -BOUND_EPS || sx >= sw || sy >= sh) continue;
      const [r, g0, b0, a0] = sampleBilinear(image, sx, sy);
      const o = (y * destWidth + x) * 4;
      out.data[o] = r;
      out.data[o + 1] = g0;
      out.data[o + 2] = b0;
      out.data[o + 3] = a0;
    }
  }
  return out;
}

// ── Internal helpers ──────────────────────────────────────────────

function sobelAt(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): { gx: number; gy: number } {
  const x0 = x - 1;
  const x2 = x + 1;
  const y0 = y - 1;
  const y2 = y + 1;
  const tl = lumAt(data, width, x0, y0);
  const tm = lumAt(data, width, x, y0);
  const tr = lumAt(data, width, x2, y0);
  const ml = lumAt(data, width, x0, y);
  const mr = lumAt(data, width, x2, y);
  const bl = lumAt(data, width, x0, y2);
  const bm = lumAt(data, width, x, y2);
  const br = lumAt(data, width, x2, y2);
  return {
    gx: -tl - 2 * ml - bl + tr + 2 * mr + br,
    gy: -tl - 2 * tm - tr + bl + 2 * bm + br,
  };
}

function lumAt(data: Uint8ClampedArray, width: number, x: number, y: number): number {
  const i = (y * width + x) * 4;
  return (data[i]! * 299 + data[i + 1]! * 587 + data[i + 2]! * 114) / 1000;
}

function sampleBilinear(
  image: PixelImage,
  x: number,
  y: number,
): [number, number, number, number] {
  const w = image.width;
  const h = image.height;
  const x0 = Math.min(w - 1, Math.max(0, Math.floor(x)));
  const y0 = Math.min(h - 1, Math.max(0, Math.floor(y)));
  const x1 = Math.min(w - 1, x0 + 1);
  const y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const d = image.data;
  const i00 = (y0 * w + x0) * 4;
  const i10 = (y0 * w + x1) * 4;
  const i01 = (y1 * w + x0) * 4;
  const i11 = (y1 * w + x1) * 4;
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;
  return [
    Math.round(d[i00]! * w00 + d[i10]! * w10 + d[i01]! * w01 + d[i11]! * w11),
    Math.round(d[i00 + 1]! * w00 + d[i10 + 1]! * w10 + d[i01 + 1]! * w01 + d[i11 + 1]! * w11),
    Math.round(d[i00 + 2]! * w00 + d[i10 + 2]! * w10 + d[i01 + 2]! * w01 + d[i11 + 2]! * w11),
    Math.round(d[i00 + 3]! * w00 + d[i10 + 3]! * w10 + d[i01 + 3]! * w01 + d[i11 + 3]! * w11),
  ];
}

/**
 * Solve the 8-parameter homography that maps the four destination corners
 * (0,0), (w,0), (w,h), (0,h) onto the four source `corners`, via DLT.
 * Returns null for a degenerate (singular) quad.
 */
function solveHomography(
  corners: [Point, Point, Point, Point],
  w: number,
  h: number,
): number[] | null {
  const dest: Point[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  // 8×8 system: A·p = b with p = [a,b,c,d,e,f,g,h].
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = dest[i]!;
    const { x: sx, y: sy } = corners[i]!;
    A.push([x, y, 1, 0, 0, 0, -sx * x, -sx * y]);
    b.push(sx);
    A.push([0, 0, 0, x, y, 1, -sy * x, -sy * y]);
    b.push(sy);
  }
  return gaussianSolve8(A, b);
}

function gaussianSolve8(A: number[][], b: number[]): number[] | null {
  const n = 8;
  const m: number[][] = A.map((row, i) => [...row, b[i]!]);

  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r]![col]!) > Math.abs(m[piv]![col]!)) piv = r;
    }
    if (Math.abs(m[piv]![col]!) < 1e-12) return null; // singular
    if (piv !== col) [m[col], m[piv]] = [m[piv]!, m[col]!];

    const pivVal = m[col]![col]!;
    for (let c = col; c <= n; c++) m[col]![c] = m[col]![c]! / pivVal;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = m[r]![col]!;
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) {
        m[r]![c] = m[r]![c]! - factor * m[col]![c]!;
      }
    }
  }

  return m.map((row) => row![n]!);
}
