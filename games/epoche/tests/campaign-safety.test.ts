import { describe, expect, it } from "vitest";
import { campaignEras, campaignTiming } from "@content/campaign/definitions";
import { loadCampaignContent } from "@content/campaign/index";
import {
  applyCampaignAction,
  catchUp,
  createCampaign,
  stepCampaign,
} from "@engine/campaign/campaign";
import {
  diplomacyEffects,
  endWar,
  pactCosts,
  peaceCost,
  raidReward,
  territories,
  tributeInfluence,
  truceBreakCost,
  truceTicks,
  warCosts,
} from "@engine/campaign/diplomacy";
import type { Campaign, Pace } from "@engine/campaign/model";
import { progression, socialGroups } from "@engine/campaign/progression";
import { enterEra, updateRivals } from "@engine/campaign/world";
import { yearsPerTick } from "@engine/core/time";
import { makeSave, parseSave } from "../src/persistence/save";
import type { FromWorker } from "../src/worker/protocol";
import { createRuntime } from "../src/worker/runtime";
import { buildCampaignView } from "../src/worker/campaignView";

const content = loadCampaignContent("rapid");
const makeCampaign = (pace: Pace = "rapid") =>
  createCampaign(loadCampaignContent(pace), {
    id: "review",
    seed: 42,
    choices: [50, 50, 50, 50],
    inherited: 0,
    pace,
  });
const initial = makeCampaign();
const queue = [{ policyId: "settlement", value: 76 }];

function atTick(tick: number, campaign = initial) {
  const era = loadCampaignContent(campaign.pace).eras[0]!;
  return {
    ...campaign.core,
    tick,
    year: era.startYear + tick * yearsPerTick(era.yearsPerMinute),
  };
}

function lowFood(
  tick: number,
  severity: number,
  population: number,
  sustenance: number,
  environment: number,
  cohesion = initial.core.attributes.cohesion!.value,
): Campaign {
  return {
    ...initial,
    core: {
      ...atTick(tick),
      population,
      attributes: {
        ...initial.core.attributes,
        sustenance: {
          ...initial.core.attributes.sustenance!,
          value: sustenance,
        },
        environment: {
          ...initial.core.attributes.environment!,
          value: environment,
        },
        cohesion: { ...initial.core.attributes.cohesion!, value: cohesion },
      },
    },
    crises: [{ family: "food", severity }],
  };
}

function restore(campaign: Campaign, elapsed = 5000) {
  const file = parseSave(JSON.stringify(makeSave(campaign, 1, 0, queue)));
  const emitted: FromWorker[] = [];
  const runtime = createRuntime(content, (message) => emitted.push(message));
  runtime.handle({
    type: "RESTORE_CAMPAIGN",
    campaign: file.campaign,
    speed: file.speed,
    elapsed,
    queued: file.queued,
  });
  runtime.handle({ type: "CAPTURE", requestId: 0 });
  return {
    report: emitted.find((message) => message.type === "ABSENCE")?.report,
    snapshot: emitted.find((message) => message.type === "SNAPSHOT")?.snapshot,
    capture: emitted.find((message) => message.type === "CAPTURED"),
  };
}

