/**
 * Confidence Engine
 *
 * Scores and tracks confidence for every detected component.
 * Highlights low-confidence components for user review.
 */

import type { DetectedComponent } from "./ComponentDetector";
import type { LibraryMatch } from "./LibraryMatcher";
import type { MatchResult } from "./SimilarityMatcher";

export interface ConfidenceReport {
  overall: number;
  components: { type: string; confidence: number; needsReview: boolean }[];
  warnings: string[];
  recommendations: string[];
}

export function generateConfidenceReport(
  detected: DetectedComponent[],
  matches: LibraryMatch[],
): ConfidenceReport {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const components: ConfidenceReport["components"] = [];
  let totalConfidence = 0;

  for (const comp of detected) {
    const match = matches.find((m) => m.detectedType === comp.type);
    const confidence = match?.confidence || comp.confidence;
    const needsReview = confidence < 0.8;

    components.push({ type: comp.type, confidence, needsReview });
    totalConfidence += confidence;

    if (needsReview) {
      warnings.push(`"${comp.type}" has low confidence (${Math.round(confidence * 100)}%) — needs review`);
      recommendations.push(`Consider manually selecting a replacement for "${comp.type}" from the library`);
    }
  }

  const overall = components.length > 0 ? totalConfidence / components.length : 0;

  return {
    overall: Math.round(overall * 100) / 100,
    components,
    warnings,
    recommendations,
  };
}

/** Get the color for a confidence value */
export function confidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "#22c55e";
  if (confidence >= 0.7) return "#fbbf24";
  return "#ef4444";
}
