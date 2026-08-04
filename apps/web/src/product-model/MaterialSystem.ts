/**
 * Material System
 *
 * Defines all supported materials with physical and manufacturing properties.
 */

export interface MaterialDef {
  id: string;
  label: string;
  color: string;
  texture: string;
  defaultThickness: number;   // mm
  weightPerSqM: number;       // kg/m²
  costPerSqM: number;         // ₹/m²
  reflectivity: number;       // 0-1
  opacity: number;            // 0-1
  roughness: number;          // 0-1
  metalness: number;          // 0-1
  maxThickness: number;       // mm
  minThickness: number;       // mm
  laserCuttable: boolean;
  engraveSpeed: number;       // mm/s
  cutSpeed: number;           // mm/s
}

export const MATERIALS: Record<string, MaterialDef> = {
  thermocol: {
    id: "thermocol", label: "Thermocol", color: "#f0ead6", texture: "foam",
    defaultThickness: 25, weightPerSqM: 0.025, costPerSqM: 450,
    reflectivity: 0.05, opacity: 0.9, roughness: 0.9, metalness: 0,
    maxThickness: 100, minThickness: 5, laserCuttable: true,
    engraveSpeed: 500, cutSpeed: 30,
  },
  acrylic: {
    id: "acrylic", label: "Acrylic", color: "#e8e8f0", texture: "glossy",
    defaultThickness: 3, weightPerSqM: 1.18, costPerSqM: 2500,
    reflectivity: 0.3, opacity: 0.95, roughness: 0.1, metalness: 0,
    maxThickness: 25, minThickness: 1, laserCuttable: true,
    engraveSpeed: 200, cutSpeed: 8,
  },
  mdf: {
    id: "mdf", label: "MDF", color: "#c4a882", texture: "wood",
    defaultThickness: 6, weightPerSqM: 0.7, costPerSqM: 1200,
    reflectivity: 0.05, opacity: 1, roughness: 0.8, metalness: 0,
    maxThickness: 25, minThickness: 3, laserCuttable: true,
    engraveSpeed: 300, cutSpeed: 15,
  },
  plywood: {
    id: "plywood", label: "Plywood", color: "#d4b896", texture: "wood",
    defaultThickness: 6, weightPerSqM: 0.6, costPerSqM: 800,
    reflectivity: 0.05, opacity: 1, roughness: 0.7, metalness: 0,
    maxThickness: 18, minThickness: 3, laserCuttable: true,
    engraveSpeed: 250, cutSpeed: 12,
  },
  pvc: {
    id: "pvc", label: "PVC", color: "#f5f5f5", texture: "plastic",
    defaultThickness: 3, weightPerSqM: 0.5, costPerSqM: 600,
    reflectivity: 0.2, opacity: 0.95, roughness: 0.3, metalness: 0,
    maxThickness: 12, minThickness: 1, laserCuttable: true,
    engraveSpeed: 400, cutSpeed: 20,
  },
  sunboard: {
    id: "sunboard", label: "Sunboard", color: "#fffde7", texture: "foam",
    defaultThickness: 5, weightPerSqM: 0.3, costPerSqM: 350,
    reflectivity: 0.05, opacity: 0.9, roughness: 0.85, metalness: 0,
    maxThickness: 10, minThickness: 2, laserCuttable: true,
    engraveSpeed: 600, cutSpeed: 35,
  },
  foamBoard: {
    id: "foamBoard", label: "Foam Board", color: "#f8f8f8", texture: "foam",
    defaultThickness: 5, weightPerSqM: 0.2, costPerSqM: 300,
    reflectivity: 0.05, opacity: 0.85, roughness: 0.9, metalness: 0,
    maxThickness: 10, minThickness: 2, laserCuttable: true,
    engraveSpeed: 700, cutSpeed: 40,
  },
};

export function getMaterial(id: string): MaterialDef {
  return (MATERIALS[id] || MATERIALS.thermocol)!
}

export function getMaterialList(): MaterialDef[] {
  return Object.values(MATERIALS);
}
