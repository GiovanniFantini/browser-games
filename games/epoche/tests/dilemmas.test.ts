import { describe, expect, it } from "vitest";
import {
  campaignEras,
  heritageSites,
  campaignTiming,
  events,
  eventsById,
} from "@content/campaign/definitions";
import { loadCampaignContent } from "@content/campaign/index";
import { urgentDecision } from "@engine/campaign/model";
import { catchUp, createCampaign } from "@engine/campaign/campaign";
import {
  applyResponse,
  maybeOpenEvent,
  responsesFor,
  settleEraChain,
  updateCrises,
} from "@engine/campaign/events";
import { advanceEra, advanceHeritage, settleDeferred } from "@engine/campaign/progression";
import type { Campaign } from "@engine/campaign/model";
import { enterEra } from "@engine/campaign/world";
import { dictionaries } from "../src/i18n";
import { makeSave, parseSave } from "../src/persistence/save";
import { runCampaign } from "../tools/sim/campaign";

const content = loadCampaignContent();
const initial = createCampaign(content, {
  seed: 75,
  id: "dilemmas",
  choices: [20, 40, 60, 80],
  inherited: 0,
});

function inEra(era: number) {
  return {
    ...initial,
    core: enterEra(initial.core, campaignEras[era]!.id, content),
  };
}

