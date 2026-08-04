/**
 * Mesh Generator
 *
 * Generates quad-based 3D meshes from 2D parametric geometry + thickness.
 * Every component automatically generates its 3D representation.
 */

import type { Geometry2D, Mesh3D } from "./ProductModel";
import { getMaterial } from "./MaterialSystem";

export function generateMesh(
  geometry: Geometry2D,
  thickness: number,
  material: string = "thermocol",
): Mesh3D {
  const mat = getMaterial(material);
  const t = thickness || mat.defaultThickness;

  // Generate extruded box with thickness
  const { x, y, width, height, cornerRadius } = geometry;
  const hw = width / 2;
  const hh = height / 2;
  const ht = t / 2;

  // Vertices: front face (4), back face (4) = 8
  const vertices = new Float32Array([
    // Front face (z = +ht)
    x - hw, y - hh,  ht,
    x + hw, y - hh,  ht,
    x + hw, y + hh,  ht,
    x - hw, y + hh,  ht,
    // Back face (z = -ht)
    x - hw, y - hh, -ht,
    x + hw, y - hh, -ht,
    x + hw, y + hh, -ht,
    x - hw, y + hh, -ht,
  ]);

  // Normals
  const normals = new Float32Array([
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
  ]);

  // UVs
  const uvs = new Float32Array([
    0, 0,  1, 0,  1, 1,  0, 1,
    0, 0,  1, 0,  1, 1,  0, 1,
  ]);

  // Indices: front (2 tris), back (2 tris), 4 sides (8 tris) = 12 triangles
  const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,       // front
    4, 6, 5,  4, 7, 6,       // back
    0, 4, 1,  1, 4, 5,       // top
    1, 5, 2,  2, 5, 6,       // right
    2, 6, 3,  3, 6, 7,       // bottom
    3, 7, 0,  0, 7, 4,       // left
  ]);

  return { vertices, normals, uvs, indices, thickness: t };
}

/** Convert 2D bounding rect to a front-face-only quad (for 2.5D display) */
export function generateFlatMesh(geometry: Geometry2D): Mesh3D {
  return generateMesh(geometry, 1, "thermocol");
}

/** Calculate mesh bounding box */
export function meshBounds(mesh: Mesh3D): { min: [number, number, number]; max: [number, number, number] } {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < mesh.vertices.length; i += 3) {
    const x = mesh.vertices[i]!, y = mesh.vertices[i + 1]!, z = mesh.vertices[i + 2]!;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }

  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

/** Estimate mesh vertex count for performance tracking */
export function meshVertexCount(mesh: Mesh3D): number {
  return mesh.vertices.length / 3;
}
