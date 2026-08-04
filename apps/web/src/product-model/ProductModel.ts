/**
 * Product Model — Core
 *
 * Every component exists simultaneously as:
 *   • Parametric Object (params)
 *   • 2D CAD Object (geometry)
 *   • 3D Mesh (vertices/faces)
 *   • Manufacturing Object (materials, cut data)
 *   • Assembly Object (parent/children, order)
 *
 * All representations are synchronized through the regeneration engine.
 */

export interface ProductModel {
  id: number;
  type: string;
  name: string;

  /** Parametric parameters that define this component */
  params: Record<string, any>;

  /** 2D geometry generated from params */
  geometry2D: Geometry2D;

  /** 3D mesh generated from params + thickness */
  mesh3D: Mesh3D | null;

  /** Manufacturing data */
  manufacturing: ManufacturingData;

  /** Assembly data */
  assembly: AssemblyData;

  /** Product metadata */
  metadata: ProductMeta;
}

export interface Geometry2D {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  cornerRadius?: number;
  pathData?: string;
}

export interface Mesh3D {
  vertices: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint16Array;
  thickness: number;
}

export interface ManufacturingData {
  material: string;
  thickness: number;
  partNumber: string;
  cutType: "cut" | "score" | "engrave" | "mark";
  jointType: "none" | "finger" | "dovetail" | "butt";
  laserLayer: string;
  cutPriority: number;
  estimatedTime: number;
  estimatedCost: number;
  weight: number;
  quantity: number;
}

export interface AssemblyData {
  parentId: number | null;
  children: number[];
  assemblyOrder: number;
  connectionType: "glue" | "slot" | "snap" | "screw" | "none";
  jointType: "none" | "finger" | "dovetail" | "butt";
  assemblyStep: string;
}

export interface ProductMeta {
  category: string;
  theme: string;
  complexity: 1 | 2 | 3 | 4 | 5;
  manufacturingDifficulty: 1 | 2 | 3 | 4 | 5;
  assemblyDifficulty: 1 | 2 | 3 | 4 | 5;
  inventoryId: string;
  aiMetadata: Record<string, any>;
}
