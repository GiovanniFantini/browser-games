import type { ContentBundle } from "@content/schema";
import type { Command } from "./core/commands";
import { clamp } from "./core/math";
import { yearsPerTick } from "./core/time";
import { getEra } from "./state/contentIndex";
import type { GameState } from "./state/gameState";
import { updateAttributes } from "./systems/attributes";
import { updateComplexity } from "./systems/complexity";
import { updateInfluence, updateLegitimacy } from "./systems/influence";
import {
  applySetPolicy,
  updatePolicies,
  type PolicyResult,
} from "./systems/policies";
import {
  computePopulationPressure,
  updatePopulation,
} from "./systems/population";

export interface StepResult {
  state: GameState;
  commandResults: { policyId: string; result: PolicyResult }[];
}

interface StepAdjustments {
  legitimacyPenalty?: number;
  influenceBonusPerYear?: number;
}

export function step(
  state: GameState,
  commands: readonly Command[],
  content: ContentBundle,
  { legitimacyPenalty = 0, influenceBonusPerYear = 0 }: StepAdjustments = {},
): StepResult {
  const tick = state.tick + 1;
  const era = getEra(content, state.eraId);
  const dt = yearsPerTick(era.yearsPerMinute);
  let next = state;
  const commandResults: StepResult["commandResults"] = [];

  for (const command of commands) {
    if (command.type !== "SET_POLICY" || command.tick > tick) continue;
    const applied = applySetPolicy(next, content, command);
    next = applied.state;
    commandResults.push({ policyId: command.policyId, result: applied.result });
  }
  next = {
    ...next,
    policies: updatePolicies(next, content, dt),
    legitimacy: clamp(
      updateLegitimacy(next, content) - legitimacyPenalty,
      0,
      100,
    ),
  };
  next = {
    ...next,
    influence: Math.min(
      era.influenceCap,
      updateInfluence(next, content, dt) + influenceBonusPerYear * dt,
    ),
  };
  const populationPressure = computePopulationPressure(next, content);
  next = {
    ...next,
    attributes: updateAttributes(next, content, dt, {
      population_pressure: populationPressure,
    }),
  };
  next = { ...next, population: updatePopulation(next, content, dt) };

  return {
    state: {
      ...next,
      ...updateComplexity(next, content),
      tick,
      year:
        (state.eraOrigin?.year ?? era.startYear) +
        (tick - (state.eraOrigin?.tick ?? 0)) * dt,
    },
    commandResults,
  };
}
