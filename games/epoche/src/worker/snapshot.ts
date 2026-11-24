import { balance } from "@content/balance";
import type { ContentBundle } from "@content/schema";
import type { Speed } from "@engine/core/commands";
import { clamp } from "@engine/core/math";
import { canUsePolicy, getEra } from "@engine/state/contentIndex";
import { stateEntry, type GameState } from "@engine/state/gameState";
import { explainTarget, sumContributions } from "@engine/systems/attributes";
import { computeCapacity } from "@engine/systems/population";
import type { Snapshot } from "./protocol";

export function buildSnapshot(
  state: GameState,
  content: ContentBundle,
  speed: Speed,
): Snapshot {
  const era = getEra(content, state.eraId);
  const capacity = computeCapacity(state, content);
  const populationPressure = state.population / capacity;
  const specialSources = { population_pressure: populationPressure };
  const pressureInfluence = content.influences.find(
    (entry) => entry.mode === "aboveThreshold",
  );
  const tier = content.complexityTiers.find(
    (entry) => entry.id === state.complexityTierId,
  );
  if (!tier)
    throw new Error("Unknown complexity tier: " + state.complexityTierId);

  return {
    year: state.year,
    tick: state.tick,
    eraNameKey: era.nameKey,
    speed,
    population: state.population,
    capacity,
    populationPressure,
    pressureThreshold:
      pressureInfluence?.mode === "aboveThreshold"
        ? pressureInfluence.threshold
        : null,
    influence: state.influence,
    influenceCap: era.influenceCap,
    historySampleYears: era.historySampleYears,
    legitimacy: state.legitimacy,
    complexity: state.complexity,
    complexityNameKey: tier.nameKey,
    attributes: content.attributes.map(({ id, nameKey, group, zone }) => {
      const contributions = explainTarget(state, content, id, specialSources);
      return {
        ...stateEntry(state.attributes, id),
        id,
        nameKey,
        group,
        zone,
        contributions,
        target: clamp(
          sumContributions(contributions),
          balance.attributes.min,
          balance.attributes.max,
        ),
      };
    }),
    policies: content.policies
      .filter((policy) => canUsePolicy(policy, content, state.eraId))
      .map(({ id, nameKey, leftLabelKey, rightLabelKey, tradeoffKey }) => ({
        ...stateEntry(state.policies, id),
        id,
        nameKey,
        leftLabelKey,
        rightLabelKey,
        tradeoffKey,
      })),
  };
}
