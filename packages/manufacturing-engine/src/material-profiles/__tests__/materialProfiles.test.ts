import { describe, expect, it } from "vitest";
import { getMaterialProfile, requireMaterialProfile, MATERIAL_PROFILES } from "../materialProfiles";

describe("materialProfiles", () => {
  it("has at least one profile", () => {
    expect(MATERIAL_PROFILES.length).toBeGreaterThan(0);
  });

  it("getMaterialProfile finds an existing profile by id", () => {
    expect(getMaterialProfile("acrylic-3mm")?.thicknessMm).toBe(3);
  });

  it("getMaterialProfile returns undefined for an unknown id", () => {
    expect(getMaterialProfile("titanium-1mm")).toBeUndefined();
  });

  it("requireMaterialProfile throws for an unknown id", () => {
    expect(() => requireMaterialProfile("titanium-1mm")).toThrow(/Unknown material profile/);
  });

  it("requireMaterialProfile returns the profile for a known id", () => {
    expect(requireMaterialProfile("acrylic-5mm").id).toBe("acrylic-5mm");
  });
});
