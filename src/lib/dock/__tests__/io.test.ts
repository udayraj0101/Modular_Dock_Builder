import { describe, expect, it } from "vitest";
import { addCube, createEmptyDesign } from "../design";
import { deserializeDesign, designFilename, serializeDesign } from "../io";
import { safeParseDesign } from "../schema";

describe("serialize / deserialize", () => {
  it("round-trips a design without loss", () => {
    let d = createEmptyDesign("Round trip");
    d = addCube(d, 0, 0);
    d = addCube(d, 1, 0);
    d = addCube(d, -1, -1);
    const json = serializeDesign(d);
    const restored = deserializeDesign(json);
    expect([...restored.cubes].sort()).toEqual([...d.cubes].sort());
    expect(restored.meta.id).toBe(d.meta.id);
  });

  it("rejects invalid JSON with a helpful error", () => {
    expect(() => deserializeDesign("{ nope }")).toThrow();
  });

  it("rejects a well-formed but structurally wrong file", () => {
    const bad = JSON.stringify({ version: 2, meta: {}, cubes: "nope" });
    expect(() => deserializeDesign(bad)).toThrow(/Invalid design/);
  });

  it("safeParse returns error info for malformed cube keys", () => {
    const bad = { version: 1, meta: createEmptyDesign().meta, cubes: ["a,b"] };
    const result = safeParseDesign(bad);
    expect(result.ok).toBe(false);
  });

  it("designFilename slugifies the name", () => {
    const d = createEmptyDesign("My L-Shape #1");
    const name = designFilename(d);
    expect(name).toMatch(/^my-l-shape-1-[a-z0-9]{8}\.dock\.json$/);
  });
});
