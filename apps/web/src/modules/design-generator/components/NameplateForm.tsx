import { useState } from "react";
import type { NameplateGeneratorRequest } from "@ramesh/api-contracts";

interface NameplateFormProps {
  onGenerate: (request: NameplateGeneratorRequest) => void;
  isGenerating: boolean;
}

export function NameplateForm({ onGenerate, isGenerating }: NameplateFormProps) {
  const [text, setText] = useState("Your Name Here");
  const [widthMm, setWidthMm] = useState(120);
  const [heightMm, setHeightMm] = useState(40);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate({ type: "nameplate", text, widthMm, heightMm });
      }}
    >
      <label>
        Text
        <input value={text} onChange={(e) => setText(e.target.value)} required />
      </label>
      <label>
        Width (mm)
        <input
          type="number"
          value={widthMm}
          onChange={(e) => setWidthMm(Number(e.target.value))}
          min={1}
          required
        />
      </label>
      <label>
        Height (mm)
        <input
          type="number"
          value={heightMm}
          onChange={(e) => setHeightMm(Number(e.target.value))}
          min={1}
          required
        />
      </label>
      <button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating…" : "Generate Nameplate"}
      </button>
    </form>
  );
}
