import { useState } from "react";
import type { NestingGeneratorRequest } from "@ramesh/api-contracts";

interface NestingFormProps {
  onGenerate: (request: NestingGeneratorRequest) => void;
  isGenerating: boolean;
}

interface ShapeInput {
  id: string;
  widthMm: number;
  heightMm: number;
}

let nextShapeId = 1;

export function NestingForm({ onGenerate, isGenerating }: NestingFormProps) {
  const [shapes, setShapes] = useState<ShapeInput[]>([
    { id: "shape-1", widthMm: 30, heightMm: 20 },
    { id: "shape-2", widthMm: 30, heightMm: 20 },
  ]);
  const [sheetWidthMm, setSheetWidthMm] = useState(300);
  const [sheetHeightMm, setSheetHeightMm] = useState(200);

  function updateShape(id: string, field: "widthMm" | "heightMm", value: number) {
    setShapes((current) => current.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function addShape() {
    nextShapeId += 1;
    setShapes((current) => [
      ...current,
      { id: `shape-${nextShapeId}`, widthMm: 30, heightMm: 20 },
    ]);
  }

  function removeShape(id: string) {
    setShapes((current) => current.filter((s) => s.id !== id));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onGenerate({
          type: "nesting",
          shapes: shapes.map(({ id, widthMm, heightMm }) => ({ id, widthMm, heightMm })),
          sheetWidthMm,
          sheetHeightMm,
        });
      }}
    >
      <fieldset>
        <legend>Shapes</legend>
        {shapes.map((shape) => (
          <div key={shape.id}>
            <input
              type="number"
              aria-label={`${shape.id} width`}
              value={shape.widthMm}
              onChange={(e) => updateShape(shape.id, "widthMm", Number(e.target.value))}
              min={1}
            />
            ×
            <input
              type="number"
              aria-label={`${shape.id} height`}
              value={shape.heightMm}
              onChange={(e) => updateShape(shape.id, "heightMm", Number(e.target.value))}
              min={1}
            />
            <button
              type="button"
              onClick={() => removeShape(shape.id)}
              disabled={shapes.length <= 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addShape}>
          Add shape
        </button>
      </fieldset>

      <label>
        Sheet width (mm)
        <input
          type="number"
          value={sheetWidthMm}
          onChange={(e) => setSheetWidthMm(Number(e.target.value))}
          min={1}
          required
        />
      </label>
      <label>
        Sheet height (mm)
        <input
          type="number"
          value={sheetHeightMm}
          onChange={(e) => setSheetHeightMm(Number(e.target.value))}
          min={1}
          required
        />
      </label>

      <button type="submit" disabled={isGenerating || shapes.length === 0}>
        {isGenerating ? "Generating…" : "Generate Nesting Layout"}
      </button>
    </form>
  );
}
