/**
 * Design Catalog — pure service layer (Sprint 11.3).
 *
 * The catalog is a persisted design library seeded from the existing
 * parametric templates (`@/services/templateEngine`). This module holds the
 * pure, testable logic:
 *   - seed-item derivation (size / theme / category from a template)
 *   - filter/query pipeline (search, category, size, theme, favorites)
 *   - on-demand object resolution (template → canvas objects, cached)
 *   - an SVG preview renderer for cards
 *   - virtual-grid range math
 *
 * It deliberately does not re-implement design generation — everything
 * flows through `instantiateTemplate`.
 */

import type { BaseObjectData } from "@/types/objects";
import { getTemplate, instantiateTemplate, type DesignTemplate } from "@/services/templateEngine";
import { getMaterial } from "@/product-model/MaterialSystem";

// ── Types ─────────────────────────────────────────────────────────

export type CatalogSize = "3x3" | "4x4" | "5x5" | "6x6" | "custom";
export type CatalogTheme = "royal" | "temple" | "traditional" | "modern" | "minimal" | "custom";

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
  size: CatalogSize;
  theme: CatalogTheme;
  /** Primary palette colour used for preview tinting. */
  colorTheme: string;
  /** Display material label (captured so catalog-opened projects record it). */
  material?: string;
  favorite: boolean;
  /** Set for seed items (live reference into the template engine). */
  templateId?: string;
  /** Serialized canvas objects — present for user-created items (duplicates). */
  objects?: BaseObjectData[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogFilters {
  search?: string;
  category?: string | null;
  size?: CatalogSize | null;
  theme?: CatalogTheme | null;
  favoritesOnly?: boolean;
}

export const SIZE_LABELS: Record<CatalogSize, string> = {
  "3x3": "3×3 ft",
  "4x4": "4×4 ft",
  "5x5": "5×5 ft",
  "6x6": "6×6 ft",
  custom: "Custom",
};

export const THEME_LABELS: Record<CatalogTheme, string> = {
  royal: "Royal",
  temple: "Temple",
  traditional: "Traditional",
  modern: "Modern",
  minimal: "Minimal",
  custom: "Custom",
};

export const CATEGORY_LABELS: Record<string, string> = {
  ganpati: "Ganpati",
  mandap: "Mandap",
  modern: "Modern",
  regional: "Regional",
  stage: "Stage",
  decorative: "Decorative",
  custom: "Custom",
};

// ── Derivation (template → catalog item metadata) ─────────────────

const SIZE_TAG_RE = /^(\d+)x(\d+)$/;

/** Size is read from the template's `3x3`-style tag, else inferred from complexity. */
export function deriveSize(template: DesignTemplate): CatalogSize {
  const tag = template.tags.find((t) => SIZE_TAG_RE.test(t));
  if (tag === "3x3" || tag === "4x4" || tag === "5x5" || tag === "6x6") return tag;
  if (template.complexity <= 2) return "3x3";
  if (template.complexity === 3) return "4x4";
  if (template.complexity === 4) return "5x5";
  return "6x6";
}

/** Theme comes from the DNA style; temple templates are detected explicitly. */
export function deriveTheme(template: DesignTemplate): CatalogTheme {
  if (template.tags.includes("temple") || template.category === "mandap") return "temple";
  const style = template.dna.style;
  return style; // royal | traditional | minimal | modern (all valid themes)
}

export function deriveCategory(template: DesignTemplate): string {
  return template.category || "custom";
}

/** Build the initial library from the parametric template catalog. */
export function buildSeedItems(
  templates: DesignTemplate[],
  now = new Date().toISOString(),
): CatalogItem[] {
  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: deriveCategory(t),
    icon: t.icon,
    tags: [...t.tags],
    complexity: t.complexity,
    size: deriveSize(t),
    theme: deriveTheme(t),
    colorTheme: t.dna.primaryColor,
    material: getMaterial(t.dna.material).label,
    favorite: false,
    templateId: t.id,
    createdAt: now,
    updatedAt: now,
  }));
}

// ── Query pipeline ────────────────────────────────────────────────

/** Pure filter over the library (scales to 100+ items; the UI virtualizes the grid). */
export function queryCatalogItems(items: CatalogItem[], filters: CatalogFilters): CatalogItem[] {
  const search = filters.search?.trim().toLowerCase() ?? "";

  return items
    .filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.tags.some((t) => t.toLowerCase().includes(search));

      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesSize = !filters.size || item.size === filters.size;
      const matchesTheme = !filters.theme || item.theme === filters.theme;
      const matchesFavorites = !filters.favoritesOnly || item.favorite;

      return matchesSearch && matchesCategory && matchesSize && matchesTheme && matchesFavorites;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// ── Object resolution (on demand, cached) ─────────────────────────

const templateObjectsCache = new Map<string, BaseObjectData[]>();

/**
 * Resolve the editable canvas objects for a catalog item.
 * Seed items instantiate their template once (cached); user-created items
 * carry their own serialized objects.
 */
export function resolveItemObjects(item: CatalogItem): BaseObjectData[] {
  if (item.objects && item.objects.length > 0) return item.objects;

  if (item.templateId) {
    const cached = templateObjectsCache.get(item.templateId);
    if (cached) return cached;
    const template = getTemplate(item.templateId);
    const objects = template ? instantiateTemplate(template) : [];
    templateObjectsCache.set(item.templateId, objects);
    return objects;
  }

  return [];
}

/** Build a duplicate catalog entry (own copy of the objects, no template link). */
export function buildDuplicateItem(
  source: CatalogItem,
  objects: BaseObjectData[],
  now = new Date().toISOString(),
): CatalogItem {
  return {
    id: `dup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: `${source.name} Copy`,
    description: source.description,
    category: source.category,
    icon: source.icon,
    tags: source.tags,
    complexity: source.complexity,
    size: source.size,
    theme: source.theme,
    colorTheme: source.colorTheme,
    favorite: false,
    ...(source.material !== undefined && { material: source.material }),
    objects,
    createdAt: now,
    updatedAt: now,
  };
}

// ── SVG preview renderer (shared) ─────────────────────────────────

/** Re-exported from the shared service for backward compatibility. */
export { renderObjectsSvg as renderObjectsPreviewSvg } from "@/services/renderObjectsSvg";

// ── Virtual grid math ─────────────────────────────────────────────

export interface VirtualRange {
  /** First row to render. */
  firstRow: number;
  /** Index of the first visible item in the flattened list. */
  startIndex: number;
  /** Index just past the last visible item. */
  endIndex: number;
}

/** Compute the visible item slice for a virtualized grid (pure & testable). */
export function computeVirtualRange(params: {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  columns: number;
  totalItems: number;
  overscan: number;
}): VirtualRange {
  const { scrollTop, viewportHeight, rowHeight, columns, totalItems, overscan } = params;
  if (totalItems <= 0) return { firstRow: 0, startIndex: 0, endIndex: 0 };

  const totalRows = Math.ceil(totalItems / columns);
  const firstRow = Math.max(0, Math.floor(Math.max(0, scrollTop) / rowHeight));
  const visibleRows = Math.ceil(viewportHeight / rowHeight);
  const lastRow = Math.min(totalRows - 1, firstRow + visibleRows + overscan);

  const startIndex = firstRow * columns;
  const endIndex = Math.min(totalItems, (lastRow + 1) * columns);

  return { firstRow, startIndex, endIndex };
}
