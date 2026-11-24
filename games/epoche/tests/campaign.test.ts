import { describe, expect, it } from "vitest";
import { loadCampaignContent } from "@content/campaign/index";
import {
  campaignEras,
  events,
  eventsById,
} from "@content/campaign/definitions";
import {
  applyCampaignAction,
  catchUp,
  createCampaign,
  stepCampaign,
} from "@engine/campaign/campaign";
import type { Campaign, StartCampaign } from "@engine/campaign/model";
import { enterEra } from "@engine/campaign/world";
import { makeSave, parseSave } from "../src/persistence/save";
import { runCampaign } from "../tools/sim/campaign";

const content = loadCampaignContent();
const input: StartCampaign = {
  id: "verified",
  seed: 832,
  choices: [20, 75, 60, 42],
  inherited: 0,
};
const newCampaign = () => createCampaign(content, input);

describe("campaign", () => {
  it("generates a deterministic world and changes it with Genesis choices", () => {
    const original = newCampaign();
    expect(newCampaign()).toEqual(original);
    const other = createCampaign(content, {
      ...input,
      choices: [60, 12, 44, 15],
    });
    expect(other.regions).not.toEqual(original.regions);
    expect(new Set(original.regions.map(({ owner }) => owner)).size).toBe(5);
    expect(content.eras).toHaveLength(10);
    expect(events.filter(({ era }) => era <= 1).length).toBeGreaterThanOrEqual(
      40,
    );
  });

  it("changes era while preserving elapsed tick and monotonically advancing historical time", () => {
    const start = newCampaign();
    const original = { ...start.core, tick: 2250, year: -299250 };
    const core = enterEra(original, "neolithic", content);
    expect(core.eraOrigin).toEqual({ year: -10000, tick: 2250 });
    const advanced = stepCampaign({ ...start, core }, [], content).campaign;
    expect(advanced.core.year - core.year).toBeCloseTo(0.25, 8);
    expect(advanced.core.tick).toBe(2251);
    const regressed = enterEra(advanced.core, "prehistory", content, true);
    expect(regressed.year).toBe(advanced.core.year);
    expect(regressed.population).toBeLessThan(advanced.core.population);
  });

  it("keeps decisive events pending offline and advances only after the player responds", () => {
    const initial = newCampaign();
    const important = events.find((event) => event.decisive)!;
    const waiting = {
      ...initial,
      pending: { id: important.id, openedAt: initial.core.tick },
    };
    const report = catchUp(waiting, 1000 * 60 * 60 * 24, 4, content);
    expect(report.report).toMatchObject({ stopped: true, years: 0 });
    expect(report.campaign).toBe(waiting);
    const answer = applyCampaignAction(
      waiting,
      { type: "RESPOND", choice: 0 },
      content,
    );
    expect(answer.core.tick).toBe(waiting.core.tick);
    expect(answer.pending).toBeNull();
    expect(answer.core.influence).toBeLessThan(waiting.core.influence);
    expect(catchUp(waiting, 120000, 0, content).report).toBeNull();
    const resumed = catchUp(answer, 14000, 1, content);
    expect(resumed.campaign.core.tick).toBeGreaterThan(answer.core.tick);
  });

  it("chains the consequences of a short-term response", () => {
    const initial = newCampaign();
    const event = eventsById.get("drought")!;
    let next = applyCampaignAction(
      { ...initial, pending: { id: event.id, openedAt: 0 } },
      { type: "RESPOND", choice: 2 },
      content,
    );
    expect(next.chain).toHaveLength(1);
    for (let i = 0; i < 110; i++)
      next = stepCampaign(next, [], content).campaign;
    expect(next.pending?.id).toBe("dryHarvest");
  });

  it("negotiates, changes the front and resolves structural outcomes independently of speed", () => {
    const initial = newCampaign();
    const rival = initial.rivals[0]!;
    const traded = applyCampaignAction(
      initial,
      { type: "PACT", rival: rival.id, treaty: "trade" },
      content,
    );
    expect(traded.rivals[0]?.treaty).toBe("trade");
    const war = applyCampaignAction(
      traded,
      {
        type: "WAR",
        rival: rival.id,
        objective: "raid",
        posture: 50,
        commitment: 70,
      },
      content,
    );
    expect(war.war?.rival).toBe(rival.id);
    const moved = stepCampaign(war, [], content).campaign;
    expect(moved.war?.fatigue).toBeGreaterThan(0);
    const peace = applyCampaignAction(moved, { type: "PEACE" }, content);
    expect(peace.war).toBeNull();
    const conquest: Campaign = {
      ...peace,
      outcome: { kind: "conquest", rival: rival.id },
    };
    const newHome = applyCampaignAction(
      conquest,
      { type: "OUTCOME", choice: 0 },
      content,
    );
    expect(newHome.identity.name).toBe(rival.identity.name);
    expect(newHome.legacy).toBeGreaterThan(peace.legacy);
    expect(newHome.outcome).toBeNull();
    expect(
      applyCampaignAction(newHome, { type: "OUTCOME", choice: 0 }, content),
    ).toBe(newHome);
    const divided = applyCampaignAction(
      { ...peace, outcome: { kind: "fragment", names: ["An", "Dor"] } },
      { type: "OUTCOME", choice: 1 },
      content,
    );
    expect(divided.identity.name).toBe("Dor");
    expect(divided.rivals).toHaveLength(4);
  });

  it("round trips all required campaign state and rejects invalid references", () => {
    const original = newCampaign();
    const file = makeSave(original, 2, 50);
    expect(parseSave(JSON.stringify(file))).toEqual(file);
    expect(() =>
      parseSave(
        JSON.stringify({
          ...file,
          campaign: { ...original, pending: { id: "bad", openedAt: 0 } },
        }),
      ),
    ).toThrow();
    expect(() =>
      parseSave(
        JSON.stringify({
          ...file,
          campaign: { ...original, core: { ...original.core, eraId: "bad" } },
        }),
      ),
    ).toThrow();
  });

  it("reaches every era using real demographic and discovery conditions", () => {
    const run = runCampaign(content, 1, "prudence", 25000, "rapid", { route: 0, extended: false, response: "cautious" });
    expect(run.path).toEqual(campaignEras.map(({ id }) => id));
    expect(run.current.outcome?.kind).toBe("transcendence");
    expect(run.current.legacy).toBeGreaterThan(25);
  }, 30000);
});
