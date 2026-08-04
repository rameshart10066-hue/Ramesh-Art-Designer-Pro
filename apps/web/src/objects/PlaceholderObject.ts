/**
 * Placeholder Object
 *
 * Graceful fallback for object types that have no dedicated implementation
 * (e.g. frame variants, border panels, decorative shapes). Renders as a
 * styled box with a dashed outline so templates always paint instead of
 * crashing the canvas. The original `type` string is preserved on the data so
 * it can be swapped for a real class later.
 */

import { BaseCanvasObject } from "./BaseCanvasObject";
import type { ICanvasObject, BaseObjectData } from "@/types/objects";

export class PlaceholderObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({ ...config, category: config.category ?? "basic" });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;

    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    ctx.fillRect(0, 0, width, height);
    // Dashed outline marks this as a placeholder (no dedicated class yet).
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(0, 0, width, height);
    ctx.setLineDash([]);

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${this.getSVGStyle()} ${this.getSVGTransform()} />`;
  }

  duplicate(): ICanvasObject {
    const { id, ...rest } = this.data;
    void id; // id is assigned fresh by the base constructor
    return new PlaceholderObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}
