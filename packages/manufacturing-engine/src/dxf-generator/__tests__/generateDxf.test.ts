import { describe, expect, it } from "vitest";
import { generateDxf } from "../generateDxf";

const SQUARE = { points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }] };

describe("generateDxf", () => {
  it("wraps output in a valid SECTION/ENTITIES/ENDSEC/EOF structure", () => {
    const dxf = generateDxf({ cutPaths: [SQUARE] });
    expect(dxf).toMatch(/^0\nSECTION\n2\nENTITIES\n/);
    expect(dxf).toMatch(/0\nENDSEC\n0\nEOF$/);
  });

  it("writes one POLYLINE per cut path with one VERTEX per point", () => {
    const dxf = generateDxf({ cutPaths: [SQUARE] });
    expect((dxf.match(/POLYLINE/g) ?? []).length).toBe(1);
    expect((dxf.match(/VERTEX/g) ?? []).length).toBe(SQUARE.points.length);
    expect(dxf).toContain("SEQEND");
  });

  it("marks a closed path with group code 70 = 1", () => {
    const dxf = generateDxf({ cutPaths: [{ ...SQUARE, closed: true }] });
    expect(dxf).toContain("70\n1");
  });

  it("marks an explicitly open path with group code 70 = 0", () => {
    const dxf = generateDxf({ cutPaths: [{ ...SQUARE, closed: false }] });
    expect(dxf).toContain("70\n0");
  });

  it("writes a TEXT entity for each engrave text", () => {
    const dxf = generateDxf({ cutPaths: [SQUARE], texts: [{ x: 10, y: 10, text: "Hello" }] });
    expect(dxf).toContain("TEXT");
    expect(dxf).toContain("1\nHello");
  });

  it("throws when no cut paths are provided", () => {
    expect(() => generateDxf({ cutPaths: [] })).toThrow(/at least one cut path/i);
  });

  it("throws for a path with fewer than 2 points", () => {
    expect(() => generateDxf({ cutPaths: [{ points: [{ x: 0, y: 0 }] }] })).toThrow(
      /at least 2 points/,
    );
  });
});
