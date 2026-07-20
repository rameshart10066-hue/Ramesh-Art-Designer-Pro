import { describe, expect, it } from "vitest";
import { POST as generateRoute } from "../generate/route";
import { POST as nestingRoute } from "../nesting/route";
import { POST as partNumberRoute } from "../part-number/route";
import { GET as materialProfilesRoute } from "../material-profiles/route";

function postRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const SQUARE = { points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 50 }] };

describe("POST /api/manufacturing/generate", () => {
  it("returns 200 with SVG output for a valid svg request", async () => {
    const response = await generateRoute(
      postRequest("http://localhost/api/manufacturing/generate", {
        type: "svg",
        widthMm: 100,
        heightMm: 100,
        cutPaths: [SQUARE],
        materialProfileId: "acrylic-3mm",
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.format).toBe("svg");
    expect(body.output).toContain("<svg");
  });

  it("returns 200 with DXF output for a valid dxf request", async () => {
    const response = await generateRoute(
      postRequest("http://localhost/api/manufacturing/generate", {
        type: "dxf",
        cutPaths: [SQUARE],
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.format).toBe("dxf");
    expect(body.output).toContain("POLYLINE");
  });

  it("returns 422 for an unknown material profile", async () => {
    const response = await generateRoute(
      postRequest("http://localhost/api/manufacturing/generate", {
        type: "svg",
        widthMm: 100,
        heightMm: 100,
        cutPaths: [SQUARE],
        materialProfileId: "unobtainium",
      }),
    );
    expect(response.status).toBe(422);
  });

  it("returns 400 for an unparsable request body", async () => {
    const badRequest = new Request("http://localhost/api/manufacturing/generate", {
      method: "POST",
      body: "not json",
    });
    const response = await generateRoute(badRequest);
    expect(response.status).toBe(400);
  });
});

describe("POST /api/manufacturing/nesting", () => {
  it("returns 200 with placements for a valid request", async () => {
    const response = await nestingRoute(
      postRequest("http://localhost/api/manufacturing/nesting", {
        parts: [{ id: "a", widthMm: 30, heightMm: 20 }],
        sheetWidthMm: 100,
        sheetHeightMm: 100,
        materialProfileId: "acrylic-3mm",
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.placements).toHaveLength(1);
    expect(body.sheetsUsed).toBe(1);
  });

  it("returns 422 for an unknown material profile", async () => {
    const response = await nestingRoute(
      postRequest("http://localhost/api/manufacturing/nesting", {
        parts: [{ id: "a", widthMm: 30, heightMm: 20 }],
        sheetWidthMm: 100,
        sheetHeightMm: 100,
        materialProfileId: "unobtainium",
      }),
    );
    expect(response.status).toBe(422);
  });
});

describe("POST /api/manufacturing/part-number", () => {
  it("returns 200 with a CATEGORY-YEAR-SEQUENCE formatted part number", async () => {
    const response = await partNumberRoute(
      postRequest("http://localhost/api/manufacturing/part-number", { categoryCode: "TESTCAT" }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.partNumber).toMatch(/^TESTCAT-\d{4}-\d{4,}$/);
  });

  it("increments the sequence on repeated calls for the same category", async () => {
    const req = () =>
      postRequest("http://localhost/api/manufacturing/part-number", { categoryCode: "SEQCHECK" });
    const first = await (await partNumberRoute(req())).json();
    const second = await (await partNumberRoute(req())).json();
    const firstSeq = Number(first.partNumber.split("-").pop());
    const secondSeq = Number(second.partNumber.split("-").pop());
    expect(secondSeq).toBe(firstSeq + 1);
  });
});

describe("GET /api/manufacturing/material-profiles", () => {
  it("returns 200 with a non-empty profile list", async () => {
    const response = materialProfilesRoute();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("kerfMm");
  });
});
