import { describe, expect, it } from "vitest";
import { getProjectReadiness } from "../projectWorkflow";

describe("getProjectReadiness", () => {
  it("flags missing design details before manufacturing can continue", () => {
    const result = getProjectReadiness({
      designName: "",
      width: "",
      height: "",
      material: "",
      thickness: "",
    } as any);

    expect(result.isReady).toBe(false);
    expect(result.missingFields).toEqual(["design name", "size", "material", "thickness"]);
  });

  it("allows the workflow when the required fields are present", () => {
    const result = getProjectReadiness({
      designName: "Royal Ganpati Arch",
      width: "1200 mm",
      height: "800 mm",
      material: "Thermocol",
      thickness: "12 mm",
    } as any);

    expect(result.isReady).toBe(true);
    expect(result.missingFields).toEqual([]);
  });
});
