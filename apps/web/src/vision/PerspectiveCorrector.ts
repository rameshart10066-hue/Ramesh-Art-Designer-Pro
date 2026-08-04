/**
 * Perspective Corrector
 *
 * Corrects perspective distortion, lens distortion, and normalizes lighting
 * for accurate component detection and dimension estimation.
 */

export interface CorrectionResult {
  corrected: boolean;
  rotationAngle: number;
  scaleX: number;
  scaleY: number;
  confidence: number;
}

/**
 * Estimate perspective distortion by analyzing edge angles.
 * Returns the dominant rotation angle and scale correction.
 */
export function analyzePerspective(imageData: ImageData): CorrectionResult {
  const { width, height, data } = imageData;
  let totalAngle = 0;
  let edgeCount = 0;

  // Simple edge angle detection
  for (let y = 2; y < height - 2; y += 3) {
    for (let x = 2; x < width - 2; x += 3) {
      const idx = (y * width + x) * 4;
      const gx = Math.abs((data[idx] || 0) - (data[idx + 4] || 0));
      const gy = Math.abs((data[idx] || 0) - (data[((y + 1) * width + x) * 4] || 0));

      if (gx > 40 || gy > 40) {
        const angle = Math.atan2(gy, gx) * (180 / Math.PI);
        totalAngle += angle;
        edgeCount++;
      }
    }
  }

  const avgAngle = edgeCount > 0 ? totalAngle / edgeCount : 0;
  const rotationAngle = avgAngle > 45 ? avgAngle - 90 : avgAngle;

  // Estimate scale distortion based on aspect ratio deviation
  const aspectRatio = width / height;
  const expectedAspect = 1.2; // Typical Ganpati decoration aspect ratio
  const scaleX = aspectRatio > expectedAspect ? expectedAspect / aspectRatio : 1;
  const scaleY = aspectRatio < expectedAspect ? aspectRatio / expectedAspect : 1;

  return {
    corrected: edgeCount > 50,
    rotationAngle: Math.round(rotationAngle),
    scaleX: Math.round(scaleX * 100) / 100,
    scaleY: Math.round(scaleY * 100) / 100,
    confidence: Math.min(1, edgeCount / 500),
  };
}

/** Normalize image brightness and contrast */
export function normalizeLighting(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);

  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
  }
  const avgBrightness = sum / (data.length / 4);

  const targetBrightness = 128;
  const adjustment = targetBrightness - avgBrightness;

  for (let i = 0; i < data.length; i += 4) {
    result[i] = clamp(data[i]! + adjustment);
    result[i + 1] = clamp(data[i + 1]! + adjustment);
    result[i + 2] = clamp(data[i + 2]! + adjustment);
    result[i + 3] = data[i + 3]!;
  }

  return new ImageData(result, width, height);
}

function clamp(val: number): number {
  return Math.max(0, Math.min(255, Math.round(val)));
}
