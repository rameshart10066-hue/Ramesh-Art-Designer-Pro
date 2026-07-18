"use client";

import { useEffect, useState } from "react";
import type { ManufacturingGenerateRequest, MaterialProfile } from "@ramesh/api-contracts";
import { generateManufacturingOutput, getMaterialProfiles } from "@/services/manufacturingService";
import { GenerateOutputForm } from "./GenerateOutputForm";
import { OutputPreview } from "./OutputPreview";
import { NestingPanel } from "./NestingPanel";
import { PartNumberPanel } from "./PartNumberPanel";

type Tab = "generate" | "nesting" | "part-numbering";

const TAB_LABELS: Record<Tab, string> = {
  generate: "Generate (SVG/DXF)",
  nesting: "Nesting",
  "part-numbering": "Part Numbering",
};

/**
 * Top-level manufacturing container. Fetches the material profile catalog
 * once (shared by the Generate and Nesting tabs) and owns which tab is
 * active; each tab's own state lives in its own component.
 */
export function ManufacturingStudio() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [profiles, setProfiles] = useState<MaterialProfile[]>([]);
  const [output, setOutput] = useState<{ format: "svg" | "dxf"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getMaterialProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([]));
  }, []);

  async function handleGenerate(request: ManufacturingGenerateRequest) {
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateManufacturingOutput(request);
      if (result.success) {
        setOutput({ format: result.format, text: result.output });
      } else {
        setOutput(null);
        setError(result.error);
      }
    } catch {
      setOutput(null);
      setError("Something went wrong generating the output.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <nav aria-label="Manufacturing section">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>

      {activeTab === "generate" && (
        <>
          <GenerateOutputForm
            profiles={profiles}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
          {error && <p role="alert">{error}</p>}
          <OutputPreview format={output?.format ?? null} output={output?.text ?? null} />
        </>
      )}

      {activeTab === "nesting" && <NestingPanel profiles={profiles} />}

      {activeTab === "part-numbering" && <PartNumberPanel />}
    </div>
  );
}
