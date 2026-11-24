import { balance } from "@content/balance";
import type { ContentBundle } from "@content/schema";
import type { SetPolicyCommand } from "@engine/core/commands";
import { createRng } from "@engine/core/rng";
import type { GameState } from "@engine/state/gameState";
import { stateEntry } from "@engine/state/gameState";

export const strategyNames = ["idle", "random", "growth", "tradition"] as const;
export type StrategyName = (typeof strategyNames)[number];
export type Strategy = (state: GameState, dt: number) => SetPolicyCommand[];

function setPolicy(
  state: GameState,
  policyId: string,
  value: number,
): SetPolicyCommand {
  return { type: "SET_POLICY", policyId, value, tick: state.tick + 1 };
}

export function createStrategy(
  name: StrategyName,
  seed: number,
  content: ContentBundle,
): Strategy {
  const { min, max } = balance.policies;
  if (name === "idle") return () => [];
  if (name === "growth" || name === "tradition") {
    const ids =
      name === "growth" ? ["settlement", "fire"] : ["elders", "rites"];
    return (state) =>
      state.tick === 0 ? ids.map((id) => setPolicy(state, id, max)) : [];
  }

  const rng = createRng(seed ^ 0x4d7a8591);
  const policies = [...content.policies].sort((a, b) => (a.id < b.id ? -1 : 1));
  return (state, dt) => {
    const years = state.tick * dt;
    if (
      state.tick === 0 ||
      Math.floor((years + 1e-8) / 100) <= Math.floor((years - dt + 1e-8) / 100)
    )
      return [];
    const policy = policies[rng.int(0, policies.length - 1)];
    if (!policy) return [];
    const value = rng.int(min, max);
    const cost =
      Math.abs(value - stateEntry(state.policies, policy.id).target) *
      policy.costPerPoint;
    return cost <= state.influence ? [setPolicy(state, policy.id, value)] : [];
  };
}
