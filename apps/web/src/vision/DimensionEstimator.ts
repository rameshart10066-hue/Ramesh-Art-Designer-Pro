/**
 * Dimension Estimator
 *
 * Estimates real-world dimensions from image analysis.
 * Returns width, height, depth, layer count, and material thickness.
 */

export interface DimensionEstimate {
  overallWidth: number;     // mm
  overallHeight: number;    // mm
  depth: number;            // mm
  layerCount: number;
  materialThickness: number; // mm
  scalePxToMm: number;
}

export function estimateDimensions(
  imageWidth: number,
  imageHeight: number,
  pixelScale: number,      // mm per pixel
  edgeDensity: number,
): DimensionEstimate {
  const overallWidth = Math.round(imageWidth * pixelScale);
  const overallHeight = Math.round(imageHeight * pixelScale);

  // Estimate layers from edge density (more edges = more layers)
  const layerCount = Math.max(1, Math.min(5, Math.round(edgeDensity * 20)));

  // Estimate material thickness from overall scale
  const materialThickness = overallWidth > 1000 ? 25 : overallWidth > 500 ? 12 : 6;

  // Estimate depth
  const depth = layerCount * materialThickness;

  return {
    overallWidth,
    overallHeight,
    depth,
    layerCount,
    materialThickness,
    scalePxToMm: pixelScale,
  };
}

/** Allow manual correction of estimated dimensions */
export function correctDimensions(
  estimate: DimensionEstimate,
  overrides: Partial<DimensionEstimate>,
): DimensionEstimate {
  return { ...estimate, ...overrides };
}
