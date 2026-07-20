import { describe, expect, it } from "vitest";
import { PartNumberSequencer } from "../PartNumberSequencer";

describe("PartNumberSequencer", () => {
  it("increments sequentially per category", () => {
    const sequencer = new PartNumberSequencer();
    expect(sequencer.next("NP", 2026)).toBe("NP-2026-0001");
    expect(sequencer.next("NP", 2026)).toBe("NP-2026-0002");
    expect(sequencer.next("NP", 2026)).toBe("NP-2026-0003");
  });

  it("tracks separate counters per category", () => {
    const sequencer = new PartNumberSequencer();
    expect(sequencer.next("NP", 2026)).toBe("NP-2026-0001");
    expect(sequencer.next("BX", 2026)).toBe("BX-2026-0001");
    expect(sequencer.next("NP", 2026)).toBe("NP-2026-0002");
  });

  it("normalizes category code case", () => {
    const sequencer = new PartNumberSequencer();
    sequencer.next("np", 2026);
    expect(sequencer.peek("NP")).toBe(1);
  });

  it("peek returns 0 for a category with no issued numbers", () => {
    const sequencer = new PartNumberSequencer();
    expect(sequencer.peek("BX")).toBe(0);
  });
});
