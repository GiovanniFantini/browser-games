import { z } from "zod";
import { policySchema } from "../schema";
import eraData from "./eras.json";
import policyData from "./policies.json";
import eventData from "./events.json";
import responseData from "./responses.json";

const eraSchema = z.object({
  id: z.string(),
  startYear: z.number(),
  yearsPerMinute: z.number().positive(),
  baseCapacity: z.number().positive(),
  startPopulation: z.number().positive(),
  baseGrowthPerYear: z.number().positive(),
  requiredPopulation: z.number().positive(),
  policyIds: z.array(z.string()).min(1),
  reformRoutes: z.array(z.array(z.tuple([
    z.string(),
    z.enum(["left", "right"]),
  ])).min(1)).min(1),
  palette: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  minTicks: z.number().int().positive(),
  knowledge: z.number().min(1).max(20),
});
export const campaignEras = z.array(eraSchema).length(10).parse(eraData);
export const campaignPolicies = z.array(policySchema).parse(policyData);

export const families = ["food", "clans", "health", "state"] as const;
export type Family = (typeof families)[number];
export const doctrines = ["prudence", "growth", "defence"] as const;
export type Doctrine = (typeof doctrines)[number];
export const traits = [
  "resilience",
  "ambition",
  "adaptability",
  "memory",
  "coherence",
  "corruptibility",
] as const;
export type Trait = (typeof traits)[number];

const eventSchema = z.object({
  id: z.string(),
  family: z.enum(families),
  era: z.number().int().min(0).max(9),
  metric: z.string(),
  value: z.number(),
  direction: z.enum(["above", "below"]),
  localRange: z.number().positive().optional(),
  decisive: z.boolean(),
  spillover: z.object({
    family: z.enum(families), at: z.number().min(1).max(99),
    multiplier: z.number().positive(), buffer: z.string(),
  }).optional(),
  pressureRange: z.tuple([z.number().int().min(0), z.number().int().max(99)]).refine(([low, high]) => low <= high).optional(),
});
export const heritageSites = ["spring", "seedStore", "council", "hearth", "wheel", "romanRoad", "revolution", "worldWars", "commonBridge", "mutualHall", "fair", "nightSchool"] as const;
export type HeritageSite = (typeof heritageSites)[number];

export const traditions = ["fair", "nightSchool"] as const;
export type Tradition = (typeof traditions)[number];
export const traditionLifetime = 3;
export function isTradition(site: HeritageSite): site is Tradition {
  return site === "fair" || site === "nightSchool";
}

const deferredImpact = z.object({ family: z.enum(families), points: z.number().int().min(1).max(99) });
const responseSchema = z.object({
  cost: z.number().nonnegative(),
  recovery: z.number().nonnegative(),
  defer: deferredImpact.optional(),
  repay: deferredImpact.optional(),
  overload: z.object({ at: z.number().min(1).max(99), points: z.number().min(1).max(99) }).optional(),
  founds: z.enum(heritageSites).optional(),
  requires: z.enum(heritageSites).optional(),
  strain: z.object({ family: z.enum(families), points: z.number().int().min(1).max(99) }).optional(),
  effects: z.record(z.string(), z.number()),
  followUp: z.string().optional(),
});
const responseSets = z.record(
  z.string(),
  z.array(responseSchema).min(2).refine(choices => choices.some(choice => choice.cost === 0 && !choice.requires), "Missing free council response"),
).parse(responseData);
export const events = z.array(eventSchema).min(40).parse(eventData).map((event) => {
  const choices = responseSets[event.id];
  if (!choices) throw new Error("Missing responses for " + event.id);
  return {
    ...event,
    fallbackIndex: choices.findIndex(choice => choice.cost === 0 && !choice.requires),
    responses: choices.map((response, index) => ({
      ...response,
      choice: index,
      labelKey: "response." + event.id + "." + index,
      consequenceKey: "consequence." + event.id + "." + index,
    })),
  };
});
export type GameEvent = (typeof events)[number];
export const eventsById = new Map(events.map((event) => [event.id, event]));

