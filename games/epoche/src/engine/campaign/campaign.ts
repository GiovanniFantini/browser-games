import { needsHearing, openHearing, resolveHearing } from "./reckoning";
import {
  campaignBalance,
  campaignEras,
  campaignTiming,
  eventsById,
} from "@content/campaign/definitions";
import type { ContentBundle } from "@content/schema";
import type { Command, Speed } from "../core/commands";
import { clamp } from "../core/math";
import { TICKS_PER_SECOND } from "../core/time";
import { getEra } from "../state/contentIndex";
import { createNewGame } from "../state/newGame";
import { step } from "../step";
import {
  negotiatePeace,
  openWar,
  pact,
  refreshTruces,
  tributeInfluence,
  updateWar,
} from "./diplomacy";
import {
  applyResponse,
  doctrineResponse,
  maybeOpenEvent,
  preparation,
  settleEraChain,
  updateCrises,
} from "./events";
import type {
  AbsenceReport,
  Campaign,
  CampaignAction,
  QueuedPolicy,
  Rival,
  StartCampaign,
} from "./model";
import { campaignActionBlock, urgentDecision } from "./model";
import {
  advanceEra,
  advanceHeritage,
  settleDeferred,
  appendLog,
  revealTrait,
  socialGroups,
} from "./progression";
import {
  createIdentity,
  genesisRng,
  enterEra,
  eraNumber,
  makeWorld,
  playerOwner,
  updateRivals,
} from "./world";

export function createCampaign(
  content: ContentBundle,
  input: StartCampaign,
): Campaign {
  const rng = genesisRng(input.seed, input.choices);
  const identity = createIdentity(rng, input.choices, 0);
  const rivals: Rival[] = Array.from({ length: 3 }, (_, index) => ({
    id: "rival-" + index,
    identity: createIdentity(rng, input.choices, index + 1),
    core: createNewGame(content, rng.int(1, 2_147_483_647)),
    relation: rng.int(-24, 15),
    treaty: "none",
  }));
  const regions = makeWorld(rng, input.choices[1], rivals);
  const core = createNewGame(content, input.seed);
  return appendLog(
    {
      version: 2,
      inherited: input.inherited, reckoning:null, marks:{}, studyFinished:false, winterStock:0,
      rules: input.rules ?? "current",
      pace: input.pace ?? "rapid",
      id: input.id,
      seed: input.seed,
      choices: input.choices,
      core: {
        ...core,
        influence: Math.min(
          getEra(content, core.eraId).influenceCap,
          core.influence + Math.min(24, input.inherited),
        ),
      },
      identity,
      regions,
      rivals,
      random: rng.getState(),
      chronicle: [],
      deferred: [],
      heritage: [],
      renewedIn: {},
      sequence: 0,
      crises: [],
      cooldowns: {},
      chain: [],
      pending: null,
      outcome: null,
      war: null,
      doctrine: "prudence",
      legacy: 0,
      highestEra: 0,
      dormantUntil: null,
      structuralProtection: 0,
    },
    "log.founded",
    { name: identity.name },
  );
}

