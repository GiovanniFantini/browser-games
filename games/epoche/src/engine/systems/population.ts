import { balance } from "@content/balance";
import type { ContentBundle } from "@content/schema";
import { getEra, indexContent } from "../state/contentIndex";
import { stateEntry, type GameState } from "../state/gameState";

export function readAttribute(
  state: GameState,
  content: ContentBundle,
  id: string,
): number {
  const attribute = stateEntry(state.attributes, id);
  if (attribute.active) return attribute.value;
  const definition = indexContent(content).attributesById.get(id);
  if (!definition) throw new Error("Unknown attribute: " + id);
  return getEra(content, state.eraId).baseAttributes?.[id] ?? definition.base;
}

export function computeCapacity(
  state: GameState,
  content: ContentBundle,
): number {
  const reference = balance.population.referenceAttribute;
  const era = getEra(content, state.eraId);
  return (
    era.baseCapacity *
    (readAttribute(state, content, "sustenance") / reference) *
    (readAttribute(state, content, "environment") / reference)
  );
}

export function computePopulationPressure(
  state: GameState,
  content: ContentBundle,
): number {
  return state.population / computeCapacity(state, content);
}

export function updatePopulation(
  state: GameState,
  content: ContentBundle,
  dt: number,
): number {
  const era = getEra(content, state.eraId);
  const { min, referenceAttribute, healthThreshold } = balance.population;
  const health = readAttribute(state, content, "health");
  const healthFactor = Math.max(
    0,
    (health - healthThreshold) / referenceAttribute,
  );
  const growth =
    era.baseGrowthPerYear *
    healthFactor *
    (1 - computePopulationPressure(state, content));
  return Math.max(min, state.population + state.population * growth * dt);
}
