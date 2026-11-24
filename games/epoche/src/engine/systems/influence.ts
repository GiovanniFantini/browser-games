import { balance } from "@content/balance";
import type { ContentBundle } from "@content/schema";
import { clamp } from "../core/math";
import { getEra } from "../state/contentIndex";
import type { GameState } from "../state/gameState";
import { readAttribute } from "./population";

export function updateLegitimacy(
  state: GameState,
  content: ContentBundle,
): number {
  const { start, cohesionWeight, stabilityWeight } = balance.legitimacy;
  const center = balance.attributes.influenceCenter;
  const cohesion = readAttribute(state, content, "cohesion");
  const stability = readAttribute(state, content, "stability");
  return clamp(
    start +
      cohesionWeight * (cohesion - center) +
      stabilityWeight * (stability - center),
    0,
    100,
  );
}

export function updateInfluence(
  state: GameState,
  content: ContentBundle,
  dt: number,
): number {
  const era = getEra(content, state.eraId);
  return Math.min(
    era.influenceCap,
    state.influence + era.influenceRegenPerYear * (state.legitimacy / 100) * dt,
  );
}
