import { trialEvents } from "@content/campaign/trial";
import {
  campaignBalance,
  campaignEras,
  campaignTiming,
  crisisPressure,
  effectDurationTicks,
  events,
  eventsById,
  isTradition,
  traditionLifetime,
  families,
  type Family,
  type GameEvent,
} from "@content/campaign/definitions";
import { attributes } from "@content/attributes";
import type { ContentBundle } from "@content/schema";
import { clamp } from "../core/math";
import { createRng } from "../core/rng";
import { getEra } from "../state/contentIndex";
import { computePopulationPressure } from "../systems/population";
import { availableResponses, remainingTradition, responseRisk, urgentDecision, type Campaign, type Crisis, type Outcome } from "./model";
import { diplomacyEffects } from "./diplomacy";
import { appendLog, socialGroups } from "./progression";
import { eraNumber } from "./world";

export function responsesFor(
  campaign: Campaign,
  event: GameEvent,
  definitions: ContentBundle["attributes"] = attributes,
) {
  return availableResponses(campaign, event).map((response) => {
    const effects = Object.fromEntries(
      Object.entries(response.effects).filter(
        ([id]) => campaign.core.attributes[id]?.active,
      ),
    );
    const rates = definitions
      .filter(({ id }) => Object.hasOwn(effects, id))
      .map(({ adaptRate }) => adaptRate);
    const durationTicks = rates.length
      ? effectDurationTicks(
          campaign.pace,
          campaign.core.eraId,
          Math.min(...rates),
        )
      : 0;
    const recovery = response.requires && isTradition(response.requires)
      ? Math.round(response.recovery * remainingTradition(campaign, response.requires) / traditionLifetime)
      : response.recovery;
    return { ...response, effects, recovery, durationTicks, risk: responseRisk(campaign, response) };
  });
}

export function applyResponse(
  campaign: Campaign,
  index: number,
  content: ContentBundle,
): Campaign {
  if (campaign.rules === "trial" && campaign.pending?.id === "ledger") return campaign;
  const event = eventsById.get(campaign.pending?.id ?? "");
  if (!event || !Number.isSafeInteger(index) || index < 0 || index >= event.responses.length)
    return campaign;
  const response = responsesFor(campaign, event, content.attributes).find(option => option.choice === index);
  if (!response || campaign.core.influence < response.cost) return campaign;
  const tick = campaign.core.tick;
  const chain =
    response.followUp && event.era === eraNumber(campaign.core.eraId)
      ? [
          ...campaign.chain,
          {
            id: response.followUp,
            at: tick + 110 * campaignTiming(campaign.pace).tickScale,
          },
        ]
      : campaign.chain;

  const risk = response.risk;
  const crises = campaign.crises
    .filter(crisis => crisis.family !== risk?.family)
    .map(crisis => crisis.family === event.family
      ? { ...crisis, severity: Math.max(0, crisis.severity - response.recovery) }
      : crisis)
    .filter(crisis => crisis.severity > 0);
  if (risk) crises.push({ family: risk.family, severity: risk.after });
  const due = eraNumber(campaign.core.eraId) + 1;
  let deferred = campaign.deferred;
  let paid = 0;
  if (response.repay) {
    const { family, points } = response.repay;
    deferred = deferred.flatMap(entry => {
      if (entry.family !== family || paid >= points) return [entry];
      const payment = Math.min(entry.points, points - paid);
      paid += payment;
      return entry.points > payment ? [{ ...entry, points: entry.points - payment }] : [];
    });
  }
  if (response.defer && due < campaignEras.length) {
    const prior = deferred.find(entry => entry.source === response.labelKey && entry.due === due);
    deferred = prior
      ? deferred.map(entry => entry === prior ? { ...entry, points: entry.points + response.defer!.points } : entry)
      : [...deferred, { ...response.defer, due, source: response.labelKey }];
  }
  const used = response.founds ?? response.requires;
  const resolved = appendLog(
    {
      ...campaign,
      pending: null,
      deferred,
      renewedIn: used && isTradition(used)
        ? { ...campaign.renewedIn, [used]: campaign.highestEra } : campaign.renewedIn,
      heritage: response.founds && !campaign.heritage.includes(response.founds)
        ? [...campaign.heritage, response.founds] : campaign.heritage,
      chain,
      crises,
      core: {
        ...campaign.core,
        influence: campaign.core.influence - response.cost,
        modifiers: [
          ...(campaign.core.modifiers ?? []),
          {
            id: "event." + event.id + ".title",
            until: tick + response.durationTicks,
            effects: response.effects,
          },
        ],
      },
    },
    "log.response",
    {
      nameKey: response.labelKey,
      consequenceKey: response.consequenceKey,
      eventKey: "event." + event.id + ".title",
    },
  );
  const accounted = paid && response.repay ? appendLog(resolved, "log.debtPaid",
    { nameKey: response.labelKey, setting: paid, result: "family." + response.repay.family }) : resolved;
  if (risk?.after !== 100) return accounted;
  return appendLog({
    ...accounted,
    outcome: { kind: "collapse", family: risk.family },
    legacy: resolved.legacy + campaignBalance.legacyStructural,
  }, "log.collapse", { nameKey: "family." + risk.family });
}

