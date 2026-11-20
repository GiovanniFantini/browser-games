import { drawBird, muzzlePoint } from "./art";
import type { TowerArt } from "./art";
import { rigConfig } from "./rig-config";
import { allyFlightPose } from "./flight";
import type { TowerController } from "./controller";
import { travellerPose } from "../movement/traveller";
import type { Point, Rect } from "../field/geometry";
import type { CombatArea } from "../combat/types";
import tuning from "../../docs/dati-cicli-torri.json";
import { prefersReducedMotion } from "../motion-preference";

const mix=(a:number,b:number,t:number):number=>a+(b-a)*t;
export function drawAreas(c:CanvasRenderingContext2D,areas:readonly CombatArea[],cameraScale:number,bordersOnly=false):void{
  for(const area of areas){
    c.beginPath();c.arc(area.x,area.y,area.radius,0,Math.PI*2);
    if(!bordersOnly){c.fillStyle=area.kind==="glue"?"#f4b32f22":"#b191e822";c.fill();}
    c.strokeStyle="#071e25";c.lineWidth=5/cameraScale;c.stroke();
    c.strokeStyle=area.kind==="glue"?"#f4b32f":"#e5c4ff";c.lineWidth=2/cameraScale;c.stroke();
  }
}
export function flyingAllies(controller:TowerController,uid:string):ReadonlySet<number>{
  const result=new Set<number>(),time=controller.engine.time;
  for(const flight of controller.flights)if(flight.attack.source===uid&&flight.attack.node.id.startsWith("nido-")&&
      time>=flight.launchedAt&&time+1e-9<flight.returnAt&&flight.sourceLostAt===null)result.add(flight.ally);
  return result;
}
export function drawReleased(c:CanvasRenderingContext2D,art:TowerArt,controller:TowerController,cameraScale:number):readonly Rect[]{
  const time=controller.engine.time,bodies:Rect[]=[],unit=1/cameraScale;
  const reduced=prefersReducedMotion();
  for(const flight of controller.flights){
    if(time<flight.launchedAt)continue;
    const node=flight.attack.node.id,enemy=controller.engine.enemy(flight.target);
    const fixed=node==="resina-colla"||node==="spore-nube"||node==="roccia-sisma";
    const target:Point=fixed?flight.attack.point:enemy?travellerPose(enemy.traveller):flight.attack.point;
    if(node.startsWith("nido-")){
      const owner=controller.source.byUid(flight.attack.source);
      const pose=allyFlightPose(flight,time,target,owner?.node??null);
      if(!pose.finished){
        c.save();c.globalAlpha*=pose.opacity;
        bodies.push(drawBird(c,art,pose.x,pose.y,{size:rigConfig(node).allySize,facing:pose.facing,
          preparation:Math.max(0,1-pose.age/0.08),flightAge:pose.age,sortie:flight.returnAt-flight.launchedAt}));
        // Constant-size ally badge survives busy scenery and crossing enemy silhouettes.
        c.beginPath();c.ellipse(pose.x,pose.y-rigConfig(node).allySize*.5,11*unit,7*unit,0,0,Math.PI*2);
        c.strokeStyle="#071e25";c.lineWidth=4*unit;c.stroke();c.strokeStyle="#a9ebd7";c.lineWidth=1.5*unit;c.stroke();c.restore();
      }
    }else if(time<flight.impactAt){
      const from=muzzlePoint(flight.mountNode,flight.attack.origin.x,flight.attack.origin.y,flight.emitter);
      const t=(time-flight.launchedAt)/(flight.impactAt-flight.launchedAt),x=mix(from.x,target.x,t),y=mix(from.y,target.y,t)-Math.sin(t*Math.PI)*18;
      c.beginPath();
      if(node.startsWith("spore-")){c.moveTo(x,y-5*unit);c.lineTo(x+3*unit,y);c.lineTo(x,y+5*unit);c.lineTo(x-3*unit,y);c.closePath();}
      else{c.arc(x,y,4*unit,0,Math.PI*2);}
      c.fillStyle=node.startsWith("spore-")?"#e7aaff":node.startsWith("roccia-")?"#f8ebc9":"#ffc63d";
      c.strokeStyle="#071e25";c.lineWidth=2*unit;c.stroke();c.fill();
    }
    if(flight.outcome==="hit"&&time>=flight.impactAt&&time<flight.impactAt+tuning.impactDisplay){
      const t=(time-flight.impactAt)/tuning.impactDisplay;
      c.save();c.globalAlpha*=1-t;c.beginPath();c.arc(target.x,target.y,node==="roccia-sisma"?flight.attack.node.area!:(reduced?8:5+t*7)*unit,0,Math.PI*2);
      c.strokeStyle="#071e25";c.lineWidth=5*unit;c.stroke();c.strokeStyle=node.startsWith("spore-")?"#e7aaff":"#ffc63d";c.lineWidth=2*unit;c.stroke();c.restore();
    }
  }
  return bodies;
}
