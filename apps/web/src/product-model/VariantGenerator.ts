/**
 * Variant Generator
 *
 * Generates unlimited design variants by modifying DNA parameters.
 * Maintains symmetry, proportions, and never generates invalid geometry.
 */

import { DEFAULT_DNA, createVariant, dnaToComponentParams, type DesignDNA } from "./DNAEngine";

export interface DesignVariant {
  id: string;
  name: string;
  dna: DesignDNA;
  thumbnail?: string;
  description: string;
  tags: string[];
}

/** Generate a set of predefined variants from a base DNA */
export function generatePredefinedVariants(base: DesignDNA = DEFAULT_DNA): DesignVariant[] {
  return [
    { id: "royal-classic", name: "Royal Classic", dna: createVariant(base, { style: "royal", primaryColor: "#d4a017", ornamentDensity: 0.8, complexity: 4 }), description: "Opulent design with gold accents and rich ornamentation", tags: ["royal", "gold", "premium"] },
    { id: "temple-grand", name: "Temple Grand", dna: createVariant(base, { style: "temple", primaryColor: "#c4956a", arch: "multilayer", complexity: 5 }), description: "Grand temple-inspired architecture with多层 arches", tags: ["temple", "grand", "traditional"] },
    { id: "modern-minimal", name: "Modern Minimal", dna: createVariant(base, { style: "minimal", primaryColor: "#e2e8f0", secondaryColor: "#94a3b8", accentColor: "#64748b", ornamentDensity: 0.1, complexity: 1 }), description: "Clean, contemporary design with minimal ornamentation", tags: ["modern", "minimal", "contemporary"] },
    { id: "south-indian", name: "South Indian", dna: createVariant(base, { style: "traditional", arch: "pointed", pillar: "fluted", primaryColor: "#c62828", secondaryColor: "#f5c6ec", accentColor: "#d4a017",  ornamentDensity: 0.6 }), description: "Traditional South Indian temple style with red and gold", tags: ["south-indian", "traditional", "colorful"] },
    { id: "north-indian", name: "North Indian", dna: createVariant(base, { style: "royal", arch: "rounded", pillar: "classic", primaryColor: "#ff6f00", secondaryColor: "#fff3e0", accentColor: "#d4a017", ornamentDensity: 0.7 }), description: "Royal North Indian design with warm saffron tones", tags: ["north-indian", "royal", "warm"] },
    { id: "fusion", name: "Fusion Contemporary", dna: createVariant(base, { style: "modern", arch: "multilayer", primaryColor: "#1a237e", secondaryColor: "#e8eaf6", accentColor: "#ff6f00", proportions: "compact", ornamentDensity: 0.4 }), description: "Modern fusion blending traditional elements with contemporary colors", tags: ["fusion", "modern", "compact"] },
  ];
}

/** Apply a variant's DNA to generate component configurations */
export function applyVariant(variant: DesignVariant): Record<string, any[]> {
  return dnaToComponentParams(variant.dna);
}
