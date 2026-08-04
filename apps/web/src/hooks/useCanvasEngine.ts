/**
 * useCanvasEngine – React integration for the canvas engine library.
 *
 * Bridges the pure functions in lib/canvas-engine/ with React state
 * and the editor stores, providing a single hook that components
 * can use for coordinate transforms, snapping, hit‑testing, resize
 * computations, and grid generation — all driven by the engine.
 *
 * Every consumer gets the same engine-backed helpers without
 * duplicating the import chain.
 */

import { useCallback, useMemo } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";

// ── Canvas Engine imports ───────────────────────────────────────
import {
  screenToWorld,
  worldToScreen,
  zoomTowardsPoint,
  wheelZoomDelta,
  fitToViewport,
  centerOnPoint,
  isRectVisible,
} from "@/lib/canvas-engine/viewport";

import {
  pointInRect,
  rectsIntersect,
  pointNearRectEdge,
  getRotatedBounds,
  getResizeHandlePositions,
  getRotationHandlePosition,
  unionRects,
  rectCenter,
} from "@/lib/canvas-engine/selection";

import {
  findSnapCandidates,
  findCanvasSnapCandidates,
  resolveSnap,
  getAlignmentPoints,
} from "@/lib/canvas-engine/snapping";

import {
  generateGrid,
  dynamicGridSize,
  snapToGrid,
} from "@/lib/canvas-engine/grid";

import {
  computeResize,
  computeRotation,
  computeDragDelta,
} from "@/lib/canvas-engine/interaction";

import type { Point, Rect, ViewportState } from "@/lib/canvas-engine/types";

// ── Return type ──────────────────────────────────────────────────

export interface CanvasEngineAPI {
  /** Coordinate transforms */
  screenToWorld(screenX: number, screenY: number): Point;
  worldToScreen(worldX: number, worldY: number): Point;
  zoomTowardsPoint(pivotX: number, pivotY: number, newZoom: number): void;

  /** Hit testing & selection */
  pointInRect(point: Point, rect: Rect): boolean;
  rectsIntersect(a: Rect, b: Rect): boolean;
  pointNearRectEdge(point: Point, rect: Rect, threshold?: number): ReturnType<typeof pointNearRectEdge>;
  getResizeHandlePositions(rect: Rect): Record<string, Point>;
  getRotationHandlePosition(rect: Rect, offset?: number): Point;
  getRotatedBounds(x: number, y: number, width: number, height: number, rotationDeg: number): Rect;
  unionRects(rects: Rect[]): Rect | null;
  rectCenter(rect: Rect): Point;

  /** Snapping */
  findSnapCandidates(moving: Rect, targets: Rect[], tolerance: number): any[];
  findCanvasSnapCandidates(moving: Rect, cw: number, ch: number, tol: number): any[];
  resolveSnap(x: number, y: number, candidates: any[]): { x: number; y: number; guides: any[]; snappedX: boolean; snappedY: boolean };
  getAlignmentPoints(r: Rect): ReturnType<typeof getAlignmentPoints>;
  snapToGrid(value: number, size: number): number;

  /** Interaction computations */
  computeResize(snapshot: any, corner: string, dx: number, dy: number, shift: boolean, alt: boolean): { x: number; y: number; width: number; height: number };
  computeRotation(center: Point, pointer: Point): number;
  computeDragDelta(pointer: Point, start: Point, zoom: number): { dx: number; dy: number };

  /** Grid */
  generateGrid(config: any, viewport: ViewportState, cw: number, ch: number): any;
  dynamicGridSize(baseSize: number, zoom: number, maxPixels?: number): number;

  /** Viewport helpers */
  isRectVisible(r: Rect): boolean;
  fitToViewport(bounds: Rect[], padding?: number): void;
  centerOnPoint(point: Point): void;
  wheelZoomDelta(deltaY: number, step?: number): number;

  /** Current viewport state */
  viewport: ViewportState;
  containerOrigin: Point;
}

/**
 * Hook that exposes the full canvas engine API wired to the current
 * editor store state.
 *
 * Usage:
 * ```ts
 * const engine = useCanvasEngine(containerRef);
 * const worldPt = engine.screenToWorld(100, 200);
 * const snapped = engine.resolveSnap(x, y, candidates);
 * ```
 */
