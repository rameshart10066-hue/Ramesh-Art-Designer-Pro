import { useState } from "react";
import type { FingerJointBoxGeneratorRequest } from "@ramesh/api-contracts";

interface FingerJointBoxFormProps {
  onGenerate: (request: FingerJointBoxGeneratorRequest) => void;
  isGenerating: boolean;
}

export function FingerJointBoxForm({ onGenerate, isGenerating }: FingerJointBoxFormProps) {
  const [widthMm, setWidthMm] = useState(150);
  const [depthMm, setDepthMm] = useState(100);
  const [heightMm, setHeightMm] = useState(60);
  const [materialThicknessMm, setMaterialThicknessMm] = useState(3);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate({
          type: "finger-joint-box",
          widthMm,
          depthMm,
          heightMm,
          materialThicknessMm,
        });
      }}
    >
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
        Depth (mm)
        <input
          type="number"
          value={depthMm}
          onChange={(e) => setDepthMm(Number(e.target.value))}
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
        Material thickness (mm)
        <input
          type="number"
          step="0.1"
          value={materialThicknessMm}
          onChange={(e) => setMaterialThicknessMm(Number(e.target.value))}
          min={0.1}
          required
        />
      </label>
      <button type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating…" : "Generate Box"}
      </button>
    </form>
  );
}
