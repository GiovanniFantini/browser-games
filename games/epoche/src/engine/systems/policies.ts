import { balance } from "@content/balance";
import type { ContentBundle } from "@content/schema";
import type { SetPolicyCommand } from "../core/commands";
import { lerp, moveTowards } from "../core/math";
import { canUsePolicy, indexContent } from "../state/contentIndex";
import { stateEntry, type GameState } from "../state/gameState";

export type PolicyRejection =
  "insufficient_influence" | "unknown_policy" | "locked" | "invalid_value";
export type PolicyResult =
  | { ok: true; value: number }
  | { ok: false; reason: Exclude<PolicyRejection, "insufficient_influence"> }
  | {
      ok: false;
      reason: "insufficient_influence";
      cost: number;
      available: number;
    };

export interface PolicyPreview {
  cost: number;
  effects: { attribute: string; deltaTarget: number }[];
  delayYears: number;
  rampYears: number;
}

const { min, max } = balance.policies;

function validPosition(value: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function applySetPolicy(
  state: GameState,
  content: ContentBundle,
  command: SetPolicyCommand,
): { state: GameState; result: PolicyResult } {
  const policy = indexContent(content).policiesById.get(command.policyId);
  if (!policy)
    return { state, result: { ok: false, reason: "unknown_policy" } };
  if (!canUsePolicy(policy, content, state.eraId))
    return { state, result: { ok: false, reason: "locked" } };
  if (!validPosition(command.value))
    return { state, result: { ok: false, reason: "invalid_value" } };

  const current = stateEntry(state.policies, policy.id);
  const value = Math.round(command.value);
  const result = { ok: true, value } as const;
  if (value === current.target) return { state, result };
  const cost = Math.abs(value - current.target) * policy.costPerPoint;
  if (cost > state.influence)
    return {
      state,
      result: {
        ok: false,
        reason: "insufficient_influence",
        cost,
        available: state.influence,
      },
    };
  return {
    state: {
      ...state,
      influence: state.influence - cost,
      policies: {
        ...state.policies,
        [policy.id]: { ...current, target: value, changedAtYear: state.year },
      },
    },
    result,
  };
}

export function updatePolicies(
  state: GameState,
  content: ContentBundle,
  dt: number,
): GameState["policies"] {
  const updates: [string, GameState["policies"][string]][] = [];
  for (const policy of indexContent(content).policies) {
    const current = stateEntry(state.policies, policy.id);
    if (
      current.effective === current.target ||
      !canUsePolicy(policy, content, state.eraId)
    )
      continue;
    if (state.year - current.changedAtYear + 1e-8 < policy.delayYears) continue;
    const effective = moveTowards(
      current.effective,
      current.target,
      (max / policy.rampYears) * dt,
    );
    updates.push([policy.id, { ...current, effective }]);
  }
  return updates.length === 0
    ? state.policies
    : { ...state.policies, ...Object.fromEntries(updates) };
}

export function previewPolicyChange(
  state: GameState,
  content: ContentBundle,
  policyId: string,
  value: number,
): PolicyPreview | null {
  const policy = indexContent(content).policiesById.get(policyId);
  if (
    !policy ||
    !validPosition(value) ||
    !canUsePolicy(policy, content, state.eraId)
  )
    return null;
  const current = stateEntry(state.policies, policy.id);
  const target = Math.round(value);
  const distance = Math.abs(target - current.effective);
  const projected =
    target === current.target
      ? Math.max(0, policy.delayYears - (state.year - current.changedAtYear))
      : policy.delayYears;
  return {
    cost: Math.abs(target - current.target) * policy.costPerPoint,
    effects: policy.effects.map(({ attribute, at0, at100 }) => ({
      attribute,
      deltaTarget:
        lerp(at0, at100, target / max) -
        lerp(at0, at100, current.effective / max),
    })),
    delayYears: distance > 0 ? projected : 0,
    rampYears: (distance / max) * policy.rampYears,
  };
}
