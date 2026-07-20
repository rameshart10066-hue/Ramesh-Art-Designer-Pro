/**
 * Wraps inner SVG markup in a root <svg> element with the given
 * dimensions. Shared by every generator so the document structure
 * (viewBox, units, xmlns) stays consistent without each generator
 * repeating it. Deliberately produces plain SVG only — no DXF, no
 * machine-specific metadata; that's manufacturing-engine's concern.
 */
export function wrapSvgDocument(widthMm: number, heightMm: number, innerMarkup: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 ${widthMm} ${heightMm}">`,
    innerMarkup,
    `</svg>`,
  ].join("\n");
}

/** Escapes text for safe inclusion inside an SVG <text> element. */
export function escapeSvgText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
