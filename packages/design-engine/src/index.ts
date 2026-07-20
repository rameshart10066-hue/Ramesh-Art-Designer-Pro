/**
 * @ramesh/design-engine
 *
 * Owns all parametric design generation logic: nameplates, finger-joint
 * boxes, and shape nesting — all producing plain SVG cut/engrave paths.
 * Deliberately out of scope: DXF export and any manufacturing concerns
 * (kerf compensation, machine profiles, LightBurn-specific metadata).
 * Those belong to manufacturing-engine.
 */

export { generateNameplateSvg, type NameplateParams } from "./nameplate/generateNameplateSvg";

export {
  generateFingerJointBoxSvg,
  type FingerJointBoxParams,
} from "./finger-joint-box/generateFingerJointBoxSvg";
export { computeFingerLayout, type FingerLayout } from "./finger-joint-box/computeFingerLayout";

export {
  generateNestingSvg,
  type NestingParams,
} from "./nesting/generateNestingSvg";
export {
  nestRectangles,
  type NestingShape,
  type NestingSheet,
  type Placement,
  type NestingResult,
} from "./nesting/nestRectangles";

export const DESIGN_ENGINE_VERSION = "0.1.0";
