import metadata from "../../art-source/runtime38/parts.json";
import { pathPose } from "../movement/path";
import type { DistancePath } from "../movement/path";
import type { Point } from "../field/geometry";

export interface RigOptions { bobAmplitude?:number;footLift?:number;hipY?:number;upperLength?:number;lowerLength?:number;frontHipX?:number;hindHipX?:number;frontFootAdvance?:number;farFootY?:number;farHipX?:number;farHipY?:number;bodyWidth?:number;bodyY?:number;tailWidth?:number;tailRootX?:number;tailRootY?:number; }
interface Actor { name:string;size:number;stride:number;phases:readonly number[];quad:boolean;duty:number;rig?:RigOptions; }
export const actors:Readonly<Record<string,Actor>>=metadata.actors;
export interface LegPose { readonly hip:Point; readonly knee:Point; readonly foot:Point; readonly intended:Point; readonly stance:boolean; readonly phase:number; readonly front:boolean; readonly far:boolean; readonly upper:number;readonly lower:number; }
const tau=Math.PI*2,mod=(x:number,n:number):number=>((x%n)+n)%n;
const ease=(t:number):number=>t*t*(3-2*t);
export function enemyRig(kind:string,path:DistancePath,distance:number){
  if(!actors[kind])throw new Error("Missing enemy rig");const actor=actors[kind]!;
  const S=actor.size,r=actor.rig??{},quad=actor.quad,position=pathPose(path,distance);
  const facing:1|-1=Math.cos(position.heading)>=0?1:-1;
  const stride=S*actor.stride,step=distance/stride;
  const bob=-Math.cos(step*tau*2)*S*(r.bobAmplitude??(quad?.006:.011));
  const world=(p:Point):Point=>({x:position.x+p.x*facing,y:position.y+p.y});
  const local=(p:Point):Point=>({x:(p.x-position.x)*facing,y:p.y-position.y});
  function leg(front:boolean,far:boolean,offset:number):LegPose{
    const hx=(front?(r.frontHipX??.21):(r.hindHipX??(quad?-.20:-.045)))*S;
    const hip={x:hx+(far?(r.farHipX??4):0),y:(r.hipY??(quad?-.285:-.34))*S+bob+(far?(r.farHipY??-3):0)};
    const upper=(r.upperLength??(quad?.19:.235))*S,lower=(r.lowerLength??(quad?.225:.255))*S;
    const cycle=step+offset,k=Math.floor(cycle),phase=mod(cycle,1),stance=phase<actor.duty;
    const d0=(k-offset)*stride;
    const contact=(d:number):Point=>{
      const p=pathPose(path,d);
      // A direction change mirrors the complete rigid character and its foot offsets.
      // Within each facing interval the contact remains fixed in world coordinates.
      return{x:p.x+(hx+(front?(r.frontFootAdvance??.018)*S:0))*facing,y:p.y-.035*S+(far?(r.farFootY??-2):0)};
    };
    const a=contact(d0+stride*actor.duty*.5),b=contact(d0+stride+stride*actor.duty*.5);
    let target=a;
    if(!stance){const swing=(phase-actor.duty)/(1-actor.duty),f=ease(swing);target={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f-Math.sin(Math.PI*swing)**2*S*(r.footLift??(quad?.075:.12))};}
    const intended=local(target),dx=intended.x-hip.x,dy=intended.y-hip.y,dist=Math.hypot(dx,dy);
    const reach=Math.max(Math.abs(upper-lower)+1e-7,Math.min(upper+lower-1e-7,dist));
    const cosine=Math.max(-1,Math.min(1,(upper*upper+reach*reach-lower*lower)/(2*upper*reach)));
    const angle=Math.atan2(dy,dx)-(front?-1:1)*Math.acos(cosine);
    const knee={x:hip.x+Math.cos(angle)*upper,y:hip.y+Math.sin(angle)*upper};
    const foot={x:hip.x+dx/(dist||1)*reach,y:hip.y+dy/(dist||1)*reach};
    return{hip,knee,foot,intended,stance,phase,front,far,upper,lower};
  }
  const phases=actor.phases;
  const legs=quad?[leg(false,true,phases[2]!),leg(true,true,phases[3]!),leg(false,false,phases[0]!),leg(true,false,phases[1]!)]:[leg(false,true,.5),leg(false,false,0)];
  return{actor,position,facing,step,bob,legs,world};
}
