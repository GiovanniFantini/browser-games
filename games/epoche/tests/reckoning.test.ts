import { settleDeferred } from "@engine/campaign/progression";
import { expect, it } from "vitest";
import { loadCampaignContent } from "@content/campaign/index";
import {
  applyCampaignAction,
  catchUp,
  stepCampaign,
} from "@engine/campaign/campaign";
import bronzeFixture from "../artifacts/revisione-gameplay/prove/registro-bronzo.json";
import { preparation, updateCrises } from "@engine/campaign/events";
import { makeSave, parseSave } from "../src/persistence/save";
import { previewHearing, openHearing } from "@engine/campaign/reckoning";
import type { Remedy } from "@content/campaign/winter";
import fixture from "../artifacts/qa/near-neolithic.json";
const content = loadCampaignContent("rapid");
function winter(choice: number) {
  const original = parseSave(JSON.stringify(fixture)).campaign;
  const state = {
    ...original,
    rules: "winter" as const,
    crises: [],
    deferred: [
      {
        family: "food" as const,
        source: "response.drought.1",
        points: 58,
        due: 1,
      },
    ],
    pending: { id: "winter", openedAt: original.core.tick },
    core: { ...original.core, influence: 25 },
    chain: [],
  };
  const after = applyCampaignAction(
    state,
    { type: "RESPOND", choice },
    content,
  );
  const ready = {
    ...after,
    chain: [],
    crises:
      choice === 0 ? [{ family: "food" as const, severity: 12 }] : after.crises,
  };
  const hearing = applyCampaignAction(ready, { type: "ADVANCE" }, content);
  expect(hearing.core.eraId).toBe("prehistory");
  expect(hearing.reckoning).toBeTruthy();
  return parseSave(JSON.stringify(makeSave(hearing, 0, 0))).campaign;
}
it.each([
  [0, "seeds", 53],
  [0, "departure", 43],
  [0, "carry", 100],
  [3, "isolate", 28],
  [3, "care", 46],
] as const)("resolves winter %i / %s to %i", (choice, id, food) => {
  const state = winter(choice);
  expect(stepCampaign(state, [], content).campaign).toBe(state);
  expect(catchUp(state, 60000, 25, content).campaign).toEqual(state);
  const preview = previewHearing(state).find((v) => v.id === id)!;
  const action = {
    type: "RECKON" as const,
    token: state.reckoning!.token,
    remedy: id,
  };
  expect(
    applyCampaignAction(state, { ...action, token: action.token - 1 }, content),
  ).toBe(state);
  const result = applyCampaignAction(state, action, content);
  expect(result.crises.find((c) => c.family === "food")?.severity).toBe(food);
  expect(preview.fatal).toBe(result.outcome?.kind === "collapse");
  expect(result.core.eraId).toBe("neolithic");
  expect(result.reckoning).toBeNull();
  expect(applyCampaignAction(result, action, content)).toBe(result);
  if (id === "seeds")
    expect(
      preparation(result).modifiers?.find((m) => m.id === "system.crises")
        ?.effects.sustenance,
    ).toBeLessThanOrEqual(-2);
  if (id === "departure")
    expect(result.core.population).toBeCloseTo(
      applyCampaignAction(state, { ...action, remedy: "seeds" }, content).core
        .population * 0.8,
    );
});
it("offers a two-era renewal and a price to bring the clan home", () => {
  const state = winter(0);
  const ledger = openHearing(
    { ...state, marks: { table: 3, clan: 3 }, reckoning: null },
    2,
    "ledger",
  );
  const resolve = (remedy: Remedy) =>
    applyCampaignAction(
      ledger,
      { type: "RECKON", token: ledger.reckoning!.token, remedy },
      content,
    );
  expect(resolve("renew").deferred.at(-1)).toMatchObject({
    due: 4,
    points: 18,
  });
  expect(resolve("condone").marks.table).toBeUndefined();
  expect(resolve("returnClan").marks.clan).toBeUndefined();
});

it("banks only surplus winter provisions and consumes them at the thaw",()=>{
  const base=parseSave(JSON.stringify(fixture)).campaign;
  const c=applyCampaignAction({...base, rules:"winter",chain:[],pending:{id:"winter",openedAt:base.core.tick},
    core:{...base.core,influence:25},deferred:[]},{type:"RESPOND",choice:3},content);
  expect(c.winterStock).toBe(30);
  const h=applyCampaignAction({...c,chain:[]},{type:"ADVANCE"},content);
  const option=previewHearing(h).find(o=>o.id==="isolate")!;
  expect(option.population).toBe(1.2);
  const resolved=applyCampaignAction(h,{type:"RECKON",remedy:"isolate",token:h.reckoning!.token},content);
  expect(resolved.winterStock).toBe(0);
});
it("applies the two-era food debt exactly once",()=>{
  const state={...winter(0),deferred:[{due:4,family:"food" as const,source:"remedy.renew",points:18}],reckoning:null};
  expect(settleDeferred({...state,core:{...state.core,eraId:"classical"}}).deferred).toHaveLength(1);
  const due=settleDeferred({...state,core:{...state.core,eraId:"medieval"}});
  expect(due.deferred).toEqual([]);expect(settleDeferred(due)).toBe(due);
});

it("finishes the winter study at a terminal crisis despite strong legitimacy", () => {
  const c = winter(0);
  const core = {...c.core, tick: 0, legitimacy: 90, population: 1000000};
  const state = {...c, rules: "winterStudy" as const, core, reckoning: null, crises: [{family:"food" as const, severity:100}]};
  expect(updateCrises(state, content).outcome).toEqual({kind:"collapse",family:"food"});
});
it("preserves an importable hearing when the Bronze register times out", () => {
  const c = parseSave(JSON.stringify(bronzeFixture)).campaign;
  const state = {...c, rules:"winter" as const, marks:{table:3}, crises:[], pending:{id:"ledger",openedAt:0}};
  const after = stepCampaign(state, [], content).campaign;
  expect(after.reckoning?.token).toBe(after.sequence);
  expect(after.pending).toBeNull();
  expect(parseSave(JSON.stringify(makeSave(after,0,0))).campaign.reckoning).toEqual(after.reckoning);
});

it("uses the barter reserve once when sheltered families settle at the register", () => {
  const c = parseSave(JSON.stringify(bronzeFixture)).campaign;
  const h = openHearing({...c, rules:"winter", pending:null, marks:{barter:3}},2,"ledger");
  const settled = applyCampaignAction(h,{type:"RECKON",token:h.reckoning!.token,remedy:"carry"},content);
  expect(settled.core.population).toBeCloseTo(h.core.population*1.03);
  expect(settled.marks.barter).toBeUndefined();
});
