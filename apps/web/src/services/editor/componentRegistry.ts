/**
 * Component Registry
 *
 * Central registry of all parametric Ganpati CAD components.
 * Each component defines its editable parameters, defaults, tags, and metadata.
 */

import type { ComponentDef } from "@/types/components";

export const COMPONENT_REGISTRY: ComponentDef[] = [
  // ── FRAMES ──────────────────────────────────────────────────────
  {
    type: "rectangle", category: "basic", label: "Simple Frame", icon: "▭",
    description: "Basic rectangular frame with adjustable border",
    tags: ["frame", "border", "rectangle", "basic"],
    defaultWidth: 400, defaultHeight: 300, defaultFill: "transparent", defaultStroke: "#d4a017",
    params: [
      { key: "borderWidth", label: "Border Width", type: "slider", default: 20, min: 5, max: 100, step: 1, category: "Dimensions", unit: "px" },
      { key: "cornerStyle", label: "Corner Style", type: "select", default: "rounded", options: ["rounded", "angled", "beveled", "flared"], category: "Style" },
      { key: "innerCutout", label: "Inner Cutout", type: "boolean", default: false, category: "Style" },
    ],
  },
  {
    type: "rectangle", category: "basic", label: "Lotus Frame", icon: "🪷",
    description: "Frame with lotus petal corners",
    tags: ["frame", "lotus", "decorative", "border"],
    defaultWidth: 500, defaultHeight: 400, defaultFill: "transparent", defaultStroke: "#c4956a",
    params: [
      { key: "borderWidth", label: "Border Width", type: "slider", default: 25, min: 10, max: 80, step: 1, category: "Dimensions", unit: "px" },
      { key: "petalCount", label: "Corner Petals", type: "integer", default: 5, min: 3, max: 12, category: "Lotus" },
      { key: "petalDepth", label: "Petal Depth", type: "slider", default: 0.5, min: 0.2, max: 1.0, step: 0.05, category: "Lotus" },
    ],
  },
  {
    type: "rectangle", category: "basic", label: "Temple Frame", icon: "🏛",
    description: "Frame with temple spire top corners",
    tags: ["frame", "temple", "mandap", "decorative"],
    defaultWidth: 500, defaultHeight: 500, defaultFill: "transparent", defaultStroke: "#8b7355",
    params: [
      { key: "borderWidth", label: "Border Width", type: "slider", default: 20, min: 10, max: 60, step: 1, category: "Dimensions", unit: "px" },
      { key: "spireHeight", label: "Spire Height", type: "slider", default: 60, min: 20, max: 150, step: 1, category: "Temple", unit: "px" },
      { key: "spireCount", label: "Spire Count", type: "integer", default: 3, min: 1, max: 7, category: "Temple" },
    ],
  },

  // ── MANDAPS ─────────────────────────────────────────────────────
  {
    type: "mandap", category: "ganpati", label: "Mandap (Standard)", icon: "🏛",
    description: "Traditional temple mandap with pillars and arch",
    tags: ["mandap", "temple", "structure", "ganpati"],
    defaultWidth: 600, defaultHeight: 500, defaultFill: "#c4956a", defaultStroke: "#8b7355",
    params: [
      { key: "pillars", label: "Pillar Count", type: "integer", default: 2, min: 2, max: 6, category: "Structure" },
      { key: "pillarWidth", label: "Pillar Width", type: "slider", default: 0.1, min: 0.05, max: 0.2, step: 0.01, category: "Structure" },
      { key: "archType", label: "Arch Type", type: "select", default: "pointed", options: ["pointed", "rounded", "multilayer"], category: "Arch" },
      { key: "domeHeight", label: "Arch Height", type: "slider", default: 0.4, min: 0.2, max: 0.7, step: 0.05, category: "Arch" },
      { key: "baseHeight", label: "Base Height", type: "slider", default: 0.15, min: 0.05, max: 0.3, step: 0.01, category: "Base" },
      { key: "roofStyle", label: "Roof Style", type: "select", default: "pointed", options: ["pointed", "rounded", "stepped", "flat"], category: "Roof" },
      { key: "ornamentDensity", label: "Ornament Density", type: "slider", default: 0.5, min: 0, max: 1, step: 0.1, category: "Decoration" },
      { key: "hasFinial", label: "Finial", type: "boolean", default: true, category: "Decoration" },
    ],
  },
  {
    type: "mandap", category: "ganpati", label: "Mandap (Royal)", icon: "👑",
    description: "Royal mandap with multi-layer arches and detailed ornamentation",
    tags: ["mandap", "temple", "royal", "premium", "ganpati"],
    defaultWidth: 800, defaultHeight: 650, defaultFill: "#d4a017", defaultStroke: "#8b6914",
    params: [
      { key: "pillars", label: "Pillar Count", type: "integer", default: 4, min: 2, max: 8, category: "Structure" },
      { key: "pillarWidth", label: "Pillar Width", type: "slider", default: 0.08, min: 0.05, max: 0.15, step: 0.01, category: "Structure" },
      { key: "archType", label: "Arch Type", type: "select", default: "multilayer", options: ["pointed", "rounded", "multilayer"], category: "Arch" },
      { key: "domeHeight", label: "Arch Height", type: "slider", default: 0.45, min: 0.2, max: 0.7, step: 0.05, category: "Arch" },
      { key: "baseHeight", label: "Base Height", type: "slider", default: 0.12, min: 0.05, max: 0.3, step: 0.01, category: "Base" },
      { key: "roofStyle", label: "Roof Style", type: "select", default: "stepped", options: ["pointed", "rounded", "stepped", "flat"], category: "Roof" },
      { key: "ornamentDensity", label: "Ornament Density", type: "slider", default: 0.8, min: 0, max: 1, step: 0.1, category: "Decoration" },
      { key: "hasFinial", label: "Finial", type: "boolean", default: true, category: "Decoration" },
      { key: "hasLotusBase", label: "Lotus Base", type: "boolean", default: true, category: "Base" },
    ],
  },

  // ── ARCHES ──────────────────────────────────────────────────────
  {
    type: "arch", category: "ganpati", label: "Arch (Rounded)", icon: "🌉",
    description: "Rounded decorative arch",
    tags: ["arch", "rounded", "decorative", "ganpati"],
    defaultWidth: 400, defaultHeight: 300, defaultFill: "#c4956a", defaultStroke: "#8b7355",
    params: [
      { key: "archType", label: "Type", type: "select", default: "rounded", options: ["rounded", "pointed", "multilayer"], category: "Shape" },
      { key: "depth", label: "Depth", type: "slider", default: 0.3, min: 0.1, max: 0.6, step: 0.05, category: "Shape" },
      { key: "layers", label: "Layers", type: "integer", default: 1, min: 1, max: 5, category: "Shape" },
      { key: "hasKeystone", label: "Keystone", type: "boolean", default: true, category: "Decoration" },
    ],
  },
  {
    type: "arch", category: "ganpati", label: "Arch (Multilayer)", icon: "🔱",
    description: "Multi-layer decorative arch with stepped rings",
    tags: ["arch", "multilayer", "decorative", "temple"],
    defaultWidth: 450, defaultHeight: 350, defaultFill: "transparent", defaultStroke: "#d4a017",
    params: [
      { key: "archType", label: "Type", type: "select", default: "multilayer", options: ["rounded", "pointed", "multilayer"], category: "Shape" },
      { key: "depth", label: "Depth", type: "slider", default: 0.4, min: 0.1, max: 0.6, step: 0.05, category: "Shape" },
      { key: "layers", label: "Layers", type: "integer", default: 3, min: 1, max: 7, category: "Shape" },
      { key: "hasKeystone", label: "Keystone", type: "boolean", default: true, category: "Decoration" },
    ],
  },

  // ── PILLARS ─────────────────────────────────────────────────────
  {
    type: "pillar", category: "ganpati", label: "Pillar (Classic)", icon: "🗿",
    description: "Classic decorative pillar with sections",
    tags: ["pillar", "column", "classic", "decorative"],
    defaultWidth: 80, defaultHeight: 400, defaultFill: "#c4956a", defaultStroke: "#8b7355",
    params: [
      { key: "sections", label: "Sections", type: "integer", default: 3, min: 1, max: 8, category: "Structure" },
      { key: "hasBase", label: "Has Base", type: "boolean", default: true, category: "Structure" },
      { key: "hasCapital", label: "Has Capital", type: "boolean", default: true, category: "Structure" },
      { key: "fluted", label: "Fluted", type: "boolean", default: false, category: "Style" },
    ],
  },
  {
    type: "pillar", category: "ganpati", label: "Pillar (Fluted)", icon: "🏛️",
    description: "Fluted decorative pillar with vertical grooves",
    tags: ["pillar", "column", "fluted", "decorative"],
    defaultWidth: 80, defaultHeight: 400, defaultFill: "#e8d5b7", defaultStroke: "#8b7355",
    params: [
      { key: "sections", label: "Sections", type: "integer", default: 1, min: 1, max: 5, category: "Structure" },
      { key: "hasBase", label: "Has Base", type: "boolean", default: true, category: "Structure" },
      { key: "hasCapital", label: "Has Capital", type: "boolean", default: true, category: "Structure" },
      { key: "fluted", label: "Fluted", type: "boolean", default: true, category: "Style" },
      { key: "fluteCount", label: "Flute Count", type: "integer", default: 8, min: 4, max: 16, category: "Style" },
    ],
  },

  // ── DOMES ───────────────────────────────────────────────────────
  {
    type: "dome", category: "ganpati", label: "Dome (Rounded)", icon: "🕌",
    description: "Rounded dome structure with finial",
    tags: ["dome", "rounded", "structure", "ganpati"],
    defaultWidth: 300, defaultHeight: 250, defaultFill: "#d4a017", defaultStroke: "#8b6914",
    params: [
      { key: "domeType", label: "Dome Type", type: "select", default: "rounded", options: ["rounded", "pointed", "onion"], category: "Shape" },
      { key: "layers", label: "Layers", type: "integer", default: 1, min: 1, max: 5, category: "Shape" },
      { key: "finialSize", label: "Finial Size", type: "slider", default: 8, min: 4, max: 20, step: 1, category: "Decoration", unit: "px" },
    ],
  },
  {
    type: "dome", category: "ganpati", label: "Dome (Onion)", icon: "🧅",
    description: "Onion-shaped dome with elegant curves",
    tags: ["dome", "onion", "structure", "temple"],
    defaultWidth: 280, defaultHeight: 300, defaultFill: "#e8d5b7", defaultStroke: "#c4956a",
    params: [
      { key: "domeType", label: "Dome Type", type: "select", default: "onion", options: ["rounded", "pointed", "onion"], category: "Shape" },
      { key: "layers", label: "Layers", type: "integer", default: 1, min: 1, max: 3, category: "Shape" },
      { key: "finialSize", label: "Finial Size", type: "slider", default: 10, min: 4, max: 20, step: 1, category: "Decoration", unit: "px" },
      { key: "widthRatio", label: "Width Ratio", type: "slider", default: 0.6, min: 0.3, max: 1.0, step: 0.05, category: "Shape" },
    ],
  },

  // ── LOTUS ───────────────────────────────────────────────────────
  {
    type: "lotus", category: "ganpati", label: "Lotus (8 Petal)", icon: "🪷",
    description: "Eight-petal lotus with two layers",
    tags: ["lotus", "flower", "decorative", "ganpati"],
    defaultWidth: 200, defaultHeight: 200, defaultFill: "#f5c6ec", defaultStroke: "#e091c8",
    params: [
      { key: "petals", label: "Petal Count", type: "integer", default: 8, min: 4, max: 24, category: "Petal" },
      { key: "layers", label: "Layers", type: "integer", default: 2, min: 1, max: 5, category: "Petal" },
      { key: "innerRadiusRatio", label: "Inner Radius", type: "slider", default: 0.6, min: 0.2, max: 0.9, step: 0.05, category: "Petal" },
      { key: "petalShape", label: "Petal Shape", type: "slider", default: 0.5, min: 0, max: 1, step: 0.05, category: "Petal" },
    ],
  },

  // ── PEACOCK ─────────────────────────────────────────────────────
  {
    type: "peacock", category: "ganpati", label: "Peacock", icon: "🦚",
    description: "Decorative peacock with spread tail",
    tags: ["peacock", "bird", "decorative", "ganpati"],
    defaultWidth: 300, defaultHeight: 350, defaultFill: "#1a5276", defaultStroke: "#154360",
    params: [
      { key: "featherCount", label: "Feather Count", type: "integer", default: 12, min: 6, max: 30, category: "Tail" },
      { key: "tailAngle", label: "Tail Spread", type: "slider", default: 120, min: 60, max: 180, step: 5, category: "Tail", unit: "°" },
      { key: "bodySize", label: "Body Size", type: "slider", default: 0.4, min: 0.2, max: 0.7, step: 0.05, category: "Body" },
      { key: "eyeSize", label: "Eye Size", type: "slider", default: 0.3, min: 0.1, max: 0.6, step: 0.05, category: "Tail" },
    ],
  },

  // ── KALASH ──────────────────────────────────────────────────────
  {
    type: "kalash", category: "ganpati", label: "Kalash", icon: "🏺",
    description: "Sacred pot with mango leaves and coconut",
    tags: ["kalash", "pot", "sacred", "ganpati"],
    defaultWidth: 150, defaultHeight: 200, defaultFill: "#d4a017", defaultStroke: "#8b6914",
    params: [
      { key: "neckHeight", label: "Neck Height", type: "slider", default: 0.25, min: 0.1, max: 0.4, step: 0.05, category: "Shape" },
      { key: "neckWidth", label: "Neck Width", type: "slider", default: 0.35, min: 0.2, max: 0.6, step: 0.05, category: "Shape" },
      { key: "baseWidth", label: "Base Width", type: "slider", default: 0.8, min: 0.5, max: 1.0, step: 0.05, category: "Shape" },
      { key: "hasMangoLeaves", label: "Mango Leaves", type: "boolean", default: true, category: "Decoration" },
      { key: "leafCount", label: "Leaf Count", type: "integer", default: 3, min: 1, max: 7, category: "Decoration" },
    ],
  },

  // ── BELLS ───────────────────────────────────────────────────────
  {
    type: "bell", category: "ganpati", label: "Temple Bell", icon: "🔔",
    description: "Traditional temple bell with clapper",
    tags: ["bell", "temple", "decorative"],
    defaultWidth: 100, defaultHeight: 150, defaultFill: "#d4a017", defaultStroke: "#8b6914",
    params: [
      { key: "bellWidth", label: "Width Ratio", type: "slider", default: 0.7, min: 0.4, max: 1.0, step: 0.05, category: "Shape" },
      { key: "clapperSize", label: "Clapper Size", type: "slider", default: 0.15, min: 0.05, max: 0.3, step: 0.05, category: "Shape" },
      { key: "hasRing", label: "Top Ring", type: "boolean", default: true, category: "Decoration" },
    ],
  },

  // ── PRABHAVALI ──────────────────────────────────────────────────
  {
    type: "prabhavali", category: "ganpati", label: "Prabhavali", icon: "☀️",
    description: "Backlit aureole / halo with rays",
    tags: ["prabhavali", "halo", "backlit", "ganpati"],
    defaultWidth: 350, defaultHeight: 400, defaultFill: "#f39c12", defaultStroke: "#e67e22",
    params: [
      { key: "rayCount", label: "Ray Count", type: "integer", default: 24, min: 8, max: 48, category: "Rays" },
      { key: "rayLength", label: "Ray Length", type: "slider", default: 0.3, min: 0.1, max: 0.6, step: 0.05, category: "Rays" },
      { key: "innerRadius", label: "Inner Radius", type: "slider", default: 0.4, min: 0.2, max: 0.8, step: 0.05, category: "Shape" },
      { key: "hasGlow", label: "Glow Effect", type: "boolean", default: true, category: "Style" },
    ],
  },

  // ── BACKGROUND PANELS ───────────────────────────────────────────
  {
    type: "rectangle", category: "basic", label: "Background Panel", icon: "🔲",
    description: "Simple background panel for layering",
    tags: ["background", "panel", "base"],
    defaultWidth: 600, defaultHeight: 500, defaultFill: "#1a1a2e", defaultStroke: "#16213e",
    params: [
      { key: "cornerRadius", label: "Corner Radius", type: "slider", default: 0, min: 0, max: 50, step: 1, category: "Shape", unit: "px" },
      { key: "borderWidth", label: "Border Width", type: "slider", default: 2, min: 0, max: 20, step: 1, category: "Shape", unit: "px" },
    ],
  },

  // ── BORDERS ─────────────────────────────────────────────────────
  {
    type: "rectangle", category: "basic", label: "Lotus Border", icon: "⊞",
    description: "Border with repeating lotus pattern",
    tags: ["border", "lotus", "pattern", "decorative"],
    defaultWidth: 500, defaultHeight: 400, defaultFill: "transparent", defaultStroke: "#c4956a",
    params: [
      { key: "borderWidth", label: "Border Width", type: "slider", default: 30, min: 10, max: 80, step: 1, category: "Dimensions", unit: "px" },
      { key: "repeatSpacing", label: "Repeat Spacing", type: "slider", default: 40, min: 20, max: 100, step: 1, category: "Pattern", unit: "px" },
      { key: "patternSize", label: "Pattern Size", type: "slider", default: 0.6, min: 0.3, max: 1.0, step: 0.05, category: "Pattern" },
    ],
  },

  // ── DECORATIVE SHAPES ───────────────────────────────────────────
  {
    type: "star", category: "basic", label: "Decorative Star", icon: "⭐",
    description: "Multi-point decorative star",
    tags: ["star", "decorative", "shape"],
    defaultWidth: 150, defaultHeight: 150, defaultFill: "#f1c40f", defaultStroke: "#f39c12",
    params: [
      { key: "metadata.points", label: "Points", type: "integer", default: 5, min: 3, max: 24, category: "Shape" },
      { key: "metadata.innerRadius", label: "Inner Ratio", type: "slider", default: 0.5, min: 0.2, max: 0.9, step: 0.05, category: "Shape" },
    ],
  },
  {
    type: "swastik", category: "ganpati", label: "Swastik", icon: "🕉",
    description: "Traditional swastik symbol",
    tags: ["swastik", "sacred", "symbol", "ganpati"],
    defaultWidth: 120, defaultHeight: 120, defaultFill: "#d4a017", defaultStroke: "#8b6914",
    params: [
      { key: "armWidth", label: "Arm Width", type: "slider", default: 0.2, min: 0.1, max: 0.4, step: 0.05, category: "Shape" },
      { key: "armLength", label: "Arm Length", type: "slider", default: 0.6, min: 0.3, max: 0.8, step: 0.05, category: "Shape" },
    ],
  },
  {
    type: "om-symbol", category: "ganpati", label: "Om Symbol", icon: "🕉️",
    description: "Sacred Om symbol",
    tags: ["om", "symbol", "sacred", "ganpati"],
    defaultWidth: 150, defaultHeight: 150, defaultFill: "transparent", defaultStroke: "#d4a017",
    params: [
      { key: "strokeWidth", label: "Stroke Width", type: "slider", default: 3, min: 1, max: 10, step: 1, category: "Style", unit: "px" },
    ],
  },

  // ── STAGE ───────────────────────────────────────────────────────
  {
    type: "base-platform", category: "ganpati", label: "Stage Platform", icon: "🎭",
    description: "Multi-tier stage platform",
    tags: ["stage", "platform", "base", "ganpati"],
    defaultWidth: 500, defaultHeight: 150, defaultFill: "#8b7355", defaultStroke: "#6b5740",
    params: [
      { key: "tiers", label: "Tiers", type: "integer", default: 3, min: 1, max: 7, category: "Structure" },
      { key: "tierHeight", label: "Tier Height", type: "slider", default: 0.3, min: 0.1, max: 0.5, step: 0.05, category: "Structure" },
    ],
  },

  // ── BASIC SHAPES ────────────────────────────────────────────────
  {
    type: "rectangle", category: "basic", label: "Rectangle", icon: "▭",
    description: "Basic rectangle",
    tags: ["shape", "basic", "rectangle"],
    defaultWidth: 150, defaultHeight: 100, defaultFill: "#3b82f6", defaultStroke: "#1e40af",
    params: [
      { key: "cornerRadius", label: "Corner Radius", type: "slider", default: 0, min: 0, max: 50, step: 1, category: "Shape", unit: "px" },
    ],
  },
  {
    type: "circle", category: "basic", label: "Circle", icon: "○",
    description: "Perfect circle",
    tags: ["shape", "basic", "circle"],
    defaultWidth: 100, defaultHeight: 100, defaultFill: "#3b82f6", defaultStroke: "#1e40af",
    params: [],
  },
  {
    type: "ellipse", category: "basic", label: "Ellipse", icon: "⬮",
    description: "Elliptical shape",
    tags: ["shape", "basic", "ellipse"],
    defaultWidth: 150, defaultHeight: 100, defaultFill: "#3b82f6", defaultStroke: "#1e40af",
    params: [],
  },
];

