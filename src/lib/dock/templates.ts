import { addRange } from "./design";
import type { Design } from "./types";
import { toKey } from "./types";

export type Template = {
  id: string;
  name: string;
  description: string;
  build: () => Design;
};

function stampMeta(design: Design, name: string): Design {
  const now = new Date().toISOString();
  return {
    ...design,
    meta: {
      id: `tmpl_${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}_${Date.now().toString(36)}`,
      name,
      createdAt: now,
      updatedAt: now,
    },
  };
}

function empty(): Design {
  const now = new Date().toISOString();
  return {
    version: 1,
    meta: { id: "tmpl", name: "template", createdAt: now, updatedAt: now },
    cubes: [],
  };
}

export const templates: Template[] = [
  {
    id: "rect-3x2",
    name: "3 m × 2 m rectangle",
    description: "Standard 6-cube rectangular dock (6 floats)",
    build: () =>
      stampMeta(
        addRange(empty(), { x: 0, y: 0 }, { x: 5, y: 3 }),
        "3m × 2m rectangle",
      ),
  },
  {
    id: "pontoon-8x2",
    name: "8 m × 2 m work pontoon",
    description: "Long work pontoon (32 floats)",
    build: () =>
      stampMeta(
        addRange(empty(), { x: 0, y: 0 }, { x: 15, y: 3 }),
        "8m × 2m pontoon",
      ),
  },
  {
    id: "l-shape",
    name: "L-shaped dock (example)",
    description:
      "Example L-shape — exact dimensions to be confirmed by client",
    build: () => {
      let d = addRange(empty(), { x: 0, y: 0 }, { x: 5, y: 1 });
      d = addRange(d, { x: 0, y: 2 }, { x: 1, y: 5 });
      return stampMeta(d, "L-shape");
    },
  },
  {
    id: "finger",
    name: "Dock with a finger (example)",
    description:
      "Example finger dock — main platform with a mooring finger; exact dimensions to be confirmed by client",
    build: () => {
      // 3 m × 2 m main body (6 × 4 cubes) + 2 m × 1 m finger protruding east.
      let d = addRange(empty(), { x: 0, y: 0 }, { x: 5, y: 3 });
      d = addRange(d, { x: 6, y: 1 }, { x: 9, y: 2 });
      return stampMeta(d, "Dock with a finger");
    },
  },
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function buildTemplateByName(id: string): Design {
  const t = getTemplate(id);
  if (!t) throw new Error(`Unknown template: ${id}`);
  const d = t.build();
  // Guarantee the cube list is unique — helper is defensive against future edits.
  const seen = new Set<string>();
  return {
    ...d,
    cubes: d.cubes.filter((k) => {
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }) as Design["cubes"],
  };
}

// Utility exposed for tests that want a raw grid without meta churn.
export function rect(x1: number, y1: number, x2: number, y2: number): Design {
  const d = empty();
  const cubes = new Set<string>();
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
      cubes.add(toKey(x, y));
    }
  }
  return { ...d, cubes: [...cubes] as Design["cubes"] };
}
