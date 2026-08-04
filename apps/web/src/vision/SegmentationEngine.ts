/**
 * Segmentation Engine
 *
 * Segments the image into regions for component detection.
 * Uses color-based segmentation and edge detection to isolate individual parts.
 */

export interface Segment {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dominantColor: string;
  pixelCount: number;
  shape: "rectangular" | "circular" | "triangular" | "complex";
}

export function segmentImage(imageData: ImageData): Segment[] {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const segments: Segment[] = [];
  let segmentId = 1;

  // Flood-fill based segmentation
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = y * width + x;
      if (visited[idx]) continue;

      const pxIdx = idx * 4;
      const r = data[pxIdx]!, g = data[pxIdx + 1]!, b = data[pxIdx + 2]!;
      const brightness = (r + g + b) / 3;

      // Skip very dark or very light (background)
      if (brightness < 20 || brightness > 235) {
        visited[idx] = 1;
        continue;
      }

      // Flood fill this region
      const region = floodFill(imageData, x, y, visited, 25);
      if (region.pixels.length < 50) continue; // Skip tiny regions

      segments.push({
        id: segmentId++,
        x: region.minX,
        y: region.minY,
        width: region.maxX - region.minX,
        height: region.maxY - region.minY,
        dominantColor: region.dominantColor,
        pixelCount: region.pixels.length,
        shape: classifyShape(region),
      });
    }
  }

  return segments;
}

interface Region {
  minX: number; maxX: number;
  minY: number; maxY: number;
  pixels: number[];
  dominantColor: string;
}

function floodFill(
  imageData: ImageData,
  startX: number, startY: number,
  visited: Uint8Array,
  threshold: number,
): Region {
  const { width, height, data } = imageData;
  const stack = [[startX, startY]];
  const pixels: number[] = [];
  let minX = startX, maxX = startX, minY = startY, maxY = startY;
  let rSum = 0, gSum = 0, bSum = 0;

  const startIdx = (startY * width + startX) * 4;
  const baseR = data[startIdx]!, baseG = data[startIdx + 1]!, baseB = data[startIdx + 2]!;

  while (stack.length > 0) {
    const coords = stack.pop(); if (!coords) continue; const cx = coords[0]!, cy = coords[1]!;
    const idx = cy * width + cx;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const pxIdx = idx * 4;
    const r = data[pxIdx]!, g = data[pxIdx + 1]!, b = data[pxIdx + 2]!;
    const diff = Math.abs(r - baseR) + Math.abs(g - baseG) + Math.abs(b - baseB);
    if (diff > threshold) continue;

    pixels.push(cx, cy);
    rSum += r; gSum += g; bSum += b;
    minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
    minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);

    if (cx > 0 && !visited[cy * width + (cx - 1)]) stack.push([cx - 1, cy]);
    if (cx < width - 1 && !visited[cy * width + (cx + 1)]) stack.push([cx + 1, cy]);
    if (cy > 0 && !visited[(cy - 1) * width + cx]) stack.push([cx, cy - 1]);
    if (cy < height - 1 && !visited[(cy + 1) * width + cx]) stack.push([cx, cy + 1]);
  }

  const total = pixels.length / 2;
  const rHex = (val: number) => Math.max(0, Math.min(255, Math.round(val))).toString(16).padStart(2, "0");
  const rStr = `#${rHex(rSum / total)}${rHex(gSum / total)}${rHex(bSum / total)}`;

  return { minX, maxX, minY, maxY, pixels, dominantColor: rStr };
}

function classifyShape(region: any): "rectangular" | "circular" | "triangular" | "complex" {
  const w = region.maxX - region.minX;
  const h = region.maxY - region.minY;
  const aspect = w / h;
  const pixelCount = region.pixels.length / 2;
  const boundingArea = w * h;
  const fillRatio = boundingArea > 0 ? pixelCount / boundingArea : 0;

  if (fillRatio > 0.7 && Math.abs(aspect - 1) < 0.3) return "circular";
  if (fillRatio > 0.7 && aspect > 1.5) return "rectangular";
  if (fillRatio > 0.5 && fillRatio < 0.7) return "triangular";
  return "complex";
}
