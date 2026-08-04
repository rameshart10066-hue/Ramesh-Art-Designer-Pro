/**
 * DNA Extractor
 *
 * Extracts Design DNA from detected components.
 * Generates theme, style, symmetry, hierarchy, and manufacturing complexity.
 */

import type { DetectedComponent } from "./ComponentDetector";
import type { ImageAnalysis } from "./ImageAnalyzer";
import type { DesignDNA } from "@/product-model/DNAEngine";
import { DEFAULT_DNA, createVariant } from "@/product-model/DNAEngine";
import type { DimensionEstimate } from "./DimensionEstimator";

export function extractDNA(
  detected: DetectedComponent[],
  analysis: ImageAnalysis,
  dimensions: DimensionEstimate,
): DesignDNA {
  const mutations: Partial<DesignDNA> = {};

  // Detect style from symmetry and complexity
  if (analysis.symmetryScore > 0.8 && analysis.complexity >= 4) {
    mutations.style = "royal";
    mutations.primaryColor = detected[0]?.color || "#d4a017";
    mutations.ornamentDensity = 0.8;
  } else if (analysis.symmetryScore > 0.6 && analysis.complexity >= 3) {
    mutations.style = "temple";
    mutations.primaryColor = detected[0]?.color || "#c4956a";
    mutations.ornamentDensity = 0.6;
  } else if (analysis.complexity <= 2) {
    mutations.style = "minimal";
    mutations.primaryColor = "#e2e8f0";
    mutations.ornamentDensity = 0.1;
  } else {
    mutations.style = "traditional";
    mutations.primaryColor = detected[0]?.color || "#c62828";
    mutations.ornamentDensity = 0.4;
  }

  // Detect symmetry
  mutations.symmetry = analysis.symmetryScore > 0.7 ? "mirror" : "asymmetric";

  // Detect hierarchy from detected component types
  if (detected.some((d) => d.type === "frame")) mutations.frame = "lotus-frame";
  if (detected.some((d) => d.type === "arch")) mutations.arch = "pointed";
  if (detected.some((d) => d.type === "pillar")) mutations.pillar = "classic";
  if (detected.some((d) => d.type === "lotus")) mutations.lotus = "8-petal";
  if (detected.some((d) => d.type === "peacock")) mutations.peacock = "central";
  if (detected.some((d) => d.type === "stage")) mutations.stage = "3-tier";
  if (detected.some((d) => d.type === "frame")) mutations.border = "lotus";

  // Size based on dimensions
  mutations.proportions = dimensions.overallWidth > 1000 ? "grand" : dimensions.overallWidth > 500 ? "standard" : "compact";
  mutations.complexity = analysis.complexity;
  mutations.material = "thermocol";

  return createVariant(DEFAULT_DNA, mutations);
}
