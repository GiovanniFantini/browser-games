import { loadCampaignContent } from "@content/campaign/index";
import { eventsById } from "@content/campaign/definitions";
import { applyCampaignAction } from "@engine/campaign/campaign";
import { responsesFor } from "@engine/campaign/events";
import type { Campaign } from "@engine/campaign/model";
import { runCampaign } from "./campaign";
import { gzipSync } from "node:zlib";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { appendFileSync, writeFileSync } from "node:fs";

const content = loadCampaignContent("rapid");
const file = process.argv[2];
if (!file) throw new Error("Supply an output path");
writeFileSync(file, "", {flag:"wx"});
const archive = process.argv[3];
if (archive) mkdirSync(archive,{recursive:true});
for (let seed = 101; seed <= 200; seed++) {
  const route = (seed % 2) as 0 | 1;
  const states: Campaign[] = [];
  runCampaign(content, seed, "prudence", 25000, "rapid", {
    route, extended:false, response:"foresight",
    onDecision(state) { states.push(state); }
  });
  // Sample an early and a late decision without favoring long campaigns.
  for (const state of [states[Math.floor(states.length / 4)], states[Math.floor(3 * states.length / 4)]]) {
    if (!state?.pending) continue;
    if (archive) writeFileSync(join(archive,seed+"-"+state.core.tick+".json.gz"),gzipSync(JSON.stringify(state)),{flag:"wx"});
    const event = eventsById.get(state.pending.id)!;
    for (const option of responsesFor(state,event,content.attributes).filter(opt => opt.cost <= state.core.influence)) {
      const initial = applyCampaignAction(state,{type:"RESPOND",choice:option.choice},content);
      for (const response of ["cautious","foresight","heritage"] as const) {
        const {current} = runCampaign(content,seed,"prudence",25000,"rapid",{route,response,extended:false,initial});
        appendFileSync(file,JSON.stringify({seed,route,tick:state.core.tick,event:event.id,choice:option.choice,response,
          ending:current.outcome?.kind ?? "open",population:current.core.population,
          crisis:current.crises.reduce((sum,c)=>sum+c.severity,0),heritage:current.heritage.length})+"\n");
      }
    }
  }
}
