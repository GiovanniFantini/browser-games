import data from "../../docs/dati-nemici.json";
import { FieldImages } from "../field/images";
import { compilePath } from "../movement/path";
import { drawEnemyRig,loadEnemyArt } from "./art";
const host=document.querySelector<HTMLElement>("#cards")!,time=document.querySelector<HTMLElement>("#time")!;
const play=document.querySelector<HTMLButtonElement>("#play")!,step=document.querySelector<HTMLButtonElement>("#step")!,reset=document.querySelector<HTMLButtonElement>("#reset")!;
const kinds=data.enemies.filter(enemy=>!enemy.boss),art=await loadEnemyArt(new FieldImages(),kinds.map(enemy=>enemy.id));
const path=compilePath("showcase",[{x:-10000,y:0},{x:10000,y:0}]);
const cards=kinds.map(enemy=>{const article=document.createElement("article");article.dataset.kind=enemy.id;const title=document.createElement("h2");title.textContent=enemy.name;const canvas=document.createElement("canvas");canvas.width=440;canvas.height=240;const description=document.createElement("p");description.textContent=enemy.ability;article.append(title,canvas,description);host.append(article);return{enemy,canvas};});
let elapsed=0,running=false,last:number|null=null,frame=0;
function draw():void{
  time.textContent="Tempo simulato: "+elapsed.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})+" s. "+(running?"In movimento.":"In pausa.");
  for(const {enemy,canvas}of cards){const c=canvas.getContext("2d")!,density=Math.min(devicePixelRatio||1,2),width=Math.round(440*density),height=Math.round(240*density);if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
    const ratio=canvas.width/440;c.setTransform(ratio,0,0,ratio,0,0);c.fillStyle="#264c40";c.fillRect(0,0,440,240);
    c.strokeStyle="#537c78";c.beginPath();c.moveTo(0,195);c.lineTo(440,195);c.stroke();
    const distance=10000+elapsed*enemy.speed;c.translate(245-(distance-10000),195);drawEnemyRig(c,art,enemy.id,path,distance);
  }
}
function stop():void{running=false;cancelAnimationFrame(frame);frame=0;last=null;play.textContent="Riproduci";draw();}
function tick(now:number):void{if(!running)return;if(last!==null)elapsed+=Math.min(.1,(now-last)/1000);last=now;draw();frame=requestAnimationFrame(tick);}
play.addEventListener("click",()=>{if(running){stop();return;}running=true;play.textContent="Pausa";last=null;frame=requestAnimationFrame(tick);});
step.addEventListener("click",()=>{stop();elapsed+=.05;draw();});reset.addEventListener("click",()=>{stop();elapsed=0;draw();});
addEventListener("blur",stop);document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});draw();
