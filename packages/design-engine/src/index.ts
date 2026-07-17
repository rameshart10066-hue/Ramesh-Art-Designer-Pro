/**
 * @ramesh/design-engine
 *
 * Owns all parametric design generation logic: nameplates, finger-joint
 * boxes, shape nesting, and SVG output. This is where the Acrylic Design
 * Studio logic will be migrated to, decoupled from any UI framework so it
 * can be reused by the web app, future CLI tools, or batch jobs.
 *
 * No feature code yet — this is scaffold-only. Real modules (e.g.
 * `nameplate/`, `finger-joint-box/`, `nesting/`) will be added as
 * sibling files/folders here, each exported through this index.
 */

export const DESIGN_ENGINE_VERSION = "0.1.0";
