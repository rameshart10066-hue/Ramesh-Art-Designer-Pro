import { useState } from "react";
import { generatePartNumber } from "@/services/manufacturingService";

export function PartNumberPanel() {
  const [categoryCode, setCategoryCode] = useState("NP");
  const [history, setHistory] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const { partNumber } = await generatePartNumber(categoryCode);
      setHistory((current) => [partNumber, ...current]);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Category code
          <input
            value={categoryCode}
            onChange={(e) => setCategoryCode(e.target.value)}
            placeholder="e.g. NP, BX, CS"
            required
          />
        </label>
        <button type="submit" disabled={isGenerating || !categoryCode.trim()}>
          {isGenerating ? "Generating…" : "Generate Part Number"}
        </button>
      </form>

      {history.length > 0 && (
        <ul>
          {history.map((partNumber, index) => (
            <li key={`${partNumber}-${index}`}>{partNumber}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