export function doctrineResponse(
  campaign: Campaign,
  content: ContentBundle,
): Campaign {
  const event = eventsById.get(campaign.pending?.id ?? "");
  if (!event || urgentDecision(campaign)) return campaign;
  const preferred =
    campaign.doctrine === "growth"
      ? 1
      : campaign.doctrine === "defence" && event.family === "clans"
        ? 1
        : 0;
  const resolved = applyResponse(campaign, preferred, content);
  return resolved === campaign ? applyResponse(campaign, event.fallbackIndex, content) : resolved;
}

function earliestEraLink(campaign: Campaign, stage: number) {
  let first: Campaign["chain"][number] | undefined;
  for (const link of campaign.chain) {
    if (eventsById.get(link.id)?.era === stage && (!first || link.at < first.at))
      first = link;
  }
  return first;
}

export function settleEraChain(
  campaign: Campaign,
  content: ContentBundle,
): Campaign {
  if (campaign.pending || campaign.outcome) return campaign;
  const stage = eraNumber(campaign.core.eraId);
  const scripted = campaign.rules === "trial" && trialEvents[campaign.core.eraId];
  if (scripted) {
    const id = scripted.find(id => !Object.hasOwn(campaign.cooldowns, id));
    return id ? maybeOpenEvent({ ...campaign, chain: [{ id, at: campaign.core.tick }] }, content) : campaign;
  }
  const next = earliestEraLink(campaign, stage);
  if (!next) return campaign;
  const chain = campaign.chain.map((link) =>
    link === next ? { ...link, at: campaign.core.tick } : link,
  );
  return maybeOpenEvent({ ...campaign, chain }, content);
}

