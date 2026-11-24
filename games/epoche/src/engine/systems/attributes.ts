import { balance, POPULATION_PRESSURE } from "@content/balance";
import type { ContentBundle, InfluenceDef } from "@content/schema";
import { clamp, lerp } from "../core/math";
import { canUsePolicy, getEra, indexContent } from "../state/contentIndex";
import { stateEntry, type GameState } from "../state/gameState";
import { computePopulationPressure, readAttribute } from "./population";

export interface Contribution {
  source: "base" | "policy" | "influence" | "modifier";
  id: string;
  amount: number;
}

export interface SpecialSources {
  population_pressure: number;
}

const { min, max, influenceCenter, historyLimit } = balance.attributes;

function influenceAmount(
  influence: InfluenceDef,
  state: GameState,
  content: ContentBundle,
  specialSources: SpecialSources,
): number {
  if (influence.mode === "aboveThreshold") {
    return (
      influence.weight *
      Math.max(0, specialSources[POPULATION_PRESSURE] - influence.threshold)
    );
  }
  const value = readAttribute(state, content, influence.from);
  if (influence.mode === "linear")
    return influence.weight * (value - influenceCenter);
  const source = indexContent(content).attributesById.get(influence.from);
  if (!source) throw new Error("Unknown influence source: " + influence.from);
  const distance =
    influence.mode === "belowZone"
      ? source.zone.min - value
      : value - source.zone.max;
  return influence.weight * Math.max(0, distance);
}

export function explainTarget(
  state: GameState,
  content: ContentBundle,
  attributeId: string,
  specialSources: SpecialSources = {
    population_pressure: computePopulationPressure(state, content),
  },
): Contribution[] {
  const index = indexContent(content);
  const definition = index.attributesById.get(attributeId);
  if (!definition) throw new Error("Unknown attribute: " + attributeId);
  const base =
    getEra(content, state.eraId).baseAttributes?.[attributeId] ??
    definition.base;
  const contributions: Contribution[] = [
    { source: "base", id: attributeId, amount: base },
  ];
  if (!stateEntry(state.attributes, attributeId).active) return contributions;

  for (const effect of index.effectsByTarget.get(attributeId) ?? []) {
    const policy = index.policiesById.get(effect.policyId);
    if (policy && canUsePolicy(policy, content, state.eraId)) {
      const effective = stateEntry(state.policies, effect.policyId).effective;
      contributions.push({
        source: "policy",
        id: effect.policyId,
        amount: lerp(
          effect.at0,
          effect.at100,
          effective / balance.policies.max,
        ),
      });
    }
  }
  for (const influence of index.influencesByTarget.get(attributeId) ?? []) {
    contributions.push({
      source: "influence",
      id: influence.from,
      amount: influenceAmount(influence, state, content, specialSources),
    });
  }
  for (const modifier of state.modifiers ?? []) {
    const amount = modifier.effects[attributeId];
    if (modifier.until > state.tick && amount)
      contributions.push({ source: "modifier", id: modifier.id, amount });
  }
  return contributions;
}

export function sumContributions(
  contributions: readonly Contribution[],
): number {
  return contributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0,
  );
}

export function computeTargets(
  state: GameState,
  content: ContentBundle,
  specialSources: SpecialSources = {
    population_pressure: computePopulationPressure(state, content),
  },
): Record<string, number> {
  return Object.fromEntries(
    indexContent(content).attributes.map((attribute) => [
      attribute.id,
      clamp(
        sumContributions(
          explainTarget(state, content, attribute.id, specialSources),
        ),
        min,
        max,
      ),
    ]),
  );
}

export function updateAttributes(
  state: GameState,
  content: ContentBundle,
  dt: number,
  specialSources: SpecialSources = {
    population_pressure: computePopulationPressure(state, content),
  },
): GameState["attributes"] {
  const targets = computeTargets(state, content, specialSources);
  const interval = getEra(content, state.eraId).historySampleYears;
  const eraTick = state.tick - (state.eraOrigin?.tick ?? 0);
  const samplesDue =
    Math.floor(((eraTick + 1) * dt) / interval + 1e-9) -
    Math.floor((eraTick * dt) / interval + 1e-9);
  return Object.fromEntries(
    indexContent(content).attributes.map((definition) => {
      const current = stateEntry(state.attributes, definition.id);
      if (!current.active) return [definition.id, current];

      const target = stateEntry(targets, definition.id);
      const value = clamp(
        current.value +
          (target - current.value) * -Math.expm1(-definition.adaptRate * dt),
        min,
        max,
      );
      const distance = Math.max(
        0,
        definition.zone.min - value,
        value - definition.zone.max,
      );
      const pressure =
        distance > 0
          ? current.pressure + distance * dt * definition.pressureGain
          : Math.max(0, current.pressure - dt * definition.pressureDecay);
      const history =
        samplesDue > 0
          ? [
              ...current.history,
              ...Array<number>(Math.min(samplesDue, historyLimit)).fill(value),
            ].slice(-historyLimit)
          : current.history;
      return [definition.id, { value, active: true, pressure, history }];
    }),
  );
}
