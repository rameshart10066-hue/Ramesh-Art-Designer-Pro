/**
 * Assembly Graph
 *
 * Hierarchical assembly model. Every object knows its parent, children,
 * assembly order, connection type, and assembly step instructions.
 */

export interface AssemblyNode {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
  children: number[];
  assemblyOrder: number;
  connectionType: "glue" | "slot" | "snap" | "screw" | "none";
  jointType: "none" | "finger" | "dovetail" | "butt";
  assemblyStep: string;
  assemblyInstructions: string[];
}

export class AssemblyGraph {
  private nodes = new Map<number, AssemblyNode>();

  addNode(node: AssemblyNode): void {
    if (node.parentId != null) {
      const parent = this.nodes.get(node.parentId);
      if (parent && !parent.children.includes(node.id)) {
        parent.children.push(node.id);
      }
    }
    this.nodes.set(node.id, node);
  }

  removeNode(id: number): void {
    const node = this.nodes.get(id);
    if (!node) return;
    if (node.parentId != null) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.children = parent.children.filter((c) => c !== id);
      }
    }
    this.nodes.delete(id);
  }

  getNode(id: number): AssemblyNode | undefined {
    return this.nodes.get(id);
  }

  getChildren(id: number): AssemblyNode[] {
    const node = this.nodes.get(id);
    if (!node) return [];
    return node.children.map((cid) => this.nodes.get(cid)).filter(Boolean) as AssemblyNode[];
  }

  getAncestors(id: number): AssemblyNode[] {
    const result: AssemblyNode[] = [];
    let current = this.nodes.get(id);
    while (current && current.parentId != null) {
      const parent = this.nodes.get(current.parentId);
      if (parent) {
        result.unshift(parent);
        current = parent;
      } else break;
    }
    return result;
  }

  /** Get ordered assembly steps (root → leaves) */
  getAssemblySteps(): { step: number; node: AssemblyNode }[] {
    const steps: { step: number; node: AssemblyNode }[] = [];
    const roots = Array.from(this.nodes.values()).filter((n) => n.parentId == null);
    const queue = roots.sort((a, b) => a.assemblyOrder - b.assemblyOrder);
    let step = 1;
    while (queue.length > 0) {
      const node = queue.shift()!;
      steps.push({ step: step++, node });
      const children = this.getChildren(node.id).sort((a, b) => a.assemblyOrder - b.assemblyOrder);
      queue.push(...children);
    }
    return steps;
  }

  getRootNodes(): AssemblyNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.parentId == null);
  }

  get size(): number { return this.nodes.size; }
  clear(): void { this.nodes.clear(); }
}
