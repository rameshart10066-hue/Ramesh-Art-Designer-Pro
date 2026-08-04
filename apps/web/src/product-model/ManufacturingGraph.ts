/**
 * Manufacturing Graph
 *
 * Stores manufacturing data for every component: material, thickness,
 * part number, laser layer, cut priority, estimated time/cost/weight.
 */

import type { ManufacturingData } from "./ProductModel";
import { getMaterial } from "./MaterialSystem";

export class ManufacturingGraph {
  private data = new Map<number, ManufacturingData>();
  private partCounter = 1;

  setData(id: number, data: Partial<ManufacturingData>): ManufacturingData {
    const existing = this.data.get(id);
    const mat = data.material ? getMaterial(data.material) : null;
    const merged: ManufacturingData = {
      material: data.material || existing?.material || "thermocol",
      thickness: data.thickness ?? existing?.thickness ?? 25,
      partNumber: existing?.partNumber || `PART-${String(this.partCounter++).padStart(4, "0")}`,
      cutType: data.cutType || existing?.cutType || "cut",
      jointType: data.jointType || existing?.jointType || "none",
      laserLayer: data.laserLayer || existing?.laserLayer || "Layer1",
      cutPriority: data.cutPriority ?? existing?.cutPriority ?? 5,
      estimatedTime: data.estimatedTime ?? existing?.estimatedTime ?? 0,
      estimatedCost: data.estimatedCost ?? existing?.estimatedCost ?? 0,
      weight: data.weight ?? existing?.weight ?? 0,
      quantity: data.quantity ?? existing?.quantity ?? 1,
    };
    this.data.set(id, merged);
    return merged;
  }

  getData(id: number): ManufacturingData | undefined {
    return this.data.get(id);
  }

  removeData(id: number): void {
    this.data.delete(id);
  }

  getAll(): [number, ManufacturingData][] {
    return Array.from(this.data.entries());
  }

  /** Calculate total manufacturing metrics */
  getTotals(): {
    totalParts: number;
    totalWeight: number;
    totalCost: number;
    totalTime: number;
  } {
    const all = this.getAll();
    return {
      totalParts: all.length,
      totalWeight: all.reduce((s, [, d]) => s + d.weight * d.quantity, 0),
      totalCost: all.reduce((s, [, d]) => s + d.estimatedCost * d.quantity, 0),
      totalTime: all.reduce((s, [, d]) => s + d.estimatedTime * d.quantity, 0),
    };
  }

  /** Group by material for material estimation */
  groupByMaterial(): Record<string, ManufacturingData[]> {
    const groups: Record<string, ManufacturingData[]> = {};
    for (const [, data] of this.data) {
      if (!groups[data.material]) groups[data.material] = [];
      groups[data.material]!.push(data);
    }
    return groups;
  }

  get size(): number { return this.data.size; }
  clear(): void { this.data.clear(); this.partCounter = 1; }
}
