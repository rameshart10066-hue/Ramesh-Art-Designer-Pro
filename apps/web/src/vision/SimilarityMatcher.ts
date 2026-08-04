/**
 * Similarity Matcher
 *
 * Matches detected component features against known parametric component types.
 * Returns best match, confidence, and alternative matches.
 */

import type { ComponentFeatures } from "./FeatureExtractor";
import { componentRegistry } from "@/parametric/ComponentRegistry";
import type { ComponentDefinition } from "@/parametric/ComponentDefinition";

export interface MatchResult {
  componentType: string;
  confidence: number;
  matchedDef: ComponentDefinition | null;
  alternatives: { type: string; confidence: number }[];
}

const TYPE_FEATURES: Record<string, { minAspect: number; maxAspect: number; shape: string; sizeRange: [number, number] }> = {
  frame:      { minAspect: 0.8, maxAspect: 2.0, shape: "rectangular", sizeRange: [0.4, 0.9] },
  arch:       { minAspect: 1.0, maxAspect: 3.0, shape: "triangular", sizeRange: [0.2, 0.6] },
  pillar:     { minAspect: 0.1, maxAspect: 0.5, shape: "rectangular", sizeRange: [0.1, 0.3] },
  lotus:      { minAspect: 0.8, maxAspect: 1.5, shape: "circular", sizeRange: [0.05, 0.2] },
  peacock:    { minAspect: 0.6, maxAspect: 1.5, shape: "complex", sizeRange: [0.05, 0.2] },
  dome:       { minAspect: 0.8, maxAspect: 1.5, shape: "circular", sizeRange: [0.1, 0.25] },
  stage:      { minAspect: 2.0, maxAspect: 8.0, shape: "rectangular", sizeRange: [0.3, 0.6] },
  decoration: { minAspect: 0.5, maxAspect: 2.0, shape: "complex", sizeRange: [0.02, 0.1] },
};

export function matchToLibrary(features: ComponentFeatures): MatchResult {
  const candidates: { type: string; score: number }[] = [];

  for (const [type, def] of Object.entries(TYPE_FEATURES)) {
    let score = 0;
    const weights = { aspect: 0.3, shape: 0.3, size: 0.2, position: 0.2 };

    // Aspect ratio match
    if (features.aspectRatio >= def.minAspect && features.aspectRatio <= def.maxAspect) {
      score += weights.aspect;
    } else {
      const dist = Math.min(
        Math.abs(features.aspectRatio - def.minAspect),
        Math.abs(features.aspectRatio - def.maxAspect),
      );
      score += weights.aspect * Math.max(0, 1 - dist);
    }

    // Shape match
    if (features.shapeComplexity < 0.3 && def.shape === "rectangular") score += weights.shape;
    else if (features.shapeComplexity < 0.5 && def.shape === "circular") score += weights.shape;
    else if (features.shapeComplexity > 0.5 && def.shape === "complex") score += weights.shape;
    else score += weights.shape * 0.3;

    // Size match
    if (features.relativeSize >= def.sizeRange[0] && features.relativeSize <= def.sizeRange[1]) {
      score += weights.size;
    }

    // Position match (center for lotus/arch, sides for pillars, bottom for stage)
    if (type === "pillar" && (features.relativeX < 0.3 || features.relativeX > 0.7)) score += weights.position;
    else if (type === "lotus" && features.relativeX > 0.3 && features.relativeX < 0.7 && features.relativeY > 0.3 && features.relativeY < 0.7) score += weights.position;
    else if (type === "stage" && features.relativeY > 0.7) score += weights.position;
    else if (type === "arch" && features.relativeY < 0.4) score += weights.position;
    else score += weights.position * 0.3;

    candidates.push({ type, score });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  const best = candidates[0];
  const alternatives = candidates.slice(1, 4).map((c) => ({ type: c.type, confidence: c.score }));

  const def = componentRegistry.get(features.type) || componentRegistry.get(best?.type || "rectangle") || null;

  return {
    componentType: best?.type || features.type,
    confidence: best?.score || 0.5,
    matchedDef: def,
    alternatives,
  };
}
