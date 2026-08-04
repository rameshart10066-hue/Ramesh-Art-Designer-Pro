/**
 * Constraint Validator
 *
 * Validates the generated design against manufacturing and assembly constraints.
 * Checks: overlap, minimum size, spacing, and manufacturing feasibility.
 */

import type { SelectedComponent } from "./ComponentSelector";
import type { DesignDNA } from "@/product-model/DNAEngine";
import { findOverlaps } from "./LayoutPlanner";

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

export function validateDesign(
  components: SelectedComponent[],
  dna: DesignDNA,
): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check for overlaps
  const overlaps = findOverlaps(components);
  if (overlaps.length > 0) {
    warnings.push(`${overlaps.length} overlapping component pair(s) detected`);
  }

  // Check minimum sizes
  for (const comp of components) {
    if (comp.width < 20 || comp.height < 20) {
      issues.push(`"${comp.name}" is too small (${comp.width}×${comp.height})`);
    }
    if (comp.width > 2000 || comp.height > 2000) {
      warnings.push(`"${comp.name}" may exceed sheet size`);
    }
  }

  // Check spacing
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i]!;
      const b = components[j]!;
      const gapX = Math.abs((a.x + a.width / 2) - (b.x + b.width / 2)) - (a.width + b.width) / 2;
      const gapY = Math.abs((a.y + a.height / 2) - (b.y + b.height / 2)) - (a.height + b.height) / 2;
      const minGap = Math.max(gapX, gapY);
      if (minGap > 0 && minGap < 5) {
        warnings.push(`Very small gap between "${a.name}" and "${b.name}"`);
      }
    }
  }

  // Check symmetry
  if (dna.symmetry === "mirror") {
    const centerX = 600;
    for (const comp of components) {
      const distFromCenter = Math.abs(comp.x + comp.width / 2 - centerX);
      if (distFromCenter > 10 && components.filter((c) => Math.abs(c.x + c.width / 2 - centerX) > 10).length % 2 !== 0) {
        warnings.push(`"${comp.name}" may lack mirror pair`);
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}
