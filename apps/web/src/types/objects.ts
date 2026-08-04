/**
 * Professional Object System
 *
 * Base types and interfaces for all canvas objects
 * Supports polymorphism, serialization, and SVG export
 */

export type ObjectType =
  // Basic shapes
  | "rectangle"
  | "circle"
  | "ellipse"
  | "polygon"
  | "star"
  | "line"
  | "text"
  | "image"
  | "svg"
  // Ganpati objects
  | "mandap"
  | "pillar"
  | "arch"
  | "dome"
  | "base-platform"
  | "lotus"
  | "peacock"
  | "kalash"
  | "prabhavali"
  | "om-symbol"
  | "swastik"
  | "deepak"
  | "bell"
  | "flower"
  | "garland"
  | "toran"
  // Frame / border / background design types
  | "simple-frame"
  | "lotus-frame"
  | "temple-frame"
  | "background-panel"
  | "lotus-border"
  | "temple-border"
  | "stage"
  | "om"
  | "lighting"
  | "decorative-shape"
  | "custom-svg";

export type ObjectCategory = "basic" | "ganpati" | "decoration";

export interface ShadowConfig {
  blur: number;
  offsetX: number;
  offsetY: number;
  color: string;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Base Object Data Structure
 *
 * All canvas objects share this common structure
 */
export interface BaseObjectData {
  // Identity
  id: number;
  type: ObjectType;
  category: ObjectCategory;
  name: string;

  // Transform
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;

  // Appearance
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadow?: ShadowConfig;
  cornerRadius?: number;

  // State
  visible: boolean;
  locked: boolean;

  // Ordering
  zIndex: number;
  parentId?: number;
  children: number[];

  // Text properties (for text type)
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  lineHeight?: number;

  // Image properties (for image type)
  src?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;

  // Custom data
  metadata: Record<string, any>;
  // Manufacturing data
  materialThickness?: number;
  cutPriority?: number;
  engravePriority?: number;
  partNumber?: string;
  mirror?: boolean;
  layerColor?: string;
  cutThrough?: boolean;
}

/**
 * Extended data for specific object types
 */
export interface TextObjectData extends BaseObjectData {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
}

export interface ImageObjectData extends BaseObjectData {
  type: "image";
  src: string;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

export interface PolygonObjectData extends BaseObjectData {
  type: "polygon";
  sides: number;
}

export interface StarObjectData extends BaseObjectData {
  type: "star";
  points: number;
  innerRadius: number;
}

export interface SVGObjectData extends BaseObjectData {
  type: "svg";
  svgContent: string;
  preserveAspectRatio: boolean;
}

/**
 * Union type for all object data
 */
export type CanvasObjectData =
  | BaseObjectData
  | TextObjectData
  | ImageObjectData
  | PolygonObjectData
  | StarObjectData
  | SVGObjectData;

/**
 * Serialized object format for export/import
 */
export interface SerializedObject {
  version: string;
  data: CanvasObjectData;
}

/**
 * Base Canvas Object Interface
 *
 * All canvas objects must implement these methods
 */
export interface ICanvasObject {
  // Data access
  getData(): CanvasObjectData;

  // Rendering
  draw(ctx: CanvasRenderingContext2D): void;

  // Interaction
  hitTest(point: Point): boolean;
  getBounds(): Bounds;

  // Serialization
  serialize(): SerializedObject;

  // Operations
  duplicate(): ICanvasObject;

  // Updates
  update(data: Partial<CanvasObjectData>): void;

  // SVG Export
  toSVG(): string;
}

/**
 * Object Factory Configuration
 */
export interface ObjectConfig {
  type: ObjectType;
  category: ObjectCategory;
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  [key: string]: any;
}
