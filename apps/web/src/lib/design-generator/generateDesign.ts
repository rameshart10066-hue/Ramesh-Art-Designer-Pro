import {
  generateNameplateSvg,
  generateFingerJointBoxSvg,
  generateNestingSvg,
} from "@ramesh/design-engine";
import type { DesignGeneratorRequest, DesignGeneratorResponse } from "@ramesh/api-contracts";

/**
 * Thin dispatcher: maps a DesignGeneratorRequest's `type` to the matching
 * @ramesh/design-engine function and normalizes any thrown validation
 * error into a DesignGeneratorErrorResponse. Keeps the route handler free
 * of generator-specific logic.
 */
export function generateDesign(request: DesignGeneratorRequest): DesignGeneratorResponse {
  try {
    switch (request.type) {
      case "nameplate":
        return { success: true, svg: generateNameplateSvg(request) };

      case "finger-joint-box":
        return { success: true, svg: generateFingerJointBoxSvg(request) };

      case "nesting":
        return {
          success: true,
          svg: generateNestingSvg({
            shapes: request.shapes,
            sheet: { widthMm: request.sheetWidthMm, heightMm: request.sheetHeightMm },
            ...(request.spacingMm !== undefined ? { spacingMm: request.spacingMm } : {}),
          }),
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Design generation failed.",
    };
  }
}
