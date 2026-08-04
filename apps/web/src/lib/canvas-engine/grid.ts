// ──────────────────────────────────────────────────────────────────
// Canvas Engine – Grid System
// ──────────────────────────────────────────────────────────────────

import type { GridConfig, Point, ViewportState } from "./types";

/** A single grid line to render */
export interface GridLine {
  /** World-coordinate position */
  position: number;
  /** Line length (world units) */
  length: number;
  /** True = major (matches grid size), false = minor (subdivision) */
  major: boolean;
}

/** Full grid data for rendering */
export interface GridData {
  verticalLines: GridLine[];
  horizontalLines: GridLine[];
  /** World-coordinate origin offset for grid alignment */
  originX: number;
  originY: number;
}

/**
 * Compute the dynamic grid size based on zoom level.
 * As the user zooms out, we increase the effective grid spacing
 * to avoid visual clutter.
 */
export function dynamicGridSize(
  baseSize: number,
  zoom: number,
  maxGridPixels: number = 60
): number {
  let size = baseSize;
  const pixelSize = size * zoom;

  if (pixelSize < 8) {
    // Too small — multiply until visible
    while (size * zoom < maxGridPixels / 2) {
      size *= 5;
    }
  }

  return size;
}

/**
 * Generate grid lines for the visible area.
 * Only produces lines that fall within the viewport for performance.
 */
export function generateGrid(
  config: GridConfig,
  viewport: ViewportState,
  containerWidth: number,
  containerHeight: number
): GridData {
  if (!config.enabled) {
    return { verticalLines: [], horizontalLines: [], originX: 0, originY: 0 };
  }

  const effectiveSize = dynamicGridSize(config.size, viewport.zoom);
  const subdivSize = effectiveSize / config.subdivisions;

  // Visible world bounds (with some margin)
  const margin = effectiveSize;
  const worldLeft = -viewport.panX / viewport.zoom - margin;
  const worldTop = -viewport.panY / viewport.zoom - margin;
  const worldRight = worldLeft + containerWidth / viewport.zoom + margin * 2;
  const worldBottom = worldTop + containerHeight / viewport.zoom + margin * 2;

  // Align to grid
  const originX = Math.floor(worldLeft / effectiveSize) * effectiveSize;
  const originY = Math.floor(worldTop / effectiveSize) * effectiveSize;

  const verticalLines: GridLine[] = [];
  const horizontalLines: GridLine[] = [];

  // Clamp world coords to a reasonable range to prevent overflow
  const MAX_WORLD = 1_000_000;

  // Vertical lines
  for (let x = originX; x <= worldRight && x < MAX_WORLD; x += effectiveSize) {
    if (x >= worldLeft) {
      verticalLines.push({ position: x, length: worldBottom - worldTop, major: true });
    }
  }

  // Horizontal lines
  for (let y = originY; y <= worldBottom && y < MAX_WORLD; y += effectiveSize) {
    if (y >= worldTop) {
      horizontalLines.push({ position: y, length: worldRight - worldLeft, major: true });
    }
  }

  // Subdivision lines (only if zoomed in enough)
  if (config.subdivisions > 1 && effectiveSize * viewport.zoom > 30) {
    // Vertical subdivisions
    for (let x = originX; x <= worldRight && x < MAX_WORLD; x += subdivSize) {
      if (x >= worldLeft) {
        // Check if this isn't already a major line
        const isMajor = Math.abs((x - originX) % effectiveSize) < 0.1;
        if (!isMajor) {
          verticalLines.push({ position: x, length: worldBottom - worldTop, major: false });
        }
      }
    }

    // Horizontal subdivisions
    for (let y = originY; y <= worldBottom && y < MAX_WORLD; y += subdivSize) {
      if (y >= worldTop) {
        const isMajor = Math.abs((y - originY) % effectiveSize) < 0.1;
        if (!isMajor) {
          horizontalLines.push({ position: y, length: worldRight - worldLeft, major: false });
        }
      }
    }
  }

  return { verticalLines, horizontalLines, originX, originY };
}

/**
 * Snaps a world-coordinate value to the nearest grid intersection.
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Snaps a point to the grid.
 */
export function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}
