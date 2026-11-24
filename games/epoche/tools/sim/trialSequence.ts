import {writeFileSync} from "node:fs";
import {makeSave} from "../../src/persistence/save";
import { loadCampaignContent } from "@content/campaign/index";
import { runCampaign } from "./campaign";
import assert from "node:assert/strict";
const content = loadCampaignContent("rapid");
for (let seed=101;seed<=200;seed++) {
  const events: string[] = [];
  const run = runCampaign(content,seed,"prudence",25000,"rapid",{
    route:0,response:"foresight",extended:false,rules:"trial",
    onDecision(state) { if(state.core.eraId === "prehistory") events.push(state.pending!.id); }
  });
  assert.deepEqual(events,["drought","dryHarvest","winter"].slice(0,events.length));
  assert.ok(run.current.outcome?.kind === "collapse" || (events.length === 3 && run.current.pending?.id === "ledger"));
  if (seed === 101 && process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(makeSave(run.current,0,0)));
  console.log(JSON.stringify({seed,events,ending:run.current.outcome?.kind ?? "ledger"}));
}
