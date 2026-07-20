import { describe, expect, it } from "vitest";
import { POST } from "../generate/route";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/design-generator/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/design-generator/generate", () => {
  it("returns 200 with SVG for a valid nameplate request", async () => {
    const response = await POST(
      postRequest({ type: "nameplate", text: "Karan", widthMm: 100, heightMm: 30 }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.svg).toContain("<svg");
  });

  it("returns 200 with SVG for a valid finger-joint-box request", async () => {
    const response = await POST(
      postRequest({
        type: "finger-joint-box",
        widthMm: 100,
        depthMm: 80,
        heightMm: 40,
        materialThicknessMm: 3,
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.svg).toContain("<polygon");
  });

  it("returns 200 with SVG for a valid nesting request", async () => {
    const response = await POST(
      postRequest({
        type: "nesting",
        shapes: [{ id: "a", widthMm: 30, heightMm: 20 }],
        sheetWidthMm: 100,
        sheetHeightMm: 100,
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.svg).toContain("<rect");
  });

  it("returns 422 for a validation failure (empty nameplate text)", async () => {
    const response = await POST(
      postRequest({ type: "nameplate", text: "", widthMm: 100, heightMm: 30 }),
    );
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 for an unparsable request body", async () => {
    const badRequest = new Request("http://localhost/api/design-generator/generate", {
      method: "POST",
      body: "not json",
    });
    const response = await POST(badRequest);
    expect(response.status).toBe(400);
  });
});
