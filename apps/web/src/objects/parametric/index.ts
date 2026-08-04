/**
 * Parametric Ganpati CAD Components
 *
 * Additional component implementations: Peacock, Bell, Prabhavali, Swastik, Om
 * Each extends BaseCanvasObject with parametric metadata-driven rendering.
 */

import { BaseCanvasObject } from "../BaseCanvasObject";
import type { ICanvasObject, BaseObjectData } from "@/types/objects";

// ── PeacockObject ────────────────────────────────────────────────

export class PeacockObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config, type: "peacock" as any, category: "ganpati" as any,
      metadata: { featherCount: 12, tailAngle: 120, bodySize: 0.4, eyeSize: 0.3, ...config.metadata },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);
    const { width, height } = this.data;
    const cx = width / 2, cy = height * 0.6;
    const tailR = Math.min(width, height) * 0.5;
    const feathers = (this.data.metadata.featherCount as number) || 12;
    const tailAngle = (this.data.metadata.tailAngle as number) || 120;
    const bodySize = (this.data.metadata.bodySize as number) || 0.4;
    const eyeSize = (this.data.metadata.eyeSize as number) || 0.3;
    const stepA = (tailAngle * Math.PI) / 180 / feathers;
    const startA = Math.PI / 2 - (tailAngle * Math.PI) / 360;

    for (let i = 0; i < feathers; i++) {
      const a = startA + stepA * i;
      const fex = cx + Math.cos(a) * tailR;
      const fey = cy + Math.sin(a) * tailR;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(a) * tailR * 0.6, cy + Math.sin(a) * tailR * 0.6, fex, fey);
      ctx.stroke();
      const ex = fex - Math.cos(a) * tailR * 0.15;
      const ey = fey - Math.sin(a) * tailR * 0.15;
      ctx.beginPath();
      ctx.arc(ex, ey, tailR * 0.08 * eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }

    const br = Math.min(width, height) * 0.12 * bodySize;
    ctx.beginPath();
    ctx.ellipse(cx, cy, br, br * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - br * 1.4);
    ctx.quadraticCurveTo(cx, cy - br * 2.5, cx + br * 0.3, cy - br * 2.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + br * 0.3, cy - br * 2.8, br * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + br * 0.7, cy - br * 2.8);
    ctx.lineTo(cx + br * 1.1, cy - br * 2.7);
    ctx.lineTo(cx + br * 0.7, cy - br * 2.6);
    ctx.closePath();
    ctx.fill();

    this.restoreContext(ctx);
  }

  toSVG(): string { return `<g>Peacock</g>`; }
  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new PeacockObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}

// ── BellObject ───────────────────────────────────────────────────

export class BellObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config, type: "bell" as any, category: "ganpati" as any,
      metadata: { bellWidth: 0.7, clapperSize: 0.15, hasRing: true, ...config.metadata },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);
    const { width, height } = this.data;
    const hw = width / 2, hh = height;
    const bw = (this.data.metadata.bellWidth as number) || 0.7;
    const clap = (this.data.metadata.clapperSize as number) || 0.15;
    const hasRing = this.data.metadata.hasRing as boolean;
    const bellW = hw * bw, bellTop = hh * 0.25, bellBot = hh * 0.9;

    ctx.beginPath();
    ctx.moveTo(hw - bellW * 0.4, bellTop);
    ctx.quadraticCurveTo(hw - bellW * 0.3, bellTop + hh * 0.15, hw - bellW, hh * 0.5);
    ctx.quadraticCurveTo(hw - bellW * 1.1, hh * 0.7, hw - bellW * 0.8, bellBot);
    ctx.quadraticCurveTo(hw, bellBot + hh * 0.05, hw + bellW * 0.8, bellBot);
    ctx.quadraticCurveTo(hw + bellW * 1.1, hh * 0.7, hw + bellW, hh * 0.5);
    ctx.quadraticCurveTo(hw + bellW * 0.3, bellTop + hh * 0.15, hw + bellW * 0.4, bellTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (hasRing) {
      ctx.beginPath();
      ctx.arc(hw, hh * 0.1, hw * 0.08, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(hw, bellBot + hh * 0.04, hw * clap, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(hw - bellW * 0.5, hh * 0.25, bellW, 3);
    this.restoreContext(ctx);
  }

  toSVG(): string { return `<g>Bell</g>`; }
  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new BellObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}

// ── PrabhavaliObject ─────────────────────────────────────────────

export class PrabhavaliObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config, type: "prabhavali" as any, category: "ganpati" as any,
      metadata: { rayCount: 24, rayLength: 0.3, innerRadius: 0.4, hasGlow: true, ...config.metadata },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);
    const { width, height } = this.data;
    const cx = width / 2, cy = height / 2;
    const outerR = Math.min(width, height) / 2;
    const rays = (this.data.metadata.rayCount as number) || 24;
    const rayLen = (this.data.metadata.rayLength as number) || 0.3;
    const innerR = outerR * ((this.data.metadata.innerRadius as number) || 0.4);

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    for (let i = 0; i < rays; i++) {
      const a = (Math.PI * 2 / rays) * i;
      const rs = outerR * (1 - rayLen);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * rs, cy + Math.sin(a) * rs);
      ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();
    this.restoreContext(ctx);
  }

  toSVG(): string { return `<g>Prabhavali</g>`; }
  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new PrabhavaliObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}