function resolveOutcome(
  campaign: Campaign,
  choice: number,
  content: ContentBundle,
): Campaign {
  const current = campaign.outcome;
  if (!current || !Number.isSafeInteger(choice) || choice < 0 || choice > 1)
    return campaign;
  const core = campaign.core;
  const { tickScale } = campaignTiming(campaign.pace);
  const sheltered: Campaign = {
    ...campaign,
    war: null,
    outcome: null,
    crises: [],
    pending: null,
    structuralProtection:
      core.tick + campaignBalance.rebuildingTicks * tickScale,
    legacy: campaign.legacy + campaignBalance.legacyStructural,
  };
  if (current.kind === "dark" && choice === 0) {
    const former = campaignEras[Math.max(0, eraNumber(core.eraId) - 1)]!;
    return appendLog(
      { ...sheltered, core: enterEra(core, former.id, content, true) },
      "log.dark",
    );
  }
  if (current.kind === "fragment") {
    const name = current.names[choice];
    const other = current.names[1 - choice];
    if (!name || !other) return campaign;
    const childId = "fragment-" + core.tick;
    const childCore = {
      ...core,
      population: Math.max(10, core.population * 0.38),
    };
    const child: Rival = {
      id: childId,
      identity: { ...campaign.identity, name: other },
      core: childCore,
      relation: -7,
      treaty: "none",
    };
    const regions = campaign.regions.map((tile) =>
      tile.owner === playerOwner && tile.id % 3 === choice
        ? { ...tile, owner: childId }
        : tile,
    );
    return appendLog(
      {
        ...sheltered,
        regions,
        rivals: [...campaign.rivals, child],
        core: { ...core, population: Math.max(10, core.population * 0.62) },
        identity: { ...campaign.identity, name },
      },
      "log.split",
      { name },
    );
  }
  if (current.kind === "conquest") {
    const victor = campaign.rivals.find((rival) => rival.id === current.rival);
    if (!victor) return campaign;
    if (choice === 1) {
      return appendLog(
        {
          ...sheltered,
          dormantUntil: core.tick + campaignBalance.exileTicks * tickScale,
          core: { ...core, population: Math.max(10, core.population * 0.67) },
        },
        "log.dormant",
      );
    }
    const date = Math.max(core.year, victor.core.year);
    const regions = campaign.regions.map((tile) =>
      tile.owner === victor.id
        ? { ...tile, owner: playerOwner }
        : tile.owner === playerOwner
          ? { ...tile, owner: victor.id }
          : tile,
    );
    const rivals = campaign.rivals.map((rival) =>
      rival.id === victor.id
        ? {
            ...rival,
            identity: campaign.identity,
            core: { ...core, population: Math.max(10, core.population * 0.52) },
            relation: -21,
            treaty: "truce" as const,
            truceUntil: undefined,
          }
        : rival,
    );
    const nextCore = {
      ...victor.core,
      year: date,
      tick: core.tick,
      eraOrigin: { year: date, tick: core.tick },
      modifiers: [],
    };
    const migrated = appendLog(
      {
        ...sheltered,
        regions,
        rivals,
        core: nextCore,
        identity: victor.identity,
        ...advanceHeritage(sheltered, eraNumber(nextCore.eraId)),
      },
      "log.migrate",
      { name: victor.identity.name },
    );
    return needsHearing(campaign,eraNumber(nextCore.eraId)) ? openHearing(migrated,eraNumber(nextCore.eraId),"migration") : settleDeferred(migrated);
  }
  return campaign;
}

export function applyCampaignAction(
  campaign: Campaign,
  action: CampaignAction,
  content: ContentBundle,
): Campaign {
  if(action.type==="RECKON")return resolveHearing(campaign,action.token,action.remedy,content);
  if(campaign.reckoning || campaign.studyFinished)return campaign;
  if (action.type === "DOCTRINE")
    return { ...campaign, doctrine: action.doctrine };
  if (action.type === "RESPOND") {
    if (
      action.eventId !== undefined &&
      (campaign.pending?.id !== action.eventId ||
        campaign.pending?.openedAt !== action.openedAt)
    )
      return campaign;
    return applyResponse(campaign, action.choice, content);
  }
  if (action.type === "OUTCOME")
    return resolveOutcome(campaign, action.choice, content);
  if (campaignActionBlock(campaign)) return campaign;
  switch (action.type) {
    case "ADVANCE": {
      const advanced = advanceEra(campaign, content);
      if (advanced === campaign) return campaign;
      const followUp = settleEraChain(campaign, content);
      if(followUp!==campaign)return followUp;
      const target=eraNumber(advanced.core.eraId);
      if(target>eraNumber(campaign.core.eraId) && needsHearing(campaign,target))return openHearing(campaign,target,"advance");
      return advanced;
    }
    case "PACT":
      return pact(campaign, action);
    case "WAR":
      return openWar(campaign, action);
    case "WAR_POLICY":
      return campaign.war
        ? {
            ...campaign,
            war: {
              ...campaign.war,
              posture: clamp(action.posture, 0, 100),
              commitment: clamp(action.commitment, 10, 100),
            },
          }
        : campaign;
    case "PEACE":
      return negotiatePeace(campaign);
  }
}

