/**
 * Design DNA
 *
 * A high-level design configuration that captures the essential character
 * of a Ganpati decoration design. Changing DNA parameters automatically
 * regenerates the entire design while maintaining proportions and symmetry.
 *
 * DNA Components:
 *   Frame, Arch, Pillar, Border, Lotus, Peacock, Background, Stage
 */

export interface DesignDNA {
  theme: string;
  style: "traditional" | "royal" | "minimal" | "modern" | "temple";
  complexity: 1 | 2 | 3 | 4 | 5;
  symmetry: "mirror" | "radial" | "asymmetric";
  proportions: "compact" | "standard" | "grand";

  // Component selectors
  frame: string;           // Component type for frame
  arch: string;            // Arch type
  pillar: string;          // Pillar style
  border: string;          // Border pattern
  lotus: string;           // Lotus style
  peacock: string;         // Peacock presence
  background: string;      // Background panel type
  stage: string;           // Stage type

  // Global parameters
  material: string;
  thickness: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  ornamentDensity: number; // 0-1
}

export const DEFAULT_DNA: DesignDNA = {
  theme: "traditional",
  style: "traditional",
  complexity: 3,
  symmetry: "mirror",
  proportions: "standard",
  frame: "lotus-frame",
  arch: "pointed",
  pillar: "classic",
  border: "lotus",
  lotus: "8-petal",
  peacock: "central",
  background: "panel",
  stage: "3-tier",
  material: "thermocol",
  thickness: 25,
  primaryColor: "#d4a017",
  secondaryColor: "#c4956a",
  accentColor: "#8b6914",
  ornamentDensity: 0.5,
};

