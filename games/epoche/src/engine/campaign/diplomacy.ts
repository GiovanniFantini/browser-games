import {
  campaignTiming,
  diplomacyBalance,
} from "@content/campaign/definitions";
import { clamp } from "../core/math";
import {
  campaignActionBlock,
  type Campaign,
  type CampaignAction,
  type Rival,
} from "./model";
import { appendLog } from "./progression";
import { playerOwner } from "./world";

type PactAction = Extract<CampaignAction, { type: "PACT" }>;
type WarAction = Extract<CampaignAction, { type: "WAR" }>;
export const { pactCosts, warCosts, truceBreakCost, raidReward } =
  diplomacyBalance;
const { truceDuration, pactTrust } = diplomacyBalance;

export function truceTicks(campaign: Campaign, rival: Rival): number {
  return Math.max(
    0,
    (rival.truceUntil ??
      (rival.treaty === "truce"
        ? campaign.core.tick +
          truceDuration * campaignTiming(campaign.pace).tickScale
        : 0)) - campaign.core.tick,
  );
}

export function refreshTruces(campaign: Campaign): Rival[] {
  return campaign.rivals.map((rival) => {
    if (rival.treaty === "truce" && rival.truceUntil === undefined)
      return {
        ...rival,
        truceUntil: campaign.core.tick + truceTicks(campaign, rival),
      };
    if (rival.truceUntil !== undefined && !truceTicks(campaign, rival))
      return {
        ...rival,
        truceUntil: undefined,
        treaty: rival.treaty === "truce" ? "none" : rival.treaty,
      };
    return rival;
  });
}

export function territories(campaign: Campaign, owner = playerOwner): number {
  let count = 0;
  for (const tile of campaign.regions) if (tile.owner === owner) count++;
  return count;
}

export function tributeInfluence(campaign: Campaign): number {
  return (
    campaign.rivals.filter(({ treaty }) => treaty === "tribute").length *
    diplomacyBalance.tributeInfluencePerYear
  );
}

export function diplomacyEffects(campaign: Campaign): Record<string, number> {
  const allies = campaign.rivals.filter(
    ({ treaty }) => treaty === "alliance",
  ).length;
  const trade =
    campaign.rivals.filter(({ treaty }) => treaty === "trade").length + allies;
  const tribute = campaign.rivals.filter(
    ({ treaty }) => treaty === "tribute",
  ).length;
  const { landOffset, landReference, landSustenanceFactor, tradeEffects } =
    diplomacyBalance;
  const land =
    Math.log2((territories(campaign) + landOffset) / landReference) *
    landSustenanceFactor;
  return {
    prosperity:
      trade * tradeEffects.prosperity +
      tribute * diplomacyBalance.tributeProsperity,
    sustenance: trade * tradeEffects.sustenance + land,
    military: allies * diplomacyBalance.allianceMilitary,
  };
}

export function peaceCost(campaign: Campaign): number | null {
  const front = campaign.war?.front;
  const { peaceRefusalFront, peaceFreeFront, peaceInfluenceInterval } =
    diplomacyBalance;
  if (front === undefined || front <= peaceRefusalFront) return null;
  return Math.ceil(
    Math.max(0, peaceFreeFront - front) / peaceInfluenceInterval,
  );
}

export function peaceBlock(campaign: Campaign) {
  const blocked = campaignActionBlock(campaign);
  if (blocked) return blocked;
  const cost = peaceCost(campaign);
  if (cost === null) return "peace";
  return campaign.core.influence < cost ? "influence" : null;
}

export function negotiatePeace(campaign: Campaign): Campaign {
  const cost = peaceCost(campaign);
  if (cost === null || peaceBlock(campaign)) return campaign;
  return endWar(
    {
      ...campaign,
      core: { ...campaign.core, influence: campaign.core.influence - cost },
    },
    "peace",
  );
}

function updateRival(
  campaign: Campaign,
  rivalId: string,
  update: (rival: Rival) => Rival,
): Campaign {
  return {
    ...campaign,
    rivals: campaign.rivals.map((rival) =>
      rival.id === rivalId ? update(rival) : rival,
    ),
  };
}

