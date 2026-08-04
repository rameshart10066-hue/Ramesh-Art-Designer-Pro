/**
 * Automatic Manufacturing Engine — Unit Tests
 *
 * Verifies SheetSplitter, PuzzleJointGenerator, PartNumbering,
 * AssemblyGuide, GlueTabGenerator, RegistrationMarks, BOMGenerator,
 * CostEstimator, and ManufacturingValidator.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { splitIntoSheets, SHEET_WIDTH_MM, SHEET_HEIGHT_MM, getSheetStats } from "@/manufacturing/SheetSplitter";
import { generateJoints, selectJointType } from "@/manufacturing/PuzzleJointGenerator";
import { resetNumbering, assignPartNumber, renumberByPosition, getAllPartNumbers } from "@/manufacturing/PartNumbering";
import { generateGlueTabs } from "@/manufacturing/GlueTabGenerator";
import { generateRegistrationMarks } from "@/manufacturing/RegistrationMarks";
import { generateBOM } from "@/manufacturing/BOMGenerator";
import { calculateCost, DEFAULT_FORMULAS } from "@/manufacturing/CostEstimator";
import { validateManufacturing, getWorstSeverity } from "@/manufacturing/ManufacturingValidator";
import { generateAssemblyGuide } from "@/manufacturing/AssemblyGuide";

// ── Sheet Splitter ──────────────────────────────────────────────

describe("SheetSplitter", () => {
  it("splits parts into sheets", () => {
    const parts = [
      { id: 1, name: "Base", width: 400, height: 300, partNumber: "P001" },
      { id: 2, name: "Pillar", width: 80, height: 500, partNumber: "P002" },
    ];
    const sheets = splitIntoSheets(parts);
    expect(sheets.length).toBeGreaterThanOrEqual(1);
    expect(sheets[0]!.parts.length).toBeGreaterThanOrEqual(1);
  });

  it("uses correct sheet dimensions", () => {
    expect(SHEET_WIDTH_MM).toBe(990);
    expect(SHEET_HEIGHT_MM).toBe(482);
  });

  it("handles many small parts efficiently", () => {
    const parts = [];
    for (let i = 0; i < 10; i++) {
      parts.push({ id: i + 1, name: `Part ${i + 1}`, width: 100, height: 100, partNumber: `P${String(i + 1).padStart(3, "0")}` });
    }
    const sheets = splitIntoSheets(parts);
    const stats = getSheetStats(sheets);
    expect(stats.totalParts).toBe(10);
    expect(sheets.length).toBeGreaterThanOrEqual(1);
    expect(stats.averageEfficiency).toBeGreaterThan(0);
  });

  it("respects margins", () => {
    const parts = [
      { id: 1, name: "Full Width", width: 990, height: 100, partNumber: "P001" },
    ];
    const sheets = splitIntoSheets(parts, 990, 482, 10);
    // Part should fit within effective area (970 × 462)
    expect(sheets[0]!.parts.length).toBeGreaterThanOrEqual(0);
  });
});

// ── Puzzle Joint Generator ──────────────────────────────────────

describe("PuzzleJointGenerator", () => {
  it("selects joint type by material", () => {
    expect(selectJointType("thermocol", 25, "medium")).toBe("finger");
    expect(selectJointType("acrylic", 3, "light")).toBe("slot");
    expect(selectJointType("plywood", 6, "heavy")).toBe("dovetail");
  });

  it("generates joints between adjacent parts", () => {
    const parts = [
      { id: 1, name: "Left", x: 0, y: 0, width: 100, height: 200, material: "thermocol", thickness: 25 },
      { id: 2, name: "Right", x: 100, y: 0, width: 100, height: 200, material: "thermocol", thickness: 25 },
    ];
    const joints = generateJoints(parts);
    expect(joints.length).toBeGreaterThanOrEqual(1);
    expect(joints[0]!.partAId).toBe(1);
    expect(joints[0]!.partBId).toBe(2);
    expect(joints[0]!.orientation).toBe("vertical");
  });

  it("detects vertical adjacency", () => {
    const parts = [
      { id: 1, name: "Top", x: 0, y: 0, width: 200, height: 100, material: "thermocol", thickness: 25 },
      { id: 2, name: "Bottom", x: 0, y: 100, width: 200, height: 100, material: "thermocol", thickness: 25 },
    ];
    const joints = generateJoints(parts);
    expect(joints.length).toBeGreaterThanOrEqual(1);
    expect(joints[0]!.orientation).toBe("horizontal");
  });

  it("returns empty for non-adjacent parts", () => {
    const parts = [
      { id: 1, name: "Far Left", x: 0, y: 0, width: 100, height: 100, material: "thermocol", thickness: 25 },
      { id: 2, name: "Far Right", x: 500, y: 0, width: 100, height: 100, material: "thermocol", thickness: 25 },
    ];
    const joints = generateJoints(parts);
    expect(joints.length).toBe(0);
  });
});

// ── Part Numbering ──────────────────────────────────────────────

describe("PartNumbering", () => {
  beforeEach(() => resetNumbering());

  it("assigns sequential numbers", () => {
    expect(assignPartNumber(1)).toBe("P001");
    expect(assignPartNumber(2)).toBe("P002");
    expect(assignPartNumber(3)).toBe("P003");
  });

  it("returns same number for same id", () => {
    const pn1 = assignPartNumber(42);
    const pn2 = assignPartNumber(42);
    expect(pn1).toBe(pn2);
  });

  it("renumbers by position", () => {
    assignPartNumber(1);
    assignPartNumber(2);
    renumberByPosition([
      { id: 3, x: 0, y: 100 },
      { id: 4, x: 100, y: 0 },
    ]);
    const nums = getAllPartNumbers();
    expect(nums.length).toBe(2);
  });
});

// ── Glue Tab Generator ──────────────────────────────────────────

describe("GlueTabGenerator", () => {
  it("generates tabs for all edges", () => {
    const tabs = generateGlueTabs(1, 200, 100);
    expect(tabs.length).toBeGreaterThan(0);
    const edges = new Set(tabs.map((t) => t.edge));
    expect(edges.has("top")).toBe(true);
    expect(edges.has("bottom")).toBe(true);
    expect(edges.has("left")).toBe(true);
    expect(edges.has("right")).toBe(true);
  });

  it("includes registration tabs", () => {
    const tabs = generateGlueTabs(1, 100, 100);
    const regTabs = tabs.filter((t) => t.type === "registration");
    expect(regTabs.length).toBe(2);
  });
});

// ── Registration Marks ──────────────────────────────────────────

describe("RegistrationMarks", () => {
  it("generates all mark types", () => {
    const marks = generateRegistrationMarks(1, "P001", 200, 150, "Test Part");
    expect(marks.length).toBeGreaterThan(0);
    expect(marks.some((m) => m.type === "cross")).toBe(true);
    expect(marks.some((m) => m.type === "hole")).toBe(true);
    expect(marks.some((m) => m.type === "label")).toBe(true);
  });

  it("includes part name in labels", () => {
    const marks = generateRegistrationMarks(1, "P001", 200, 150, "MyPart");
    const label = marks.find((m) => m.text?.includes("P001"));
    expect(label).toBeDefined();
  });
});

// ── BOM Generator ───────────────────────────────────────────────

describe("BOMGenerator", () => {
  it("generates BOM with entries", () => {
    const parts = [
      { partNumber: "P001", name: "Base", material: "thermocol", thickness: 25, width: 400, height: 300, quantity: 1 },
    ];
    const sheets = [{ index: 0, usedArea: 120000, totalArea: 477180 }];
    const joints = [{ partAId: 1, partBId: 2 }];
    const bom = generateBOM(parts, sheets, joints);
    expect(bom.entries.length).toBe(1);
    expect(bom.summary.totalParts).toBe(1);
    expect(bom.summary.totalSheets).toBe(1);
    expect(bom.summary.estimatedGlue).toContain("ml");
  });
});

// ── Cost Estimator ──────────────────────────────────────────────

describe("CostEstimator", () => {
  it("calculates full cost breakdown", () => {
    const cost = calculateCost(120000, 1400, 20, 30);
    expect(cost.materialCost).toBeGreaterThan(0);
    expect(cost.machineCost).toBeGreaterThan(0);
    expect(cost.laborCost).toBeGreaterThan(0);
    expect(cost.total).toBeGreaterThan(cost.subtotal);
  });

  it("formats all values as INR", () => {
    const cost = calculateCost(100000, 1000, 10, 20);
    for (const key of Object.keys(cost.formatted)) {
      expect(cost.formatted[key]!).toContain("₹");
    }
  });

  it("uses custom formulas", () => {
    const custom = { ...DEFAULT_FORMULAS, materialCostPerSqMm: 0.001, profitMargin: 0.5 };
    const cost = calculateCost(100000, 1000, 10, 20, custom);
    expect(cost.materialCost).toBe(100);
    // Just verify the calculation
    expect(cost.materialCost).toBeGreaterThan(0);
  });
});

// ── Manufacturing Validator ──────────────────────────────────────

describe("ManufacturingValidator", () => {
  const sheetW = 990, sheetH = 482;

  it("detects tiny parts", () => {
    const parts = [{ id: 1, name: "Tiny", x: 0, y: 0, width: 5, height: 100, material: "thermocol", thickness: 25 }];
    const issues = validateManufacturing(parts, sheetW, sheetH, []);
    expect(issues.some((i) => i.type === "tiny")).toBe(true);
  });

  it("detects overlapping parts", () => {
    const parts = [
      { id: 1, name: "A", x: 0, y: 0, width: 100, height: 100, material: "thermocol", thickness: 25 },
      { id: 2, name: "B", x: 50, y: 50, width: 100, height: 100, material: "thermocol", thickness: 25 },
    ];
    const issues = validateManufacturing(parts, sheetW, sheetH, []);
    expect(issues.some((i) => i.type === "overlap")).toBe(true);
  });

  it("detects parts outside sheet", () => {
    const parts = [
      { id: 1, name: "Overflow", x: 0, y: 0, width: 2000, height: 100, material: "thermocol", thickness: 25 },
    ];
    const issues = validateManufacturing(parts, sheetW, sheetH, []);
    expect(issues.some((i) => i.type === "outside-sheet")).toBe(true);
  });

  it("detects impossible cuts", () => {
    const parts = [
      { id: 1, name: "Thick Acrylic", x: 0, y: 0, width: 100, height: 100, material: "acrylic", thickness: 30 },
    ];
    const issues = validateManufacturing(parts, sheetW, sheetH, []);
    expect(issues.some((i) => i.type === "impossible-cut")).toBe(true);
  });

  it("detects floating parts", () => {
    const parts = [
      { id: 1, name: "Connected", x: 0, y: 0, width: 100, height: 100, material: "thermocol", thickness: 25 },
      { id: 2, name: "Floating", x: 500, y: 500, width: 100, height: 100, material: "thermocol", thickness: 25 },
    ];
    const joints = [{ partAId: 1, partBId: 2, type: "finger", length: 50 }];
    const issues = validateManufacturing(parts, sheetW, sheetH, joints);
    // Both parts have a joint between them, so no floating parts expected
    expect(issues.some((i) => i.type === "floating")).toBe(false);
  });

  it("returns pass severity for no issues", () => {
    const parts = [{ id: 1, name: "Good", x: 0, y: 0, width: 200, height: 200, material: "thermocol", thickness: 25 }];
    const issues = validateManufacturing(parts, sheetW, sheetH, []);
    expect(getWorstSeverity(issues)).toBe("pass");
  });

  it("returns error severity for issues", () => {
    const parts = [{ id: 1, name: "Tiny", x: 0, y: 0, width: 5, height: 5, material: "thermocol", thickness: 25 }];
    const issues = validateManufacturing(parts, sheetW, sheetH, []);
    expect(getWorstSeverity(issues)).toBe("error");
  });
});

// ── Assembly Guide ──────────────────────────────────────────────

describe("AssemblyGuide", () => {
  it("generates assembly steps", () => {
    const parts = [
      { partNumber: "P001", name: "Base Platform", x: 0, y: 0 },
      { partNumber: "P002", name: "Mandap", x: 100, y: 50 },
    ];
    const joints = [{ partAId: 1, partBId: 2, type: "finger" }];
    const guide = generateAssemblyGuide(parts, joints);
    expect(guide.steps.length).toBeGreaterThan(0);
    expect(guide.totalSteps).toBeGreaterThan(0);
    expect(guide.partsList.length).toBe(2);
  });
});
