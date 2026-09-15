import { z } from "zod";
import type { CubeKey, Design } from "./types";

const cubeKeySchema = z
  .string()
  .regex(/^-?\d+,-?\d+$/, "Cube key must be `x,y` integer pair");

export const designSchema = z.object({
  version: z.literal(1),
  meta: z.object({
    id: z.string().min(1),
    name: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  cubes: z.array(cubeKeySchema),
});

export function parseDesign(input: unknown): Design {
  const parsed = designSchema.parse(input);
  return {
    version: parsed.version,
    meta: parsed.meta,
    cubes: parsed.cubes as CubeKey[],
  };
}

export function safeParseDesign(
  input: unknown,
):
  | { ok: true; design: Design }
  | { ok: false; error: z.ZodError } {
  const result = designSchema.safeParse(input);
  if (result.success) {
    return {
      ok: true,
      design: {
        version: result.data.version,
        meta: result.data.meta,
        cubes: result.data.cubes as CubeKey[],
      },
    };
  }
  return { ok: false, error: result.error };
}
