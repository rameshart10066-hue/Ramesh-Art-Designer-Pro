/**
 * Symmetry Engine
 *
 * Ensures mirror symmetry across the vertical center axis.
 * Duplicates components and mirrors their positions.
 */

import type { SelectedComponent } from "./ComponentSelector";
import type { DesignDNA } from "@/product-model/DNAEngine";

export function applySymmetry(
  components: SelectedComponent[],
  dna: DesignDNA,
): SelectedComponent[] {
  if (dna.symmetry === "asymmetric") return components;

  const centerX = 600;
  const result: SelectedComponent[] = [];

  for (const comp of components) {
    result.push(comp);

    // Only mirror components that are off-center
    if (Math.abs(comp.x + comp.width / 2 - centerX) > 10) {
      const mirroredX = centerX + (centerX - (comp.x + comp.width));
      result.push({
        ...comp,
        name: `${comp.name} (Mirror)`,
        x: mirroredX,
        params: { ...comp.params, flipX: true },
      });
    }
  }

  return result;
}
