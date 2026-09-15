import { rect } from "../templates";
import type { Design } from "../types";
import { toKey } from "../types";

// The 4 client acceptance layouts from the brief (§8).
// Exact L-shape and finger geometries are still to be supplied by the client;
// these placeholders keep test coverage moving but MUST be revisited when the
// real layouts arrive.

export const fixtureRect3x2: Design = rect(0, 0, 5, 3);

export const fixturePontoon8x2: Design = rect(0, 0, 15, 3);

export function fixtureLShape(): Design {
  const cubes = new Set<string>();
  for (let x = 0; x <= 5; x++) {
    for (let y = 0; y <= 1; y++) cubes.add(toKey(x, y));
  }
  for (let x = 0; x <= 1; x++) {
    for (let y = 2; y <= 5; y++) cubes.add(toKey(x, y));
  }
  return {
    version: 1,
    meta: {
      id: "fixture-l",
      name: "L-shape fixture",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    },
    cubes: [...cubes] as Design["cubes"],
  };
}

export function fixtureFinger(): Design {
  const cubes = new Set<string>();
  // 4×2 body
  for (let x = 0; x <= 3; x++) {
    for (let y = 0; y <= 1; y++) cubes.add(toKey(x, y));
  }
  // 1×3 finger protruding from the east edge
  for (let y = 0; y <= 0; y++) {
    for (let x = 4; x <= 6; x++) cubes.add(toKey(x, y));
  }
  return {
    version: 1,
    meta: {
      id: "fixture-finger",
      name: "Finger fixture",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    },
    cubes: [...cubes] as Design["cubes"],
  };
}
