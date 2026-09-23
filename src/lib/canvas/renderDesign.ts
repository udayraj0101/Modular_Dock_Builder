import type { Design, ExposedEdges } from "@/lib/dock/types";
import { fromKey } from "@/lib/dock/types";
import { getBounds, getDimensions } from "@/lib/dock/design";
import { getFourWayIntersections } from "@/lib/dock/adjacency";
import { cellSize, type Viewport } from "./viewport";

export type RenderOptions = {
  viewport: Viewport;
  design: Design;
  exposedEdges: ExposedEdges;
  hover?: { x: number; y: number; mode: "add" | "remove" } | null;
  drag?: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    mode: "add" | "remove";
  } | null;
  disconnected?: boolean;
  cubeImage?: HTMLImageElement | null;
  pinImage?: HTMLImageElement | null;
};

// Center pin is drawn on top of the merged lugs at each 4-way intersection.
// Sized as a fraction of the cell so it scales with zoom. 0.28 = pin diameter
// is ~28% of one cell — matches the visual weight in the client's reference.
const PIN_SIZE_FRACTION = 0.28;

const COLOURS = {
  bgLine: "rgba(255,255,255,0.15)",
  bgAxis: "rgba(255,255,255,0.35)",
  cubeFill: "#94a3b8",
  cubeStroke: "#475569",
  exposedEdge: "#dc2626",
  hoverAdd: "rgba(59, 130, 246, 0.35)",
  hoverAddStroke: "#2563eb",
  hoverRemove: "rgba(239, 68, 68, 0.35)",
  hoverRemoveStroke: "#dc2626",
  dragAdd: "rgba(59, 130, 246, 0.2)",
  dragRemove: "rgba(239, 68, 68, 0.2)",
  dragStrokeAdd: "#2563eb",
  dragStrokeRemove: "#dc2626",
  dimensionsText: "#0f172a",
  dimensionsBox: "rgba(255,255,255,0.9)",
  warningText: "#b91c1c",
};

export function renderDesign(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: RenderOptions,
): void {
  const { viewport, design, exposedEdges, hover, drag, disconnected } = opts;
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  drawBackground(ctx, width, height);
  drawGrid(ctx, width, height, viewport);
  drawCubes(ctx, viewport, design, opts.cubeImage);
  drawCenterPins(ctx, viewport, design, opts.pinImage);
  if (drag) drawDragPreview(ctx, viewport, drag);
  if (hover && !drag) drawHover(ctx, viewport, hover);
  drawDimensions(ctx, viewport, design);
  if (disconnected) drawDisconnectedBadge(ctx, width, height);

  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#059CBB");
  grad.addColorStop(1, "#037a93");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  v: Viewport,
) {
  const s = cellSize(v);
  if (s < 4) return; // don't render a solid mess when zoomed way out

  ctx.lineWidth = 1;
  ctx.strokeStyle = COLOURS.bgLine;

  const startX = ((v.panX % s) + s) % s;
  const startY = ((v.panY % s) + s) % s;

  ctx.beginPath();
  for (let x = startX; x < width; x += s) {
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, height);
  }
  for (let y = startY; y < height; y += s) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(width, Math.round(y) + 0.5);
  }
  ctx.stroke();

  // Origin axes (grid 0,0 lines) — subtle marker so orientation is obvious.
  ctx.strokeStyle = COLOURS.bgAxis;
  ctx.beginPath();
  const originX = Math.round(v.panX) + 0.5;
  const originY = Math.round(v.panY) + 0.5;
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, height);
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  ctx.stroke();
}

// dock_image_square.png (Rishabh v1, auto-cropped square 1450×1450). Lug
// tips symmetric within 4px across all 4 corners; body fills 88% of PNG.
// Overshoot (1/0.881 - 1) / 2 ≈ 0.067 makes bodies touch and lug centers
// land at the grid intersections.
const LUG_OVERSHOOT = 0.067;

function drawCubes(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  design: Design,
  image?: HTMLImageElement | null,
) {
  const s = cellSize(v);

  if (image) {
    const overshoot = s * LUG_OVERSHOOT;
    const drawSize = s + overshoot * 2;
    for (const key of design.cubes) {
      const { x, y } = fromKey(key);
      const px = x * s + v.panX;
      const py = y * s + v.panY;
      ctx.drawImage(
        image,
        Math.round(px - overshoot),
        Math.round(py - overshoot),
        Math.round(drawSize),
        Math.round(drawSize),
      );
    }
    return;
  }

  // Fallback when no image is available yet: solid grey squares with outline.
  ctx.fillStyle = COLOURS.cubeFill;
  ctx.strokeStyle = COLOURS.cubeStroke;
  ctx.lineWidth = 1;
  for (const key of design.cubes) {
    const { x, y } = fromKey(key);
    const px = x * s + v.panX;
    const py = y * s + v.panY;
    ctx.fillRect(px, py, s, s);
    ctx.strokeRect(Math.round(px) + 0.5, Math.round(py) + 0.5, s, s);
  }
}

