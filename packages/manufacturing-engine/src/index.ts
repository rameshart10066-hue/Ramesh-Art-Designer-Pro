/**
 * @ramesh/manufacturing-engine
 *
 * Translates design-engine output into machine-ready artifacts:
 * - Manufacturing SVG (cut/engrave layer separation via LightBurn's
 *   stroke-color convention)
 * - DXF export (R12, for CAM/laser software that doesn't take SVG)
 * - Kerf-aware nesting (nestForManufacturing, built on
 *   @ramesh/design-engine's nestRectangles — no separate packing
 *   implementation here; see nesting/nestForManufacturing.ts)
 * - Part numbering (category-coded, sequential)
 * - Material/machine profiles (cut/engrave speed & power, kerf)
 */

export {
  MATERIAL_PROFILES,
  getMaterialProfile,
  requireMaterialProfile,
  type MaterialProfile,
} from "./material-profiles/materialProfiles";

export {
  generateManufacturingSvg,
  type ManufacturingSvgInput,
  type EngraveText,
} from "./svg-generator/generateManufacturingSvg";

export { generateDxf, type DxfInput, type DxfTextEntity } from "./dxf-generator/generateDxf";

export {
  nestForManufacturing,
  type ManufacturingNestingInput,
  type ManufacturingNestingResult,
} from "./nesting/nestForManufacturing";
export { nestRectangles, type NestingShape, type NestingSheet } from "@ramesh/design-engine";

export { generatePartNumber, type PartNumberInput } from "./part-numbering/generatePartNumber";
export { PartNumberSequencer } from "./part-numbering/PartNumberSequencer";

export type { CutPath, Point } from "./shared/geometry";

export const MANUFACTURING_ENGINE_VERSION = "0.1.0";
