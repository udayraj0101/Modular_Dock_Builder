"use client";

import { useState } from "react";
import { useDesign } from "@/lib/hooks/useDesign";
import { DockCanvas, type ToolMode } from "./DockCanvas";
import { Dock3DView } from "./Dock3DView";
import { InfoPanel } from "./InfoPanel";
import { Toolbar } from "./Toolbar";

export function DockBuilder() {
  const api = useDesign();
  const [tool, setTool] = useState<ToolMode>("add");
  const [view, setView] = useState<"2d" | "3d">("2d");

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div>
          <h1 className="text-base font-semibold">Modular Dock Builder</h1>
          <p className="text-xs text-slate-500">
            Milestone 1 prototype · 500 × 500 × 400 mm floats
          </p>
        </div>
      </header>
      <div className="relative">
        <Toolbar
          api={api}
          tool={tool}
          onToolChange={setTool}
          view={view}
          onViewChange={setView}
        />
      </div>
      <main className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative min-h-0 min-w-0">
          <div
            className="absolute inset-0"
            style={{ visibility: view === "2d" ? "visible" : "hidden" }}
            aria-hidden={view !== "2d"}
          >
            <DockCanvas api={api} tool={tool} />
          </div>
          <div
            className="absolute inset-0"
            style={{ visibility: view === "3d" ? "visible" : "hidden" }}
            aria-hidden={view !== "3d"}
          >
            <Dock3DView design={api.design} active={view === "3d"} />
          </div>
        </div>
        <InfoPanel api={api} />
      </main>
    </div>
  );
}
