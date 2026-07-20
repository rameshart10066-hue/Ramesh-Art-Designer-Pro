import { nestForManufacturing } from "@ramesh/manufacturing-engine";
import type { NestingRequest, NestingResponse } from "@ramesh/api-contracts";

export function runNesting(request: NestingRequest): NestingResponse {
  try {
    const result = nestForManufacturing({
      parts: request.parts,
      sheetWidthMm: request.sheetWidthMm,
      sheetHeightMm: request.sheetHeightMm,
      materialProfileId: request.materialProfileId,
      ...(request.extraSpacingMm !== undefined ? { extraSpacingMm: request.extraSpacingMm } : {}),
    });
    return {
      success: true,
      placements: result.placements,
      sheetsUsed: result.sheetsUsed,
      appliedSpacingMm: result.appliedSpacingMm,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nesting failed.",
    };
  }
}
