import data from "../../docs/dati-nemici.json";
import { FieldRenderer } from "../field/renderer";
import { FieldImages } from "../field/images";
import { fieldMaps,families,familyArt } from "../field/catalog";
import { compilePath,pathPose } from "../movement/path";
import { createTraveller,travellerPose } from "../movement/traveller";
import { CombatEngine } from "../combat/engine";
import { AttemptEconomy,towerDefinitions } from "../economy/model";
import { TowerController } from "../towers/controller";
import { loadTowerArt } from "../towers/art";
import { EnemyController,songState } from "./controller";
import { drawEnemyRig,loadEnemyArt } from "./art";
import { createBossHud } from "./boss-hud";
import type { Family } from "../field/catalog";
const button=(id:string):HTMLButtonElement=>document.querySelector<HTMLButtonElement>("#"+id)!;
const canvas=document.querySelector<HTMLCanvasElement>("#boss-field")!,detail=document.querySelector<HTMLCanvasElement>("#boss-detail")!,log=document.querySelector<HTMLElement>("#log")!,time=document.querySelector<HTMLElement>("#time")!,towerState=document.querySelector<HTMLElement>("#tower-state")!;
const renderer=new FieldRenderer(canvas),hud=createBossHud(document.querySelector<HTMLElement>("#boss-status")!),map=fieldMaps[4]!,path=compilePath(map.routes[0]!.id,map.routes[0]!.points),images=new FieldImages();
const [background,towerArt,enemyArt,tokenEntries]=await Promise.all([images.load(map.background),loadTowerArt(images),loadEnemyArt(images,["custode","esploratore"]),Promise.all(families.map(async family=>[family,await images.load(familyArt[family])]as const))]);
const tokens=Object.fromEntries(tokenEntries)as Record<Family,HTMLImageElement>;
let best=Infinity,startDistance=0;
for(let d=100;d<path.length-500;d+=2){const p=pathPose(path,d),distances=map.slots.map(slot=>Math.hypot(p.x-slot.x,p.y-slot.y)).sort((a,b)=>a-b);if(distances[1]!<best){best=distances[1]!;startDistance=d;}}
const selected=map.slots.map(slot=>({...slot,d:Math.hypot(pathPose(path,startDistance).x-slot.x,pathPose(path,startDistance).y-slot.y)})).sort((a,b)=>a.d-b.d).slice(0,3);
let engine:CombatEngine,economy:AttemptEconomy,towers:TowerController,enemies:EnemyController,bossId="",scenario:1|2|3=1,serial=0,running=false,frame=0,last:number|null=null,speed:1|2=1;
function observe():void{
 const events=engine.drainEvents();towers.observeEvents(events);enemies.observeEvents(events);
 for(const event of events)if(event.type==="neutralized"){const enemy=engine.enemy(event.enemy)!;economy.applyCombatReward(economy.attempt,event,enemy.definition.id);if(enemy.definition.boss)log.textContent="Custode liberato. Le eventuali creature rimaste continuano.";}
 for(const event of enemies.boss.drainEvents())log.textContent=event.message;
}
function advance(seconds:number):void{let remaining=seconds;while(remaining>1e-10){const amount=Math.min(remaining,1/120);engine.advance(amount);observe();remaining-=amount;}draw();}
function draw():void{
 const fits=innerWidth>=1024;document.querySelector<HTMLElement>(".field")!.hidden=!fits;document.querySelector<HTMLElement>("#small-map-note")!.hidden=fits;
 const width=Math.max(200,Math.min(760.5,innerWidth>=1024?innerWidth-352:innerWidth-34));renderer.resize(width,width*1344/2016);
 const boss=enemies.boss.view(),visible=[...engine.enemies.filter(enemy=>enemy.state==="active"),...enemies.departing];
 if(fits)renderer.draw({map,background,tokens,selectedSlot:null,family:null,showRoutes:false,enemyArt,towerArt,towerController:towers,...(boss?{boss}:{}),
  towers:economy.towers.map(tower=>({uid:tower.uid,slot:tower.slot,node:tower.node,family:tower.node.split("-")[0]as Family})),
  waveMarkers:visible.map(enemy=>({...travellerPose(enemy.traveller),id:enemy.id,kind:enemy.definition.id,charge:enemy.charge,maximum:enemy.definition.charge,path:enemy.traveller.path,distance:enemy.traveller.distance,
    song:songState(enemy,engine.time),accelerated:enemies.accelerated(enemy),slow:engine.effectiveSlow(enemy.id),rooted:engine.rootActive(enemy.id),spore:engine.sporeStrength(enemy),opacity:enemies.opacity(enemy.id),departing:enemy.state!=="active",outline:enemies.outline(enemy.id)}))});
 hud.update(boss,false);
 const density=Math.min(devicePixelRatio||1,2);if(detail.width!==600*density)detail.width=600*density;if(detail.height!==400*density)detail.height=400*density;
 const c=detail.getContext("2d")!;c.setTransform(density,0,0,density,0,0);c.fillStyle="#264c40";c.fillRect(0,0,600,400);
 const enemy=engine.enemy(bossId)!;const p=travellerPose(enemy.traveller),opacity=enemy.state==="active"?1:enemies.departing.some(item=>item.id===enemy.id)?enemies.opacity(enemy.id):0;
 if(opacity>0){c.save();c.translate(310-p.x,320-p.y);c.globalAlpha=opacity;drawEnemyRig(c,enemyArt,"custode",enemy.traveller.path,enemy.traveller.distance,boss);c.restore();}
 time.textContent="Tempo "+engine.time.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})+" s · "+(running?"In movimento":"In pausa")+" · "+speed+"x";
 towerState.textContent=selected.map(slot=>{const tower=economy.at(slot.id);if(!tower)return slot.id+": vuota";const remaining=towers.disabledRemaining(tower.uid);return slot.id+": "+(remaining>0?"sospesa "+(Math.ceil(remaining*10)/10).toLocaleString("it-IT")+" s":"operativa");}).join(". ");
 button("sell").disabled=!economy.at(selected[0]!.id);button("rebuild").disabled=Boolean(economy.at(selected[0]!.id));button("upgrade").disabled=economy.at(selected[0]!.id)?.node!=="resina-base";
 button("damage").disabled=enemy.state!=="active"||enemy.charge<=100;button("liberate").disabled=enemy.state!=="active";
}
function stop():void{running=false;cancelAnimationFrame(frame);frame=0;last=null;button("play").textContent="Riproduci";if(engine)draw();}
function reset(next:1|2|3=scenario):void{
 stop();scenario=next;engine=new CombatEngine();economy=new AttemptEconomy("boss-gallery:"+(++serial),10000,map.slots.map(slot=>slot.id),towerDefinitions.map(node=>node.id));
 for(const slot of selected)economy.build("resina",slot.id);towers=new TowerController(engine,economy,map.slots);towers.sync();enemies=new EnemyController(engine,towers,map.slots);
 const definition=data.enemies.find(enemy=>enemy.id==="custode")!;bossId="boss:"+serial;engine.addEnemy(definition,{...createTraveller(bossId,definition.id,0,path,definition.speed),distance:startDistance});
 const scout=data.enemies.find(enemy=>enemy.id==="esploratore")!;for(let i=0;i<2;i++)engine.addEnemy(scout,{...createTraveller("scout:"+i,scout.id,i+1,path,scout.speed),distance:startDistance-120-i*60});
 if(next!==1)engine.damage(bossId,definition.charge-(next===2?780:360),"spore","scenario");advance(1/120);log.textContent="Campione Fase "+next+" ripristinato. Le torri attaccano realmente quando avvii il tempo.";draw();
}
function tick(now:number):void{if(!running)return;if(last!==null)advance(Math.min(.1,Math.max(0,(now-last)/1000))*speed);last=now;frame=requestAnimationFrame(tick);}
button("play").addEventListener("click",()=>{if(running){stop();return;}running=true;button("play").textContent="Pausa";last=null;frame=requestAnimationFrame(tick);});
button("step").addEventListener("click",()=>{stop();advance(.05);});button("reset").addEventListener("click",()=>reset());button("speed").addEventListener("click",()=>{speed=speed===1?2:1;button("speed").textContent=speed+"x";draw();});
for(const phase of [1,2,3]as const)button("scene-"+phase).addEventListener("click",()=>reset(phase));
button("damage").addEventListener("click",()=>{engine.damage(bossId,100,"spore","scenario");advance(1/120);});button("liberate").addEventListener("click",()=>{engine.damage(bossId,10000,"spore","scenario");advance(1/120);});
button("sell").addEventListener("click",()=>{const tower=economy.at(selected[0]!.id);if(tower){const quote=economy.prepareSell(tower.uid);if("action"in quote)economy.confirm(quote);}towers.sync();draw();});
button("rebuild").addEventListener("click",()=>{economy.build("resina",selected[0]!.id);towers.sync();draw();});button("upgrade").addEventListener("click",()=>{const tower=economy.at(selected[0]!.id);if(tower)economy.upgradeCommon(tower.uid,tower.node);towers.sync();draw();});
addEventListener("blur",stop);addEventListener("resize",()=>draw());document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});reset();
