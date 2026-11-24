import { expect, it } from "vitest";
import { loadCampaignContent } from "@content/campaign/index";
import { applyCampaignAction, catchUp, createCampaign } from "@engine/campaign/campaign";
import { urgentDecision } from "@engine/campaign/model";
import { makeSave, parseSave } from "../src/persistence/save";

const content = loadCampaignContent("rapid");
const input = {id:"old",seed:42,inherited:0,choices:[50,50,50,50] as [number,number,number,number]};
it("restores old saves as ordinary and preserves study saves across reload",()=>{
  const current = createCampaign(content,input);
  const old = JSON.parse(JSON.stringify(makeSave(current,0,0)));
  delete old.campaign.rules;
  expect(parseSave(JSON.stringify(old)).campaign).toEqual(current);
  const trial = createCampaign(content,{...input,rules:"trial"});
  expect(parseSave(JSON.stringify(makeSave(trial,0,0))).campaign).toEqual(trial);
});
it("stops the study at the ledger even across absence or a repeated response",()=>{
  const trial = createCampaign(content,{...input,rules:"trial"});
  const final = {...trial,pending:{id:"ledger",openedAt:trial.core.tick}};
  expect(urgentDecision(final)).toBe(true);
  expect(applyCampaignAction(final,{type:"RESPOND",choice:0},content)).toBe(final);
  expect(catchUp(final,900000,25,content).campaign.core.tick).toBe(final.core.tick);
});
