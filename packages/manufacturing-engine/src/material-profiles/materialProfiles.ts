export interface MaterialProfile {
  id: string;
  name: string;
  thicknessMm: number;
  /** Kerf: material removed by the laser's beam width — used for nesting spacing. */
  kerfMm: number;
  cutSpeedMmPerMin: number;
  cutPowerPercent: number;
  engraveSpeedMmPerMin: number;
  engravePowerPercent: number;
}

/**
 * Placeholder profile catalog pending a real MaterialProfile table in
 * packages/database. Values are reasonable starting points for acrylic on
 * a small diode/CO2 laser, not calibrated for any specific machine —
 * treat as a template to tune, not a source of truth.
 */
export const MATERIAL_PROFILES: MaterialProfile[] = [
  {
    id: "acrylic-3mm",
    name: "Acrylic 3mm",
    thicknessMm: 3,
    kerfMm: 0.15,
    cutSpeedMmPerMin: 300,
    cutPowerPercent: 85,
    engraveSpeedMmPerMin: 3000,
    engravePowerPercent: 30,
  },
  {
    id: "acrylic-5mm",
    name: "Acrylic 5mm",
    thicknessMm: 5,
    kerfMm: 0.18,
    cutSpeedMmPerMin: 180,
    cutPowerPercent: 100,
    engraveSpeedMmPerMin: 3000,
    engravePowerPercent: 30,
  },
  {
    id: "acrylic-8mm",
    name: "Acrylic 8mm",
    thicknessMm: 8,
    kerfMm: 0.2,
    cutSpeedMmPerMin: 90,
    cutPowerPercent: 100,
    engraveSpeedMmPerMin: 2500,
    engravePowerPercent: 35,
  },
];

export function getMaterialProfile(id: string): MaterialProfile | undefined {
  return MATERIAL_PROFILES.find((profile) => profile.id === id);
}

/** Throws if the profile doesn't exist — for call sites where a missing profile is a hard error. */
export function requireMaterialProfile(id: string): MaterialProfile {
  const profile = getMaterialProfile(id);
  if (!profile) {
    throw new Error(`Unknown material profile: "${id}".`);
  }
  return profile;
}
