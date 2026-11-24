import { loadCampaignContent } from "@content/campaign/index";
import { runCampaign } from "./campaign";
const content=loadCampaignContent("rapid");
for(let seed=1;seed<=25;seed++) for(const route of [0,1] as const) {
  for(const response of ["cautious","wait","spend"] as const) {
    const winters: number[]=[];
    const transitions: {era:string;tick:number;before:number;after:number}[]=[];
    const {current}=runCampaign(content,seed,"prudence",25000,"rapid",{route,response,extended:false,
      onDecision(state){if(state.pending?.id==="winter") winters.push(state.core.tick);},
      onAdvance(a,b){transitions.push({era:b.core.eraId,tick:a.core.tick,before:a.core.influence,after:b.core.influence});}
    });
    console.log(JSON.stringify({seed,route,response,winters,transitions,outcome:current.outcome?.kind}));
  }
}
