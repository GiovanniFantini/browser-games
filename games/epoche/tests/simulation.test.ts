import { describe, expect, it } from "vitest";
import { loadContent } from "@content/index";
import type { ContentBundle } from "@content/schema";
import type { SetPolicyCommand } from "@engine/core/commands";
import { stateEntry, type GameState } from "@engine/state/gameState";
import { createNewGame } from "@engine/state/newGame";
import { step } from "@engine/step";
import {
  computeTargets,
  explainTarget,
  sumContributions,
} from "@engine/systems/attributes";
import { updateComplexity } from "@engine/systems/complexity";
import { applySetPolicy, previewPolicyChange } from "@engine/systems/policies";
import { computeCapacity, updatePopulation } from "@engine/systems/population";

const content = loadContent();
const command = (
  policyId: string,
  value: number,
  tick = 1,
): SetPolicyCommand => ({
  type: "SET_POLICY",
  policyId,
  value,
  tick,
});

function runTicks(
  start: GameState,
  ticks: number,
  configuration: ContentBundle = content,
): GameState {
  let state = start;
  for (let i = 0; i < ticks; i++) state = step(state, [], configuration).state;
  return state;
}

function withAttribute(
  state: GameState,
  attribute: string,
  value: number,
): GameState {
  const current = stateEntry(state.attributes, attribute);
  return {
    ...state,
    attributes: { ...state.attributes, [attribute]: { ...current, value } },
  };
}

describe("attribute dynamics", () => {
  it("decays or accumulates pressure and samples history without mutating its inputs", () => {
    const initial = withAttribute(createNewGame(content, 1), "environment", 4);
    const before = structuredClone(initial);
    const next = step(initial, [], content).state;
    expect(initial).toEqual(before);
    expect(stateEntry(next.attributes, "environment").pressure).toBeGreaterThan(
      0,
    );

    const recovery = withAttribute(next, "environment", 13);
    const later = step(recovery, [], content).state;
    expect(stateEntry(later.attributes, "environment").pressure).toBeLessThan(
      stateEntry(next.attributes, "environment").pressure,
    );
    expect(stateEntry(next.attributes, "environment").history).toHaveLength(0);
    expect(
      stateEntry(runTicks(initial, 30).attributes, "environment").history,
    ).toHaveLength(1);
    expect(
      stateEntry(runTicks(initial, 3100).attributes, "environment").history,
    ).toHaveLength(100);
    expect(
      stateEntry(runTicks(initial, 3100).attributes, "stability").history,
    ).toHaveLength(0);
  });

  it("updates in stable order and explains the target with the same contributions", () => {
    const initial = createNewGame(content, 1);
    const reversed = loadContent({
      ...content,
      attributes: [...content.attributes].reverse(),
      policies: [...content.policies].reverse(),
      influences: [...content.influences].reverse(),
    });
    expect(runTicks(initial, 300, reversed)).toEqual(runTicks(initial, 300));
    const targets = computeTargets(initial, content);
    for (const attribute of content.attributes) {
      const total = sumContributions(
        explainTarget(initial, content, attribute.id),
      );
      expect(targets[attribute.id]).toBe(Math.max(1, Math.min(20, total)));
    }

    const isolated = loadContent({ ...content, influences: [], policies: [] });
    const low = withAttribute(createNewGame(isolated, 1), "environment", 4);
    expect(
      stateEntry(runTicks(low, 3000, isolated).attributes, "environment").value,
    ).toBeCloseTo(15, 2);
    const idle = runTicks(initial, 3000);
    for (const definition of content.attributes) {
      const { value } = stateEntry(idle.attributes, definition.id);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(20);
    }
  });
});

