/**
 * Design generator contracts, shared between the generate API route
 * (apps/web/src/app/api/design-generator/generate) and the client
 * service/UI (src/services/designGeneratorService, src/modules/design-generator).
 *
 * Scope: SVG generation only (nameplate, finger-joint box, nesting).
 * No DXF, no manufacturing/machine-profile fields — those belong to a
 * separate manufacturing module.
 */

export interface NameplateGeneratorRequest {
  type: "nameplate";
  text: string;
  widthMm: number;
  heightMm: number;
  cornerRadiusMm?: number;
  fontSizeMm?: number;
}

export interface FingerJointBoxGeneratorRequest {
  type: "finger-joint-box";
  widthMm: number;
  depthMm: number;
  heightMm: number;
  materialThicknessMm: number;
  targetFingerWidthMm?: number;
}

export interface NestingGeneratorRequest {
  type: "nesting";
  shapes: Array<{ id: string; widthMm: number; heightMm: number }>;
  sheetWidthMm: number;
  sheetHeightMm: number;
  spacingMm?: number;
}

export type DesignGeneratorRequest =
  | NameplateGeneratorRequest
  | FingerJointBoxGeneratorRequest
  | NestingGeneratorRequest;

export interface DesignGeneratorSuccessResponse {
  success: true;
  svg: string;
}

export interface DesignGeneratorErrorResponse {
  success: false;
  error: string;
}

export type DesignGeneratorResponse = DesignGeneratorSuccessResponse | DesignGeneratorErrorResponse;
