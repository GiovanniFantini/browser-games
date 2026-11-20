import { baseTowers, familyHeight } from "./catalog";
import type { Family, FieldMap } from "./catalog";
import { fieldCamera, fitCamera, project, overlaps, intersectsSegment, containsPoint } from "./geometry";
import type { CameraTransform, Point, Rect } from "./geometry";
import { placeCaptions } from "./labels";
import type { Caption, PlacedCaption } from "./labels";
import { tokenMetrics } from "./token-metrics";
import type { MovementMarker } from "../movement/preview";
import type { CombatVisual } from "../combat/preview";
import type { FieldTower } from "../economy/preview";
import type { WaveMarker } from "../waves/preview";
import type { TowerArt } from "../towers/art";
import type { TowerController } from "../towers/controller";
import { drawTowerRig, measureTowerRig } from "../towers/art";
import { drawAreas, drawReleased, flyingAllies } from "../towers/drawing";
import { drawEnemyRig } from "../enemies/art";
import type { EnemyArt } from "../enemies/art";
import { inWater } from "../enemies/terrain";
import type { BossView } from "../enemies/boss";
import { drawBossGround,drawBossBadges } from "../enemies/boss-drawing";
import { prefersReducedMotion } from "../motion-preference";
import { TowerOcclusion } from "../towers/occlusion";
import type { SessionPhase } from "../waves/types";
import { routeCoverage } from "./coverage";
import type { Coverage } from "./coverage";