function drawCenterPins(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  design: Design,
  image?: HTMLImageElement | null,
) {
  if (!image) return;
  const s = cellSize(v);
  const size = s * PIN_SIZE_FRACTION;
  const half = size / 2;
  const junctions = getFourWayIntersections(design);
  for (const { gx, gy } of junctions) {
    const cx = gx * s + v.panX;
    const cy = gy * s + v.panY;
    ctx.drawImage(
      image,
      Math.round(cx - half),
      Math.round(cy - half),
      Math.round(size),
      Math.round(size),
    );
  }
}

function drawExposedEdges(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  edges: ExposedEdges,
) {
  const s = cellSize(v);
  ctx.strokeStyle = COLOURS.exposedEdge;
  ctx.lineWidth = Math.max(2, s * 0.08);
  ctx.beginPath();
  for (const key in edges) {
    const { x, y } = fromKey(key as `${number},${number}`);
    const px = x * s + v.panX;
    const py = y * s + v.panY;
    for (const edge of edges[key as `${number},${number}`]) {
      switch (edge) {
        case "N":
          ctx.moveTo(px, py);
          ctx.lineTo(px + s, py);
          break;
        case "E":
          ctx.moveTo(px + s, py);
          ctx.lineTo(px + s, py + s);
          break;
        case "S":
          ctx.moveTo(px, py + s);
          ctx.lineTo(px + s, py + s);
          break;
        case "W":
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + s);
          break;
      }
    }
  }
  ctx.stroke();
}

function drawHover(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  hover: NonNullable<RenderOptions["hover"]>,
) {
  const s = cellSize(v);
  const px = hover.x * s + v.panX;
  const py = hover.y * s + v.panY;
  ctx.fillStyle =
    hover.mode === "add" ? COLOURS.hoverAdd : COLOURS.hoverRemove;
  ctx.strokeStyle =
    hover.mode === "add" ? COLOURS.hoverAddStroke : COLOURS.hoverRemoveStroke;
  ctx.lineWidth = 2;
  ctx.fillRect(px, py, s, s);
  ctx.strokeRect(Math.round(px) + 0.5, Math.round(py) + 0.5, s, s);
}

function drawDragPreview(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  drag: NonNullable<RenderOptions["drag"]>,
) {
  const s = cellSize(v);
  const x1 = Math.min(drag.from.x, drag.to.x);
  const y1 = Math.min(drag.from.y, drag.to.y);
  const x2 = Math.max(drag.from.x, drag.to.x);
  const y2 = Math.max(drag.from.y, drag.to.y);
  const px = x1 * s + v.panX;
  const py = y1 * s + v.panY;
  const w = (x2 - x1 + 1) * s;
  const h = (y2 - y1 + 1) * s;
  ctx.fillStyle = drag.mode === "add" ? COLOURS.dragAdd : COLOURS.dragRemove;
  ctx.strokeStyle =
    drag.mode === "add" ? COLOURS.dragStrokeAdd : COLOURS.dragStrokeRemove;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.fillRect(px, py, w, h);
  ctx.strokeRect(Math.round(px) + 0.5, Math.round(py) + 0.5, w, h);
  ctx.setLineDash([]);
}

function drawDimensions(
  ctx: CanvasRenderingContext2D,
  v: Viewport,
  design: Design,
) {
  const b = getBounds(design);
  const d = getDimensions(design);
  if (!b || !d) return;
  const s = cellSize(v);
  const px = b.minX * s + v.panX;
  const py = b.minY * s + v.panY;
  const w = b.width * s;
  const h = b.height * s;

  ctx.font = "12px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLOURS.dimensionsText;

  const labelW = `${d.widthMm} mm (${d.widthM.toFixed(2)} m)`;
  const labelH = `${d.heightMm} mm (${d.heightM.toFixed(2)} m)`;

  drawLabel(ctx, labelW, px + w / 2, py - 14, "center");
  drawLabel(ctx, labelH, px - 14, py + h / 2, "right");
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  align: CanvasTextAlign,
) {
  ctx.textAlign = align;
  const metrics = ctx.measureText(text);
  const padX = 6;
  const padY = 3;
  const w = metrics.width + padX * 2;
  const h = 18;
  let boxX = x - padX;
  if (align === "center") boxX = x - w / 2;
  if (align === "right") boxX = x - w + padX;
  ctx.fillStyle = COLOURS.dimensionsBox;
  ctx.fillRect(boxX, y - h / 2, w, h);
  ctx.fillStyle = COLOURS.dimensionsText;
  ctx.fillText(text, x, y);
}

function drawDisconnectedBadge(
  ctx: CanvasRenderingContext2D,
  width: number,
  _height: number,
) {
  const text = "⚠ Design has disconnected sections";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const metrics = ctx.measureText(text);
  const w = metrics.width + 24;
  const h = 28;
  const x = width / 2 - w / 2;
  const y = 12;
  ctx.fillStyle = "rgba(254, 226, 226, 0.95)";
  ctx.strokeStyle = COLOURS.warningText;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  ctx.fillStyle = COLOURS.warningText;
  ctx.fillText(text, width / 2, y + 8);
}
