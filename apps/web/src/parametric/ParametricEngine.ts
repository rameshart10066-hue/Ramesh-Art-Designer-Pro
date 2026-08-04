/**
 * Parametric Engine
 *
 * Central orchestrator. Takes component type + parameters,
 * resolves through dependency graph, solves constraints,
 * generates geometry, manages cache.
 */

import { DependencyGraph } from "./DependencyGraph";
import { solveAllConstraints, type Constraint } from "./Constraint";
import { generateGeometry, type GeneratedGeometry } from "./GeometryGenerator";
import { paramEquals, type ParamValues, type ParamDef } from "./Parameter";
import { componentRegistry } from "./ComponentRegistry";

export interface ParametricObject {
  id: number;
  type: string;
  params: ParamValues;
  parentId: number | null;
  constraints: Constraint[];
}

export interface ParametricResult {
  id: number;
  type: string;
  geometry: GeneratedGeometry;
  params: ParamValues;
  regenerated: boolean;
}

export class ParametricEngine {
  private graph = new DependencyGraph();
  private cache = new Map<number, { params: ParamValues; geometry: GeneratedGeometry }>();
  private objects = new Map<number, ParametricObject>();

  /** Register an object with the engine */
  registerObject(obj: ParametricObject): void {
    this.objects.set(obj.id, obj);
    this.graph.setNode(obj.id, obj.parentId, this.getChildAffectingParams(obj.type));
    // Invalidate cache on registration
    this.cache.delete(obj.id);
  }

  /** Update an object's parameters */
  updateParams(id: number, params: Partial<ParamValues>): number[] {
    const obj = this.objects.get(id);
    if (!obj) return [];

    const oldParams = { ...obj.params };
    Object.assign(obj.params, params);

    // Check if any params actually changed
    if (paramEquals(oldParams, obj.params)) return [];

    // Invalidate cache for this object
    this.cache.delete(id);

    // Mark dirty in dependency graph
    const dirtyIds = this.graph.markDirty(id);

    // Also invalidate children
    for (const childId of this.graph.getDescendants(id)) {
      this.cache.delete(childId);
    }

    return dirtyIds;
  }

  /** Set parent-child relationship */
  setParent(id: number, parentId: number | null): void {
    const obj = this.objects.get(id);
    if (!obj) return;

    obj.parentId = parentId;
    this.graph.setNode(id, parentId, this.getChildAffectingParams(obj.type));
    this.graph.markDirty(id);
    this.cache.delete(id);

    // Update object's params to reflect new parent offset
    if (parentId != null) {
      const parent = this.objects.get(parentId);
      if (parent) {
        obj.params.offsetX = (obj.params.x as number) - (parent.params.x as number);
        obj.params.offsetY = (obj.params.y as number) - (parent.params.y as number);
      }
    }
  }

  /** Remove an object */
  removeObject(id: number): void {
    this.objects.delete(id);
    this.graph.removeNode(id);
    this.cache.delete(id);
  }

  /** Get generated geometry for an object (with caching) */
  getGeometry(id: number): GeneratedGeometry | null {
    const obj = this.objects.get(id);
    if (!obj) return null;

    // Check cache
    const cached = this.cache.get(id);
    if (cached && paramEquals(cached.params, obj.params)) {
      return cached.geometry;
    }

    // Generate fresh geometry
    const geometry = generateGeometry(obj.type, obj.params);
    this.cache.set(id, { params: { ...obj.params }, geometry });
    return geometry;
  }

  /** Solve all constraints for all registered objects */
  solveConstraints(): { objectId: number; params: Partial<ParamValues> }[] {
    const allObjects = Array.from(this.objects.entries()).map(([id, obj]) => ({
      id,
      params: obj.params,
    }));

    const allConstraints: Constraint[] = [];
    for (const obj of this.objects.values()) {
      allConstraints.push(...obj.constraints);
    }

    return solveAllConstraints(allConstraints, allObjects);
  }

  /** Get all object IDs */
  getAllIds(): number[] {
    return this.graph.getAllIds();
  }

  /** Get descendants of an object */
  getDescendants(id: number): number[] {
    return this.graph.getDescendants(id);
  }

  /** Get ancestors of an object */
  getAncestors(id: number): number[] {
    return this.graph.getAncestors(id);
  }

  /** Get the underlying dependency graph */
  getGraph(): DependencyGraph {
    return this.graph;
  }

  /** Clear everything */
  clear(): void {
    this.objects.clear();
    this.cache.clear();
    this.graph.clear();
  }

  /** Get count of registered objects */
  get size(): number {
    return this.objects.size;
  }

  private getChildAffectingParams(type: string): string[] {
    const def = componentRegistry.get(type);
    return def?.childAffectingParams || [];
  }
}

/** Singleton engine instance */
export const parametricEngine = new ParametricEngine();
