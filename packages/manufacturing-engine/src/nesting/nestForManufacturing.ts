import { nestRectangles, type NestingShape, type NestingResult } from "@ramesh/design-engine";
import { requireMaterialProfile } from "../material-profiles/materialProfiles";

export interface ManufacturingNestingInput {
  parts: NestingShape[];
  sheetWidthMm: number;
  sheetHeightMm: number;
  materialProfileId: string;
  /** Extra spacing on top of the kerf-derived minimum, in mm. Defaults to 0. */
  extraSpacingMm?: number;
}

export interface ManufacturingNestingResult extends NestingResult {
  materialProfileId: string;
  /** The spacing actually used (kerf-derived minimum + extraSpacingMm). */
  appliedSpacingMm: number;
}

/**
 * Nests parts for actual production: derives the minimum spacing between
 * parts from the material's kerf so adjacent parts don't collide once the
 * beam actually removes material. Spacing = 2x kerf (each part loses
 * kerf/2 on every edge) + any extra spacing the caller wants for
 * handling/breakout.
 *
 * Consolidated (post-merge) to reuse @ramesh/design-engine's
 * nestRectangles rather than maintaining a separate copy of the same
 * shelf-packing algorithm — see packages/design-engine's nesting module
 * for the packing implementation itself. Before this merge, this package
 * carried its own duplicate (packRectangles.ts) because feature/manufacturing
 * was built before feature/design-engine's nesting code existed and
 * couldn't depend on an unmerged package; that duplication is now removed.
 */
export function nestForManufacturing(input: ManufacturingNestingInput): ManufacturingNestingResult {
  const material = requireMaterialProfile(input.materialProfileId);
  const appliedSpacingMm = material.kerfMm * 2 + (input.extraSpacingMm ?? 0);

  const result = nestRectangles(
    input.parts,
    { widthMm: input.sheetWidthMm, heightMm: input.sheetHeightMm },
    appliedSpacingMm,
  );

  return { ...result, materialProfileId: input.materialProfileId, appliedSpacingMm };
}
