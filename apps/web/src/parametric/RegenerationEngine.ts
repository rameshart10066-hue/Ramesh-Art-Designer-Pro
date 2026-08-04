/**
 * Regeneration Engine
 *
 * Manages smart regeneration of parametric components.
 * Only regenerates modified components and their dependents.
 * Maintains a regeneration queue to batch updates.
 */

import { parametricEngine } from "./ParametricEngine";
import type { GeneratedGeometry } from "./GeometryGenerator";
import type { BaseObjectData } from "@/types/objects";

export interface RegenerationEvent {
  objectId: number;
  type: "param-change" | "parent-change" | "constraint-solve" | "manual";
  previousGeometry?: GeneratedGeometry;
  newGeometry?: GeneratedGeometry;
}

type RegenerationListener = (events: RegenerationEvent[]) => void;

export class RegenerationEngine {
  private listeners: RegenerationListener[] = [];
  private pendingIds = new Set<number>();
  private isScheduled = false;
  private previousStates = new Map<number, GeneratedGeometry>();
  private autoSync = true;

  /** Register a change listener */
  onRegenerate(listener: RegenerationListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Notify that parameters changed for an object */
  notifyParamChange(id: number): void {
    // Save previous state
    const prev = parametricEngine.getGeometry(id);
    if (prev) this.previousStates.set(id, prev);

    this.pendingIds.add(id);
    this.scheduleRegeneration();
  }

  /** Batch regenerate multiple objects */
  notifyBatch(ids: number[]): void {
    for (const id of ids) {
      const prev = parametricEngine.getGeometry(id);
      if (prev) this.previousStates.set(id, prev);
      this.pendingIds.add(id);
    }
    this.scheduleRegeneration();
  }

  /** Apply a parameter update and regenerate */
  updateAndRegenerate(id: number, params: Record<string, any>): { changed: boolean; events: RegenerationEvent[] } {
    const dirtyIds = parametricEngine.updateParams(id, params);
    if (dirtyIds.length === 0) return { changed: false, events: [] };

    // Resolve constraints
    const constraintUpdates = parametricEngine.solveConstraints();
    for (const update of constraintUpdates) {
      const objId = update.objectId;
      const obj = parametricEngine["objects"].get(objId);
      if (obj) {
        Object.assign(obj.params, update.params);
        this.pendingIds.add(objId);
      }
    }

    // Mark all dirty IDs for regeneration
    for (const dirtyId of dirtyIds) {
      this.pendingIds.add(dirtyId);
    }

    const events = this.flush();
    return { changed: events.length > 0, events };
  }

  /** Convert parametric geometry back to BaseObjectData for canvas rendering */
  toObjectData(id: number): Partial<BaseObjectData> | null {
    const geometry = parametricEngine.getGeometry(id);
    if (!geometry) return null;

    const engine = parametricEngine as any;
    const obj = engine.objects.get(id);
    if (!obj) return null;

    return {
      id,
      type: obj.type as any,
      name: obj.params.name || obj.type,
      x: geometry.x,
      y: geometry.y,
      width: geometry.width,
      height: geometry.height,
      rotation: geometry.rotation,
      fill: geometry.fill,
      stroke: geometry.stroke,
      strokeWidth: geometry.strokeWidth,
      opacity: geometry.opacity,
      scaleX: geometry.scaleX,
      scaleY: geometry.scaleY,
      flipX: geometry.flipX,
      flipY: geometry.flipY,
      visible: true,
      locked: false,
      zIndex: obj.params.zIndex || 0,
      children: [],
      metadata: { ...geometry.metadata, parametric: true, params: { ...obj.params } },
      ...(geometry.cornerRadius !== undefined ? { cornerRadius: geometry.cornerRadius } : {}),
      ...(obj.parentId != null ? { parentId: obj.parentId } : {})
    };
  }

  /** Enable/disable auto-sync to canvas */
  setAutoSync(enabled: boolean): void {
    this.autoSync = enabled;
  }

  /** Clear all pending regenerations */
  clear(): void {
    this.pendingIds.clear();
    this.previousStates.clear();
    this.isScheduled = false;
  }

  private scheduleRegeneration(): void {
    if (this.isScheduled) return;
    this.isScheduled = true;

    // Use microtask to batch synchronous changes
    queueMicrotask(() => {
      this.flush();
      this.isScheduled = false;
    });
  }

  private flush(): RegenerationEvent[] {
    if (this.pendingIds.size === 0) return [];

    const events: RegenerationEvent[] = [];

    for (const id of this.pendingIds) {
      const prevGeometry = this.previousStates.get(id);
      const newGeometry = parametricEngine.getGeometry(id);
      if (!newGeometry) continue;

      events.push({
        objectId: id,
        type: "param-change",
        ...(prevGeometry ? { previousGeometry: prevGeometry } : {}),
        newGeometry,
      } as RegenerationEvent);
    }

    this.pendingIds.clear();
    this.previousStates.clear();

    // Notify listeners
    if (events.length > 0) {
      for (const listener of this.listeners) {
        listener(events);
      }
    }

    return events;
  }
}

export const regenerationEngine = new RegenerationEngine();
