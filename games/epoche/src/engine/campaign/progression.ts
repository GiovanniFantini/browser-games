import {
  campaignBalance,
  campaignEras,
  groupDefinitions,
  events,
  traditions,
  traditionLifetime,
  campaignTiming,
  traits,
} from "@content/campaign/definitions";
import type { ContentBundle } from "@content/schema";
import { clamp } from "../core/math";
import type { Campaign, ChronicleEntry } from "./model";
import { campaignActionBlock } from "./model";
import { eraRequirements, reformRequirements } from "./qualification";
import { enterEra, eraNumber } from "./world";

export function appendLog(
  campaign: Campaign,
  key: string,
  values: Omit<ChronicleEntry, "id" | "year" | "era" | "key"> = {},
): Campaign {
  const id = campaign.sequence + 1;
  const entry = {
    id,
    year: campaign.core.year,
    era: campaign.core.eraId,
    key,
    ...values,
  };
  return {
    ...campaign,
    sequence: id,
    chronicle: [...campaign.chronicle, entry].slice(
      -campaignBalance.narrativeLimit,
    ),
  };
}

export function socialGroups(campaign: Campaign) {
  const stage = eraNumber(campaign.core.eraId);
  const groups = groupDefinitions.slice(0, stage === 0 ? 3 : stage < 2 ? 4 : 5);
  const policyIds = campaignEras[stage]?.policyIds ?? [];
  const norms = policyIds.map(
    (id) => campaign.core.policies[id]?.effective ?? 50,
  );
  const reform =
    norms.reduce((sum, value) => sum + value - 50, 0) /
    Math.max(1, norms.length);
  return groups.map((group) => {
    const value = campaign.core.attributes[group.attribute]?.value ?? 10;
    const support = clamp(
      50 +
        (value - 10) * 5 +
        reform * group.policy * 0.45 -
        campaign.crises.reduce((sum, crisis) => sum + crisis.severity, 0) / 9,
      0,
      100,
    );
    return { id: group.id, support };
  });
}

export function progression(campaign: Campaign) {
  const stage = eraNumber(campaign.core.eraId);
  const current = campaignEras[stage]!;
  const next = campaignEras[stage + 1];
  const core = campaign.core;
  const criteria = eraRequirements(core, campaign.pace, stage);
  const reforms = reformRequirements(core, stage);
  if (!next)
    criteria.push({
      key: "attribute.innovation",
      value: core.attributes.innovation?.value ?? 0,
      target: 12,
    });
  return {
    criteria,
    reforms,
    nextId: next?.id ?? null,
    ready:
      criteria.every(({ value, target }) => value >= target) &&
      reforms.some((route) => route.every(({ met }) => met)),
    discoveryKey: "discovery." + (next?.id ?? current.id),
  };
}

export function advanceHeritage(campaign: Campaign, stage: number) {
  const highestEra = Math.max(stage, campaign.highestEra);
  const renewedIn = { ...campaign.renewedIn };
  let heritage = campaign.heritage;
  let history = campaign;
  for (const site of traditions) {
    const last = renewedIn[site];
    if (last === undefined || highestEra - last < traditionLifetime) continue;
    delete renewedIn[site];
    heritage = heritage.filter(item => item !== site);
    history = appendLog(history, "log.heritageLost", { nameKey: "heritage." + site });
  }
  return { highestEra, heritage, renewedIn, chronicle: history.chronicle, sequence: history.sequence };
}

export function settleDeferred(campaign: Campaign): Campaign {
  const stage = eraNumber(campaign.core.eraId);
  const due = campaign.deferred.filter(entry => entry.due <= stage);
  if (!due.length) return campaign;
  let next = { ...campaign, deferred: campaign.deferred.filter(entry => entry.due > stage) };
  for (const entry of due) {
    const before = next.crises.find(crisis => crisis.family === entry.family)?.severity ?? 0;
    const severity = Math.min(100, before + entry.points);
    next = appendLog({
      ...next, crises: [...next.crises.filter(crisis => crisis.family !== entry.family),
        { family: entry.family, severity }],
    }, "log.debtDue", { nameKey: entry.source, setting: Math.min(100, entry.points), result: "family." + entry.family });
    if (severity === 100 && !next.outcome) {
      next = { ...next, outcome: { kind: "collapse", family: entry.family },
        legacy: next.legacy + campaignBalance.legacyStructural };
    }
  }
  return next.outcome?.kind === "collapse"
    ? appendLog(next, "log.debtCollapse", { nameKey: "family." + next.outcome.family })
    : next;
}

export function advanceEra(
  campaign: Campaign,
  content: ContentBundle,
): Campaign {
  const progress = progression(campaign);
  if (!progress.ready || campaign.pending || campaignActionBlock(campaign))
    return campaign;
  if (!progress.nextId)
    return appendLog(
      {
        ...campaign,
        outcome: { kind: "transcendence" },
        war: null,
        legacy: campaign.legacy + campaignBalance.legacyFinal,
      },
      "log.ending",
    );
  const core = enterEra(campaign.core, progress.nextId, content);
  const stage = eraNumber(core.eraId);
  const inheritance = advanceHeritage(campaign, stage);
  const invitations = stage === 9 && stage > campaign.highestEra
    ? events.filter(event => event.era === stage && event.responses.some(option =>
        option.requires && inheritance.heritage.includes(option.requires)))
    : [];
  const interval = campaignTiming(campaign.pace).eventEveryTicks;
  return settleDeferred(appendLog(
    {
      ...campaign,
      core,
      ...inheritance,
      chain: [...campaign.chain, ...invitations.map((event, i) => ({
        id: event.id, at: core.tick + (i + 1) * interval,
      }))],
      legacy:
        campaign.legacy +
        (inheritance.highestEra > campaign.highestEra ? campaignBalance.legacyEra : 0),
    },
    "log.era",
    { name: campaign.identity.name },
  ));
}

export function revealTrait(campaign: Campaign): Campaign {
  const concealed = traits.find(
    (trait) => !campaign.identity.revealed.includes(trait),
  );
  const tick = campaign.core.tick;
  if (!concealed || tick % campaignBalance.discoveryRetention !== 0)
    return campaign;
  const count = campaign.identity.revealed.length;
  if (
    tick < (count + 1) * campaignBalance.discoveryRetention ||
    (campaign.core.attributes.knowledge?.value ?? 0) < 5.5 + count * 0.7
  )
    return campaign;
  return appendLog(
    {
      ...campaign,
      identity: {
        ...campaign.identity,
        revealed: [...campaign.identity.revealed, concealed],
      },
    },
    "log.discovery",
    { nameKey: "trait." + concealed },
  );
}
