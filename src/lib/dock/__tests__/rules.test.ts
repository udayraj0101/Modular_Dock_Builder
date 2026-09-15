import { describe, expect, it } from "vitest";
import { computeBom, placeholderRules } from "../rules";
import { fixturePontoon8x2, fixtureRect3x2 } from "./fixtures";

describe("BOM computation", () => {
  it("rect 3x2 placeholder BOM lines line up with cube/edge counts", () => {
    const bom = computeBom(fixtureRect3x2);
    expect(bom.cubeCount).toBe(24);
    expect(bom.exposedEdges).toBe(20);
    expect(bom.internalConnections).toBe(38);
    const cube = bom.lines.find((l) => l.code === "CUBE-500");
    expect(cube?.quantity).toBe(24);
  });

  it("uses injected rules over the placeholder", () => {
    const custom = computeBom(fixturePontoon8x2, {
      computeLines: ({ cubeCount }) => [
        { code: "X", label: "custom", quantity: cubeCount * 2 },
      ],
    });
    expect(custom.lines).toEqual([
      { code: "X", label: "custom", quantity: 128 },
    ]);
  });

  it("placeholder rules stay stable", () => {
    const bom = placeholderRules.computeLines({
      cubeCount: 3,
      internalConnections: 2,
      exposedEdges: 8,
    });
    expect(bom).toHaveLength(3);
  });
});
