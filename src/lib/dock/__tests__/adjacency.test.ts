import { describe, expect, it } from "vitest";
import {
  countExposedEdges,
  countFourWayIntersections,
  countInternalConnections,
  getAdjacencyMap,
  getExposedEdges,
  getFourWayIntersections,
} from "../adjacency";
import { addCube, createEmptyDesign } from "../design";
import { toKey } from "../types";
import {
  fixtureFinger,
  fixtureLShape,
  fixturePontoon8x2,
  fixtureRect3x2,
} from "./fixtures";

describe("adjacency & exposed edges", () => {
  it("single cube has all 4 edges exposed", () => {
    const d = addCube(createEmptyDesign(), 0, 0);
    const exposed = getExposedEdges(d);
    expect(exposed[toKey(0, 0)].sort()).toEqual(["E", "N", "S", "W"]);
    expect(countExposedEdges(d)).toBe(4);
    expect(countInternalConnections(d)).toBe(0);
  });

  it("two neighbouring cubes share an internal edge", () => {
    let d = addCube(createEmptyDesign(), 0, 0);
    d = addCube(d, 1, 0);
    const exposed = getExposedEdges(d);
    expect(exposed[toKey(0, 0)].sort()).toEqual(["N", "S", "W"]);
    expect(exposed[toKey(1, 0)].sort()).toEqual(["E", "N", "S"]);
    expect(countExposedEdges(d)).toBe(6);
    expect(countInternalConnections(d)).toBe(1);
  });

  it("rect 3m×2m fixture: 24 cubes, 20 sides, 38 shared", () => {
    // 6 × 4 = 24 cubes
    // perimeter (in cube-edges) = 2*(6+4) = 20 exposed edges
    // internal connections = 24*2 - (6+4) = 38   -- (rows*(cols-1) + cols*(rows-1)) = 6*3 + 4*5 = 18+20 = 38
    expect(fixtureRect3x2.cubes.length).toBe(24);
    expect(countExposedEdges(fixtureRect3x2)).toBe(20);
    expect(countInternalConnections(fixtureRect3x2)).toBe(38);
  });

  it("pontoon 8m×2m fixture: 64 cubes, 40 exposed", () => {
    // 16 × 4 = 64
    // perimeter = 2*(16+4) = 40
    expect(fixturePontoon8x2.cubes.length).toBe(64);
    expect(countExposedEdges(fixturePontoon8x2)).toBe(40);
  });

  it("L-shape fixture has expected cube count", () => {
    const l = fixtureLShape();
    // arm 6x2 = 12, leg 2x4 = 8, shared row = 0 (leg starts at y=2, arm ends at y=1)
    expect(l.cubes.length).toBe(20);
    // adjacency should list only real neighbours
    const map = getAdjacencyMap(l);
    // corner of arm at (0,1) — S neighbour at (0,2) exists in leg
    expect(map[toKey(0, 1)].S).toBe(toKey(0, 2));
    // arm cube at (2,1) — S neighbour would be (2,2), which is NOT in leg
    expect(map[toKey(2, 1)].S).toBeUndefined();
  });

  it("finger fixture body+finger cube count", () => {
    const f = fixtureFinger();
    // body 4x2 = 8, finger 3x1 starting at x=4 = 3, total = 11
    expect(f.cubes.length).toBe(11);
    // finger tip at (6,0) should have E, N, S exposed and only W connected
    const exposed = getExposedEdges(f);
    expect(exposed[toKey(6, 0)].sort()).toEqual(["E", "N", "S"]);
  });
});

describe("four-way intersections", () => {
  it("returns nothing for a single cube", () => {
    let d = addCube(createEmptyDesign(), 0, 0);
    expect(getFourWayIntersections(d)).toEqual([]);
  });

  it("returns one intersection for a 2x2 block", () => {
    let d = createEmptyDesign();
    d = addCube(d, 0, 0);
    d = addCube(d, 1, 0);
    d = addCube(d, 0, 1);
    d = addCube(d, 1, 1);
    const junctions = getFourWayIntersections(d);
    expect(junctions).toEqual([{ gx: 1, gy: 1 }]);
    expect(countFourWayIntersections(d)).toBe(1);
  });

  it("returns two intersections for a 3x2 block", () => {
    // A 3x2 block has two 2x2 sub-blocks sharing a column.
    expect(countFourWayIntersections(fixtureRect3x2)).toBe(
      // 6 wide x 4 tall = 5 * 3 = 15 internal 2x2 corners
      15,
    );
  });

  it("returns zero for a 1-wide line (no 2x2 block possible)", () => {
    let d = createEmptyDesign();
    for (let x = 0; x <= 4; x++) d = addCube(d, x, 0);
    expect(countFourWayIntersections(d)).toBe(0);
  });

  it("L-shape yields intersections in both arms + arm/leg junction", () => {
    const l = fixtureLShape();
    // Arm 6x2 (x=0..5, y=0..1) has 5 x 1 = 5 internal 2x2 corners.
    // Leg 2x4 (x=0..1, y=2..5) has 1 x 3 = 3 internal 2x2 corners.
    // Junction: (1, 2) — cubes (0,1)+(1,1) from arm and (0,2)+(1,2) from leg
    // together form a valid 2x2, adding one more intersection.
    expect(countFourWayIntersections(l)).toBe(5 + 3 + 1);
  });
});
