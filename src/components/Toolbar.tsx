"use client";

import { useRef, useState } from "react";
import { deserializeDesign, serializeDesign, designFilename } from "@/lib/dock/io";
import { templates, buildTemplateByName } from "@/lib/dock/templates";
import type { UseDesignReturn } from "@/lib/hooks/useDesign";
import type { ToolMode } from "./DockCanvas";

type Props = {
  api: UseDesignReturn;
  tool: ToolMode;
  onToolChange: (t: ToolMode) => void;
  view: "2d" | "3d";
  onViewChange: (v: "2d" | "3d") => void;
};

export function Toolbar({ api, tool, onToolChange, view, onViewChange }: Props) {
  const importRef = useRef<HTMLInputElement | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const flash = (msg: string) => {
    setSaveMsg(msg);
    window.setTimeout(() => setSaveMsg(null), 1800);
  };

  const handleSave = async () => {
    await api.save();
    flash("Saved to browser storage");
  };

  const handleExport = () => {
    const json = serializeDesign(api.design);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = designFilename(api.design);
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPick = () => importRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const design = deserializeDesign(text);
      api.load(design);
      flash(`Loaded ${file.name}`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Import failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleTemplate = (id: string) => {
    api.load(buildTemplateByName(id));
    flash("Template loaded");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 text-sm">
      <div className="flex items-center gap-1 rounded-md border border-slate-300 p-0.5">
        <ToolButton
          active={tool === "add"}
          onClick={() => onToolChange("add")}
          label="Add"
        />
        <ToolButton
          active={tool === "remove"}
          onClick={() => onToolChange("remove")}
          label="Remove"
        />
      </div>

      <Divider />

      <button
        className="btn"
        disabled={!api.canUndo}
        onClick={api.undo}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        className="btn"
        disabled={!api.canRedo}
        onClick={api.redo}
        title="Redo (Ctrl+Shift+Z)"
      >
        Redo
      </button>

      <Divider />

      <button className="btn" onClick={api.reset}>
        Clear
      </button>
      <button className="btn" onClick={handleSave}>
        Save
      </button>
      <button
        className="btn"
        onClick={() => setShowSaved((v) => !v)}
        title="Open a previously saved design"
      >
        Open…
      </button>

      <Divider />

      <button className="btn" onClick={handleExport} title="Download as JSON file">
        Export
      </button>
      <button className="btn" onClick={handleImportPick} title="Load a JSON file">
        Import
      </button>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      <Divider />

      <label className="flex items-center gap-1 text-slate-600">
        Template:
        <select
          className="rounded border border-slate-300 px-2 py-1"
          value=""
          onChange={(e) => {
            if (e.target.value) {
              handleTemplate(e.target.value);
              e.target.value = "";
            }
          }}
        >
          <option value="">Choose…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <Divider />

      <input
        type="text"
        className="rounded border border-slate-300 px-2 py-1 text-slate-800"
        value={api.design.meta.name}
        onChange={(e) => api.rename(e.target.value)}
        style={{ width: 180 }}
      />

      <div className="ml-auto flex items-center gap-1 rounded-md border border-slate-300 p-0.5">
        <ToolButton
          active={view === "2d"}
          onClick={() => onViewChange("2d")}
          label="2D"
        />
        <ToolButton
          active={view === "3d"}
          onClick={() => onViewChange("3d")}
          label="3D"
        />
      </div>

      {saveMsg && (
        <span className="ml-2 text-xs text-emerald-700">{saveMsg}</span>
      )}

      {showSaved && (
        <SavedList
          api={api}
          onClose={() => setShowSaved(false)}
          onLoaded={(name) => flash(`Loaded ${name}`)}
        />
      )}

      <style jsx>{`
        .btn {
          padding: 4px 10px;
          border-radius: 6px;
          background: white;
          border: 1px solid rgb(203 213 225);
          color: rgb(15 23 42);
          font-weight: 500;
        }
        .btn:hover:not(:disabled) {
          background: rgb(241 245 249);
        }
        .btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded px-3 py-1 text-sm font-medium ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="h-6 w-px bg-slate-200" />;
}

function SavedList({
  api,
  onClose,
  onLoaded,
}: {
  api: UseDesignReturn;
  onClose: () => void;
  onLoaded: (name: string) => void;
}) {
  return (
    <div className="absolute left-2 right-2 top-14 z-30 max-h-[60vh] overflow-auto rounded-md border border-slate-300 bg-white p-2 shadow-lg sm:left-auto sm:right-4 sm:w-96">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Saved designs</h3>
        <button
          className="text-slate-500 hover:text-slate-900"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      {api.savedList.length === 0 && (
        <p className="text-xs text-slate-500">No saved designs yet.</p>
      )}
      <ul className="divide-y divide-slate-100">
        {api.savedList.map((s) => (
          <li key={s.id} className="flex items-center gap-2 py-1.5 text-sm">
            <div className="flex-1 truncate">
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-slate-500">
                {s.cubeCount} cubes · updated {new Date(s.updatedAt).toLocaleString()}
              </div>
            </div>
            <button
              className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-100"
              onClick={async () => {
                const loaded = await api.loadFromRepo(s.id);
                if (loaded) {
                  onLoaded(s.name);
                  onClose();
                }
              }}
            >
              Load
            </button>
            <button
              className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
              onClick={() => api.deleteFromRepo(s.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
