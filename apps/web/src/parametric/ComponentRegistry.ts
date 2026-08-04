/**
 * Component Registry
 *
 * Auto-registering registry of all parametric component definitions.
 * Supports search by name, tags, and category. Every component
 * found in GeometryGenerator.ts must be defined here.
 */

import type { ComponentDefinition } from "./ComponentDefinition";
import { createComponentDefinition } from "./ComponentDefinition";

class Registry {
  private components = new Map<string, ComponentDefinition>();

  register(def: ComponentDefinition): void {
    this.components.set(def.type, createComponentDefinition(def));
  }

  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  getByCategory(category: string): ComponentDefinition[] {
    return this.getAll().filter((c) => c.category === category);
  }

  search(query: string): ComponentDefinition[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.tags.some((t) => t.includes(q)) ||
        c.type.includes(q),
    );
  }

  getCategories(): string[] {
    return [...new Set(this.getAll().map((c) => c.category))].sort();
  }

  getCount(): number {
    return this.components.size;
  }
}

export const componentRegistry = new Registry();

// ── Auto-register all components ─────────────────────────────────

const commonParams = [
  { key: "x", label: "X", type: "number" as const, default: 100, category: "Position", affectsChildren: true },
  { key: "y", label: "Y", type: "number" as const, default: 100, category: "Position", affectsChildren: true },
  { key: "width", label: "Width", type: "number" as const, default: 150, min: 10, max: 5000, category: "Dimensions", affectsChildren: true },
  { key: "height", label: "Height", type: "number" as const, default: 100, min: 10, max: 5000, category: "Dimensions", affectsChildren: true },
  { key: "rotation", label: "Rotation", type: "number" as const, default: 0, min: -360, max: 360, unit: "°", category: "Transform" },
  { key: "scale", label: "Scale", type: "number" as const, default: 1, min: 0.01, max: 10, step: 0.01, category: "Transform" },
  { key: "fill", label: "Fill Color", type: "color" as const, default: "#3b82f6", category: "Appearance" },
  { key: "stroke", label: "Stroke Color", type: "color" as const, default: "#1e40af", category: "Appearance" },
  { key: "strokeWidth", label: "Stroke Width", type: "number" as const, default: 2, min: 0, max: 50, category: "Appearance" },
  { key: "opacity", label: "Opacity", type: "number" as const, default: 1, min: 0, max: 1, step: 0.05, category: "Appearance" },
  { key: "material", label: "Material", type: "select" as const, default: "Thermocol", options: ["Thermocol", "Acrylic", "MDF", "Plywood", "Cardboard"], category: "Manufacturing" },
  { key: "thickness", label: "Thickness", type: "number" as const, default: 12, min: 1, max: 50, unit: "mm", category: "Manufacturing" },
];

function defs(base: Partial<ComponentDefinition>): ComponentDefinition {
  return {
    defaultGeometry: { width: 150, height: 100, fill: "#3b82f6", stroke: "#1e40af" },
    tags: [],
    ...base,
    params: [...commonParams, ...(base.params || [])],
  } as ComponentDefinition;
}

// Basic shapes
componentRegistry.register(defs({ type: "rectangle", label: "Rectangle", category: "basic", icon: "▭", description: "Basic rectangle", tags: ["shape", "basic"], defaultGeometry: { width: 150, height: 100, fill: "#3b82f6", stroke: "#1e40af" } }));
componentRegistry.register(defs({ type: "circle", label: "Circle", category: "basic", icon: "○", description: "Perfect circle", tags: ["shape", "basic"], defaultGeometry: { width: 100, height: 100, fill: "#3b82f6", stroke: "#1e40af" } }));
componentRegistry.register(defs({ type: "ellipse", label: "Ellipse", category: "basic", icon: "⬮", description: "Elliptical shape", tags: ["shape", "basic"], defaultGeometry: { width: 150, height: 100, fill: "#3b82f6", stroke: "#1e40af" } }));
componentRegistry.register(defs({ type: "star", label: "Star", category: "basic", icon: "⭐", description: "Multi-point star", tags: ["shape", "star"], defaultGeometry: { width: 120, height: 120, fill: "#f1c40f", stroke: "#f39c12" }, params: [{ key: "points", label: "Points", type: "integer", default: 5, min: 3, max: 24, category: "Shape" }, { key: "innerRadius", label: "Inner Ratio", type: "number", default: 0.5, min: 0.1, max: 0.9, step: 0.05, category: "Shape" }] }));
componentRegistry.register(defs({ type: "line", label: "Line", category: "basic", icon: "╱", description: "Straight line", tags: ["shape", "line"], defaultGeometry: { width: 150, height: 2, fill: "transparent", stroke: "#000000" } }));

