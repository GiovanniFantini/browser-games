import { z } from "zod";
import { loadCampaignContent } from "@content/campaign/index";
import {
  doctrines,
  eventsById,
  heritageSites,
  traditions,
  traditionLifetime,
  isTradition,
  campaignEras,
  families,
  traits,
} from "@content/campaign/definitions";
import type { Campaign, QueuedPolicy } from "@engine/campaign/model";
import { speeds, type Speed } from "@engine/core/commands";

const smallId = z.string().min(1).max(120);
const amount = z.number().min(0).max(Number.MAX_SAFE_INTEGER);
const uint = z.number().int().min(0).max(0xffffffff);
const tick = z.number().int().min(0).max(100_000_000);
const score = z.number().min(1).max(20);
const percent = z.number().min(0).max(100);
const speedSchema = z.literal(speeds);
const modifierSchema = z.object({
  id: smallId,
  until: tick,
  effects: z.record(smallId, z.number().min(-20).max(20)),
});
const modifiersSchema = z.array(modifierSchema).max(2_000).transform((modifiers, context) => {
  // Earlier versions stacked aid without a limit. Recover the latest grant.
  const grants = modifiers.filter(({ id }) => id === "system.aid");
  const latest = grants.reduce<(typeof grants)[number] | undefined>(
    (recent, grant) => !recent || grant.until >= recent.until ? grant : recent,
    undefined,
  );
  const normalized = grants.length > 1
    ? modifiers.filter((modifier) => modifier.id !== "system.aid" || modifier === latest)
    : modifiers;
  if (normalized.length > 60)
    context.addIssue({ code: "custom", message: "Too many simulation modifiers" });
  return normalized;
});
const stateSchema = z.object({
  version: z.literal(1),
  seed: uint,
  rngState: uint,
  tick,
  year: z.number(),
  eraId: smallId,
  eraOrigin: z.object({ tick, year: z.number() }).optional(),
  attributes: z.record(
    smallId,
    z.object({
      value: score,
      pressure: amount,
      active: z.boolean(),
      history: z.array(score).max(100),
    }),
  ),
  policies: z.record(
    smallId,
    z.object({
      target: percent,
      effective: percent,
      changedAtYear: z.number(),
    }),
  ),
  modifiers: modifiersSchema.optional(),
  population: z.number().min(10).max(1e12),
  complexity: amount,
  complexityTierId: smallId,
  influence: amount,
  legitimacy: percent,
});
const identity = z.object({
  name: smallId,
  archetype: z.enum(["river", "hill", "wood", "coast"]),
  traits: z.record(z.enum(traits), score),
  revealed: z.array(z.enum(traits)).max(6),
});
const outcome = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("dark") }),
  z.object({ kind: z.literal("fragment"), names: z.tuple([smallId, smallId]) }),
  z.object({ kind: z.literal("conquest"), rival: smallId }),
  z.object({ kind: z.literal("collapse"), family: z.enum(families) }),
  z.object({ kind: z.enum(["extinction", "transcendence"]) }),
]);
const campaignSchema = z.object({
  version: z.literal(2),
  rules: z.enum(["current", "trial"]).default("current"),
  pace: z.enum(["standard", "rapid"]).default("rapid"),
  id: smallId,
  seed: uint,
  random: uint,
  choices: z.tuple([percent, percent, percent, percent]),
  core: stateSchema,
  identity,
  regions: z
    .array(
      z.object({
        id: tick,
        row: z.number().int().min(0).max(6),
        column: z.number().int().min(0).max(11),
        terrain: z.enum(["water", "plain", "woods", "hills"]),
        owner: smallId.nullable(),
      }),
    )
    .length(84),
  rivals: z
    .array(
      z.object({
        id: smallId,
        identity,
        core: stateSchema,
        relation: z.number().min(-100).max(100),
        treaty: z.enum(["none", "trade", "truce", "alliance", "tribute"]),
        truceUntil: tick.optional(),
      }),
    )
    .min(3)
    .max(30),
  deferred: z.array(z.object({ due: z.number().int().min(1).max(9), family: z.enum(families), source: smallId, points: z.number().int().positive().max(Number.MAX_SAFE_INTEGER) })).default([]),
  renewedIn: z.partialRecord(z.enum(traditions), z.number().int().min(0).max(9)).optional(),
  heritage: z.array(z.enum(heritageSites)).max(heritageSites.length).optional(),
  chronicle: z
    .array(
      z.object({
        id: tick,
        year: z.number(),
        era: smallId,
        key: smallId,
        name: smallId.optional(),
        nameKey: smallId.optional(),
        eventKey: smallId.optional(),
        setting: percent.optional(),
        consequenceKey: smallId.optional(),
        result: smallId.optional(),
      }),
    )
    .max(1200),
  sequence: tick,
  crises: z
    .array(z.object({ family: z.enum(families), severity: percent }))
    .max(4),
  cooldowns: z.record(smallId, tick),
  chain: z.array(z.object({ id: smallId, at: tick })).max(40),
  pending: z.object({ id: smallId, openedAt: tick }).nullable(),
  outcome: outcome.nullable(),
  war: z
    .object({
      rival: smallId,
      objective: z.enum(["raid", "defend", "tribute", "conquer"]),
      posture: percent,
      commitment: z.number().min(10).max(100),
      front: z.number().min(-100).max(100),
      fatigue: percent,
      started: tick,
    })
    .nullable(),
  doctrine: z.enum(doctrines),
  legacy: amount,
  highestEra: z.number().int().min(0).max(9),
  dormantUntil: tick.nullable(),
  structuralProtection: tick,
}).transform(campaign => {
  const heritage = new Set(campaign.heritage ?? []);
  const renewedIn = { ...campaign.renewedIn };
  if (!campaign.renewedIn || !campaign.heritage) {
    for (const entry of campaign.chronicle) {
      if (entry.key !== "log.response" || !entry.eventKey) continue;
      const event = eventsById.get(entry.eventKey.split(".")[1] ?? "");
      const option = event?.responses.find(choice => choice.labelKey === entry.nameKey);
      if (option?.founds) heritage.add(option.founds);
      const used = option?.founds ?? option?.requires;
      if (used && isTradition(used)) {
        const stage = campaignEras.findIndex(era => era.id === entry.era);
        if (stage >= 0) renewedIn[used] = Math.max(renewedIn[used] ?? 0, stage);
      }
    }
  }
  for (const site of traditions) {
    const last = renewedIn[site];
    if (last === undefined || last > campaign.highestEra ||
        campaign.highestEra - last >= traditionLifetime || !heritage.has(site)) {
      heritage.delete(site);
      delete renewedIn[site];
    }
  }
  return { ...campaign, heritage: [...heritage], renewedIn };
});
const fileSchema = z.object({
  format: z.literal("epoche-save"),
  version: z.literal(1),
  savedAt: amount,
  speed: speedSchema,
  campaign: campaignSchema,
  queued: z
    .array(z.object({ policyId: smallId, value: percent }))
    .max(40)
    .default([]),
});

