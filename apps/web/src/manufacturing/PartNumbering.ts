/**
 * Part Numbering System
 *
 * Auto-numbers every part as P001, P002, P003...
 * Maintains numbering after nesting and re-ordering.
 */

let counter = 1;
const numberMap = new Map<number, string>();

export function resetNumbering(): void {
  counter = 1;
  numberMap.clear();
}

export function assignPartNumber(id: number, prefix: string = "P"): string {
  if (numberMap.has(id)) return numberMap.get(id)!;
  const num = String(counter++).padStart(3, "0");
  const pn = `${prefix}${num}`;
  numberMap.set(id, pn);
  return pn;
}

export function getPartNumber(id: number): string | undefined {
  return numberMap.get(id);
}

export function setPartNumber(id: number, partNumber: string): void {
  numberMap.set(id, partNumber);
}

export function getAllPartNumbers(): [number, string][] {
  return Array.from(numberMap.entries());
}

export function renumberByPosition(
  items: { id: number; x: number; y: number }[],
  prefix: string = "P",
): void {
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 10) return a.x - b.x;
    return a.y - b.y;
  });

  counter = 1;
  numberMap.clear();
  for (const item of sorted) {
    numberMap.set(item.id, `${prefix}${String(counter++).padStart(3, "0")}`);
  }
}

export function getNextNumber(): number {
  return counter;
}
