import {
  campaignBalance,
  campaignEras,
  campaignTiming,
  traits,
} from "@content/campaign/definitions";
import type { ContentBundle } from "@content/schema";
import { clamp } from "../core/math";
import { createRng, type Rng } from "../core/rng";
import { getEra } from "../state/contentIndex";
import type { GameState } from "../state/gameState";
import { createNewGame } from "../state/newGame";
import { step } from "../step";
import { updateComplexity } from "../systems/complexity";
import type {
  Campaign,
  GenesisChoices,
  Identity,
  Region,
  Rival,
} from "./model";
import {
  eraRequirements,
  reformRequirements,
  reformRoutes,
} from "./qualification";

export const playerOwner = "spirit";
export const eraNumber = (id: string) =>
  campaignEras.findIndex((era) => era.id === id);

const archetypes = ["river", "hill", "wood", "coast"] as const;
const starts = [
  "Val",
  "Ner",
  "Tal",
  "Sen",
  "Or",
  "Vel",
  "Ith",
  "Ma",
  "Ar",
  "Kel",
];
const ends = [
  "ara",
  "orin",
  "eth",
  "ava",
  "enua",
  "al",
  "arae",
  "omar",
  "ira",
  "une",
];

export function cultureName(rng: Rng): string {
  return (
    starts[rng.int(0, starts.length - 1)]! + ends[rng.int(0, ends.length - 1)]!
  );
}

export function genesisRng(seed: number, choices: GenesisChoices) {
  return createRng(choices.reduce((value, next) => Math.imul(value ^ next, 16777619), seed));
}

export function genesisModifiers(choices: GenesisChoices) {
  return [
    choices[2],
    choices[0],
    choices[3],
    100 - choices[3],
    choices[2],
    100 - choices[2],
  ].map(value => (value - 50) / 14);
}

export function createIdentity(
  rng: Rng,
  choices: GenesisChoices,
  index: number,
): Identity {
  const modifiers = genesisModifiers(choices);
  const character = Object.fromEntries(
    traits.map((trait, i) => [
      trait,
      clamp(
        Math.round(rng.int(6, 14) + (modifiers[i] ?? 0)),
        1,
        20,
      ),
    ]),
  ) as Identity["traits"];
  return {
    name: cultureName(rng),
    archetype:
      archetypes[(index + Math.floor(choices[1] / 28)) % archetypes.length]!,
    traits: character,
    revealed: [],
  };
}

export function makeWorld(
  rng: Rng,
  islands: number,
  rivals: Rival[],
): Region[] {
  const owners = [playerOwner, ...rivals.map((rival) => rival.id)];
  const centres = [
    [2, 2],
    [6, 1],
    [7, 4],
    [3, 5],
    [10, 3],
  ] as const;
  const regions: Region[] = [];
  for (let row = 0; row < 7; row++) {
    for (let column = 0; column < 12; column++) {
      const owned = owners
        .map((owner, index) => {
          const [x, y] = centres[index % centres.length]!;
          return { owner, distance: (x - column) ** 2 + (y - row) ** 2 };
        })
        .sort((a, b) => a.distance - b.distance);
      const closest = owned[0]!;
      const water =
        closest.distance > 2 &&
        (row === 0 ||
          row === 6 ||
          column === 0 ||
          column === 11 ||
          rng.next() < islands / 610);
      const relief = rng.next();
      regions.push({
        id: regions.length,
        row,
        column,
        terrain: water
          ? "water"
          : relief < 0.28
            ? "woods"
            : relief < 0.48
              ? "hills"
              : "plain",
        owner: water ? null : closest.owner,
      });
    }
  }
  return regions;
}

export function enterEra(
  core: GameState,
  eraId: string,
  content: ContentBundle,
  regression = false,
): GameState {
  const era = getEra(content, eraId);
  const fresh = createNewGame(content, core.seed, eraId);
  const year = Math.max(core.year, era.startYear);
  const attributes = Object.fromEntries(
    Object.entries(fresh.attributes).map(([id, next]) => {
      const prior = core.attributes[id];
      const value =
        prior?.active && next.active
          ? clamp(
              prior.value * 0.57 + next.value * 0.43 - (regression ? 1.2 : 0),
              1,
              20,
            )
          : next.value;
      return [id, { ...next, value }];
    }),
  );
  const population = regression
    ? Math.max(10, core.population * 0.65)
    : Math.max(core.population, era.startPopulation);
  const result: GameState = {
    ...fresh,
    attributes,
    year,
    tick: core.tick,
    rngState: core.rngState,
    population,
    eraOrigin: { year, tick: core.tick },
    influence: Math.min(
      era.influenceCap,
      Math.max(core.influence, era.startInfluence),
    ),
  };
  return { ...result, ...updateComplexity(result, content) };
}

export function updateRivals(
  campaign: Campaign,
  content: ContentBundle,
): Rival[] {
  const timing = campaignTiming(campaign.pace);
  const batch = campaignBalance.worldUpdateTicks;
  return campaign.rivals.map((rival) => {
    let core: GameState = {
      ...rival.core,
      modifiers: (rival.core.modifiers ?? []).filter(
        ({ until }) => until > rival.core.tick,
      ),
    };
    const age = eraNumber(core.eraId);
    const rng = createRng(core.rngState);
    const options = reformRoutes(age);
    const route =
      options[Math.floor(rival.identity.traits.coherence) % options.length]!;
    const plans =
      age === 0
        ? ([...route, ["subsistence", "right"], ["elders", "right"]] as const)
        : route;
    const change =
      campaign.core.tick % (batch * timing.tickScale * 5) ===
      batch * timing.tickScale
        ? plans.find(([policy, direction]) => {
            const target = core.policies[policy]?.target ?? 50;
            return direction === "right" ? target < 72 : target > 28;
          })
        : undefined;
    const count = clamp(campaign.core.tick - core.tick, 0, batch);
    for (let i = 0; i < count; i++) {
      core = step(
        core,
        change && i === 0
          ? [
              {
                type: "SET_POLICY",
                tick: core.tick + 1,
                policyId: change[0],
                value: (change[1] === "right" ? 76 : 24) + rng.int(-3, 3),
              },
            ]
          : [],
        content,
      ).state;
    }
    const next = campaignEras[age + 1];
    if (
      next &&
      eraRequirements(core, campaign.pace, age).every(
        ({ value, target }) => value >= target,
      ) &&
      reformRequirements(core, age).some((option) =>
        option.every(({ met }) => met),
      )
    ) {
      core = enterEra(core, next.id, content);
    }
    const relation = clamp(
      rival.relation +
        (rival.treaty === "none" && !rival.truceUntil
          ? (50 - campaign.identity.traits.coherence * 4) / -250
          : 0.25) /
          timing.tickScale,
      -100,
      100,
    );
    return { ...rival, core: { ...core, rngState: rng.getState() }, relation };
  });
}