export interface SaveFile {
  format: "epoche-save";
  version: 1;
  savedAt: number;
  speed: Speed;
  campaign: Campaign;
  queued: QueuedPolicy[];
}

export function makeSave(
  campaign: Campaign,
  speed: Speed,
  savedAt: number,
  queued: QueuedPolicy[] = [],
): SaveFile {
  return {
    format: "epoche-save",
    version: 1,
    campaign,
    speed,
    savedAt,
    queued,
  };
}

export function validateSave(input: unknown): SaveFile {
  const save: SaveFile = fileSchema.parse(input);
  const content = loadCampaignContent();
  const { campaign } = save;
  if (
    save.queued.some(
      ({ policyId }) => !content.policies.some(({ id }) => id === policyId),
    )
  )
    throw new Error("Unknown queued policy");
  for (const core of [
    campaign.core,
    ...campaign.rivals.map(({ core }) => core),
  ]) {
    const era = content.eras.find((entry) => entry.id === core.eraId);
    if (
      !era ||
      (core.eraOrigin && core.eraOrigin.tick > core.tick) ||
      !content.complexityTiers.some(({ id }) => id === core.complexityTierId) ||
      content.attributes.some(
        ({ id }) =>
          !Object.hasOwn(core.attributes, id) ||
          core.attributes[id]?.active !== era.activeAttributes.includes(id),
      ) ||
      content.policies.some(({ id }) => !Object.hasOwn(core.policies, id))
    ) {
      throw new Error("Unknown simulation references");
    }
  }
  const owners = new Set(["spirit", ...campaign.rivals.map(({ id }) => id)]);
  if (
    owners.size !== campaign.rivals.length + 1 ||
    new Set(campaign.regions.map(({ id }) => id)).size !== 84 ||
    campaign.regions.some(
      ({ owner, terrain }) =>
        (owner !== null && !owners.has(owner)) ||
        (terrain === "water") !== (owner === null),
    ) ||
    (campaign.pending && !eventsById.has(campaign.pending.id)) ||
    campaign.chain.some(({ id }) => !eventsById.has(id)) ||
    (campaign.war &&
      !campaign.rivals.some(({ id }) => id === campaign.war?.rival)) ||
    (campaign.outcome?.kind === "conquest" &&
      !campaign.rivals.some(
        ({ id }) =>
          campaign.outcome?.kind === "conquest" &&
          id === campaign.outcome.rival,
      ))
  ) {
    throw new Error("Unknown campaign references");
  }
  return save;
}

export function parseSave(text: string): SaveFile {
  if (text.length > 2_000_000) throw new Error("Save too large");
  const input: unknown = JSON.parse(text);
  return validateSave(input);
}
