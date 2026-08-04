/**
 * Packaging Engine
 *
 * Calculates packaging requirements for manufactured parts:
 * box size, number of boxes, shipping weight, and packing density.
 */

import { getMaterial } from "./MaterialSystem";
import type { ManufacturingData } from "./ProductModel";

export interface PackagingResult {
  parts: number;
  boxes: number;
  boxWidth: number;
  boxHeight: number;
  boxDepth: number;
  totalWeight: number;
  volume: number;
  packingDensity: number;
}

export function calculatePackaging(
  items: { width: number; height: number; mfg: ManufacturingData }[],
): PackagingResult {
  if (items.length === 0) {
    return { parts: 0, boxes: 1, boxWidth: 300, boxHeight: 200, boxDepth: 100, totalWeight: 0, volume: 0, packingDensity: 1 };
  }

  const maxW = Math.max(...items.map((i) => i.width));
  const maxH = Math.max(...items.map((i) => i.height));
  const totalT = items.reduce((s, i) => s + i.mfg.thickness, 0);

  const boxW = Math.max(300, maxW + 50);
  const boxH = Math.max(200, maxH + 50);
  const boxD = Math.max(100, totalT + 20);

  const boxVolume = boxW * boxH * boxD;
  const partVolume = items.reduce((s, i) => s + i.width * i.height * i.mfg.thickness, 0);
  const packingDensity = boxVolume > 0 ? Math.min(1, partVolume / boxVolume) : 0.1;

  const totalWeight = items.reduce((s, i) => {
    const mat = getMaterial(i.mfg.material);
    const area = (i.width * i.height) / 1_000_000;
    return s + area * mat.weightPerSqM;
  }, 0);

  return {
    parts: items.length,
    boxes: Math.max(1, Math.ceil(totalT / 200)), // 200mm max per box
    boxWidth: Math.round(boxW),
    boxHeight: Math.round(boxH),
    boxDepth: Math.round(boxD),
    totalWeight: Math.round(totalWeight * 100) / 100,
    volume: Math.round(boxVolume / 1_000_000 * 100) / 100,
    packingDensity: Math.round(packingDensity * 100),
  };
}
