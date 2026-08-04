/**
 * Path Utilities
 *
 * Converts primitive shapes to editable PathData,
 * computes boolean operations via canvas compositing,
 * and provides path manipulation helpers.
 */

import type { PathData, PathNode, BezierHandle, NodeType, BooleanOp, BooleanResult } from "@/types/paths";
import type { BaseObjectData } from "@/types/objects";

// ── ID counter for nodes ─────────────────────────────────────────

let nodeIdCounter = 1;
export function resetNodeIds() { nodeIdCounter = 1; }
function nextNodeId() { return nodeIdCounter++; }

// ── Primitive → Path conversion ──────────────────────────────────

export function rectToPath(data: BaseObjectData): PathData {
  const { x, y, width, height } = data;
  const nodes: PathNode[] = [
    makeNode(x, y, "corner"),
    makeNode(x + width, y, "corner"),
    makeNode(x + width, y + height, "corner"),
    makeNode(x, y + height, "corner"),
  ];
  return { nodes, closed: true, fillRule: "nonzero" };
}

export function ellipseToPath(data: BaseObjectData): PathData {
  const { x, y, width, height } = data;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const rx = width / 2;
  const ry = height / 2;
  const k = 0.5522847498; // bezier circle approximation constant

  const nodes: PathNode[] = [
    makeNode(cx, cy - ry, "smooth", null, { x: cx + rx * k, y: cy - ry }),
    makeNode(cx + rx, cy, "smooth", { x: cx + rx, y: cy - ry * k }, { x: cx + rx, y: cy + ry * k }),
    makeNode(cx, cy + ry, "smooth", { x: cx + rx * k, y: cy + ry }, { x: cx - rx * k, y: cy + ry }),
    makeNode(cx - rx, cy, "smooth", { x: cx - rx, y: cy + ry * k }, { x: cx - rx, y: cy - ry * k }),
  ];
  const n0 = nodes[0]!; n0.handleOut = n0.handleOut || { x: cx - rx * k, y: cy - ry };  const n3 = nodes[3]!; n3.handleIn = n3.handleIn || { x: cx - rx * k, y: cy - ry };
  return { nodes, closed: true, fillRule: "nonzero" };
}

export function circleToPath(data: BaseObjectData): PathData {
  // Same as ellipse but with equal radii
  return ellipseToPath(data);
}

export function starToPath(data: BaseObjectData): PathData {
  const { x, y, width, height } = data;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const outerR = Math.min(width, height) / 2;
  const innerR = outerR * ((data.metadata?.innerRadius as number) || 0.5);
  const points = (data.metadata?.points as number) || 5;
  const nodes: PathNode[] = [];

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    nodes.push(makeNode(px, py, "corner"));
  }

  return { nodes, closed: true, fillRule: "nonzero" };
}

export function polygonToPath(data: BaseObjectData): PathData {
  const { x, y, width, height } = data;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const sides = Math.max(3, (data.metadata?.sides as number) || 6);
  const r = Math.min(width, height) / 2;
  const nodes: PathNode[] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    nodes.push(makeNode(px, py, "corner"));
  }

  return { nodes, closed: true, fillRule: "nonzero" };
}

export function lineToPath(data: BaseObjectData): PathData {
  const { x, y, width, height } = data;
  const nodes: PathNode[] = [
    makeNode(x, y + height / 2, "corner"),
    makeNode(x + width, y + height / 2, "corner"),
  ];
  return { nodes, closed: false, fillRule: "nonzero" };
}

/** Convert a shape to its editable path representation */
export function shapeToPath(data: BaseObjectData): PathData | null {
  const type = data.type;
  if (type === "rectangle") return rectToPath(data);
  if (type === "circle") return circleToPath(data);
  if (type === "ellipse") return ellipseToPath(data);
  if (type === "star") return starToPath(data);
  if (type === "polygon") return polygonToPath(data);
  if (type === "line") return lineToPath(data);
  return null;
}

// ── Node helpers ─────────────────────────────────────────────────

function makeNode(
  x: number, y: number,
  type: NodeType = "corner",
  handleIn: BezierHandle | null = null,
  handleOut: BezierHandle | null = null,
): PathNode {
  return { id: nextNodeId(), x, y, type, handleIn, handleOut, selected: false };
}

export function clonePathData(path: PathData): PathData {
  return {
    nodes: path.nodes.map(n => ({ ...n, handleIn: n.handleIn ? { ...n.handleIn } : null, handleOut: n.handleOut ? { ...n.handleOut } : null })),
    closed: path.closed,
    fillRule: path.fillRule,
  };
}

// ── Boolean Operations (canvas-based) ────────────────────────────

/**
 * Compute boolean operation between two paths using Canvas2D compositing.
 * Renders both shapes off-screen, composites them, and extracts the result.
 */
