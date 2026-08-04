import type { BaseObjectData } from "@/types/objects";

/**
 * Smart Alignment Service
 * Provides Canva/Figma-style alignment guides and snapping
 */

export interface AlignmentGuide {
  position: number;
  orientation: "horizontal" | "vertical";
  type: "edge" | "center" | "canvas";
  relatedObjectIds?: number[];
}

export interface SnapResult {
  x: number;
  y: number;
  guides: AlignmentGuide[];
  snapped: boolean;
}

export interface AlignmentPoint {
  x: number;
  y: number;
  type: "left" | "right" | "top" | "bottom" | "centerX" | "centerY";
  objectId?: number;
}

const DEFAULT_SNAP_TOLERANCE = 8; // pixels

/**
 * Get all alignment points for an object
 */
export function getObjectAlignmentPoints(obj: BaseObjectData): AlignmentPoint[] {
  const centerX = obj.x + obj.width / 2;
  const centerY = obj.y + obj.height / 2;
  const right = obj.x + obj.width;
  const bottom = obj.y + obj.height;

  return [
    { x: obj.x, y: obj.y, type: "left", objectId: obj.id },
    { x: right, y: obj.y, type: "right", objectId: obj.id },
    { x: obj.x, y: obj.y, type: "top", objectId: obj.id },
    { x: obj.x, y: bottom, type: "bottom", objectId: obj.id },
    { x: centerX, y: centerY, type: "centerX", objectId: obj.id },
    { x: centerX, y: centerY, type: "centerY", objectId: obj.id },
  ];
}

/**
 * Get canvas alignment points
 */
export function getCanvasAlignmentPoints(
  canvasWidth: number,
  canvasHeight: number
): AlignmentPoint[] {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  return [
    { x: 0, y: 0, type: "left" },
    { x: canvasWidth, y: 0, type: "right" },
    { x: 0, y: 0, type: "top" },
    { x: 0, y: canvasHeight, type: "bottom" },
    { x: centerX, y: centerY, type: "centerX" },
    { x: centerX, y: centerY, type: "centerY" },
  ];
}

/**
 * Find snap position and guides for an object being dragged
 */
