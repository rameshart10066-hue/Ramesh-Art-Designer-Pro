export interface PartNumberInput {
  /** e.g. "NP" for nameplate, "BX" for box — kept short by convention, not enforced. */
  categoryCode: string;
  sequence: number;
  year?: number;
  /** Digits to zero-pad the sequence to. Defaults to 4 (e.g. 0001). */
  sequenceDigits?: number;
}

const DEFAULT_SEQUENCE_DIGITS = 4;

/**
 * Pure formatter: {CATEGORY}-{YEAR}-{SEQUENCE}, e.g. "NP-2026-0001".
 * Takes `sequence` and `year` as inputs rather than generating them
 * itself, so the numbering scheme is trivially testable without needing
 * to fake the clock or a counter — see PartNumberSequencer for the
 * stateful part.
 */
export function generatePartNumber(input: PartNumberInput): string {
  if (!input.categoryCode.trim()) {
    throw new Error("Category code must not be empty.");
  }
  if (!Number.isInteger(input.sequence) || input.sequence < 1) {
    throw new Error("Sequence must be a positive integer.");
  }

  const year = input.year ?? new Date().getFullYear();
  const digits = input.sequenceDigits ?? DEFAULT_SEQUENCE_DIGITS;
  const paddedSequence = String(input.sequence).padStart(digits, "0");

  return `${input.categoryCode.trim().toUpperCase()}-${year}-${paddedSequence}`;
}
