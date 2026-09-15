import type { Design, DesignMeta } from "@/lib/dock/types";

export type DesignSummary = Pick<
  DesignMeta,
  "id" | "name" | "createdAt" | "updatedAt"
> & {
  cubeCount: number;
};

export interface DesignRepository {
  save(design: Design): Promise<void>;
  load(id: string): Promise<Design | null>;
  list(): Promise<DesignSummary[]>;
  delete(id: string): Promise<void>;
}
