/**
 * Base Canvas Object Class
 * 
 * Abstract base class for all canvas objects
 * Implements common functionality with polymorphic methods
 */

import type {
  ICanvasObject,
  CanvasObjectData,
  BaseObjectData,
  Bounds,
  Point,
  SerializedObject,
  ObjectType,
  ObjectCategory,
} from "@/types/objects";

let nextId = 1;

export abstract class BaseCanvasObject implements ICanvasObject {
  protected data: BaseObjectData;

  constructor(config: Partial<BaseObjectData>) {
    this.data = {
      id: config.id ?? nextId++,
      type: config.type ?? "rectangle",
      category: config.category ?? "basic",
      name: config.name ?? `Object ${nextId - 1}`,
      x: config.x ?? 100,
      y: config.y ?? 100,
      width: config.width ?? 150,
      height: config.height ?? 100,
      rotation: config.rotation ?? 0,
      scaleX: config.scaleX ?? 1,
      scaleY: config.scaleY ?? 1,
      flipX: config.flipX ?? false,
      flipY: config.flipY ?? false,
      opacity: config.opacity ?? 1,
      fill: config.fill ?? "#3b82f6",
      stroke: config.stroke ?? "#1e40af",
      strokeWidth: config.strokeWidth ?? 2,
      visible: config.visible ?? true,
      locked: config.locked ?? false,
      zIndex: config.zIndex ?? 0,
      children: config.children ?? [],
      metadata: config.metadata ?? {},
      ...(config.shadow !== undefined && { shadow: config.shadow }),
      ...(config.parentId !== undefined && { parentId: config.parentId }),
      ...(config.cornerRadius !== undefined && { cornerRadius: config.cornerRadius }),
    };
  }

  // Data access
  getData(): CanvasObjectData {
    return { ...this.data } as CanvasObjectData;
  }

  // Update data
  update(updates: Partial<CanvasObjectData>): void {
    this.data = { ...this.data, ...updates };
  }

  // Get transformed bounds
  getBounds(): Bounds {
    const { x, y, width, height, scaleX, scaleY } = this.data;
    return {
      x,
      y,
      width: width * scaleX,
      height: height * scaleY,
    };
  }

  // Basic hit test (rectangle)
  hitTest(point: Point): boolean {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  // Serialize to JSON
  serialize(): SerializedObject {
    return {
      version: "1.0.0",
      data: this.getData(),
    };
  }

  // Create a copy
  abstract duplicate(): ICanvasObject;

  // Render to canvas
  abstract draw(ctx: CanvasRenderingContext2D): void;

  // Export to SVG
  abstract toSVG(): string;

  // Helper: Apply transforms to canvas context
  protected applyTransforms(ctx: CanvasRenderingContext2D): void {
    const { x, y, width, height, rotation, scaleX, scaleY, flipX, flipY } = this.data;

    ctx.save();
    
    // Translate to center
    ctx.translate(x + width / 2, y + height / 2);
    
    // Rotate
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }
    
    // Scale and flip
    ctx.scale(
      scaleX * (flipX ? -1 : 1),
      scaleY * (flipY ? -1 : 1)
    );
    
    // Translate back
    ctx.translate(-width / 2, -height / 2);
  }

  // Helper: Apply styles to canvas context
  protected applyStyles(ctx: CanvasRenderingContext2D): void {
    const { fill, stroke, strokeWidth, opacity, shadow } = this.data;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;

    if (shadow) {
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
      ctx.shadowColor = shadow.color;
    }
  }

  // Helper: Restore canvas context
  protected restoreContext(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }

  // Helper: Generate common SVG attributes
  protected getSVGTransform(): string {
    const { x, y, width, height, rotation, scaleX, scaleY, flipX, flipY } = this.data;
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    const transforms: string[] = [];
    
    if (rotation !== 0) {
      transforms.push(`rotate(${rotation} ${centerX} ${centerY})`);
    }
    
    if (scaleX !== 1 || scaleY !== 1 || flipX || flipY) {
      const sx = scaleX * (flipX ? -1 : 1);
      const sy = scaleY * (flipY ? -1 : 1);
      transforms.push(`translate(${centerX} ${centerY})`);
      transforms.push(`scale(${sx} ${sy})`);
      transforms.push(`translate(${-centerX} ${-centerY})`);
    }
    
    return transforms.length > 0 ? `transform="${transforms.join(' ')}"` : "";
  }

  protected getSVGStyle(): string {
    const { fill, stroke, strokeWidth, opacity } = this.data;
    const styles: string[] = [
      `fill="${fill}"`,
      `stroke="${stroke}"`,
      `stroke-width="${strokeWidth}"`,
      `opacity="${opacity}"`,
    ];
    return styles.join(" ");
  }
}
