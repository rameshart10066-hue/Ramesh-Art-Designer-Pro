/**
 * Exploded View
 *
 * Calculates exploded positions for every component in an assembly.
 * Components move outward along their local Z-axis by a configurable factor.
 * Supports animation via interpolation.
 */

import type { AssemblyNode } from "./AssemblyGraph";

export interface ExplodedPosition {
  nodeId: number;
  /** Original position */
  originalX: number;
  originalY: number;
  originalZ: number;
  /** Exploded position */
  explodedX: number;
  explodedY: number;
  explodedZ: number;
  /** Offset distance from original */
  offset: number;
  /** Assembly label */
  label: string;
}

/** Calculate exploded positions for all nodes in an assembly */
export function calculateExplodedPositions(
  nodes: AssemblyNode[],
  originalPositions: Map<number, { x: number; y: number; z: number }>,
  factor: number = 1.5,
): ExplodedPosition[] {
  const result: ExplodedPosition[] = [];
  const depthMap = new Map<number, number>();

  // Calculate depth for each node (0 = root)
  function getDepth(id: number): number {
    if (depthMap.has(id)) return depthMap.get(id)!;
    const node = nodes.find((n) => n.id === id);
    if (!node || node.parentId == null) {
      depthMap.set(id, 0);
      return 0;
    }
    const depth = getDepth(node.parentId) + 1;
    depthMap.set(id, depth);
    return depth;
  }

  for (const node of nodes) {
    const pos = originalPositions.get(node.id);
    if (!pos) continue;

    const depth = getDepth(node.id);
    const offset = depth * 50 * factor;

    result.push({
      nodeId: node.id,
      originalX: pos.x,
      originalY: pos.y,
      originalZ: pos.z,
      explodedX: pos.x,
      explodedY: pos.y,
      explodedZ: pos.z + offset,
      offset,
      label: `${node.name}`,
    });
  }

  return result;
}

/** Interpolate between normal and exploded positions */
export function interpolateExploded(
  positions: ExplodedPosition[],
  t: number, // 0 = normal, 1 = fully exploded
): { nodeId: number; x: number; y: number; z: number }[] {
  return positions.map((p) => ({
    nodeId: p.nodeId,
    x: p.originalX + (p.explodedX - p.originalX) * t,
    y: p.originalY + (p.explodedY - p.originalY) * t,
    z: p.originalZ + (p.explodedZ - p.originalZ) * t,
  }));
}