export function booleanOperation(
  pathA: PathData,
  pathB: PathData,
  operation: BooleanOp,
  width: number = 2000,
  height: number = 2000,
): BooleanResult {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Render path A (source)
  ctx.fillStyle = "#ffffff";
  renderPathToContext(ctx, pathA);
  ctx.fill();

  // Apply operation via compositing
  const opMap: Record<BooleanOp, GlobalCompositeOperation> = {
    union: "lighter",
    subtract: "destination-out",
    intersect: "source-in",
    exclude: "xor",
    divide: "xor",
    trim: "destination-atop",
    merge: "lighter",
  };

  const compositeOp = opMap[operation];

  if (operation === "subtract") {
    // Subtract: render B over A with destination-out
    ctx.fillStyle = "#ffffff";
    renderPathToContext(ctx, pathB);
    ctx.fill();
  } else if (operation === "intersect") {
    ctx.fillStyle = "#ffffff";
    renderPathToContext(ctx, pathB);
    ctx.globalCompositeOperation = "source-in";
    renderPathToContext(ctx, pathA);
    ctx.fill();
  } else if (operation === "divide" || operation === "exclude") {
    ctx.fillStyle = "#ffffff";
    renderPathToContext(ctx, pathB);
    ctx.globalCompositeOperation = compositeOp;
    ctx.fill();
  } else {
    // Union / merge
    ctx.fillStyle = "#ffffff";
    renderPathToContext(ctx, pathB);
    ctx.fill();
  }

  // Extract result as path data from canvas pixels
  const resultPath = extractPathFromCanvas(ctx, width, height);

  const labels: Record<BooleanOp, string> = {
    union: "Union", subtract: "Subtract", intersect: "Intersect",
    exclude: "Exclude", divide: "Divide", trim: "Trim", merge: "Merge",
  };

  return { pathData: resultPath, label: labels[operation] };
}

function renderPathToContext(ctx: CanvasRenderingContext2D, path: PathData) {
  ctx.beginPath();
  const { nodes, closed } = path;
  if (nodes.length === 0) return;

  const first = nodes[0]!;
  ctx.moveTo(first.x, first.y);

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1]!;
    const curr = nodes[i]!;
    if (prev.handleOut && curr.handleIn) {
      ctx.bezierCurveTo(
        prev.handleOut.x, prev.handleOut.y,
        curr.handleIn.x, curr.handleIn.y,
        curr.x, curr.y,
      );
    } else if (prev.handleOut) {
      ctx.quadraticCurveTo(prev.handleOut.x, prev.handleOut.y, curr.x, curr.y);
    } else {
      ctx.lineTo(curr.x, curr.y);
    }
  }

  if (closed) {
    const last = nodes[nodes.length - 1]!;
    const firstNode = nodes[0]!;
    if (last.handleOut && firstNode.handleIn) {
      ctx.bezierCurveTo(
        last.handleOut.x, last.handleOut.y,
        firstNode.handleIn.x, firstNode.handleIn.y,
        firstNode.x, firstNode.y,
      );
    } else if (last.handleOut) {
      ctx.quadraticCurveTo(last.handleOut.x, last.handleOut.y, firstNode.x, firstNode.y);
    }
    ctx.closePath();
  }
}

function extractPathFromCanvas(ctx: CanvasRenderingContext2D, w: number, h: number): PathData {
  // Simplified extraction: create a bounding rect-based path from non-transparent pixels
  // For a production system, use contour tracing (marching squares)
  // For now, return a simple rectangle approximation of the resulting shape
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3]!;
      if (alpha > 128) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        found = true;
      }
    }
  }

  if (!found) {
    return { nodes: [], closed: true, fillRule: "nonzero" };
  }

  const nodes: PathNode[] = [
    makeNode(minX, minY, "corner"),
    makeNode(maxX, minY, "corner"),
    makeNode(maxX, maxY, "corner"),
    makeNode(minX, maxY, "corner"),
  ];
  return { nodes, closed: true, fillRule: "nonzero" };
}

// ── Node Manipulation ────────────────────────────────────────────

export function addNodeToPath(path: PathData, afterIndex: number): PathNode {
  const nodes = path.nodes;
  if (nodes.length === 0) {
    const n = makeNode(0, 0, "corner");
    path.nodes.push(n);
    return n;
  }
  const prev = nodes[afterIndex]!;
  const next = nodes[(afterIndex + 1) % nodes.length]!;
  const midX = (prev.x + next.x) / 2;
  const midY = (prev.y + next.y) / 2;
  const n = makeNode(midX, midY, "corner");
  path.nodes.splice(afterIndex + 1, 0, n);
  return n;
}

export function deleteNodeFromPath(path: PathData, nodeId: number): boolean {
  const idx = path.nodes.findIndex(n => n.id === nodeId);
  if (idx === -1 || path.nodes.length <= 2) return false;
  path.nodes.splice(idx, 1);
  return true;
}

export function convertNodeType(node: PathNode, newType: NodeType): void {
  node.type = newType;
  if (newType === "corner") {
    node.handleIn = null;
    node.handleOut = null;
  } else if (newType === "smooth" && node.handleIn && node.handleOut) {
    // Make handles collinear
    const dist = Math.sqrt(
      (node.handleOut.x - node.x) ** 2 + (node.handleOut.y - node.y) ** 2,
    );
    if (dist > 0) {
      const ratio = dist / Math.sqrt(
        (node.handleIn.x - node.x) ** 2 + (node.handleIn.y - node.y) ** 2,
      ) || 1;
      node.handleOut.x = node.x + (node.x - node.handleIn.x) * ratio;
      node.handleOut.y = node.y + (node.y - node.handleIn.y) * ratio;
    }
  }
}

export function moveNode(node: PathNode, dx: number, dy: number): void {
  node.x += dx;
  node.y += dy;
  if (node.handleIn) { node.handleIn.x += dx; node.handleIn.y += dy; }
  if (node.handleOut) { node.handleOut.x += dx; node.handleOut.y += dy; }
}

export function getSelectedNodes(path: PathData): PathNode[] {
  return path.nodes.filter(n => n.selected);
}

export function selectNode(path: PathData, nodeId: number, multi: boolean = false): void {
  if (!multi) path.nodes.forEach(n => n.selected = false);
  const node = path.nodes.find(n => n.id === nodeId);
  if (node) node.selected = true;
}

export function deselectAllNodes(path: PathData): void {
  path.nodes.forEach(n => n.selected = false);
}