export function findSnapPosition(
  draggedObject: BaseObjectData,
  allObjects: BaseObjectData[],
  canvasWidth: number,
  canvasHeight: number,
  snapToCanvas: boolean = true,
  snapToObjects: boolean = true,
  snapToGrid: boolean = false,
  gridSize: number = 25,
  tolerance: number = DEFAULT_SNAP_TOLERANCE,
  disableSnap: boolean = false
): SnapResult {
  if (disableSnap) {
    return {
      x: draggedObject.x,
      y: draggedObject.y,
      guides: [],
      snapped: false,
    };
  }

  let snapX: number | null = null;
  let snapY: number | null = null;
  const guides: AlignmentGuide[] = [];

  const draggedPoints = getObjectAlignmentPoints(draggedObject);
  const draggedCenterX = draggedObject.x + draggedObject.width / 2;
  const draggedCenterY = draggedObject.y + draggedObject.height / 2;
  const draggedRight = draggedObject.x + draggedObject.width;
  const draggedBottom = draggedObject.y + draggedObject.height;

  // Snap to canvas
  if (snapToCanvas) {
    const canvasPoints = getCanvasAlignmentPoints(canvasWidth, canvasHeight);

    // Check left edge
    if (Math.abs(draggedObject.x) < tolerance) {
      snapX = 0;
      guides.push({
        position: 0,
        orientation: "vertical",
        type: "canvas",
      });
    }

    // Check right edge
    if (Math.abs(draggedRight - canvasWidth) < tolerance) {
      snapX = canvasWidth - draggedObject.width;
      guides.push({
        position: canvasWidth,
        orientation: "vertical",
        type: "canvas",
      });
    }

    // Check top edge
    if (Math.abs(draggedObject.y) < tolerance) {
      snapY = 0;
      guides.push({
        position: 0,
        orientation: "horizontal",
        type: "canvas",
      });
    }

    // Check bottom edge
    if (Math.abs(draggedBottom - canvasHeight) < tolerance) {
      snapY = canvasHeight - draggedObject.height;
      guides.push({
        position: canvasHeight,
        orientation: "horizontal",
        type: "canvas",
      });
    }

    // Check center X
    if (Math.abs(draggedCenterX - canvasWidth / 2) < tolerance) {
      snapX = canvasWidth / 2 - draggedObject.width / 2;
      guides.push({
        position: canvasWidth / 2,
        orientation: "vertical",
        type: "center",
      });
    }

    // Check center Y
    if (Math.abs(draggedCenterY - canvasHeight / 2) < tolerance) {
      snapY = canvasHeight / 2 - draggedObject.height / 2;
      guides.push({
        position: canvasHeight / 2,
        orientation: "horizontal",
        type: "center",
      });
    }
  }

  // Snap to other objects
  if (snapToObjects) {
    for (const other of allObjects) {
      if (other.id === draggedObject.id) continue;

      const otherCenterX = other.x + other.width / 2;
      const otherCenterY = other.y + other.height / 2;
      const otherRight = other.x + other.width;
      const otherBottom = other.y + other.height;

      // Vertical alignment (X-axis)
      
      // Left edge to left edge
      if (snapX === null && Math.abs(draggedObject.x - other.x) < tolerance) {
        snapX = other.x;
        guides.push({
          position: other.x,
          orientation: "vertical",
          type: "edge",
          relatedObjectIds: [other.id],
        });
      }

      // Right edge to right edge
      if (snapX === null && Math.abs(draggedRight - otherRight) < tolerance) {
        snapX = otherRight - draggedObject.width;
        guides.push({
          position: otherRight,
          orientation: "vertical",
          type: "edge",
          relatedObjectIds: [other.id],
        });
      }

      // Center X to center X
      if (snapX === null && Math.abs(draggedCenterX - otherCenterX) < tolerance) {
        snapX = otherCenterX - draggedObject.width / 2;
        guides.push({
          position: otherCenterX,
          orientation: "vertical",
          type: "center",
          relatedObjectIds: [other.id],
        });
      }

      // Left edge to right edge (adjacent)
      if (snapX === null && Math.abs(draggedObject.x - otherRight) < tolerance) {
        snapX = otherRight;
        guides.push({
          position: otherRight,
          orientation: "vertical",
          type: "edge",
          relatedObjectIds: [other.id],
        });
      }

      // Right edge to left edge (adjacent)
      if (snapX === null && Math.abs(draggedRight - other.x) < tolerance) {
        snapX = other.x - draggedObject.width;
        guides.push({
          position: other.x,
          orientation: "vertical",
          type: "edge",
          relatedObjectIds: [other.id],
        });
      }

      // Horizontal alignment (Y-axis)
      
      // Top edge to top edge
      if (snapY === null && Math.abs(draggedObject.y - other.y) < tolerance) {
        snapY = other.y;
        guides.push({
          position: other.y,
          orientation: "horizontal",
          type: "edge",
          relatedObjectIds: [other.id],
        });
      }

      // Bottom edge to bottom edge
      if (snapY === null && Math.abs(draggedBottom - otherBottom) < tolerance) {
        snapY = otherBottom - draggedObject.height;
        guides.push({
          position: otherBottom,
          orientation: "horizontal",
          type: "edge",
          relatedObjectIds: [other.id],
        });
      }

      // Center Y to center Y
      if (snapY === null && Math.abs(draggedCenterY - otherCenterY) < tolerance) {
        snapY = otherCenterY - draggedObject.height / 2;
        guides.push({
          position: otherCenterY,
          orientation: "horizontal",
          type: "center",
          relatedObjectIds: [other.id],
        });
      }

      // Top edge to bottom edge (adjacent)
      if (snapY === null && Math.abs(draggedObject.y - otherBottom) < tolerance) {
        snapY = otherBottom;
        guides.push({
          position: otherBottom,
          orientation: "horizontal",
          type: "edge",
          relatedObjectIds: [other.id],
        });
      }

      // Bottom edge to top edge (adjacent)
      if (snapY === null && Math.abs(draggedBottom - other.y) < tolerance) {
        snapY = other.y - draggedObject.height;
        guides.push({
          position: other.y,
          orientation: "horizontal",
          type: "edge",
          relatedObjectIds: [other.id],
        });
      }
    }
  }

  // Snap to grid
  if (snapToGrid && snapX === null && snapY === null) {
    const gridSnapX = Math.round(draggedObject.x / gridSize) * gridSize;
    const gridSnapY = Math.round(draggedObject.y / gridSize) * gridSize;

    if (Math.abs(draggedObject.x - gridSnapX) < tolerance) {
      snapX = gridSnapX;
    }
    if (Math.abs(draggedObject.y - gridSnapY) < tolerance) {
      snapY = gridSnapY;
    }
  }

  return {
    x: snapX !== null ? snapX : draggedObject.x,
    y: snapY !== null ? snapY : draggedObject.y,
    guides,
    snapped: snapX !== null || snapY !== null,
  };
}

/**
 * Remove duplicate guides (same position and orientation)
 */
export function deduplicateGuides(guides: AlignmentGuide[]): AlignmentGuide[] {
  const seen = new Set<string>();
  return guides.filter((guide) => {
    const key = `${guide.orientation}-${guide.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
