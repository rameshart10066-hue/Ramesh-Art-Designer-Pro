/**
 * Template Engine
 *
 * Pre-built parametric design templates generated from Design DNA.
 * Each template creates a complete design with multiple components
 * arranged on the canvas — ready for customization.
 */

import type { BaseObjectData } from "@/types/objects";
import type { DesignDNA } from "@/product-model/DNAEngine";
import { DEFAULT_DNA, createVariant, dnaToComponentParams } from "@/product-model/DNAEngine";

export interface DesignTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
  dna: DesignDNA;
  /** Extra component configs to merge */
  extraComponents?: Partial<BaseObjectData>[];
  estimatedTime: string;
  difficulty: string;
}

let nextId = 1000;

function makeId(): number { return nextId++; }

function templateFromDna(
  id: string,
  name: string,
  description: string,
  category: string,
  icon: string,
  tags: string[],
  complexity: 1 | 2 | 3 | 4 | 5,
  dnaMutations: Partial<DesignDNA>,
  extraComponents?: Partial<BaseObjectData>[],
  estimatedTime?: string,
  difficulty?: string,
): DesignTemplate {
  return {
    id, name, description, category, icon, tags, complexity,
    dna: createVariant(DEFAULT_DNA, dnaMutations),
    ...(extraComponents ? { extraComponents } : {}),
    estimatedTime: estimatedTime || `${complexity * 15 + 30} min`,
    difficulty: difficulty || (complexity <= 2 ? "Beginner" : complexity <= 3 ? "Intermediate" : "Advanced"),
  };
}

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  // ═══════════════════════════════════════════════════════════════
  // Design_001 — 3×3 ft Royal Palace Ganpati Decoration
  // 10 parametric components on 914×914 mm canvas
  // Auto-generates sheets, joints, BOM, cost, assembly guide
  // ═══════════════════════════════════════════════════════════════
  {
    id: "design-001",
    name: "Design_001 — Royal Palace 3×3 ft",
    description: "Complete 3×3 ft Royal Palace Ganpati decoration with dual arch, four fluted pillars, lotus border, Prabhavali halo, Om symbol, decorative bells, peacocks, and name plate. Parametric and fully editable.",
    category: "ganpati",
    icon: "👑",
    tags: ["royal", "palace", "ganpati", "premium", "3x3", "design-001", "flagship"],
    complexity: 4,
    dna: createVariant(DEFAULT_DNA, {
      style: "royal",
      theme: "royal-palace",
      frame: "lotus-frame",
      arch: "multilayer",
      pillar: "fluted",
      border: "lotus",
      lotus: "8-petal",
      peacock: "central",
      stage: "3-tier",
      primaryColor: "#d4a017",
      secondaryColor: "#c4956a",
      accentColor: "#8b6914",
      ornamentDensity: 0.85,
      symmetry: "mirror",
      proportions: "standard",
      complexity: 4,
      material: "thermocol",
      background: "panel",
    }),
    extraComponents: [
      // 1. Royal Frame (outer boundary, 3×3 ft = 914×914 mm)
      { type: "rectangle", name: "Royal Frame", x: 57, y: 57, width: 800, height: 800, fill: "transparent", stroke: "#d4a017", strokeWidth: 6, cornerRadius: 8, zIndex: 1 },
      // 2. Lotus Border (inner decorative border)
      { type: "rectangle", name: "Lotus Border", x: 80, y: 80, width: 754, height: 754, fill: "transparent", stroke: "#c4956a", strokeWidth: 3, cornerRadius: 4, zIndex: 2, metadata: { borderStyle: "lotus", repeatSpacing: 25 } },
      // 3. Base Platform (stage at bottom)
      { type: "base-platform", name: "Stage Platform", x: 200, y: 720, width: 514, height: 80, fill: "#8b7355", stroke: "#6b5740", strokeWidth: 2, zIndex: 3, metadata: { tiers: 3, tierHeight: 0.3 } },
      // 4. Four Pillars
      { type: "pillar", name: "Pillar Left Outer", x: 130, y: 250, width: 55, height: 380, fill: "#c4956a", stroke: "#8b7355", strokeWidth: 2, zIndex: 4, metadata: { sections: 3, hasBase: true, hasCapital: true, fluted: true, fluteCount: 6 } },
      { type: "pillar", name: "Pillar Left Inner", x: 220, y: 250, width: 50, height: 380, fill: "#c4956a", stroke: "#8b7355", strokeWidth: 2, zIndex: 5, metadata: { sections: 3, hasBase: true, hasCapital: true, fluted: true, fluteCount: 6 } },
      { type: "pillar", name: "Pillar Right Inner", x: 644, y: 250, width: 50, height: 380, fill: "#c4956a", stroke: "#8b7355", strokeWidth: 2, zIndex: 6, metadata: { sections: 3, hasBase: true, hasCapital: true, fluted: true, fluteCount: 6 } },
      { type: "pillar", name: "Pillar Right Outer", x: 730, y: 250, width: 55, height: 380, fill: "#c4956a", stroke: "#8b7355", strokeWidth: 2, zIndex: 7, metadata: { sections: 3, hasBase: true, hasCapital: true, fluted: true, fluteCount: 6 } },
      // 5. Double Arch (multilayer)
      { type: "arch", name: "Outer Arch", x: 260, y: 100, width: 395, height: 340, fill: "#c4956a", stroke: "#8b7355", strokeWidth: 2, zIndex: 8, metadata: { archType: "multilayer", depth: 0.35, layers: 3, hasKeystone: true } },
      { type: "arch", name: "Inner Arch", x: 300, y: 130, width: 315, height: 280, fill: "#d4a017", stroke: "#8b6914", strokeWidth: 2, zIndex: 9, metadata: { archType: "pointed", depth: 0.3, layers: 2, hasKeystone: true } },
      // 6. Prabhavali Halo (behind Om)
      { type: "prabhavali", name: "Prabhavali Halo", x: 370, y: 280, width: 174, height: 200, fill: "#f39c12", stroke: "#e67e22", strokeWidth: 2, zIndex: 10, metadata: { rayCount: 24, rayLength: 0.3, innerRadius: 0.45, hasGlow: true } },
      // 7. Om Symbol (center)
      { type: "om-symbol", name: "Om Symbol", x: 432, y: 340, width: 50, height: 50, fill: "transparent", stroke: "#d4a017", strokeWidth: 3, zIndex: 11 },
      // 8. Two Decorative Bells
      { type: "bell", name: "Bell Left", x: 175, y: 450, width: 35, height: 55, fill: "#d4a017", stroke: "#8b6914", strokeWidth: 2, zIndex: 12, metadata: { bellWidth: 0.7, clapperSize: 0.12, hasRing: true } },
      { type: "bell", name: "Bell Right", x: 705, y: 450, width: 35, height: 55, fill: "#d4a017", stroke: "#8b6914", strokeWidth: 2, zIndex: 13, metadata: { bellWidth: 0.7, clapperSize: 0.12, hasRing: true } },
      // 9. Two Small Peacocks
      { type: "peacock", name: "Peacock Left", x: 110, y: 300, width: 60, height: 75, fill: "#1a5276", stroke: "#154360", strokeWidth: 2, zIndex: 14, metadata: { featherCount: 8, tailAngle: 100, bodySize: 0.35, eyeSize: 0.25 } },
      { type: "peacock", name: "Peacock Right", x: 745, y: 300, width: 60, height: 75, fill: "#1a5276", stroke: "#154360", strokeWidth: 2, zIndex: 15, metadata: { featherCount: 8, tailAngle: 100, bodySize: 0.35, eyeSize: 0.25 } },
      // 10. Name Plate
      { type: "rectangle", name: "Name Plate", x: 350, y: 690, width: 214, height: 26, fill: "#d4a017", stroke: "#8b6914", strokeWidth: 2, zIndex: 16, cornerRadius: 3, metadata: { text: "Shree Ganesh", fontSize: 12, engrave: true } },
    ],
    estimatedTime: "180 min",
    difficulty: "Advanced",
  },

  templateFromDna(
    "royal-ganpati", "Royal Ganpati Arch", "A grand Ganpati decoration with ornate arch, fluted pillars, lotus motifs, and a multi-tier stage. Perfect for large-scale installations.",
    "ganpati", "👑", ["royal", "ganpati", "grand", "traditional"], 4,
    { style: "royal", primaryColor: "#d4a017", secondaryColor: "#c4956a", accentColor: "#8b6914", ornamentDensity: 0.8, complexity: 4, arch: "multilayer", pillar: "fluted" },
  ),
  templateFromDna(
    "temple-mandap", "Temple Mandap", "Traditional temple mandap with pointed arches, carved pillars, and a classic dome. Includes lotus base and peacock accents.",
    "mandap", "🏛", ["temple", "mandap", "traditional", "sacred"], 3,
    { style: "traditional", arch: "pointed", pillar: "classic", lotus: "8-petal", peacock: "central", ornamentDensity: 0.5, complexity: 3 },
  ),
  templateFromDna(
    "modern-minimal", "Modern Minimal Arch", "Clean, contemporary Ganpati decoration with minimal ornamentation. Sleek geometric shapes with subtle elegance.",
    "modern", "✨", ["modern", "minimal", "contemporary", "sleek"], 1,
    { style: "minimal", primaryColor: "#e2e8f0", secondaryColor: "#94a3b8", accentColor: "#64748b", ornamentDensity: 0.1, complexity: 1, arch: "rounded", pillar: "classic" },
  ),
  templateFromDna(
    "south-indian", "South Indian Temple", "Vibrant South Indian style with red and gold accents. Pointed arches, fluted pillars, and elaborate lotus decorations.",
    "regional", "🛕", ["south-indian", "traditional", "vibrant", "colorful"], 3,
    { style: "traditional", primaryColor: "#c62828", secondaryColor: "#f5c6ec", accentColor: "#d4a017", ornamentDensity: 0.6, arch: "pointed", pillar: "fluted" },
  ),
  templateFromDna(
    "north-indian-royal", "North Indian Royal", "Regal North Indian design with warm saffron and gold. Multilayer arches with elaborate ornamentation and peacock motifs.",
    "regional", "🎨", ["north-indian", "royal", "warm", "ornate"], 4,
    { style: "royal", primaryColor: "#ff6f00", secondaryColor: "#fff3e0", accentColor: "#d4a017", ornamentDensity: 0.7, arch: "multilayer", lotus: "8-petal", peacock: "central" },
  ),
  templateFromDna(
    "ganpati-simple", "Simple Ganpati Frame", "A clean, simple frame design ideal for smaller spaces. Quick to manufacture with minimal material waste.",
    "ganpati", "🖼", ["ganpati", "simple", "small", "beginner"], 2,
    { style: "minimal", complexity: 2, ornamentDensity: 0.2, proportions: "compact", stage: "simple" },
  ),
  templateFromDna(
    "wedding-mandap", "Wedding Mandap", "An elaborate wedding mandap with grand arch, multiple pillars, decorative borders, and ornate stage design.",
    "mandap", "💒", ["wedding", "mandap", "grand", "elaborate"], 5,
    { style: "royal", ornamentDensity: 0.9, complexity: 5, arch: "multilayer", pillar: "fluted", border: "lotus", stage: "3-tier", peacock: "central" },
  ),
  templateFromDna(
    "mini-stage", "Mini Stage Decor", "Compact stage decoration with built-in arch, pillars, and base platform. Ideal for tabletop installations.",
    "stage", "🎭", ["stage", "compact", "tabletop", "small"], 2,
    { style: "traditional", complexity: 2, ornamentDensity: 0.3, proportions: "compact", stage: "3-tier", lotus: "8-petal" },
  ),
  templateFromDna(
    "premium-lotus", "Premium Lotus Arch", "Elegant arch design centered around a large lotus motif. Flowing organic shapes with gold accents.",
    "decorative", "🪷", ["lotus", "premium", "elegant", "organic"], 3,
    { style: "traditional", primaryColor: "#f5c6ec", secondaryColor: "#e091c8", accentColor: "#d4a017", ornamentDensity: 0.5, lotus: "8-petal" },
  ),
  templateFromDna(
    "festival-special", "Festival Special", "Vibrant festival design with multi-color elements, decorative border, and festive lighting points.",
    "ganpati", "🎉", ["festival", "colorful", "celebration", "vibrant"], 3,
    { style: "royal", primaryColor: "#ff6f00", secondaryColor: "#c62828", accentColor: "#f5c6ec", ornamentDensity: 0.6, border: "lotus" },
  ),
];

