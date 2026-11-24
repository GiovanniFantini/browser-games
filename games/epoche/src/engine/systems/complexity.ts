import type { ContentBundle } from "@content/schema";
import { getEra, indexContent } from "../state/contentIndex";
import type { GameState } from "../state/gameState";

export function updateComplexity(
  state: GameState,
  content: ContentBundle,
): Pick<GameState, "complexity" | "complexityTierId"> {
  const complexity =
    Math.log10(state.population) *
    getEra(content, state.eraId).complexityMultiplier;
  const tier = indexContent(content).tiers.find(
    (entry) => complexity >= entry.threshold,
  );
  if (!tier) throw new Error("No complexity tier matches population");
  return { complexity, complexityTierId: tier.id };
}
