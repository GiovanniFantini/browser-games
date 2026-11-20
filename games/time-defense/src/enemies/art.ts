import metadata from "../../art-source/runtime38/parts.json";
import atlas from "../../art-source/runtime38/boss-atlas.json";
import bossAtlasUrl from "../../art-source/runtime38/boss-parts-v2.png?url";
import type { BossVisual } from "./boss";
import type { FieldImages } from "../field/images";
import type { DistancePath } from "../movement/path";
import type { Point,Rect } from "../field/geometry";
import { enemyRig } from "./rig";
const urls={...import.meta.glob<string>("../../art-source/animations-v3/parts/{esploratore,corridore,corazzato,branco,richiamo,guado}-*.png",{eager:true,query:"?url",import:"default"}),
  ...import.meta.glob<string>("../../art-source/animations-v3/parts/boss-{tail,hind-upper,hind-lower,far-upper,far-lower}.png",{eager:true,query:"?url",import:"default"})};
export type EnemyArt=Readonly<Record<string,HTMLImageElement>>;
const shadedCache=new WeakMap<FieldImages,Map<string,Promise<HTMLImageElement>>>();
async function shadedPart(images:FieldImages,url:string,outline=false):Promise<HTMLImageElement>{
  let cache=shadedCache.get(images);if(!cache){cache=new Map();shadedCache.set(images,cache);}
  const key=url+(outline?":outline":"");
  const existing=cache.get(key);if(existing)return existing;
  const promise=(async()=>{
    const source=await images.load(url),canvas=document.createElement("canvas");canvas.width=source.width;canvas.height=source.height;
    const c=canvas.getContext("2d");if(!c)throw new Error("Impossibile preparare le parti del nemico.");
    // Same fixed shade as the approved rig, rasterized once at source resolution.
    // No per-frame filters, bitmap files, downloads or texture stretching.
    c.filter=outline?"none":"brightness(0.78)";c.drawImage(source,0,0);
    if(outline){
      // Darken the existing inner alpha edge, without growing or reshaping it.
      const pixels=c.getImageData(0,0,canvas.width,canvas.height),original=new Uint8ClampedArray(pixels.data),w=canvas.width,h=canvas.height;
      const alpha=(x:number,y:number):number=>x<0||y<0||x>=w||y>=h?0:original[(y*w+x)*4+3]!;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=(y*w+x)*4;if(original[i+3]!<128)continue;
        if([[6,0],[-6,0],[0,6],[0,-6],[4,4],[-4,4],[4,-4],[-4,-4]].some(([dx,dy])=>alpha(x+dx!,y+dy!)<128))
          for(let channel=0;channel<3;channel++)pixels.data[i+channel]=Math.round(original[i+channel]!*.25+[7,30,37][channel]!*.75);
      }
      c.putImageData(pixels,0,0);
    }
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Impossibile preparare le ombre.")),"image/png"));
    const objectUrl=URL.createObjectURL(blob);
    try{return await new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("Impossibile leggere le parti ombreggiate."));image.src=objectUrl;});}
    finally{URL.revokeObjectURL(objectUrl);}
  })();
  cache.set(key,promise);void promise.catch(()=>cache!.delete(key));return promise;
}
export async function loadEnemyArt(images:FieldImages,kinds:readonly string[]):Promise<EnemyArt>{
  const selected=Object.entries(urls).filter(([url])=>kinds.some(kind=>url.split("/").at(-1)!.startsWith((kind==="custode"?"boss":kind)+"-")));
  const entries=await Promise.all(selected.map(async([url,asset])=>{
    const name=url.split("/").at(-1)!.slice(0,-4),original=await images.load(asset);
    const needsShade=name.includes("-far-")||(!["corridore-","branco-","boss-"].some(prefix=>name.startsWith(prefix))&&/(upper|lower)$/.test(name));
    return[[name,name==="esploratore-body"?await shadedPart(images,asset,true):original],...(needsShade?[[name+":shade",await shadedPart(images,asset)]]:[])] as [string,HTMLImageElement][];
  }));
  if(kinds.includes("custode")){const image=await images.load(bossAtlasUrl);entries.push([["boss-body",image],["boss-jaw",image]]);}
  return Object.fromEntries(entries.flat());
}
type PartMeta={width:number;height:number;root?:number[];end?:number[]};
const parts:Readonly<Record<string,PartMeta>>=metadata.parts;
export function drawEnemyRig(c:CanvasRenderingContext2D,art:EnemyArt,kind:string,path:DistancePath,distance:number,visual:BossVisual|null=null):Rect{
  const pose=enemyRig(kind,path,distance),{actor,position,facing,step,bob}=pose,S=actor.size,r=actor.rig??{},quad=actor.quad,sprite=actor.name;
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  let farShade=false;
  function draw(name:string,point:Point,width:number,pivot:Point,angle=0,clip?:readonly number[]):void{
    const image=art[farShade?name+":shade":name];if(!image)throw new Error("Missing enemy image: "+name);
    const frame=name==="boss-body"?atlas.body:name==="boss-jaw"?atlas.jaw:{x:0,y:0,width:image.width,height:image.height};
    const height=width*frame.height/frame.width,left=-pivot.x*width,top=-pivot.y*height,co=Math.cos(angle),si=Math.sin(angle);
    for(const [x,y]of [[left,top],[left+width,top],[left,top+height],[left+width,top+height]]){
      const p=pose.world({x:point.x+x!*co-y!*si,y:point.y+x!*si+y!*co});
      minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
    }
    c.save();c.translate(point.x,point.y);c.rotate(angle);
    if(clip){c.beginPath();c.rect(left+clip[0]!*width,top+clip[1]!*height,clip[2]!*width,clip[3]!*height);c.clip();}
    c.drawImage(image,frame.x,frame.y,frame.width,frame.height,left,top,width,height);c.restore();
  }
  function bone(name:string,a:Point,b:Point,length:number,clip?:readonly number[]):void{
    const m=parts[name]!,root=m.root!,end=m.end!,dx=(end[0]!-root[0]!)*m.width,dy=(end[1]!-root[1]!)*m.height;
    draw(name,a,m.width*length/Math.hypot(dx,dy),{x:root[0]!,y:root[1]!},Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(dy,dx),clip);
  }
  c.save();c.translate(position.x,position.y);c.scale(facing,1);
  c.fillStyle="#071e2530";c.beginPath();c.ellipse(0,0,S*(quad?.37:.31),S*.08,0,0,Math.PI*2);c.fill();
  const drawLeg=(leg:typeof pose.legs[number]):void=>{
    const part=leg.far&&!quad?"far":leg.front?"front":"hind",upper=sprite+"-"+part+"-upper",lower=sprite+"-"+part+"-lower",m=parts[lower]!;
    c.save();farShade=leg.far;
    bone(lower,leg.knee,leg.foot,leg.lower,[0,0,1,.71]);bone(upper,leg.hip,leg.knee,leg.upper);
    const reference=Math.hypot((m.end![0]!-m.root![0]!)*m.width,(m.end![1]!-m.root![1]!)*m.height);
    const swing=leg.stance?0:Math.sin(Math.PI*(leg.phase-actor.duty)/(1-actor.duty));
    draw(lower,leg.foot,m.width*leg.lower/reference,{x:m.end![0]!,y:m.end![1]!},-.18*swing,[0,.66,1,.34]);farShade=false;c.restore();
  };
  pose.legs.filter(leg=>leg.far).forEach(drawLeg);
  draw(sprite+"-tail",{x:(r.tailRootX??-(quad?.25:.19))*S,y:(r.tailRootY??-(quad?.40:.46))*S+bob},S*(r.tailWidth??(quad?.48:.62)),{x:.88,y:.48},Math.sin(step*Math.PI*2-.5)*(quad?.035:.06)+(visual?.tailAngle??0));
  pose.legs.filter(leg=>!leg.far).forEach(drawLeg);
  const bodyPoint={x:(quad?.015:.095)*S,y:(r.bodyY??(quad?-.43:-.53))*S+bob},bodyWidth=S*(r.bodyWidth??(quad?.78:.62)),bodyAngle=Math.sin(step*Math.PI*2)*.009;
  if(kind==="custode"){
    const bodyHeight=bodyWidth*atlas.body.height/atlas.body.width;
    const dx=(atlas.bodyJawSocket.x-.5)*bodyWidth,dy=(atlas.bodyJawSocket.y-.5)*bodyHeight;
    const hinge={x:bodyPoint.x+dx*Math.cos(bodyAngle)-dy*Math.sin(bodyAngle),y:bodyPoint.y+dx*Math.sin(bodyAngle)+dy*Math.cos(bodyAngle)};
    const jawWidth=bodyWidth*atlas.jaw.width/atlas.body.width*atlas.jawScale;
    const angle=bodyAngle+atlas.closedJawAngle+(atlas.openJawAngle-atlas.closedJawAngle)*(visual?.jawOpening??0);
    const length=jawWidth*(1-atlas.jawHinge.x);
    c.beginPath();c.moveTo(hinge.x,hinge.y);c.lineTo(hinge.x+length*Math.cos(bodyAngle),hinge.y+length*Math.sin(bodyAngle));
    c.lineTo(hinge.x+length*Math.cos(angle),hinge.y+length*Math.sin(angle));c.closePath();c.fillStyle="#401d26";c.fill();
    draw("boss-jaw",hinge,jawWidth,atlas.jawHinge,angle);
  }
  draw(sprite+"-body",bodyPoint,bodyWidth,{x:.5,y:.5},bodyAngle);
  c.restore();return{x:minX,y:minY,width:maxX-minX,height:maxY-minY};
}
