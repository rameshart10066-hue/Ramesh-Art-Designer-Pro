// ──────────────────────────────────────────────────────────────────
// Canvas Engine – Barrel Exports
// ──────────────────────────────────────────────────────────────────

// Core types
export type {
  Point,
  Rect,
  ViewportState,
  InteractionMode,
  InteractionContext,
  ResizeCorner,
  ObjectSnapshot,
  SnapAxis,
  SnapGuide,
  SnapResult,
  GridConfig,
  GuideConfig,
  CanvasSettings,
  ShortcutDef,
} from "./types";

export { DEFAULT_CANVAS_SETTINGS } from "./types";

// Viewport & coordinate transforms
export {
  screenToWorld,
  worldToScreen,
  screenRectToWorld,
  worldRectToScreen,
  zoomTowardsPoint,
  wheelZoomDelta,
  fitToViewport,
  centerOnPoint,
  clampViewport,
  isRectVisible,
} from "./viewport";

// Grid system
export {
  dynamicGridSize,
  generateGrid,
  snapToGrid,
  snapPointToGrid,
} from "./grid";

export type { GridLine, GridData } from "./grid";

// Snapping & smart guides
export {
  getAlignmentPoints,
  findSnapCandidates,
  findCanvasSnapCandidates,
  resolveSnap,
  snapToGridLine,
  isPointOnGuide,
} from "./snapping";

export type { AlignmentPoints } from "./snapping";

// Selection, hit testing & rect math
export {
  normaliseRect,
  pointInRect,
  rectsIntersect,
  rectCenter,
  unionRects,
  getRotatedBounds,
  pointNearRectEdge,
  getResizeHandlePositions,
  getRotationHandlePosition,
} from "./selection";

// Interaction state machine
export {
  createInteractionContext,
  startPan,
  startSelection,
  startDrag,
  startResize,
  startRotate,
  updateSelectionRect,
  endInteraction,
  computeResize,
  computeRotation,
  computeDragDelta,
  isPanTrigger,
  getModeFromEvent,
} from "./interaction";
