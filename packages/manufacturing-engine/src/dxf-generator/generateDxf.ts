import type { CutPath, Point } from "../shared/geometry";

export interface DxfTextEntity {
  x: number;
  y: number;
  text: string;
  heightMm?: number;
}

export interface DxfInput {
  cutPaths: CutPath[];
  texts?: DxfTextEntity[];
}

const DEFAULT_TEXT_HEIGHT_MM = 10;

/**
 * Writes DXF R12 (AC1009) — the oldest widely-supported DXF version, so
 * output opens in essentially any CAM/laser software. R12 predates
 * LWPOLYLINE (added in R14), so closed cut paths are written as
 * POLYLINE/VERTEX/SEQEND groups rather than the more compact modern form.
 *
 * This is a hand-written minimal writer, not a full DXF library — it
 * covers exactly the two entity types this app needs (POLYLINE, TEXT).
 */
export function generateDxf(input: DxfInput): string {
  if (input.cutPaths.length === 0) {
    throw new Error("At least one cut path is required.");
  }
  for (const path of input.cutPaths) {
    if (path.points.length < 2) {
      throw new Error("Each cut path needs at least 2 points.");
    }
  }

  const lines: string[] = [];
  lines.push("0", "SECTION", "2", "ENTITIES");

  for (const path of input.cutPaths) {
    lines.push(...polylineEntity(path));
  }

  for (const text of input.texts ?? []) {
    lines.push(...textEntity(text));
  }

  lines.push("0", "ENDSEC", "0", "EOF");

  return lines.join("\n");
}

function polylineEntity(path: CutPath): string[] {
  const isClosed = path.closed !== false;
  const lines: string[] = [
    "0",
    "POLYLINE",
    "8",
    "CUT",
    "66",
    "1", // "entities follow" flag, required for POLYLINE
    "70",
    isClosed ? "1" : "0", // 1 = closed polyline
  ];

  for (const point of path.points) {
    lines.push(...vertexEntity(point));
  }

  lines.push("0", "SEQEND");
  return lines;
}

function vertexEntity(point: Point): string[] {
  return [
    "0",
    "VERTEX",
    "8",
    "CUT",
    "10",
    point.x.toFixed(4),
    "20",
    point.y.toFixed(4),
    "30",
    "0.0",
  ];
}

function textEntity(text: DxfTextEntity): string[] {
  return [
    "0",
    "TEXT",
    "8",
    "ENGRAVE",
    "10",
    text.x.toFixed(4),
    "20",
    text.y.toFixed(4),
    "30",
    "0.0",
    "40",
    String(text.heightMm ?? DEFAULT_TEXT_HEIGHT_MM),
    "1",
    text.text,
  ];
}
