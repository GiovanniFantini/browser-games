import metadata from "../../art-source/runtime36/parts.json";
import resinaUrl from "../../art-source/runtime36/resina-parts-v1.png?url";
import sporeUrl from "../../art-source/runtime36/spore-parts-v1.png?url";
import nidoUrl from "../../art-source/runtime36/nido-parts-v1.png?url";
import rocciaUrl from "../../art-source/runtime36/roccia-parts-v1.png?url";
import pteroUrl from "../../art-source/runtime36/ptero-parts-v1.png?url";
import nearInnerUrl from "../../art-source/animations-v3/parts/wing-near-inner.png?url";
import nearOuterUrl from "../../art-source/animations-v3/parts/wing-near-outer.png?url";
import farInnerUrl from "../../art-source/animations-v3/parts/wing-far-inner.png?url";
import farOuterUrl from "../../art-source/animations-v3/parts/wing-far-outer.png?url";
import { rigConfig } from "./rig-config";
import type { Point, Rect } from "../field/geometry";
import type { TowerPose } from "./controller";
import type { FieldImages } from "../field/images";

const urls={resina:resinaUrl,spore:sporeUrl,nido:nidoUrl,roccia:rocciaUrl,ptero:pteroUrl,
  nearInner:nearInnerUrl,nearOuter:nearOuterUrl,farInner:farInnerUrl,farOuter:farOuterUrl};