describe("campaign safety and pacing", () => {
  it("does not commit extinction offline and preserves saved queued commands", () => {
    const unsafe = lowFood(99, 70, 10, 1, 1, 1);
    expect(stepCampaign(unsafe, [], content).campaign.outcome?.kind).toBe(
      "extinction",
    );
    const { report, capture, snapshot } = restore(unsafe);
    expect(report).toMatchObject({ stopped: true, years: 0 });
    expect(capture?.campaign?.core.tick).toBe(99);
    expect(capture?.campaign?.outcome).toBeNull();
    expect(capture?.queued).toEqual(queue);
    expect(snapshot?.speed).toBe(0);
  });

  it("pauses on an emergent crisis even on the final offline tick", () => {
    const fragile = lowFood(50, 64, 30, 7, 5);
    const { report, capture, snapshot } = restore(fragile);
    expect(capture?.campaign?.core.tick).toBe(100);
    expect(
      capture?.campaign?.crises.find(({ family }) => family === "food")
        ?.severity,
    ).toBeGreaterThanOrEqual(72);
    expect(capture?.queued).toEqual([]);
    expect(report?.stopped).toBe(true);
    expect(snapshot?.speed).toBe(0);
  });

  it("stops before a lost conquest resolves and leaves peace possible", () => {
    const tick = campaignTiming("rapid").warTickLimit;
    const endangered: Campaign = {
      ...initial,
      core: { ...atTick(tick - 1), influence: 70 },
      war: {
        rival: initial.rivals[0]!.id,
        started: 0,
        objective: "conquer",
        front: -35,
        fatigue: 92,
        posture: 10,
        commitment: 10,
      },
    };
    expect(stepCampaign(endangered, [], content).campaign.outcome?.kind).toBe(
      "conquest",
    );
    const result = catchUp(endangered, 5000, 1, content, queue);
    expect(result).toMatchObject({
      campaign: endangered,
      appliedQueue: false,
      report: { stopped: true },
    });
    expect(peaceCost(result.campaign)).toBeGreaterThan(0);
    expect(
      applyCampaignAction(result.campaign, { type: "PEACE" }, content).war,
    ).toBeNull();
    const exposed = { ...endangered, war: { ...endangered.war!, front: -46 } };
    expect(catchUp(exposed, 5_000, 1, content).campaign).toBe(exposed);
  });

  it.each(["rapid", "standard"] as const)(
    "uses the same %s maturity for players and rivals and requires effective reforms",
    (pace) => {
      const paceContent = loadCampaignContent(pace);
      const campaign = makeCampaign(pace);
      const threshold =
        campaignEras[0]!.minTicks * campaignTiming(pace).tickScale;
      const ready = {
        ...atTick(threshold, campaign),
        population: 200,
        policies: {
          ...campaign.core.policies,
          settlement: {
            target: 80,
            effective: 80,
            changedAtYear: campaign.core.year,
          },
        },
      };
      const immature = {
        ...campaign,
        core: { ...ready, tick: threshold - 1 },
        rivals: campaign.rivals.map((rival) => ({
          ...rival,
          core: { ...ready, tick: threshold - 2 },
        })),
      };
      expect(progression(immature).ready).toBe(false);
      expect(
        updateRivals(immature, paceContent).every(
          ({ core }) => core.eraId === "prehistory",
        ),
      ).toBe(true);
      expect(
        updateRivals({ ...immature, core: ready }, paceContent).every(
          ({ core }) => core.eraId === "neolithic",
        ),
      ).toBe(true);
      expect(progression({ ...immature, core: ready }).ready).toBe(true);
      expect(
        progression({
          ...immature,
          core: {
            ...ready,
            policies: {
              ...ready.policies,
              settlement: { ...ready.policies.settlement!, effective: 50 },
            },
          },
        }).ready,
      ).toBe(false);
    },
  );

  it("uses low group support in the same tick's influence regeneration", () => {
    const neolithic = enterEra(initial.core, "neolithic", content);
    const sameAttributes = {
      ...initial,
      core: {
        ...neolithic,
        influence: 24,
        attributes: {
          ...neolithic.attributes,
          prosperity: { ...neolithic.attributes.prosperity!, value: 7 },
        },
      },
    };
    const discontent: Campaign = {
      ...sameAttributes,
      crises: [{ family: "food", severity: 48 }],
    };
    expect(
      Math.min(...socialGroups(discontent).map(({ support }) => support)),
    ).toBeLessThan(35);
    const normal = stepCampaign(sameAttributes, [], content).campaign.core;
    const dissent = stepCampaign(discontent, [], content).campaign.core;
    expect(dissent.legitimacy).toBeLessThan(normal.legitimacy);
    expect(dissent.influence).toBeLessThan(normal.influence);
  });
});