describe("policy reform", () => {
  it("rejects invalid or unaffordable commands before touching the state", () => {
    const initial = { ...createNewGame(content, 1), influence: 0 };
    expect(applySetPolicy(initial, content, command("fire", 100))).toEqual({
      state: initial,
      result: {
        ok: false,
        reason: "insufficient_influence",
        cost: 5,
        available: 0,
      },
    });
    expect(
      applySetPolicy(initial, content, command("fire", Number.NaN)).result,
    ).toEqual({
      ok: false,
      reason: "invalid_value",
    });
    expect(
      applySetPolicy(initial, content, command("missing", 2)).result,
    ).toEqual({
      ok: false,
      reason: "unknown_policy",
    });
    const tick = step(initial, [command("fire", 100)], content);
    expect(tick.state).toEqual(step(initial, [], content).state);
    expect(tick.commandResults[0]?.result.ok).toBe(false);
  });

  it("takes influence, waits five years, ramps and resets the delay on another reform", () => {
    const initial = createNewGame(content, 1);
    const preview = previewPolicyChange(initial, content, "fire", 100);
    expect(preview).toMatchObject({ cost: 5, delayYears: 5, rampYears: 40 });
    const first = step(initial, [command("fire", 100)], content).state;
    expect(first.influence).toBeLessThan(26);
    const atDelay = runTicks(first, 14);
    expect(stateEntry(atDelay.policies, "fire").effective).toBe(50);
    const started = runTicks(atDelay, 1);
    expect(stateEntry(started.policies, "fire").effective).toBeGreaterThan(50);
    const reverted = step(
      started,
      [command("fire", 0, started.tick + 1)],
      content,
    ).state;
    expect(stateEntry(reverted.policies, "fire").effective).toBe(
      stateEntry(started.policies, "fire").effective,
    );
    expect(stateEntry(reverted.policies, "fire").changedAtYear).toBe(
      started.year,
    );
    const full = runTicks(first, 135);
    expect(stateEntry(full.policies, "fire").effective).toBeCloseTo(100, 8);
    for (const effect of preview?.effects ?? []) {
      const contribution = (state: GameState) =>
        explainTarget(state, content, effect.attribute).find(
          (item) => item.id === "fire",
        )?.amount ?? 0;
      expect(contribution(full) - contribution(initial)).toBeCloseTo(
        effect.deltaTarget,
        8,
      );
    }
  });

  it("raises sustenance and lowers environment with intensive fire over 500 years", () => {
    const initial = createNewGame(content, 1);
    const comparison = runTicks(initial, 1500);
    const changed = runTicks(
      step(initial, [command("fire", 100)], content).state,
      1499,
    );
    expect(stateEntry(changed.attributes, "environment").value).toBeLessThan(
      stateEntry(comparison.attributes, "environment").value,
    );
    expect(stateEntry(changed.attributes, "sustenance").value).toBeGreaterThan(
      stateEntry(comparison.attributes, "sustenance").value,
    );
    expect(changed.influence).toBeGreaterThanOrEqual(0);
    expect(runTicks(changed, 16000).influence).toBe(100);
  });
});

describe("demography", () => {
  it("stops growth in poor health and converges to fixed capacity at normal health", () => {
    const start = createNewGame(content, 1);
    const overcrowded = withAttribute(
      { ...start, population: 1000 },
      "health",
      7,
    );
    expect(updatePopulation(overcrowded, content, 1 / 3)).toBe(1000);
    const capacity = computeCapacity(start, content);
    for (const population of [40, 300]) {
      let state = { ...start, population };
      for (let year = 0; year < 5000; year++)
        state = { ...state, population: updatePopulation(state, content, 1) };
      expect(Math.abs(state.population - capacity)).toBeLessThan(0.1);
    }
    expect(
      updateComplexity({ ...start, population: 10 ** 2.2 - 0.1 }, content)
        .complexityTierId,
    ).toBe("band");
    expect(
      updateComplexity({ ...start, population: 10 ** 2.2 + 0.1 }, content)
        .complexityTierId,
    ).toBe("tribe");
  });

  it("explains the harm of population pressure and reproduces the growth scenario", () => {
    const initial = createNewGame(content, 1);
    const crowded = { ...initial, population: 220 };
    const baseline = computeTargets(initial, content);
    const targets = computeTargets(crowded, content);
    for (const id of ["sustenance", "environment"]) {
      expect(stateEntry(targets, id)).toBeLessThan(stateEntry(baseline, id));
      expect(explainTarget(crowded, content, id)).toContainEqual(
        expect.objectContaining({
          id: "population_pressure",
          amount: expect.any(Number),
        }),
      );
    }
    const changed = step(
      initial,
      [command("settlement", 100), command("fire", 100)],
      content,
    ).state;
    const growth = runTicks(changed, 8999);
    expect(growth.population).toBeGreaterThan(initial.population);
    expect(stateEntry(growth.attributes, "environment").value).toBeLessThan(10);
  });
});