/** Get a template by ID */
export function getTemplate(id: string): DesignTemplate | undefined {
  return DESIGN_TEMPLATES.find((t) => t.id === id);
}

/** Search templates */
export function searchTemplates(query: string): DesignTemplate[] {
  const q = query.toLowerCase();
  return DESIGN_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q)),
  );
}

/** Get templates by category */
export function getTemplatesByCategory(category: string): DesignTemplate[] {
  if (category === "all") return DESIGN_TEMPLATES;
  return DESIGN_TEMPLATES.filter((t) => t.category === category || t.tags.includes(category));
}

/** Build canvas objects from a template */
export function instantiateTemplate(template: DesignTemplate): BaseObjectData[] {
  const params = dnaToComponentParams(template.dna);
  const objects: BaseObjectData[] = [];
  const centerX = 400;
  const centerY = 300;
  let zIndex = 0;

  // Add objects from DNA params with proper positioning
  const addObject = (type: string, extra: Record<string, any>) => {
    objects.push({
      id: makeId(),
      type: type as any,
      category: "ganpati" as any,
      name: extra.name || type,
      x: (extra.x || 0) + centerX,
      y: (extra.y || 0) + centerY,
      width: extra.width || 150,
      height: extra.height || 100,
      rotation: extra.rotation || 0,
      scaleX: 1,
      scaleY: 1,
      flipX: false,
      flipY: false,
      opacity: 1,
      fill: extra.fill || "#3b82f6",
      stroke: extra.stroke || "#1e40af",
      strokeWidth: extra.strokeWidth || 2,
      visible: true,
      locked: false,
      zIndex: zIndex++,
      children: [],
      metadata: extra.metadata || {},
      ...(extra.cornerRadius !== undefined ? { cornerRadius: extra.cornerRadius } : {}),
    });
  };

  // Frame
  if (params.frame) {
    const f = params.frame[0]!;
    addObject(f.type || "rectangle", { ...f, name: "Frame", fill: "transparent" });
  }

  // Arch
  if (params.arch) {
    const a = params.arch[0]!;
    addObject(a.type || "arch", { ...a, name: "Main Arch" });
  }

  // Pillars
  if (params.pillars) {
    for (const p of params.pillars) {
      addObject(p.type || "pillar", { ...p, name: `Pillar` });
    }
  }

  // Stage
  if (params.stage) {
    const s = params.stage[0]!;
    addObject(s.type || "base-platform", { ...s, name: "Stage" });
  }

  // Border
  if (params.border) {
    const b = params.border[0]!;
    addObject(b.type || "rectangle", { ...b, name: "Border", fill: "transparent" });
  }

  // Lotus
  if (params.lotus && Array.isArray(params.lotus)) {
    for (const l of params.lotus) {
      addObject(l.type || "lotus", { ...l, name: "Lotus" });
    }
  }

  // Peacock
  if (params.peacock && Array.isArray(params.peacock)) {
    for (const p of params.peacock) {
      addObject(p.type || "peacock", { ...p, name: "Peacock" });
    }
  }

  // Extra components
  if (template.extraComponents) {
    for (const extra of template.extraComponents) {
      addObject(extra.type || "rectangle", extra);
    }
  }

  return objects;
}
