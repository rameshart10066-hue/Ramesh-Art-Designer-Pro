/**
 * Design Composer
 *
 * Orchestrates the full design generation pipeline:
 * parse → detect → generate DNA → select components → plan layout → apply symmetry → validate
 */

import type { ParsedIntent } from "./PromptParser";
import type { DesignDNA } from "@/product-model/DNAEngine";
import { parsePrompt } from "./PromptParser";
import { detectIntent } from "./IntentDetector";
import { generateDNA } from "./DNAGenerator";
import { selectComponents } from "./ComponentSelector";
import { planLayout, findOverlaps } from "./LayoutPlanner";
import { applySymmetry } from "./SymmetryEngine";
import { validateDesign } from "./ConstraintValidator";
import type { ValidationResult } from "./ConstraintValidator";
import type { SelectedComponent } from "./ComponentSelector";
import type { LayoutPlan } from "./LayoutPlanner";

export interface DesignResult {
  dna: DesignDNA;
  components: SelectedComponent[];
  layout: LayoutPlan;
  validation: ValidationResult;
  prompt: string;
  elapsed: number;
}

const cache = new Map<string, DesignResult>();

export function composeDesign(prompt: string, existingDNA?: DesignDNA): DesignResult {
  const cacheKey = `${prompt}-${existingDNA?.style || "none"}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const start = performance.now();

  // 1. Parse
  const parsed = parsePrompt(prompt);
  const intent = detectIntent(prompt);

  // 2. Generate DNA
  const dna = generateDNA(parsed, existingDNA);

  // 3. Select components
  let components = selectComponents(dna);

  // 4. Plan layout
  components = planLayout(components).components;

  // 5. Apply symmetry
  components = applySymmetry(components, dna);

  // 6. Plan layout again after symmetry
  const layout = planLayout(components);

  // 7. Validate
  const validation = validateDesign(layout.components, dna);

  const elapsed = Math.round(performance.now() - start);

  const result: DesignResult = { dna, components: layout.components, layout, validation, prompt, elapsed };
  cache.set(cacheKey, result);
  return result;
}

export function clearCache() { cache.clear(); }
