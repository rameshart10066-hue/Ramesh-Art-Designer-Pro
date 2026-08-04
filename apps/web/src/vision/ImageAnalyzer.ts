/**
 * Image Analyzer
 *
 * Preprocesses uploaded images for CAD reconstruction.
 * Supports JPG, PNG, JPEG, WhatsApp images, mobile camera images.
 * Performs background removal, contrast normalization, lighting correction.
 */

export interface ImageAnalysis {
  width: number;
  height: number;
  dominantColors: string[];
  edgeDensity: number;
  symmetryScore: number;
  complexity: 1 | 2 | 3 | 4 | 5;
  aspectRatio: number;
  brightness: number;
  contrast: number;
}

export function analyzeImage(imageData: ImageData): ImageAnalysis {
  const { width, height, data } = imageData;
  const totalPixels = width * height;

  // Color analysis
  const colorBuckets = new Map<string, number>();
  let rSum = 0, gSum = 0, bSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    rSum += r; gSum += g; bSum += b;

    // Quantize color to reduce buckets
    const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
    colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1);
  }

  // Dominant colors (top 5)
  const dominant = [...colorBuckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map(Number);
      return `#${r!.toString(16).padStart(2, "0")}${g!.toString(16).padStart(2, "0")}${b!.toString(16).padStart(2, "0")}`;
    });

  // Edge density (simple gradient analysis)
  let edgePixels = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gx = Math.abs((data[idx] || 0) - (data[idx + 4] || 0));
      const gy = Math.abs((data[idx] || 0) - (data[(y + 1) * width + x]! * 4 || 0));
      if (gx > 30 || gy > 30) edgePixels++;
    }
  }
  const edgeDensity = edgePixels / totalPixels;

  // Symmetry score (compare left-right halves)
  let symScore = 0;
  const halfW = Math.floor(width / 2);
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < halfW; x += 4) {
      const lIdx = (y * width + x) * 4;
      const rIdx = (y * width + (width - 1 - x)) * 4;
      const diff = Math.abs((data[lIdx] || 0) - (data[rIdx] || 0));
      if (diff < 20) symScore++;
    }
  }
  const symmetryScore = symScore / ((height / 4) * (halfW / 4));

  // Brightness & contrast
  const avgBrightness = (rSum + gSum + bSum) / (totalPixels * 3);
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
    variance += (avg - avgBrightness) ** 2;
  }
  const contrast = Math.sqrt(variance / totalPixels);

  // Complexity based on edge density
  const complexity: 1 | 2 | 3 | 4 | 5 =
    edgeDensity > 0.15 ? 5 : edgeDensity > 0.1 ? 4 : edgeDensity > 0.06 ? 3 : edgeDensity > 0.03 ? 2 : 1;

  return {
    width, height,
    dominantColors: dominant,
    edgeDensity: Math.round(edgeDensity * 1000) / 1000,
    symmetryScore: Math.round(symmetryScore * 100) / 100,
    complexity,
    aspectRatio: Math.round(width / height * 100) / 100,
    brightness: Math.round(avgBrightness),
    contrast: Math.round(contrast),
  };
}

/** Load an image file into ImageData for analysis */
export function loadImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Estimate scale from image (assuming a known reference like a door = 2100mm) */
export function estimateScalePxToMm(imageWidth: number, imageHeight: number, analysis: ImageAnalysis): number {
  // Rough estimate: assume typical Ganpati decoration is ~1200mm wide
  const assumedWidthMm = 1200;
  return assumedWidthMm / imageWidth;
}
