import { describe, expect, it } from "vitest";
import {
  getConnectedComponents,
  isConnected,
  validate,
} from "../connectivity";
import { addCube, createEmptyDesign } from "../design";
import { fixtureLShape, fixtureRect3x2 } from "./fixtures";

describe("connectivity", () => {
  it("empty design is trivially connected", () => {
    expect(isConnected(createEmptyDesign())).toBe(true);
    expect(validate(createEmptyDesign())).toEqual([{ code: "empty" }]);
  });

  it("rect is a single connected component", () => {
    expect(isConnected(fixtureRect3x2)).toBe(true);
    expect(getConnectedComponents(fixtureRect3x2)).toHaveLength(1);
    expect(validate(fixtureRect3x2)).toEqual([]);
  });

  it("L-shape stays connected", () => {
    const l = fixtureLShape();
    expect(isConnected(l)).toBe(true);
  });

  it("detects disconnected islands", () => {
    let d = addCube(createEmptyDesign(), 0, 0);
    d = addCube(d, 10, 10);
    expect(isConnected(d)).toBe(false);
    const issues = validate(d);
    expect(issues).toEqual([{ code: "disconnected", componentCount: 2 }]);
  });

  it("re-connecting two islands makes them one component", () => {
    let d = addCube(createEmptyDesign(), 0, 0);
    d = addCube(d, 2, 0);
    expect(isConnected(d)).toBe(false);
    d = addCube(d, 1, 0);
    expect(isConnected(d)).toBe(true);
  });
});
