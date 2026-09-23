import { CubeKey, Design, Edge, ExposedEdges, fromKey, toKey } from "./types";

const NEIGHBOURS: Record<Edge, { dx: number; dy: number }> = {
  N: { dx: 0, dy: -1 },
  E: { dx: 1, dy: 0 },
  S: { dx: 0, dy: 1 },
  W: { dx: -1, dy: 0 },
};

const ALL_EDGES: Edge[] = ["N", "E", "S", "W"];

export function getCubeSet(design: Design): Set<CubeKey> {
  return new Set(design.cubes);
}

export function getNeighbours(
  design: Design,
  x: number,
  y: number,
): Partial<Record<Edge, CubeKey>> {
  const cubes = getCubeSet(design);
  const out: Partial<Record<Edge, CubeKey>> = {};
  for (const edge of ALL_EDGES) {
    const { dx, dy } = NEIGHBOURS[edge];
    const key = toKey(x + dx, y + dy);
    if (cubes.has(key)) out[edge] = key;
  }
  return out;
}

export type AdjacencyMap = Record<CubeKey, Partial<Record<Edge, CubeKey>>>;

export function getAdjacencyMap(design: Design): AdjacencyMap {
  const cubes = getCubeSet(design);
  const map: AdjacencyMap = {};
  for (const key of design.cubes) {
    const { x, y } = fromKey(key);
    const neighbours: Partial<Record<Edge, CubeKey>> = {};
    for (const edge of ALL_EDGES) {
      const { dx, dy } = NEIGHBOURS[edge];
      const nKey = toKey(x + dx, y + dy);
      if (cubes.has(nKey)) neighbours[edge] = nKey;
    }
    map[key] = neighbours;
  }
  return map;
}

export function getExposedEdges(design: Design): ExposedEdges {
  const cubes = getCubeSet(design);
  const map: ExposedEdges = {};
  for (const key of design.cubes) {
    const { x, y } = fromKey(key);
    const exposed: Edge[] = [];
    for (const edge of ALL_EDGES) {
      const { dx, dy } = NEIGHBOURS[edge];
      if (!cubes.has(toKey(x + dx, y + dy))) exposed.push(edge);
    }
    map[key] = exposed;
  }
  return map;
}

export function countExposedEdges(design: Design): number {
  const exposed = getExposedEdges(design);
  let total = 0;
  for (const key in exposed) total += exposed[key as CubeKey].length;
  return total;
}

export function countInternalConnections(design: Design): number {
  const cubes = getCubeSet(design);
  let count = 0;
  for (const key of design.cubes) {
    const { x, y } = fromKey(key);
    if (cubes.has(toKey(x + 1, y))) count++;
    if (cubes.has(toKey(x, y + 1))) count++;
  }
  return count;
}

/**
 * Grid corner points where four cubes meet — the (gx, gy) crosshair sits
 * between cubes (gx-1, gy-1), (gx, gy-1), (gx-1, gy), (gx, gy).
 * A center pin is placed at each of these locations on the physical dock.
 */
export function getFourWayIntersections(
  design: Design,
): Array<{ gx: number; gy: number }> {
  const cubes = getCubeSet(design);
  const seen = new Set<string>();
  const result: Array<{ gx: number; gy: number }> = [];
  for (const key of design.cubes) {
    const { x, y } = fromKey(key);
    // Each cube is the top-left of an intersection at (x+1, y+1). Check the
    // other 3 cubes needed to complete the 2x2.
    if (
      cubes.has(toKey(x + 1, y)) &&
      cubes.has(toKey(x, y + 1)) &&
      cubes.has(toKey(x + 1, y + 1))
    ) {
      const gx = x + 1;
      const gy = y + 1;
      const k = `${gx},${gy}`;
      if (!seen.has(k)) {
        seen.add(k);
        result.push({ gx, gy });
      }
    }
  }
  return result;
}

export function countFourWayIntersections(design: Design): number {
  return getFourWayIntersections(design).length;
}