export const crisisPressure = {
  onset: 90,
  unitsPerSeverity: 48,
  maximum: 7,
  attributes: {
    food: ["sustenance", "environment"],
    health: ["health", "infrastructure"],
    clans: ["cohesion", "faith", "military", "culture"],
    state: ["prosperity", "stability", "freedom", "prestige", "innovation", "knowledge"],
  },
} as const;

export const groupDefinitions = [
  { id: "keepers", attribute: "knowledge", policy: 1 },
  { id: "foragers", attribute: "sustenance", policy: -1 },
  { id: "households", attribute: "health", policy: 1 },
  { id: "builders", attribute: "prosperity", policy: 1 },
  { id: "guardians", attribute: "military", policy: -1 },
] as const;

export const campaignBalance = {
  decisionWindowTicks: 600,
  eventEveryTicks: 105,
  firstEventTick: 40,
  eventCooldown: 1800,
  eventEffectsTicks: 500,
  worldUpdateTicks: 30,
  discoveryRetention: 320,
  narrativeLimit: 1200,
  absenceHours: 8,
  absenceCrisisStop: 72,
  absenceWarStop: -46,
  crisisEveryTicks: 100,
  crisisTrigger: 27,
  crisisStructural: 83,
  reformThreshold: 64,
  lateKnowledgeBaseline: 9.5,
  warTickLimit: 950,
  rebuildingTicks: 2_100,
  exileTicks: 360,
  dissentThreshold: 35,
  dissentWeight: 0.27,
  legacyFinal: 24,
  legacyStructural: 7,
  legacyEra: 3,
} as const;

export const diplomacyBalance = {
  pactCosts: { trade: 4, truce: 4, alliance: 8, aid: 5 },
  pactTrust: { trade: -35, truce: -45, alliance: 35 },
  warCosts: { raid: 8, defend: 6, tribute: 10, conquer: 14 },
  truceBreakCost: 10,
  truceBreakRelationCost: 12,
  truceDuration: 480,
  raidReward: 16,
  peaceRefusalFront: -58,
  peaceFreeFront: -14,
  peaceInfluenceInterval: 4,
  pactRelationGain: 9,
  aidRelationGain: 18,
  aidDuration: 400,
  aidEffects: { sustenance: 2, health: 1 },
  defenceDuration: 450,
  defenceEffects: { cohesion: 2 },
  tradeEffects: { prosperity: 0.65, sustenance: 0.35 },
  allianceMilitary: 1.1,
  tributeProsperity: 0.25,
  tributeInfluencePerYear: 0.18,
  landOffset: 8,
  landReference: 24,
  landSustenanceFactor: 2,
} as const;

const rapidTiming = {
  tickScale: 1,
  eventEveryTicks: campaignBalance.eventEveryTicks,
  firstEventTick: campaignBalance.firstEventTick,
  eventCooldown: campaignBalance.eventCooldown,
  crisisEveryTicks: campaignBalance.crisisEveryTicks,
  warTickLimit: campaignBalance.warTickLimit,
};
const standardTiming = {
  tickScale: 20,
  eventEveryTicks: rapidTiming.eventEveryTicks * 20,
  firstEventTick: rapidTiming.firstEventTick * 20,
  eventCooldown: rapidTiming.eventCooldown * 20,
  crisisEveryTicks: rapidTiming.crisisEveryTicks * 20,
  warTickLimit: rapidTiming.warTickLimit * 20,
};

export function campaignTiming(pace: "standard" | "rapid") {
  return pace === "standard" ? standardTiming : rapidTiming;
}

export function effectDurationTicks(
  pace: "standard" | "rapid",
  eraId: string,
  minimumAdaptRate: number,
): number {
  const era = campaignEras.find(({ id }) => id === eraId);
  if (!era || minimumAdaptRate <= 0) throw new Error("Invalid effect duration");
  const yearsPerTick = era.yearsPerMinute / (600 * campaignTiming(pace).tickScale);
  return Math.ceil(-Math.log(0.15) / (minimumAdaptRate * yearsPerTick));
}
