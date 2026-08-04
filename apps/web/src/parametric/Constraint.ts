/**
 * Constraint System
 *
 * Constraints define relationships between components.
 * They are solved during regeneration to maintain design intent.
 */

import type { ParamValues } from "./Parameter";

export type ConstraintType =
  | "center-align"
  | "mirror"
  | "equal-size"
  | "equal-distance"
  | "lock-width"
  | "lock-height"
  | "lock-aspect-ratio"
  | "parent-child";

export interface Constraint {
  id: string;
  type: ConstraintType;
  /** Target object IDs this constraint applies to */
  targetIds: number[];
  /** Optional reference object ID for relative constraints */
  referenceId?: number;
  /** Extra parameters for the constraint */
  params?: Record<string, any>;
}

export interface ConstraintResult {
  constraint: Constraint;
  updates: { objectId: number; params: Partial<ParamValues> }[];
}

// ── Solver ───────────────────────────────────────────────────────

export function solveConstraint(
  constraint: Constraint,
  allObjects: { id: number; params: ParamValues }[],
): ConstraintResult {
  const updates: { objectId: number; params: Partial<ParamValues> }[] = [];
  const targets = allObjects.filter((o) => constraint.targetIds.includes(o.id));
  if (targets.length === 0) return { constraint, updates };

  switch (constraint.type) {
    case "center-align": {
      if (targets.length < 2) break;
      const ref = targets[0]!;
      for (let i = 1; i < targets.length; i++) {
        const t = targets[i]!;
        updates.push({
          objectId: t.id,
          params: {
            x: ref.params.x! + (ref.params.width! - t.params.width!) / 2,
            y: ref.params.y! + (ref.params.height! - t.params.height!) / 2,
          },
        });
      }
      break;
    }

    case "mirror": {
      const axis = constraint.params?.axis || "horizontal";
      const ref = targets[0]!;
      for (let i = 1; i < targets.length; i++) {
        const t = targets[i]!;
        if (axis === "horizontal") {
          updates.push({
            objectId: t.id,
            params: { x: ref.params.x! + ref.params.width! + (ref.params.x! - t.params.x!), flipX: !t.params.flipX },
          });
        } else {
          updates.push({
            objectId: t.id,
            params: { y: ref.params.y! + ref.params.height! + (ref.params.y! - t.params.y!), flipY: !t.params.flipY },
          });
        }
      }
      break;
    }

    case "equal-size": {
      if (targets.length < 2) break;
      const maxW = Math.max(...targets.map((t) => t.params.width as number));
      const maxH = Math.max(...targets.map((t) => t.params.height as number));
      for (const t of targets) {
        updates.push({ objectId: t.id, params: { width: maxW, height: maxH } });
      }
      break;
    }

    case "lock-aspect-ratio": {
      for (const t of targets) {
        const ratio = (constraint.params?.ratio as number) || ((t.params.width as number) / (t.params.height as number)) || 1;
        updates.push({ objectId: t.id, params: { aspectRatio: ratio } });
      }
      break;
    }

    case "parent-child": {
      const parent = constraint.referenceId != null
        ? allObjects.find((o) => o.id === constraint.referenceId)
        : null;
      if (!parent) break;
      for (const t of targets) {
        updates.push({
          objectId: t.id,
          params: {
            parentId: parent.id,
            x: (parent.params.x as number) + (t.params.offsetX as number || 0),
            y: (parent.params.y as number) + (t.params.offsetY as number || 0),
          },
        });
      }
      break;
    }

    case "equal-distance": {
      if (targets.length < 3) break;
      const sorted = [...targets].sort((a, b) => (a.params.x as number) - (b.params.x as number));
      const first = sorted[0]!;
      const last = sorted[sorted.length - 1]!;
      const gap = ((last.params.x as number) - (first.params.x as number)) / (sorted.length - 1);
      for (let i = 0; i < sorted.length; i++) {
        updates.push({ objectId: sorted[i]!.id, params: { x: (first.params.x as number) + gap * i } });
      }
      break;
    }
  }

  return { constraint, updates };
}

export function solveAllConstraints(
  constraints: Constraint[],
  allObjects: { id: number; params: ParamValues }[],
): { objectId: number; params: Partial<ParamValues> }[] {
  const allUpdates: { objectId: number; params: Partial<ParamValues> }[] = [];
  for (const constraint of constraints) {
    const result = solveConstraint(constraint, allObjects);
    allUpdates.push(...result.updates);
  }
  return allUpdates;
}
