/**
 * Object Factory
 *
 * Factory pattern for creating canvas objects. No switch statements — uses
 * polymorphism.
 *
 * Every type produced by the template engine (and every design type the
 * parametric engine can emit) is registered here, so templates never crash.
 * Types without a dedicated class render through a `PlaceholderObject` box;
 * `create` degrades gracefully (warns + returns a placeholder) instead of
 * throwing "Unknown object type".
 */

import type { ICanvasObject, ObjectType, ObjectConfig, BaseObjectData } from "@/types/objects";
import { RectangleObject, CircleObject, EllipseObject, StarObject } from "./shapes";
import { LotusObject, MandapObject, KalashObject, PillarObject, ArchObject, DomeObject, BasePlatformObject } from "./ganpati";
import { PeacockObject, BellObject, PrabhavaliObject, SwastikObject, OmSymbolObject } from "./parametric";
import { PlaceholderObject } from "./PlaceholderObject";

type ObjectConstructor = new (config: Partial<BaseObjectData>) => ICanvasObject;

// Registry of object constructors (polymorphic — no switch statements).
// Keyed by `string` so any template/design type resolves safely; types
// without a dedicated class fall back to the placeholder.
const objectRegistry: Record<string, ObjectConstructor> = {
  // Basic shapes
  rectangle: RectangleObject,
  circle: CircleObject,
  ellipse: EllipseObject,
  star: StarObject,
  polygon: RectangleObject, // Placeholder
  line: RectangleObject, // Placeholder
  text: RectangleObject, // Placeholder
  image: RectangleObject, // Placeholder
  svg: RectangleObject, // Placeholder

  // Ganpati objects
  lotus: LotusObject,
  mandap: MandapObject,
  kalash: KalashObject,
  pillar: PillarObject,
  arch: ArchObject,
  dome: DomeObject,
  "base-platform": BasePlatformObject,
  peacock: PeacockObject,
  prabhavali: PrabhavaliObject,
  "om-symbol": OmSymbolObject,
  swastik: SwastikObject,
  deepak: KalashObject, // Placeholder
  bell: BellObject,
  flower: LotusObject, // Placeholder
  garland: LotusObject, // Placeholder
  toran: LotusObject, // Placeholder

  // Frame / border / background design types (placeholder until dedicated
  // classes land — a dashed box keeps templates rendering without crashing).
  "simple-frame": PlaceholderObject,
  "lotus-frame": PlaceholderObject,
  "temple-frame": PlaceholderObject,
  "background-panel": PlaceholderObject,
  "lotus-border": PlaceholderObject,
  "temple-border": PlaceholderObject,
  lighting: PlaceholderObject,
  "decorative-shape": PlaceholderObject,
  "custom-svg": PlaceholderObject,

  // Aliases (design names → real classes)
  stage: BasePlatformObject,
  om: OmSymbolObject,
};

/**
 * Object Factory — Main API
 */
export class ObjectFactory {
  /**
   * Create an object by type. Never throws for an unknown type — it warns and
   * returns a placeholder box so templates always render.
   */
  static create(type: string, config?: Partial<ObjectConfig>): ICanvasObject {
    const Constructor = objectRegistry[type];

    if (!Constructor) {
      console.warn(`Unknown object type: ${type}`);
      const base = (config ?? {}) as Partial<ObjectConfig>;
      return new PlaceholderObject({
        type: type as ObjectType,
        name: base.name ?? type,
        ...base,
      } as unknown as Partial<BaseObjectData>);
    }

    return new Constructor((config ?? {}) as Partial<BaseObjectData>);
  }

  /**
   * Create object from serialized data
   */
  static deserialize(data: Partial<ObjectConfig> & { type: string }): ICanvasObject {
    return ObjectFactory.create(data.type, data);
  }

  /**
   * Register custom object type
   */
  static register(type: string, constructor: ObjectConstructor): void {
    objectRegistry[type] = constructor;
  }

  /**
   * Get all available types
   */
  static getAvailableTypes(): string[] {
    return Object.keys(objectRegistry);
  }

  /**
   * Whether a type has an explicit registration (not relying on the fallback).
   */
  static isRegistered(type: string): boolean {
    return type in objectRegistry;
  }
}

export default ObjectFactory;
