/**
 * Parameter System
 *
 * Every parametric component is defined by a set of typed parameters.
 * Parameters drive geometry generation, constraints, and caching.
 */

export type ParamValueType = "number" | "integer" | "boolean" | "string" | "select" | "color";

export interface ParamDef {
  key: string;
  label: string;
  type: ParamValueType;
  default: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
  category?: string;
  description?: string;
  /** If true, changing this param triggers child regeneration */
  affectsChildren?: boolean;
}

export interface ParamValues {
  [key: string]: any;
}

/** Resolved parameter with current value and metadata */
export interface ResolvedParam {
  def: ParamDef;
  value: any;
  isDefault: boolean;
  overridden: boolean;
}

export function createDefaultValues(defs: ParamDef[]): ParamValues {
  const values: ParamValues = {};
  for (const def of defs) {
    values[def.key] = def.default;
  }
  return values;
}

export function mergeParams(base: ParamValues, overrides: Partial<ParamValues>): ParamValues {
  return { ...base, ...overrides };
}

export function paramEquals(a: ParamValues, b: ParamValues): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
