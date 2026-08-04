/**
 * Ganpati-Themed Canvas Objects
 *
 * Polymorphic implementations of traditional Indian ceremonial
 * shapes used in Ganpati idol and decoration design.
 *
 * Each object extends BaseCanvasObject and provides:
 * - Canvas 2D rendering via draw()
 * - SVG export via toSVG()
 * - Hit testing via inherited getBounds()
 * - Cloning via duplicate()
 */

import { BaseCanvasObject } from "../BaseCanvasObject";
import type { ICanvasObject, BaseObjectData } from "@/types/objects";

// ────────────────────────────────────────────────────────────────
// LotusObject – Multi‑petal lotus with configurable layers
// ────────────────────────────────────────────────────────────────

export class LotusObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config,
      type: "lotus",
      category: "ganpati",
      metadata: {
        petals: 8,
        layers: 2,
        innerRadiusRatio: 0.6,
        petalShape: 0.5,  // 0 = pointy, 1 = round
        ...config.metadata,
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const cx = width / 2;
    const cy = height / 2;
    const outerR = Math.min(width, height) / 2;
    const innerR = outerR * (this.data.metadata.innerRadiusRatio as number);
    const petals = (this.data.metadata.petals as number) || 8;
    const layers = (this.data.metadata.layers as number) || 2;
    const shape = (this.data.metadata.petalShape as number) || 0.5;
    const step = (Math.PI * 2) / petals;

    // Draw each layer (outer → inner)
    for (let layer = 0; layer < layers; layer++) {
      const layerRatio = 1 - layer * 0.3;
      const r = outerR * layerRatio;
      const ir = innerR * layerRatio;
      const offset = layer * step * 0.5;

      ctx.beginPath();
      for (let i = 0; i < petals; i++) {
        const angle = step * i + offset;
        const nextAngle = step * (i + 1) + offset;
        const midAngle = (angle + nextAngle) / 2;

        // Outer point
        const ox = cx + Math.cos(angle) * r;
        const oy = cy + Math.sin(angle) * r;

        // Inner valley
        const vx = cx + Math.cos(midAngle) * ir;
        const vy = cy + Math.sin(midAngle) * ir;

        if (i === 0) {
          ctx.moveTo(ox, oy);
        }

        // Draw the petal curve from valley → outer point → next valley
        const cpx = cx + Math.cos(angle + step * shape * 0.4) * r * 1.1;
        const cpy = cy + Math.sin(angle + step * shape * 0.4) * r * 1.1;
        ctx.quadraticCurveTo(cpx, cpy, vx, vy);

        const nvx = cx + Math.cos(midAngle + step * 0.5) * ir;
        const nvy = cy + Math.sin(midAngle + step * 0.5) * ir;
        ctx.quadraticCurveTo(ox, oy, nvx, nvy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Center dot (bindu)
    ctx.beginPath();
    ctx.arc(cx, cy, outerR * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = this.data.fill;
    ctx.fill();

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const outerR = Math.min(width, height) / 2;
    const innerR = outerR * (this.data.metadata.innerRadiusRatio as number);
    const petals = (this.data.metadata.petals as number) || 8;
    const layers = (this.data.metadata.layers as number) || 2;
    const shape = (this.data.metadata.petalShape as number) || 0.5;
    const step = (Math.PI * 2) / petals;
    const paths: string[] = [];

    for (let layer = 0; layer < layers; layer++) {
      const layerRatio = 1 - layer * 0.3;
      const r = outerR * layerRatio;
      const ir = innerR * layerRatio;
      const offset = layer * step * 0.5;

      let d = "";
      for (let i = 0; i < petals; i++) {
        const angle = step * i + offset;
        const midAngle = (angle + step * 0.5) + offset;
        const ox = cx + Math.cos(angle) * r;
        const oy = cy + Math.sin(angle) * r;
        const vx = cx + Math.cos(midAngle) * ir;
        const vy = cy + Math.sin(midAngle) * ir;
        const cpx = cx + Math.cos(angle + step * shape * 0.4) * r * 1.1;
        const cpy = cy + Math.sin(angle + step * shape * 0.4) * r * 1.1;

        d += i === 0 ? `M${ox},${oy} ` : ` `;
        d += `Q${cpx},${cpy} ${vx},${vy} `;
        d += `Q${ox},${oy} ${vx + 0.1},${vy + 0.1}`;
      }
      d += "Z";
      paths.push(d);
    }

    const pathData = paths.join(" ");
    const style = this.getSVGStyle();
    const transform = this.getSVGTransform();

    return `<g ${transform}>
      <path d="${pathData}" ${style} />
      <circle cx="${cx}" cy="${cy}" r="${outerR * 0.1}" fill="${this.data.fill}" />
    </g>`;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new LotusObject({
      ...rest,
      x: this.data.x + 20,
      y: this.data.y + 20,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// MandapObject – Temple / arch structure with pillars and dome
// ────────────────────────────────────────────────────────────────

export class MandapObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config,
      type: "mandap",
      category: "ganpati",
      metadata: {
        pillars: 2,
        archType: "pointed",   // "pointed" | "rounded" | "multilayer"
        domeHeight: 0.4,
        pillarWidth: 0.1,
        ...config.metadata,
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const pillarW = width * (this.data.metadata.pillarWidth as number);
    const pillars = (this.data.metadata.pillars as number) || 2;
    const domeH = height * (this.data.metadata.domeHeight as number);
    const archType = (this.data.metadata.archType as string) || "pointed";
    const baseY = height;
    const archTop = domeH;

    // Pillars
    const pSpacing = (width - pillarW * 2) / (pillars - 1 || 1);
    for (let i = 0; i < pillars; i++) {
      const px = pillarW + pSpacing * i;
      // Pillar base/body
      ctx.fillRect(px, archTop, pillarW, baseY - archTop);
      // Pillar capital (top decoration)
      ctx.fillRect(px - 2, archTop - 4, pillarW + 4, 6);
      // Pillar base
      ctx.fillRect(px - 3, baseY - 8, pillarW + 6, 8);
    }

    // Arch
    ctx.beginPath();
    const archStartX = pillarW;
    const archEndX = width - pillarW;
    const archWidth = archEndX - archStartX;
    const archMidX = (archStartX + archEndX) / 2;

    if (archType === "pointed") {
      // Pointed arch (ogee-like)
      ctx.moveTo(archStartX, archTop);
      ctx.quadraticCurveTo(archStartX, archTop - domeH, archMidX, archTop - domeH * 1.2);
      ctx.quadraticCurveTo(archEndX, archTop - domeH, archEndX, archTop);
    } else if (archType === "multilayer") {
      // Multi-layer stepped arch
      ctx.moveTo(archStartX, archTop);
      const layers = 3;
      const stepW = archWidth / (layers * 2);
      const stepH = domeH / layers;
      for (let i = 0; i < layers; i++) {
        ctx.lineTo(archStartX + stepW * (i + 1), archTop - stepH * (i + 1));
      }
      for (let i = layers - 1; i >= 0; i--) {
        ctx.lineTo(archEndX - stepW * (i + 1), archTop - stepH * (i + 1));
      }
      ctx.lineTo(archEndX, archTop);
    } else {
      // Rounded arch
      ctx.moveTo(archStartX, archTop);
      ctx.quadraticCurveTo(archStartX, archTop - domeH, archMidX, archTop - domeH);
      ctx.quadraticCurveTo(archEndX, archTop - domeH, archEndX, archTop);
    }

    ctx.fill();
    ctx.stroke();

    // Decorative finial on top
    const finialX = archMidX;
    const finialY = archType === "pointed" || archType === "multilayer"
      ? archTop - domeH * 1.4
      : archTop - domeH - 10;

    ctx.beginPath();
    ctx.arc(finialX, finialY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const pillarW = width * (this.data.metadata.pillarWidth as number);
    const pillars = (this.data.metadata.pillars as number) || 2;
    const domeH = height * (this.data.metadata.domeHeight as number);
    const archType = (this.data.metadata.archType as string) || "pointed";
    const baseY = y + height;
    const archTop = y + domeH;
    const pSpacing = (width - pillarW * 2) / (pillars - 1 || 1);
    const style = this.getSVGStyle();
    const transform = this.getSVGTransform();

    let svg = `<g ${transform}>`;

    // Pillars
    for (let i = 0; i < pillars; i++) {
      const px = x + pillarW + pSpacing * i;
      svg += `<rect x="${px}" y="${archTop}" width="${pillarW}" height="${baseY - archTop}" ${style} />`;
      svg += `<rect x="${px - 2}" y="${archTop - 4}" width="${pillarW + 4}" height="6" ${style} />`;
      svg += `<rect x="${px - 3}" y="${baseY - 8}" width="${pillarW + 6}" height="8" ${style} />`;
    }

    // Arch
    const archStartX = x + pillarW;
    const archEndX = x + width - pillarW;
    const archMidX = (archStartX + archEndX) / 2;
    let archD = "";

    if (archType === "pointed") {
      archD = `M${archStartX},${archTop} Q${archStartX},${archTop - domeH} ${archMidX},${archTop - domeH * 1.2} Q${archEndX},${archTop - domeH} ${archEndX},${archTop}Z`;
    } else if (archType === "multilayer") {
      archD = `M${archStartX},${archTop}`;
      const layers = 3;
      const stepW = (archEndX - archStartX) / (layers * 2);
      const stepH = domeH / layers;
      for (let i = 0; i < layers; i++) {
        archD += ` L${archStartX + stepW * (i + 1)},${archTop - stepH * (i + 1)}`;
      }
      for (let i = layers - 1; i >= 0; i--) {
        archD += ` L${archEndX - stepW * (i + 1)},${archTop - stepH * (i + 1)}`;
      }
      archD += ` L${archEndX},${archTop}Z`;
    } else {
      archD = `M${archStartX},${archTop} Q${archStartX},${archTop - domeH} ${archMidX},${archTop - domeH} Q${archEndX},${archTop - domeH} ${archEndX},${archTop}Z`;
    }

    svg += `<path d="${archD}" ${style} />`;

    // Finial
    const finialX = archMidX;
    const finialY = archType === "pointed" || archType === "multilayer"
      ? archTop - domeH * 1.4
      : archTop - domeH - 10;

    svg += `<circle cx="${finialX}" cy="${finialY}" r="6" ${style} />`;
    svg += `</g>`;

    return svg;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new MandapObject({
      ...rest,
      x: this.data.x + 20,
      y: this.data.y + 20,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// KalashObject – Sacred pot / urn with decorative neck
// ────────────────────────────────────────────────────────────────

export class KalashObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config,
      type: "kalash",
      category: "ganpati",
      metadata: {
        neckHeight: 0.25,
        neckWidth: 0.35,
        baseWidth: 0.8,
        hasMangoLeaves: true,
        leafCount: 3,
        ...config.metadata,
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const neckH = height * (this.data.metadata.neckHeight as number);
    const neckW = width * (this.data.metadata.neckWidth as number);
    const baseW = width * (this.data.metadata.baseWidth as number);
    const bodyTop = neckH;
    const bodyBottom = height;
    const bodyH = bodyBottom - bodyTop;
    const halfW = width / 2;
    const halfN = neckW / 2;
    const halfB = baseW / 2;
    const leafCount = (this.data.metadata.leafCount as number) || 3;

    // Draw kalash body (pot shape using bezier curves)
    ctx.beginPath();
    ctx.moveTo(halfW - halfN, bodyTop);                    // top-left of body
    ctx.quadraticCurveTo(halfW - halfN, bodyTop + bodyH * 0.2, halfW - halfB, bodyTop + bodyH * 0.2);
    ctx.quadraticCurveTo(halfW - halfB * 1.2, bodyTop + bodyH * 0.5, halfW - halfB, bodyTop + bodyH * 0.8);
    ctx.quadraticCurveTo(halfW - halfB * 0.8, bodyBottom, halfW, bodyBottom);
    ctx.quadraticCurveTo(halfW + halfB * 0.8, bodyBottom, halfW + halfB, bodyTop + bodyH * 0.8);
    ctx.quadraticCurveTo(halfW + halfB * 1.2, bodyTop + bodyH * 0.5, halfW + halfB, bodyTop + bodyH * 0.2);
    ctx.quadraticCurveTo(halfW + halfN, bodyTop + bodyH * 0.2, halfW + halfN, bodyTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw neck (cylindrical)
    ctx.fillRect(halfW - halfN, 0, neckW, neckH);
    ctx.strokeRect(halfW - halfN, 0, neckW, neckH);

    // Rim of the kalash (thick lip)
    ctx.fillRect(halfW - halfN - 2, 0, neckW + 4, 4);
    ctx.strokeRect(halfW - halfN - 2, 0, neckW + 4, 4);

    // Mango leaves (if enabled)
    if (this.data.metadata.hasMangoLeaves) {
      const leafSize = width * 0.15;
      const leafStartY = -leafSize * 0.5;

      for (let i = 0; i < leafCount; i++) {
        const leafAngle = -Math.PI / 2 + ((i - (leafCount - 1) / 2) * 0.4);
        const lx = halfW + Math.cos(leafAngle) * leafSize * 0.6;
        const ly = leafStartY + Math.sin(leafAngle) * leafSize * 0.6;

        ctx.beginPath();
        ctx.moveTo(halfW, leafStartY);
        ctx.quadraticCurveTo(
          halfW + Math.cos(leafAngle - 0.3) * leafSize,
          leafStartY + Math.sin(leafAngle - 0.3) * leafSize,
          lx, ly
        );
        ctx.quadraticCurveTo(
          halfW + Math.cos(leafAngle + 0.3) * leafSize,
          leafStartY + Math.sin(leafAngle + 0.3) * leafSize,
          halfW, leafStartY
        );
        ctx.fill();
        ctx.stroke();
      }

      // Stem
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, leafStartY);
      ctx.stroke();
    }

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const neckH = height * (this.data.metadata.neckHeight as number);
    const neckW = width * (this.data.metadata.neckWidth as number);
    const baseW = width * (this.data.metadata.baseWidth as number);
    const bodyTop = y + neckH;
    const bodyBottom = y + height;
    const bodyH = bodyBottom - bodyTop;
    const halfW = x + width / 2;
    const halfN = neckW / 2;
    const halfB = baseW / 2;
    const style = this.getSVGStyle();
    const transform = this.getSVGTransform();

    let svg = `<g ${transform}>`;

    // Body
    const leftTopX = halfW - halfN;
    const rightTopX = halfW + halfN;
    svg += `<path d="M${leftTopX},${bodyTop} ` +
      `Q${leftTopX},${bodyTop + bodyH * 0.2} ${halfW - halfB},${bodyTop + bodyH * 0.2} ` +
      `Q${halfW - halfB * 1.2},${bodyTop + bodyH * 0.5} ${halfW - halfB},${bodyTop + bodyH * 0.8} ` +
      `Q${halfW - halfB * 0.8},${bodyBottom} ${halfW},${bodyBottom} ` +
      `Q${halfW + halfB * 0.8},${bodyBottom} ${halfW + halfB},${bodyTop + bodyH * 0.8} ` +
      `Q${halfW + halfB * 1.2},${bodyTop + bodyH * 0.5} ${halfW + halfB},${bodyTop + bodyH * 0.2} ` +
      `Q${rightTopX},${bodyTop + bodyH * 0.2} ${rightTopX},${bodyTop}Z" ${style} />`;

    // Neck
    svg += `<rect x="${halfW - halfN}" y="${y}" width="${neckW}" height="${neckH}" ${style} />`;

    // Rim
    svg += `<rect x="${halfW - halfN - 2}" y="${y}" width="${neckW + 4}" height="4" ${style} />`;

    // Mango leaves
    if (this.data.metadata.hasMangoLeaves) {
      const leafSize = width * 0.15;
      const leafStartY = y - leafSize * 0.5;
      const leafCount = (this.data.metadata.leafCount as number) || 3;

      for (let i = 0; i < leafCount; i++) {
        const leafAngle = -Math.PI / 2 + ((i - (leafCount - 1) / 2) * 0.4);
        const lx = halfW + Math.cos(leafAngle) * leafSize * 0.6;
        const ly = leafStartY + Math.sin(leafAngle) * leafSize * 0.6;

        svg += `<path d="M${halfW},${leafStartY} ` +
          `Q${halfW + Math.cos(leafAngle - 0.3) * leafSize},${leafStartY + Math.sin(leafAngle - 0.3) * leafSize} ` +
          `${lx},${ly} ` +
          `Q${halfW + Math.cos(leafAngle + 0.3) * leafSize},${leafStartY + Math.sin(leafAngle + 0.3) * leafSize} ` +
          `${halfW},${leafStartY}Z" ${style} />`;
      }

      svg += `<line x1="${halfW}" y1="${y}" x2="${halfW}" y2="${leafStartY}" ${style} />`;
    }

    svg += `</g>`;

    return svg;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new KalashObject({
      ...rest,
      x: this.data.x + 20,
      y: this.data.y + 20,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// PillarObject – Decorative pillar/column
// ────────────────────────────────────────────────────────────────

export class PillarObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config,
      type: "pillar",
      category: "ganpati",
      metadata: {
        sections: 3,
        hasBase: true,
        hasCapital: true,
        fluted: false,
        ...config.metadata,
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const sections = (this.data.metadata.sections as number) || 3;
    const capH = height * 0.08;
    const baseH = height * 0.08;
    const bodyTop = capH;
    const bodyBottom = height - baseH;
    const bodyH = bodyBottom - bodyTop;
    const sectionH = bodyH / sections;
    const halfW = width / 2;
    const bodyW = width * 0.7;
    const halfB = bodyW / 2;

    // Capital (top)
    ctx.fillRect(halfW - halfW * 0.6, 0, width * 0.6, capH);
    ctx.strokeRect(halfW - halfW * 0.6, 0, width * 0.6, capH);

    // Base
    ctx.fillRect(halfW - halfW * 0.5, bodyBottom, width * 0.5, baseH);
    ctx.strokeRect(halfW - halfW * 0.5, bodyBottom, width * 0.5, baseH);

    // Body sections
    for (let i = 0; i < sections; i++) {
      const sy = bodyTop + sectionH * i;
      const sw = bodyW * (i % 2 === 0 ? 1 : 0.85);
      const shB = halfB * (sw / bodyW);
      ctx.fillRect(halfW - shB, sy, sw, sectionH);
      ctx.strokeRect(halfW - shB, sy, sw, sectionH);

      // Decorative band between sections
      if (i < sections - 1) {
        ctx.fillRect(halfW - halfB * 0.9, sy + sectionH - 3, bodyW * 0.9, 3);
      }
    }

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const sections = (this.data.metadata.sections as number) || 3;
    const capH = height * 0.08;
    const baseH = height * 0.08;
    const bodyTop = y + capH;
    const bodyBottom = y + height - baseH;
    const bodyH = bodyBottom - bodyTop;
    const sectionH = bodyH / sections;
    const halfW = x + width / 2;
    const bodyW = width * 0.7;
    const halfB = bodyW / 2;
    const style = this.getSVGStyle();
    const transform = this.getSVGTransform();

    let svg = `<g ${transform}>`;
    svg += `<rect x="${halfW - width * 0.3}" y="${y}" width="${width * 0.6}" height="${capH}" ${style} />`;
    svg += `<rect x="${halfW - width * 0.25}" y="${bodyBottom}" width="${width * 0.5}" height="${baseH}" ${style} />`;

    for (let i = 0; i < sections; i++) {
      const sy = bodyTop + sectionH * i;
      const sw = bodyW * (i % 2 === 0 ? 1 : 0.85);
      const shB = halfB * (sw / bodyW);
      svg += `<rect x="${halfW - shB}" y="${sy}" width="${sw}" height="${sectionH}" ${style} />`;
    }

    svg += `</g>`;
    return svg;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new PillarObject({
      ...rest,
      x: this.data.x + 20, y: this.data.y + 20,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// ArchObject – Decorative arch
// ────────────────────────────────────────────────────────────────

export class ArchObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config,
      type: "arch",
      category: "ganpati",
      metadata: {
        archType: "rounded",
        depth: 0.3,
        layers: 1,
        ...config.metadata,
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const layers = (this.data.metadata.layers as number) || 1;
    const depth = (this.data.metadata.depth as number) || 0.3;
    const halfW = width / 2;

    for (let l = 0; l < layers; l++) {
      const inset = l * depth * width * 0.5;
      const lw = width - inset * 2;
      const lh = height - inset * 2;
      const left = inset;
      const top = inset;
      const right = width - inset;
      const bottom = height - inset;
      const midX = (left + right) / 2;

      ctx.beginPath();
      ctx.moveTo(left, bottom);
      ctx.lineTo(left, top + lh * 0.4);
      ctx.quadraticCurveTo(left, top, midX, top);
      ctx.quadraticCurveTo(right, top, right, top + lh * 0.4);
      ctx.lineTo(right, bottom);
      ctx.stroke();
    }

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const layers = (this.data.metadata.layers as number) || 1;
    const depth = (this.data.metadata.depth as number) || 0.3;
    const style = this.getSVGStyle();
    const transform = this.getSVGTransform();

    let svg = `<g ${transform}>`;
    for (let l = 0; l < layers; l++) {
      const inset = l * depth * width * 0.5;
      const left = x + inset;
      const top = y + inset;
      const right = x + width - inset;
      const bottom = y + height - inset;
      const midX = (left + right) / 2;
      svg += `<path d="M${left},${bottom} L${left},${top + (height - inset * 2) * 0.4} Q${left},${top} ${midX},${top} Q${right},${top} ${right},${top + (height - inset * 2) * 0.4} L${right},${bottom}" ${style} fill="none" />`;
    }
    svg += `</g>`;
    return svg;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new ArchObject({
      ...rest,
      x: this.data.x + 20, y: this.data.y + 20,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// DomeObject – Traditional dome / shikhar shape
// ────────────────────────────────────────────────────────────────

export class DomeObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config,
      type: "dome",
      category: "ganpati",
      metadata: {
        domeType: "rounded", // "rounded" | "pointed" | "onion"
        layers: 1,
        finialSize: 8,
        ...config.metadata,
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const domeType = (this.data.metadata.domeType as string) || "rounded";
    const layers = (this.data.metadata.layers as number) || 1;
    const finialSize = (this.data.metadata.finialSize as number) || 8;
    const halfW = width / 2;

    for (let l = 0; l < layers; l++) {
      const lw = width - l * 10;
      const lh = height - l * 8;
      const inset = (width - lw) / 2;
      const top = inset;
      const bottom = height - inset;
      const left = inset;
      const right = width - inset;
      const midX = (left + right) / 2;

      ctx.beginPath();
      if (domeType === "onion") {
        ctx.moveTo(left, bottom);
        ctx.quadraticCurveTo(left, bottom - lh * 0.5, midX * 0.8, bottom - lh * 0.7);
        ctx.quadraticCurveTo(midX, top + lh * 0.1, midX, top);
        ctx.quadraticCurveTo(midX, top + lh * 0.1, right - midX * 0.2, bottom - lh * 0.7);
        ctx.quadraticCurveTo(right, bottom - lh * 0.5, right, bottom);
      } else if (domeType === "pointed") {
        ctx.moveTo(left, bottom);
        ctx.quadraticCurveTo(left, bottom - lh * 0.3, midX, top);
        ctx.quadraticCurveTo(right, bottom - lh * 0.3, right, bottom);
      } else {
        ctx.moveTo(left, bottom);
        ctx.quadraticCurveTo(left, bottom - lh, midX, top);
        ctx.quadraticCurveTo(right, bottom - lh, right, bottom);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Finial
    const finialY = height * 0.1;
    ctx.beginPath();
    ctx.arc(halfW, finialY - finialSize, finialSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const domeType = (this.data.metadata.domeType as string) || "rounded";
    const layers = (this.data.metadata.layers as number) || 1;
    const finialSize = (this.data.metadata.finialSize as number) || 8;
    const halfW = x + width / 2;
    const style = this.getSVGStyle();
    const transform = this.getSVGTransform();

    let svg = `<g ${transform}>`;
    for (let l = 0; l < layers; l++) {
      const inset = l * 10;
      const left = x + inset;
      const top = y + inset;
      const right = x + width - inset;
      const bottom = y + height - inset;
      const midX = (left + right) / 2;
      const lh = (height - inset * 2);

      if (domeType === "onion") {
        svg += `<path d="M${left},${bottom} Q${left},${bottom - lh * 0.5} ${midX * 0.8},${bottom - lh * 0.7} Q${midX},${top + lh * 0.1} ${midX},${top} Q${midX},${top + lh * 0.1} ${right - midX * 0.2},${bottom - lh * 0.7} Q${right},${bottom - lh * 0.5} ${right},${bottom}Z" ${style} />`;
      } else if (domeType === "pointed") {
        svg += `<path d="M${left},${bottom} Q${left},${bottom - lh * 0.3} ${midX},${top} Q${right},${bottom - lh * 0.3} ${right},${bottom}Z" ${style} />`;
      } else {
        svg += `<path d="M${left},${bottom} Q${left},${bottom - lh} ${midX},${top} Q${right},${bottom - lh} ${right},${bottom}Z" ${style} />`;
      }
    }

    const finialY = y + height * 0.15;
    svg += `<circle cx="${halfW}" cy="${finialY - finialSize}" r="${finialSize / 2}" ${style} />`;
    svg += `</g>`;
    return svg;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new DomeObject({
      ...rest,
      x: this.data.x + 20, y: this.data.y + 20,
    });
  }
}

// ────────────────────────────────────────────────────────────────
// BasePlatformObject – Decorative base / pedestal
// ────────────────────────────────────────────────────────────────

export class BasePlatformObject extends BaseCanvasObject {
  constructor(config: Partial<BaseObjectData>) {
    super({
      ...config,
      type: "base-platform",
      category: "ganpati",
      metadata: {
        tiers: 3,
        tierHeight: 0.3,
        ...config.metadata,
      },
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.data.visible) return;
    this.applyTransforms(ctx);
    this.applyStyles(ctx);

    const { width, height } = this.data;
    const tiers = (this.data.metadata.tiers as number) || 3;
    const tierHeight = height / tiers;

    for (let i = 0; i < tiers; i++) {
      const ty = height - tierHeight * (i + 1);
      const tw = width * (1 - i * 0.08);
      const tx = (width - tw) / 2;
      ctx.fillRect(tx, ty, tw, tierHeight);
      ctx.strokeRect(tx, ty, tw, tierHeight);
    }

    this.restoreContext(ctx);
  }

  toSVG(): string {
    const { x, y, width, height } = this.data;
    const tiers = (this.data.metadata.tiers as number) || 3;
    const tierHeight = height / tiers;
    const style = this.getSVGStyle();
    const transform = this.getSVGTransform();

    let svg = `<g ${transform}>`;
    for (let i = 0; i < tiers; i++) {
      const ty = y + height - tierHeight * (i + 1);
      const tw = width * (1 - i * 0.08);
      const tx = x + (width - tw) / 2;
      svg += `<rect x="${tx}" y="${ty}" width="${tw}" height="${tierHeight}" ${style} />`;
    }
    svg += `</g>`;
    return svg;
  }

  duplicate(): ICanvasObject {
    const { id: _id, ...rest } = this.data;
    return new BasePlatformObject({
      ...rest,
      x: this.data.x + 20, y: this.data.y + 20,
    });
  }
}
