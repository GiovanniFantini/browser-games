import { FieldImages } from "../field/images";
import { loadTowerArt, drawTowerRig } from "./art";
import { drawAreas, drawReleased, flyingAllies } from "./drawing";
import { TowerController } from "./controller";
import { CombatEngine } from "../combat/engine";
import { compilePath } from "../movement/path";
import { createTraveller, travellerPose } from "../movement/traveller";
import { towerDefinitions } from "../economy/model";
import type { BuiltTower } from "../economy/model";

const grid=document.querySelector<HTMLElement>("#rig-grid")!,state=document.querySelector<HTMLElement>("#rig-state")!,
  play=document.querySelector<HTMLButtonElement>("#rig-play")!;
const art=await loadTowerArt(new FieldImages()),density=Math.min(devicePixelRatio||1,2);
const road=compilePath("campioni",[{x:260,y:280},{x:10000,y:280}]);
let running=!matchMedia("(prefers-reduced-motion: reduce)").matches,last:number|null=null,frame=0;
const cards=towerDefinitions.map(node=>{
  const section=document.createElement("section");section.className="rig-card";section.dataset.node=node.id;
  const title=document.createElement("h2");title.textContent=node.family+" · "+node.name;
  const text=document.createElement("p");text.textContent="Intervallo "+node.interval.toLocaleString("it-IT")+" s. "+node.note;
  const canvas=document.createElement("canvas");canvas.width=400*density;canvas.height=380*density;canvas.setAttribute("aria-label",node.family+" "+node.name+", confronto animato");
  section.append(title,canvas,text);grid.append(section);
  const c=canvas.getContext("2d");if(!c)throw new Error("Canvas non disponibile");
  let engine:CombatEngine,controller:TowerController,uid:string;
  function reset():void{
    engine=new CombatEngine();uid="gallery:"+node.id;
    const tower:BuiltTower=Object.freeze({uid,slot:"A",node:node.id,paid:node.total});
    controller=new TowerController(engine,{towers:[tower],byUid:id=>id===uid?tower:null},[{id:"A",x:180,y:285}]);controller.sync();
    for(let i=0;i<3;i++)engine.addEnemy({id:"esploratore",name:"Campione",charge:100000,physicalProtection:0,sporeProtection:0,reward:8,support:false},
      {...createTraveller("sample"+i,"esploratore",i,road,0.01),distance:10+i*20});
  }
  reset();
  function draw():void{
    c!.setTransform(density,0,0,density,0,0);c!.fillStyle="#0b3038";c!.fillRect(0,0,400,380);
    c!.strokeStyle="#537c78";c!.lineWidth=2;c!.beginPath();c!.moveTo(250,280);c!.lineTo(395,280);c!.stroke();
    const cssScale=canvas.getBoundingClientRect().width/400;drawAreas(c!,engine.areas,cssScale);
    drawTowerRig(c!,art,node.id,180,285,controller.pose(uid),flyingAllies(controller,uid));
    drawReleased(c!,art,controller,cssScale);drawAreas(c!,engine.areas,cssScale,true);
    for(const enemy of engine.enemies){const p=travellerPose(enemy.traveller);c!.fillStyle="#f8ebc9";c!.strokeStyle="#071e25";c!.lineWidth=2;c!.beginPath();c!.arc(p.x,p.y,5,0,Math.PI*2);c!.stroke();c!.fill();c!.font="600 "+(14/cssScale)+"px system-ui";c!.textAlign="center";c!.fillText(String(enemy.traveller.entryOrder+1),p.x,p.y+22);}
  }
  return{draw,reset,advance(seconds:number):void{engine.advance(seconds);controller.observeEvents(engine.drainEvents());},time:()=>engine.time};
});
function draw():void{cards.forEach(card=>card.draw());play.textContent=running?"Pausa":"Riprendi";}
function tick(now:number):void{
  frame=0;if(!running)return;if(last!==null)cards.forEach(card=>card.advance(Math.min(0.1,Math.max(0,(now-last!)/1000))));last=now;draw();frame=requestAnimationFrame(tick);
}
function suspend():void{running=false;last=null;cancelAnimationFrame(frame);frame=0;draw();state.textContent="Galleria in pausa. Tempo "+cards[0]!.time().toLocaleString("it-IT",{maximumFractionDigits:2})+" s.";}
play.addEventListener("click",()=>{if(running)suspend();else{running=true;last=null;state.textContent="Galleria in movimento.";frame=requestAnimationFrame(tick);draw();}});
function step(seconds:number):void{suspend();cards.forEach(card=>card.advance(seconds));draw();state.textContent="Galleria in pausa. Tempo "+cards[0]!.time().toLocaleString("it-IT",{maximumFractionDigits:2})+" s.";}
document.querySelector("#rig-step")!.addEventListener("click",()=>step(0.05));document.querySelector("#rig-quarter")!.addEventListener("click",()=>step(0.25));
document.querySelector("#rig-reset")!.addEventListener("click",()=>{suspend();cards.forEach(card=>card.reset());draw();state.textContent="Galleria ripristinata. Tempo 0 s.";});
window.addEventListener("blur",suspend);document.addEventListener("visibilitychange",()=>{if(document.hidden)suspend();});
draw();state.textContent=running?"Galleria in movimento.":"Galleria in pausa per la preferenza di movimento ridotto.";if(running)frame=requestAnimationFrame(tick);


