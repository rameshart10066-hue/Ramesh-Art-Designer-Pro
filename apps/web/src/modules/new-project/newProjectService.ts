/**
 * New Project Wizard — service layer.
 *
 * Reuses the existing parametric engine end-to-end:
 *   - Named decoration presets map to hand-tuned `DesignTemplate`s from
 *     `@/services/templateEngine` (instantiated via `instantiateTemplate`).
 *   - Material comes from the existing `@/product-model/MaterialSystem`.
 *   - Size is applied by fitting the generated objects onto a target canvas
 *     (mm), keeping the design proportional.
 *
 * Nothing here re-implements component generation — it only orchestrates the
 * existing engine and enriches the chosen project metadata.
 */

import type { BaseObjectData } from "@/types/objects";
import {
  getTemplate,
  instantiateTemplate,
  type DesignTemplate,
} from "@/services/templateEngine";
import { DEFAULT_DNA, createVariant, type DesignDNA } from "@/product-model/DNAEngine";
import { getMaterial } from "@/product-model/MaterialSystem";

// ── Domain vocabulary ─────────────────────────────────────────────

export type DecorationTypeId =
  | "royal-palace"
  | "temple"
  | "traditional"
  | "modern"
  | "minimal"
  | "custom"
  | "blank";

export type ProjectSizeId = "3x3" | "4x4" | "5x5" | "6x6" | "custom";

export type WizardMaterialId = "thermocol" | "mdf" | "pvc" | "sunboard" | "acrylic";

export interface DecorationTypeOption {
  id: DecorationTypeId;
  label: string;
  icon: string;
  description: string;
  /** Maps a named preset to an existing template; absent for custom/blank. */
  templateId?: string;
}

export const DECORATION_TYPES: DecorationTypeOption[] = [
  {
    id: "royal-palace",
    label: "Royal Palace",
    icon: "👑",
    description: "Grand palace facade with dual arch, fluted pillars, lotus border and Prabhavali halo.",
    templateId: "design-001",
  },
  {
    id: "temple",
    label: "Temple",
    icon: "🛕",
    description: "Traditional temple mandap with pointed arches and carved pillars.",
    templateId: "temple-mandap",
  },
  {
    id: "traditional",
    label: "Traditional",
    icon: "🏛",
    description: "Classic Ganpati arch with ornate detailing and a multi-tier stage.",
    templateId: "royal-ganpati",
  },
  {
    id: "modern",
    label: "Modern",
    icon: "✨",
    description: "Clean, contemporary composition with minimal ornamentation.",
    templateId: "modern-minimal",
  },
  {
    id: "minimal",
    label: "Minimal",
    icon: "◻",
    description: "Simple frame design ideal for smaller spaces.",
    templateId: "ganpati-simple",
  },
  {
    id: "custom",
    label: "Custom",
    icon: "🎨",
    description: "Browse the full template catalog and compose your own decoration.",
  },
  {
    id: "blank",
    label: "Blank",
    icon: "🖼",
    description: "Start from an empty canvas at your chosen size and material.",
  },
];

export const FT_TO_MM = 304.8;

export interface ProjectSizeOption {
  id: ProjectSizeId;
  label: string;
  widthMm: number;
  heightMm: number;
}

export const PROJECT_SIZES: ProjectSizeOption[] = [
  { id: "3x3", label: "3×3", widthMm: Math.round(3 * FT_TO_MM), heightMm: Math.round(3 * FT_TO_MM) },
  { id: "4x4", label: "4×4", widthMm: Math.round(4 * FT_TO_MM), heightMm: Math.round(4 * FT_TO_MM) },
  { id: "5x5", label: "5×5", widthMm: Math.round(5 * FT_TO_MM), heightMm: Math.round(5 * FT_TO_MM) },
  { id: "6x6", label: "6×6", widthMm: Math.round(6 * FT_TO_MM), heightMm: Math.round(6 * FT_TO_MM) },
];

/** Materials offered by the wizard (a subset of the full MaterialSystem). */
export const WIZARD_MATERIAL_IDS: WizardMaterialId[] = ["thermocol", "mdf", "pvc", "sunboard", "acrylic"];

export interface WizardOptions {
  typeId: DecorationTypeId;
  sizeId: ProjectSizeId;
  materialId: WizardMaterialId;
  /** Dimensions in feet when `sizeId` is "custom". */
  customSize?: { widthFt: number; heightFt: number };
  /** Objects captured from the TemplateGallery when type is "custom". */
  customObjects?: BaseObjectData[];
  customDesignName?: string;
}

export interface GeneratedProject {
  name: string;
  designName: string;
  designId: string;
  widthMm: number;
  heightMm: number;
  materialLabel: string;
  materialId: string;
  thicknessMm: number;
  colorTheme: string;
  /** Style theme label used for project metadata (e.g. "Royal"). */
  theme: string;
  objects: BaseObjectData[];
}

/** Short theme label per wizard decoration type (used for project metadata). */
export const TYPE_THEME_LABELS: Record<DecorationTypeId, string> = {
  "royal-palace": "Royal",
  temple: "Temple",
  traditional: "Traditional",
  modern: "Modern",
  minimal: "Minimal",
  custom: "Custom",
  blank: "Blank",
};

// ── Helpers ───────────────────────────────────────────────────────

export function getDecorationType(id: DecorationTypeId): DecorationTypeOption {
  return DECORATION_TYPES.find((t) => t.id === id) ?? DECORATION_TYPES[DECORATION_TYPES.length - 1]!;
}