export function useCanvasEngine(
  containerWidth: number,
  containerHeight: number,
  containerOriginX: number = 0,
  containerOriginY: number = 0,
): CanvasEngineAPI {
  const zoom = useEditorStoreV2((s) => s.zoom);
  const panX = useEditorStoreV2((s) => s.panX);
  const panY = useEditorStoreV2((s) => s.panY);
  const setZoom = useEditorStoreV2((s) => s.setZoom);
  const setPan = useEditorStoreV2((s) => s.setPan);
  const canvasWidth = useEditorStoreV2((s) => s.gridSize * 100);
  const canvasHeight = useEditorStoreV2((s) => s.gridSize * 100);
  const snapTolerance = useEditorStoreV2((s) => s.snapTolerance);
  const gridSize = useEditorStoreV2((s) => s.gridSize);

  const containerOrigin: Point = useMemo(
    () => ({ x: containerOriginX, y: containerOriginY }),
    [containerOriginX, containerOriginY]
  );

  const viewport: ViewportState = useMemo(
    () => ({ zoom, panX, panY }),
    [zoom, panX, panY]
  );

  // ── Coordinate transforms ─────────────────────────────────────

  const stw = useCallback(
    (screenX: number, screenY: number) =>
      screenToWorld({ x: screenX, y: screenY }, viewport, containerOrigin),
    [viewport, containerOrigin]
  );

  const wts = useCallback(
    (worldX: number, worldY: number) =>
      worldToScreen({ x: worldX, y: worldY }, viewport, containerOrigin),
    [viewport, containerOrigin]
  );

  const ztp = useCallback(
    (pivotX: number, pivotY: number, newZoom: number) => {
      const result = zoomTowardsPoint(
        viewport,
        newZoom,
        { x: pivotX, y: pivotY },
        containerOrigin
      );
      setZoom(result.zoom);
      setPan(result.panX, result.panY);
    },
    [viewport, containerOrigin, setZoom, setPan]
  );

  // ── Viewport helpers ──────────────────────────────────────────

  const isVis = useCallback(
    (r: Rect) =>
      isRectVisible(r, viewport, containerWidth, containerHeight),
    [viewport, containerWidth, containerHeight]
  );

  const ftv = useCallback(
    (bounds: Rect[], padding = 50) => {
      const result = fitToViewport(
        bounds,
        containerWidth,
        containerHeight,
        padding
      );
      setZoom(result.zoom);
      setPan(result.panX, result.panY);
    },
    [containerWidth, containerHeight, setZoom, setPan]
  );

  const cop = useCallback(
    (point: Point) => {
      const result = centerOnPoint(point, viewport, containerWidth, containerHeight);
      setPan(result.panX, result.panY);
    },
    [viewport, containerWidth, containerHeight, setPan]
  );

  // ── Snap helpers ──────────────────────────────────────────────

  const snapCandidates = useCallback(
    (moving: Rect, targets: Rect[], tol?: number) =>
      findSnapCandidates(moving, targets, tol ?? snapTolerance),
    [snapTolerance]
  );

  const canvasSnap = useCallback(
    (moving: Rect, tol?: number) =>
      findCanvasSnapCandidates(moving, canvasWidth, canvasHeight, tol ?? snapTolerance),
    [canvasWidth, canvasHeight, snapTolerance]
  );

  // ── Grid helpers ──────────────────────────────────────────────

  const genGrid = useCallback(
    (config: any) =>
      generateGrid(config, viewport, containerWidth, containerHeight),
    [viewport, containerWidth, containerHeight]
  );

  // ── Return the full API surface ───────────────────────────────

  return useMemo(
    () => ({
      // Coord transforms
      screenToWorld: stw,
      worldToScreen: wts,
      zoomTowardsPoint: ztp,

      // Hit testing & selection
      pointInRect,
      rectsIntersect,
      pointNearRectEdge,
      getResizeHandlePositions,
      getRotationHandlePosition,
      getRotatedBounds,
      unionRects,
      rectCenter,

      // Snapping
      findSnapCandidates: snapCandidates,
      findCanvasSnapCandidates: canvasSnap,
      resolveSnap,
      getAlignmentPoints,
      snapToGrid,

      // Interaction
      computeResize,
      computeRotation,
      computeDragDelta,

      // Grid
      generateGrid: genGrid,
      dynamicGridSize,

      // Viewport
      isRectVisible: isVis,
      fitToViewport: ftv,
      centerOnPoint: cop,
      wheelZoomDelta,

      // State
      viewport,
      containerOrigin,
    }),
    [
      stw, wts, ztp,
      snapCandidates, canvasSnap,
      genGrid, isVis, ftv, cop,
      viewport, containerOrigin,
    ]
  );
}

export default useCanvasEngine;