// Ganpati components
componentRegistry.register(defs({ type: "mandap", label: "Mandap", category: "ganpati", icon: "🏛", description: "Traditional temple mandap", tags: ["mandap", "temple", "ganpati"], canHaveChildren: true, childAffectingParams: ["pillars", "archType", "domeHeight"], defaultGeometry: { width: 600, height: 500, fill: "#c4956a", stroke: "#8b7355" }, params: [{ key: "pillars", label: "Pillar Count", type: "integer", default: 2, min: 2, max: 6, category: "Structure" }, { key: "pillarWidth", label: "Pillar Width", type: "number", default: 0.1, min: 0.05, max: 0.2, step: 0.01, category: "Structure" }, { key: "archType", label: "Arch Type", type: "select", default: "pointed", options: ["pointed", "rounded", "multilayer"], category: "Arch" }, { key: "domeHeight", label: "Arch Height", type: "number", default: 0.4, min: 0.2, max: 0.7, step: 0.05, category: "Arch" }, { key: "baseHeight", label: "Base Height", type: "number", default: 0.15, min: 0.05, max: 0.3, step: 0.01, category: "Base" }, { key: "roofStyle", label: "Roof Style", type: "select", default: "pointed", options: ["pointed", "rounded", "stepped", "flat"], category: "Roof" }, { key: "ornamentDensity", label: "Ornament", type: "number", default: 0.5, min: 0, max: 1, step: 0.1, category: "Decoration" }, { key: "hasFinial", label: "Finial", type: "boolean", default: true, category: "Decoration" }] }));
componentRegistry.register(defs({ type: "lotus", label: "Lotus", category: "ganpati", icon: "🪷", description: "Multi-petal lotus flower", tags: ["lotus", "flower", "ganpati"], defaultGeometry: { width: 200, height: 200, fill: "#f5c6ec", stroke: "#e091c8" }, params: [{ key: "petals", label: "Petal Count", type: "integer", default: 8, min: 4, max: 24, category: "Petal" }, { key: "layers", label: "Layers", type: "integer", default: 2, min: 1, max: 5, category: "Petal" }, { key: "innerRadiusRatio", label: "Inner Radius", type: "number", default: 0.6, min: 0.2, max: 0.9, step: 0.05, category: "Petal" }, { key: "petalShape", label: "Petal Shape", type: "number", default: 0.5, min: 0, max: 1, step: 0.05, category: "Petal" }] }));
componentRegistry.register(defs({ type: "peacock", label: "Peacock", category: "ganpati", icon: "🦚", description: "Decorative peacock", tags: ["peacock", "bird", "ganpati"], defaultGeometry: { width: 300, height: 350, fill: "#1a5276", stroke: "#154360" }, params: [{ key: "featherCount", label: "Feathers", type: "integer", default: 12, min: 6, max: 30, category: "Tail" }, { key: "tailAngle", label: "Tail Spread", type: "number", default: 120, min: 60, max: 180, step: 5, unit: "°", category: "Tail" }, { key: "bodySize", label: "Body Size", type: "number", default: 0.4, min: 0.2, max: 0.7, step: 0.05, category: "Body" }, { key: "eyeSize", label: "Eye Size", type: "number", default: 0.3, min: 0.1, max: 0.6, step: 0.05, category: "Tail" }] }));
componentRegistry.register(defs({ type: "kalash", label: "Kalash", category: "ganpati", icon: "🏺", description: "Sacred pot", tags: ["kalash", "pot", "ganpati"], defaultGeometry: { width: 150, height: 200, fill: "#d4a017", stroke: "#8b6914" }, params: [{ key: "neckHeight", label: "Neck Height", type: "number", default: 0.25, min: 0.1, max: 0.4, step: 0.05, category: "Shape" }, { key: "neckWidth", label: "Neck Width", type: "number", default: 0.35, min: 0.2, max: 0.6, step: 0.05, category: "Shape" }, { key: "baseWidth", label: "Base Width", type: "number", default: 0.8, min: 0.5, max: 1.0, step: 0.05, category: "Shape" }, { key: "hasMangoLeaves", label: "Mango Leaves", type: "boolean", default: true, category: "Decoration" }, { key: "leafCount", label: "Leaf Count", type: "integer", default: 3, min: 1, max: 7, category: "Decoration" }] }));
componentRegistry.register(defs({ type: "bell", label: "Bell", category: "ganpati", icon: "🔔", description: "Temple bell", tags: ["bell", "temple", "ganpati"], defaultGeometry: { width: 100, height: 150, fill: "#d4a017", stroke: "#8b6914" }, params: [{ key: "bellWidth", label: "Width Ratio", type: "number", default: 0.7, min: 0.4, max: 1.0, step: 0.05, category: "Shape" }, { key: "clapperSize", label: "Clapper", type: "number", default: 0.15, min: 0.05, max: 0.3, step: 0.05, category: "Shape" }, { key: "hasRing", label: "Top Ring", type: "boolean", default: true, category: "Decoration" }] }));
componentRegistry.register(defs({ type: "prabhavali", label: "Prabhavali", category: "ganpati", icon: "☀️", description: "Backlit aureole", tags: ["prabhavali", "halo", "ganpati"], defaultGeometry: { width: 350, height: 400, fill: "#f39c12", stroke: "#e67e22" }, params: [{ key: "rayCount", label: "Rays", type: "integer", default: 24, min: 8, max: 48, category: "Rays" }, { key: "rayLength", label: "Ray Length", type: "number", default: 0.3, min: 0.1, max: 0.6, step: 0.05, category: "Rays" }, { key: "innerRadius", label: "Inner Radius", type: "number", default: 0.4, min: 0.2, max: 0.8, step: 0.05, category: "Shape" }] }));
componentRegistry.register(defs({ type: "swastik", label: "Swastik", category: "ganpati", icon: "🕉", description: "Sacred swastik symbol", tags: ["swastik", "sacred", "ganpati"], defaultGeometry: { width: 120, height: 120, fill: "#d4a017", stroke: "#8b6914" }, params: [{ key: "armWidth", label: "Arm Width", type: "number", default: 0.2, min: 0.1, max: 0.4, step: 0.05, category: "Shape" }, { key: "armLength", label: "Arm Length", type: "number", default: 0.6, min: 0.3, max: 0.8, step: 0.05, category: "Shape" }] }));
componentRegistry.register(defs({ type: "pillar", label: "Pillar", category: "ganpati", icon: "🗿", description: "Decorative pillar", tags: ["pillar", "column", "ganpati"], defaultGeometry: { width: 80, height: 400, fill: "#c4956a", stroke: "#8b7355" }, params: [{ key: "sections", label: "Sections", type: "integer", default: 3, min: 1, max: 8, category: "Structure" }, { key: "hasBase", label: "Has Base", type: "boolean", default: true, category: "Structure" }, { key: "hasCapital", label: "Has Capital", type: "boolean", default: true, category: "Structure" }, { key: "fluted", label: "Fluted", type: "boolean", default: false, category: "Style" }] }));
componentRegistry.register(defs({ type: "arch", label: "Arch", category: "ganpati", icon: "🌉", description: "Decorative arch", tags: ["arch", "ganpati"], defaultGeometry: { width: 400, height: 300, fill: "#c4956a", stroke: "#8b7355" }, params: [{ key: "archType", label: "Type", type: "select", default: "rounded", options: ["rounded", "pointed", "multilayer"], category: "Shape" }, { key: "depth", label: "Depth", type: "number", default: 0.3, min: 0.1, max: 0.6, step: 0.05, category: "Shape" }, { key: "layers", label: "Layers", type: "integer", default: 1, min: 1, max: 5, category: "Shape" }] }));
componentRegistry.register(defs({ type: "dome", label: "Dome", category: "ganpati", icon: "🕌", description: "Dome structure", tags: ["dome", "structure", "ganpati"], defaultGeometry: { width: 300, height: 250, fill: "#d4a017", stroke: "#8b6914" }, params: [{ key: "domeType", label: "Type", type: "select", default: "rounded", options: ["rounded", "pointed", "onion"], category: "Shape" }, { key: "layers", label: "Layers", type: "integer", default: 1, min: 1, max: 5, category: "Shape" }, { key: "finialSize", label: "Finial", type: "number", default: 8, min: 4, max: 20, step: 1, category: "Decoration" }] }));
componentRegistry.register(defs({ type: "base-platform", label: "Stage Platform", category: "ganpati", icon: "🎭", description: "Multi-tier platform", tags: ["stage", "platform", "base"], defaultGeometry: { width: 500, height: 150, fill: "#8b7355", stroke: "#6b5740" }, params: [{ key: "tiers", label: "Tiers", type: "integer", default: 3, min: 1, max: 7, category: "Structure" }, { key: "tierHeight", label: "Tier Height", type: "number", default: 0.3, min: 0.1, max: 0.5, step: 0.05, category: "Structure" }] }));
componentRegistry.register(defs({ type: "om-symbol", label: "Om Symbol", category: "ganpati", icon: "🕉️", description: "Sacred Om symbol", tags: ["om", "symbol", "sacred"], defaultGeometry: { width: 150, height: 150, fill: "transparent", stroke: "#d4a017" } }));