/** Generate a complete set of component parameters from DNA */
export function dnaToComponentParams(dna: DesignDNA): Record<string, any[]> {
  const params: Record<string, any[]> = {};
  const complexity = dna.complexity;
  const density = dna.ornamentDensity;
  const accent = dna.primaryColor;
  const secondary = dna.secondaryColor;
  const tertiary = dna.accentColor;

  // Background panel (behind everything)
  if (dna.background && dna.background !== "none") {
    params.background = [
      {
        type: "rectangle", x: 0, y: 0, width: 1200, height: 900,
        fill: dna.background === "panel" ? "#f7f1e3" : "transparent",
        stroke: "transparent",
        metadata: { background: true, backgroundType: dna.background },
      },
    ];
  }

  // Frame (real parametric rectangle with the DNA border style)
  params.frame = [
    {
      type: "rectangle", x: 30, y: 30, width: 1140, height: 840,
      fill: "transparent", stroke: accent, strokeWidth: density >= 0.5 ? 8 : 4, cornerRadius: 6,
      metadata: { frameStyle: dna.frame },
    },
  ];

  // Arch — single for simple, double (inner + outer) for complex designs
  params.arch = [
    {
      type: "arch", x: 300, y: 100, width: 600, height: 420,
      fill: secondary, stroke: accent, archType: dna.arch, layers: complexity >= 3 ? 3 : 1, hasKeystone: true,
    },
  ];
  if (complexity >= 3) {
    params.arch.push({
      type: "arch", x: 340, y: 140, width: 520, height: 360,
      fill: accent, stroke: tertiary, archType: "pointed", layers: 2, hasKeystone: true,
    });
  }

  // Pillars — 2 for simple, 4 for grand
  const pillarCount = complexity >= 4 ? 4 : 2;
  params.pillars = [];
  for (let i = 0; i < pillarCount; i++) {
    const x = Math.round(120 + i * (960 / (pillarCount - 1)));
    params.pillars.push({
      type: "pillar", x, y: 240, width: 80, height: 560,
      fill: secondary, stroke: tertiary, sections: 3, pillarStyle: dna.pillar,
    });
  }

  // Stage / platform
  params.stage = [
    {
      type: "base-platform", x: 220, y: 700, width: 760, height: 150,
      fill: secondary, stroke: tertiary,
      tiers: dna.stage.includes("3") ? 3 : dna.stage.includes("2") ? 2 : 1,
    },
  ];

  // Inner decorative border
  params.border = [
    {
      type: "rectangle", x: 60, y: 60, width: 1080, height: 780,
      fill: "transparent", stroke: accent, strokeWidth: 3,
      metadata: { borderStyle: dna.border },
    },
  ];

  // Lotus — presence flag; extras at higher ornament density
  if (dna.lotus && dna.lotus !== "none") {
    params.lotus = [
      { type: "lotus", x: 560, y: 420, width: 80, height: 80, fill: "#f5c6ec", stroke: "#e091c8", petals: 8 },
    ];
    if (density >= 0.6) {
      params.lotus.push(
        { type: "lotus", x: 260, y: 360, width: 50, height: 50, fill: "#f5c6ec", stroke: "#e091c8", petals: 6 },
        { type: "lotus", x: 890, y: 360, width: 50, height: 50, fill: "#f5c6ec", stroke: "#e091c8", petals: 6 },
      );
    }
  }

  // Peacock — presence flag, symmetrical pair
  if (dna.peacock && dna.peacock !== "none") {
    params.peacock = [
      { type: "peacock", x: 140, y: 320, width: 140, height: 180, fill: "#1a5276", stroke: "#154360", featherCount: 10 },
      { type: "peacock", x: 920, y: 320, width: 140, height: 180, fill: "#1a5276", stroke: "#154360", featherCount: 10 },
    ];
  }

  // Prabhavali halo + Om — complex designs
  if (complexity >= 3) {
    params.prabhavali = [
      { type: "prabhavali", x: 500, y: 200, width: 200, height: 220, fill: accent, stroke: tertiary, rayCount: 24, hasGlow: true },
    ];
    params.om = [
      { type: "om-symbol", x: 575, y: 285, width: 50, height: 50, fill: "transparent", stroke: accent, strokeWidth: 3 },
    ];
  }

  // Decorative bells — high complexity
  if (complexity >= 4) {
    params.bells = [
      { type: "bell", x: 200, y: 480, width: 30, height: 48, fill: accent, stroke: tertiary, clapperSize: 0.12, hasRing: true },
      { type: "bell", x: 970, y: 480, width: 30, height: 48, fill: accent, stroke: tertiary, clapperSize: 0.12, hasRing: true },
    ];
  }

  // Dense ornamentation — deepak lamps + garland
  if (density >= 0.7) {
    params.decorations = [
      { type: "deepak", x: 320, y: 620, width: 36, height: 60, fill: accent, stroke: tertiary },
      { type: "deepak", x: 844, y: 620, width: 36, height: 60, fill: accent, stroke: tertiary },
      { type: "garland", x: 300, y: 150, width: 240, height: 36, fill: "#f97316", stroke: "#c2410c" },
    ];
  }

  return params;
}

/** Human-readable list of the components a DNA configuration produces. */
export function dnaToComponentList(dna: DesignDNA): string[] {
  const list = ["frame", "arch"];
  const pillarCount = dna.complexity >= 4 ? 4 : 2;
  for (let i = 0; i < pillarCount; i++) list.push("pillar");
  list.push("stage", "border");
  if (dna.lotus && dna.lotus !== "none") list.push("lotus");
  if (dna.peacock && dna.peacock !== "none") list.push("peacock");
  if (dna.complexity >= 3) list.push("prabhavali", "om-symbol");
  if (dna.complexity >= 4) list.push("bell");
  if (dna.ornamentDensity >= 0.7) list.push("deepak", "garland");
  if (dna.background && dna.background !== "none") list.push("background-panel");
  return list;
}

/** Create a variant DNA by mutating specific fields */
export function createVariant(dna: DesignDNA, mutations: Partial<DesignDNA>): DesignDNA {
  const variant = { ...dna, ...mutations };
  // Maintain consistency
  if (variant.style === "minimal") {
    variant.complexity = Math.min(variant.complexity, 2) as 1 | 2 | 3 | 4 | 5;
    variant.ornamentDensity = Math.min(variant.ornamentDensity, 0.3);
  }
  if (variant.style === "royal") {
    variant.complexity = Math.max(variant.complexity, 3) as 1 | 2 | 3 | 4 | 5;
    variant.ornamentDensity = Math.max(variant.ornamentDensity, 0.6);
  }
  return variant;
}