export function getSizeLabel(id: ProjectSizeId): string {
  if (id === "custom") return "Custom";
  return PROJECT_SIZES.find((s) => s.id === id)?.label ?? "Custom";
}

/** Resolve the chosen size to mm (custom sizes are converted from feet). */
export function resolveSizeMm(
  sizeId: ProjectSizeId,
  customSize?: { widthFt: number; heightFt: number },
): { widthMm: number; heightMm: number } {
  if (sizeId === "custom") {
    const w = Math.max(0.5, customSize?.widthFt ?? 4);
    const h = Math.max(0.5, customSize?.heightFt ?? 4);
    return { widthMm: Math.round(w * FT_TO_MM), heightMm: Math.round(h * FT_TO_MM) };
  }
  const size = PROJECT_SIZES.find((s) => s.id === sizeId) ?? PROJECT_SIZES[0]!;
  return { widthMm: size.widthMm, heightMm: size.heightMm };
}

/**
 * Uniformly scale + recentre a set of objects so they fit within the target
 * canvas, preserving aspect ratio with a margin around the edges.
 */
export function fitObjectsToCanvas(
  objects: BaseObjectData[],
  canvasWidth: number,
  canvasHeight: number,
  margin = 40,
): BaseObjectData[] {
  if (objects.length === 0) return objects;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const o of objects) {
    minX = Math.min(minX, o.x);
    minY = Math.min(minY, o.y);
    maxX = Math.max(maxX, o.x + o.width);
    maxY = Math.max(maxY, o.y + o.height);
  }

  const bboxWidth = Math.max(1, maxX - minX);
  const bboxHeight = Math.max(1, maxY - minY);
  const availableWidth = Math.max(1, canvasWidth - margin * 2);
  const availableHeight = Math.max(1, canvasHeight - margin * 2);
  const scale = Math.min(availableWidth / bboxWidth, availableHeight / bboxHeight);
  const offsetX = (canvasWidth - bboxWidth * scale) / 2;
  const offsetY = (canvasHeight - bboxHeight * scale) / 2;

  return objects.map((o) => ({
    ...o,
    x: (o.x - minX) * scale + offsetX,
    y: (o.y - minY) * scale + offsetY,
    width: o.width * scale,
    height: o.height * scale,
    strokeWidth: Math.max(1, o.strokeWidth * scale),
    ...(o.cornerRadius !== undefined ? { cornerRadius: Math.max(0, o.cornerRadius * scale) } : {}),
  }));
}

/** A thin, locked outline showing the chosen work area on a blank canvas. */
export function buildBlankWorkArea(widthMm: number, heightMm: number): BaseObjectData[] {
  return [
    {
      id: 9001,
      type: "rectangle",
      category: "basic",
      name: "Work Area",
      x: 0,
      y: 0,
      width: widthMm,
      height: heightMm,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      flipX: false,
      flipY: false,
      opacity: 1,
      fill: "transparent",
      stroke: "#334155",
      strokeWidth: 1,
      visible: true,
      locked: true,
      zIndex: 0,
      children: [],
      metadata: { workArea: true },
    },
  ];
}

// ── Project generation ────────────────────────────────────────────

/** Neutral parametric base used when the user picks "Custom" without a template. */
export function buildCustomBaseTemplate(): DesignTemplate {
  return {
    id: "wizard-custom-base",
    name: "Custom Decoration",
    description: "Generic parametric base to customize",
    category: "custom",
    icon: "🎨",
    tags: ["custom"],
    complexity: 2,
    dna: createVariant(DEFAULT_DNA, { style: "traditional", complexity: 2, ornamentDensity: 0.35 }),
    estimatedTime: "60 min",
    difficulty: "Intermediate",
  };
}

/**
 * Generate a complete project from the wizard choices.
 * Decorations come from the existing template engine; only sizing and the
 * chosen material metadata are applied here.
 */
export function buildWizardProject(options: WizardOptions): GeneratedProject {
  const material = getMaterial(options.materialId);
  const { widthMm, heightMm } = resolveSizeMm(options.sizeId, options.customSize);
  const type = getDecorationType(options.typeId);

  let objects: BaseObjectData[] = [];
  let designId = type.id;
  let designName = type.label;
  let colorTheme = DEFAULT_DNA.primaryColor;

  if (options.typeId === "blank") {
    objects = buildBlankWorkArea(widthMm, heightMm);
  } else if (options.typeId === "custom" && options.customObjects && options.customObjects.length > 0) {
    objects = options.customObjects;
    designName = options.customDesignName || "Custom Design";
    designId = "custom";
  } else {
    const template = (options.typeId === "custom" ? undefined : getTemplate(type.templateId ?? "")) ?? buildCustomBaseTemplate();
    if (options.typeId === "custom") {
      designName = template.name;
    }
    // Material is folded into the DNA so downstream parametric consumers see it.
    const variantDna: DesignDNA = createVariant(template.dna, {
      material: material.id,
      thickness: material.defaultThickness,
    });
    objects = instantiateTemplate({ ...template, dna: variantDna });
    colorTheme = variantDna.primaryColor;
  }

  if (options.typeId !== "blank") {
    objects = fitObjectsToCanvas(objects, widthMm, heightMm);
  }

  const sizeLabel = getSizeLabel(options.sizeId);
  return {
    name: `${designName} — ${sizeLabel}`,
    designName,
    designId,
    widthMm,
    heightMm,
    materialLabel: material.label,
    materialId: material.id,
    thicknessMm: material.defaultThickness,
    colorTheme,
    theme: TYPE_THEME_LABELS[options.typeId],
    objects,
  };
}
