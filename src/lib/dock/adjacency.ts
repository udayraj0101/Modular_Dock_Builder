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
