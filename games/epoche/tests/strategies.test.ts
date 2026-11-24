import { describe, expect, it } from "vitest";
import { createCampaign } from "@engine/campaign/campaign";
import { responsesFor } from "@engine/campaign/events";
import { loadCampaignContent } from "@content/campaign/index";
import { eventsById } from "@content/campaign/definitions";
import { rankResponses, shouldWait, type ResponseStrategy } from "../tools/sim/campaign";
const content = loadCampaignContent("rapid");
const start = createCampaign(content,{seed:23,id:"strategies",inherited:0,choices:[50,50,50,50]});
const winter = eventsById.get("winter")!;
const base = responsesFor(start,winter,content.attributes)[0]!;
const state = {...start, core:{...start.core,tick:350}, deferred:[{family:"food" as const,source:"response.winter.0",points:58,due:1}]};
function choice(strategy: ResponseStrategy, a: Partial<typeof base>, b: Partial<typeof base>) {
  const options = [{...base,choice:0,cost:0,...a},{...base,choice:1,cost:0,...b}];
  rankResponses(state,winter,options,strategy);
  return options[0]!.choice;
}
describe("research profiles",()=>{
  it("prices the next era",()=>{
    const other = {defer:{family:"food" as const,points:1},cost:1};
    expect(choice("cautious",{},other)).toBe(0);
    expect(choice("foresight",{},other)).toBe(1);
  });
  it("waits only if a current crisis can fall before settlement",()=>{
    expect(shouldWait(state)).toBe(false);
    expect(shouldWait({...state,crises:[{family:"food",severity:31}]})).toBe(true);
  });
  it("spends near the transition",()=>{
    expect(choice("spend",{},{cost:4})).toBe(1);
    expect(choice("cautious",{},{cost:4})).toBe(0);
  });
  it("uses an affordable legacy",()=>{
    expect(choice("heritage",{},{cost:2,requires:"wheel"})).toBe(1);
    expect(choice("cautious",{},{cost:2,requires:"wheel"})).toBe(0);
  });
  it("avoids obligated legacies",()=>{
    expect(choice("ordinary",{requires:"wheel"},{cost:2})).toBe(1);
    expect(choice("cautious",{requires:"wheel"},{cost:2})).toBe(0);
  });
});
