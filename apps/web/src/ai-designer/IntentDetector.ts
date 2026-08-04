/**
 * Intent Detector
 *
 * Determines what the user wants to do: create new design, modify existing,
 * estimate cost, generate manufacturing, or get info.
 */

import type { ParsedIntent } from "./PromptParser";

export type DesignIntent = "create" | "modify" | "estimate" | "manufacturing" | "info" | "unknown";

const MODIFY_KEYWORDS = ["change", "modify", "edit", "update", "add", "remove", "delete", "increase", "decrease", "bigger", "smaller", "more", "less"];
const ESTIMATE_KEYWORDS = ["estimate", "cost", "price", "budget", "how much", "calculate"];
const MANUFACTURING_KEYWORDS = ["manufacturing", "export", "sheet", "cut", "laser", "dxf", "svg", "nest", "split"];
const INFO_KEYWORDS = ["what", "how", "help", "guide", "explain", "tell me", "documentation"];

export function detectIntent(prompt: string): DesignIntent {
  const lower = prompt.toLowerCase();

  if (MODIFY_KEYWORDS.some((kw) => lower.startsWith(kw) || lower.includes(` ${kw} `))) return "modify";
  if (ESTIMATE_KEYWORDS.some((kw) => lower.includes(kw))) return "estimate";
  if (MANUFACTURING_KEYWORDS.some((kw) => lower.includes(kw))) return "manufacturing";
  if (INFO_KEYWORDS.some((kw) => lower.includes(kw))) return "info";
  if (lower.startsWith("create") || lower.startsWith("make") || lower.startsWith("generate") || lower.startsWith("build") || lower.startsWith("design")) return "create";

  return "create";
}

export function getIntentDescription(intent: DesignIntent): string {
  switch (intent) {
    case "create": return "Create a new design";
    case "modify": return "Modify the existing design";
    case "estimate": return "Estimate cost and materials";
    case "manufacturing": return "Generate manufacturing files";
    case "info": return "Provide information";
    default: return "Unknown request";
  }
}
