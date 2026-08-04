"use client";

/**
 * AI Ganpati Designer Panel
 *
 * Natural language → parametric design generation.
 * Prompt input, quick actions, conversation history, favorites, manufacturing.
 */

import { useState, useEffect, useCallback } from "react";
import { useEditorStoreV2 } from "@/stores/editorStoreV2";
import { composeDesign } from "./DesignComposer";
import { planManufacturing } from "./ManufacturingPlanner";
import { conversationMemory } from "./ConversationMemory";
import { aiHistory } from "./AIHistory";
import { catalogLearner } from "./CatalogLearner";
import { QUICK_PROMPTS } from "./PromptTemplates";
import type { DesignResult } from "./DesignComposer";

export function AIDesignerPanel() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [statusText, setStatusText] = useState("Describe your design...");
  const [lastResult, setLastResult] = useState<DesignResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showManufacturing, setShowManufacturing] = useState(false);
  const [mfgData, setMfgData] = useState<any>(null);

  const addObject = useEditorStoreV2((s) => s.addObject);
  const objects = useEditorStoreV2((s) => s.objects);

  // Initialize catalog learner
  useEffect(() => { catalogLearner.initialize(); }, []);

  const generate = useCallback(async (input: string) => {
    if (!input.trim() || status === "generating") return;
    setStatus("generating");
    setStatusText("Generating design...");

    // Use microtask to let UI update
    await new Promise((r) => setTimeout(r, 50));

    try {
      const existingDNA = conversationMemory.getCurrentDNA() || undefined;
      const result = composeDesign(input, existingDNA);

      // Check duplicates
      const duplicate = catalogLearner.isDuplicate(result.dna);
      if (duplicate) {
        setStatusText(`Similar to existing: "${duplicate.name}" — modifying...`);
        await new Promise((r) => setTimeout(r, 300));
      }

      // Add objects to canvas
      for (const comp of result.components) {
        addObject({
          type: comp.type as any,
          name: comp.name,
          x: comp.x,
          y: comp.y,
          width: comp.width,
          height: comp.height,
          fill: comp.params.fill || "#3b82f6",
          stroke: comp.params.stroke || "#1e40af",
          strokeWidth: comp.params.strokeWidth || 2,
          metadata: comp.params,
        } as any);
      }

      // Save to memory
      const turn = conversationMemory.addTurn(input, result);
      aiHistory.save(turn, [result.dna.style, ...input.split(" ").slice(0, 3)]);

      setLastResult(result);
      setShowManufacturing(false);
      setMfgData(null);
      setStatus("success");
      setStatusText(`Generated ${result.components.length} components in ${result.elapsed}ms`);
    } catch (err: any) {
      setStatus("error");
      setStatusText(err.message || "Generation failed");
    }
  }, [status, addObject]);

  function handleQuickPrompt(qp: typeof QUICK_PROMPTS[number]) {
    setPrompt(qp.prompt);
    generate(qp.prompt);
  }

  function handleUndo() {
    const prev = conversationMemory.undo();
    if (prev) {
      setLastResult(prev.result);
      setStatusText(`Reverted to "${prev.prompt.slice(0, 40)}..."`);
    }
  }

  function handleRedo() {
    const next = conversationMemory.redo();
    if (next) {
      setLastResult(next.result);
      setStatusText(`Redone to "${next.prompt.slice(0, 40)}..."`);
    }
  }

  function handleManufacturing() {
    if (!lastResult) return;
    const mfg = planManufacturing(lastResult.components);
    setMfgData(mfg);
    setShowManufacturing(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontSize: 13, overflow: "hidden" }}>
      {/* Status */}
      <div style={{
        padding: "8px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 8,
        borderBottom: "1px solid #1e293b",
        background: status === "error" ? "rgba(239,68,68,0.1)" : status === "success" ? "rgba(34,197,94,0.1)" : "transparent",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", display: "inline-block",
          background: status === "generating" ? "#fbbf24" : status === "success" ? "#22c55e" : status === "error" ? "#ef4444" : "#64748b",
        }} />
        <span style={{ color: "#94a3b8" }}>{statusText}</span>
        {lastResult && <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>{lastResult.elapsed}ms</span>}
      </div>

      {/* Quick prompts */}
      <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid #1e293b", flexWrap: "wrap" }}>
        {QUICK_PROMPTS.slice(0, 6).map((qp) => (
          <button key={qp.id} onClick={() => handleQuickPrompt(qp)} disabled={status === "generating"} title={qp.prompt}
            style={{ padding: "4px 8px", fontSize: 10, borderRadius: 4, border: "1px solid #334155", background: "#1f2937", color: "#e2e8f0", cursor: status === "generating" ? "not-allowed" : "pointer", opacity: status === "generating" ? 0.5 : 1 }}>
            {qp.icon} {qp.label}
          </button>
        ))}
      </div>

      {/* Undo/Redo + Actions */}
      <div style={{ display: "flex", gap: 4, padding: "6px 12px", borderBottom: "1px solid #1e293b" }}>
        <button onClick={handleUndo} disabled={!conversationMemory.canUndo} style={smallBtn}>↩ Undo</button>
        <button onClick={handleRedo} disabled={!conversationMemory.canRedo} style={smallBtn}>↪ Redo</button>
        <button onClick={() => setShowHistory(!showHistory)} style={smallBtn}>📋 History</button>
        {lastResult && <button onClick={handleManufacturing} style={smallBtn}>🏭 Mfg</button>}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 12px" }}>
        {/* Validation */}
        {lastResult && !lastResult.validation.valid && (
          <div style={{ marginBottom: 8, padding: "8px 10px", background: "rgba(239,68,68,0.1)", borderRadius: 6, fontSize: 11, color: "#fca5a5" }}>
            {lastResult.validation.issues.map((issue, i) => <div key={i}>⚠ {issue}</div>)}
          </div>
        )}
        {lastResult && lastResult.validation.warnings.length > 0 && (
          <div style={{ marginBottom: 8, padding: "8px 10px", background: "rgba(251,191,36,0.1)", borderRadius: 6, fontSize: 11, color: "#fcd34d" }}>
            {lastResult.validation.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
          </div>
        )}

        {/* DNA Summary */}
        {lastResult && (
          <div style={{ marginBottom: 8, padding: "8px 10px", background: "#1e293b", borderRadius: 6, fontSize: 11 }}>
            <div style={{ color: "#94a3b8", marginBottom: 4 }}>Design DNA</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: "#60a5fa" }}>Style: {lastResult.dna.style}</span>
              <span style={{ color: "#f5c6ec" }}>Arch: {lastResult.dna.arch}</span>
              <span style={{ color: "#fcd34d" }}>Pillar: {lastResult.dna.pillar}</span>
              <span style={{ color: "#6ee7b7" }}>Parts: {lastResult.components.length}</span>
            </div>
          </div>
        )}

        {/* History */}
        {showHistory && (
          <div>
            <h4 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px" }}>Design History</h4>
            {aiHistory.getAll().map((entry) => (
              <div key={entry.id} style={{ padding: "6px 8px", background: "#1e293b", borderRadius: 4, marginBottom: 4, fontSize: 11, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#e2e8f0" }}>{entry.prompt.slice(0, 50)}</span>
                <button onClick={() => aiHistory.toggleFavorite(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>{entry.favorite ? "★" : "☆"}</button>
              </div>
            ))}
          </div>
        )}

        {/* Manufacturing */}
        {showManufacturing && mfgData && (
          <div>
            <h4 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px" }}>Manufacturing Estimate</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 8 }}>
              <Info label="Sheets" value={String(mfgData.sheetCount)} />
              <Info label="Parts" value={String(mfgData.parts.length)} />
              <Info label="Material Cost" value={mfgData.cost.formatted.materialCost} />
              <Info label="Total Cost" value={mfgData.cost.formatted.total} />
              <Info label="Machine Time" value={`${mfgData.totalTime} min`} />
              <Info label="Joints" value={String(mfgData.joints.length)} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid #1e293b", display: "flex", gap: 6 }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(prompt); } }}
          placeholder='e.g. "Create a royal palace with lotus border"'
          disabled={status === "generating"}
          style={{ flex: 1, padding: "8px 10px", fontSize: 12, borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "white", outline: "none" }}
        />
        <button
          onClick={() => generate(prompt)}
          disabled={status === "generating" || !prompt.trim()}
          style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: status === "generating" ? "#475569" : "#3b82f6", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: !prompt.trim() ? 0.5 : 1 }}
        >
          {status === "generating" ? "..." : "Generate"}
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div style={{ padding: "4px 8px", background: "#1e293b", borderRadius: 4, fontSize: 11 }}><div style={{ color: "#64748b" }}>{label}</div><div style={{ color: "#e2e8f0", fontWeight: 600 }}>{value}</div></div>;
}

const smallBtn: React.CSSProperties = {
  padding: "4px 8px", fontSize: 10, borderRadius: 4, border: "1px solid #334155", background: "#1f2937", color: "#94a3b8", cursor: "pointer",
};
