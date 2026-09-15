import { CubeKey, Design, fromKey, toKey } from "./types";

const OFFSETS = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

export function getConnectedComponents(design: Design): CubeKey[][] {
  const remaining = new Set(design.cubes);
  const components: CubeKey[][] = [];

  while (remaining.size > 0) {
    const seed = remaining.values().next().value as CubeKey;
    const stack: CubeKey[] = [seed];
    const component: CubeKey[] = [];
    remaining.delete(seed);

    while (stack.length > 0) {
      const key = stack.pop()!;
      component.push(key);
      const { x, y } = fromKey(key);
      for (const { dx, dy } of OFFSETS) {
        const nKey = toKey(x + dx, y + dy);
        if (remaining.has(nKey)) {
          remaining.delete(nKey);
          stack.push(nKey);
        }
      }
    }
    components.push(component);
  }
  return components;
}

export function isConnected(design: Design): boolean {
  if (design.cubes.length <= 1) return true;
  return getConnectedComponents(design).length === 1;
}

export type ValidationIssue =
  | { code: "disconnected"; componentCount: number }
  | { code: "empty" };

export function validate(design: Design): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (design.cubes.length === 0) {
    issues.push({ code: "empty" });
    return issues;
  }
  const components = getConnectedComponents(design);
  if (components.length > 1) {
    issues.push({ code: "disconnected", componentCount: components.length });
  }
  return issues;
}
