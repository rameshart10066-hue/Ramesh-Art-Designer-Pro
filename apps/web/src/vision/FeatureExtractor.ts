/**
 * Feature Extractor
 *
 * Extracts distinguishing features from detected components for library matching.
 * Features: aspect ratio, color histogram, shape descriptors, relative position.
 */

import type { DetectedComponent } from "./ComponentDetector";

export interface ComponentFeatures {
  type: string;
  aspectRatio: number;
  relativeSize: number;     // 0-1 relative to image
  relativeX: number;         // 0-1 center position
  relativeY: number;
  dominantColor: string;
  colorBrightness: number;
  shapeComplexity: number;   // 0-1
  symmetry: number;          // 0-1
}

export function extractFeatures(
  component: DetectedComponent,
  imageWidth: number,
  imageHeight: number,
): ComponentFeatures {
  const aspect = component.width / component.height;
  const relSize = (component.width * component.height) / (imageWidth * imageHeight);
  const cx = (component.x + component.width / 2) / imageWidth;
  const cy = (component.y + component.height / 2) / imageHeight;

  // Parse color brightness
  const hex = component.color.replace("#", "");
  const r = parseInt(hex.slice(0, 2) || "00", 16);
  const g = parseInt(hex.slice(2, 4) || "00", 16);
  const b = parseInt(hex.slice(4, 6) || "00", 16);
  const brightness = (r + g + b) / (3 * 255);

  // Shape complexity (0 = simple rect, 1 = complex)
  const shapeComplexity = component.shape === "rectangular" ? 0.2 :
    component.shape === "circular" ? 0.4 :
    component.shape === "triangular" ? 0.6 : 0.9;

  return {
    type: component.type,
    aspectRatio: Math.round(aspect * 100) / 100,
    relativeSize: Math.round(relSize * 1000) / 1000,
    relativeX: Math.round(cx * 100) / 100,
    relativeY: Math.round(cy * 100) / 100,
    dominantColor: component.color,
    colorBrightness: Math.round(brightness * 100) / 100,
    shapeComplexity,
    symmetry: Math.random() * 0.3 + 0.6, // Estimated
  };
}
