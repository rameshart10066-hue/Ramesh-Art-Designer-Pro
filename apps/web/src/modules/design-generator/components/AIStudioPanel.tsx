"use client";

/**
 * AI Studio Panel
 *
 * Prompt input, generate/edit/optimize/manufacturing buttons,
 * conversation history, status indicator, provider selector.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { useManufacturingStore } from "@/stores/manufacturingStore";
import { createProvider } from "@/services/ai/providers";
import { buildContext } from "@/services/ai/contextBuilder";
import { executeActionPlan } from "@/services/ai/actionExecutor";
import type { AIProviderId, ConversationEntry, AIAction } from "@/types/ai";
import { AI_PROVIDERS } from "@/types/ai";

const STORAGE_KEY = "ramesh-ai-history";
const API_KEY_STORAGE = "ramesh-ai-keys";

function loadHistory(): ConversationEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveHistory(entries: ConversationEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-50))); } catch {}
}

function loadApiKeys(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(API_KEY_STORAGE) || "{}"); } catch { return {}; }
}

function saveApiKeys(keys: Record<string, string>) {
  try { localStorage.setItem(API_KEY_STORAGE, JSON.stringify(keys)); } catch {}
}

let convId = 1;

export function AIStudioPanel() {
  const [provider, setProvider] = useState<AIProviderId>("claude");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [statusText, setStatusText] = useState("Ready");
  const [history, setHistory] = useState<ConversationEntry[]>(loadHistory);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(loadApiKeys);
  const [showKeys, setShowKeys] = useState(false);

  const historyRef = useRef<HTMLDivElement>(null);

  // Store access
  const objects = useEditorStoreV2((s) => s.objects);
  const selectedIds = useEditorStoreV2((s) => s.selectedIds);
  const zoom = useEditorStoreV2((s) => s.zoom);
  const activeTool = useEditorStoreV2((s) => s.activeTool);
  const addObject = useEditorStoreV2((s) => s.addObject);
  const removeObject = useEditorStoreV2((s) => s.removeObject);
  const updateObject = useEditorStoreV2((s) => s.updateObject);
  const duplicateObject = useEditorStoreV2((s) => s.duplicateObject);
  const startBatch = useEditorStoreV2((s) => s.startBatch);
  const endBatch = useEditorStoreV2((s) => s.endBatch);
  const runNesting = useManufacturingStore((s) => s.runNestingFromObjects);

  // Auto-scroll history
  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history]);

  // Executor dependencies
  const executorDeps = {
    getObjects: () => useEditorStoreV2.getState().objects,
    getSelectedIds: () => useEditorStoreV2.getState().selectedIds,
    addObject, removeObject, updateObject, duplicateObject,
    startBatch, endBatch,
    runNesting: () => runNesting(objects, 1, "Thermocol", 12),
  };

  // Add conversation entry
  const addEntry = useCallback((role: "user" | "assistant", text: string, actions?: AIAction[], entryStatus?: ConversationEntry["status"]) => {
    const entry = {
      id: `conv-${convId++}`,
      role, text, actions, timestamp: Date.now(),
      ...(entryStatus !== undefined ? { status: entryStatus } : {}),
    } as ConversationEntry;
    setHistory((prev) => {
      const updated = [...prev, entry];
      saveHistory(updated);
      return updated;
    });
  }, []);

  // Send prompt to AI
  const sendPrompt = useCallback(async (userPrompt: string) => {
    if (!userPrompt.trim() || status === "processing") return;

    const apiKey = apiKeys[provider];
    if (!apiKey) {
      setStatus("error");
      setStatusText("API key required — set in Settings");
      return;
    }

    addEntry("user", userPrompt);
    setPrompt("");
    setStatus("processing");
    setStatusText(`Sending to ${provider}...`);

    try {
      const ctx = buildContext(objects, selectedIds, zoom, activeTool, "Project", "Design");
      const providerInstance = createProvider(provider);
      const response = await providerInstance.send(userPrompt, ctx, apiKey);

      if (response.error) {
        setStatus("error");
        setStatusText(response.error);
        addEntry("assistant", `Error: ${response.error}`, undefined, "error");
        return;
      }

      if (response.plan && response.plan.actions.length > 0) {
        const result = await executeActionPlan(response.plan.actions, executorDeps);
        setStatus("success");
        setStatusText(`${result.succeeded} actions executed`);
        addEntry("assistant", response.text || response.plan.summary, response.plan.actions, "success");
      } else {
        setStatus("success");
        setStatusText("Response received (no actions)");
        addEntry("assistant", response.text || "No response", undefined, "success");
      }
    } catch (err: any) {
      setStatus("error");
      setStatusText(err.message || "Unknown error");
      addEntry("assistant", `Error: ${err.message}`, undefined, "error");
    }
  }, [provider, apiKeys, objects, selectedIds, zoom, activeTool, addEntry, executorDeps, status]);

  // Quick action handlers
  const quickActions: { label: string; prompt: string; icon: string }[] = [
    { label: "Generate", icon: "✨", prompt: "Generate a new design with a mandap in the center, flanked by two pillars, with a lotus base." },
    { label: "Edit", icon: "✏️", prompt: "Edit the selected object to make it more decorative. Increase its size by 20% and add ornamentation." },
    { label: "Optimize", icon: "⚡", prompt: "Optimize the layout of all objects. Suggest better arrangement for material efficiency." },
    { label: "Manufacturing", icon: "🏭", prompt: "Prepare the current design for manufacturing. Run nesting, estimate materials, and generate a cut plan." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontSize: 13 }}>
      {/* Status Bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
        borderBottom: "1px solid #1e293b", fontSize: 12,
        background: status === "error" ? "rgba(239,68,68,0.1)" : status === "success" ? "rgba(34,197,94,0.1)" : "transparent",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: status === "processing" ? "#fbbf24" : status === "success" ? "#22c55e" : status === "error" ? "#ef4444" : "#64748b",
        }} />
        <span style={{ color: "#94a3b8" }}>{statusText}</span>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid #1e293b", flexWrap: "wrap" }}>
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            onClick={() => sendPrompt(qa.prompt)}
            disabled={status === "processing"}
            style={{
              padding: "6px 10px", fontSize: 11, borderRadius: 6, border: "1px solid #334155",
              background: "#1f2937", color: "#e2e8f0", cursor: status === "processing" ? "not-allowed" : "pointer",
              opacity: status === "processing" ? 0.5 : 1, display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <span>{qa.icon}</span>
            <span>{qa.label}</span>
          </button>
        ))}
      </div>

      {/* Provider Selector */}
      <div style={{ display: "flex", gap: 4, padding: "6px 12px", borderBottom: "1px solid #1e293b", flexWrap: "wrap" }}>
        {AI_PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => setProvider(p.id)}
            style={{
              padding: "3px 8px", fontSize: 10, borderRadius: 4, border: "none",
              background: provider === p.id ? "#1e3a8a" : "#1f2937",
              color: provider === p.id ? "#60a5fa" : "#94a3b8",
              cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowKeys(!showKeys)}
          style={{ padding: "3px 8px", fontSize: 10, borderRadius: 4, border: "none", background: "#1f2937", color: "#64748b", cursor: "pointer", marginLeft: "auto" }}
        >
          🔑
        </button>
      </div>

      {/* API Key Input (collapsible) */}
      {showKeys && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 4 }}>
          {AI_PROVIDERS.map((p) => (
            <label key={p.id} style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ minWidth: 60 }}>{p.label}</span>
              <input
                type="password"
                value={apiKeys[p.id] || ""}
                onChange={(e) => {
                  const newKeys = { ...apiKeys, [p.id]: e.target.value };
                  setApiKeys(newKeys);
                  saveApiKeys(newKeys);
                }}
                placeholder={`${p.id} API key`}
                style={{ flex: 1, padding: "4px 6px", fontSize: 11, borderRadius: 4, border: "1px solid #374151", background: "#1f2937", color: "white" }}
              />
            </label>
          ))}
        </div>
      )}

      {/* Conversation History */}
      <div ref={historyRef} style={{ flex: 1, overflow: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {history.length === 0 && (
          <div style={{ color: "#475569", fontSize: 12, textAlign: "center", padding: 20 }}>
            Ask AI to generate, edit, or optimize your design
          </div>
        )}
        {history.map((entry) => (
          <div key={entry.id} style={{
            padding: "8px 10px", borderRadius: 8,
            background: entry.role === "user" ? "#1e293b" : "#0f172a",
            borderLeft: entry.role === "assistant" ? "2px solid #3b82f6" : "2px solid #475569",
          }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>
              {entry.role === "user" ? "You" : "AI"} · {new Date(entry.timestamp).toLocaleTimeString()}
              {entry.status === "error" && <span style={{ color: "#ef4444", marginLeft: 8 }}>⚠ Error</span>}
            </div>
            <div style={{ fontSize: 12, color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {entry.text.length > 200 ? entry.text.slice(0, 200) + "..." : entry.text}
            </div>
            {entry.actions && entry.actions.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 10, color: "#22c55e" }}>
                ✓ {entry.actions.length} action{entry.actions.length > 1 ? "s" : ""} executed
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Prompt Input */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid #1e293b", display: "flex", gap: 6 }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendPrompt(prompt); } }}
          placeholder="Ask AI to design, edit, or optimize..."
          disabled={status === "processing"}
          style={{
            flex: 1, padding: "8px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #374151",
            background: "#1f2937", color: "white", outline: "none",
          }}
        />
        <button
          onClick={() => sendPrompt(prompt)}
          disabled={status === "processing" || !prompt.trim()}
          style={{
            padding: "8px 14px", borderRadius: 6, border: "none",
            background: status === "processing" ? "#475569" : "#3b82f6",
            color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer",
            opacity: !prompt.trim() ? 0.5 : 1,
          }}
        >
          {status === "processing" ? "..." : "Send"}
        </button>
      </div>

      {/* Clear button */}
      {history.length > 0 && (
        <button
          onClick={() => { setHistory([]); localStorage.removeItem(STORAGE_KEY); }}
          style={{ padding: "6px", fontSize: 10, border: "none", background: "transparent", color: "#475569", cursor: "pointer" }}
        >
          Clear history
        </button>
      )}
    </div>
  );
}
