/**
 * Three.js Material Library
 *
 * Pre-built Three.js materials for each supported product material.
 * Includes color, roughness, metalness, and opacity settings.
 */

import * as THREE from "three";
import { getMaterialList, type MaterialDef } from "@/product-model/MaterialSystem";

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/** Get or create a Three.js material for a product material */
export function getThreeMaterial(materialId: string, colorOverride?: string): THREE.MeshStandardMaterial {
  const cacheKey = `${materialId}-${colorOverride || "default"}`;
  const cached = materialCache.get(cacheKey);
  if (cached) return cached;

  const mat = getMaterialList().find((m) => m.id === materialId);
  if (!mat) return getDefaultMaterial();

  const color = colorOverride || mat.color;
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: mat.roughness,
    metalness: mat.metalness,
    opacity: mat.opacity,
    transparent: mat.opacity < 1,
    side: THREE.DoubleSide,
  });

  materialCache.set(cacheKey, material);
  return material;
}

function getDefaultMaterial(): THREE.MeshStandardMaterial {
  const key = "__default";
  const cached = materialCache.get(key);
  if (cached) return cached;

  const material = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.7,
    metalness: 0.1,
  });
  materialCache.set(key, material);
  return material;
}

/** Clear all cached materials */
export function clearMaterialCache(): void {
  for (const mat of materialCache.values()) {
    mat.dispose();
  }
  materialCache.clear();
}

/** Create a selection highlight material */
export function createHighlightMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x1e40af,
    emissiveIntensity: 0.3,
    roughness: 0.3,
    metalness: 0.1,
  });
}
