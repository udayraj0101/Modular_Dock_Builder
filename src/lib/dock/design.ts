import { produce } from "immer";
import {
  Bounds,
  CUBE_SIZE_MM,
  CubeCoord,
  CubeKey,
  Design,
  DesignMeta,
  Dimensions,
  fromKey,
  toKey,
} from "./types";

export function createEmptyDesign(name = "Untitled dock"): Design {
  const now = new Date().toISOString();
  const meta: DesignMeta = {
    id: cryptoRandomId(),
    name,
    createdAt: now,
    updatedAt: now,
  };
  return { version: 1, meta, cubes: [] };
}

export function hasCube(design: Design, x: number, y: number): boolean {
  return design.cubes.includes(toKey(x, y));
}

export function addCube(design: Design, x: number, y: number): Design {
  const key = toKey(x, y);
  if (design.cubes.includes(key)) return design;
  return produce(design, (draft) => {
    draft.cubes.push(key);
    draft.meta.updatedAt = new Date().toISOString();
  });
}

export function removeCube(design: Design, x: number, y: number): Design {
  const key = toKey(x, y);
  const idx = design.cubes.indexOf(key);
  if (idx === -1) return design;
  return produce(design, (draft) => {
    draft.cubes.splice(idx, 1);
    draft.meta.updatedAt = new Date().toISOString();
  });
}

export function addRange(
  design: Design,
  from: CubeCoord,
  to: CubeCoord,
): Design {
  const [x1, x2] = from.x <= to.x ? [from.x, to.x] : [to.x, from.x];
  const [y1, y2] = from.y <= to.y ? [from.y, to.y] : [to.y, from.y];
  return produce(design, (draft) => {
    const existing = new Set(draft.cubes);
    for (let x = x1; x <= x2; x++) {
      for (let y = y1; y <= y2; y++) {
        const key = toKey(x, y);
        if (!existing.has(key)) {
          existing.add(key);
          draft.cubes.push(key);
        }
      }
    }
    draft.meta.updatedAt = new Date().toISOString();
  });
}

export function removeRange(
  design: Design,
  from: CubeCoord,
  to: CubeCoord,
): Design {
  const [x1, x2] = from.x <= to.x ? [from.x, to.x] : [to.x, from.x];
  const [y1, y2] = from.y <= to.y ? [from.y, to.y] : [to.y, from.y];
  const kill = new Set<CubeKey>();
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) kill.add(toKey(x, y));
  }
  return produce(design, (draft) => {
    draft.cubes = draft.cubes.filter((k) => !kill.has(k));
    draft.meta.updatedAt = new Date().toISOString();
  });
}

export function getBounds(design: Design): Bounds | null {
  if (design.cubes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const key of design.cubes) {
    const { x, y } = fromKey(key);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export function getDimensions(design: Design): Dimensions | null {
  const b = getBounds(design);
  if (!b) return null;
  const widthMm = b.width * CUBE_SIZE_MM;
  const heightMm = b.height * CUBE_SIZE_MM;
  return {
    widthMm,
    heightMm,
    widthM: widthMm / 1000,
    heightM: heightMm / 1000,
  };
}

function cryptoRandomId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `d_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
