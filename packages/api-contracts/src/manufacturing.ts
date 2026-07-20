/**
 * Manufacturing domain contracts, shared between the manufacturing API
 * routes (apps/web/src/app/api/manufacturing) and the client
 * service/UI (src/services/manufacturingService, src/modules/manufacturing).
 */

export interface MaterialProfile {
  id: string;
  name: string;
  thicknessMm: number;
  kerfMm: number;
  cutSpeedMmPerMin: number;
  cutPowerPercent: number;
  engraveSpeedMmPerMin: number;
  engravePowerPercent: number;
}

export interface CutPathInput {
  points: Array<{ x: number; y: number }>;
  closed?: boolean;
}

export interface EngraveTextInput {
  x: number;
  y: number;
  text: string;
  fontSizeMm?: number;
}

export interface GenerateSvgRequest {
  type: "svg";
  widthMm: number;
  heightMm: number;
  cutPaths: CutPathInput[];
  engraveTexts?: EngraveTextInput[];
  materialProfileId: string;
}

export interface GenerateDxfRequest {
  type: "dxf";
  cutPaths: CutPathInput[];
  texts?: EngraveTextInput[];
}

export type ManufacturingGenerateRequest = GenerateSvgRequest | GenerateDxfRequest;

export interface ManufacturingGenerateSuccessResponse {
  success: true;
  format: "svg" | "dxf";
  output: string;
}

export interface ManufacturingGenerateErrorResponse {
  success: false;
  error: string;
}

export type ManufacturingGenerateResponse =
  | ManufacturingGenerateSuccessResponse
  | ManufacturingGenerateErrorResponse;

export interface NestingRequest {
  parts: Array<{ id: string; widthMm: number; heightMm: number }>;
  sheetWidthMm: number;
  sheetHeightMm: number;
  materialProfileId: string;
  extraSpacingMm?: number;
}

export interface NestingSuccessResponse {
  success: true;
  placements: Array<{
    id: string;
    sheetIndex: number;
    x: number;
    y: number;
    widthMm: number;
    heightMm: number;
  }>;
  sheetsUsed: number;
  appliedSpacingMm: number;
}

export interface NestingErrorResponse {
  success: false;
  error: string;
}

export type NestingResponse = NestingSuccessResponse | NestingErrorResponse;

export interface PartNumberRequest {
  categoryCode: string;
}

export interface PartNumberResponse {
  partNumber: string;
}
