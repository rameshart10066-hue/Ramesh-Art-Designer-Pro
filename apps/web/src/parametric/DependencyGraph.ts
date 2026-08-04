/**
 * Dependency Graph
 *
 * Tracks parent/child relationships between components.
 * When a parent changes, all descendants are flagged for regeneration.
 * Supports arbitrary depth nesting.
 */

export interface DependencyNode {
  id: number;
  parentId: number | null;
  children: number[];
  /** Parameter keys this node depends on from its parent */
  dependentParams: string[];
  generationVersion: number;
}

export class DependencyGraph {
  private nodes: Map<number, DependencyNode> = new Map();
  private version = 0;

  /** Register or update a node */
  setNode(id: number, parentId: number | null, dependentParams: string[] = []): void {
    // Remove from old parent if re-parenting
    const existing = this.nodes.get(id);
    if (existing && existing.parentId !== parentId) {
      if (existing.parentId != null) {
        const oldParent = this.nodes.get(existing.parentId);
        if (oldParent) {
          oldParent.children = oldParent.children.filter((c) => c !== id);
        }
      }
    }

    if (!this.nodes.has(id)) {
      this.nodes.set(id, {
        id,
        parentId,
        children: [],
        dependentParams,
        generationVersion: 0,
      });
    } else {
      const node = this.nodes.get(id)!;
      node.parentId = parentId;
      node.dependentParams = dependentParams;
    }

    // Add to new parent
    if (parentId != null) {
      const parent = this.nodes.get(parentId);
      if (parent && !parent.children.includes(id)) {
        parent.children.push(id);
      }
    }
  }

  /** Remove a node and reparent its children to its parent */
  removeNode(id: number): void {
    const node = this.nodes.get(id);
    if (!node) return;

    // Reparent children to node's parent
    for (const childId of node.children) {
      const child = this.nodes.get(childId);
      if (child) {
        child.parentId = node.parentId;
        if (node.parentId != null) {
          const grandparent = this.nodes.get(node.parentId);
          if (grandparent && !grandparent.children.includes(childId)) {
            grandparent.children.push(childId);
          }
        }
      }
    }

    // Remove from parent
    if (node.parentId != null) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.children = parent.children.filter((c) => c !== id);
      }
    }

    this.nodes.delete(id);
  }

  /** Get all descendant IDs of a node */
  getDescendants(id: number): number[] {
    const result: number[] = [];
    const node = this.nodes.get(id);
    if (!node) return result;

    const queue = [...node.children];
    while (queue.length > 0) {
      const childId = queue.shift()!;
      result.push(childId);
      const child = this.nodes.get(childId);
      if (child) {
        queue.push(...child.children);
      }
    }
    return result;
  }

  /** Get the full ancestry chain (root first) */
  getAncestors(id: number): number[] {
    const result: number[] = [];
    let current = this.nodes.get(id);
    while (current && current.parentId != null) {
      const parent = this.nodes.get(current.parentId);
      if (parent) {
        result.unshift(parent.id);
        current = parent;
      } else {
        break;
      }
    }
    return result;
  }

  /** Mark a node and all its descendants as needing regeneration */
  markDirty(id: number): number[] {
    this.version++;
    const dirtyIds = [id, ...this.getDescendants(id)];
    for (const dirtyId of dirtyIds) {
      const node = this.nodes.get(dirtyId);
      if (node) {
        node.generationVersion = this.version;
      }
    }
    return dirtyIds;
  }

  /** Check if a node needs regeneration */
  needsRegeneration(id: number): boolean {
    const node = this.nodes.get(id);
    return node ? node.generationVersion >= this.version - 1 : true;
  }

  /** Get all registered node IDs */
  getAllIds(): number[] {
    return Array.from(this.nodes.keys());
  }

  /** Clear all nodes */
  clear(): void {
    this.nodes.clear();
    this.version = 0;
  }

  /** Get count of registered nodes */
  get size(): number {
    return this.nodes.size;
  }
}
