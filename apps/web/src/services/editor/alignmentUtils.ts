/**
 * Alignment & Distribution Utilities
 *
 * Pure functions for aligning and distributing objects.
 */

import type { BaseObjectData } from "@/types/objects";
import type { AlignMode } from "@/types/paths";
import type { Rect } from "@/lib/canvas-engine/types";

type Bounds = { x: number; y: number; width: number; height: number };

function getBounds(obj: BaseObjectData): Bounds {
  return { x: obj.x, y: obj.y, width: obj.width, height: obj.height };
}

function getSelectionBounds(objects: BaseObjectData[], ids: number[]): Bounds | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let found = false;
  for (const obj of objects) {
    if (!ids.includes(obj.id)) continue;
    const b = getBounds(obj);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
    found = true;
  }
  if (!found) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function alignObjects(
  objects: BaseObjectData[],
  ids: number[],
  mode: AlignMode,
): BaseObjectData[] {
  if (ids.length < 2) return objects;
  const selectionBounds = getSelectionBounds(objects, ids);
  if (!selectionBounds) return objects;

  const canvasCenterX = 1500; // canvas width / 2
  const canvasCenterY = 1500; // canvas height / 2

  return objects.map((obj) => {
    if (!ids.includes(obj.id)) return obj;
    const b = getBounds(obj);
    let newX = b.x, newY = b.y;

    switch (mode) {
      case "left":
        newX = selectionBounds.x;
        break;
      case "right":
        newX = selectionBounds.x + selectionBounds.width - b.width;
        break;
      case "top":
        newY = selectionBounds.y;
        break;
      case "bottom":
        newY = selectionBounds.y + selectionBounds.height - b.height;
        break;
      case "centerH":
        newX = selectionBounds.x + (selectionBounds.width - b.width) / 2;
        break;
      case "centerV":
        newY = selectionBounds.y + (selectionBounds.height - b.height) / 2;
        break;
      case "distributeH":
        // Will be handled separately
        break;
      case "distributeV":
        // Will be handled separately
        break;
    }

    return { ...obj, x: newX, y: newY };
  });
}

export function distributeObjects(
  objects: BaseObjectData[],
  ids: number[],
  horizontal: boolean,
): BaseObjectData[] {
  if (ids.length < 3) return objects;
  const sorted = [...objects]
    .filter(o => ids.includes(o.id))
    .sort((a, b) => horizontal ? a.x - b.x : a.y - b.y);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return objects;

  const totalSpace = horizontal
    ? (last.x + last.width) - first.x
    : (last.y + last.height) - first.y;
  const totalObjSize = sorted.reduce((sum, o) =>
    sum + (horizontal ? o.width : o.height), 0);
  const gap = (totalSpace - totalObjSize) / (sorted.length - 1);

  let pos = horizontal ? first.x : first.y;
  const idMap = new Map(sorted.map((o, i) => {
    const start = pos;
    pos += (horizontal ? o.width : o.height) + gap;
    return [o.id, start];
  }));

  return objects.map((obj) => {
    const newPos = idMap.get(obj.id);
    if (newPos === undefined) return obj;
    return horizontal
      ? { ...obj, x: newPos as number }
      : { ...obj, y: newPos as number };
  });
}

// ── Flip / Mirror ────────────────────────────────────────────────

export type FlipAxis = "horizontal" | "vertical";

export function flipObjects(
  objects: BaseObjectData[],
  ids: number[],
  axis: FlipAxis,
): BaseObjectData[] {
  const selectionBounds = getSelectionBounds(objects, ids);
  if (!selectionBounds) return objects;
  const cx = selectionBounds.x + selectionBounds.width / 2;
  const cy = selectionBounds.y + selectionBounds.height / 2;

  return objects.map((obj) => {
    if (!ids.includes(obj.id)) return obj;
    const b = getBounds(obj);
    if (axis === "horizontal") {
      return { ...obj, x: cx + (cx - b.x) - b.width };
    } else {
      return { ...obj, y: cy + (cy - b.y) - b.height };
    }
  });
}

export function flipObjectTransform(
  obj: BaseObjectData,
  axis: FlipAxis,
): BaseObjectData {
  if (axis === "horizontal") {
    return { ...obj, flipX: !obj.flipX, scaleX: obj.scaleX * -1 };
  } else {
    return { ...obj, flipY: !obj.flipY, scaleY: obj.scaleY * -1 };
  }
}

// ── Center to Canvas ─────────────────────────────────────────────

export function centerToCanvas(
  obj: BaseObjectData,
  canvasWidth: number,
  canvasHeight: number,
  horizontal: boolean,
  vertical: boolean,
): BaseObjectData {
  const b = getBounds(obj);
  let newX = obj.x, newY = obj.y;
  if (horizontal) newX = (canvasWidth - b.width) / 2;
  if (vertical) newY = (canvasHeight - b.height) / 2;
  return { ...obj, x: newX, y: newY };
}
