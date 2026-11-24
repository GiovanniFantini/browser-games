import type { AttributeDef } from "./schema";

function attribute(
  id: string,
  group: AttributeDef["group"],
  base: number,
  min: number,
  max: number,
): AttributeDef {
  return {
    id,
    group,
    nameKey: "attribute." + id,
    base,
    zone: { min, max },
    adaptRate: 0.01,
    pressureGain: 1,
    pressureDecay: 0.5,
  };
}

export const attributes = [
  attribute("sustenance", "material", 10, 10, 17),
  attribute("prosperity", "material", 5, 8, 16),
  attribute("infrastructure", "material", 3, 8, 16),
  attribute("health", "material", 10, 9, 18),
  attribute("environment", "material", 15, 10, 20),
  attribute("cohesion", "social", 11, 9, 16),
  attribute("stability", "social", 10, 8, 15),
  attribute("faith", "social", 8, 6, 14),
  attribute("culture", "social", 4, 6, 18),
  attribute("knowledge", "social", 6, 6, 20),
  attribute("freedom", "social", 10, 6, 16),
  attribute("military", "power", 8, 6, 14),
  attribute("innovation", "power", 4, 6, 18),
  attribute("prestige", "power", 3, 5, 17),
];
