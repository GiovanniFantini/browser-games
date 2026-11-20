import data from "../../docs/dati-nemici.json";
import type { BossView } from "./boss";
import type { Point,Rect,CameraTransform } from "../field/geometry";
import { project } from "../field/geometry";
import type { TowerController } from "../towers/controller";
const definition=data.enemies.find(enemy=>enemy.id==="custode")!;
export function drawBossGround(c:CanvasRenderingContext2D,boss:BossView,origin:Point|null,scale:number,time:number):void{
  const ring=(point:Point,radius:number,color:string,dashed:boolean):void=>{
    c.save();if(dashed)c.setLineDash([7/scale,5/scale]);c.beginPath();c.arc(point.x,point.y,radius,0,Math.PI*2);
    c.strokeStyle="#071e25";c.lineWidth=4/scale;c.stroke();c.strokeStyle=color;c.lineWidth=1.5/scale;c.stroke();c.restore();
  };
  if(origin&&boss.status==="active"&&boss.phase===2&&boss.roar.phase!=="waiting")ring(origin,definition.roar!.radius,"#a9ebd7",boss.roar.phase==="warning");
  if(boss.tail){ring(boss.tail.center,definition.tail!.radius,"#e7c4ff",true);for(const target of boss.tail.targets)ring(target,40,"#e7c4ff",false);}
  if(boss.impulse){c.save();c.globalAlpha*=Math.max(0,1-(time-boss.impulse.impactAt)/.25);ring(boss.impulse.center,definition.tail!.radius,"#e7c4ff",false);c.restore();}
}
export function drawBossBadges(c:CanvasRenderingContext2D,boss:BossView|null,controller:TowerController|null,positions:readonly(Point&{readonly uid:string})[],camera:CameraTransform):readonly Rect[]{
  const bodies:Rect[]=[];
  function badge(point:Point,text:string,clock:boolean):void{
    const p=project(point,camera);c.save();c.font="600 14px system-ui";c.textAlign="center";
    const width=c.measureText(text).width+(clock?26:14),box={x:p.x-width/2,y:p.y-25,width,height:22};
    c.beginPath();c.roundRect(box.x,box.y,box.width,box.height,4);c.fillStyle="#07303a";c.fill();c.strokeStyle="#e7c4ff";c.lineWidth=1.5;c.stroke();c.fillStyle="#f8ebc9";
    if(clock){const x=box.x+9,y=box.y+11;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x,y-3);c.lineTo(x,y);c.lineTo(x+3,y);c.stroke();}
    c.fillText(text,p.x+(clock?7:0),box.y+16);c.restore();bodies.push(box);
  }
  boss?.tail?.targets.forEach(target=>badge(target,target.order+" !",false));
  for(const position of positions){const remaining=controller?.disabledRemaining(position.uid)??0;
    if(remaining>0)badge(position,(Math.ceil(remaining*10)/10).toLocaleString("it-IT",{minimumFractionDigits:1,maximumFractionDigits:1})+" s",true);
  }
  return bodies;
}
