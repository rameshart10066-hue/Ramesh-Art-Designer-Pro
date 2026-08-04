/**
 * PDF Assembly Exporter
 *
 * Generates an SVG-based assembly guide that can be printed or converted to PDF.
 * Contains step-by-step instructions with exploded diagrams.
 */

import type { AssemblyGuide, AssemblyStep } from "./AssemblyGuide";

export function generateAssemblySVG(guide: AssemblyGuide): string {
  const pageWidth = 800;
  const pageHeight = 1100;
  const margin = 40;
  const contentW = pageWidth - margin * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${pageHeight * guide.steps.length}" viewBox="0 0 ${pageWidth} ${pageHeight * guide.steps.length}">\n`;
  svg += `  <defs>\n`;
  svg += `    <style>\n`;
  svg += `      .title { font-family: sans-serif; font-size: 24px; font-weight: bold; fill: #e2e8f0; }\n`;
  svg += `      .heading { font-family: sans-serif; font-size: 16px; font-weight: bold; fill: #60a5fa; }\n`;
  svg += `      .text { font-family: sans-serif; font-size: 12px; fill: #94a3b8; }\n`;
  svg += `      .step-num { font-family: sans-serif; font-size: 36px; font-weight: bold; fill: #3b82f6; }\n`;
  svg += `      .note { font-family: sans-serif; font-size: 10px; fill: #64748b; }\n`;
  svg += `    </style>\n`;
  svg += `  </defs>\n`;

  // Background
  svg += `  <rect width="${pageWidth}" height="${pageHeight * guide.steps.length}" fill="#0f172a"/>\n`;

  // Cover page
  svg += `  <text x="${pageWidth / 2}" y="200" text-anchor="middle" class="title">${guide.title}</text>\n`;
  svg += `  <text x="${pageWidth / 2}" y="240" text-anchor="middle" class="text">${guide.totalSteps} steps · ${guide.estimatedTotalTime} min · Difficulty: ${guide.difficulty}/5</text>\n`;
  svg += `  <text x="${pageWidth / 2}" y="280" text-anchor="middle" class="text">Tools: ${guide.tools.join(", ") || "None"}</text>\n`;

  // Parts list
  svg += `  <text x="${margin}" y="350" class="heading">Parts List</text>\n`;
  let py = 380;
  for (const part of guide.partsList) {
    svg += `  <text x="${margin}" y="${py}" class="text">${part.partNumber}: ${part.name} × ${part.quantity}</text>\n`;
    py += 20;
  }

  // Steps
  for (let i = 0; i < guide.steps.length; i++) {
    const step = guide.steps[i]!;
    const pageY = (i + 1) * pageHeight;

    svg += `  <text x="${margin}" y="${pageY + 60}" class="step-num">${step.stepNumber}</text>\n`;
    svg += `  <text x="${margin + 50}" y="${pageY + 60}" class="heading">${step.title}</text>\n`;

    // Description
    const desc = wordWrap(step.description, contentW - 50, 12);
    let dy = 100;
    for (const line of desc) {
      svg += `  <text x="${margin}" y="${pageY + dy}" class="text">${line}</text>\n`;
      dy += 18;
    }

    // Parts involved
    svg += `  <text x="${margin}" y="${pageY + dy + 10}" class="heading">Parts</text>\n`;
    dy += 30;
    for (const pn of step.partsInvolved) {
      svg += `  <text x="${margin + 10}" y="${pageY + dy}" class="text">• ${pn}</text>\n`;
      dy += 16;
    }

    // Info
    dy += 10;
    svg += `  <text x="${margin}" y="${pageY + dy}" class="note">Estimated time: ${step.estimatedTime} min</text>\n`;
    svg += `  <text x="${margin + 200}" y="${pageY + dy}" class="note">Difficulty: ${step.difficulty}/5</text>\n`;
    svg += `  <text x="${margin + 400}" y="${pageY + dy}" class="note">Tools: ${step.tools.join(", ") || "None"}</text>\n`;

    // Exploded diagram placeholder
    const diagramY = pageY + dy + 40;
    svg += `  <rect x="${margin}" y="${diagramY}" width="${contentW}" height="${pageHeight - (diagramY - pageY) - 40}" fill="#1e293b" stroke="#334155" rx="8"/>\n`;
    svg += `  <text x="${pageWidth / 2}" y="${diagramY + 40}" text-anchor="middle" class="note">Step ${step.stepNumber} — ${step.title}</text>\n`;
    svg += `  <text x="${pageWidth / 2}" y="${diagramY + 60}" text-anchor="middle" class="note">Exploded diagram</text>\n`;

    // Arrow indicators
    for (const arrow of step.directionArrows) {
      const ax1 = arrow.from[0], ay1 = arrow.from[1];
      const ax2 = arrow.to[0], ay2 = arrow.to[1];
      svg += `  <line x1="${pageWidth / 2 + ax1}" y1="${diagramY + 200 + ay1}" x2="${pageWidth / 2 + ax2}" y2="${diagramY + 200 + ay2}" stroke="#3b82f6" stroke-width="2" marker-end="url(#arrow)"/>\n`;
    }
  }

  // Notes page
  const notesPage = (guide.steps.length + 1) * pageHeight;
  svg += `  <text x="${margin}" y="${notesPage + 60}" class="heading">Assembly Notes</text>\n`;
  let ny = 100;
  for (const note of guide.notes) {
    svg += `  <text x="${margin}" y="${notesPage + ny}" class="note">• ${note}</text>\n`;
    ny += 20;
  }

  svg += `</svg>`;
  return svg;
}

function wordWrap(text: string, maxWidth: number, fontSize: number): string[] {
  const avgCharWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).length <= maxChars) {
      current += (current ? " " : "") + word;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}