export type TowerArt=Readonly<Record<keyof typeof urls,HTMLImageElement>>;
interface Frame extends Rect {}
const tau=Math.PI*2,clamp=(value:number):number=>Math.max(0,Math.min(1,value));
const ease=(value:number):number=>{const t=clamp(value);return t*t*(3-2*t);};
export async function loadTowerArt(images:FieldImages):Promise<TowerArt>{
  const entries=await Promise.all(Object.entries(urls).map(async([name,url])=>[name,await images.load(url)]as const));
  return Object.fromEntries(entries)as TowerArt;
}
function rectUnion(rects:readonly Rect[]):Rect{
  const x=Math.min(...rects.map(rect=>rect.x)),y=Math.min(...rects.map(rect=>rect.y));
  return{x,y,width:Math.max(...rects.map(rect=>rect.x+rect.width))-x,height:Math.max(...rects.map(rect=>rect.y+rect.height))-y};
}
function whole(image:HTMLImageElement):Frame{return{x:0,y:0,width:image.width,height:image.height};}
function part(c:CanvasRenderingContext2D|null,image:HTMLImageElement,frame:Frame,x:number,y:number,width:number,pivot:Point,angle=0):Rect{
  const height=width*frame.height/frame.width,co=Math.cos(angle),si=Math.sin(angle),left=-pivot.x*width,top=-pivot.y*height;
  c?.save();c?.translate(x,y);c?.rotate(angle);
  c?.drawImage(image,frame.x,frame.y,frame.width,frame.height,left,top,width,height);c?.restore();
  const corners=[[left,top],[left+width,top],[left,top+height],[left+width,top+height]].map(([px,py])=>({x:x+px!*co-py!*si,y:y+px!*si+py!*co}));
  const minX=Math.min(...corners.map(p=>p.x)),minY=Math.min(...corners.map(p=>p.y));
  return{x:minX,y:minY,width:Math.max(...corners.map(p=>p.x))-minX,height:Math.max(...corners.map(p=>p.y))-minY};
}
function bone(c:CanvasRenderingContext2D|null,image:HTMLImageElement,frame:Frame,root:Point,end:Point,a:Point,b:Point):Rect{
  const sourceX=(b.x-a.x)*frame.width,sourceY=(b.y-a.y)*frame.height;
  const ratio=Math.hypot(end.x-root.x,end.y-root.y)/Math.hypot(sourceX,sourceY);
  return part(c,image,frame,root.x,root.y,frame.width*ratio,a,Math.atan2(end.y-root.y,end.x-root.x)-Math.atan2(sourceY,sourceX));
}
export function solveLeg(hip:Point,foot:Point,l1:number,l2:number):{knee:Point;foot:Point}{
  const dx=foot.x-hip.x,dy=foot.y-hip.y,distance=Math.hypot(dx,dy);
  const d=Math.max(Math.abs(l1-l2)+1e-8,Math.min(l1+l2-1e-8,distance));
  const angle=Math.atan2(dy,dx)-Math.acos(clampCos((l1*l1+d*d-l2*l2)/(2*l1*d)));
  return{knee:{x:hip.x+Math.cos(angle)*l1,y:hip.y+Math.sin(angle)*l1},foot:{x:hip.x+dx/(distance||1)*d,y:hip.y+dy/(distance||1)*d}};
}
const clampCos=(value:number):number=>Math.min(1,Math.max(-1,value));
export interface BirdPose {
  readonly size:number;
  readonly facing:1|-1;
  readonly preparation:number;
  readonly flightAge:number|null;
  readonly sortie:number;
}
export function drawBird(c:CanvasRenderingContext2D|null,art:TowerArt,x:number,y:number,pose:BirdPose):Rect{
  const {size:S,facing}=pose,age=pose.flightAge;
  const airborne=age!==null,opening=airborne?ease(Math.min(age/0.1,(pose.sortie-age)/0.18)):0;
  const tuck=airborne?ease(Math.min(age/0.12,(pose.sortie-age)/0.18)):0;
  const beat=(age??0)*tau*2/pose.sortie,flap=Math.sin(beat),lag=Math.sin(beat-0.65);
  const bodyY=-S*(0.24-0.04*pose.preparation),rects:Rect[]=[];
  c?.save();c?.translate(x,y);c?.scale(facing,1);
  function wing(far:boolean):void{
    const root={x:S*(far?0.025:0),y:bodyY+S*0.03},inner=S*(far?0.31:0.35),outer=S*(far?0.33:0.38);
    const flightInner=far?-0.3-flap*0.58:Math.PI+0.24+flap*0.58;
    const a=(far?3.7:3.6)*(1-opening)+flightInner*opening;
    const elbow={x:root.x+Math.cos(a)*inner,y:root.y+Math.sin(a)*inner};
    const fold=(0.5+0.5*Math.cos(beat-0.35))*0.65;
    const flightOuter=flightInner+(far?1:-1)*(0.18+fold)+lag*0.16;
    const b=(far?0.6:0.5)*(1-opening)+flightOuter*opening;
    const tip={x:elbow.x+Math.cos(b)*outer,y:elbow.y+Math.sin(b)*outer};
    const im1=far?art.farInner:art.nearInner,im2=far?art.farOuter:art.nearOuter;
    rects.push(bone(c,im1,whole(im1),root,elbow,{x:0.07,y:0.65},{x:0.93,y:0.43}));
    rects.push(bone(c,im2,whole(im2),elbow,tip,{x:0.06,y:0.27},{x:0.95,y:0.83}));
  }
  function leg(far:boolean):void{
    const hip={x:-S*(far?0.105:0.075),y:bodyY+S*0.12};
    const ground={x:S*(far?-0.10:-0.035),y:0};
    const foot={x:ground.x*(1-tuck)+(hip.x+S*0.025)*tuck,y:(hip.y+S*0.065)*tuck};
    const solved=solveLeg(hip,foot,S*0.095,S*0.115);
    rects.push(bone(c,art.ptero,metadata.families.ptero.parts[1]!,hip,solved.knee,{x:0.87,y:0.12},{x:0.17,y:0.85}));
    rects.push(bone(c,art.ptero,metadata.families.ptero.parts[2]!,solved.knee,solved.foot,{x:0.36,y:0.07},{x:0.62,y:0.89}));
  }
  wing(true);leg(true);
  rects.push(part(c,art.ptero,metadata.families.ptero.parts[0]!,0,bodyY,S*0.5,{x:0.45,y:0.60}));
  leg(false);wing(false);c?.restore();
  const local=rectUnion(rects);
  return{x:x+(facing===1?local.x:-local.x-local.width),y:y+local.y,width:local.width,height:local.height};
}
export function muzzlePoint(node:string,x:number,y:number,emitter=0):Point{
  const config=rigConfig(node),mount=config.mounts[emitter]??config.mounts[0]??{x:0,y:0};
  if(config.family==="roccia")return node==="roccia-sisma"?{x,y:y-20}:
    {x:x+mount.x+(emitter===0?-1:1)*config.arms[emitter]!*0.4,y:y+mount.y+config.arms[emitter]!*0.65};
  return{x:x+mount.x+(config.family==="resina"?config.headWidth*0.85:0),y:y+mount.y-(config.family==="spore"?config.headWidth*0.45:0)};
}
export function drawTowerRig(c:CanvasRenderingContext2D|null,art:TowerArt,node:string,x:number,y:number,pose:TowerPose|null,flying:ReadonlySet<number>=new Set()):Rect{
  const config=rigConfig(node),frames=metadata.families[config.family].parts,body=frames[config.column]!,rects:Rect[]=[];
  const preparation=pose?.preparation??0,recovery=pose?.recovery??0;
  c?.save();c?.translate(x,y);
  rects.push(part(c,art[config.family],body,0,0,config.height*body.width/body.height,{x:0.5,y:1}));
  if(config.family==="resina"){
    const mount=config.mounts[0]!;
    rects.push(part(c,art.resina,frames[4+config.column]!,mount.x,mount.y,config.headWidth,{x:0.10,y:0.5},-ease(preparation)*0.16+recovery*0.07));
  }else if(config.family==="spore"){
    config.mounts.forEach((mount,index)=>{
      const active=index===(pose?.emitter??0),motion=active?-ease(preparation)*0.14+recovery*0.05:0;
      const head=metadata.families.spore.parts[4+config.column]!;
      rects.push(part(c,art.spore,head,mount.x,mount.y,config.headWidth,head.bottomSocket,motion));
    });
  }else if(config.family==="roccia"){
    config.mounts.forEach((mount,index)=>{
      const active=node==="roccia-sisma"||index===(pose?.emitter??0),sign=index===0?1:-1,
        motion=sign*(ease(preparation)*0.5-recovery*0.27)*(active?1:0.25);
      rects.push(part(c,art.roccia,frames[4+index*4+config.column]!,mount.x,mount.y,config.arms[index]!,{x:index===0?0.89:0.11,y:0.23},motion));
    });
  }else{
    config.mounts.forEach((mount,index)=>{
      const crouch=index<(pose?.preparingTargets??0)?pose?.prepared?1:preparation:0;
      if(!flying.has(index))rects.push(drawBird(c,art,mount.x,mount.y,{size:config.allySize,facing:1,preparation:crouch,flightAge:null,sortie:1.2}));
    });
  }
  c?.restore();const local=rectUnion(rects);
  return{x:x+local.x,y:y+local.y,width:local.width,height:local.height};
}

/** Same pose and part geometry as painting, without any canvas operations. */
export function measureTowerRig(art:TowerArt,node:string,x:number,y:number,pose:TowerPose|null,flying:ReadonlySet<number>=new Set()):Rect{return drawTowerRig(null,art,node,x,y,pose,flying);}
