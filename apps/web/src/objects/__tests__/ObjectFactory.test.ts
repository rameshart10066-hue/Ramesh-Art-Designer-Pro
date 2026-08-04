/**
 * ObjectFactory — template sync guard (Sprint 11.4).
 *
 * Ensures TemplateEngine and ObjectFactory never drift apart again:
 * every object type the templates can produce must be explicitly registered,
 * so no "Unknown object type" runtime error can occur.
 */

import { describe, it, expect, vi } from "vitest";
import { ObjectFactory } from "@/objects/ObjectFactory";
import { PlaceholderObject } from "@/objects/PlaceholderObject";
import { DESIGN_TEMPLATES, instantiateTemplate } from "@/services/templateEngine";

/** Collect every object type the template engine can produce. */
function collectTemplateTypes(): Set<string> {
  const types = new Set<string>();
  for (const template of DESIGN_TEMPLATES) {
    for (const obj of instantiateTemplate(template)) {
      types.add(obj.type);
    }
  }
  return types;
}

describe("ObjectFactory — template registration sync", () => {
  it("explicitly registers every object type the templates produce", () => {
    const usedTypes = collectTemplateTypes();
    expect(usedTypes.size).toBeGreaterThan(0);

    for (const type of usedTypes) {
      expect(ObjectFactory.isRegistered(type), `"${type}" is not registered in ObjectFactory`).toBe(true);
    }
  });

  it("instantiates every template type without falling back to the unknown-type path", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    for (const template of DESIGN_TEMPLATES) {
      const objects = instantiateTemplate(template);
      for (const obj of objects) {
        const created = ObjectFactory.create(obj.type, obj);
        expect(created).toBeDefined();
      }
    }

    // No template type should hit the "Unknown object type" warning.
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("produces 16+ objects for the Royal Palace template", () => {
    const royal = DESIGN_TEMPLATES.find((t) => t.id === "design-001")!;
    const objects = instantiateTemplate(royal);
    expect(objects.length).toBeGreaterThanOrEqual(16);
  });
});

describe("ObjectFactory — graceful fallback", () => {
  it("never throws for an unknown type — warns and returns a placeholder", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => ObjectFactory.create("definitely-not-a-type")).not.toThrow();
    const obj = ObjectFactory.create("definitely-not-a-type");

    expect(obj).toBeInstanceOf(PlaceholderObject);
    expect(warn).toHaveBeenCalledWith("Unknown object type: definitely-not-a-type");
    warn.mockRestore();
  });

  it("preserves the original type string on the placeholder", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const obj = ObjectFactory.create("future-frame", { x: 0, y: 0 });
    expect((obj.getData() as { type: string }).type).toBe("future-frame");
    warn.mockRestore();
  });
});
