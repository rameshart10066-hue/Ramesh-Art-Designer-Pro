/**
 * Vision History
 *
 * Persists photo-to-CAD conversion history with detected components,
 * DNA, and confidence scores. Enables catalog learning over time.
 */

export interface VisionRecord {
  id: string;
  timestamp: number;
  imageName: string;
  detectedCount: number;
  matchedCount: number;
  overallConfidence: number;
  dna: any;
  componentTypes: string[];
  successful: boolean;
}

const STORAGE_KEY = "ramesh-vision-history";

export class VisionHistory {
  private records: VisionRecord[] = [];
  private recordId = 1;

  constructor() {
    this.load();
  }

  add(record: Omit<VisionRecord, "id" | "timestamp">): VisionRecord {
    const entry: VisionRecord = {
      id: `vision-${this.recordId++}`,
      timestamp: Date.now(),
      ...record,
    };
    this.records.unshift(entry);
    if (this.records.length > 50) this.records = this.records.slice(0, 50);
    this.persist();
    return entry;
  }

  getAll(): VisionRecord[] { return this.records; }

  getRecent(limit: number = 10): VisionRecord[] { return this.records.slice(0, limit); }

  getSuccessful(): VisionRecord[] { return this.records.filter((r) => r.successful); }

  clear(): void { this.records = []; this.persist(); }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.records = JSON.parse(raw);
    } catch {}
  }

  private persist(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records)); } catch {}
  }

  get size(): number { return this.records.length; }
}

export const visionHistory = new VisionHistory();
