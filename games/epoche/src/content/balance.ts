export const POPULATION_PRESSURE = "population_pressure";

export const balance = {
  attributes: { min: 1, max: 20, influenceCenter: 10.5, historyLimit: 100 },
  policies: { min: 0, max: 100 },
  legitimacy: { start: 50, cohesionWeight: 3, stabilityWeight: 2 },
  population: { min: 10, referenceAttribute: 10, healthThreshold: 8 },
} as const;
