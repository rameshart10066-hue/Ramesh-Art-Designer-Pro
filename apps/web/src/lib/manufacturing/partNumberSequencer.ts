import { PartNumberSequencer } from "@ramesh/manufacturing-engine";

// Same globalThis-caching pattern as packages/database's db singleton —
// avoids creating a new sequencer (and losing counts) on every hot reload
// in development.
const globalForSequencer = globalThis as unknown as { partNumberSequencer?: PartNumberSequencer };

export const partNumberSequencer: PartNumberSequencer =
  globalForSequencer.partNumberSequencer ?? new PartNumberSequencer();

if (process.env.NODE_ENV !== "production") {
  globalForSequencer.partNumberSequencer = partNumberSequencer;
}