export function maybeOpenEvent(
  campaign: Campaign,
  content: ContentBundle,
): Campaign {
  const tick = campaign.core.tick;
  if (campaign.pending || campaign.outcome || campaign.dormantUntil !== null)
    return campaign;
  const stage = eraNumber(campaign.core.eraId);
  const timed = campaignTiming(campaign.pace);
  const sequence = campaign.rules === "trial" ? trialEvents[campaign.core.eraId] : undefined;
  const scheduled = sequence?.find(id => !Object.hasOwn(campaign.cooldowns, id));
  if (sequence && !scheduled) return campaign;
  const promised = sequence ? campaign.chain.find(link => link.id === scheduled) : earliestEraLink(campaign, stage);
  // Allow a promised return to play out before opening an unrelated incident.
  if (promised && promised.at > tick) return campaign;
  const exactChain = promised;
  const age = tick - (campaign.core.eraOrigin?.tick ?? 0);
  const periodic =
    age >= timed.firstEventTick &&
    (age - timed.firstEventTick) % timed.eventEveryTicks === 0;
  if (!exactChain && !periodic) return campaign;
  const rng = createRng(campaign.random);
  // A village facility serves the settlement, not the entire territory that
  // could ultimately feed the population. Its reference grows with the era.
  const settlementLoad =
    campaign.core.population /
    getEra(content, campaign.core.eraId).startPopulation;
  // Local weather, food stocks and exposure vary even when the national
  // series is steady. Draw once per metric so incidents share the same season.
  const local = new Map<string, number>();
  const candidates = events.filter((entry) => {
    if (entry.era !== stage || (campaign.cooldowns[entry.id] ?? 0) > tick)
      return false;
    let value =
      entry.metric === "always"
        ? 2
        : entry.metric === "settlement_load"
          ? settlementLoad
          : (campaign.core.attributes[entry.metric]?.value ?? 10);
    if (entry.localRange) {
      let deviation = local.get(entry.metric);
      if (deviation === undefined) {
        deviation = 2 * rng.next() - 1;
        local.set(entry.metric, deviation);
      }
      value += deviation * entry.localRange;
    }
    return entry.direction === "above"
      ? value >= entry.value
      : value <= entry.value;
  });
  const fresh = candidates.filter(
    (entry) => !Object.hasOwn(campaign.cooldowns, entry.id),
  );
  const available = fresh.length ? fresh : candidates;
  const arcs = available.filter((entry) =>
    entry.responses.some((response) => response.followUp),
  );
  const urgent = available.filter((entry) =>
    campaign.crises.some(
      (crisis) => crisis.family === entry.family && crisis.severity > 32,
    ),
  );
  // The council's first meeting introduces a developing local question.
  // Later meetings first revisit active crises or introduce unheard stories.
  const list =
    age === timed.firstEventTick && arcs.length
      ? arcs
      : urgent.length
        ? urgent
        : available;
  const event = scheduled ? eventsById.get(scheduled) : exactChain
    ? eventsById.get(exactChain.id)
    : list.length
      ? list[rng.int(0, list.length - 1)]
      : undefined;
  // A legacy save can contain an undelivered incident from an earlier era.
  const chain = campaign.chain.filter(
    (item) => item !== exactChain && eventsById.get(item.id)?.era === stage,
  );
  if (!event) return { ...campaign, chain, random: rng.getState() };
  let crises = campaign.crises;
  if (event.pressureRange) {
    const before = crises.find(crisis => crisis.family === event.family)?.severity ?? 0;
    const incident = rng.int(...event.pressureRange);
    // The incident reaches a fraction of the capacity that is still available.
    const severity = before + (100 - before) * incident / 100;
    crises = [...crises.filter(crisis => crisis.family !== event.family), { family: event.family, severity }];
    const spill = event.spillover;
    if (spill) {
      const capacity = spill.at + (campaign.core.attributes[spill.buffer]!.value - 12) * 2;
      const excess = Math.max(0, severity - capacity) * spill.multiplier;
      if (excess > 0) {
        const previous = crises.find(crisis => crisis.family === spill.family)?.severity ?? 0;
        crises = [...crises.filter(crisis => crisis.family !== spill.family),
          { family: spill.family, severity: Math.min(100, previous + excess) }];
      }
    }
  }

  return appendLog(
    {
      ...campaign,
      random: rng.getState(),
      pending: { id: event.id, openedAt: tick },
      crises,
      chain,
      cooldowns: {
        ...campaign.cooldowns,
        [event.id]: tick + timed.eventCooldown,
      },
    },
    "log.event",
    {
      nameKey: "event." + event.id + ".title",
      ...(exactChain ? { result: "followUp" } : {}),
    },
  );
}

function adversity(
  campaign: Campaign,
  content: ContentBundle,
): Record<Family, number> {
  const { core } = campaign;
  const read = (id: string) => core.attributes[id]?.value ?? 10;
  const pressure = computePopulationPressure(core, content);
  const support = Math.min(
    ...socialGroups(campaign).map((group) => group.support),
  );
  function sustained(family: Family): number {
    let peak = 0;
    for (const id of crisisPressure.attributes[family]) {
      const attribute = core.attributes[id];
      if (attribute?.active) peak = Math.max(peak, attribute.pressure);
    }
    return clamp(
      (peak - crisisPressure.onset) / crisisPressure.unitsPerSeverity,
      0,
      crisisPressure.maximum,
    );
  }
  return {
    food:
      sustained("food") +
      Math.max(0, 10 - read("sustenance")) * 4 +
      Math.max(0, 9 - read("environment")) * 2 +
      Math.max(0, pressure - 1) * 10,
    health:
      sustained("health") +
      Math.max(0, 9.5 - read("health")) * 4 +
      Math.max(0, pressure - 0.95) * 7,
    clans:
      sustained("clans") +
      Math.max(0, 9.5 - read("cohesion")) * 4 +
      Math.max(0, 28 - support) * 0.23 +
      Math.max(0, read("faith") - 15) +
      Math.max(0, read("military") - 15),
    state:
      core.complexity > 3
        ? sustained("state") +
          Math.max(0, 9 - read("stability")) * 3 +
          Math.max(0, read("prosperity") - 16) * 2 +
          Math.max(0, campaign.identity.traits.corruptibility - 12) / 2
        : 0,
  };
}

