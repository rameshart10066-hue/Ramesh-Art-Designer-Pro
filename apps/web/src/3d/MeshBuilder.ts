/**
 * Mesh Builder
 *
 * Converts MeshGenerator output into Three.js BufferGeometry + Mesh objects.
 * Manages material assignment and mesh disposal.
 */

import * as THREE from "three";
import type { Mesh3D } from "@/product-model/ProductModel";
import { getMaterial } from "@/product-model/MaterialSystem";

export function buildMesh(
  meshData: Mesh3D,
  materialId: string = "thermocol",
  colorOverride?: string,
): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(meshData.vertices, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(meshData.normals, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(meshData.uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
  geometry.computeVertexNormals();

  const mat = getMaterial(materialId);
  const color = colorOverride || mat.color;

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: mat.roughness,
    metalness: mat.metalness,
    opacity: mat.opacity,
    transparent: mat.opacity < 1,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

export function buildWireframe(meshData: Mesh3D): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(meshData.vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(meshData.indices, 1));

  const edges = new THREE.EdgesGeometry(geometry);
  const material = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.5 });
  return new THREE.LineSegments(edges, material);
}

export function disposeMesh(mesh: THREE.Mesh): void {
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((m) => m.dispose());
  } else {
    mesh.material.dispose();
  }
}