describe("historical dilemmas", () => {
  it("naturally opens at least two distinct dilemmas in every era on an ordinary full campaign", () => {
    for (const [seed, route] of [
      [1, 0],
      [7, 1],
    ] as const) {
      const { current } = runCampaign(content, seed, "prudence", 25000, "rapid", { route, extended: false, response: "cautious" });
      expect(current.outcome?.kind).toBe("transcendence");
      const opened = current.chronicle.filter(({ key }) => key === "log.event");
      for (const era of campaignEras) {
        const ids = new Set(
          opened
            .filter((entry) => entry.era === era.id)
            .map((entry) => entry.nameKey),
        );
        expect(ids.size, era.id + " / " + route).toBeGreaterThanOrEqual(2);
      }
      expect(opened.some((entry) => entry.result === "followUp")).toBe(true);
    }
  }, 30_000);

  it("pauses before a fatal response and lets the player avert or accept dissolution", () => {
    const waiting = { ...initial, crises: [{ family: "food" as const, severity: 85 }],
      pending: { id: "drought", openedAt: initial.core.tick } };
    expect(urgentDecision(waiting)).toBe(true);
    expect(catchUp(waiting, 60000, 25, content).campaign).toEqual(waiting);
    const safe = applyResponse(waiting, 0, content);
    expect(safe.crises[0]!.severity).toBeLessThan(85);
    expect(safe.outcome).toBeNull();
    const lost = applyResponse(waiting, 2, content);
    expect(lost.outcome).toEqual({ kind: "collapse", family: "food" });
    expect(lost.crises[0]!.severity).toBe(100);
    expect(parseSave(JSON.stringify(makeSave(lost, 0, 100))).campaign).toEqual(lost);
    const first = applyResponse({ ...waiting, crises: [] }, 2, content);
    expect(first.outcome).toBeNull();
    expect(first.crises[0]!.severity).toBeGreaterThan(0);
  });

  it("carries winter shortages across saves and lets barter reduce the next era's food crisis", () => {
    const winter = { id: "winter", openedAt: initial.core.tick };
    const campaign = { ...initial, core: { ...initial.core, influence: 25 }, pending: winter };
    const opened = applyResponse(campaign, 0, content);
    const loaded = parseSave(JSON.stringify(makeSave(opened, 0, 100))).campaign;
    expect(loaded.deferred).toEqual([{ family: "food", points: 43, due: 1, source: "response.winter.0" }]);
    const oldSave = JSON.parse(JSON.stringify(makeSave(initial, 0, 100)));
    delete oldSave.campaign.deferred;
    expect(parseSave(JSON.stringify(oldSave)).campaign.deferred).toEqual([]);
    const bartered = applyResponse({ ...loaded, pending: winter }, 3, content);
    expect(bartered.deferred[0]?.points).toBe(13);
    for (const state of [loaded, bartered]) {
      const arrival = settleDeferred({ ...state, core: inEra(1).core, crises: [{ family: "food", severity: 58 }] });
      expect(arrival.outcome?.kind ?? "alive").toBe(state === loaded ? "collapse" : "alive");
      expect(arrival.crises[0]?.severity).toBe(state === loaded ? 100 : 71);
      expect(arrival.deferred).toEqual([]);
      expect(settleDeferred(arrival)).toBe(arrival);
    }
  });

  it.each([
    ["drought", "spring", "wells"],
    ["seed", "seedStore", "silt"],
    ["split", "council", "quarrel"],
  ] as const)("carries the choice in %s to a later era and an older save", (origin, site, later) => {
    const source = eventsById.get(origin)!;
    const target = eventsById.get(later)!;
    const founded = applyResponse({ ...inEra(source.era), pending: { id: origin, openedAt: 0 } }, 0, content);
    expect(founded.heritage).toEqual([site]);
    const next = { ...founded, core: enterEra(founded.core, campaignEras[target.era]!.id, content),
      pending: { id: later, openedAt: founded.core.tick } };
    const locked = { ...next, heritage: [] };
    const extra = target.responses.find(option => option.requires === site)!;
    expect(responsesFor(locked, target).some(option => option.choice === extra.choice)).toBe(false);
    expect(applyResponse(locked, extra.choice, content)).toBe(locked);
    expect(responsesFor(next, target).some(option => option.choice === extra.choice)).toBe(true);
    expect(applyResponse(next, extra.choice, content).pending).toBeNull();
    const save = makeSave(next, 0, 100);
    expect(parseSave(JSON.stringify({ ...save, campaign: { ...next, heritage: undefined } })).campaign.heritage).toEqual([site]);
    expect(parseSave(JSON.stringify({ ...save, campaign: { ...next, chronicle: [] } })).campaign.heritage).toEqual([site]);
  });

  it("keeps historical sites and invites the heirs of medieval and industrial choices in the Future", () => {
    let current = initial;
    for (const [id, site] of [
      ["embers", "hearth"], ["cartAxle", "wheel"], ["romanPaving", "romanRoad"],
      ["borderTax", "commonBridge"], ["citizensCharter", "revolution"],
      ["lobby", "mutualHall"], ["worldWarLetters", "worldWars"],
    ] as const) {
      const event = eventsById.get(id)!;
      const start = inEra(event.era);
      current = applyResponse({ ...current, core: start.core, highestEra: event.era,
        pending: { id, openedAt: start.core.tick } },
        event.responses.find(option => option.founds === site)!.choice, content);
      expect(current.heritage).toContain(site);
    }
    const info = inEra(8).core;
    const era = campaignEras[8]!;
    const policies = { ...info.policies };
    for (const [key, direction] of era.reformRoutes[0]!) {
      const value = direction === "right" ? 85 : 15;
      policies[key] = { ...policies[key]!, target: value, effective: value };
    }
    const ready = { ...current, highestEra: 8, core: { ...info, policies,
      tick: info.tick + era.minTicks, population: era.requiredPopulation,
      attributes: { ...info.attributes, knowledge: { ...info.attributes.knowledge!, value: 18 } } } };
    const future = advanceEra(ready, content);
    expect(future.core.eraId).toBe("future");
    expect(future.heritage).toEqual(current.heritage);
    expect(future.chain.map(link => link.id)).toEqual(expect.arrayContaining(["orbitalCrossing", "orbitCare", "automationGap", "habitatWorkshop"]));
    for (const [id, site] of [["orbitalCrossing", "commonBridge"], ["orbitCare", "mutualHall"]] as const) {
      const event = eventsById.get(id)!;
      const choice = event.responses.find(option => option.requires === site)!.choice;
      const waiting = { ...future, pending: { id, openedAt: future.core.tick } };
      expect(applyResponse(waiting, choice, content).pending).toBeNull();
      const locked = { ...waiting, heritage: [] };
      expect(applyResponse(locked, choice, content)).toBe(locked);
    }
  });

  it("weakens traditions once per new era, renews them on use and retires expired choices", () => {
    const stepTo = (campaign: Campaign, stage: number): Campaign => ({
      ...campaign, ...advanceHeritage(campaign, stage), core: inEra(stage).core,
    });
    const answer = (campaign: Campaign, id: string, index: number) =>
      applyResponse({ ...campaign, pending: { id, openedAt: campaign.core.tick } }, index, content);
    const school = answer(stepTo(initial, 6), "cityAir", 2);
    const classes = eventsById.get("subsidies")!;
    const relief = (c: Campaign) => responsesFor(c, classes).find(o => o.requires === "nightSchool")?.recovery;
    const later = stepTo(school, 7);
    const fading = stepTo(later, 8);
    expect(relief(fading)).toBeLessThan(relief(later)!);
    expect(relief(later)).toBeLessThan(relief(school)!);
    const saved = parseSave(JSON.stringify(makeSave(fading, 25, 100))).campaign;
    expect(relief(stepTo(saved, 7))).toBe(relief(fading));
    const expired = stepTo(saved, 9);
    expect(expired.heritage).not.toContain("nightSchool");
    expect(expired.chronicle.at(-1)?.key).toBe("log.heritageLost");
    expect(relief(expired)).toBeUndefined();
    const renewed = answer(later, "subsidies", 3);
    expect(relief(renewed)).toBe(relief(school));
    expect(stepTo(renewed, 9).heritage).toContain("nightSchool");
  });

  it("uses the same health load for warnings, treatment and defeat in a Future clinic", () => {
    const event = eventsById.get("orbitCare")!;
    const clinic = (severity: number): Campaign => ({
      ...inEra(9), heritage: ["mutualHall"],
      pending: { id: event.id, openedAt: 0 }, crises: [{ family: "health", severity }],
    });
    const mild = clinic(12);
    expect(applyResponse(mild, 1, content).crises).toEqual([]);
    expect(applyResponse(mild, 2, content).crises).toEqual([]);
    expect(applyResponse(mild, 1, content).core.influence).toBe(mild.core.influence);
    const busy = clinic(80);
    const training = responsesFor(busy, event)[1]!;
    expect(training.risk?.after).toBe(100);
    expect(urgentDecision(busy)).toBe(true);
    expect(applyResponse(busy, 1, content).outcome?.kind).toBe("collapse");
    const funded = applyResponse(busy, 2, content);
    expect(funded.outcome).toBeNull();
    expect(funded.crises).toEqual([{ family: "health", severity: 28 }]);
    expect(funded.core.influence).toBe(busy.core.influence - 2);
    const concurrent: Campaign = { ...busy, crises: [...busy.crises, { family: "state", severity: 56 }] };
    expect(applyResponse(concurrent, 0, content).outcome).toEqual({ kind: "collapse", family: "state" });
    expect(applyResponse(concurrent, 2, content).outcome).toBeNull();
    const current = { ...busy, pending: null, chain: [{ id: event.id, at: busy.core.tick }] };
    const opened = maybeOpenEvent(current, content);
    const level = (c: Campaign, family: string) => c.crises.find(crisis => crisis.family === family)?.severity ?? 0;
    expect(level(opened, "health")).toBeGreaterThan(80);
    expect(level(opened, "state")).toBeGreaterThan(0);
    const infrastructure = current.core.attributes.infrastructure!;
    const prepared = { ...current, core: { ...current.core, attributes: {
      ...current.core.attributes, infrastructure: { ...infrastructure, value: 20 },
    } } };
    expect(level(maybeOpenEvent(prepared, content), "state")).toBeLessThan(level(opened, "state"));
    expect(maybeOpenEvent(opened, content)).toBe(opened);
    expect(maybeOpenEvent(current, content)).toEqual(opened);
  });

  it.each(["winter", "shortage", "habitatWorkshop"])("requires a sacrifice in %s even with every legacy or an empty treasury", id => {
    const event = eventsById.get(id)!;
    const start: Campaign = { ...inEra(event.era), heritage: [...heritageSites], pending: { id, openedAt: 0 } };
    expect(urgentDecision(start)).toBe(true);
    const options = responsesFor(start, event);
    const free = options.filter(option => !option.cost && !option.requires);
    expect(new Set(free.map(option => option.risk?.family)).size).toBeGreaterThanOrEqual(2);
    for (const option of options) {
      expect(option.risk?.after).toBeGreaterThan(0);
      const result = applyResponse(start, option.choice, content);
      expect(result.crises).toContainEqual({ family: option.risk!.family, severity: option.risk!.after });
    }
  });

  it("gives every choice distinct translated words, an active effect and a payable fallback", () => {
    for (const language of ["it", "en"] as const) {
      const words = dictionaries[language];
      const labels = new Set<string>();
      for (const event of events) {
        const start = inEra(event.era);
        if (!["always", "settlement_load"].includes(event.metric))
          expect(start.core.attributes[event.metric]?.active, event.id).toBe(true);
        expect(
          event.responses.some(({ cost }) => cost === 0),
          event.id,
        ).toBe(true);
        for (const [index, response] of event.responses.entries()) {
          expect(words[response.labelKey], response.labelKey).toBeTruthy();
          expect(
            words[response.consequenceKey],
            response.consequenceKey,
          ).toBeTruthy();
          labels.add(words[response.labelKey]!);
          const effects = Object.keys(response.effects);
          expect(effects.length, event.id).toBeGreaterThan(0);
          expect(
            effects.every((id) => start.core.attributes[id]?.active),
            event.id,
          ).toBe(true);
          if (
            event.direction === "above" &&
            start.core.attributes[event.metric]
          )
            expect(
              response.effects[event.metric] ?? 0,
              event.id,
            ).toBeLessThanOrEqual(0);
          const waiting = { ...start, heritage: [...heritageSites], pending: { id: event.id, openedAt: 0 } };
          const resolved = applyResponse(waiting, index, content);
          expect(resolved.core.modifiers?.at(-1)?.effects).toEqual(
            response.effects,
          );
          expect(resolved.chronicle.at(-1)).toMatchObject({
            nameKey: response.labelKey,
            consequenceKey: response.consequenceKey,
            eventKey: "event." + event.id + ".title",
          });
        }
      }
      expect(labels.size).toBe(events.reduce((sum, event) => sum + event.responses.length, 0));
    }
  });

  it("delivers at least one decision-dependent consequence per era, including before crossing an era boundary", () => {
    for (const [era] of campaignEras.entries()) {
      const start = inEra(era);
      const sources = events.filter(
        (event) => event.era === era && event.responses.some((r) => r.followUp),
      );
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) {
        const index = source.responses.findIndex(
          (response) => response.followUp,
        );
        const target = source.responses[index]!.followUp!;
        expect(eventsById.get(target)?.era).toBe(era);
        const pending = {
          ...start,
          pending: { id: source.id, openedAt: start.core.tick },
        };
        const scheduled = applyResponse(pending, index, content);
        expect(scheduled.chain).toEqual([
          {
            id: target,
            at: start.core.tick + 110 * campaignTiming(start.pace).tickScale,
          },
        ]);
        expect(settleEraChain(scheduled, content).pending?.id).toBe(target);
        const alternate = source.responses.findIndex(
          (option) => !option.followUp,
        );
        expect(applyResponse(pending, alternate, content).chain).toHaveLength(
          0,
        );
      }
    }
  });

  it("never draws out-of-era events, including during matching crises and when every eligible event is on cooldown", () => {
    for (const [era] of campaignEras.entries()) {
      const start = inEra(era);
      const tick = campaignTiming(start.pace).firstEventTick;
      const current = {
        ...start,
        core: { ...start.core, tick },
        crises: [{ family: "food" as const, severity: 69 }],
        cooldowns: Object.fromEntries(
          events
            .filter((event) => event.era === era)
            .map((event) => [event.id, tick + 10]),
        ),
        chain: [{ id: era === 0 ? "newHarbor" : "drought", at: tick - 1 }],
      };
      expect(maybeOpenEvent(current, content).pending).toBeNull();
      for (let seed = 1; seed <= 20; seed++) {
        const next = maybeOpenEvent(
          { ...current, cooldowns: {}, random: seed },
          content,
        );
        if (next.pending)
          expect(eventsById.get(next.pending.id)?.era).toBe(era);
      }
    }
  });

  it("resolves an old save with an earlier-era dilemma and round trips the resulting chronicle", () => {
    const start = inEra(8);
    const waiting = {
      ...start,
      pending: { id: "drought", openedAt: start.core.tick },
    };
    const restored = parseSave(
      JSON.stringify(makeSave(waiting, 0, 100)),
    ).campaign;
    const answer = applyResponse(restored, 2, content);
    expect(answer.pending).toBeNull();
    expect(answer.chain).toHaveLength(0);
    expect(
      responsesFor(restored, eventsById.get("drought")!)[2]?.durationTicks,
    ).toBeGreaterThan(0);
    expect(
      parseSave(JSON.stringify(makeSave(answer, 0, 200))).campaign,
    ).toEqual(answer);
  });

  it("lets accumulated attribute pressure feed the corresponding crisis even at equal current values", () => {
    const current = inEra(1);
    const tick = campaignTiming(current.pace).crisisEveryTicks;
    const state = { ...current, core: { ...current.core, tick } };
    const stressed = {
      ...state,
      core: {
        ...state.core,
        attributes: {
          ...state.core.attributes,
          health: { ...state.core.attributes.health!, pressure: 600 },
        },
      },
    };
    const severity = (campaign: typeof state) =>
      updateCrises(campaign, content).crises.find(
        (entry) => entry.family === "health",
      )?.severity ?? 0;
    expect(severity(stressed)).toBeGreaterThan(severity(state));
  });
});
