/**
 * AI Studio — Types
 *
 * Provider interface, action types, context schema, conversation history.
 */

// ── Providers ────────────────────────────────────────────────────

export type AIProviderId = "claude" | "openai" | "gemini" | "deepseek" | "openrouter";

export interface AIProviderConfig {
  id: AIProviderId;
  label: string;
  apiEndpoint: string;
  model: string;
  apiKeyEnv: string;
  requiresKey: boolean;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
  { id: "claude",     label: "Claude",     apiEndpoint: "https://api.anthropic.com/v1/messages",         model: "claude-sonnet-4-20250514",        apiKeyEnv: "ANTHROPIC_API_KEY", requiresKey: true },
  { id: "openai",     label: "OpenAI",     apiEndpoint: "https://api.openai.com/v1/chat/completions",    model: "gpt-4o",                          apiKeyEnv: "OPENAI_API_KEY",     requiresKey: true },
  { id: "gemini",     label: "Gemini",     apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", model: "gemini-2.0-flash", apiKeyEnv: "GEMINI_API_KEY", requiresKey: true },
  { id: "deepseek",   label: "DeepSeek",   apiEndpoint: "https://api.deepseek.com/v1/chat/completions",  model: "deepseek-chat",                   apiKeyEnv: "DEEPSEEK_API_KEY",   requiresKey: true },
  { id: "openrouter", label: "OpenRouter", apiEndpoint: "https://openrouter.ai/api/v1/chat/completions", model: "anthropic/claude-3.5-sonnet",      apiKeyEnv: "OPENROUTER_API_KEY", requiresKey: true },
];

// ── Actions ──────────────────────────────────────────────────────

export type AIActionType =
  | "create"
  | "move"
  | "delete"
  | "duplicate"
  | "resize"
  | "rotate"
  | "group"
  | "ungroup"
  | "align"
  | "split"
  | "nest"
  | "export";

export interface AIAction {
  action: AIActionType;
  object?: string;
  targetId?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  name?: string;
  metadata?: Record<string, any>;
}

export interface AIActionPlan {
  summary: string;
  actions: AIAction[];
}

// ── Context ──────────────────────────────────────────────────────

export interface AIContext {
  canvas: {
    width: number;
    height: number;
    zoom: number;
  };
  selection: {
    count: number;
    objects: { id: number; type: string; name: string; x: number; y: number; width: number; height: number }[];
  };
  document: {
    objectCount: number;
    layerCount: number;
    material: string;
    thickness: number;
  };
  tool: string;
  project: {
    name: string;
    designName: string;
  };
}

// ── Conversation ─────────────────────────────────────────────────

export interface ConversationEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: AIAction[];
  timestamp: number;
  status?: "processing" | "success" | "error";
}

// ── Response ─────────────────────────────────────────────────────

export interface AIResponse {
  text: string;
  plan: AIActionPlan | null;
  error?: string;
}

export interface AIProviderInterface {
  send(prompt: string, context: AIContext, apiKey: string): Promise<AIResponse>;
}