export function updateCrises(
  campaign: Campaign,
  content: ContentBundle,
): Campaign {
  const tick = campaign.core.tick;
  if (
    tick % campaignTiming(campaign.pace).crisisEveryTicks !== 0 ||
    campaign.dormantUntil !== null
  )
    return campaign;
  const exposure = adversity(campaign, content);
  const previous = campaign.crises;
  const overlap =
    1 +
    previous.filter((entry) => entry.severity >= campaignBalance.crisisTrigger)
      .length *
      0.13;
  const recovery = 3 + campaign.identity.traits.resilience * 0.14;
  const crises: Crisis[] = [];
  let next = campaign;
  for (const family of families) {
    const old =
      previous.find((crisis) => crisis.family === family)?.severity ?? 0;
    const severity = clamp(old + exposure[family] * overlap - recovery, 0, 100);
    if (severity > 0.01) crises.push({ family, severity });
    if (
      severity >= campaignBalance.crisisTrigger &&
      old < campaignBalance.crisisTrigger
    ) {
      next = appendLog(next, "log.crisis", { nameKey: "family." + family });
    } else if (
      severity < campaignBalance.crisisTrigger &&
      old >= campaignBalance.crisisTrigger
    ) {
      next = appendLog(next, "log.recovery", { nameKey: "family." + family });
    }
  }

  let outcome: Outcome | null = campaign.outcome;
  let legacy = campaign.legacy;
  const severe = crises.find(
    (entry) => entry.severity >= campaignBalance.crisisStructural,
  );
  if (
    !outcome &&
    !campaign.pending &&
    severe &&
    tick >= campaign.structuralProtection &&
    campaign.core.legitimacy < 49
  ) {
    if (
      severe.family === "food" &&
      campaign.core.population <= 13 &&
      severe.severity >= 98
    ) {
      outcome = { kind: "extinction" };
      legacy += campaignBalance.legacyStructural;
      next = appendLog(next, "log.extinction");
    } else if (severe.family === "clans" && campaign.core.population > 120) {
      outcome = {
        kind: "fragment",
        names: [
          campaign.identity.name + " An",
          campaign.identity.name + " Dor",
        ],
      };
    } else {
      outcome = { kind: "dark" };
    }
  }
  return { ...next, crises, outcome, legacy };
}

export function preparation(campaign: Campaign): Campaign["core"] {
  const core = campaign.core;
  const effects: Record<string, number> = {};
  const crisisTargets: Record<Family, string> = {
    food: "sustenance",
    health: "health",
    clans: "cohesion",
    state: "stability",
  };
  for (const crisis of campaign.crises) {
    if (crisis.severity >= campaignBalance.crisisTrigger) {
      effects[crisisTargets[crisis.family]] = -crisis.severity / 39;
    }
  }
  const relations = diplomacyEffects(campaign);
  const fatigue = campaign.war?.fatigue ?? 0;
  const modifiers = (core.modifiers ?? []).filter(
    ({ id, until }) => until > core.tick && !id.startsWith("system."),
  );
  if (Object.keys(effects).length)
    modifiers.push({ id: "system.crises", until: core.tick + 2, effects });
  const character = campaign.identity.traits;
  modifiers.push({
    id: "system.traits",
    until: core.tick + 2,
    effects: {
      environment: (character.resilience - 10) / 12,
      knowledge: (character.adaptability - 10) / 10,
      cohesion: (character.coherence - 10) / 9,
      prosperity: (character.ambition - 10) / 13,
      faith: (character.memory - 10) / 11,
      stability: (10 - character.corruptibility) / 13,
    },
  });
  if (Object.keys(relations).length)
    modifiers.push({
      id: "system.trade",
      until: core.tick + 2,
      effects: relations,
    });
  if (campaign.war)
    modifiers.push({
      id: "system.war",
      until: core.tick + 2,
      effects: {
        prosperity: -0.6 - campaign.war.commitment / 90,
        stability: -fatigue / 25,
        health: -fatigue / 74,
      },
    });
  return { ...core, modifiers };
}
