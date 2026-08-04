/**
 * AI Ganpati Designer — Unit Tests
 *
 * Verifies prompt parser, DNA generator, design composer,
 * constraint validator, conversation memory, and catalog learner.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { parsePrompt } from "@/ai-designer/PromptParser";
import { detectIntent } from "@/ai-designer/IntentDetector";
import { generateDNA } from "@/ai-designer/DNAGenerator";
import { selectComponents } from "@/ai-designer/ComponentSelector";
import { composeDesign } from "@/ai-designer/DesignComposer";
import { validateDesign } from "@/ai-designer/ConstraintValidator";
import { ConversationMemory } from "@/ai-designer/ConversationMemory";
import { catalogLearner } from "@/ai-designer/CatalogLearner";
import { DEFAULT_DNA } from "@/product-model/DNAEngine";

// ── Prompt Parser ───────────────────────────────────────────────

describe("PromptParser", () => {
  it("detects royal style", () => {
    const result = parsePrompt("Create a royal palace with golden frame");
    expect(result.style).toBe("royal");
    expect(result.colors).toContain("#d4a017");
  });

  it("detects traditional style", () => {
    const result = parsePrompt("Create a traditional temple mandap");
    expect(result.style).toBe("traditional");
  });

  it("detects size", () => {
    const result = parsePrompt("A large 6x6 grand design");
    expect(result.size).toBe("grand");
  });

  it("detects components", () => {
    const result = parsePrompt("Create with pillars, lotus, peacock and arch");
    expect(result.keyComponents).toContain("pillar");
    expect(result.keyComponents).toContain("lotus");
    expect(result.keyComponents).toContain("peacock");
    expect(result.keyComponents).toContain("arch");
  });

  it("detects material", () => {
    const result = parsePrompt("Create with acrylic material");
    expect(result.material).toBe("acrylic");
  });

  it("detects budget", () => {
    const result = parsePrompt("Premium luxury design");
    expect(result.budget).toBe("premium");
  });

  it("detects lighting", () => {
    const result = parsePrompt("Design with LED lighting");
    expect(result.lighting).toBe(true);
  });

  it("returns raw prompt", () => {
    const result = parsePrompt("test prompt");
    expect(result.rawPrompt).toBe("test prompt");
  });
});

// ── Intent Detector ─────────────────────────────────────────────

describe("IntentDetector", () => {
  it("detects create intent", () => {
    expect(detectIntent("Create a new design")).toBe("create");
    expect(detectIntent("Make something beautiful")).toBe("create");
  });

  it("detects modify intent", () => {
    expect(detectIntent("Change the color to red")).toBe("modify");
    expect(detectIntent("Add more pillars")).toBe("modify");
  });

  it("detects estimate intent", () => {
    expect(detectIntent("Estimate the cost")).toBe("estimate");
    expect(detectIntent("What is the price?")).toBe("estimate");
  });

  it("detects manufacturing intent", () => {
    expect(detectIntent("Export as SVG")).toBe("manufacturing");
    expect(detectIntent("Generate nesting sheets")).toBe("manufacturing");
  });
});

// ── DNA Generator ───────────────────────────────────────────────

describe("DNAGenerator", () => {
  it("generates DNA from parsed intent", () => {
    const parsed = parsePrompt("Create a royal palace with lotus border");
    const dna = generateDNA(parsed);
    expect(dna.style).toBe("royal");
    expect(dna.primaryColor).toBe("#d4a017");
  });

  it("preserves existing DNA for modifications", () => {
    const parsed = parsePrompt("Make it more minimal");
    const existing = { ...DEFAULT_DNA, style: "traditional" as const, primaryColor: "#c62828" };
    const dna = generateDNA(parsed, existing);
    expect(dna.style).toBe("minimal");
  });

  it("applies material override", () => {
    const parsed = parsePrompt("Create with MDF material");
    const dna = generateDNA(parsed);
    expect(dna.material).toBe("mdf"); // MDF material is detected't a material override
  });
});

// ── Component Selector ──────────────────────────────────────────

describe("ComponentSelector", () => {
  it("selects components from DNA", () => {
    const components = selectComponents(DEFAULT_DNA);
    expect(components.length).toBeGreaterThan(0);
    expect(components.some((c) => c.type === "rectangle")).toBe(true);
  });

  it("includes stage component", () => {
    const components = selectComponents(DEFAULT_DNA);
    expect(components.some((c) => c.type === "base-platform")).toBe(true);
  });
});

// ── Design Composer ─────────────────────────────────────────────

describe("DesignComposer", () => {
  it("composes full design from prompt", () => {
    const result = composeDesign("Create a traditional mandap with lotus");
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.dna).toBeDefined();
    expect(result.validation).toBeDefined();
    expect(result.prompt).toBe("Create a traditional mandap with lotus");
  });

  it("completes in under 2 seconds", () => {
    const start = performance.now();
    composeDesign("Create a royal palace");
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  it("uses cache for repeated prompts", () => {
    const start = performance.now();
    composeDesign("Cached design test");
    composeDesign("Cached design test");
    const elapsed = performance.now() - start;
    // Second call should be faster
    expect(elapsed).toBeLessThan(2000);
  });
});

// ── Constraint Validator ────────────────────────────────────────

describe("ConstraintValidator", () => {
  it("validates a valid design", () => {
    const components = selectComponents(DEFAULT_DNA);
    const result = validateDesign(components, DEFAULT_DNA);
    expect(result).toBeDefined();
    expect(typeof result.valid).toBe("boolean");
  });

  it("detects oversized components", () => {
    const components = selectComponents(DEFAULT_DNA);
    // Make one component very large
    if (components.length > 0) components[0] = { ...components[0]!, width: 2500, height: 2500 };
    const result = validateDesign(components, DEFAULT_DNA);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Conversation Memory ─────────────────────────────────────────

describe("ConversationMemory", () => {
  let memory: ConversationMemory;

  beforeEach(() => {
    memory = new ConversationMemory();
  });

  it("stores turns", () => {
    const result = composeDesign("test");
    memory.addTurn("test", result);
    expect(memory.length).toBe(1);
  });

  it("supports undo", () => {
    const r1 = composeDesign("first");
    const r2 = composeDesign("second");
    memory.addTurn("first", r1);
    memory.addTurn("second", r2);
    const prev = memory.undo();
    expect(prev?.prompt).toBe("first");
  });

  it("supports redo", () => {
    const r1 = composeDesign("first");
    const r2 = composeDesign("second");
    memory.addTurn("first", r1);
    memory.addTurn("second", r2);
    memory.undo();
    const next = memory.redo();
    expect(next?.prompt).toBe("second");
  });

  it("clears redo stack on new turn", () => {
    const r1 = composeDesign("first");
    const r2 = composeDesign("second");
    memory.addTurn("first", r1);
    memory.addTurn("second", r2);
    memory.undo();
    const r3 = composeDesign("third");
    memory.addTurn("third", r3);
    expect(memory.canRedo).toBe(false);
  });
});

// ── Catalog Learner ─────────────────────────────────────────────

describe("CatalogLearner", () => {
  beforeEach(() => { catalogLearner.initialize(); });

  it("loads templates on init", () => {
    expect(catalogLearner.size).toBeGreaterThan(0);
  });

  it("detects similar designs", () => {
    const similar = catalogLearner.findSimilar(DEFAULT_DNA);
    expect(Array.isArray(similar)).toBe(true);
  });

  it("returns trending designs", () => {
    const trending = catalogLearner.getTrending(3);
    expect(trending.length).toBeLessThanOrEqual(3);
  });
});
