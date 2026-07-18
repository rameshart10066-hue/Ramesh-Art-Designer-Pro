"use client";

import { useState } from "react";
import type { DesignGeneratorRequest } from "@ramesh/api-contracts";
import { generateDesign } from "@/services/designGeneratorService";
import { NameplateForm } from "./NameplateForm";
import { FingerJointBoxForm } from "./FingerJointBoxForm";
import { NestingForm } from "./NestingForm";
import { SvgPreview } from "./SvgPreview";

type GeneratorType = DesignGeneratorRequest["type"];

const GENERATOR_LABELS: Record<GeneratorType, string> = {
  nameplate: "Nameplate",
  "finger-joint-box": "Finger-Joint Box",
  nesting: "Nesting",
};

/**
 * Top-level design generator container. Owns which generator tab is
 * active and the request/response cycle; each generator's field state
 * lives inside its own form component so switching tabs doesn't need to
 * merge unrelated field sets into one big state object.
 */
export function DesignGeneratorStudio() {
  const [activeType, setActiveType] = useState<GeneratorType>("nameplate");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate(request: DesignGeneratorRequest) {
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateDesign(request);
      if (result.success) {
        setSvg(result.svg);
      } else {
        setSvg(null);
        setError(result.error);
      }
    } catch {
      setSvg(null);
      setError("Something went wrong generating the design.");
    } finally {
      setIsGenerating(false);
    }
  }

  function switchTab(type: GeneratorType) {
    setActiveType(type);
    setSvg(null);
    setError(null);
  }

  return (
    <div>
      <nav aria-label="Generator type">
        {(Object.keys(GENERATOR_LABELS) as GeneratorType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => switchTab(type)}
            aria-pressed={activeType === type}
          >
            {GENERATOR_LABELS[type]}
          </button>
        ))}
      </nav>

      {activeType === "nameplate" && (
        <NameplateForm onGenerate={handleGenerate} isGenerating={isGenerating} />
      )}
      {activeType === "finger-joint-box" && (
        <FingerJointBoxForm onGenerate={handleGenerate} isGenerating={isGenerating} />
      )}
      {activeType === "nesting" && (
        <NestingForm onGenerate={handleGenerate} isGenerating={isGenerating} />
      )}

      {error && <p role="alert">{error}</p>}

      <SvgPreview svg={svg} />
    </div>
  );
}
