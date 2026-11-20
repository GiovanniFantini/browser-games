import data from "../../docs/dati-nemici.json";
import type { CombatEnemy } from "../combat/types";
import type { CombatEngine } from "../combat/engine";
import { travellerPose } from "../movement/traveller";
import tuning from "../../docs/dati-cicli-nemici.json";
import type { CombatEvent } from "../combat/types";
import { BossController } from "./boss";
import type { TowerController } from "../towers/controller";
import type { Point } from "../field/geometry";

const canto=data.enemies.find(enemy=>enemy.id==="richiamo")!;
const first=canto.firstCastDelay!, warning=canto.windup!, duration=canto.activeDuration!, period=canto.castPeriod!;
const prefix="canto:";
export interface SongState { readonly phase:"waiting"|"warning"|"active"; readonly remaining:number; }
export function songState(enemy:CombatEnemy,time:number):SongState{
  const age=time-enemy.enteredAt-first;
  if(enemy.state!=="active"||enemy.definition.id!=="richiamo"||age<0)return{phase:"waiting",remaining:Math.max(0,-age)};
  const cycle=age%period;
  if(cycle<warning-1e-9)return{phase:"warning",remaining:warning-cycle};
  if(cycle<warning+duration-1e-9)return{phase:"active",remaining:warning+duration-cycle};
  return{phase:"waiting",remaining:period-cycle};
}
export class EnemyController{
  readonly engine:CombatEngine;
  readonly boss:BossController;
  private readonly coverage=new Map<string,{source:string;until:number}[]>();
  private readonly departures=new Map<string,{enemy:CombatEnemy;at:number}>();
  constructor(engine:CombatEngine,towers?:TowerController,slots:readonly(Point&{readonly id:string})[]=[]){
    this.engine=engine;this.boss=new BossController(engine,towers,slots);
    engine.setEnemyStep((_,from,until)=>this.step(from,until));engine.setEnemyBoundary((from,until)=>this.boss.nextBoundary(from,until));
  }
  private eligible(enemy:CombatEnemy):boolean{return enemy.state==="active"&&canto.affectedFamilies!.includes(enemy.definition.id);}
  private near(source:CombatEnemy,target:CombatEnemy):boolean{
    const a=travellerPose(source.traveller),b=travellerPose(target.traveller);
    return Math.hypot(a.x-b.x,a.y-b.y)<=canto.radius!+1e-9;
  }
  accelerated(enemy:CombatEnemy):boolean{
    return enemy.state==="active"&&((this.coverage.get(enemy.id)??[]).some(item=>item.until>this.engine.time+1e-9&&this.engine.enemy(item.source)?.state==="active")||this.boss.accelerated(enemy));
  }
  observeEvents(events:readonly CombatEvent[]):void{
    for(const event of events)if(event.type==="neutralized"){
      const enemy=this.engine.enemy(event.enemy);
      if(enemy)this.departures.set(enemy.id,{enemy,at:event.at});
    }
    for(const [id,departure]of this.departures)if(this.engine.time>=departure.at+tuning.neutralFade-1e-9)this.departures.delete(id);
  }
  clearDepartures():void{this.departures.clear();}
  get departing():readonly CombatEnemy[]{return [...this.departures.values()].filter(item=>this.engine.time<item.at+tuning.neutralFade-1e-9).map(item=>item.enemy);}
  opacity(id:string):number{const departure=this.departures.get(id);return departure?Math.max(0,1-(this.engine.time-departure.at)/tuning.neutralFade):1;}
  outline(id:string):boolean{const departure=this.departures.get(id);return Boolean(departure&&this.engine.time<departure.at+tuning.neutralOutline);}
  private step(from:number,until:number):void{
    this.coverage.clear();
    // Recompute membership at the beginning of every fixed movement substep.
    // Only this controller's category is replaced; future boss sources remain independent.
    for(const enemy of this.engine.enemies)enemy.celerity=enemy.celerity.filter(effect=>!effect.source.startsWith(prefix));
    for(const source of this.engine.enemies){
      if(source.state!=="active"||source.definition.id!=="richiamo"||source.enteredAt>until)continue;
      const start=source.enteredAt+first;
      const cycle=Math.max(0,Math.floor((from-start)/period));
      for(let index=cycle;index<=cycle+1;index++){
        const activeFrom=start+index*period+warning,activeUntil=activeFrom+duration;
        const begin=Math.max(from,activeFrom),end=Math.min(until,activeUntil);
        if(end<begin-1e-10)continue;
        for(const target of this.engine.enemies){
          if(!this.eligible(target)||target.enteredAt>until||!this.near(source,target))continue;
          if(end>Math.max(begin,target.enteredAt)+1e-10)target.celerity.push({source:prefix+source.id,node:"canto",strength:canto.speedMultiplier!,from:Math.max(begin,target.enteredAt),until:end});
          if(until>=activeFrom-1e-9&&until<activeUntil-1e-9){const list=this.coverage.get(target.id)??[];list.push({source:source.id,until:activeUntil});this.coverage.set(target.id,list);}
        }
      }
    }
    this.boss.step(from,until);
  }
}
