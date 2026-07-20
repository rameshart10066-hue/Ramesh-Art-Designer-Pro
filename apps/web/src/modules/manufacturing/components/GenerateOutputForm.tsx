import { useState } from "react";
import type { CutPathInput, ManufacturingGenerateRequest, MaterialProfile } from "@ramesh/api-contracts";
import { MaterialProfileSelect } from "./MaterialProfileSelect";

interface GenerateOutputFormProps {
  profiles: MaterialProfile[];
  onGenerate: (request: ManufacturingGenerateRequest) => void;
  isGenerating: boolean;
}

/**
 * Generates a simple rectangular cut path (with an optional centered
 * engrave label) as either SVG or DXF. A full arbitrary-path editor is
 * out of scope here — this exercises the SVG/DXF generators end-to-end
 * with realistic input without building a full path editor UI.
 */
export function GenerateOutputForm({ profiles, onGenerate, isGenerating }: GenerateOutputFormProps) {
  const [format, setFormat] = useState<"svg" | "dxf">("svg");
  const [widthMm, setWidthMm] = useState(100);
  const [heightMm, setHeightMm] = useState(60);
  const [label, setLabel] = useState("");
  const [materialProfileId, setMaterialProfileId] = useState(profiles[0]?.id ?? "");

  function buildRectanglePath(): CutPathInput {
    return {
      points: [
        { x: 0, y: 0 },
        { x: widthMm, y: 0 },
        { x: widthMm, y: heightMm },
        { x: 0, y: heightMm },
      ],
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cutPaths = [buildRectanglePath()];
    const engraveText = label.trim()
      ? [{ x: widthMm / 2, y: heightMm / 2, text: label.trim() }]
      : [];

    if (format === "svg") {
      onGenerate({
        type: "svg",
        widthMm,
        heightMm,
        cutPaths,
        ...(engraveText.length ? { engraveTexts: engraveText } : {}),
        materialProfileId,
      });
    } else {
      onGenerate({
        type: "dxf",
        cutPaths,
        ...(engraveText.length ? { texts: engraveText } : {}),
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Output format</legend>
        <label>
          <input
            type="radio"
            name="format"
            checked={format === "svg"}
            onChange={() => setFormat("svg")}
          />
          SVG
        </label>
        <label>
          <input
            type="radio"
            name="format"
            checked={format === "dxf"}
            onChange={() => setFormat("dxf")}
          />
          DXF
        </label>
      </fieldset>

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
      <label>
        Engrave label (optional)
        <input value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>

      {format === "svg" && (
        <MaterialProfileSelect
          profiles={profiles}
          value={materialProfileId}
          onChange={setMaterialProfileId}
        />
      )}

      <button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating…" : `Generate ${format.toUpperCase()}`}
      </button>
    </form>
  );
}
