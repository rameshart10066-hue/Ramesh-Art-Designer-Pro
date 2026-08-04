/**
 * AI Provider Implementations
 *
 * Swappable provider layer. Each implements AIProviderInterface.
 */

import type { AIProviderInterface, AIProviderId, AIContext, AIResponse, AIActionPlan } from "@/types/ai";
import { AI_PROVIDERS } from "@/types/ai";

// ── System prompt (shared across providers) ──────────────────────

const SYSTEM_PROMPT = `You are a professional CAD design assistant for Ramesh Art Designer Pro, a specialized vector editor for Ganpati decoration, thermocol cutting, CNC routing, and laser cutting.

Your role is to help users create and edit parametric CAD designs.

You MUST respond with structured JSON only, wrapped in \`\`\`json ... \`\`\` blocks.

Available actions:
- create: Create a new object (type: rectangle, circle, ellipse, star, lotus, mandap, kalash, pillar, arch, dome, peacock, bell, swastik, text)
- move: Move object to x,y position
- delete: Delete object by id
- duplicate: Clone an object
- resize: Change width/height of an object
- rotate: Change rotation angle
- group: Group multiple object ids
- ungroup: Ungroup a group
- align: Align objects (left, right, top, bottom, centerH, centerV)
- split: Split a grouped object
- nest: Run auto-nesting on selected objects
- export: Export to SVG/DXF/laser

Example response:
\`\`\`json
{
  "summary": "Created a mandap with 4 pillars at center",
  "actions": [
    { "action": "create", "object": "mandap", "x": 300, "y": 200, "width": 400, "height": 350, "metadata": { "pillars": 4, "archType": "pointed" } }
  ]
}
\`\`\`

Keep responses concise and actionable. Never generate raster images. Only parametric CAD objects.`;

// ── Helper: Build prompt ─────────────────────────────────────────

function buildUserPrompt(userInput: string, context: AIContext): string {
  return `Current canvas: ${context.canvas.width}x${context.canvas.height}, zoom ${Math.round(context.canvas.zoom * 100)}%
Selection: ${context.selection.count} objects
Total objects: ${context.document.objectCount}
Material: ${context.document.material}, ${context.document.thickness}mm
Active tool: ${context.tool}
Project: ${context.project.name}

User request: ${userInput}

Respond with a JSON action plan.`;
}

// ── Helper: Parse JSON from response ─────────────────────────────

function parseActionPlan(text: string): AIActionPlan | null {
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]!) as AIActionPlan;
  } catch {
    return null;
  }
}

// ── Claude Provider ──────────────────────────────────────────────

class ClaudeProvider implements AIProviderInterface {
  async send(prompt: string, context: AIContext, apiKey: string): Promise<AIResponse> {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildUserPrompt(prompt, context) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "No response";
      return { text, plan: parseActionPlan(text) };
    } catch (err: any) {
      return { text: "", plan: null, error: err.message || "Claude API error" };
    }
  }
}

// ── OpenAI Provider ──────────────────────────────────────────────

class OpenAIProvider implements AIProviderInterface {
  async send(prompt: string, context: AIContext, apiKey: string): Promise<AIResponse> {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(prompt, context) },
          ],
          max_tokens: 2048,
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "No response";
      return { text, plan: parseActionPlan(text) };
    } catch (err: any) {
      return { text: "", plan: null, error: err.message || "OpenAI API error" };
    }
  }
}

// ── Gemini Provider ──────────────────────────────────────────────

class GeminiProvider implements AIProviderInterface {
  async send(prompt: string, context: AIContext, apiKey: string): Promise<AIResponse> {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: SYSTEM_PROMPT + "\n\n" + buildUserPrompt(prompt, context) }],
          }],
        }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      return { text, plan: parseActionPlan(text) };
    } catch (err: any) {
      return { text: "", plan: null, error: err.message || "Gemini API error" };
    }
  }
}

// ── DeepSeek Provider ────────────────────────────────────────────

class DeepSeekProvider implements AIProviderInterface {
  async send(prompt: string, context: AIContext, apiKey: string): Promise<AIResponse> {
    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(prompt, context) },
          ],
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "No response";
      return { text, plan: parseActionPlan(text) };
    } catch (err: any) {
      return { text: "", plan: null, error: err.message || "DeepSeek API error" };
    }
  }
}

// ── OpenRouter Provider ──────────────────────────────────────────

class OpenRouterProvider implements AIProviderInterface {
  async send(prompt: string, context: AIContext, apiKey: string): Promise<AIResponse> {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "HTTP-Referer": window.location.origin },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(prompt, context) },
          ],
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "No response";
      return { text, plan: parseActionPlan(text) };
    } catch (err: any) {
      return { text: "", plan: null, error: err.message || "OpenRouter API error" };
    }
  }
}

// ── Provider Factory ─────────────────────────────────────────────

const providerMap: Record<AIProviderId, new () => AIProviderInterface> = {
  claude: ClaudeProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  deepseek: DeepSeekProvider,
  openrouter: OpenRouterProvider,
};

export function createProvider(id: AIProviderId): AIProviderInterface {
  const Provider = providerMap[id];
  if (!Provider) throw new Error(`Unknown provider: ${id}`);
  return new Provider();
}

export function getProviderConfig(id: AIProviderId) {
  return AI_PROVIDERS.find((p) => p.id === id);
}
