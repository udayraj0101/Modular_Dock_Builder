import { describe, expect, it } from "vitest";
import { addCube, createEmptyDesign } from "../design";
import {
  canRedo,
  canUndo,
  initHistory,
  push,
  redo,
  replace,
  undo,
} from "../history";

describe("history stack", () => {
  it("initHistory has no past/future", () => {
    const h = initHistory(createEmptyDesign());
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it("push then undo restores prior state", () => {
    const d0 = createEmptyDesign();
    let h = initHistory(d0);
    const d1 = addCube(d0, 0, 0);
    h = push(h, d1);
    expect(canUndo(h)).toBe(true);
    h = undo(h);
    expect(h.present).toBe(d0);
    expect(canRedo(h)).toBe(true);
  });

  it("redo re-applies an undone change", () => {
    const d0 = createEmptyDesign();
    const d1 = addCube(d0, 0, 0);
    let h = push(initHistory(d0), d1);
    h = undo(h);
    h = redo(h);
    expect(h.present).toBe(d1);
    expect(canRedo(h)).toBe(false);
  });

  it("a new push after undo clears the future", () => {
    const d0 = createEmptyDesign();
    const d1 = addCube(d0, 0, 0);
    const d2 = addCube(d0, 5, 5);
    let h = push(initHistory(d0), d1);
    h = undo(h);
    h = push(h, d2);
    expect(canRedo(h)).toBe(false);
    expect(h.present).toBe(d2);
  });

  it("respects the history limit", () => {
    const d0 = createEmptyDesign();
    let h = initHistory(d0, 3);
    for (let i = 1; i <= 5; i++) {
      h = push(h, addCube(h.present, i, 0));
    }
    expect(h.past.length).toBe(3);
  });

  it("push with unchanged reference is a no-op", () => {
    const d0 = createEmptyDesign();
    const h0 = initHistory(d0);
    const h1 = push(h0, d0);
    expect(h1).toBe(h0);
  });

  it("replace resets history around a loaded design", () => {
    const d0 = createEmptyDesign();
    const d1 = addCube(d0, 0, 0);
    const loaded = createEmptyDesign("loaded");
    let h = push(initHistory(d0), d1);
    h = replace(h, loaded);
    expect(h.present).toBe(loaded);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });
});
