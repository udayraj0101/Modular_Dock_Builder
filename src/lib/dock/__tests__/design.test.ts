import { describe, expect, it } from "vitest";
import {
  addCube,
  addRange,
  createEmptyDesign,
  getBounds,
  getDimensions,
  hasCube,
  removeCube,
  removeRange,
} from "../design";
import { CUBE_SIZE_MM } from "../types";

describe("design mutations", () => {
  it("createEmptyDesign has zero cubes and a valid meta", () => {
    const d = createEmptyDesign("test");
    expect(d.cubes).toEqual([]);
    expect(d.meta.name).toBe("test");
    expect(d.meta.id).toBeTruthy();
  });

  it("addCube is idempotent", () => {
    const d0 = createEmptyDesign();
    const d1 = addCube(d0, 3, 4);
    const d2 = addCube(d1, 3, 4);
    expect(d1.cubes).toHaveLength(1);
    expect(d2.cubes).toHaveLength(1);
    expect(hasCube(d2, 3, 4)).toBe(true);
  });

  it("removeCube is a no-op on missing cubes", () => {
    const d0 = createEmptyDesign();
    const d1 = removeCube(d0, 1, 1);
    expect(d1).toBe(d0);
  });

  it("addRange handles forward and reversed corners", () => {
    const forward = addRange(createEmptyDesign(), { x: 0, y: 0 }, { x: 2, y: 1 });
    const reversed = addRange(createEmptyDesign(), { x: 2, y: 1 }, { x: 0, y: 0 });
    expect(forward.cubes.length).toBe(6);
    expect(reversed.cubes.length).toBe(6);
    expect(new Set(forward.cubes)).toEqual(new Set(reversed.cubes));
  });

  it("removeRange deletes only cubes inside the box", () => {
    const d0 = addRange(createEmptyDesign(), { x: 0, y: 0 }, { x: 3, y: 3 });
    const d1 = removeRange(d0, { x: 1, y: 1 }, { x: 2, y: 2 });
    expect(d1.cubes.length).toBe(16 - 4);
    expect(hasCube(d1, 1, 1)).toBe(false);
    expect(hasCube(d1, 0, 0)).toBe(true);
  });

  it("supports negative coordinates (build in any direction)", () => {
    const d0 = createEmptyDesign();
    const d1 = addCube(d0, -2, -3);
    const d2 = addCube(d1, 4, 5);
    const b = getBounds(d2);
    expect(b).toEqual({
      minX: -2,
      minY: -3,
      maxX: 4,
      maxY: 5,
      width: 7,
      height: 9,
    });
  });

  it("getDimensions returns mm and m", () => {
    const d = addRange(createEmptyDesign(), { x: 0, y: 0 }, { x: 5, y: 3 });
    const dim = getDimensions(d);
    expect(dim).toEqual({
      widthMm: 6 * CUBE_SIZE_MM,
      heightMm: 4 * CUBE_SIZE_MM,
      widthM: 3,
      heightM: 2,
    });
  });

  it("getBounds returns null for empty design", () => {
    expect(getBounds(createEmptyDesign())).toBeNull();
    expect(getDimensions(createEmptyDesign())).toBeNull();
  });
});
