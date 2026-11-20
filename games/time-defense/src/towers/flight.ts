import tuning from "../../docs/dati-cicli-torri.json";
import type { Point } from "../field/geometry";
import type { ReleasedVisual } from "./controller";
import { rigConfig } from "./rig-config";

const clamp=(value:number):number=>Math.max(0,Math.min(1,value));
const ease=(value:number):number=>{const t=clamp(value);return t*t*(3-2*t);};
const mix=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export interface FlightPose extends Point {
  readonly opacity:number;
  readonly facing:1|-1;
  readonly age:number;
  readonly finished:boolean;
}
export function allyFlightPose(flight:ReleasedVisual,time:number,target:Point,returnNode:string|null):FlightPose{
  const old=rigConfig(flight.mountNode),next=rigConfig(returnNode??flight.mountNode);
  const launch=old.mounts[flight.ally]??old.mounts[0]!,land=next.mounts[flight.ally]??next.mounts[0]!;
  const start={x:flight.attack.origin.x+launch.x,y:flight.attack.origin.y+launch.y};
  const home={x:flight.attack.origin.x+land.x,y:flight.attack.origin.y+land.y};
  const contact={x:target.x,y:target.y-18};
  const outbound=flight.impactAt-flight.launchedAt,sortie=flight.returnAt-flight.launchedAt;
  const age=Math.max(0,time-flight.launchedAt);
  function normal(atAge:number):Point{
    if(atAge<=outbound){const t=ease(atAge/outbound),p=mix(start,contact,t);return{x:p.x,y:p.y-Math.sin(Math.PI*t)*42};}
    const t=ease((atAge-outbound)/(sortie-outbound)),p=mix(contact,home,t);return{x:p.x,y:p.y-Math.sin(Math.PI*t)*32};
  }
  let opacity=1,point=normal(Math.min(age,sortie)),finished=time+1e-9>=flight.returnAt;
  const lost=flight.sourceLostAt;
  if(lost!==null&&lost<flight.returnAt){
    const fadeAt=Math.max(flight.impactAt,lost),fadeAge=fadeAt-flight.launchedAt;
    if(time>=fadeAt){
      const t=clamp((time-fadeAt)/tuning.soldAllyFade);point=normal(fadeAge);point={x:point.x,y:point.y-8*t};opacity=1-t;finished=t>=1;
    }else finished=false;
  }
  const forward=age<outbound?contact.x-start.x:home.x-contact.x;
  return{...point,opacity,facing:forward>=0?1:-1,age,finished:time<flight.launchedAt||finished};
}
