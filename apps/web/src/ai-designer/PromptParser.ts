/**
 * Prompt Parser
 *
 * Converts natural language prompts into structured design intents.
 * Detects theme, style, size, budget, material, density, lighting, complexity.
 */

export interface ParsedIntent {
  theme: string | null;
  style: "royal" | "traditional" | "minimal" | "modern" | "temple" | null;
  size: "compact" | "standard" | "grand" | null;
  budget: "low" | "medium" | "high" | "premium" | null;
  material: string | null;
  decorationDensity: number | null; // 0-1
  lighting: boolean | null;
  complexity: 1 | 2 | 3 | 4 | 5 | null;
  keyComponents: string[];
  colors: string[];
  rawPrompt: string;
}

const STYLE_KEYWORDS: Record<string, "royal" | "traditional" | "minimal" | "modern" | "temple"> = {
  royal: "royal", grand: "royal", palace: "royal", king: "royal", queen: "royal", majestic: "royal", opulent: "royal", rich: "royal",
  traditional: "traditional", classic: "traditional", ethnic: "traditional", cultural: "traditional", heritage: "traditional",
  minimal: "minimal", simple: "minimal", clean: "minimal", subtle: "minimal", modern: "modern", contemporary: "modern",
  temple: "temple", mandir: "temple", sacred: "temple", divine: "temple", spiritual: "temple",
};

const SIZE_KEYWORDS: Record<string, "compact" | "standard" | "grand"> = {
  small: "compact", compact: "compact", mini: "compact", tiny: "compact", tabletop: "compact",
  medium: "standard", standard: "standard", normal: "standard", regular: "standard",
  large: "grand", grand: "grand", big: "grand", huge: "grand", massive: "grand", "6x6": "grand", "5x5": "grand",
};

const BUDGET_KEYWORDS: Record<string, "low" | "medium" | "high" | "premium"> = {
  cheap: "low", budget: "low", economical: "low", affordable: "low", low: "low",
  medium: "medium", moderate: "medium", average: "medium",
  expensive: "high", costly: "high", high: "high", premium: "premium", luxury: "premium", exclusive: "premium",
};

const MATERIAL_KEYWORDS: Record<string, string> = {
  thermocol: "thermocol", thermocole: "thermocol", foam: "thermocol",
  acrylic: "acrylic", acryllic: "acrylic",
  mdf: "mdf", wood: "mdf",
  plywood: "plywood", ply: "plywood",
  pvc: "pvc",
  sunboard: "sunboard", sun: "sunboard",
};

const COMPONENT_KEYWORDS: Record<string, string[]> = {
  frame: ["frame", "border", "boundary"],
  mandap: ["mandap", "temple", "structure", "canopy"],
  arch: ["arch", "arc", "gateway", "entrance"],
  pillar: ["pillar", "column", "piller"],
  dome: ["dome", "dome", "shikhar", "spire"],
  lotus: ["lotus", "flower", "petal", "kamal"],
  peacock: ["peacock", "mayur", "bird", "mor"],
  kalash: ["kalash", "pot", "urn", "kalas"],
  bell: ["bell", "ghanti", "ghanta"],
  prabhavali: ["prabhavali", "halo", "aureole", "backlit", "glow"],
  swastik: ["swastik", "swastika"],
  om: ["om", "aum", "omkar"],
  stage: ["stage", "platform", "base", "pedestal", "vedi"],
};

export function parsePrompt(prompt: string): ParsedIntent {
  const lower = prompt.toLowerCase();
  const words = lower.split(/\s+/);

  // Style
  let style: ParsedIntent["style"] = null;
  for (const [kw, s] of Object.entries(STYLE_KEYWORDS)) {
    if (lower.includes(kw)) { style = s; break; }
  }

  // Size
  let size: ParsedIntent["size"] = null;
  for (const [kw, s] of Object.entries(SIZE_KEYWORDS)) {
    if (lower.includes(kw)) { size = s; break; }
  }

  // Budget
  let budget: ParsedIntent["budget"] = null;
  for (const [kw, b] of Object.entries(BUDGET_KEYWORDS)) {
    if (lower.includes(kw)) { budget = b; break; }
  }

  // Material
  let material: string | null = null;
  for (const [kw, m] of Object.entries(MATERIAL_KEYWORDS)) {
    if (lower.includes(kw)) { material = m; break; }
  }

  // Components
  const keyComponents: string[] = [];
  for (const [comp, keywords] of Object.entries(COMPONENT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      keyComponents.push(comp);
    }
  }

  // Colors
  const colorMap: Record<string, string> = {
    red: "#c62828", blue: "#1a237e", green: "#2e7d32", yellow: "#f1c40f",
    gold: "#d4a017", golden: "#d4a017", orange: "#ff6f00", saffron: "#ff6f00",
    white: "#ffffff", black: "#000000", purple: "#6a1b9a", pink: "#f5c6ec",
    silver: "#b0bec5", brown: "#8b7355",
  };
  const colors: string[] = [];
  for (const word of words) {
    if (colorMap[word]) colors.push(colorMap[word]);
  }

  // Theme
  const theme = keyComponents.length > 0 ? keyComponents[0] : null;

  // Complexity
  let complexity: ParsedIntent["complexity"] = null;
  if (lower.includes("complex") || lower.includes("elaborate") || lower.includes("detailed") || lower.includes("intricate")) complexity = 4;
  else if (lower.includes("simple") || lower.includes("easy") || lower.includes("basic")) complexity = 2;
  else if (style === "royal") complexity = 4;
  else if (style === "minimal") complexity = 1;

  // Decoration density
  let decorationDensity: number | null = null;
  if (lower.includes("dense") || lower.includes("heavily") || lower.includes("ornate") || lower.includes("elaborate")) decorationDensity = 0.8;
  else if (lower.includes("sparse") || lower.includes("lightly") || lower.includes("minimal")) decorationDensity = 0.2;
  else if (style === "royal") decorationDensity = 0.7;
  else if (style === "minimal") decorationDensity = 0.1;

  // Lighting
  let lighting: boolean | null = null;
  if (lower.includes("light") || lower.includes("led") || lower.includes("glow")) lighting = true;

  return {
    theme: theme ?? null,
    style: style ?? null,
    size: size ?? null,
    budget: budget ?? null,
    material: material ?? null,
    decorationDensity: decorationDensity ?? null,
    lighting: lighting ?? null,
    complexity: complexity ?? null,
    keyComponents,
    colors,
    rawPrompt: prompt,
  };
}
