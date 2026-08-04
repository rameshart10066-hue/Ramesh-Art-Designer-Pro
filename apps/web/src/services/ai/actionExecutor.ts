/**
 * Action Executor
 *
 * Executes AI-generated actions through the existing undo stack.
 * All actions are undoable via editorStoreV2's command pattern.
 */

import type { AIAction } from "@/types/ai";
import type { BaseObjectData } from "@/types/objects";

export interface ExecutorDeps {
  getObjects: () => BaseObjectData[];
  getSelectedIds: () => number[];
  addObject: (obj: Partial<BaseObjectData>) => void;
  removeObject: (id: number) => void;
  updateObject: (id: number, updates: Partial<BaseObjectData>) => void;
  duplicateObject: (id: number) => void;
  startBatch: () => void;
  endBatch: (description?: string) => void;
  runNesting: () => void;
}

/** Execute a single AI action. Returns true on success. */
export async function executeAction(action: AIAction, deps: ExecutorDeps): Promise<boolean> {
  try {
    switch (action.action) {
      case "create":
        deps.addObject({
          type: (action.object || "rectangle") as any,
          name: action.name || action.object || "AI Created",
          x: action.x ?? 300,
          y: action.y ?? 200,
          width: action.width ?? 150,
          height: action.height ?? 100,
          rotation: action.rotation ?? 0,
          fill: action.fill ?? "#3b82f6",
          stroke: action.stroke ?? "#1e40af",
          metadata: action.metadata ?? {},
        } as any);
        return true;

      case "move":
        if (action.targetId == null) return false;
          const moveUpdates: Record<string, any> = {};
        if (action.x !== undefined) moveUpdates.x = action.x;
        if (action.y !== undefined) moveUpdates.y = action.y;
        deps.updateObject(action.targetId, moveUpdates);
        return true;

      case "delete":
        if (action.targetId == null) return false;
        deps.removeObject(action.targetId);
        return true;

      case "duplicate":
        if (action.targetId == null) return false;
        deps.duplicateObject(action.targetId);
        return true;

      case "resize":
        if (action.targetId == null) return false;
        const resizeUpdates: Record<string, any> = {};
        if (action.width !== undefined) resizeUpdates.width = action.width;
        if (action.height !== undefined) resizeUpdates.height = action.height;
        deps.updateObject(action.targetId, resizeUpdates);
        return true;

      case "rotate":
        if (action.targetId == null) return false;
        deps.updateObject(action.targetId, { rotation: action.rotation ?? 0 });
        return true;

      case "group": {
        const ids = deps.getSelectedIds();
        if (ids.length < 2) return false;
        deps.startBatch();
        // Group by setting same parentId (simplified)
        for (const id of ids) {
          deps.updateObject(id, { parentId: ids[0] } as any);
        }
        deps.endBatch("AI Group");
        return true;
      }

      case "ungroup": {
        const allObjects = deps.getObjects();
        deps.startBatch();
        for (const obj of allObjects) {
          if (obj.parentId != null) {
            deps.updateObject(obj.id, { parentId: undefined } as any);
          }
        }
        deps.endBatch("AI Ungroup");
        return true;
      }

      case "align":
        // Align is handled by the alignment panel
        return true;

      case "nest":
        deps.runNesting();
        return true;

      case "export":
        // Export triggers handled by export manager
        return true;

      default:
        return false;
    }
  } catch {
    return false;
  }
}

/** Execute a batch of AI actions atomically (undoable as one step). */
export async function executeActionPlan(
  actions: AIAction[],
  deps: ExecutorDeps,
): Promise<{ succeeded: number; failed: number }> {
  deps.startBatch();
  let succeeded = 0;
  let failed = 0;

  for (const action of actions) {
    const ok = await executeAction(action, deps);
    if (ok) succeeded++;
    else failed++;
  }

  deps.endBatch(`AI: ${actions.length} actions`);
  return { succeeded, failed };
}