export function stepCampaign(
  campaign: Campaign,
  commands: readonly Command[],
  content: ContentBundle,
) {
  if(campaign.reckoning || campaign.studyFinished)return {campaign,commandResults:[]};
  const minimumSupport = Math.min(
    ...socialGroups(campaign).map((group) => group.support),
  );
  const dissent =
    Math.max(0, campaignBalance.dissentThreshold - minimumSupport) *
    campaignBalance.dissentWeight;
  const result = step(preparation(campaign), commands, content, {
    legitimacyPenalty: dissent,
    influenceBonusPerYear: tributeInfluence(campaign),
  });
  let next: Campaign = { ...campaign, core: result.state };
  if (next.dormantUntil !== null && next.core.tick >= next.dormantUntil) {
    next = appendLog({ ...next, dormantUntil: null }, "log.founded", {
      name: next.identity.name,
    });
  }
  for (const { policyId, result: response } of result.commandResults) {
    if (response.ok)
      next = appendLog(next, "log.policyChosen", {
        nameKey: "policy." + policyId,
        setting: response.value,
      });
  }
  for (const [id, policy] of Object.entries(next.core.policies)) {
    const before = campaign.core.policies[id];
    if (
      before &&
      before.effective !== policy.effective &&
      policy.effective === policy.target
    ) {
      const key =
        id === "fields"
          ? policy.effective > before.effective
            ? "log.fieldsExpand"
            : "log.fieldsProtect"
          : "log.policySettled";
      next = appendLog(next, key, {
        nameKey: "policy." + id,
        setting: policy.target,
      });
    }
  }
  if (
    next.pending &&
    next.core.tick - next.pending.openedAt >=
      campaignBalance.decisionWindowTicks &&
    !urgentDecision(next)
  )
    next = applyResponse(next, eventsById.get(next.pending.id)!.fallbackIndex, content);
  if (next.reckoning) return { campaign: next, commandResults: result.commandResults };
  if (next.core.tick % campaignBalance.worldUpdateTicks === 0) {
    next = { ...next, rivals: refreshTruces(next) };
    next = { ...next, rivals: updateRivals(next, content) };
    const hostile = next.rivals.find(
      (rival) =>
        rival.relation < -54 &&
        rival.identity.traits.ambition > 12 &&
        rival.treaty === "none",
    );
    if (hostile && !next.war && eraNumber(next.core.eraId) >= 2) {
      next = openWar(
        next,
        {
          type: "WAR",
          rival: hostile.id,
          objective: "defend",
          posture: 30,
          commitment: 45,
        },
        true,
      );
    }
  }
  next = updateWar(next);
  next = updateCrises(next, content);
  next = revealTrait(next);
  next = maybeOpenEvent(next, content);
  return { campaign: next, commandResults: result.commandResults };
}

function pauseOffline(campaign: Campaign): boolean {
  return Boolean(
    campaign.outcome ||
    urgentDecision(campaign) ||
    campaign.crises.some(
      ({ severity }) => severity >= campaignBalance.absenceCrisisStop,
    ) ||
    (campaign.war && campaign.war.front <= campaignBalance.absenceWarStop),
  );
}

export function catchUp(
  campaign: Campaign,
  elapsedMs: number,
  speed: Speed,
  content: ContentBundle,
  queued: readonly QueuedPolicy[] = [],
  onProgress?: (percent: number) => void,
): { campaign: Campaign; report: AbsenceReport | null; appliedQueue: boolean } {
  const maxMs = campaignBalance.absenceHours * 60 * 60 * 1000;
  const ticks = Math.floor(
    (Math.min(maxMs, Math.max(0, elapsedMs)) / 1000) * TICKS_PER_SECOND * speed,
  );
  if (ticks < TICKS_PER_SECOND * 5 || campaign.outcome)
    return { campaign, report: null, appliedQueue: false };
  let next = campaign;
  let stopped = pauseOffline(next);
  let appliedQueue = false;
  let doctrineCost = 0;
  const progressInterval = Math.max(256, Math.ceil(ticks / 100));
  for (let elapsed = 0; elapsed < ticks && !stopped; elapsed++) {
    if (onProgress && elapsed % progressInterval === 0)
      onProgress(Math.floor((100 * elapsed) / ticks));
    const prepared = next.pending ? doctrineResponse(next, content) : next;
    const commands =
      elapsed === 0
        ? queued.map((order) => ({
            ...order,
            type: "SET_POLICY" as const,
            tick: prepared.core.tick + 1,
          }))
        : [];
    const advanced = stepCampaign(prepared, commands, content).campaign;
    stopped = pauseOffline(advanced);
    if (advanced.outcome) break;
    doctrineCost += next.core.influence - prepared.core.influence;
    next = advanced;
    if (commands.length) appliedQueue = true;
  }
  return {
    campaign: next,
    appliedQueue,
    report: {
      years: next.core.year - campaign.core.year,
      populationBefore: campaign.core.population,
      populationAfter: next.core.population,
      doctrineCost,
      awaySeconds: Math.floor(elapsedMs / 1000),
      recoveredSeconds: Math.floor(
        (next.core.tick - campaign.core.tick) / (TICKS_PER_SECOND * speed),
      ),
      speed,
      influenceBefore: campaign.core.influence,
      influenceAfter: next.core.influence,
      legitimacyBefore: campaign.core.legitimacy,
      legitimacyAfter: next.core.legitimacy,
      entries: next.sequence - campaign.sequence,
      stopped,
    },
  };
}
