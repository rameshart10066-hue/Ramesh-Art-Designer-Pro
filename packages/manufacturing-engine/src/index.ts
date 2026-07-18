/**
 * @ramesh/manufacturing-engine
 *
 * Translates design-engine output into machine-ready artifacts:
 * - Manufacturing SVG (cut/engrave layer separation via LightBurn's
 *   stroke-color convention)
 * - DXF export (R12, for CAM/laser software that doesn't take SVG)
 * - Kerf-aware nesting (packRectangles + nestForManufacturing). Note:
 *   feature/design-engine (a separate, unmerged branch) implements the
 *   same shelf-packing algorithm for design-preview nesting. This
 *   package predates that branch and can't depend on its unmerged
 *   package, so the algorithm is intentionally duplicated here pending
 *   consolidation at merge time (see nesting/packRectangles.ts).
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
export { packRectangles, type PackingShape, type PackingSheet } from "./nesting/packRectangles";

export { generatePartNumber, type PartNumberInput } from "./part-numbering/generatePartNumber";
export { PartNumberSequencer } from "./part-numbering/PartNumberSequencer";

export type { CutPath, Point } from "./shared/geometry";

export const MANUFACTURING_ENGINE_VERSION = "0.1.0";
