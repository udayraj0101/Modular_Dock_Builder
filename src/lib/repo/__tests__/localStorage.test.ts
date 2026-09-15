import { beforeEach, describe, expect, it } from "vitest";
import { addCube, createEmptyDesign } from "@/lib/dock/design";
import { createLocalStorageRepo } from "../localStorage";

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string) {
    return this.store.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, v);
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
}

describe("LocalStorageRepo", () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("save then load returns an equivalent design", async () => {
    const repo = createLocalStorageRepo(storage);
    let d = createEmptyDesign("saved");
    d = addCube(d, 1, 1);
    await repo.save(d);
    const loaded = await repo.load(d.meta.id);
    expect(loaded?.cubes).toEqual(d.cubes);
    expect(loaded?.meta.name).toBe("saved");
  });

  it("list summarises every saved design", async () => {
    const repo = createLocalStorageRepo(storage);
    const a = addCube(createEmptyDesign("A"), 0, 0);
    const b = addCube(addCube(createEmptyDesign("B"), 0, 0), 1, 0);
    await repo.save(a);
    await repo.save(b);
    const list = await repo.list();
    expect(list.map((s) => s.name).sort()).toEqual(["A", "B"]);
    expect(list.find((s) => s.name === "B")?.cubeCount).toBe(2);
  });

  it("saving with the same id overwrites (no duplicate in index)", async () => {
    const repo = createLocalStorageRepo(storage);
    const d = createEmptyDesign("only");
    await repo.save(d);
    await repo.save(addCube(d, 1, 1));
    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0].cubeCount).toBe(1);
  });

  it("delete removes the design and its index entry", async () => {
    const repo = createLocalStorageRepo(storage);
    const d = createEmptyDesign("gone");
    await repo.save(d);
    await repo.delete(d.meta.id);
    expect(await repo.load(d.meta.id)).toBeNull();
    expect(await repo.list()).toEqual([]);
  });

  it("load returns null when the id is unknown", async () => {
    const repo = createLocalStorageRepo(storage);
    expect(await repo.load("nope")).toBeNull();
  });
});
