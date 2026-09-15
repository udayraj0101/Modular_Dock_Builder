"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addCube as addCubeFn,
  addRange as addRangeFn,
  createEmptyDesign,
  removeCube as removeCubeFn,
  removeRange as removeRangeFn,
} from "@/lib/dock/design";
import { getDimensions } from "@/lib/dock/design";
import { getExposedEdges } from "@/lib/dock/adjacency";
import { validate } from "@/lib/dock/connectivity";
import {
  canRedo,
  canUndo,
  initHistory,
  push,
  redo,
  replace,
  undo,
  type History,
} from "@/lib/dock/history";
import { computeBom, placeholderRules, type BomRules } from "@/lib/dock/rules";
import { createLocalStorageRepo } from "@/lib/repo/localStorage";
import type { DesignRepository, DesignSummary } from "@/lib/repo/types";
import type { CubeCoord, Design } from "@/lib/dock/types";

type Options = {
  repo?: DesignRepository;
  rules?: BomRules;
};

export function useDesign(options: Options = {}) {
  const repo = useMemo(
    () => options.repo ?? createLocalStorageRepo(),
    [options.repo],
  );
  const rules = options.rules ?? placeholderRules;

  const [history, setHistory] = useState<History>(() =>
    initHistory(createEmptyDesign("Untitled dock")),
  );
  const [savedList, setSavedList] = useState<DesignSummary[]>([]);

  const design = history.present;

  // Refresh saved-design list on mount.
  useEffect(() => {
    let cancelled = false;
    repo.list().then((list) => {
      if (!cancelled) setSavedList(list);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const commit = useCallback(
    (next: Design) => setHistory((h) => push(h, next)),
    [],
  );

  const addCube = useCallback(
    (x: number, y: number) => commit(addCubeFn(design, x, y)),
    [commit, design],
  );

  const removeCube = useCallback(
    (x: number, y: number) => commit(removeCubeFn(design, x, y)),
    [commit, design],
  );

  const addRange = useCallback(
    (from: CubeCoord, to: CubeCoord) => commit(addRangeFn(design, from, to)),
    [commit, design],
  );

  const removeRange = useCallback(
    (from: CubeCoord, to: CubeCoord) =>
      commit(removeRangeFn(design, from, to)),
    [commit, design],
  );

  const undoAction = useCallback(() => setHistory((h) => undo(h)), []);
  const redoAction = useCallback(() => setHistory((h) => redo(h)), []);

  const reset = useCallback(() => {
    setHistory((h) => replace(h, createEmptyDesign("Untitled dock")));
  }, []);

  const load = useCallback((design: Design) => {
    setHistory((h) => replace(h, design));
  }, []);

  const rename = useCallback((name: string) => {
    setHistory((h) => ({
      ...h,
      present: {
        ...h.present,
        meta: {
          ...h.present.meta,
          name,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }, []);

  const save = useCallback(async () => {
    await repo.save(design);
    const list = await repo.list();
    setSavedList(list);
  }, [repo, design]);

  const loadFromRepo = useCallback(
    async (id: string) => {
      const loaded = await repo.load(id);
      if (loaded) load(loaded);
      return loaded;
    },
    [repo, load],
  );

  const deleteFromRepo = useCallback(
    async (id: string) => {
      await repo.delete(id);
      const list = await repo.list();
      setSavedList(list);
    },
    [repo],
  );

  const dimensions = useMemo(() => getDimensions(design), [design]);
  const exposedEdges = useMemo(() => getExposedEdges(design), [design]);
  const issues = useMemo(() => validate(design), [design]);
  const bom = useMemo(() => computeBom(design, rules), [design, rules]);

  // Keyboard shortcuts for undo/redo (Ctrl/Cmd + Z / Shift+Z).
  const undoRef = useRef(undoAction);
  const redoRef = useRef(redoAction);
  useEffect(() => {
    undoRef.current = undoAction;
    redoRef.current = redoAction;
  }, [undoAction, redoAction]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoRef.current();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redoRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return {
    design,
    dimensions,
    exposedEdges,
    issues,
    bom,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    addCube,
    removeCube,
    addRange,
    removeRange,
    undo: undoAction,
    redo: redoAction,
    reset,
    load,
    rename,
    save,
    loadFromRepo,
    deleteFromRepo,
    savedList,
  };
}

export type UseDesignReturn = ReturnType<typeof useDesign>;
