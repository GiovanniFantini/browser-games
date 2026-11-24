import type { ComplexityTierDef } from "./schema";

export const complexityTiers: ComplexityTierDef[] = [
  { id: "band", nameKey: "tier.band", threshold: 0 },
  { id: "tribe", nameKey: "tier.tribe", threshold: 2.2 },
  { id: "chiefdom", nameKey: "tier.chiefdom", threshold: 3 },
  { id: "state", nameKey: "tier.state", threshold: 4 },
];
