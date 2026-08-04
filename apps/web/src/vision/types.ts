/**
 * Shared pixel types for the vision preprocessing pipeline.
 *
 * `PixelImage` is structurally compatible with the browser `ImageData`
 * (it has the same `width`, `height`, and `data` members) but does not
 * depend on the global `ImageData` constructor. This keeps every
 * preprocessing module pure and testable in Node without a DOM.
 *
 * Browser callers can pass an `ImageData` anywhere a `PixelImage` is
 * expected, and rebuild a real `ImageData` from a result via
 * `new ImageData(result.data, result.width, result.height)`.
 */

/** RGBA pixel buffer. `data` length is always `width * height * 4`. */
export interface PixelImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface Point {
  x: number;
  y: number;
}

/** A quadrilateral in image pixel coordinates (clockwise from top-left). */
export interface Quad {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

/** Create an empty (transparent black) `PixelImage`. */
export function createPixelImage(width: number, height: number): PixelImage {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  };
}

/** Copy a `PixelImage` into an independent buffer. */
export function clonePixelImage(image: PixelImage): PixelImage {
  return {
    width: image.width,
    height: image.height,
    data: new Uint8ClampedArray(image.data),
  };
}
