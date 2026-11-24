import type { InfluenceDef } from "./schema";

export const influences: InfluenceDef[] = [
  { from: "sustenance", to: "health", mode: "linear", weight: 0.3 },
  { from: "sustenance", to: "cohesion", mode: "belowZone", weight: -0.5 },
  { from: "health", to: "cohesion", mode: "belowZone", weight: -0.3 },
  { from: "knowledge", to: "sustenance", mode: "linear", weight: 0.15 },
  { from: "faith", to: "knowledge", mode: "aboveZone", weight: -0.5 },
  { from: "military", to: "cohesion", mode: "aboveZone", weight: -0.4 },
  { from: "cohesion", to: "military", mode: "belowZone", weight: -0.3 },
  {
    from: "population_pressure",
    to: "sustenance",
    mode: "aboveThreshold",
    weight: -4,
    threshold: 0.8,
  },
  {
    from: "population_pressure",
    to: "environment",
    mode: "aboveThreshold",
    weight: -6,
    threshold: 0.8,
  },
];
