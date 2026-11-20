import { bossThresholds,value } from "./notes";
import data from "../../docs/dati-nemici.json";
import type { BossView } from "./boss";
import "./boss-hud.css";
const definition=data.enemies.find(enemy=>enemy.id==="custode")!;
const seconds=(value:number):string=>(Math.ceil(Math.max(0,value)*10)/10).toLocaleString("it-IT",{minimumFractionDigits:1,maximumFractionDigits:1})+" s";
export interface BossHud{update(view:BossView|null,upcoming:boolean):void;}
export function createBossHud(host:HTMLElement):BossHud{
  host.classList.add("boss-hud");host.setAttribute("aria-label","Stato del Custode");
  host.innerHTML='<p class="boss-title"></p><div class="boss-meter" role="meter" aria-label="Carica del Custode" aria-valuemin="0"><span class="boss-fill"></span></div><div class="boss-thresholds"></div><p class="boss-message"></p>';
  const title=host.querySelector<HTMLElement>(".boss-title")!,meter=host.querySelector<HTMLElement>(".boss-meter")!,fill=host.querySelector<HTMLElement>(".boss-fill")!,thresholds=host.querySelector<HTMLElement>(".boss-thresholds")!,message=host.querySelector<HTMLElement>(".boss-message")!;
  for(const phase of definition.phases!.slice(1)){
    const value=phase.atMostCharge!,tick=document.createElement("i"),label=document.createElement("span");tick.style.left=label.style.left=(value/definition.charge*100)+"%";
    tick.setAttribute("aria-hidden","true");label.textContent=String(value);label.setAttribute("aria-label",value+": inizio Fase "+(value===definition.phases![1]!.atMostCharge?2:3));meter.append(tick);thresholds.append(label);
  }
  meter.setAttribute("aria-valuemax",String(definition.charge));
  return{update(view,upcoming):void{
    host.hidden=!view&&!upcoming;if(host.hidden)return;
    const charge=view?.charge??definition.charge;
    const number=charge>0&&charge<.01?"<0,01":charge.toLocaleString("it-IT",{maximumFractionDigits:1});
    title.textContent=!view?"Custode in arrivo · "+value(definition.charge)+" Carica":view.status==="neutralized"?"Custode liberato · 0/"+value(definition.charge):view.status==="escaped"?"Il Custode ha raggiunto il portale":"Custode · Fase "+view.phase+" · "+number+"/"+view.maximum;
    let text=definition.phases!.length+" fasi: "+bossThresholds+". Se raggiunge il portale perdi subito.";
    if(view?.status==="neutralized")text="Difendi il portale dalle eventuali creature rimaste.";
    else if(view?.status==="escaped")text="Sconfitta immediata, qualunque sia la Stabilità.";
    else if(view){
      if(view.phase===1)text="A "+value(definition.phases![0]!.aboveCharge)+" Carica inizia il ruggito. Velocità "+value(definition.phases![0]!.speed)+", Protezione fisica "+value(definition.physicalProtection)+"%.";
      if(view.phase===2)text=view.roar.phase==="warning"?"Ruggito fra "+seconds(view.roar.remaining)+". Raggio "+value(definition.roar!.radius)+".":view.roar.phase==="active"?"Ruggito +"+value((definition.roar!.speedMultiplier-1)*100)+"% ai minori. Ancora "+seconds(view.roar.remaining)+".":"Prossimo preavviso fra "+seconds(view.roar.remaining)+".";
      if(view.phase===3)text=view.tail?"Coda fra "+seconds(view.tailRemaining)+": "+(view.tail.targets.map(target=>target.slot).join(", ")||"nessuna torre rimasta")+". Bersagli fissati.":"Velocità base "+value(definition.phases![2]!.speed)+". Prossimo tentativo fra "+seconds(view.nextTail)+".";
    }
    if(view?.status==="active")text+=" Se arriva al portale perdi subito.";
    message.textContent=text;meter.setAttribute("aria-valuenow",String(charge));meter.setAttribute("aria-valuetext",title.textContent+". "+text);fill.style.width=Math.max(0,Math.min(100,charge/definition.charge*100))+"%";
  }};
}