export function pactBlock(
  campaign: Campaign,
  rival: Rival,
  treaty: PactAction["treaty"],
) {
  const blocked = campaignActionBlock(campaign);
  if (blocked) return blocked;
  if (campaign.war?.rival === rival.id) return "war";
  if (campaign.core.influence < pactCosts[treaty]) return "influence";
  if (treaty === "aid") return null;
  if (rival.relation < pactTrust[treaty]) return "trust";
  if (treaty === "truce" && truceTicks(campaign, rival) > 0) return "existing";
  if (treaty !== "truce" && rival.treaty === treaty) return "existing";
  if (treaty === "trade" && rival.treaty === "alliance") return "alliedTrade";
  if (treaty === "trade" && rival.treaty === "tribute") return "tribute";
  return null;
}

export function pact(campaign: Campaign, action: PactAction): Campaign {
  const rival = campaign.rivals.find(({ id }) => id === action.rival);
  if (!rival || pactBlock(campaign, rival, action.treaty)) return campaign;
  const cost = pactCosts[action.treaty];
  const duration = campaignTiming(campaign.pace).tickScale;
  const next = updateRival(campaign, rival.id, (entry) => ({
    ...entry,
    treaty:
      action.treaty === "aid" ||
      (action.treaty === "truce" && entry.treaty !== "none")
        ? entry.treaty
        : action.treaty,
    truceUntil:
      action.treaty === "truce"
        ? campaign.core.tick + truceDuration * duration
        : entry.truceUntil,
    relation: clamp(
      entry.relation +
        (action.treaty === "aid"
          ? diplomacyBalance.aidRelationGain
          : diplomacyBalance.pactRelationGain),
      -100,
      100,
    ),
    core:
      action.treaty === "aid"
        ? {
            ...entry.core,
            modifiers: [
              ...(entry.core.modifiers ?? []).filter(
                ({ id, until }) =>
                  id !== "system.aid" && until > entry.core.tick,
              ),
              {
                id: "system.aid",
                until:
                  entry.core.tick + diplomacyBalance.aidDuration * duration,
                effects: diplomacyBalance.aidEffects,
              },
            ],
          }
        : entry.core,
  }));
  return appendLog(
    { ...next, core: { ...next.core, influence: next.core.influence - cost } },
    "log.pact",
    { name: rival.identity.name },
  );
}

export function warBlock(
  campaign: Campaign,
  rival: Rival,
  objective: WarAction["objective"],
  aggression = false,
) {
  const blocked = campaignActionBlock(campaign);
  if (blocked) return blocked;
  if (campaign.war) return "war";
  if (rival.treaty === "alliance") return "alliance";
  const breach = truceTicks(campaign, rival) > 0;
  if (aggression && breach) return "existing";
  const cost = aggression
    ? 0
    : warCosts[objective] + (breach ? truceBreakCost : 0);
  if (campaign.core.influence < cost) return "influence";
  if (
    objective === "conquer" &&
    (!territories(campaign, rival.id) || !territories(campaign))
  )
    return "territory";
  return null;
}

export function openWar(
  campaign: Campaign,
  action: WarAction,
  aggression = false,
): Campaign {
  const rival = campaign.rivals.find(({ id }) => id === action.rival);
  if (!rival || warBlock(campaign, rival, action.objective, aggression))
    return campaign;
  const breach = truceTicks(campaign, rival) > 0;
  const cost = aggression
    ? 0
    : warCosts[action.objective] + (breach ? truceBreakCost : 0);
  let next = updateRival(campaign, rival.id, (entry) => ({
    ...entry,
    relation: -65,
    treaty: "none",
    truceUntil: undefined,
  }));
  if (breach) {
    next = {
      ...next,
      rivals: next.rivals.map((entry) =>
        entry.id === rival.id
          ? entry
          : {
              ...entry,
              relation: clamp(
                entry.relation - diplomacyBalance.truceBreakRelationCost,
                -100,
                100,
              ),
            },
      ),
    };
  }
  return appendLog(
    {
      ...next,
      core: {
        ...next.core,
        influence: next.core.influence - cost,
      },
      war: {
        rival: rival.id,
        objective: action.objective,
        posture: clamp(action.posture, 0, 100),
        commitment: clamp(action.commitment, 10, 100),
        front: 0,
        fatigue: 0,
        started: campaign.core.tick,
      },
    },
    "log.war",
    { name: rival.identity.name },
  );
}