describe("treaties, war and import", () => {
  const rival = initial.rivals[0]!.id;
  const patron = {
    ...initial,
    core: { ...initial.core, influence: 600 },
    rivals: initial.rivals.map((entry) => ({ ...entry, relation: 46 })),
  };

  it.each([-46, -45, -44, -33, -21, -20])(
    "keeps truce acceptance and projection identical at relationship %s",
    (relation) => {
      const campaign = {
        ...patron,
        rivals: patron.rivals.map((entry) =>
          entry.id === rival ? { ...entry, relation } : entry,
        ),
      };
      const controls = buildCampaignView(campaign).rivals[0]!.pacts;
      const accepted = applyCampaignAction(
        campaign,
        { type: "PACT", rival, treaty: "truce" },
        content,
      );
      expect(controls.truce).toBe(relation >= -45 ? null : "trust");
      expect(accepted !== campaign).toBe(!controls.truce);
    },
  );

  it("projects the same trade restriction for a tributary that the engine enforces", () => {
    const war = applyCampaignAction(
      patron,
      {
        type: "WAR",
        rival,
        objective: "tribute",
        posture: 45,
        commitment: 50,
      },
      content,
    );
    const tributary = endWar(war, "win");
    const controls = buildCampaignView(tributary).rivals[0]!.pacts;
    expect(controls.trade).toBe("tribute");
    expect(controls.aid).toBeNull();
    expect(
      applyCampaignAction(
        tributary,
        { type: "PACT", rival, treaty: "trade" },
        content,
      ),
    ).toBe(tributary);
  });

  it("distinguishes alliance, commerce, tribute and territory", () => {
    const trade = applyCampaignAction(
      patron,
      { type: "PACT", rival, treaty: "trade" },
      content,
    );
    expect(patron.core.influence - trade.core.influence).toBe(pactCosts.trade);
    const alliance = applyCampaignAction(
      trade,
      { type: "PACT", rival, treaty: "alliance" },
      content,
    );
    expect(trade.core.influence - alliance.core.influence).toBe(
      pactCosts.alliance,
    );
    expect(diplomacyEffects(alliance).prosperity).toBe(
      diplomacyEffects(trade).prosperity,
    );
    expect(diplomacyEffects(alliance).military).toBeGreaterThan(
      diplomacyEffects(trade).military!,
    );

    for (const objective of ["raid", "defend", "tribute", "conquer"] as const) {
      const war = applyCampaignAction(
        patron,
        { type: "WAR", rival, objective, posture: 45, commitment: 50 },
        content,
      );
      expect(war.war?.objective).toBe(objective);
      expect(patron.core.influence - war.core.influence).toBe(
        warCosts[objective],
      );
      const winner = endWar(war, "win");
      if (objective === "raid")
        expect(winner.core.influence - war.core.influence).toBe(raidReward);
      if (objective === "defend")
        expect(winner.core.modifiers).toContainEqual(
          expect.objectContaining({ effects: { cohesion: 2 } }),
        );
      if (objective === "tribute")
        expect(tributeInfluence(winner)).toBeGreaterThan(0);
      if (objective === "conquer") {
        expect(territories(winner)).toBe(territories(patron) + 1);
        expect(diplomacyEffects(winner).sustenance).toBeGreaterThan(
          diplomacyEffects(patron).sustenance!,
        );
      }
    }
  });

  it("keeps trade during a fixed truce, and charges for breaking it", () => {
    const ceasefire = applyCampaignAction(
      patron,
      { type: "PACT", rival, treaty: "truce" },
      content,
    );
    const trade = applyCampaignAction(
      ceasefire,
      { type: "PACT", rival, treaty: "trade" },
      content,
    );
    const truce = trade.rivals[0]!;
    expect(truce.treaty).toBe("trade");
    expect(truceTicks(trade, truce)).toBeGreaterThan(0);
    const attack = {
      type: "WAR",
      rival,
      objective: "raid",
      posture: 45,
      commitment: 70,
    } as const;
    const breach = applyCampaignAction(trade, attack, content);
    expect(trade.core.influence - breach.core.influence).toBe(
      warCosts.raid + truceBreakCost,
    );
    expect(breach.rivals[1]!.relation).toBeLessThan(trade.rivals[1]!.relation);
    const expired = {
      ...trade,
      core: { ...atTick(truce.truceUntil!), influence: 80 },
    };
    expect(truceTicks(expired, truce)).toBe(0);
    expect(
      expired.core.influence -
        applyCampaignAction(expired, attack, content).core.influence,
    ).toBe(warCosts.raid);
  });

  it("round trips a hundred aid actions and restores earlier saves with duplicate grants", () => {
    let campaign = patron;
    for (let index = 0; index < 100; index++) {
      const next = applyCampaignAction(
        campaign,
        { type: "PACT", rival, treaty: "aid" },
        content,
      );
      expect(next).not.toBe(campaign);
      campaign = next;
    }
    const grant = campaign.rivals[0]!.core.modifiers![0]!;
    expect(campaign.rivals[0]!.core.modifiers).toHaveLength(1);
    const legacy = {
      ...campaign,
      rivals: campaign.rivals.map((entry) =>
        entry.id === rival
          ? {
              ...entry,
              core: { ...entry.core, modifiers: Array(100).fill(grant) },
            }
          : entry,
      ),
    };
    const roundTrip = (value: Campaign) =>
      parseSave(JSON.stringify(makeSave(value, 1, 0))).campaign;
    expect(roundTrip(campaign).rivals[0]!.core.modifiers).toHaveLength(1);
    expect(roundTrip(legacy).rivals[0]!.core.modifiers).toHaveLength(1);
    expect(
      updateRivals(
        {
          ...campaign,
          core: atTick(450),
          rivals: campaign.rivals.map((entry) => ({
            ...entry,
            core: { ...entry.core, tick: 420 },
          })),
        },
        content,
      )[0]!.core.modifiers,
    ).toEqual([]);
  });
});

