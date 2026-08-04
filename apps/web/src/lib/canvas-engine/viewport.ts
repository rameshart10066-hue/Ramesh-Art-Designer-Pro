// ──────────────────────────────────────────────────────────────────
// Canvas Engine – Viewport / Coordinate Transforms
// ──────────────────────────────────────────────────────────────────

import type { Point, Rect, ViewportState } from "./types";

/**
 * Convert a screen (client) coordinate to world (canvas) coordinate.
 * Accounts for zoom, pan, and an optional container origin offset.
 */
export function screenToWorld(
  screen: Point,
  viewport: ViewportState,
  containerOrigin: Point = { x: 0, y: 0 }
): Point {
  return {
    x: (screen.x - containerOrigin.x - viewport.panX) / viewport.zoom,
    y: (screen.y - containerOrigin.y - viewport.panY) / viewport.zoom,
  };
}

/**
 * Convert a world (canvas) coordinate to screen (client) coordinate.
 */
export function worldToScreen(
  world: Point,
  viewport: ViewportState,
  containerOrigin: Point = { x: 0, y: 0 }
): Point {
  return {
    x: world.x * viewport.zoom + viewport.panX + containerOrigin.x,
    y: world.y * viewport.zoom + viewport.panY + containerOrigin.y,
  };
}

/**
 * Convert a screen-space rect to a world-space rect.
 */
export function screenRectToWorld(
  rect: Rect,
  viewport: ViewportState,
  containerOrigin: Point = { x: 0, y: 0 }
): Rect {
  const topLeft = screenToWorld({ x: rect.x, y: rect.y }, viewport, containerOrigin);
  const bottomRight = screenToWorld(
    { x: rect.x + rect.width, y: rect.y + rect.height },
    viewport,
    containerOrigin
  );
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

/**
 * Convert a world-space rect to a screen-space rect.
 */
export function worldRectToScreen(
  rect: Rect,
  viewport: ViewportState,
  containerOrigin: Point = { x: 0, y: 0 }
): Rect {
  const topLeft = worldToScreen({ x: rect.x, y: rect.y }, viewport, containerOrigin);
  const bottomRight = worldToScreen(
    { x: rect.x + rect.width, y: rect.y + rect.height },
    viewport,
    containerOrigin
  );
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

/**
 * Calculate a new zoom & pan that keeps the given screen point fixed.
 *
 * @param viewport  Current viewport
 * @param newZoom   Desired zoom level
 * @param pivot     Screen point that should remain stationary (e.g. mouse position)
 * @param containerOrigin  Container offset
 * @param minZoom   Minimum zoom clamp
 * @param maxZoom   Maximum zoom clamp
 */
export function zoomTowardsPoint(
  viewport: ViewportState,
  newZoom: number,
  pivot: Point,
  containerOrigin: Point = { x: 0, y: 0 },
  minZoom: number = 0.1,
  maxZoom: number = 8
): ViewportState {
  const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
  const worldPivot = screenToWorld(pivot, viewport, containerOrigin);
  return {
    zoom: clampedZoom,
    panX: pivot.x - containerOrigin.x - worldPivot.x * clampedZoom,
    panY: pivot.y - containerOrigin.y - worldPivot.y * clampedZoom,
  };
}

/**
 * Compute zoom delta from a mouse wheel event deltaY.
 * Positive deltaY (scroll down) = zoom out.
 * Negative deltaY (scroll up) = zoom in.
 */
export function wheelZoomDelta(deltaY: number, zoomStep: number = 0.1): number {
  return deltaY > 0 ? 1 - zoomStep : 1 + zoomStep;
}

/**
 * Fit a set of world-space rects into the viewport with optional padding.
 * Returns the viewport state that centers & scales to fit all bounds.
 */
export function fitToViewport(
  bounds: Rect[],
  containerWidth: number,
  containerHeight: number,
  padding: number = 50,
  minZoom: number = 0.1,
  maxZoom: number = 8
): ViewportState {
  if (bounds.length === 0) {
    return { zoom: 1, panX: 0, panY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const b of bounds) {
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.width > maxX) maxX = b.x + b.width;
    if (b.y + b.height > maxY) maxY = b.y + b.height;
  }

  const boundsWidth = maxX - minX || 1;
  const boundsHeight = maxY - minY || 1;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const zoomX = (containerWidth - padding * 2) / boundsWidth;
  const zoomY = (containerHeight - padding * 2) / boundsHeight;
  const zoom = Math.max(minZoom, Math.min(maxZoom, Math.min(zoomX, zoomY)));

  return {
    zoom,
    panX: containerWidth / 2 - centerX * zoom,
    panY: containerHeight / 2 - centerY * zoom,
  };
}

/**
 * Center a specific world point in the viewport.
 */
export function centerOnPoint(
  point: Point,
  viewport: ViewportState,
  containerWidth: number,
  containerHeight: number
): ViewportState {
  return {
    zoom: viewport.zoom,
    panX: containerWidth / 2 - point.x * viewport.zoom,
    panY: containerHeight / 2 - point.y * viewport.zoom,
  };
}

/**
 * Clamp a viewport so the canvas edges don't scroll too far.
 * Works for "soft clamping" — allows some overscroll.
 */
export function clampViewport(
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number,
  containerWidth: number,
  containerHeight: number,
  overscroll: number = 200
): ViewportState {
  const visibleW = containerWidth / viewport.zoom;
  const visibleH = containerHeight / viewport.zoom;

  return {
    zoom: viewport.zoom,
    panX: Math.max(
      containerWidth - canvasWidth * viewport.zoom - overscroll,
      Math.min(overscroll, viewport.panX)
    ),
    panY: Math.max(
      containerHeight - canvasHeight * viewport.zoom - overscroll,
      Math.min(overscroll, viewport.panY)
    ),
  };
}

/**
 * Check if a world-space rect is visible in the current viewport (frustum culling).
 */
export function isRectVisible(
  rect: Rect,
  viewport: ViewportState,
  containerWidth: number,
  containerHeight: number
): boolean {
  const left = -viewport.panX / viewport.zoom;
  const top = -viewport.panY / viewport.zoom;
  const right = left + containerWidth / viewport.zoom;
  const bottom = top + containerHeight / viewport.zoom;

  return (
    rect.x < right &&
    rect.x + rect.width > left &&
    rect.y < bottom &&
    rect.y + rect.height > top
  );
}
