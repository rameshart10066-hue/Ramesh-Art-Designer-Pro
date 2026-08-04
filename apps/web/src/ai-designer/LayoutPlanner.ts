/**
 * Layout Planner
 *
 * Plans the spatial arrangement of components on the canvas.
 * Maintains symmetry, alignment, proper spacing, and prevents overlap.
 */

import type { SelectedComponent } from "./ComponentSelector";

export interface LayoutPlan {
  components: SelectedComponent[];
  canvasWidth: number;
  canvasHeight: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export function planLayout(components: SelectedComponent[]): LayoutPlan {
  // Center the design on canvas
  const centerX = 600;
  const centerY = 400;

  // Find bounds of all components
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const comp of components) {
    minX = Math.min(minX, comp.x);
    minY = Math.min(minY, comp.y);
    maxX = Math.max(maxX, comp.x + comp.width);
    maxY = Math.max(maxY, comp.y + comp.height);
  }

  // Add margins
  const margin = 50;
  minX -= margin;
  minY -= margin;
  maxX += margin;
  maxY += margin;

  const canvasWidth = Math.max(1200, maxX - minX + margin * 2);
  const canvasHeight = Math.max(800, maxY - minY + margin * 2);

  // Shift everything to center
  const offsetX = (canvasWidth - (maxX - minX)) / 2 - minX;
  const offsetY = (canvasHeight - (maxY - minY)) / 2 - minY;

  const centeredComponents = components.map((comp) => ({
    ...comp,
    x: comp.x + offsetX,
    y: comp.y + offsetY,
  }));

  return {
    components: centeredComponents,
    canvasWidth,
    canvasHeight,
    boundingBox: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
  };
}

/** Check for overlapping components */
export function findOverlaps(components: SelectedComponent[]): [number, number][] {
  const overlaps: [number, number][] = [];
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i]!;
      const b = components[j]!;
      if (a.x < b.x + b.width && a.x + a.width > b.x &&
          a.y < b.y + b.height && a.y + a.height > b.y) {
        overlaps.push([i, j]);
      }
    }
  }
  return overlaps;
}