export interface FieldRenderState {
  readonly map: FieldMap;
  readonly background: HTMLImageElement;
  readonly tokens: Readonly<Record<Family, HTMLImageElement>>;
  readonly selectedSlot: string | null;
  readonly family: Family | null;
  readonly showRoutes: boolean;
  readonly movement?: readonly MovementMarker[];
  readonly combat?: CombatVisual;
  readonly rangeOverride?: number;
  readonly towers?: readonly FieldTower[];
  readonly waveMarkers?: readonly WaveMarker[];
  readonly towerArt?: TowerArt;
  readonly towerController?: TowerController;
  readonly enemyArt?: EnemyArt;
  readonly boss?: BossView;
  readonly coverageRoute?: string|null;
  readonly wavePhase?:SessionPhase|null;
}
export interface FieldDrawing {
  readonly camera: CameraTransform;
  readonly captions: readonly PlacedCaption[];
  readonly bodies: readonly Rect[];
}
export class FieldRenderer {
  private readonly context: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private ratioX = 1;
  private ratioY = 1;
  private captionKey="";
  private captionLayout:readonly PlacedCaption[]=[];
  private coverageKey="";
  private coverage:readonly {coverage:Coverage;dashed:boolean}[]=[];
  private readonly occlusion=new TowerOcclusion();
  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Questo browser non riesce a disegnare il campo.");
    this.context = context;
  }
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    const density = Math.min(devicePixelRatio || 1, 2);
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";
    const pixelsWide=Math.max(1,Math.round(width*density)),pixelsHigh=Math.max(1,Math.round(height*density));
    if(this.canvas.width!==pixelsWide)this.canvas.width=pixelsWide;
    if(this.canvas.height!==pixelsHigh)this.canvas.height=pixelsHigh;
    this.ratioX = this.canvas.width / width;
    this.ratioY = this.canvas.height / height;
  }
  draw(state: FieldRenderState): FieldDrawing {
    const c = this.context,
      camera = fitCamera(this.width, this.height);
    c.setTransform(this.ratioX, 0, 0, this.ratioY, 0, 0);
    c.fillStyle = "#0b3038";
    c.fillRect(0, 0, this.width, this.height);
    c.setTransform(
      this.ratioX * camera.scale,
      0,
      0,
      this.ratioY * camera.scale,
      this.ratioX * camera.offsetX,
      this.ratioY * camera.offsetY,
    );
    c.strokeStyle = "#537c78";
    c.lineWidth = 1 / camera.scale;
    c.strokeRect(
      fieldCamera.x + 12,
      fieldCamera.y + 12,
      fieldCamera.width - 24,
      fieldCamera.height - 24,
    );
    c.drawImage(state.background, 0, 0, 1536, 1024);
    if (state.showRoutes)
      for (const route of state.map.routes) {
        c.setLineDash(route.traceDash || route.shortcut
          ? [8 / camera.scale, 5 / camera.scale] : []);
        c.beginPath();
        route.points.forEach((p, i) =>
          i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y),
        );
        c.strokeStyle = "#071e25";
        c.lineWidth = 5 / camera.scale;
        c.stroke();
        c.strokeStyle = "#f8ebc9";
        c.lineWidth = 2 / camera.scale;
        c.stroke();
        c.setLineDash([]);
      }
    if(state.combat)drawAreas(c,state.combat.areas,camera.scale);
    const selected = state.map.slots.find((s) => s.id === state.selectedSlot),
      bodies: Rect[] = [];
    if (selected && state.family) {
      c.beginPath();
      c.arc(
        selected.x,
        selected.y,
        state.rangeOverride ?? baseTowers[state.family].range,
        0,
        Math.PI * 2,
      );
      c.fillStyle = "#a9ebd712";
      c.fill();
      c.strokeStyle = "#071e25";
      c.lineWidth = 5 / camera.scale;
      c.stroke();
      c.strokeStyle = "#a9ebd7";
      c.lineWidth = 2 / camera.scale;
      c.stroke();
      if(state.showRoutes&&state.map.routes.length>1){
        const range=state.rangeOverride??baseTowers[state.family].range,key=state.map.id+":"+selected.id+":"+range+":"+(state.coverageRoute??"all");
        if(key!==this.coverageKey){this.coverage=state.map.routes.filter(route=>!state.coverageRoute||route.id===state.coverageRoute).map(route=>({coverage:routeCoverage(route.points,selected,range),dashed:route.traceDash||route.shortcut}));this.coverageKey=key;}
        for(const item of this.coverage){
          c.setLineDash(item.dashed?[8/camera.scale,5/camera.scale]:[]);c.beginPath();
          for(const path of item.coverage.paths)path.forEach((p,i)=>i===0?c.moveTo(p.x,p.y):c.lineTo(p.x,p.y));
          c.strokeStyle="#071e25";c.lineWidth=8/camera.scale;c.stroke();c.strokeStyle="#ffe8a3";c.lineWidth=4/camera.scale;c.stroke();c.setLineDash([]);
          for(const path of item.coverage.paths)for(const [p,q]of [[path[0]!,path[1]!],[path.at(-1)!,path.at(-2)!]]){
            const dx=q!.x-p!.x,dy=q!.y-p!.y,d=Math.hypot(dx,dy);if(d<1e-8)continue;const nx=-dy/d*5/camera.scale,ny=dx/d*5/camera.scale;
            c.beginPath();c.moveTo(p!.x-nx,p!.y-ny);c.lineTo(p!.x+nx,p!.y+ny);c.strokeStyle="#071e25";c.lineWidth=2/camera.scale;c.stroke();
          }
        }
      }
    }
    const instances=(state.towers ?? []).flatMap(tower=>{
      const slot=state.map.slots.find(candidate=>candidate.id===tower.slot);
      return slot?[{slot,family:tower.family,opacity:1,node:tower.node,uid:tower.uid}]:[];
    });
    if(selected&&state.family&&!state.towers?.some(tower=>tower.slot===selected.id))
      instances.push({slot:selected,family:state.family,opacity:state.towerArt?0.5:0.9,node:state.family+"-base",uid:""});
    this.occlusion.retain(new Set(instances.map(tower=>tower.uid).filter(Boolean)));
    const settled=state.wavePhase!=="active"&&state.wavePhase!=="paused";
    const enemyBounds=new Map<string,Rect>(),liveEnemyBounds:Rect[]=[],leaderBodies:Rect[]=[];
    const actors=[...instances.map(tower=>({tower,enemy:null,y:tower.slot.y,key:tower.slot.id})),
      ...(state.enemyArt?state.waveMarkers??[]:[]).filter(enemy=>enemy.kind!=="custode"||Boolean(state.enemyArt?.["boss-body"])).map(enemy=>({tower:null,enemy,y:enemy.y,key:enemy.id}))]
      .sort((a,b)=>a.y-b.y||a.key.localeCompare(b.key));
    // Sound areas sit on the ground, independent of body depth and facing.
    for(const enemy of state.waveMarkers??[]){
      if(enemy.kind!=="richiamo"||enemy.song.phase==="waiting")continue;
      c.save();c.beginPath();c.arc(enemy.x,enemy.y,140,0,Math.PI*2);
      if(enemy.song.phase==="warning")c.setLineDash([7/camera.scale,5/camera.scale]);
      c.strokeStyle="#071e25";c.lineWidth=4/camera.scale;c.stroke();c.strokeStyle="#ffe8a3";c.lineWidth=1.5/camera.scale;c.stroke();c.restore();
    }
    if(state.boss)drawBossGround(c,state.boss,state.waveMarkers?.find(enemy=>enemy.id===state.boss!.id)??null,camera.scale,state.boss.time);
    for(const entry of actors){
      if(entry.enemy&&state.enemyArt){
        const enemy=entry.enemy;c.save();c.globalAlpha*=enemy.opacity??1;
        const rect=drawEnemyRig(c,state.enemyArt,enemy.kind,enemy.path,enemy.distance,enemy.kind==="custode"?state.boss??null:null),point=project(rect,camera);
        if(inWater(enemy.kind,enemy.path.id,enemy.distance,state.map.waterSegment)){
          const water=state.map.waterSegment!;c.save();
          c.globalAlpha*=Math.max(0,Math.min(1,(enemy.distance-water.from)/20,(water.to-enemy.distance)/20));
          c.beginPath();c.ellipse(enemy.x,enemy.y-4,50,7,0,0,Math.PI*2);c.fillStyle="#82d9e65c";c.fill();
          c.strokeStyle="#a9ebd7";c.lineWidth=1/camera.scale;c.stroke();
          if(!prefersReducedMotion()){
            for(const dx of [-26,27]){c.beginPath();c.arc(enemy.x+dx,enemy.y-5,5,Math.PI,Math.PI*2);c.stroke();}
          }
          c.restore();
        }
        if(enemy.outline){c.beginPath();c.arc(enemy.x,enemy.y-10,15/camera.scale,.15,Math.PI*1.6);c.strokeStyle="#a9ebd7";c.lineWidth=2/camera.scale;c.stroke();}
        c.restore();
        const screen={x:point.x,y:point.y,width:rect.width*camera.scale,height:rect.height*camera.scale};
        enemyBounds.set(enemy.id,screen);if(!enemy.departing)liveEnemyBounds.push(screen);bodies.push(screen);continue;
      }
      const instance=entry.tower;if(!instance)continue;
      if(state.towerArt){
        const pose=state.towerController?.pose(instance.uid)??null,flying=state.towerController?flyingAllies(state.towerController,instance.uid):new Set<number>();
        const rect=measureTowerRig(state.towerArt,instance.node,instance.slot.x,instance.slot.y,pose,flying),topLeft=project(rect,camera);
        const screen={x:topLeft.x,y:topLeft.y,width:rect.width*camera.scale,height:rect.height*camera.scale};
        // Only already drawn, living enemies are behind this tower in the depth order.
        const alpha=this.occlusion.opacity(instance.uid,screen,liveEnemyBounds,
          state.towerController?.engine.time??0,instance.slot.id===state.selectedSlot,prefersReducedMotion(),settled);
        c.save();c.globalAlpha=instance.opacity*alpha;
        drawTowerRig(c,state.towerArt,instance.node,instance.slot.x,instance.slot.y,pose,flying);
        c.restore();bodies.push(screen);leaderBodies.push(screen);continue;
      }
      const metric = tokenMetrics[instance.family],
        scale = familyHeight[instance.family] / metric.groundToOpaqueTop;
      const rect = {
        x: instance.slot.x - metric.pivotX * scale,
        y: instance.slot.y - metric.pivotY * scale,
        width: metric.width * scale,
        height: metric.height * scale,
      };
      c.save();
      c.globalAlpha = instance.opacity;
      c.drawImage(
        state.tokens[instance.family],
        rect.x,
        rect.y,
        rect.width,
        rect.height,
      );
      c.restore();
      const topLeft = project(rect, camera);
      const screen={x:topLeft.x,y:topLeft.y,width:rect.width*camera.scale,height:rect.height*camera.scale};
      bodies.push(screen);leaderBodies.push(screen);
    }
    // Functional boundaries and selection always come after the illustrated body.
    if (selected && state.family) {
      c.beginPath();
      c.arc(
        selected.x,
        selected.y,
        state.rangeOverride ?? baseTowers[state.family].range,
        0,
        Math.PI * 2,
      );
      c.strokeStyle = "#071e25";
      c.lineWidth = 4 / camera.scale;
      c.stroke();
      c.strokeStyle = "#a9ebd7";
      c.lineWidth = 1.5 / camera.scale;
      c.stroke();
    }
    for (const slot of state.map.slots) {
      this.ring(
        slot,
        slot.id === state.selectedSlot ? 45 : 34,
        camera,
        slot.id === state.selectedSlot || state.towers?.some(tower=>tower.slot===slot.id) ? "#f4b32f" : "#a9ebd7",
      );
    }
    const firstRoute = state.map.routes[0],
      portal = firstRoute?.points.at(-1);
    const captions: Caption[] = [];
    if (portal) {
      this.ring(portal,38,camera,state.wavePhase==="won"?"#f4b32f":"#a9ebd7");
      // The fragment belongs to the single portal; it is never a second objective.
      const fragment={x:portal.x,y:portal.y+27},size=13;
      c.save();c.fillStyle=state.wavePhase==="won"?"#f4b32f":"#a9ebd7";c.strokeStyle="#071e25";c.lineWidth=2/camera.scale;c.beginPath();c.moveTo(fragment.x,fragment.y-size);c.lineTo(fragment.x+size*.65,fragment.y);c.lineTo(fragment.x,fragment.y+size);c.lineTo(fragment.x-size*.65,fragment.y);c.closePath();c.fill();c.stroke();c.restore();
      captions.push({
        id: "portal",
        text: state.wavePhase==="won"?"Portale stabile":"Portale",
        anchor: project(portal, camera),
        offset: state.map.portalLabelOffset,
      });
    }
    for (const entry of state.map.entries)
      captions.push({
        id: "entry-" + entry.id,
        text: entry.id + " · Ingresso",
        anchor: project(entry, camera),
        offset: { x: -20, y: 34 },
      });
    if(state.showRoutes)for(const landmark of state.map.landmarks??[]){
      this.ring(landmark,17,camera,"#ffe8a3");captions.push({id:"landmark-"+landmark.id,text:landmark.id,anchor:project(landmark,camera),offset:{x:0,y:24}});
    }
    for (const slot of [...state.map.slots].sort(
      (a, b) =>
        Number(b.id === state.selectedSlot) -
          Number(a.id === state.selectedSlot) || a.id.localeCompare(b.id),
    )) {
      captions.push({
        id: "slot-" + slot.id,
        text: slot.id+(state.towers?.some(tower=>tower.slot===slot.id)?" ●":""),
        anchor: project(slot, camera),
        offset: { x: 0, y: 22 },
      });
    }
    if(state.towerArt&&state.towerController){
      for(const rect of drawReleased(c,state.towerArt,state.towerController,camera.scale)){
        const point=project(rect,camera);bodies.push({x:point.x,y:point.y,width:rect.width*camera.scale,height:rect.height*camera.scale});
      }
      drawAreas(c,state.towerController.engine.areas,camera.scale,true);
    }
    c.setTransform(this.ratioX, 0, 0, this.ratioY, 0, 0);
    for(const enemy of state.waveMarkers??[]){
      if(enemy.departing)continue;
      const point=project(enemy,camera),radius=enemy.kind==="custode"?10:enemy.kind==="branco"?3:5;
      const body=enemyBounds.get(enemy.id);
      if(!body){
      c.save();c.translate(point.x,point.y);c.rotate(enemy.heading);
      c.beginPath();c.moveTo(radius+3,0);c.lineTo(-radius,-radius);c.lineTo(-radius,radius);c.closePath();
      c.fillStyle=enemy.kind==="custode"?"#f4b32f":enemy.kind==="guado"?"#a9ebd7":"#f8ebc9";
      c.strokeStyle="#071e25";c.lineWidth=2;c.stroke();c.fill();c.restore();
      }
      const width=enemy.kind==="custode"?36:enemy.kind==="branco"?14:24,top=body?body.y-7:point.y-radius-6;
      if(enemy.kind!=="branco"||enemy.charge<enemy.maximum){
        c.fillStyle="#071e25";c.fillRect(point.x-width/2-1,top-1,width+2,5);
        c.fillStyle="#a9ebd7";c.fillRect(point.x-width/2,top,width*enemy.charge/enemy.maximum,3);
        bodies.push({x:point.x-width/2-1,y:top-1,width:width+2,height:5});
      }
      if(inWater(enemy.kind,enemy.path.id,enemy.distance,state.map.waterSegment)){
        c.font="bold 14px system-ui";c.textAlign="left";c.strokeStyle="#071e25";c.lineWidth=3;c.strokeText("≈",point.x+width/2+3,top+5);c.fillStyle="#a9ebd7";c.fillText("≈",point.x+width/2+3,top+5);
        bodies.push({x:point.x+width/2+1,y:top-10,width:17,height:17});
      }
      if(enemy.kind==="richiamo"){
        c.font="bold 14px system-ui";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#071e25";c.fillStyle="#ffe8a3";
        const symbol=enemy.song.phase==="waiting"?"S":enemy.song.phase==="warning"?"S !":"S )))";
        c.strokeText(symbol,point.x,top-5);c.fillText(symbol,point.x,top-5);
        const labelWidth=c.measureText(symbol).width+6;bodies.push({x:point.x-labelWidth/2,y:top-22,width:labelWidth,height:20});
      }
      if(enemy.kind==="custode"&&state.boss){
        c.font="600 14px system-ui";c.textAlign="center";c.lineWidth=3;c.strokeStyle="#071e25";c.fillStyle="#a9ebd7";
        const symbol="F"+state.boss.phase+(state.boss.roar.phase==="warning"?" · R !":state.boss.roar.phase==="active"?" · R )))":"");
        c.strokeText(symbol,point.x,top-5);c.fillText(symbol,point.x,top-5);const labelWidth=c.measureText(symbol).width+6;bodies.push({x:point.x-labelWidth/2,y:top-22,width:labelWidth,height:20});
      }
      if(enemy.accelerated){c.strokeStyle="#071e25";c.lineWidth=4;c.beginPath();for(const dx of [-3,3]){c.moveTo(point.x+dx-2,point.y+9);c.lineTo(point.x+dx+2,point.y+6);c.lineTo(point.x+dx-2,point.y+3);}c.stroke();c.strokeStyle="#ffe8a3";c.lineWidth=1.5;c.stroke();}
      if(enemy.rooted){c.strokeStyle="#ffc63d";c.lineWidth=2;c.strokeRect(point.x-6,point.y-6,12,12);}
      else if(enemy.slow>0){c.beginPath();c.moveTo(point.x-4,point.y+8);c.lineTo(point.x,point.y+5);c.lineTo(point.x+4,point.y+8);c.strokeStyle="#ffc63d";c.lineWidth=2;c.stroke();}
      if(enemy.spore>0){c.beginPath();c.moveTo(point.x,point.y-18);c.lineTo(point.x+3,point.y-14);c.lineTo(point.x,point.y-10);c.lineTo(point.x-3,point.y-14);c.closePath();c.fillStyle="#e7aaff";c.fill();c.strokeStyle="#071e25";c.lineWidth=1;c.stroke();}
    }
    const badges=drawBossBadges(c,state.boss??null,state.towerController??null,instances.map(instance=>({uid:instance.uid,x:instance.slot.x,y:instance.slot.y})),camera);
    bodies.push(...badges);leaderBodies.push(...badges);
    if (state.combat) {
      for (const enemy of state.combat.enemies) {
        const point=project(enemy.point,camera);
        c.beginPath();c.arc(point.x,point.y,4,0,Math.PI*2);
        c.fillStyle="#f8ebc9";c.fill();c.strokeStyle="#071e25";c.lineWidth=2;c.stroke();
        bodies.push({x:point.x-5,y:point.y-5,width:10,height:10});
        captions.push({id:"enemy-"+enemy.id,anchor:point,offset:{x:0,y:-38},
          text:"#"+enemy.id+" "+(enemy.charge>0&&enemy.charge<0.01 ? "<0,01" : enemy.charge.toLocaleString("it-IT",{maximumFractionDigits:2}))+"/"+enemy.maximum,
          meter:enemy.charge/enemy.maximum});
      }
      for (const projectile of state.combat.projectiles) {
        const point=project(projectile,camera);
        c.beginPath();c.arc(point.x,point.y,3,0,Math.PI*2);
        c.fillStyle="#f4b32f";c.fill();c.strokeStyle="#071e25";c.lineWidth=2;c.stroke();
      }
    }
    // Keep labels steady while actors pass. Re-route only if new geometry obstructs
    // a label, or fixed geometry obstructs a leader. Moving actors must not trap links.
    const captionKey=JSON.stringify([this.width,this.height,captions]);
    const reusable=captionKey===this.captionKey&&this.captionLayout.every(label=>
      !bodies.some(body=>overlaps(body,label,3))&&
      label.leaderPoints.slice(1).every((point,index)=>!leaderBodies.some(body=>
        !containsPoint(body,label.anchor)&&
        intersectsSegment(label.leaderPoints[index]!,point,body))));
    const placed=reusable?this.captionLayout:placeCaptions(c,captions,this.width,this.height,bodies,leaderBodies);
    this.captionKey=captionKey;this.captionLayout=placed;
    for (const p of placed) {
      if (!p.leader) continue;
      c.beginPath();
      c.moveTo(p.anchor.x, p.anchor.y);
      for(const point of p.leaderPoints.slice(1)) c.lineTo(point.x,point.y);
      c.strokeStyle = "#071e25";
      c.lineWidth = 3;
      c.stroke();
      c.strokeStyle = "#f8ebc9";
      c.lineWidth = 1;
      c.stroke();
    }
    for (const p of placed) {
      c.fillStyle =
        p.id === "slot-" + state.selectedSlot ? "#f4b32f" : "#07303a";
      c.beginPath();
      c.roundRect(p.x, p.y, p.width, p.height, 4);
      c.fill();
      c.fillStyle =
        p.id === "slot-" + state.selectedSlot ? "#071e25" : "#f8ebc9";
      c.font = "600 14px system-ui";
      c.textAlign = "center";
      c.fillText(p.text, p.center.x, p.center.y + (p.meter === undefined ? 5 : 0));
      if (p.meter !== undefined) {
        c.fillStyle="#071e25";c.fillRect(p.x+6,p.y+p.height-8,p.width-12,4);
        c.fillStyle="#a9ebd7";c.fillRect(p.x+6,p.y+p.height-8,(p.width-12)*Math.max(0,Math.min(1,p.meter)),4);
      }
    }
    this.drawMovement(state.movement ?? [], camera, placed);
    return { camera, captions: placed, bodies };
  }
  private drawMovement(markers: readonly MovementMarker[], camera: CameraTransform,
    captions: readonly PlacedCaption[]): void {
    const c = this.context;
    for (const marker of markers) {
      const p = project(marker, camera);
      c.save(); c.translate(p.x, p.y); c.rotate(marker.heading);
      c.beginPath();
      c.moveTo(10, 0); c.lineTo(-6, -6); c.lineTo(-3, 0); c.lineTo(-6, 6); c.closePath();
      c.fillStyle = marker.number === 1 ? "#f4b32f" : "#a9ebd7";
      c.strokeStyle = "#071e25"; c.lineWidth = 3;
      c.stroke(); c.fill(); c.restore();
    }
    const badges: Rect[] = [];
    for (const marker of markers) {
      const p = project(marker, camera), preferred = marker.number === 1 ? -1 : 1;
      const candidates = [18, -18, 36, -36, 54, -54].flatMap(x =>
        [18 * preferred, -18 * preferred, 0, 36 * preferred, -36 * preferred].map(y =>
          ({ x: p.x + x - 11, y: p.y + y - 11, width: 22, height: 22 })));
      const badge = candidates.find(r => r.x >= 0 && r.y >= 0 &&
        r.x + r.width <= this.width && r.y + r.height <= this.height &&
        ![...captions, ...badges].some(o => r.x < o.x + o.width && r.x + r.width > o.x &&
          r.y < o.y + o.height && r.y + r.height > o.y)) ?? candidates[0]!;
      badges.push(badge);
      const x = badge.x + 11, y = badge.y + 11;
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(x, y);
      c.strokeStyle = "#071e25"; c.lineWidth = 3; c.stroke();
      c.strokeStyle = "#f8ebc9"; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.arc(x, y, 11, 0, Math.PI * 2);
      c.fillStyle = marker.number === 1 ? "#f4b32f" : "#a9ebd7"; c.fill();
      c.strokeStyle = "#071e25"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#071e25"; c.font = "600 14px system-ui"; c.textAlign = "center";
      c.fillText(String(marker.number), x, y + 5);
    }
  }
  private ring(
    p: Point,
    radius: number,
    camera: CameraTransform,
    color: string,
  ): void {
    const c = this.context;
    c.beginPath();
    c.ellipse(p.x, p.y, radius, radius * 0.5, 0, 0, Math.PI * 2);
    c.strokeStyle = "#071e25";
    c.lineWidth = 5 / camera.scale;
    c.stroke();
    c.strokeStyle = color;
    c.lineWidth = 2 / camera.scale;
    c.stroke();
  }
}
