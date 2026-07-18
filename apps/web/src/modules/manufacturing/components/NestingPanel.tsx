import { useState } from "react";
import type { MaterialProfile, NestingResponse } from "@ramesh/api-contracts";
import { runNesting } from "@/services/manufacturingService";
import { MaterialProfileSelect } from "./MaterialProfileSelect";

interface ShapeInput {
  id: string;
  widthMm: number;
  heightMm: number;
}

let nextShapeId = 1;

interface NestingPanelProps {
  profiles: MaterialProfile[];
}

export function NestingPanel({ profiles }: NestingPanelProps) {
  const [shapes, setShapes] = useState<ShapeInput[]>([
    { id: "part-1", widthMm: 30, heightMm: 20 },
    { id: "part-2", widthMm: 30, heightMm: 20 },
  ]);
  const [sheetWidthMm, setSheetWidthMm] = useState(300);
  const [sheetHeightMm, setSheetHeightMm] = useState(200);
  const [materialProfileId, setMaterialProfileId] = useState(profiles[0]?.id ?? "");
  const [result, setResult] = useState<NestingResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  function addShape() {
    nextShapeId += 1;
    setShapes((current) => [...current, { id: `part-${nextShapeId}`, widthMm: 30, heightMm: 20 }]);
  }

  function removeShape(id: string) {
    setShapes((current) => current.filter((s) => s.id !== id));
  }

  function updateShape(id: string, field: "widthMm" | "heightMm", value: number) {
    setShapes((current) => current.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsRunning(true);
    try {
      const response = await runNesting({
        parts: shapes,
        sheetWidthMm,
        sheetHeightMm,
        materialProfileId,
      });
      setResult(response);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Parts</legend>
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
              <button type="button" onClick={() => removeShape(shape.id)} disabled={shapes.length <= 1}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addShape}>
            Add part
          </button>
        </fieldset>

        <label>
          Sheet width (mm)
          <input
            type="number"
            value={sheetWidthMm}
            onChange={(e) => setSheetWidthMm(Number(e.target.value))}
            min={1}
          />
        </label>
        <label>
          Sheet height (mm)
          <input
            type="number"
            value={sheetHeightMm}
            onChange={(e) => setSheetHeightMm(Number(e.target.value))}
            min={1}
          />
        </label>

        <MaterialProfileSelect profiles={profiles} value={materialProfileId} onChange={setMaterialProfileId} />

        <button type="submit" disabled={isRunning || shapes.length === 0}>
          {isRunning ? "Nesting…" : "Run Nesting"}
        </button>
      </form>

      {result && !result.success && <p role="alert">{result.error}</p>}

      {result?.success && (
        <div>
          <p>
            Sheets used: {result.sheetsUsed} — spacing applied: {result.appliedSpacingMm.toFixed(2)}mm
          </p>
          <table>
            <thead>
              <tr>
                <th>Part</th>
                <th>Sheet</th>
                <th>X</th>
                <th>Y</th>
              </tr>
            </thead>
            <tbody>
              {result.placements.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.sheetIndex + 1}</td>
                  <td>{p.x.toFixed(1)}</td>
                  <td>{p.y.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
