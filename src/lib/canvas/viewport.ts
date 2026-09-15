import type { CubeCoord } from "@/lib/dock/types";

export type Viewport = {
  cellPx: number; // rendered pixel size of one grid cell at zoom = 1
  zoom: number;
  panX: number; // pixel offset applied to world before drawing
  panY: number;
};

export const DEFAULT_VIEWPORT: Viewport = {
  cellPx: 40,
  zoom: 1,
  panX: 0,
  panY: 0,
};

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 6;

export function cellSize(v: Viewport): number {
  return v.cellPx * v.zoom;
}

export function worldToScreen(v: Viewport, gx: number, gy: number) {
  const s = cellSize(v);
  return { x: gx * s + v.panX, y: gy * s + v.panY };
}

export function screenToGrid(
  v: Viewport,
  sx: number,
  sy: number,
): CubeCoord {
  const s = cellSize(v);
  return {
    x: Math.floor((sx - v.panX) / s),
    y: Math.floor((sy - v.panY) / s),
  };
}

export function clampZoom(z: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
}

export function zoomAt(
  v: Viewport,
  screenX: number,
  screenY: number,
  factor: number,
): Viewport {
  const nextZoom = clampZoom(v.zoom * factor);
  const actualFactor = nextZoom / v.zoom;
  return {
    ...v,
    zoom: nextZoom,
    panX: screenX - (screenX - v.panX) * actualFactor,
    panY: screenY - (screenY - v.panY) * actualFactor,
  };
}

export function panBy(v: Viewport, dx: number, dy: number): Viewport {
  return { ...v, panX: v.panX + dx, panY: v.panY + dy };
}

export function centerOnGrid(
  v: Viewport,
  screenWidth: number,
  screenHeight: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number } | null,
): Viewport {
  if (!bounds) {
    return { ...v, panX: screenWidth / 2, panY: screenHeight / 2 };
  }
  const s = cellSize(v);
  const cx = ((bounds.minX + bounds.maxX + 1) / 2) * s;
  const cy = ((bounds.minY + bounds.maxY + 1) / 2) * s;
  return { ...v, panX: screenWidth / 2 - cx, panY: screenHeight / 2 - cy };
}
