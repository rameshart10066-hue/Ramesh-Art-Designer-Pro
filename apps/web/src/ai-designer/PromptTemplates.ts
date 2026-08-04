/**
 * Prompt Templates
 *
 * Quick-access prompt templates for common design modifications.
 * Each template generates a complete prompt for the AI Designer.
 */

export interface PromptTemplate {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export const QUICK_PROMPTS: PromptTemplate[] = [
  {
    id: "more-royal",
    label: "More Royal",
    icon: "👑",
    prompt: "Make it more royal with gold accents, ornate decorations, and grand proportions.",
  },
  {
    id: "more-traditional",
    label: "More Traditional",
    icon: "🏛",
    prompt: "Make it more traditional with classic temple style, warm earth tones, and sacred motifs.",
  },
  {
    id: "more-modern",
    label: "More Modern",
    icon: "✨",
    prompt: "Make it more modern with clean lines, minimal decoration, and contemporary colors.",
  },
  {
    id: "simplify",
    label: "Simplify",
    icon: "⬇",
    prompt: "Simplify the design. Reduce decoration density, use fewer components, keep it minimal.",
  },
  {
    id: "add-lotus",
    label: "Add Lotus",
    icon: "🪷",
    prompt: "Add lotus decorations to the design. Include lotus motifs on pillars and borders.",
  },
  {
    id: "add-peacock",
    label: "Add Peacock",
    icon: "🦚",
    prompt: "Add peacock motifs to the design. Place peacocks symmetrically on both sides.",
  },
  {
    id: "estimate-cost",
    label: "Estimate Cost",
    icon: "💰",
    prompt: "Estimate the cost and materials needed for this design.",
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    icon: "🏭",
    prompt: "Prepare this design for manufacturing. Split into sheets, generate joints, and calculate BOM.",
  },
];

export function getQuickPrompt(id: string): PromptTemplate | undefined {
  return QUICK_PROMPTS.find((p) => p.id === id);
}
