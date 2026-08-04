/**
 * Professional Path System
 *
 * Complete data model for editable vector paths,
 * nodes, bezier handles, and boolean operations.
 */

// ── Path Node Types ──────────────────────────────────────────────

export type NodeType = "corner" | "smooth" | "symmetrical";

export interface BezierHandle {
  x: number;
  y: number;
}

export interface PathNode {
  id: number;
  x: number;
  y: number;
  type: NodeType;
  /** Control point leading into this node (previous segment) */
  handleIn: BezierHandle | null;
  /** Control point leading out of this node (next segment) */
  handleOut: BezierHandle | null;
  selected: boolean;
}

// ── Path Data ────────────────────────────────────────────────────

export interface PathData {
  nodes: PathNode[];
  closed: boolean;
  /** Fill rule for overlapping sub-paths */
  fillRule: "nonzero" | "evenodd";
}

// ── Segment Types ────────────────────────────────────────────────

export type SegmentType = "line" | "quadratic" | "cubic";

export interface Segment {
  type: SegmentType;
  startIndex: number;
  endIndex: number;
  /** Control points for bezier curves */
  cp?: BezierHandle;
  cp1?: BezierHandle;
  cp2?: BezierHandle;
}

// ── Boolean Operation Types ──────────────────────────────────────

export type BooleanOp =
  | "union"
  | "subtract"
  | "intersect"
  | "exclude"
  | "divide"
  | "trim"
  | "merge";

export interface BooleanResult {
  pathData: PathData;
  label: string;
}

// ── Alignment Types ──────────────────────────────────────────────

export type AlignMode =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "centerH"
  | "centerV"
  | "distributeH"
  | "distributeV";

// ── Measurement Types ────────────────────────────────────────────

export interface MeasurementResult {
  distance: number;
  angle: number;
  deltaX: number;
  deltaY: number;
}

// ── Transform Types ──────────────────────────────────────────────

export type FlipAxis = "horizontal" | "vertical";
export type MirrorAxis = "horizontal" | "vertical" | "both";
