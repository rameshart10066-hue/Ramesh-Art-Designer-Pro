/**
 * Component Selector
 *
 * Selects specific parametric components based on the Design DNA.
 * Maps DNA fields to registered component types with positions.
 */

import type { DesignDNA } from "@/product-model/DNAEngine";
import { componentRegistry } from "@/parametric/ComponentRegistry";

export interface SelectedComponent {
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  params: Record<string, any>;
}

const CENTER_X = 600;
const CENTER_Y = 400;

export function selectComponents(dna: DesignDNA): SelectedComponent[] {
  const components: SelectedComponent[] = [];
  const def = componentRegistry;

  // Frame (outer boundary)
  components.push({
    type: "rectangle",
    name: "Frame",
    x: CENTER_X - 400,
    y: CENTER_Y - 350,
    width: 800,
    height: 700,
    params: { fill: "transparent", stroke: dna.primaryColor, strokeWidth: 3, cornerRadius: 10 },
  });

  // Stage / Base
  if (dna.stage) {
    components.push({
      type: "base-platform",
      name: "Stage",
      x: CENTER_X - 300,
      y: CENTER_Y + 200,
      width: 600,
      height: 120,
      params: { fill: dna.secondaryColor, stroke: dna.accentColor, tiers: dna.stage.includes("3") ? 3 : 2 },
    });
  }

  // Arch
  if (dna.arch) {
    components.push({
      type: "arch",
      name: "Main Arch",
      x: CENTER_X - 200,
      y: CENTER_Y - 200,
      width: 400,
      height: 350,
      params: { fill: dna.secondaryColor, stroke: dna.primaryColor, archType: dna.arch, layers: dna.complexity >= 3 ? 3 : 1, depth: 0.3 },
    });
  }

  // Pillars
  if (dna.pillar) {
    const pillarCount = dna.style === "royal" ? 4 : 2;
    const spacing = 400 / (pillarCount + 1);
    for (let i = 0; i < pillarCount; i++) {
      const px = CENTER_X - 200 + spacing * (i + 1);
      components.push({
        type: "pillar",
        name: `Pillar ${i + 1}`,
        x: px - 40,
        y: CENTER_Y - 100,
        width: 80,
        height: 300,
        params: { fill: dna.secondaryColor, stroke: dna.accentColor, sections: 3, fluted: dna.pillar === "fluted" },
      });
    }
  }

  // Lotus
  if (dna.lotus) {
    components.push({
      type: "lotus",
      name: "Lotus",
      x: CENTER_X - 60,
      y: CENTER_Y + 100,
      width: 120,
      height: 120,
      params: { fill: "#f5c6ec", stroke: "#e091c8", petals: 8, layers: 2 },
    });
  }

  // Peacock
  if (dna.peacock) {
    components.push({
      type: "peacock",
      name: "Peacock",
      x: CENTER_X + 150,
      y: CENTER_Y - 50,
      width: 150,
      height: 180,
      params: { fill: "#1a5276", stroke: "#154360", featherCount: 12, bodySize: 0.4 },
    });
  }

  // Dome
  if (dna.arch === "rounded") {
    components.push({
      type: "dome",
      name: "Dome",
      x: CENTER_X - 120,
      y: CENTER_Y - 250,
      width: 240,
      height: 200,
      params: { fill: dna.primaryColor, stroke: dna.accentColor, domeType: "rounded" },
    });
  }

  // Border
  if (dna.border) {
    components.push({
      type: "rectangle",
      name: "Border",
      x: CENTER_X - 420,
      y: CENTER_Y - 370,
      width: 840,
      height: 740,
      params: { fill: "transparent", stroke: dna.primaryColor, strokeWidth: 8 },
    });
  }

  return components;
}
