import { packRectangles, type PackingShape, type PackingResult } from "./packRectangles";
import { requireMaterialProfile } from "../material-profiles/materialProfiles";

export interface ManufacturingNestingInput {
  parts: PackingShape[];
  sheetWidthMm: number;
  sheetHeightMm: number;
  materialProfileId: string;
  /** Extra spacing on top of the kerf-derived minimum, in mm. Defaults to 0. */
  extraSpacingMm?: number;
}

export interface ManufacturingNestingResult extends PackingResult {
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
 */
export function nestForManufacturing(input: ManufacturingNestingInput): ManufacturingNestingResult {
  const material = requireMaterialProfile(input.materialProfileId);
  const appliedSpacingMm = material.kerfMm * 2 + (input.extraSpacingMm ?? 0);

  const result = packRectangles(
    input.parts,
    { widthMm: input.sheetWidthMm, heightMm: input.sheetHeightMm },
    appliedSpacingMm,
  );

  return { ...result, materialProfileId: input.materialProfileId, appliedSpacingMm };
}
