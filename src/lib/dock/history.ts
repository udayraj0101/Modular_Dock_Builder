import { Design } from "./types";

export type History = {
  past: Design[];
  present: Design;
  future: Design[];
  limit: number;
};

export function initHistory(design: Design, limit = 100): History {
  return { past: [], present: design, future: [], limit };
}

export function push(history: History, next: Design): History {
  if (next === history.present) return history;
  const past = [...history.past, history.present];
  const trimmed =
    past.length > history.limit ? past.slice(past.length - history.limit) : past;
  return { ...history, past: trimmed, present: next, future: [] };
}

export function canUndo(history: History): boolean {
  return history.past.length > 0;
}

export function canRedo(history: History): boolean {
  return history.future.length > 0;
}

export function undo(history: History): History {
  if (!canUndo(history)) return history;
  const previous = history.past[history.past.length - 1];
  return {
    ...history,
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: History): History {
  if (!canRedo(history)) return history;
  const [next, ...rest] = history.future;
  return {
    ...history,
    past: [...history.past, history.present],
    present: next,
    future: rest,
  };
}

export function replace(history: History, design: Design): History {
  return { ...history, past: [], present: design, future: [] };
}
