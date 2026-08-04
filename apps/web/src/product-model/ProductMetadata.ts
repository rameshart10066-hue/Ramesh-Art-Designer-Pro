/**
 * Product Metadata
 *
 * Rich metadata for every component: category, theme, complexity,
 * manufacturing difficulty, AI metadata, and inventory tracking.
 */

import type { ProductMeta } from "./ProductModel";

export function createDefaultMetadata(overrides?: Partial<ProductMeta>): ProductMeta {
  return {
    category: "ganpati",
    theme: "traditional",
    complexity: 2,
    manufacturingDifficulty: 2,
    assemblyDifficulty: 2,
    inventoryId: "",
    aiMetadata: {},
    ...overrides,
  };
}

export const COMPLEXITY_LABELS: Record<number, string> = {
  1: "Very Simple",
  2: "Simple",
  3: "Moderate",
  4: "Complex",
  5: "Very Complex",
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate",
  3: "Advanced",
  4: "Expert",
  5: "Master",
};

export const THEMES = [
  "traditional",
  "royal",
  "modern",
  "minimal",
  "temple",
  "south-indian",
  "north-indian",
  "fusion",
];
