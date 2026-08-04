/**
 * Object → SVG preview renderer (shared).
 *
 * Renders a list of `BaseObjectData` canvas objects into a compact SVG
 * silhouette. Used for catalog card previews and recent-project thumbnails.
 * Pure and side-effect free, so it is safe in tests and server contexts.
 */

import type { BaseObjectData } from "@/types/objects";

export function renderObjectsSvg(objects: BaseObjectData[], padding = 16): string {
  if (objects.length === 0) {
    return emptySvg("Empty design");
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const o of objects) {
    if (!o.visible) continue;
    minX = Math.min(minX, o.x);
    minY = Math.min(minY, o.y);
    maxX = Math.max(maxX, o.x + o.width);
    maxY = Math.max(maxY, o.y + o.height);
  }

  // All objects hidden (or degenerate) — fall back to the empty placeholder.
  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) {
    return emptySvg();
  }

  const x0 = minX - padding;
  const y0 = minY - padding;
  const w = Math.max(1, maxX - minX + padding * 2);
  const h = Math.max(1, maxY - minY + padding * 2);

  const body = objects.filter((o) => o.visible).map(objectToSvgTag).join("\n");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`,
    `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#0f172a"/>`,
    body,
    `</svg>`,
  ].join("\n");
}

function emptySvg(label = ""): string {
  const text = label
    ? `<text x="200" y="155" font-size="20" fill="#475569" text-anchor="middle">${escapeXml(label)}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><rect width="400" height="300" fill="#0f172a"/>${text}</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fillAttr(fill: string | undefined): string {
  const f = fill || "transparent";
  return f === "transparent" || f === "none" ? 'fill="none"' : `fill="${escapeXml(f)}"`;
}

function objectToSvgTag(o: BaseObjectData): string {
  const cx = o.x + o.width / 2;
  const cy = o.y + o.height / 2;
  const rotate = o.rotation ? ` transform="rotate(${o.rotation} ${cx} ${cy})"` : "";
  const stroke = o.stroke ? ` stroke="${escapeXml(o.stroke)}" stroke-width="${o.strokeWidth ?? 1}"` : "";
  const opacity = o.opacity !== undefined && o.opacity < 1 ? ` opacity="${o.opacity}"` : "";
  const common = `${fillAttr(o.fill)}${stroke}${opacity}${rotate}`;
  const corner = o.cornerRadius ?? 0;

  switch (o.type) {
    case "ellipse":
    case "circle":
      return `<ellipse cx="${cx}" cy="${cy}" rx="${o.width / 2}" ry="${o.height / 2}" ${common}/>`;
    case "text": {
      const fontSize = o.fontSize ?? 14;
      return `<text x="${o.x}" y="${o.y + fontSize}" font-size="${fontSize}" font-family="${escapeXml(o.fontFamily ?? "sans-serif")}" ${common}>${escapeXml(o.text ?? o.name ?? "")}</text>`;
    }
    case "image": {
      if (o.src) {
        return `<image x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" href="${escapeXml(o.src)}" preserveAspectRatio="xMidYMid slice"/>`;
      }
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" rx="${corner}" ${common}/>`;
    }
    default:
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" rx="${corner}" ${common}/>`;
  }
}
