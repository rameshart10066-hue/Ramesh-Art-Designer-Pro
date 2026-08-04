/**
 * Photo Rebuilder
 *
 * Reconstructs the detected design using parametric components.
 * Uses Design DNA to generate a complete editable CAD project.
 */

import type { DetectedComponent } from "./ComponentDetector";
import type { LibraryMatch } from "./LibraryMatcher";
import type { DesignDNA } from "@/product-model/DNAEngine";
import { selectComponents } from "@/ai-designer/ComponentSelector";
import { planLayout } from "@/ai-designer/LayoutPlanner";
import { applySymmetry } from "@/ai-designer/SymmetryEngine";
import type { SelectedComponent } from "@/ai-designer/ComponentSelector";

export interface RebuildResult {
  components: SelectedComponent[];
  dna: DesignDNA;
  canvasWidth: number;
  canvasHeight: number;
  warnings: string[];
}

export function rebuildDesign(
  dna: DesignDNA,
  matches: LibraryMatch[],
  imageWidth: number,
  imageHeight: number,
): RebuildResult {
  const warnings: string[] = [];

  // Select components from DNA
  let components = selectComponents(dna);

  // Apply symmetry
  components = applySymmetry(components, dna);

  // Plan layout
  const layout = planLayout(components);

  // Warn about low-confidence matches
  for (const match of matches) {
    if (!match.autoAccept) {
      warnings.push(`Low confidence for "${match.detectedType}": ${Math.round(match.confidence * 100)}% — consider reviewing`);
    }
  }

  return {
    components: layout.components,
    dna,
    canvasWidth: layout.canvasWidth,
    canvasHeight: layout.canvasHeight,
    warnings,
  };
}
