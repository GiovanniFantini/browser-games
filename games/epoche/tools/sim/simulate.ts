import { balance } from "@content/balance";
import type { ContentBundle } from "@content/schema";
import { yearsPerTick } from "@engine/core/time";
import { getEra } from "@engine/state/contentIndex";
import { stateEntry } from "@engine/state/gameState";
import { createNewGame } from "@engine/state/newGame";
import { step } from "@engine/step";
import { createStrategy, type StrategyName } from "./strategies";

export function simulate(
  content: ContentBundle,
  years: number,
  seed: number,
  name: StrategyName,
) {
  let state = createNewGame(content, seed);
  const active = content.attributes.filter(
    (attribute) => stateEntry(state.attributes, attribute.id).active,
  );
  const outsideTicks = new Map(active.map((attribute) => [attribute.id, 0]));
  const dt = yearsPerTick(getEra(content, state.eraId).yearsPerMinute);
  const ticks = Math.ceil(years / dt);
  const strategy = createStrategy(name, seed, content);
  let rejected = 0;
  let invalid: string | null = null;

  while (state.tick < ticks) {
    const result = step(state, strategy(state, dt), content);
    state = result.state;
    rejected += result.commandResults.filter(({ result }) => !result.ok).length;

    for (const attribute of content.attributes) {
      const { value, active: enabled } = stateEntry(
        state.attributes,
        attribute.id,
      );
      if (
        !Number.isFinite(value) ||
        value < balance.attributes.min ||
        value > balance.attributes.max
      ) {
        invalid ??= attribute.id + " at tick " + state.tick;
      }
      if (
        enabled &&
        (value < attribute.zone.min || value > attribute.zone.max)
      ) {
        outsideTicks.set(
          attribute.id,
          (outsideTicks.get(attribute.id) ?? 0) + 1,
        );
      }
    }
  }

  return {
    seed,
    population: state.population,
    tier: state.complexityTierId,
    rejected,
    invalid,
    attributes: content.attributes.map(({ id, zone }) => {
      const { value, active: enabled } = stateEntry(state.attributes, id);
      return {
        id,
        value,
        outsideAtEnd: enabled && (value < zone.min || value > zone.max),
        outsidePercent: ((outsideTicks.get(id) ?? 0) / ticks) * 100,
        active: enabled,
      };
    }),
  };
}

export function summarize(runs: ReturnType<typeof simulate>[]) {
  const first = runs[0];
  if (!first) throw new Error("At least one run is required");
  const average = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  const tiers = new Map<string, number>();
  for (const run of runs) tiers.set(run.tier, (tiers.get(run.tier) ?? 0) + 1);

  return {
    populationMean: average(runs.map((run) => run.population)),
    tierCounts: Object.fromEntries(tiers),
    rejected: runs.reduce((sum, run) => sum + run.rejected, 0),
    attributes: first.attributes.map(({ id, active }, index) => {
      const values = runs.map((run) => run.attributes[index]?.value ?? 0);
      return {
        id,
        active,
        mean: average(values),
        min: Math.min(...values),
        max: Math.max(...values),
        outsidePercent: average(
          runs.map((run) => run.attributes[index]?.outsidePercent ?? 0),
        ),
      };
    }),
  };
}
