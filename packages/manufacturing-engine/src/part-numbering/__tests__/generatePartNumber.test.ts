import { describe, expect, it } from "vitest";
import { generatePartNumber } from "../generatePartNumber";

describe("generatePartNumber", () => {
  it("formats as CATEGORY-YEAR-SEQUENCE with zero-padding", () => {
    expect(generatePartNumber({ categoryCode: "NP", sequence: 1, year: 2026 })).toBe(
      "NP-2026-0001",
    );
  });

  it("uppercases the category code", () => {
    expect(generatePartNumber({ categoryCode: "np", sequence: 1, year: 2026 })).toBe(
      "NP-2026-0001",
    );
  });

  it("respects a custom sequenceDigits width", () => {
    expect(
      generatePartNumber({ categoryCode: "BX", sequence: 7, year: 2026, sequenceDigits: 2 }),
    ).toBe("BX-2026-07");
  });

  it("does not truncate a sequence wider than sequenceDigits", () => {
    expect(generatePartNumber({ categoryCode: "BX", sequence: 12345, year: 2026 })).toBe(
      "BX-2026-12345",
    );
  });

  it("defaults year to the current year when omitted", () => {
    const result = generatePartNumber({ categoryCode: "NP", sequence: 1 });
    expect(result).toContain(String(new Date().getFullYear()));
  });

  it("rejects an empty category code", () => {
    expect(() => generatePartNumber({ categoryCode: "  ", sequence: 1 })).toThrow(
      /must not be empty/,
    );
  });

  it("rejects a non-positive or non-integer sequence", () => {
    expect(() => generatePartNumber({ categoryCode: "NP", sequence: 0 })).toThrow(
      /positive integer/,
    );
    expect(() => generatePartNumber({ categoryCode: "NP", sequence: 1.5 })).toThrow(
      /positive integer/,
    );
  });
});
