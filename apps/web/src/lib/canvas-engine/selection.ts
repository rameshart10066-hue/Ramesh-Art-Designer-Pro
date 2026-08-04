// ──────────────────────────────────────────────────────────────────
// Canvas Engine – Selection Rect, Hit Testing & Bounds
// ──────────────────────────────────────────────────────────────────

import type { Point, Rect } from "./types";

/**
 * Normalise a rect so width/height are always positive (handles
 * drag in any direction for the selection rectangle).
 */
export function normaliseRect(raw: Rect): Rect {
  const x = raw.width < 0 ? raw.x + raw.width : raw.x;
  const y = raw.height < 0 ? raw.y + raw.height : raw.y;
  return {
    x,
    y,
    width: Math.abs(raw.width),
    height: Math.abs(raw.height),
  };
}

/**
 * Test whether a point lies inside a rect (axis-aligned).
 */
export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Test whether one rect intersects another.
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Get the geometric centre of a rect.
 */
export function rectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Compute the combined bounding box of multiple rects.
 */
export function unionRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y + r.height > maxY) maxY = r.y + r.height;
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Compute the bounding box of a rotated rect (returns the AABB in world space).
 */
export function getRotatedBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  rotationDeg: number
): Rect {
  if (rotationDeg === 0) {
    return { x, y, width, height };
  }

  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const halfW = width / 2;
  const halfH = height / 2;
  const newW = halfW * cos + halfH * sin;
  const newH = halfW * sin + halfH * cos;

  const cx = x + halfW;
  const cy = y + halfH;

  return {
    x: cx - newW,
    y: cy - newH,
    width: newW * 2,
    height: newH * 2,
  };
}

/**
 * Test if a point is within a certain distance of the edge of a rect
 * (useful for resize handle hit testing).
 */
export function pointNearRectEdge(
  point: Point,
  rect: Rect,
  threshold: number = 8
): {
  near: boolean;
  corner: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | null;
} {
  const { x, y, width, height } = rect;
  const nearLeft = Math.abs(point.x - x) <= threshold;
  const nearRight = Math.abs(point.x - (x + width)) <= threshold;
  const nearTop = Math.abs(point.y - y) <= threshold;
  const nearBottom = Math.abs(point.y - (y + height)) <= threshold;
  const insideX = point.x >= x - threshold && point.x <= x + width + threshold;
  const insideY = point.y >= y - threshold && point.y <= y + height + threshold;

  if (!insideX && !insideY) return { near: false, corner: null };

  // Corners take priority
  if (nearTop && nearLeft) return { near: true, corner: "nw" };
  if (nearTop && nearRight) return { near: true, corner: "ne" };
  if (nearBottom && nearLeft) return { near: true, corner: "sw" };
  if (nearBottom && nearRight) return { near: true, corner: "se" };

  // Edges
  if (nearTop && insideX) return { near: true, corner: "n" };
  if (nearBottom && insideX) return { near: true, corner: "s" };
  if (nearLeft && insideY) return { near: true, corner: "w" };
  if (nearRight && insideY) return { near: true, corner: "e" };

  return { near: false, corner: null };
}

/**
 * Get the 8 resize handle positions for a rect (used to render handles).
 */
export function getResizeHandlePositions(
  rect: Rect
): Record<string, Point> {
  const { x, y, width, height } = rect;
  return {
    nw: { x, y },
    n: { x: x + width / 2, y },
    ne: { x: x + width, y },
    e: { x: x + width, y: y + height / 2 },
    se: { x: x + width, y: y + height },
    s: { x: x + width / 2, y: y + height },
    sw: { x, y: y + height },
    w: { x, y: y + height / 2 },
  };
}

/**
 * Get the rotation handle position (centered above the rect).
 */
export function getRotationHandlePosition(
  rect: Rect,
  offset: number = 35
): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y - offset,
  };
}
