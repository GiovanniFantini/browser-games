import type { EraDef } from "../schema";

export const prehistory: EraDef = {
  id: "prehistory",
  nameKey: "era.prehistory",
  startYear: -300_000,
  yearsPerMinute: 200,
  activeAttributes: [
    "sustenance",
    "health",
    "environment",
    "cohesion",
    "faith",
    "knowledge",
    "military",
  ],
  influenceRegenPerYear: 0.05,
  influenceCap: 100,
  startInfluence: 30,
  baseCapacity: 150,
  baseGrowthPerYear: 0.01,
  startPopulation: 40,
  complexityMultiplier: 1,
  historySampleYears: 10,
};
