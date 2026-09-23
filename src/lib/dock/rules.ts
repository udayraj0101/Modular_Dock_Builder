import { Design } from "./types";
import {
  countExposedEdges,
  countFourWayIntersections,
  countInternalConnections,
} from "./adjacency";

export type BomLine = {
  code: string;
  label: string;
  quantity: number;
};

export type BomResult = {
  cubeCount: number;
  internalConnections: number;
  exposedEdges: number;
  fourWayIntersections: number;
  lines: BomLine[];
};

export type BomRules = {
  computeLines: (input: {
    cubeCount: number;
    internalConnections: number;
    exposedEdges: number;
    fourWayIntersections: number;
  }) => BomLine[];
};

export const placeholderRules: BomRules = {
  computeLines: ({
    cubeCount,
    internalConnections,
    exposedEdges,
    fourWayIntersections,
  }) => [
    { code: "CUBE-500", label: "500×500×400 mm float", quantity: cubeCount },
    {
      code: "CONN-PIN",
      label: "Connection pin (placeholder — awaiting client spec)",
      quantity: internalConnections,
    },
    {
      code: "PIN-CENTER",
      label: "Center pin (placeholder — awaiting client spec)",
      quantity: fourWayIntersections,
    },
    {
      code: "EDGE-CAP",
      label: "Exposed-edge cap (placeholder — awaiting client spec)",
      quantity: exposedEdges,
    },
  ],
};

export function computeBom(design: Design, rules: BomRules = placeholderRules): BomResult {
  const cubeCount = design.cubes.length;
  const internalConnections = countInternalConnections(design);
  const exposedEdges = countExposedEdges(design);
  const fourWayIntersections = countFourWayIntersections(design);
  return {
    cubeCount,
    internalConnections,
    exposedEdges,
    fourWayIntersections,
    lines: rules.computeLines({
      cubeCount,
      internalConnections,
      exposedEdges,
      fourWayIntersections,
    }),
  };
}
