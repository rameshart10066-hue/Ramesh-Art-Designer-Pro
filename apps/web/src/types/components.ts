/**
 * Parametric Component System
 *
 * Defines the schema for all parametric Ganpati CAD components.
 * Every component stores its parameters in metadata and can be
 * edited via the property panel.
 */

import type { ObjectType, ObjectCategory } from "./objects";

// ── Parameter Types ──────────────────────────────────────────────

export type ParamType =
  | "number"
  | "integer"
  | "select"
  | "color"
  | "boolean"
  | "string"
  | "slider";

export interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];     // for "select" type
  category?: string;      // grouping in property panel
  description?: string;
  unit?: string;          // "px", "mm", "°", etc.
}

// ── Component Definition ─────────────────────────────────────────

export interface ComponentDef {
  type: ObjectType;
  category: ObjectCategory;
  label: string;
  icon: string;
  description: string;
  tags: string[];
  params: ParamDef[];
  defaultWidth: number;
  defaultHeight: number;
  defaultFill?: string;
  defaultStroke?: string;
  /** Manufacturing metadata defaults */
  manufacturing?: Partial<ManufacturingData>;
}

// ── Manufacturing Metadata ───────────────────────────────────────

export interface ManufacturingData {
  materialThickness: number;   // mm
  cutPriority: number;         // 1-10 (higher = cuts first)
  engravePriority: number;     // 1-10
  partNumber: string;
  mirror: boolean;
  layerColor: string;          // color for laser/CNC layer
  cutThrough: boolean;         // full cut vs engrave
}

// ── Component Category ───────────────────────────────────────────

export interface ComponentCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  { id: "frames",          label: "Frames",            icon: "🖼",  description: "Decorative frames" },
  { id: "mandaps",         label: "Mandaps",           icon: "🏛",  description: "Temple structures" },
  { id: "arches",          label: "Arches",            icon: "🌉",  description: "Archways" },
  { id: "pillars",         label: "Pillars",           icon: "🗿",  description: "Columns & pillars" },
  { id: "domes",           label: "Domes",             icon: "🕌",  description: "Dome structures" },
  { id: "lotus",           label: "Lotus",             icon: "🪷",  description: "Lotus motifs" },
  { id: "peacock",         label: "Peacock",           icon: "🦚",  description: "Peacock designs" },
  { id: "kalash",          label: "Kalash",            icon: "🏺",  description: "Sacred pots" },
  { id: "bells",           label: "Bells",             icon: "🔔",  description: "Temple bells" },
  { id: "prabhavali",      label: "Prabhavali",        icon: "☀️",  description: "Backlit aureoles" },
  { id: "backgrounds",     label: "Background Panels", icon: "🔲",  description: "Background panels" },
  { id: "borders",         label: "Borders",           icon: "⊞",  description: "Border patterns" },
  { id: "decorative",      label: "Decorative Shapes", icon: "✨",  description: "Decorative elements" },
  { id: "stage",           label: "Stage",             icon: "🎭",  description: "Stage platforms" },
  { id: "temple",          label: "Temple",            icon: "🛕",  description: "Complete temples" },
  { id: "lighting",        label: "Lighting",          icon: "💡",  description: "Lighting elements" },
  { id: "custom",          label: "Custom SVG",        icon: "📐",  description: "Custom SVG imports" },
];

// ── Favorites ────────────────────────────────────────────────────

export interface FavoritesData {
  recentIds: number[];
  favoriteIds: number[];
  recentTypes: string[];
  favoriteTypes: string[];
}
