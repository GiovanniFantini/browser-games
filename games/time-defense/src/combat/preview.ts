import towerData from "../../docs/dati-torri.json";
import enemyData from "../../docs/dati-nemici.json";
import signalData from "../../docs/dati-segnali.json";
import type { Family, FieldMap } from "../field/catalog";
import type { Point } from "../field/geometry";
import { compilePath } from "../movement/path";
import { createTraveller, travellerPose } from "../movement/traveller";
import { CombatEngine } from "./engine";
import type { CombatArea } from "./types";
export interface CombatVisual {
  readonly enemies: readonly {id: string; point: Point; charge: number; maximum: number}[];
  readonly areas: readonly CombatArea[];
  readonly projectiles: readonly Point[];
}
const number = (value: number): string => value > 0 && value < 0.01 ? "<0,01" :
  value.toLocaleString("it-IT",{maximumFractionDigits: 2});
const templates: Record<string,readonly string[]> = {
  armor: ["corazzato"], mixed: ["richiamo","corazzato","esploratore"],
  pack: ["branco","branco","branco","branco","branco"], boss: ["custode"],
};
export function createCombatPreview(container: HTMLElement, changed: () => void, announce: (text: string) => void) {
  container.innerHTML = `<h2>Prova dei colpi</h2><p class="field-hint">Colpi singoli. Tempo manuale, senza costi o ondate.</p>
    <div class="combat-settings"><label class="combat-node-label">Profilo d’attacco<select id="combat-node"></select></label>
    <label>Piazzola<select id="combat-slot"></select></label><label>Campioni<select id="combat-template"><option value="armor">1 Corazzato</option><option value="mixed">Misto</option><option value="pack">5 Branco</option><option value="boss">1 Custode</option></select></label></div>
    <div class="motion-actions"><button id="combat-fire" type="button">Lancia un colpo</button><button id="combat-reset" type="button">Dall’inizio</button><button id="combat-step" type="button">Avanza 0,25 s</button><button id="combat-second" type="button">Avanza 1 s</button></div>
    <p id="combat-time"></p><div id="combat-readout" class="motion-readout" tabindex="0" aria-label="Carica e stati dei campioni, area scorrevole"></div>`;
  const get = <T extends HTMLElement>(selector: string): T => {
    const element = container.querySelector<T>(selector);
    if (!element) throw new Error("Missing combat control");
    return element;
  };
  const nodeSelect=get<HTMLSelectElement>("#combat-node"),slotSelect=get<HTMLSelectElement>("#combat-slot"),
    templateSelect=get<HTMLSelectElement>("#combat-template"),readout=get<HTMLElement>("#combat-readout"),
    clock=get<HTMLElement>("#combat-time");
  for (const node of towerData.nodes) {
    const option=document.createElement("option");option.value=node.id;option.textContent=node.family+" · "+node.name;
    nodeSelect.append(option);
  }
  let map: FieldMap | null=null,engine=new CombatEngine(),enabled=false,showRoutes=true;
  const node=() => towerData.nodes.find(definition=>definition.id===nodeSelect.value)!;
  const origin=(): Point => map?.slots.find(slot=>slot.id===slotSelect.value) ?? {x:0,y:0};
  function update(): void {
    for (const control of container.querySelectorAll<HTMLButtonElement|HTMLSelectElement>("button,select")) control.disabled=!enabled;
    clock.textContent="Tempo "+number(engine.time)+" s · Prova ferma";
    readout.replaceChildren();
    if (showRoutes && map) {
      const legend=document.createElement("p");legend.className="field-hint";legend.id="combat-route-legend";
      legend.textContent=map.routeLegend;readout.append(legend);
    }
    const allowed=map?.routes[0]?.allowedEnemies;
    if(allowed){
      const rule=document.createElement("p");rule.id="combat-allowed-enemies";rule.className="field-hint";
      rule.textContent="Su questo percorso sono ammessi: "+allowed.map(id=>enemyData.enemies.find(enemy=>enemy.id===id)?.name ?? id).join(", ")+".";
      readout.append(rule);templateSelect.setAttribute("aria-describedby",rule.id);
    } else templateSelect.removeAttribute("aria-describedby");
    for (const enemy of engine.enemies) {
      const p=document.createElement("p");p.dataset.enemy=enemy.id;
      const states: string[]=[];
      if (engine.rootActive(enemy.id)) states.push("Immobile");
      else if (engine.effectiveSlow(enemy.id)>0) states.push("Rallentato "+Math.round(engine.effectiveSlow(enemy.id)*100)+"%");
      if (enemy.rootProtectedUntil>engine.time) states.push("Arresto protetto");
      const spore=engine.sporeStrength(enemy);
      if (spore>0 && enemy.state==="active") states.push("Spore "+number(spore)+"/s");
      p.textContent="#"+enemy.id+" · "+enemy.definition.name+". Carica "+number(enemy.charge)+"/"+enemy.definition.charge+
        ". Protezione fisica "+enemy.definition.physicalProtection+"%, spore "+enemy.definition.sporeProtection+"%. "+
        (enemy.state==="neutralized" ? "Neutralizzato." : enemy.state==="escaped" ? "Arrivato al portale." : states.join(" · "));
      readout.append(p);
    }
  }
  function reset(): void {
    if (!map) return;
    engine=new CombatEngine();
    const route=map.routes[0]!;
    const path=compilePath(route.id,route.points),slot=origin();
    let closest=0,min=Infinity;
    path.points.forEach((point,i)=>{
      const distance=Math.hypot(point.x-slot.x,point.y-slot.y);
      if (distance<min) {min=distance;closest=path.cumulative[i]!;}
    });
    const selected=(templates[templateSelect.value] ?? templates.armor!).filter(id=>
      !route.allowedEnemies || route.allowedEnemies.includes(id));
    selected.forEach((id,i)=>{
      const definition=enemyData.enemies.find(enemy=>enemy.id===id)!;
      const distance=Math.max(0,Math.min(path.length-0.001,closest+(i-(selected.length-1)/2)*35));
      engine.addEnemy(definition,{...createTraveller(String(i+1),id,i,path,definition.speed),distance});
    });
    update();changed();
  }
  function finishAction(prefix: string): void {
    const events=engine.drainEvents();
    const removed=events.filter(event=>event.type==="neutralized").map(event=>"#"+event.enemy+" neutralizzato");
    const arrived=events.filter(event=>event.type==="escaped").map(event=>"#"+event.enemy+" arrivato al portale");
    const misses=events.filter(event=>event.type==="miss").length;
    const results=[...removed,...arrived];
    announce(prefix+(results.length ? " "+results.join(". ")+"." : "")+(misses ? " Colpo mancato: bersaglio perso o fuori portata." : ""));
    update();changed();
  }
  nodeSelect.addEventListener("change",()=>{reset();announce("Profilo cambiato. Campioni ripristinati, prova ferma.");});
  slotSelect.addEventListener("change",()=>{reset();announce("Piazzola cambiata. Campioni ripristinati, prova ferma.");});
  templateSelect.addEventListener("change",()=>{reset();announce("Campioni ripristinati. La prova resta ferma.");});
  get<HTMLButtonElement>("#combat-reset").addEventListener("click",()=>{if(enabled){reset();announce("Campioni ripristinati. Tempo fermo a zero.");}});
  get<HTMLButtonElement>("#combat-fire").addEventListener("click",()=>{
    if (!enabled) return;
    const selected=node();
    const delay=selected.family==="Nido" ? signalData.timing.nidoOutbound : selected.family==="Roccia"
      ? signalData.timing.rocciaWindup+signalData.timing.rocciaImpulse : signalData.timing.flightDemonstration;
    const shot=engine.fire("sample-tower",selected.id,origin(),delay);
    finishAction(shot ? "Colpo verso "+shot.targets.map(id=>"#"+id).join(", ")+". Avanza il tempo per risolverlo."
      : "Nessun bersaglio valido nel raggio. Cambia piazzola o ripristina i campioni.");
  });
  for (const [selector,seconds] of [["#combat-step",0.25],["#combat-second",1]] as const)
    get<HTMLButtonElement>(selector).addEventListener("click",()=>{
      if (!enabled) return;
      engine.advance(seconds);finishAction("Tempo avanzato di "+String(seconds).replace(".",",")+" s. Prova ferma.");
    });
  return {
    setMap(next: FieldMap): void {
      map=next;slotSelect.replaceChildren();
      for (const slot of map.slots) {const option=document.createElement("option");option.value=slot.id;option.textContent=slot.id;slotSelect.append(option);}
      slotSelect.value=map.slots.some(slot=>slot.id==="B") ? "B" : map.slots[0]!.id;
      const allowed=map.routes[0]!.allowedEnemies;
      for (const option of templateSelect.options) option.disabled=!(templates[option.value] ?? []).some(id=>!allowed || allowed.includes(id));
      if (templateSelect.selectedOptions[0]?.disabled) templateSelect.value="armor";
      reset();
    },
    setEnabled(value: boolean): void {enabled=value;update();},
    setRoutesVisible(value: boolean): void {if(showRoutes!==value){showRoutes=value;update();}},
    selection(): {family: Family; slot: string; range: number} {
      return {family: node().id.split("-")[0] as Family,slot:slotSelect.value,range:node().range};
    },
    visual(): CombatVisual {
      return {enemies: engine.enemies.filter(enemy=>enemy.state==="active").map(enemy=>({id:enemy.id,
        point:travellerPose(enemy.traveller),charge:enemy.charge,maximum:enemy.definition.charge})),areas:engine.areas,
        projectiles:engine.projectiles.flatMap(payload=>{
          const enemy=engine.enemy(payload.target);
          if (!enemy || enemy.state!=="active") return [];
          const fixed=["resina-colla","spore-nube","roccia-sisma"].includes(payload.attack.node.id);
          const target=fixed ? payload.attack.point : travellerPose(enemy.traveller);
          const ratio=Math.min(1,Math.max(0,(engine.time-payload.started)/(payload.due-payload.started || 1)));
          return [{x:payload.attack.origin.x+(target.x-payload.attack.origin.x)*ratio,
            y:payload.attack.origin.y+(target.y-payload.attack.origin.y)*ratio}];
        })};
    },
  };
}
