import { eventsById } from "@content/campaign/definitions";
import { writeFileSync, mkdirSync } from "node:fs";
import { loadCampaignContent } from "@content/campaign/index";
import { createCampaign, stepCampaign, applyCampaignAction } from "@engine/campaign/campaign";
import { progression } from "@engine/campaign/progression";
import { makeSave } from "../../src/persistence/save";
import { runCampaign } from "../../tools/sim/campaign";

const content = loadCampaignContent();
mkdirSync("artifacts/qa",{recursive:true});
function fixture(name: string, data: unknown) {
  writeFileSync("artifacts/qa/" + name + ".json", JSON.stringify(data));
}
let early = createCampaign(content,{seed:2026,id:"qa-2026-early",choices:[60,65,55,65],inherited:0,pace:"rapid"});
early = stepCampaign(early,[{type:"SET_POLICY",policyId:"settlement",value:87,tick:1}],content).campaign;
for (let i=0;i<6000&&!progression(early).ready;i++) {
  if(early.pending) early=applyCampaignAction(early,{type:"RESPOND",choice:eventsById.get(early.pending.id)!.fallbackIndex},content);
  early=stepCampaign(early,[],content).campaign;
}
if(!progression(early).ready) throw new Error("Early milestone not ready");
fixture("near-neolithic",makeSave(early,0,Date.now()));
const full = runCampaign(content,23,"prudence");
fixture("future",makeSave({...full.current,outcome:null,legacy:full.current.legacy-24},0,Date.now()));
fixture("dilemma",makeSave({...early,id:"qa-dilemma",pending:{id:"drought",openedAt:early.core.tick}},0,Date.now()));
fixture("conquest",makeSave({...early,id:"qa-conquest",outcome:{kind:"conquest",rival:early.rivals[0]!.id}},0,Date.now()));
fixture("near-bronze",makeSave({...full.arrived[1]!,id:"qa-demo",core:{...full.arrived[1]!.core,tick:full.arrived[1]!.core.tick+1000,population:200,
  attributes:{...full.arrived[1]!.core.attributes,knowledge:{...full.arrived[1]!.core.attributes.knowledge!,value:10}}}},0,Date.now()));
console.log("QA fixtures ready");
