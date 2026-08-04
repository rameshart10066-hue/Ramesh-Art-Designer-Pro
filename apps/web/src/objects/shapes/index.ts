/**
 * Basic Shape Objects
 * Polymorphic implementations of common shapes
 */

import { BaseCanvasObject } from "../BaseCanvasObject";
import type { ICanvasObject, BaseObjectData } from "@/types/objects";

// Rectangle Object
export class RectangleObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({ ...config, type: "rectangle", category: "basic" });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    
    this.applyTransforms(ctx);
    this.applyStyles(ctx);
    
    const { width, height } = this.data;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeRect(0, 0, width, height);
    
    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" ${this.getSVGStyle()} ${this.getSVGTransform()} />`;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new RectangleObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}

// Circle Object
export class CircleObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({ ...config, type: "circle", category: "basic" });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;

    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const radius = Math.min(width, height) / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const radius = Math.min(width, height) / 2;
    const cx = x + width / 2;
    const cy = y + height / 2;
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" ${this.getSVGStyle()} ${this.getSVGTransform()} />`;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new CircleObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}

// Ellipse Object
export class EllipseObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({ ...config, type: "ellipse", category: "basic" });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;

    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const radiusX = width / 2;
    const radiusY = height / 2;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${this.getSVGStyle()} ${this.getSVGTransform()} />`;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new EllipseObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}

// Star Object
export class StarObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({ ...config, type: "star", category: "basic", metadata: { points: 5, innerRadius: 0.5, ...config.metadata } });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;

    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const points = (this.data.metadata.points as number) || 5;
    const innerRadius = (this.data.metadata.innerRadius as number) || 0.5;

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2;

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : outerRadius * innerRadius;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const points = (this.data.metadata.points as number) || 5;
    const innerRadius = (this.data.metadata.innerRadius as number) || 0.5;

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const outerRadius = Math.min(width, height) / 2;

    const pathPoints: string[] = [];
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : outerRadius * innerRadius;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      pathPoints.push(`${i === 0 ? 'M' : 'L'}${px},${py}`);
    }
    pathPoints.push('Z');

    return `<path d="${pathPoints.join(' ')}" ${this.getSVGStyle()} ${this.getSVGTransform()} />`;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new StarObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}
