import {needsHearing,previewHearing} from "../engine/campaign/reckoning";
import {
  campaignBalance,
  traditions,
  families,

  campaignEras,
  eventsById,
} from "@content/campaign/definitions";
import {
  campaignActionBlock,
  dormantTicks,
  remainingTradition,
  urgentDecision,
  type Campaign,
} from "@engine/campaign/model";
import { responsesFor } from "@engine/campaign/events";
import {
  pactBlock,
  pactCosts,
  peaceBlock,
  peaceCost,
  raidReward,
  territories,
  truceBreakCost,
  truceTicks,
  warBlock,
  warCosts,
} from "@engine/campaign/diplomacy";
import { progression, socialGroups } from "@engine/campaign/progression";
import { eraNumber } from "@engine/campaign/world";

export function buildCampaignView(campaign: Campaign) {
  const stage = eraNumber(campaign.core.eraId);
  const profile = campaignEras[stage]!;
  const event = eventsById.get(campaign.pending?.id ?? "");
  return {
    id: campaign.id,
    seed: campaign.seed,
    rules: campaign.rules, marks:campaign.marks, studyFinished:campaign.studyFinished,
    hearing: campaign.reckoning ? {...campaign.reckoning,options:previewHearing(campaign)} : null,
    hearingAhead: needsHearing(campaign,stage+1),
    replay:{seed:campaign.seed,choices:campaign.choices,pace:campaign.pace,inherited:campaign.inherited},
    stage,
    eraId: campaign.core.eraId,
    heritage: campaign.heritage,
    deferred: campaign.deferred,
    threatened: families.filter(family => campaign.deferred.some(entry => entry.family === family && entry.due <= stage + 1) &&
      (campaign.crises.find(crisis => crisis.family === family)?.severity ?? 0) +
      campaign.deferred.reduce((sum, entry) => sum + (entry.family === family && entry.due <= stage + 1 ? entry.points : 0), 0) >= 100),
    traditionLife: Object.fromEntries(traditions.map(site => [site,
      remainingTradition(campaign, site),
    ])),
    palette: profile.palette,
    identity: {
      name: campaign.identity.name,
      archetype: campaign.identity.archetype,
      traits: Object.fromEntries(
        campaign.identity.revealed.map((trait) => [
          trait,
          campaign.identity.traits[trait],
        ]),
      ),
    },
    regions: campaign.regions,
    rivals: campaign.rivals.map((rival) => ({
      id: rival.id,
      name: rival.identity.name,
      archetype: rival.identity.archetype,
      eraId: rival.core.eraId,
      population: rival.core.population,
      relation: rival.relation,
      treaty: rival.treaty,
      truceTicks: truceTicks(campaign, rival),
      territories: territories(campaign, rival.id),
      pacts: {
        trade: pactBlock(campaign, rival, "trade"),
        truce: pactBlock(campaign, rival, "truce"),
        alliance: pactBlock(campaign, rival, "alliance"),
        aid: pactBlock(campaign, rival, "aid"),
      },
      warOrders: {
        raid: warBlock(campaign, rival, "raid"),
        defend: warBlock(campaign, rival, "defend"),
        tribute: warBlock(campaign, rival, "tribute"),
        conquer: warBlock(campaign, rival, "conquer"),
      },
    })),
    doctrine: campaign.doctrine,
    legacy: campaign.legacy,
    war: campaign.war,
    diplomacy: {
      pactCosts,
      warCosts,
      truceBreakCost,
      raidReward,
      peaceCost: peaceCost(campaign),
      peaceBlock: peaceBlock(campaign),
      territories: territories(campaign),
    },
    chronicle: campaign.chronicle,
    progress: progression(campaign),
    groups: socialGroups(campaign),
    pressures: campaign.crises.filter(({severity}) => severity > 0),
    crises: campaign.crises.filter(
      ({ severity }) => severity >= campaignBalance.crisisTrigger,
    ),
    event: event
      ? {
          id: event.id,
          openedAt: campaign.pending!.openedAt,
          family: event.family,
          severity: event.pressureRange || event.responses.every(option => option.strain)
            ? campaign.crises.find(crisis => crisis.family === event.family)?.severity ?? 0
            : undefined,
          fallbackIndex: event.fallbackIndex,
          decisive: urgentDecision(campaign),
          responses: responsesFor(campaign, event),
        }
      : null,
    outcome: campaign.outcome,
    actionBlock: campaignActionBlock(campaign),
    dormantTicks: dormantTicks(campaign),
  };
}

export type CampaignView = ReturnType<typeof buildCampaignView>;
