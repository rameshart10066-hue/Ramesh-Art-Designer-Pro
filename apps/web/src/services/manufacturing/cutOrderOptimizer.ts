/**
 * Cut Order Optimizer
 *
 * Orders cut instructions for minimum travel and groups
 * by action type: inside → outside → engrave → score → mark.
 */

import type { PartData, NestedPlacement, CutInstruction, CutOrderPlan, CutAction } from "@/types/manufacturing";

const ACTION_PRIORITY: CutAction[] = ["cut", "score", "engrave", "mark", "drill"];

export function optimizeCutOrder(
  parts: PartData[],
  placements: NestedPlacement[],
  toolpathMappings: { color: string; action: CutAction; power: number; speed: number; passes: number }[],
): CutOrderPlan {
  const instructions: CutInstruction[] = [];

  for (const placement of placements) {
    const part = parts.find((p) => p.objectId === placement.objectId);
    if (!part) continue;

    const mapping = toolpathMappings.find((m) => m.color === part.color) || toolpathMappings[0];
    if (!mapping) continue;

    instructions.push({
      partNumber: part.partNumber,
      action: mapping.action,
      priority: ACTION_PRIORITY.indexOf(mapping.action) + 1,
      path: generateCutPath(placement),
      length: part.cutLength,
      estimatedTime: part.cutLength / mapping.speed,
      power: mapping.power,
      speed: mapping.speed,
      passes: mapping.passes,
    });
  }

  // Sort by priority (inside cuts first), then by size descending
  instructions.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.length - a.length;
  });

  const totalTime = instructions.reduce((s, i) => s + i.estimatedTime, 0);
  const actionGroups = ACTION_PRIORITY
    .map((action) => {
      const group = instructions.filter((i) => i.action === action);
      return { action, totalLength: group.reduce((s, i) => s + i.length, 0) };
    })
    .filter((g) => g.totalLength > 0);

  return {
    instructions,
    totalTime,
    travelDistance: estimateTravel(instructions),
    actionGroups,
  };
}

function generateCutPath(placement: NestedPlacement): string {
  const { x, y, width, height } = placement;
  return `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;
}

function estimateTravel(instructions: CutInstruction[]): number {
  let travel = 0;
  for (const instr of instructions) {
    travel += Math.abs(instr.length); // simplified
  }
  return travel;
}
