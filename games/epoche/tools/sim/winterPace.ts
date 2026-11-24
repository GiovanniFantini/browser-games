import {loadCampaignContent} from "@content/campaign/index";
import {runCampaign} from "./campaign";
const content=loadCampaignContent("rapid");
for(let seed=1;seed<=25;seed++)for(const rules of ["trial","winterStudy"] as const){
 const run=runCampaign(content,seed,"prudence",25000,"rapid",{rules,route:0,extended:false,response:"foresight"});
 console.log(JSON.stringify({seed,rules,ticks:run.current.core.tick,exit:run.current.outcome?.kind ?? (run.current.studyFinished || run.current.pending?.id==="ledger"?"ledger":"open"),
 eras:run.arrived.map((state,i)=>({era:state.core.eraId,ticks:(run.arrived[i+1]??run.current).core.tick-state.core.tick,
 decisions:run.encounters[state.core.eraId]?.ticks.length??0}))}));
}
