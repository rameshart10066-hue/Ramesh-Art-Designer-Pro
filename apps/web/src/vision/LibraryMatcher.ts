/**
 * Library Matcher
 *
 * Matches detected components against the existing Component Library.
 * If confidence >= 90%, reuses existing component.
 * If confidence < 90%, suggests closest match for manual review.
 */

import type { DetectedComponent } from "./ComponentDetector";
import type { ComponentFeatures } from "./FeatureExtractor";
import { extractFeatures } from "./FeatureExtractor";
import { matchToLibrary, type MatchResult } from "./SimilarityMatcher";

export interface LibraryMatch {
  detectedType: string;
  matchedType: string;
  confidence: number;
  autoAccept: boolean;      // true if confidence >= 0.9
  suggestedParams: Record<string, any>;
  alternatives: { type: string; confidence: number }[];
}

export function matchAgainstLibrary(
  components: DetectedComponent[],
  imageWidth: number,
  imageHeight: number,
): LibraryMatch[] {
  const matches: LibraryMatch[] = [];

  for (const comp of components) {
    const features = extractFeatures(comp, imageWidth, imageHeight);
    const result = matchToLibrary(features);

    matches.push({
      detectedType: comp.type,
      matchedType: result.componentType,
      confidence: result.confidence,
      autoAccept: result.confidence >= 0.9,
      suggestedParams: {
        fill: comp.color,
        width: comp.width,
        height: comp.height,
      },
      alternatives: result.alternatives,
    });
  }

  return matches;
}

/** Allow manual replacement of a detected component with a library component */
export function replaceComponent(
  match: LibraryMatch,
  replacementType: string,
): LibraryMatch {
  return {
    ...match,
    matchedType: replacementType,
    confidence: 1.0,
    autoAccept: true,
  };
}
