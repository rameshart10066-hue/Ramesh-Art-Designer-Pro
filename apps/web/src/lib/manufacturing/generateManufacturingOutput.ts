import { generateManufacturingSvg, generateDxf } from "@ramesh/manufacturing-engine";
import type {
  ManufacturingGenerateRequest,
  ManufacturingGenerateResponse,
} from "@ramesh/api-contracts";

/**
 * Thin dispatcher: maps a ManufacturingGenerateRequest's `type` to the
 * matching @ramesh/manufacturing-engine function and normalizes any
 * thrown validation error into a ManufacturingGenerateErrorResponse.
 */
export function generateManufacturingOutput(
  request: ManufacturingGenerateRequest,
): ManufacturingGenerateResponse {
  try {
    if (request.type === "svg") {
      const svg = generateManufacturingSvg({
        widthMm: request.widthMm,
        heightMm: request.heightMm,
        cutPaths: request.cutPaths,
        materialProfileId: request.materialProfileId,
        ...(request.engraveTexts ? { engraveTexts: request.engraveTexts } : {}),
      });
      return { success: true, format: "svg", output: svg };
    }

    const dxf = generateDxf({
      cutPaths: request.cutPaths,
      ...(request.texts ? { texts: request.texts } : {}),
    });
    return { success: true, format: "dxf", output: dxf };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Manufacturing output generation failed.",
    };
  }
}
