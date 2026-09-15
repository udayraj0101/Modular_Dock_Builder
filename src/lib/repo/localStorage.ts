import { safeParseDesign } from "@/lib/dock/schema";
import type { Design } from "@/lib/dock/types";
import type { DesignRepository, DesignSummary } from "./types";

const INDEX_KEY = "dock:index";
const DESIGN_PREFIX = "dock:design:";

type IndexEntry = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  cubeCount: number;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function getStorage(explicit?: StorageLike): StorageLike | null {
  if (explicit) return explicit;
  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return (globalThis as { localStorage: Storage }).localStorage;
  }
  return null;
}

function readIndex(storage: StorageLike): IndexEntry[] {
  const raw = storage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as IndexEntry[];
  } catch {
    return [];
  }
}

function writeIndex(storage: StorageLike, entries: IndexEntry[]): void {
  storage.setItem(INDEX_KEY, JSON.stringify(entries));
}

export function createLocalStorageRepo(
  storage?: StorageLike,
): DesignRepository {
  const resolved = getStorage(storage);
  if (!resolved) {
    // On the server (SSR) we return a no-op repo so callers don't crash;
    // real reads/writes only happen in the browser.
    return {
      async save() {},
      async load() {
        return null;
      },
      async list() {
        return [];
      },
      async delete() {},
    };
  }

  return {
    async save(design: Design) {
      resolved.setItem(
        `${DESIGN_PREFIX}${design.meta.id}`,
        JSON.stringify(design),
      );
      const index = readIndex(resolved).filter((e) => e.id !== design.meta.id);
      index.push({
        id: design.meta.id,
        name: design.meta.name,
        createdAt: design.meta.createdAt,
        updatedAt: design.meta.updatedAt,
        cubeCount: design.cubes.length,
      });
      writeIndex(resolved, index);
    },

    async load(id: string) {
      const raw = resolved.getItem(`${DESIGN_PREFIX}${id}`);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        const result = safeParseDesign(parsed);
        return result.ok ? result.design : null;
      } catch {
        return null;
      }
    },

    async list(): Promise<DesignSummary[]> {
      return readIndex(resolved).map((e) => ({
        id: e.id,
        name: e.name,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        cubeCount: e.cubeCount,
      }));
    },

    async delete(id: string) {
      resolved.removeItem(`${DESIGN_PREFIX}${id}`);
      writeIndex(
        resolved,
        readIndex(resolved).filter((e) => e.id !== id),
      );
    },
  };
}
