import { describe, expect, it } from "vitest";
import type { BaseObjectData } from "@/types/objects";
import {
  extractObjectsFromProjectData,
  extractRecentMeta,
  renamePayloadName,
  serializeProject,
  stripRadpExtension,
} from "../projectIo";

describe("extractObjectsFromProjectData", () => {
  const objects = [{ id: 1, type: "rectangle", name: "Base" }] as unknown as BaseObjectData[];

  it("reads the simple { objects: [] } format", () => {
    expect(extractObjectsFromProjectData({ objects })).toEqual(objects);
  });

  it("reads the full { canvas: { objects: [] } } format", () => {
    const full = { metadata: { name: "x" }, canvas: { objects }, manufacturing: {} };
    expect(extractObjectsFromProjectData(full)).toEqual(objects);
  });

  it("returns null for unrecognized or malformed payloads", () => {
    expect(extractObjectsFromProjectData(null)).toBeNull();
    expect(extractObjectsFromProjectData("not-json")).toBeNull();
    expect(extractObjectsFromProjectData({})).toBeNull();
    expect(extractObjectsFromProjectData({ canvas: { objects: "nope" } })).toBeNull();
  });
});

describe("serializeProject", () => {
  it("wraps objects in the .radp payload with a version and timestamp", () => {
    const objects = [{ id: 1, type: "circle", name: "Ring" }] as unknown as BaseObjectData[];
    const raw = serializeProject(objects, "My Design.radp");
    const parsed = JSON.parse(raw) as {
      version: string;
      name: string;
      objects: unknown[];
      timestamp: string;
    };
    expect(parsed.version).toBeTruthy();
    expect(parsed.name).toBe("My Design");
    expect(parsed.objects).toEqual(objects);
    expect(parsed.timestamp).toBeTruthy();
  });

  it("round-trips through extractObjectsFromProjectData", () => {
    const objects = [{ id: 2, type: "text", name: "Om" }] as unknown as BaseObjectData[];
    const raw = serializeProject(objects, "design");
    const parsed = JSON.parse(raw);
    expect(extractObjectsFromProjectData(parsed)).toEqual(objects);
  });
});

describe("stripRadpExtension", () => {
  it("removes the .radp and .json suffixes", () => {
    expect(stripRadpExtension("design.radp")).toBe("design");
    expect(stripRadpExtension("design.json")).toBe("design");
    expect(stripRadpExtension("design")).toBe("design");
  });
});
