/**
 * Component Definition
 *
 * Defines a parametric component: its parameters, default geometry,
 * constraints, manufacturing metadata, and category.
 */

import type { ParamDef } from "./Parameter";
import type { Constraint } from "./Constraint";

export interface ManufacturingMeta {
  material: string;
  thickness: number;
  partNumber: string;
  cutType: "cut" | "score" | "engrave" | "mark";
  jointType: "none" | "finger" | "dovetail" | "butt";
  estimatedTime: number;   // seconds
  estimatedCost: number;   // currency units
  weight: number;          // grams
  priority: number;        // 1-10
}

export interface ComponentDefinition {
  type: string;
  label: string;
  category: string;
  icon: string;
  description: string;
  tags: string[];
  params: ParamDef[];
  defaultGeometry: {
    width: number;
    height: number;
    fill: string;
    stroke: string;
  };
  constraints?: Constraint[];
  manufacturing?: Partial<ManufacturingMeta>;
  /** If true, this component can contain children */
  canHaveChildren?: boolean;
  /** Parameter keys that affect child layout */
  childAffectingParams?: string[];
}

export function createComponentDefinition(def: ComponentDefinition): ComponentDefinition {
  return def;
}
