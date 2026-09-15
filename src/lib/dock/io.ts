import { safeParseDesign } from "./schema";
import type { Design } from "./types";

export function serializeDesign(design: Design): string {
  return JSON.stringify(design, null, 2);
}

export function deserializeDesign(json: string): Design {
  const raw: unknown = JSON.parse(json);
  const result = safeParseDesign(raw);
  if (!result.ok) {
    throw new Error(`Invalid design file: ${result.error.message}`);
  }
  return result.design;
}

export function designFilename(design: Design): string {
  const safe = design.meta.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safe || "dock"}-${design.meta.id.slice(0, 8)}.dock.json`;
}
