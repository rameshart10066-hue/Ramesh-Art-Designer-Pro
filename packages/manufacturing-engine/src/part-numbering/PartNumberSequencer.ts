import { generatePartNumber } from "./generatePartNumber";

/**
 * Tracks the next sequence number per category code, in memory.
 *
 * This resets on process restart — acceptable for now since there's no
 * Part/Product table in packages/database yet to persist counters
 * against. Swap the internal Map for a database-backed counter (e.g. a
 * `PartSequence` row per category with an atomic increment) once that
 * table exists; the public next()/peek() interface won't need to change.
 */
export class PartNumberSequencer {
  private readonly counters = new Map<string, number>();

  /** Returns the next part number for a category and advances its counter. */
  next(categoryCode: string, year?: number): string {
    const normalized = categoryCode.trim().toUpperCase();
    const nextSequence = (this.counters.get(normalized) ?? 0) + 1;
    this.counters.set(normalized, nextSequence);
    return generatePartNumber({ categoryCode: normalized, sequence: nextSequence, ...(year !== undefined ? { year } : {}) });
  }

  /** Returns the current count for a category without advancing it (0 if none issued yet). */
  peek(categoryCode: string): number {
    return this.counters.get(categoryCode.trim().toUpperCase()) ?? 0;
  }
}
