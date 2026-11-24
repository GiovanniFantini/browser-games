import { balance } from "@content/balance";
import type { ContentBundle } from "@content/schema";
import { createRng } from "../core/rng";
import { getEra, indexContent } from "./contentIndex";
import type { GameState } from "./gameState";

export function createNewGame(
  content: ContentBundle,
  seed: number,
  eraId = "prehistory",
): GameState {
  const era = getEra(content, eraId);
  const index = indexContent(content);
  const active = new Set(era.activeAttributes);
  const firstTier = index.tiers.find((tier) => tier.threshold === 0);
  if (!firstTier)
    throw new Error("Content is missing the starting complexity tier");

  return {
    version: 1,
    seed: seed >>> 0,
    rngState: createRng(seed).getState(),
    tick: 0,
    year: era.startYear,
    eraId,
    attributes: Object.fromEntries(
      index.attributes.map((attribute) => [
        attribute.id,
        {
          value: era.baseAttributes?.[attribute.id] ?? attribute.base,
          pressure: 0,
          active: active.has(attribute.id),
          history: [],
        },
      ]),
    ),
    policies: Object.fromEntries(
      index.policies.map((policy) => [
        policy.id,
        {
          target: policy.default,
          effective: policy.default,
          changedAtYear: era.startYear,
        },
      ]),
    ),
    population: era.startPopulation,
    complexity: 0,
    complexityTierId: firstTier.id,
    influence: era.startInfluence,
    legitimacy: balance.legitimacy.start,
  };
}
