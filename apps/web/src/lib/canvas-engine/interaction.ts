// ──────────────────────────────────────────────────────────────────
// Canvas Engine – Interaction State Machine
// ──────────────────────────────────────────────────────────────────

import type {
  InteractionContext,
  InteractionMode,
  Point,
  ResizeCorner,
  Rect,
  ObjectSnapshot,
} from "./types";

/**
 * Create an initial (idle) interaction context.
 */
export function createInteractionContext(): InteractionContext {
  return {
    mode: "idle",
    targetId: null,
    dragTargetIds: [],
    pointerStart: { x: 0, y: 0 },
    pointerStartWorld: { x: 0, y: 0 },
    objectSnapshots: new Map(),
    resizeCorner: null,
    center: { x: 0, y: 0 },
    selectionRect: null,
    shiftKey: false,
    altKey: false,
  };
}

/**
 * Begin panning (middle mouse or space+drag).
 */
export function startPan(
  ctx: InteractionContext,
  pointer: Point,
  pointerWorld: Point
): InteractionContext {
  return {
    ...ctx,
    mode: "panning",
    pointerStart: pointer,
    pointerStartWorld: pointerWorld,
  };
}

/**
 * Begin rubber-band selection.
 */
export function startSelection(
  ctx: InteractionContext,
  pointer: Point,
  pointerWorld: Point
): InteractionContext {
  return {
    ...ctx,
    mode: "selecting",
    pointerStart: pointer,
    pointerStartWorld: pointerWorld,
    selectionRect: { x: pointer.x, y: pointer.y, width: 0, height: 0 },
  };
}

/**
 * Begin dragging object(s).
 */
export function startDrag(
  ctx: InteractionContext,
  targetId: number,
  targetIds: number[],
  pointer: Point,
  pointerWorld: Point,
  snapshots: Map<number, ObjectSnapshot>
): InteractionContext {
  return {
    ...ctx,
    mode: "dragging",
    targetId,
    dragTargetIds: targetIds,
    pointerStart: pointer,
    pointerStartWorld: pointerWorld,
    objectSnapshots: snapshots,
  };
}

/**
 * Begin resizing.
 */
export function startResize(
  ctx: InteractionContext,
  targetId: number,
  corner: ResizeCorner,
  pointer: Point,
  pointerWorld: Point,
  snapshot: ObjectSnapshot
): InteractionContext {
  const snapshots = new Map<number, ObjectSnapshot>();
  snapshots.set(targetId, snapshot);

  return {
    ...ctx,
    mode: "resizing",
    targetId,
    dragTargetIds: [targetId],
    resizeCorner: corner,
    pointerStart: pointer,
    pointerStartWorld: pointerWorld,
    objectSnapshots: snapshots,
  };
}

/**
 * Begin rotating.
 */
export function startRotate(
  ctx: InteractionContext,
  targetId: number,
  pointer: Point,
  pointerWorld: Point,
  center: Point,
  snapshot: ObjectSnapshot
): InteractionContext {
  const snapshots = new Map<number, ObjectSnapshot>();
  snapshots.set(targetId, snapshot);

  return {
    ...ctx,
    mode: "rotating",
    targetId,
    dragTargetIds: [targetId],
    pointerStart: pointer,
    pointerStartWorld: pointerWorld,
    center,
    objectSnapshots: snapshots,
  };
}

/**
 * Update the selection rectangle during a select interaction.
 */
export function updateSelectionRect(
  ctx: InteractionContext,
  pointer: Point
): InteractionContext {
  if (ctx.mode !== "selecting") return ctx;
  return {
    ...ctx,
    selectionRect: {
      x: ctx.pointerStart.x,
      y: ctx.pointerStart.y,
      width: pointer.x - ctx.pointerStart.x,
      height: pointer.y - ctx.pointerStart.y,
    },
  };
}

/**
 * End any interaction (return to idle).
 */
export function endInteraction(
  ctx: InteractionContext
): InteractionContext {
  return createInteractionContext();
}

/**
 * Compute the new width/height/x/y for a resize operation.
 * Handles all 8 corners and respects shift (proportional) and alt (from-center).
 */
export function computeResize(
  snapshot: ObjectSnapshot,
  corner: ResizeCorner,
  dx: number,
  dy: number,
  shiftKey: boolean,
  altKey: boolean
): { x: number; y: number; width: number; height: number } {
  const { x, y, width, height } = snapshot;
  const minSize = 10;
  const aspectRatio = width / height;

  // Delta per corner
  let dLeft = 0,
    dRight = 0,
    dTop = 0,
    dBottom = 0;

  if (corner.includes("w")) dLeft = dx;
  if (corner.includes("e")) dRight = dx;
  if (corner.includes("n")) dTop = dy;
  if (corner.includes("s")) dBottom = dy;

  // From-center: double the delta
  if (altKey) {
    if (corner.includes("w") || corner.includes("e")) {
      dLeft *= 2;
      dRight *= 2;
    }
    if (corner.includes("n") || corner.includes("s")) {
      dTop *= 2;
      dBottom *= 2;
    }
  }

  // Apply deltas
  let newX = x + dLeft;
  let newY = y + dTop;
  let newW = Math.max(minSize, width + dRight - dLeft);
  let newH = Math.max(minSize, height + dBottom - dTop);

  // Constrain proportions with shift
  if (shiftKey) {
    const newAspect = newW / newH;
    if (newAspect > aspectRatio) {
      // Too wide — lock to height
      newW = newH * aspectRatio;
    } else {
      newH = newW / aspectRatio;
    }

    // Recalculate position based on which corner is fixed
    if (corner.includes("w")) newX = x + (width - newW);
    if (corner.includes("n")) newY = y + (height - newH);
  }

  return { x: newX, y: newY, width: newW, height: newH };
}

/**
 * Compute new rotation angle from pointer delta.
 */
export function computeRotation(
  center: Point,
  pointer: Point
): number {
  return (
    Math.atan2(pointer.y - center.y, pointer.x - center.x) * (180 / Math.PI)
  );
}

/**
 * Get translation delta for a drag operation (screen coords -> world coords).
 */
export function computeDragDelta(
  pointer: Point,
  pointerStart: Point,
  zoom: number
): { dx: number; dy: number } {
  return {
    dx: (pointer.x - pointerStart.x) / zoom,
    dy: (pointer.y - pointerStart.y) / zoom,
  };
}

/**
 * Check if a mouse button should trigger panning.
 */
export function isPanTrigger(
  button: number,
  spaceHeld: boolean
): boolean {
  return button === 1 || (button === 0 && spaceHeld);
}

/**
 * Determine the interaction mode from event state.
 * Returns the new mode without mutating.
 */
export function getModeFromEvent(
  button: number,
  spaceHeld: boolean,
  hasHit: boolean,
  nearCorner: ResizeCorner | null,
  nearRotationHandle: boolean
): InteractionMode {
  if (isPanTrigger(button, spaceHeld)) return "panning";
  if (nearRotationHandle) return "rotating";
  if (nearCorner) return "resizing";
  if (hasHit) return "dragging";
  return "selecting";
}