// ── Registry helpers ──────────────────────────────────────────────

export function getComponentByType(type: string): ComponentDef | undefined {
  return COMPONENT_REGISTRY.find((c) => c.type === type);
}

export function getComponentsByCategory(categoryId: string): ComponentDef[] {
  const CATEGORY_MAP: Record<string, string[]> = {
    frames: ["rectangle"],
    mandaps: ["mandap"],
    arches: ["arch"],
    pillars: ["pillar"],
    domes: ["dome"],
    lotus: ["lotus"],
    peacock: ["peacock"],
    kalash: ["kalash"],
    bells: ["bell"],
    prabhavali: ["prabhavali"],
    backgrounds: ["rectangle"],
    borders: ["rectangle"],
    decorative: ["star", "swastik", "om-symbol"],
    stage: ["base-platform"],
    temple: ["mandap", "dome"],
    lighting: ["circle", "ellipse"],
    custom: ["svg"],
  };
  const types = CATEGORY_MAP[categoryId] || [];
  return COMPONENT_REGISTRY.filter((c) => types.includes(c.type));
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const comp of COMPONENT_REGISTRY) {
    for (const tag of comp.tags) tags.add(tag);
  }
  return Array.from(tags).sort();
}

export function searchComponents(query: string): ComponentDef[] {
  const q = query.toLowerCase();
  return COMPONENT_REGISTRY.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.tags.some((t) => t.includes(q)) ||
      c.description.toLowerCase().includes(q),
  );
}
