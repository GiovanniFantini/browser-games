import { genesisModifiers } from "@engine/campaign/world";
import { traits as names } from "@content/campaign/definitions";
import type { GenesisChoices } from "@engine/campaign/model";

const traits=[["ambition"],[],["resilience","coherence","corruptibility"],["adaptability","memory"]] as const;
const rows=[];
for(let stage=0;stage<4;stage++) for(const value of [0,50,100]){
 const choices: GenesisChoices=[50,50,50,50];
 for(let earlier=0;earlier<stage;earlier++) choices[earlier]=100;
 choices[stage]=value;
 const modifiers=genesisModifiers(choices);
 rows.push({stage,value,expect:stage===1?[Math.round(value/610*100)]:traits[stage]!.map(t=>Math.round(modifiers[names.indexOf(t)]! * 10)/10)});
}
console.log(JSON.stringify(rows));
