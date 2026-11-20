import { bossDetails,supportDetails } from "../enemies/notes";
import { WaveSession } from "./session";
import type { FieldMap } from "../field/catalog";
import type { createEconomyPreview } from "../economy/preview";
import { createEconomyDialog } from "../economy/dialog";
import { travellerPose } from "../movement/traveller";
import enemyData from "../../docs/dati-nemici.json";
import type { CombatVisual } from "../combat/preview";
import { strongest } from "../combat/rules";
import { towerDefinition } from "../economy/model";
import { songState } from "../enemies/controller";
import { inWater } from "../enemies/terrain";
import type { BossHud } from "../enemies/boss-hud";
import { fieldLegend } from "../field/legend";

const number=(value:number):string=>value.toLocaleString("it-IT",{maximumFractionDigits:6});

export interface WaveMarker { readonly x:number; readonly y:number; readonly heading:number; readonly kind:string; readonly charge:number; readonly maximum:number;readonly slow:number;readonly rooted:boolean;readonly spore:number;readonly id:string;readonly path:import("../movement/path").DistancePath;readonly distance:number;readonly song:import("../enemies/controller").SongState;readonly accelerated:boolean;readonly opacity?:number;readonly departing?:boolean;readonly outline?:boolean }
export interface WavePreviewHooks {
  readonly onUpdate?: (session:WaveSession,enabled:boolean)=>void;
  readonly onResult?: (session:WaveSession)=>boolean;
  readonly onSession?: (session:WaveSession,map:FieldMap)=>void;
  readonly onPresentationState?: (session:WaveSession,enabled:boolean)=>void;
  readonly onEvents?: (events:readonly import("./types").WaveEvent[])=>void;
  readonly resetMap?: (map:FieldMap)=>FieldMap;
}
export function createWavePreview(header:HTMLElement,info:HTMLButtonElement,economy:ReturnType<typeof createEconomyPreview>,changed:()=>void,announce:(message:string)=>void,fallback:()=>void,bossHud:BossHud|null=null,hooks:WavePreviewHooks={}){
  header.innerHTML=`<div class="wave-start-wrap"><button id="wave-start" type="button">Avvia ondata 1</button><span id="wave-refund-note">Rimborso 100% → 70%</span></div><button id="wave-pause" type="button">Pausa</button><button id="wave-speed" type="button" aria-label="Velocità attuale 1x. Passa a 2x">1x</button>`;
  const start=header.querySelector<HTMLButtonElement>("#wave-start")!,pause=header.querySelector<HTMLButtonElement>("#wave-pause")!,speed=header.querySelector<HTMLButtonElement>("#wave-speed")!,note=header.querySelector<HTMLElement>("#wave-refund-note")!;
  const dialog=createEconomyDialog(()=>suspend());
  let session:WaveSession|null=null,map:FieldMap|null=null,enabled=false,frame=0,last:number|null=null,lastHud=0;
  let lastBalance=-1,lastRefund=-1;
  const stop=()=>{cancelAnimationFrame(frame);frame=0;last=null;};
  const terminal=()=>session?.result!==null;
  function flush():void{const events=session?.drainEvents()??[];for(const event of events)announce(event.message);hooks.onEvents?.(events);}
  function runtimeText():void{
    const tower=economy.selectedTower(),pose=tower?session?.towers.pose(tower.uid):null;
    if(!tower||!pose||!session){economy.setRuntimeText("");return;}
    const cooldown=pose.cooldownFraction*towerDefinition(tower.node).interval;
    let text=session.result?"Tentativo concluso.":pose.disabled?"Difesa sospesa ancora "+(Math.ceil(pose.disabledRemaining*10)/10).toLocaleString("it-IT",{minimumFractionDigits:1,maximumFractionDigits:1})+" s.":pose.preparing?"Preparazione dell’attacco.":cooldown>0?"Recupero: "+cooldown.toLocaleString("it-IT",{maximumFractionDigits:1})+" s.":"Pronta. Attende una creatura in gittata.";
    if(tower.node==="spore-parassita")text+=" Posti occupati: "+session.engine.occupiedParasite(tower.uid).size+"/2, compresi i semi in volo.";
    economy.setRuntimeText(text);
  }
  function refresh():void{
    if(!session)return;
    const phase=session.phase;hooks.onPresentationState?.(session,enabled);
    const next=phase==="preparation"?0:phase==="intermission"?session.wave:-1;
    bossHud?.update(session.enemies.boss.view(),next>=0&&Boolean(session.level.waves[next]?.groups.some(group=>group.enemy==="custode")));
    start.textContent=terminal()?"Ricomincia":phase==="preparation"?"Avvia ondata 1":phase==="intermission"?"Avvia ondata "+(session.wave+1):"Ondata "+session.wave;
    start.disabled=!enabled||!["preparation","intermission","won","lost"].includes(phase);
    pause.textContent=phase==="paused"?"Riprendi":"Pausa";pause.disabled=!enabled||!["active","paused"].includes(phase);
    speed.textContent=session.speed+"x";speed.disabled=!enabled||Boolean(session.result);
    speed.setAttribute("aria-label","Velocità attuale "+session.speed+"x. Passa a "+(session.speed===1?2:1)+"x");
    note.style.visibility=session.economy.firstWaveStarted?"hidden":"visible";
    header.setAttribute("data-phase",phase);
    info.disabled=!enabled;info.textContent="Ondata "+Math.max(1,session.wave)+"/"+session.level.waves.length+" · Stabilità "+session.stability+"/"+session.level.stability+" · "+session.engine.time.toLocaleString("it-IT",{minimumFractionDigits:1,maximumFractionDigits:1})+" s · Dettagli / legenda";
    info.setAttribute("aria-label",info.textContent+". Apre i dettagli e mette in pausa.");
    if(lastBalance!==session.economy.balance||lastRefund!==session.economy.refundPercent){
      lastBalance=session.economy.balance;lastRefund=session.economy.refundPercent;economy.refresh();
    }
    economy.setEnabled(enabled&&!session.result);
    runtimeText();
    flush();
    hooks.onUpdate?.(session,enabled);
  }
  function tick(now:number):void{
    frame=0;
    if(!enabled||!session||session.phase!=="active")return;
    // A visible-page stall must not turn into an entire simulated wave in one frame.
    if(last!==null)session.advanceReal(Math.min(0.1,Math.max(0,(now-last)/1000)));
    last=now;changed();
    const pauseHadFocus=document.activeElement===pause;
    if(now-lastHud>=200||session.phase!=="active"){
      lastHud=now;refresh();
    }
    if(session.phase==="active")frame=requestAnimationFrame(tick);
    else{
      stop();refresh();
      if(session.result){showResult();}
      else if(pauseHadFocus)start.focus();
    }
  }
  function run():void{if(enabled&&session?.phase==="active"&&!frame){last=null;frame=requestAnimationFrame(tick);}}
  function suspend():void{session?.pause();stop();refresh();changed();}
  function reset():void{
    if(!map)return;stop();map=hooks.resetMap?.(map)??map;session=new WaveSession(map);hooks.onSession?.(session,map);lastBalance=lastRefund=-1;
    economy.setMap(map,session.economy);refresh();changed();
    announce("Prepara le difese. Attaccheranno automaticamente. Avvia ondata fa passare il rimborso al 70%.");
  }
  function showResult():void{
    if(!session?.result)return;
    if(hooks.onResult?.(session))return;
    const result=session.result;
    dialog.open({title:result.outcome==="won"?"Portale stabilizzato":"Portale instabile",paragraphs:[result.reason,
      "Stabilità "+result.stability+"/"+result.initialStability+". Ondate risolte "+result.cleared+"/"+session.level.waves.length+".",
      "Non vengono salvati progressi in questa prova."],confirmText:"Ricomincia",cancelText:"Chiudi",onConfirm:reset,
      restoreFocus:()=>{if(start.getClientRects().length&&!start.disabled)start.focus();else fallback();}});
  }
  start.addEventListener("click",event=>{
    if(!enabled||!session||event.detail>1||dialog.isOpen()||economy.isDialogOpen())return;
    if(session.result){reset();start.focus();return;}
    if(session.start()){refresh();pause.focus();changed();run();}
  });
  pause.addEventListener("click",()=>{
    if(!enabled||!session||dialog.isOpen()||economy.isDialogOpen())return;
    if(session.phase==="active")suspend();else{session.resume();refresh();run();}
  });
  speed.addEventListener("click",()=>{if(enabled&&session&&!session.result){session.setSpeed(session.speed===1?2:1);refresh();}});
  info.addEventListener("click",()=>{
    if(!enabled||!session||!map||economy.isDialogOpen())return;
    const wave=map.waves[session.phase==="preparation"?0:session.phase==="intermission"?session.wave:session.wave-1]!;
    const enemies=session.activeEnemies;
    const waveNumber=map.waves.indexOf(wave)+1;
    const pending=session.phase==="preparation"||session.phase==="intermission"?
      wave.groups.reduce((count,group)=>count+group.count,0):session.remainingSpawns;
    const routeName=(id:string)=>map!.routes.find(route=>route.id===id)?.name??id;
    const instruction=session.phase==="active"||session.phase==="paused"?"Il tempo resta fermo dopo la chiusura: premi Riprendi per continuare.":
      session.phase==="preparation"||session.phase==="intermission"?"Chiudi i dettagli e premi Avvia ondata quando sei pronto.":"Il tentativo è concluso. Chiudi i dettagli per osservare il campo o ricominciare.";
    dialog.open({title:"Ondata "+waveNumber+"/"+map.waves.length+": "+wave.name,paragraphs:[
      "Le difese attaccano automaticamente quando le creature sono in gittata. "+instruction,
      "Stabilità "+session.stability+"/"+map.stability+". Scintille "+session.economy.balance+". Bonus a ondata risolta: "+wave.bonus+".",
      ...fieldLegend(map),
      ...(map.firstEntryTowers.some(node=>node.startsWith("nido-"))?["L’ovale azzurro identifica un alleato del Nido in volo."]:[]),
      ...(map.waves.some(wave=>wave.groups.some(group=>group.enemy==="branco"))?["Il Branco è composto da individui indipendenti. Le barrette del Branco compaiono solo quando una creatura perde Carica, per non coprire le piccole sagome. Questi Dettagli mostrano anche gli individui a Carica piena."]:[]),
      ...(map.waterSegment?["Il simbolo ≈ indica il Guado in acqua bassa. Le zampe restano appoggiate al fondo; velocità base 46 unità/s, nessun bonus del terreno."]:[]),
      ...(map.waves.some(wave=>wave.groups.some(group=>group.enemy==="richiamo"))?[supportDetails]:[]),
      ...(wave.groups.some(group=>group.enemy==="custode")?bossDetails:[]),
      ...wave.groups.map(group=>group.count+" × "+enemyData.enemies.find(enemy=>enemy.id===group.enemy)!.name+" · "+routeName(group.path)+" · dal secondo "+number(group.start)+
        (group.count>1?" ogni "+number(group.interval)+" s":"")+" dall’avvio dell’ondata."),
      enemies.length?"Presenti: "+enemies.length+". Ancora da entrare: "+pending+".":"Nessuna creatura sul campo. Ancora da entrare: "+pending+".",
      ...session.economy.towers.flatMap(tower=>{const remaining=session!.towers.disabledRemaining(tower.uid);return remaining>0?["Piazzola "+tower.slot+": sospesa ancora "+number(remaining)+" s. Recupero e preparazione riprenderanno dalla frazione conservata."]:[];}),
      ...enemies.map(enemy=>{
        const engine=session!.engine,time=engine.time,states:string[]=[];
        if(engine.rootActive(enemy.id))states.push("Immobile");
        if(engine.effectiveSlow(enemy.id)>0)states.push("Rallentato "+number(engine.effectiveSlow(enemy.id)*100)+"%");
          if(engine.sporeStrength(enemy)>0)states.push("Spore "+number(engine.sporeStrength(enemy))+" Carica/s");
          if(enemy.definition.support){const song=songState(enemy,time);states.push("Supporto. "+(song.phase==="warning"?"Canto fra "+number(song.remaining)+" s":song.phase==="active"?"Canto +25%, raggio 140, ancora "+number(song.remaining)+" s":"Prossimo preavviso fra "+number(song.remaining)+" s"));}
          if(session!.enemies.accelerated(enemy))states.push("Accelerato +25%");
          if(inWater(enemy.definition.id,enemy.traveller.path.id,enemy.traveller.distance,map!.waterSegment))states.push("Nel guado. Velocità base 46 unità/s, nessun bonus del terreno");
          if(enemy.definition.boss){const boss=session!.enemies.boss.view(enemy.id)!;states.push("Fase "+boss.phase);
            if(boss.phase===2)states.push(boss.roar.phase==="warning"?"Ruggito fra "+number(boss.roar.remaining)+" s":boss.roar.phase==="active"?"Ruggito attivo +25%, ancora "+number(boss.roar.remaining)+" s":"Prossimo avviso ruggito fra "+number(boss.roar.remaining)+" s");
            if(boss.phase===3)states.push(boss.tail?"Coda fra "+number(boss.tailRemaining)+" s, bersagli fissati: "+(boss.tail.targets.map(target=>target.slot).join(", ")||"nessuno rimasto"):"Prossimo tentativo coda fra "+number(boss.nextTail)+" s");
          }
        if(strongest(enemy.reductions,time)>0)states.push("Protezione ridotta di "+number(strongest(enemy.reductions,time))+" punti");
        const charge=enemy.charge>0&&enemy.charge<0.01?"<0,01":enemy.charge.toLocaleString("it-IT",{maximumFractionDigits:2});
        return "#"+(enemy.traveller.entryOrder+1)+" "+enemy.definition.name+" · Carica "+charge+"/"+enemy.definition.charge+
          " · protezione fisica "+enemy.definition.physicalProtection+"%, spore "+enemy.definition.sporeProtection+"% · "+routeName(enemy.traveller.path.id)+" · al portale "+Math.ceil(travellerPose(enemy.traveller).remaining)+" unità. Stati: "+(states.join(", ")||"nessuno")+".";
      }),
    ],restoreFocus:()=>{if(info.getClientRects().length&&!info.disabled)info.focus();else fallback();}});
  });
  return {
    setMap(next:FieldMap):void{map=next;reset();},reset,suspend,
    setEnabled(value:boolean):void{enabled=value;if(!value){session?.pause();stop();}refresh();},
    isDialogOpen:()=>dialog.isOpen(),
    requestLeave(onConfirm:()=>void,restore:()=>void):void{suspend();if(session?.result)onConfirm();else economy.requestLeave(onConfirm,restore);},
    phase:()=>session?.phase??"preparation",
    controller(){session?.towers.sync();runtimeText();return session?.towers??null;},
    boss(){return session?.enemies.boss.view()??null;},
    visual():CombatVisual{return{enemies:[],areas:session?.engine.areas??[],projectiles:[]};},
    markers():readonly WaveMarker[]{return session?[...session.activeEnemies,...session.enemies.departing].map(enemy=>({...travellerPose(enemy.traveller),kind:enemy.definition.id,charge:enemy.charge,maximum:enemy.definition.charge,
      id:enemy.id,path:enemy.traveller.path,distance:enemy.traveller.distance,song:songState(enemy,session!.engine.time),accelerated:session!.enemies.accelerated(enemy),
      opacity:session!.enemies.opacity(enemy.id),departing:enemy.state!=="active",outline:session!.enemies.outline(enemy.id),
      slow:session!.engine.effectiveSlow(enemy.id),rooted:session!.engine.rootActive(enemy.id),spore:session!.engine.sporeStrength(enemy)})):[];},
  };
}
