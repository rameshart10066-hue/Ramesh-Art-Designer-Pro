/**
 * DNA Generator
 *
 * Converts a parsed intent into a complete Design DNA.
 * Maps detected themes, styles, sizes, and components to DNA parameters.
 */

import type { DesignDNA } from "@/product-model/DNAEngine";
import { DEFAULT_DNA, createVariant } from "@/product-model/DNAEngine";
import type { ParsedIntent } from "./PromptParser";

const STYLE_TO_DNA: Record<string, Partial<DesignDNA>> = {
  royal: { style: "royal", primaryColor: "#d4a017", secondaryColor: "#c4956a", accentColor: "#8b6914", ornamentDensity: 0.8 },
  traditional: { style: "traditional", primaryColor: "#c62828", secondaryColor: "#f5c6ec", accentColor: "#d4a017", ornamentDensity: 0.5 },
  minimal: { style: "minimal", primaryColor: "#e2e8f0", secondaryColor: "#94a3b8", accentColor: "#64748b", ornamentDensity: 0.1 },
  modern: { style: "modern", primaryColor: "#1a237e", secondaryColor: "#e8eaf6", accentColor: "#ff6f00", ornamentDensity: 0.3 },
  temple: { style: "temple", primaryColor: "#c4956a", secondaryColor: "#8b7355", accentColor: "#6b5740", ornamentDensity: 0.6 },
};

const COMPONENT_TO_DNA: Record<string, Partial<DesignDNA>> = {
  mandap: { frame: "lotus-frame", arch: "pointed", pillar: "classic", stage: "3-tier", lotus: "8-petal", peacock: "central" },
  arch: { arch: "multilayer", frame: "lotus-frame", pillar: "classic" },
  pillar: { pillar: "fluted" },
  dome: { arch: "rounded" },
  lotus: { lotus: "8-petal" },
  peacock: { peacock: "central" },
  kalash: { lotus: "8-petal" },
  stage: { stage: "3-tier", background: "panel" },
  bell: {},
  prabhavali: {},
  swastik: { border: "lotus" },
  om: {},
};

const SIZE_TO_PROPS: Record<string, { proportions: "compact" | "standard" | "grand"; complexity: 1 | 2 | 3 | 4 | 5 }> = {
  compact: { proportions: "compact", complexity: 2 },
  standard: { proportions: "standard", complexity: 3 },
  grand: { proportions: "grand", complexity: 4 },
};

export function generateDNA(intent: ParsedIntent, existingDNA?: DesignDNA): DesignDNA {
  const base = existingDNA || DEFAULT_DNA;
  const mutations: Partial<DesignDNA> = {};

  // Apply style
  if (intent.style && STYLE_TO_DNA[intent.style]) {
    Object.assign(mutations, STYLE_TO_DNA[intent.style]);
  }

  // Apply size
  if (intent.size && SIZE_TO_PROPS[intent.size]) {
    Object.assign(mutations, SIZE_TO_PROPS[intent.size]);
  }

  // Apply components
  for (const comp of intent.keyComponents) {
    if (COMPONENT_TO_DNA[comp]) {
      Object.assign(mutations, COMPONENT_TO_DNA[comp]);
    }
  }

  // Override with explicit values
  if (intent.complexity) mutations.complexity = intent.complexity;
  if (intent.decorationDensity != null) mutations.ornamentDensity = intent.decorationDensity;
  if (intent.colors.length >= 1) mutations.primaryColor = intent.colors[0]!;
  if (intent.colors.length >= 2) mutations.secondaryColor = intent.colors[1]!;
  if (intent.colors.length >= 3) mutations.accentColor = intent.colors[2]!;

  const dna = createVariant(base, mutations);

  // Override material
  if (intent.material) dna.material = intent.material;

  return dna;
}
