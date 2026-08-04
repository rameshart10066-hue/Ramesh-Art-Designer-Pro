/**
 * Assembly Guide Generator
 *
 * Generates step-by-step assembly instructions with exploded diagram data,
 * direction arrows, part lists, and estimated times.
 */

export interface AssemblyStep {
  stepNumber: number;
  title: string;
  description: string;
  partsInvolved: string[];
  directionArrows: { from: [number, number, number]; to: [number, number, number] }[];
  explodedOffset: [number, number, number];
  estimatedTime: number;  // minutes
  difficulty: 1 | 2 | 3 | 4 | 5;
  tools: string[];
  imageHint: string;
}

export interface AssemblyGuide {
  title: string;
  totalSteps: number;
  estimatedTotalTime: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  steps: AssemblyStep[];
  partsList: { partNumber: string; name: string; quantity: number; image: string }[];
  tools: string[];
  notes: string[];
}

export function generateAssemblyGuide(
  parts: { partNumber: string; name: string; x: number; y: number; parentId?: number | null }[],
  joints: { partAId: number; partBId: number; type: string }[],
): AssemblyGuide {
  const steps: AssemblyStep[] = [];

  // Step 1: Base/Platform
  const baseParts = parts.filter((p) => p.name.toLowerCase().includes("base") || p.name.toLowerCase().includes("platform") || p.name.toLowerCase().includes("stage"));
  if (baseParts.length > 0) {
    steps.push({
      stepNumber: 1,
      title: "Prepare Base",
      description: `Place the ${baseParts.map((p) => p.name).join(", ")} on a flat surface. Ensure the surface is clean and level.`,
      partsInvolved: baseParts.map((p) => p.partNumber),
      directionArrows: [],
      explodedOffset: [0, 0, 0],
      estimatedTime: 5,
      difficulty: 1,
      tools: ["Clean cloth"],
      imageHint: "base-layout",
    });
  }

  // Step 2: Main Structure (largest parts)
  const mainParts = parts.filter((p) =>
    !baseParts.includes(p) &&
    (p.name.toLowerCase().includes("mandap") || p.name.toLowerCase().includes("arch") || p.name.toLowerCase().includes("frame")),
  );
  if (mainParts.length > 0) {
    steps.push({
      stepNumber: steps.length + 1,
      title: "Assemble Main Structure",
      description: `Attach ${mainParts.map((p) => p.name).join(", ")} to the base. Align the joints carefully.`,
      partsInvolved: mainParts.map((p) => p.partNumber),
      directionArrows: [{ from: [0, 100, 0], to: [0, 0, 0] }],
      explodedOffset: [0, 80, 0],
      estimatedTime: 15,
      difficulty: 3,
      tools: ["Rubber mallet", "Level"],
      imageHint: "main-structure",
    });
  }

  // Step 3: Pillars
  const pillarParts = parts.filter((p) => p.name.toLowerCase().includes("pillar"));
  if (pillarParts.length > 0) {
    steps.push({
      stepNumber: steps.length + 1,
      title: "Install Pillars",
      description: `Insert ${pillarParts.length} pillars into their slots. Ensure they are vertical and properly aligned.`,
      partsInvolved: pillarParts.map((p) => p.partNumber),
      directionArrows: [{ from: [0, 50, 0], to: [0, 0, 0] }],
      explodedOffset: [0, 60, 0],
      estimatedTime: 10,
      difficulty: 2,
      tools: ["Rubber mallet"],
      imageHint: "pillars",
    });
  }

  // Step 4: Decorative elements
  const decorParts = parts.filter((p) =>
    !baseParts.includes(p) && !mainParts.includes(p) && !pillarParts.includes(p) &&
    (p.name.toLowerCase().includes("lotus") || p.name.toLowerCase().includes("peacock") || p.name.toLowerCase().includes("kalash")),
  );
  if (decorParts.length > 0) {
    steps.push({
      stepNumber: steps.length + 1,
      title: "Add Decorative Elements",
      description: `Carefully attach decorative elements: ${decorParts.map((p) => p.name).join(", ")}. Apply glue to the back surface.`,
      partsInvolved: decorParts.map((p) => p.partNumber),
      directionArrows: [{ from: [0, 20, 0], to: [0, 0, 0] }],
      explodedOffset: [0, 30, 0],
      estimatedTime: 10,
      difficulty: 3,
      tools: ["Glue gun", "Cloth"],
      imageHint: "decoration",
    });
  }

  // Step 5: Finial/Top
  const topParts = parts.filter((p) =>
    p.name.toLowerCase().includes("dome") || p.name.toLowerCase().includes("finial") || p.name.toLowerCase().includes("top"),
  );
  if (topParts.length > 0) {
    steps.push({
      stepNumber: steps.length + 1,
      title: "Install Top Elements",
      description: `Place ${topParts.map((p) => p.name).join(", ")} on top. Ensure they are centered and secure.`,
      partsInvolved: topParts.map((p) => p.partNumber),
      directionArrows: [{ from: [0, 30, 0], to: [0, 0, 0] }],
      explodedOffset: [0, 40, 0],
      estimatedTime: 8,
      difficulty: 2,
      tools: [],
      imageHint: "top-elements",
    });
  }

  // Step 6: Final touches
  const remainingParts = parts.filter((p) =>
    !baseParts.includes(p) && !mainParts.includes(p) && !pillarParts.includes(p) &&
    !decorParts.includes(p) && !topParts.includes(p),
  );
  if (remainingParts.length > 0) {
    steps.push({
      stepNumber: steps.length + 1,
      title: "Final Assembly",
      description: `Attach remaining parts: ${remainingParts.map((p) => p.name).join(", ")}. Check all joints and apply glue where needed.`,
      partsInvolved: remainingParts.map((p) => p.partNumber),
      directionArrows: [],
      explodedOffset: [0, 10, 0],
      estimatedTime: 10,
      difficulty: 2,
      tools: ["Glue gun", "Cloth", "Toothpicks"],
      imageHint: "final",
    });
  }

  const totalTime = steps.reduce((s, step) => s + step.estimatedTime, 0);
  const tools = [...new Set(steps.flatMap((s) => s.tools))];

  return {
    title: "Assembly Guide",
    totalSteps: steps.length,
    estimatedTotalTime: totalTime,
    difficulty: Math.max(...steps.map((s) => s.difficulty)) as 1 | 2 | 3 | 4 | 5,
    steps,
    partsList: parts.map((p) => ({ partNumber: p.partNumber, name: p.name, quantity: 1, image: "" })),
    tools,
    notes: [
      "Ensure all parts are clean and free of dust before assembly.",
      "Apply glue evenly for maximum bond strength.",
      "Allow 30 minutes drying time before moving the assembled structure.",
      "Use rubber mallet for tight joints — never force.",
    ],
  };
}
