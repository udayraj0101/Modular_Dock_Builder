export const CUBE_SIZE_MM = 500;
export const CUBE_HEIGHT_MM = 400;

export type CubeCoord = { x: number; y: number };

export type CubeKey = `${number},${number}`;

export type Edge = "N" | "E" | "S" | "W";

export type ExposedEdges = Record<CubeKey, Edge[]>;

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type Dimensions = {
  widthMm: number;
  heightMm: number;
  widthM: number;
  heightM: number;
};

export type DesignMeta = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Design = {
  version: 1;
  meta: DesignMeta;
  cubes: CubeKey[];
};

export function toKey(x: number, y: number): CubeKey {
  return `${x},${y}` as CubeKey;
}

export function fromKey(key: CubeKey): CubeCoord {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}