export function endWar(
  campaign: Campaign,
  result: "win" | "lose" | "peace",
): Campaign {
  const war = campaign.war;
  const rival = campaign.rivals.find(({ id }) => id === war?.rival);
  if (!war || !rival) return campaign;
  let next = updateRival(campaign, rival.id, (entry) => ({
    ...entry,
    relation: result === "peace" ? -4 : -33,
    treaty:
      result === "win" && war.objective === "tribute" ? "tribute" : "truce",
    truceUntil:
      campaign.core.tick +
      truceDuration * campaignTiming(campaign.pace).tickScale,
  }));
  if (
    (result === "win" && war.objective === "conquer") ||
    (result === "lose" && war.objective === "defend")
  ) {
    const from = result === "win" ? rival.id : playerOwner;
    const to = result === "win" ? playerOwner : rival.id;
    const holdings = next.regions.filter((tile) => tile.owner === from);
    const territory =
      holdings.find((tile) =>
        next.regions.some(
          (border) =>
            border.owner === to &&
            Math.abs(border.row - tile.row) +
              Math.abs(border.column - tile.column) ===
              1,
        ),
      ) ?? holdings[0];
    if (territory)
      next = {
        ...next,
        regions: next.regions.map((tile) =>
          tile.id === territory.id ? { ...tile, owner: to } : tile,
        ),
      };
  }
  return appendLog(
    {
      ...next,
      war: null,
      core: {
        ...next.core,
        influence:
          next.core.influence +
          (result === "win" && war.objective === "raid" ? raidReward : 0),
        modifiers:
          result === "win" && war.objective === "defend"
            ? [
                ...(next.core.modifiers ?? []).filter(
                  ({ id }) => id !== "war.defence",
                ),
                {
                  id: "war.defence",
                  until:
                    next.core.tick +
                    diplomacyBalance.defenceDuration *
                      campaignTiming(campaign.pace).tickScale,
                  effects: diplomacyBalance.defenceEffects,
                },
              ]
            : next.core.modifiers,
      },
      outcome:
        result === "lose" &&
        (war.objective === "conquer" || campaign.core.legitimacy < 36)
          ? { kind: "conquest", rival: rival.id }
          : next.outcome,
    },
    "log.peace",
    { name: rival.identity.name, result: "world." + result },
  );
}

export function updateWar(campaign: Campaign): Campaign {
  const war = campaign.war;
  const rival = campaign.rivals.find(({ id }) => id === war?.rival);
  if (!war || !rival) return campaign;
  const timing = campaignTiming(campaign.pace);
  const strengths = (core: Campaign["core"]) => {
    const attr = (id: string) => core.attributes[id]?.value ?? 9;
    return (
      attr("military") *
      (0.7 + attr("cohesion") / 33 + attr("innovation") / 55) *
      (0.6 + Math.min(2, Math.log10(core.population) / 4))
    );
  };
  const playerStrength =
    strengths(campaign.core) *
    (0.54 + war.commitment / 115) *
    (0.9 + war.posture / 265) *
    (1 - war.fatigue / 240) *
    (war.objective === "defend" ? 1.09 : 1);
  const rivalStrength =
    strengths(rival.core) * (0.81 + rival.identity.traits.ambition / 42);
  const delta =
    clamp((playerStrength - rivalStrength) / 48, -0.21, 0.21) /
    timing.tickScale;
  const front = clamp(war.front + delta, -100, 100);
  const fatigue = clamp(
    war.fatigue +
      ((war.commitment / 100 + war.posture / 175) * 0.096) / timing.tickScale,
    0,
    100,
  );
  const hours = campaign.core.tick - war.started;
  const next = {
    ...campaign,
    war: { ...war, front, fatigue },
    core: {
      ...campaign.core,
      population: Math.max(
        10,
        campaign.core.population *
          (1 - fatigue / (3_000_000 * timing.tickScale)),
      ),
    },
  };
  if (front >= 75) return endWar(next, "win");
  if (front <= -75) return endWar(next, "lose");
  if (hours >= timing.warTickLimit)
    return endWar(next, front > 28 ? "win" : front < -28 ? "lose" : "peace");
  return next;
}
