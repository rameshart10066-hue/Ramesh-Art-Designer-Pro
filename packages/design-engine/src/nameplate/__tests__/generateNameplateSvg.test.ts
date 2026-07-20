import { describe, expect, it } from "vitest";
import { generateNameplateSvg } from "../generateNameplateSvg";

describe("generateNameplateSvg", () => {
  it("produces a valid SVG document sized to the requested dimensions", () => {
    const svg = generateNameplateSvg({ text: "Karan", widthMm: 100, heightMm: 30 });
    expect(svg).toContain("<svg");
    expect(svg).toContain('width="100mm"');
    expect(svg).toContain('height="30mm"');
  });

  it("escapes special characters in the label text", () => {
    const svg = generateNameplateSvg({ text: "R&D <Lab>", widthMm: 100, heightMm: 30 });
    expect(svg).toContain("R&amp;D &lt;Lab&gt;");
    expect(svg).not.toContain("R&D <Lab>");
  });

  it("rejects empty text", () => {
    expect(() => generateNameplateSvg({ text: "  ", widthMm: 100, heightMm: 30 })).toThrow(
      /must not be empty/,
    );
  });

  it("rejects non-positive dimensions", () => {
    expect(() => generateNameplateSvg({ text: "X", widthMm: 0, heightMm: 30 })).toThrow(
      /must be positive/,
    );
    expect(() => generateNameplateSvg({ text: "X", widthMm: 100, heightMm: -5 })).toThrow(
      /must be positive/,
    );
  });

  it("uses the default corner radius when none is provided", () => {
    const svg = generateNameplateSvg({ text: "X", widthMm: 100, heightMm: 30 });
    expect(svg).toContain('rx="4"');
  });
});
