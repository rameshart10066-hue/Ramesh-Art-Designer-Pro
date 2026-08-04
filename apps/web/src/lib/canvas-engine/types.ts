// ──────────────────────────────────────────────────────────────────
// Canvas Engine – Core Types
// ──────────────────────────────────────────────────────────────────

/** 2D point */
export interface Point {
  x: number;
  y: number;
}

/** Axis-aligned bounding box */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Viewport state */
export interface ViewportState {
  /** Zoom level (1 = 100%) */
  zoom: number;
  /** Pan offset in screen pixels (X) */
  panX: number;
  /** Pan offset in screen pixels (Y) */
  panY: number;
}

/** Canvas interaction mode */
export type InteractionMode =
  | "idle"
  | "panning"
  | "selecting"          // rubber-band selection rectangle
  | "dragging"           // moving object(s)
  | "resizing"           // resizing a single object
  | "rotating"           // rotating a single object
  | "drawing"            // creating a new shape
  | "space-panning";     // space held + mouse drag

/** Resize corner / edge identifier (8-handle) */
export type ResizeCorner =
  | "nw" | "n" | "ne"
  | "e"
  | "se" | "s" | "sw"
  | "w";

/** Runtime interaction context (ref, not state — never triggers renders) */
export interface InteractionContext {
  mode: InteractionMode;
  /** The object being interacted with (single object operations) */
  targetId: number | null;
  /** Object ids being dragged (multi-select drag) */
  dragTargetIds: number[];
  /** Pointer start position (screen coords) */
  pointerStart: Point;
  /** Pointer start position (canvas/world coords) */
  pointerStartWorld: Point;
  /** Object state snapshots before interaction began (for undo batching) */
  objectSnapshots: Map<number, ObjectSnapshot>;
  /** Resize corner for resize mode */
  resizeCorner: ResizeCorner | null;
  /** Rotation center (world coords) */
  center: Point;
  /** Selection rectangle (screen coords) */
  selectionRect: Rect | null;
  /** Whether shift key was held on pointer-down (constrain proportions) */
  shiftKey: boolean;
  /** Whether alt key was held (resize from center) */
  altKey: boolean;
}

/** Snapshot of one object's mutable properties (for undo/redo) */
export interface ObjectSnapshot {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

/** Snapping axis */
export type SnapAxis = "horizontal" | "vertical";

/** A single snap guide line */
export interface SnapGuide {
  position: number;       // world coordinate (px)
  axis: SnapAxis;
  type: "edge" | "center" | "grid" | "canvas-edge" | "canvas-center";
  /** Objects that triggered this guide (empty for grid/canvas) */
  relatedObjectIds: number[];
}

/** Result of snap calculation */
export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
  snappedX: boolean;
  snappedY: boolean;
}

/** Grid configuration */
export interface GridConfig {
  enabled: boolean;
  /** Base grid size in world units (px) */
  size: number;
  /** Whether to snap to grid */
  snapEnabled: boolean;
  /** Subdivision lines (e.g. 5 = lines every size/5) */
  subdivisions: number;
  /** Show grid dots instead of lines for performance */
  dotMode: boolean;
}

/** Guide configuration */
export interface GuideConfig {
  enabled: boolean;
  /** Snap tolerance in world units (px) */
  tolerance: number;
  /** Whether to snap to object edges/centers */
  snapToObjects: boolean;
  /** Whether to snap to canvas edges/center */
  snapToCanvas: boolean;
}

/** Canvas engine settings */
export interface CanvasSettings {
  grid: GridConfig;
  guides: GuideConfig;
  /** Minimum zoom (0.1 = 10%) */
  minZoom: number;
  /** Maximum zoom (8 = 800%) */
  maxZoom: number;
  /** Zoom step per wheel tick */
  zoomStep: number;
  /** Whether rulers are visible */
  showRulers: boolean;
  /** Whether the minimap is visible */
  showMinimap: boolean;
  /** Canvas content width in world units */
  canvasWidth: number;
  /** Canvas content height in world units */
  canvasHeight: number;
}

/** Default canvas settings */
export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  grid: {
    enabled: true,
    size: 25,
    snapEnabled: false,
    subdivisions: 5,
    dotMode: false,
  },
  guides: {
    enabled: true,
    tolerance: 8,
    snapToObjects: true,
    snapToCanvas: true,
  },
  minZoom: 0.1,
  maxZoom: 8,
  zoomStep: 0.1,
  showRulers: false,
  showMinimap: true,
  canvasWidth: 3000,
  canvasHeight: 3000,
};

/** Keyboard shortcut definition */
export interface ShortcutDef {
  /** Display label */
  label: string;
  /** Key(s) to press */
  keys: string;
  /** Category for grouping in help panel */
  category: string;
}