it.each(["rapid", "standard"] as const)(
  "projects the exact %s exile duration and consistently blocks progress and foreign affairs",
  (pace) => {
    const campaign = makeCampaign(pace);
    const paceContent = loadCampaignContent(pace);
    const tick = campaignEras[0]!.minTicks * campaignTiming(pace).tickScale;
    const rival = campaign.rivals[0]!.id;
    const mature: Campaign = {
      ...campaign,
      core: {
        ...atTick(tick, campaign),
        population: 250,
        influence: 90,
        policies: {
          ...campaign.core.policies,
          settlement: {
            target: 80,
            effective: 80,
            changedAtYear: campaign.core.year,
          },
        },
      },
      outcome: { kind: "conquest", rival },
    };
    const exile = applyCampaignAction(
      mature,
      { type: "OUTCOME", choice: 1 },
      paceContent,
    );
    const view = buildCampaignView(exile);
    expect(view.progress.ready).toBe(true);
    expect(view.dormantTicks).toBe(pace === "standard" ? 7_200 : 360);
    expect(view.actionBlock).toBe("dormant");
    expect(view.rivals[0]!.pacts).toEqual({
      trade: "dormant",
      truce: "dormant",
      alliance: "dormant",
      aid: "dormant",
    });
    expect(view.rivals[0]!.warOrders.conquer).toBe("dormant");
    expect(applyCampaignAction(exile, { type: "ADVANCE" }, paceContent)).toBe(
      exile,
    );
    expect(
      applyCampaignAction(
        exile,
        { type: "PACT", rival, treaty: "aid" },
        paceContent,
      ),
    ).toBe(exile);
    const nearEnd = {
      ...exile,
      core: { ...exile.core, tick: exile.dormantUntil! - 1 },
    };
    expect(buildCampaignView(nearEnd).dormantTicks).toBe(1);
    const awake = stepCampaign(nearEnd, [], paceContent).campaign;
    expect(awake.dormantUntil).toBeNull();
    expect(buildCampaignView(awake).actionBlock).toBeNull();
    expect(buildCampaignView(awake).dormantTicks).toBe(0);
  },
);
