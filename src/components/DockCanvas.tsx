"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UseDesignReturn } from "@/lib/hooks/useDesign";
import { renderDesign } from "@/lib/canvas/renderDesign";
import {
  DEFAULT_VIEWPORT,
  screenToGrid,
  zoomAt,
  type Viewport,
} from "@/lib/canvas/viewport";

const PAN_THRESHOLD_PX = 3;

export type ToolMode = "add" | "remove";

type Props = {
  api: UseDesignReturn;
  tool: ToolMode;
};

type DragState = {
  startGrid: { x: number; y: number };
  currentGrid: { x: number; y: number };
  mode: ToolMode;
  moved: boolean;
};

type PanState = {
  startX: number;
  startY: number;
  originalPan: { panX: number; panY: number };
  moved: boolean;
  // If set, this pan gesture started from a right-click: releasing without
  // moving beyond the threshold removes the cube at this grid coordinate.
  pendingRemoveGrid: { x: number; y: number } | null;
};

export function DockCanvas({ api, tool }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<Viewport>(() => ({
    ...DEFAULT_VIEWPORT,
    panX: 200,
    panY: 200,
  }));
  const [hover, setHover] = useState<{
    x: number;
    y: number;
    mode: ToolMode;
  } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pan, setPan] = useState<PanState | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [cubeImage, setCubeImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = "/assets/dock_image.png";
    img.onload = () => setCubeImage(img);
  }, []);

  const disconnected = api.issues.some((i) => i.code === "disconnected");

  // Resize the canvas to match its container, honouring devicePixelRatio.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = wrapper;
      canvas.width = Math.round(clientWidth * dpr);
      canvas.height = Math.round(clientHeight * dpr);
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  // Draw whenever anything relevant changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderDesign(ctx, wrapper.clientWidth, wrapper.clientHeight, {
      viewport,
      design: api.design,
      exposedEdges: api.exposedEdges,
      hover,
      drag: drag
        ? { from: drag.startGrid, to: drag.currentGrid, mode: drag.mode }
        : null,
      disconnected,
      cubeImage,
    });
  }, [viewport, api.design, api.exposedEdges, hover, drag, disconnected, cubeImage]);

  // Space-bar toggles pan mode.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = document.body;
    const isEditable = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isEditable(e.target)) {
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    target.addEventListener("keydown", down);
    target.addEventListener("keyup", up);
    return () => {
      target.removeEventListener("keydown", down);
      target.removeEventListener("keyup", up);
    };
  }, []);

  const getLocal = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const local = getLocal(e);
      e.currentTarget.setPointerCapture(e.pointerId);

      // Pan gesture: space+drag, middle mouse, or right-click drag.
      // Right-click without moving still removes that cube on release.
      const isRightClick = e.button === 2;
      if (spaceHeld || e.button === 1 || isRightClick) {
        const grid = screenToGrid(viewport, local.x, local.y);
        setPan({
          startX: local.x,
          startY: local.y,
          originalPan: { panX: viewport.panX, panY: viewport.panY },
          moved: false,
          pendingRemoveGrid: isRightClick ? grid : null,
        });
        return;
      }

      // Left-click: start a place/remove drag using the current tool mode.
      const grid = screenToGrid(viewport, local.x, local.y);
      setDrag({
        startGrid: grid,
        currentGrid: grid,
        mode: tool,
        moved: false,
      });
    },
    [getLocal, spaceHeld, tool, viewport],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const local = getLocal(e);
      if (pan) {
        const dx = local.x - pan.startX;
        const dy = local.y - pan.startY;
        setViewport((v) => ({
          ...v,
          panX: pan.originalPan.panX + dx,
          panY: pan.originalPan.panY + dy,
        }));
        if (!pan.moved && Math.hypot(dx, dy) > PAN_THRESHOLD_PX) {
          setPan((p) => (p ? { ...p, moved: true } : null));
        }
        return;
      }
      const grid = screenToGrid(viewport, local.x, local.y);
      if (drag) {
        setDrag((d) =>
          d
            ? {
                ...d,
                currentGrid: grid,
                moved:
                  d.moved ||
                  grid.x !== d.startGrid.x ||
                  grid.y !== d.startGrid.y,
              }
            : null,
        );
      } else if (!spaceHeld) {
        setHover({ x: grid.x, y: grid.y, mode: tool });
      } else {
        setHover(null);
      }
    },
    [drag, getLocal, pan, spaceHeld, tool, viewport],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      if (pan) {
        // Right-click with no movement acts as a single-cell remove.
        if (pan.pendingRemoveGrid && !pan.moved) {
          api.removeCube(pan.pendingRemoveGrid.x, pan.pendingRemoveGrid.y);
        }
        setPan(null);
        return;
      }
      if (drag) {
        const { startGrid, currentGrid, mode, moved } = drag;
        if (!moved) {
          if (mode === "add") api.addCube(startGrid.x, startGrid.y);
          else api.removeCube(startGrid.x, startGrid.y);
        } else if (mode === "add") {
          api.addRange(startGrid, currentGrid);
        } else {
          api.removeRange(startGrid, currentGrid);
        }
        setDrag(null);
      }
    },
    [api, drag, pan],
  );

  const onPointerLeave = useCallback(() => {
    setHover(null);
  }, []);

  // Native, non-passive wheel listener — React's synthetic onWheel is passive
  // in React 19, which means preventDefault() is ignored and the page scrolls
  // behind the canvas. Attach directly so we can suppress the browser default.
  //
  // Gesture routing (Figma/Miro convention):
  //   ctrlKey ......... pinch on touchpad OR Ctrl+wheel → zoom
  //   deltaX != 0 OR
  //   pixel-mode small
  //   deltaY .......... two-finger touchpad drag → pan
  //   otherwise ....... mouse wheel → zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      if (e.ctrlKey) {
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        setViewport((v) => zoomAt(v, localX, localY, factor));
        return;
      }

      const looksLikeTouchpad =
        e.deltaX !== 0 || (e.deltaMode === 0 && Math.abs(e.deltaY) < 50);
      if (looksLikeTouchpad) {
        setViewport((v) => ({
          ...v,
          panX: v.panX - e.deltaX,
          panY: v.panY - e.deltaY,
        }));
        return;
      }

      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      setViewport((v) => zoomAt(v, localX, localY, factor));
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const cursor =
    (pan && pan.moved) || spaceHeld
      ? "grabbing"
      : tool === "add"
        ? "crosshair"
        : "cell";

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full bg-white overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerUp}
        onContextMenu={onContextMenu}
        style={{ cursor, touchAction: "none" }}
      />
    </div>
  );
}