// ── SwastikObject ────────────────────────────────────────────────

export class SwastikObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config, type: "swastik" as any, category: "ganpati" as any,
      metadata: { armWidth: 0.2, armLength: 0.6, ...config.metadata },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);
    const { width, height } = this.data;
    const cx = width / 2, cy = height / 2;
    const s = Math.min(width, height) / 2;
    const aw = s * ((this.data.metadata.armWidth as number) || 0.2);
    const al = s * ((this.data.metadata.armLength as number) || 0.6);

    ctx.fillRect(cx - aw / 2, cy - al, aw, al * 2);
    ctx.fillRect(cx - al, cy - aw / 2, al * 2, aw);

    const tips = [
      [cx + al, cy - al, al * 0.6, aw],
      [cx + al, cy + aw / 2, aw, al * 0.6],
      [cx - al - al * 0.6, cy + aw / 2, al * 0.6, aw],
      [cx - al - aw, cy - al, aw, al * 0.6],
    ];
    for (const t of tips) ctx.fillRect(t[0]!, t[1]!, t[2]!, t[3]!);
    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const cx = x + width / 2, cy = y + height / 2;
    const s = Math.min(width, height) / 2;
    const aw = s * 0.2, al = s * 0.6;
    const st = this.getSVGStyle();
    let svg = `<g ${this.getSVGTransform()}>`;
    svg += `<rect x="${cx - aw / 2}" y="${cy - al}" width="${aw}" height="${al * 2}" ${st}/>`;
    svg += `<rect x="${cx - al}" y="${cy - aw / 2}" width="${al * 2}" height="${aw}" ${st}/>`;
    svg += `<rect x="${cx + al}" y="${cy - al}" width="${al * 0.6}" height="${aw}" ${st}/>`;
    svg += `<rect x="${cx + al}" y="${cy + aw / 2}" width="${aw}" height="${al * 0.6}" ${st}/>`;
    svg += `<rect x="${cx - al - al * 0.6}" y="${cy + aw / 2}" width="${al * 0.6}" height="${aw}" ${st}/>`;
    svg += `<rect x="${cx - al - aw}" y="${cy - al}" width="${aw}" height="${al * 0.6}" ${st}/>`;
    svg += `</g>`;
    return svg;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new SwastikObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}

// ── OmSymbolObject ───────────────────────────────────────────────

export class OmSymbolObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config, type: "om-symbol" as any, category: "ganpati" as any,
      metadata: { ...config.metadata },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);
    const { width, height } = this.data;
    const cx = width / 2, cy = height / 2;
    const r = Math.min(width, height) * 0.4;

    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.2, r, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.1, r * 0.5, Math.PI * 0.3, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 0.7, cy - r * 0.3, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.3, cy + r * 0.6);
    ctx.quadraticCurveTo(cx, cy + r * 1.2, cx + r * 0.3, cy + r * 0.6);
    ctx.stroke();
    this.restoreContext(ctx);
  }

  toSVG(): string { return `<g ${this.getSVGTransform()}><text>OM</text></g>`; }
  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new OmSymbolObject({ ...rest, x: this.data.x + 20, y: this.data.y + 20 });
  }
}
