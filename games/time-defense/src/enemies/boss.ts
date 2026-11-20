import data from "../../docs/dati-nemici.json";
import type { CombatEngine } from "../combat/engine";
import type { CombatEnemy,CombatEvent } from "../combat/types";
import type { TowerController } from "../towers/controller";
import type { Point } from "../field/geometry";
import { travellerPose } from "../movement/traveller";

const definition=data.enemies.find(enemy=>enemy.id==="custode")!,roar=definition.roar!,tail=definition.tail!;
const prefix="ruggito:",epsilon=1e-9;
const clamp=(value:number):number=>Math.max(0,Math.min(1,value));
const ease=(value:number):number=>{const t=clamp(value);return t*t*(3-2*t);};
export type BossPhase=0|1|2|3;
export function bossPhase(charge:number):BossPhase{
  if(charge<=0)return 0;
  return definition.phases!.findIndex(phase=>charge>phase.aboveCharge&&(!("atMostCharge"in phase)||charge<=phase.atMostCharge!))+1 as BossPhase;
}
export interface TailTarget extends Point{readonly uid:string;readonly slot:string;readonly order:number;}
export interface TailCast {readonly center:Point;readonly targets:readonly TailTarget[];readonly startedAt:number;readonly impactAt:number;}
export interface BossVisual {readonly jawOpening:number;readonly tailAngle:number;}
export interface BossView extends BossVisual{
  readonly time:number;
  readonly id:string;readonly phase:BossPhase;readonly status:CombatEnemy["state"];readonly charge:number;readonly maximum:number;
  readonly roar:{readonly phase:"waiting"|"warning"|"active";readonly remaining:number};
  readonly tail:TailCast|null;readonly tailRemaining:number;readonly nextTail:number;
  readonly impulse:TailCast|null;
}
interface State{
  readonly id:string;phase:1|2|3;phaseAt:number;nextTail:number;tail:TailCast|null;
  lastTail:TailCast|null;lastRoarCycle:number;transitionJaw:number;deadPose:BossVisual|null;
}
export interface BossEvent{readonly type:"phase"|"roar-warning"|"tail-warning"|"tail-hit";readonly at:number;readonly message:string;}
export class BossController{
  readonly engine:CombatEngine;
  private readonly towers:TowerController|undefined;
  private readonly origins:ReadonlyMap<string,Point>;
  private readonly states=new Map<string,State>();
  private readonly observed=new WeakSet<CombatEvent>();
  private readonly coverage=new Map<string,{source:string;until:number}[]>();
  private readonly events:BossEvent[]=[];
  private actorSnapshot:readonly CombatEnemy[]=[];
  private bossActors:readonly CombatEnemy[]=[];
  constructor(engine:CombatEngine,towers?:TowerController,slots:readonly(Point&{readonly id:string})[]=[]){
    this.engine=engine;this.towers=towers;this.origins=new Map(slots.map(slot=>[slot.id,{x:slot.x,y:slot.y}]));
  }
  drainEvents():BossEvent[]{return this.events.splice(0);}
  private initial(enemy:CombatEnemy):State{return{id:enemy.id,phase:1,phaseAt:enemy.enteredAt,nextTail:Infinity,tail:null,lastTail:null,lastRoarCycle:-1,transitionJaw:0,deadPose:null};}
  private roarState(state:State,time:number):{phase:"waiting"|"warning"|"active";remaining:number;cycle:number;activeFrom:number;activeUntil:number}{
    const start=state.phaseAt+roar.firstDelay,age=time-start,cycle=Math.max(0,Math.floor((age+epsilon)/roar.period));
    const warningFrom=start+cycle*roar.period,activeFrom=warningFrom+roar.windup,activeUntil=activeFrom+roar.duration;
    if(time<warningFrom-epsilon)return{phase:"waiting",remaining:warningFrom-time,cycle,activeFrom,activeUntil};
    if(time<activeFrom-epsilon)return{phase:"warning",remaining:activeFrom-time,cycle,activeFrom,activeUntil};
    if(time<activeUntil-epsilon)return{phase:"active",remaining:activeUntil-time,cycle,activeFrom,activeUntil};
    return{phase:"waiting",remaining:warningFrom+roar.period-time,cycle,activeFrom,activeUntil};
  }
  private visual(state:State,time:number):BossVisual{
    if(state.deadPose)return state.deadPose;
    let jawOpening=0,tailAngle=0;
    if(state.phase===2){const r=this.roarState(state,time);
      jawOpening=r.phase==="warning"?ease(1-r.remaining/roar.windup):r.phase==="active"?1:time>=r.activeUntil?1-ease((time-r.activeUntil)/.2):0;
    }else if(state.phase===3)jawOpening=state.transitionJaw*(1-ease((time-state.phaseAt)/.2));
    if(state.tail)tailAngle=.18*ease((time-state.tail.startedAt)/tail.windup);
    else if(state.lastTail){const age=time-state.lastTail.impactAt;
      tailAngle=age<.15?.18-.5*ease(age/.15):-.32*(1-ease((age-.15)/.25));
    }
    return{jawOpening,tailAngle};
  }
  view(id?:string):BossView|null{
    const enemy=id?this.engine.enemy(id):this.engine.enemies.find(enemy=>enemy.definition.id===definition.id);
    if(!enemy||enemy.definition.id!==definition.id||enemy.enteredAt>this.engine.time+epsilon)return null;
    const state=this.states.get(enemy.id)??this.initial(enemy),time=this.engine.time;
    const pending=enemy.state==="active"?state.tail:null;
    const current=pending?Object.freeze({...pending,targets:Object.freeze(pending.targets.filter(target=>Boolean(this.towers?.source.byUid(target.uid))))}):null;
    return{time,id:enemy.id,status:enemy.state,phase:enemy.state==="active"?state.phase:0,charge:enemy.charge,maximum:enemy.definition.charge,
      roar:state.phase===2&&enemy.state==="active"?this.roarState(state,time):{phase:"waiting",remaining:0},
      tail:current,tailRemaining:current?Math.max(0,current.impactAt-time):0,nextTail:state.phase===3?Math.max(0,state.nextTail-time):0,
      impulse:state.lastTail&&time>=state.lastTail.impactAt&&time<state.lastTail.impactAt+.25?state.lastTail:null,
      ...this.visual(state,time)};
  }
  accelerated(enemy:CombatEnemy):boolean{
    return enemy.state==="active"&&(this.coverage.get(enemy.id)??[]).some(item=>item.until>this.engine.time+epsilon&&
      this.engine.enemy(item.source)?.state==="active"&&this.states.get(item.source)?.phase===2);
  }
  nextBoundary(from:number,until:number):number|null{
    const candidates:number[]=[];
    for(const state of this.states.values()){
      if(this.engine.enemy(state.id)?.state!=="active")continue;
      if(state.phase===3){candidates.push(state.nextTail);if(state.tail)candidates.push(state.tail.impactAt);}
      if(state.phase===2){const first=state.phaseAt+roar.firstDelay,k=Math.max(0,Math.floor((from-first)/roar.period));
        for(let i=Math.max(0,k-1);i<=k+1;i++){const start=first+i*roar.period;candidates.push(start,start+roar.windup,start+roar.windup+roar.duration);}
      }
    }
    const next=Math.min(...candidates.filter(at=>at>from+epsilon&&at<=until+epsilon));
    return Number.isFinite(next)?Math.min(next,until):null;
  }
  step(from:number,until:number):void{
    if(this.actorSnapshot!==this.engine.enemies){this.actorSnapshot=this.engine.enemies;this.bossActors=this.actorSnapshot.filter(enemy=>enemy.definition.id===definition.id);}
    if(!this.bossActors.length)return;
    this.coverage.clear();
    for(const enemy of this.engine.enemies)enemy.celerity=enemy.celerity.filter(effect=>!effect.source.startsWith(prefix));
    const fresh=this.engine.events.filter(event=>this.engine.enemy(event.enemy)?.definition.id===definition.id&&!this.observed.has(event));for(const event of fresh)this.observed.add(event);
    for(const enemy of this.bossActors){
      if(enemy.definition.id!==definition.id||enemy.enteredAt>until+epsilon)continue;
      let state=this.states.get(enemy.id);if(!state){state=this.initial(enemy);this.states.set(enemy.id,state);}
      if(enemy.state!=="active"){
        if(!state.deadPose){const at=fresh.find(event=>event.enemy===enemy.id&&event.type==="neutralized")?.at??until;state.deadPose=this.visual(state,at);}
        state.tail=null;continue;
      }
      const phase=bossPhase(enemy.charge);
      if(phase>state.phase){
        const at=fresh.find(event=>event.enemy===enemy.id&&event.type==="damage"&&event.chargeAfter!==undefined&&bossPhase(event.chargeAfter)>=phase)?.at??from;
        const jaw=this.visual(state,at).jawOpening;state.phase=phase as 2|3;state.phaseAt=at;
        state.transitionJaw=jaw;state.tail=null;state.lastTail=null;state.lastRoarCycle=-1;
        state.nextTail=phase===3?at+tail.firstDelay:Infinity;
        this.events.push({type:"phase",at,message:phase===2?"Custode: Fase 2. Ruggito temporale, velocità base 20.":"Custode: Fase 3. Velocità base 26. Il ruggito termina; arriva la coda temporale."});
      }
      enemy.traveller={...enemy.traveller,speed:definition.phases![state.phase-1]!.speed};
      if(state.phase===2)this.applyRoar(enemy,state,from,until);
      if(state.phase===3)this.applyTail(enemy,state,from,until);
    }
  }
  private applyRoar(source:CombatEnemy,state:State,from:number,until:number):void{
    const r=this.roarState(state,from),start=state.phaseAt+roar.firstDelay;
    if(from>=start-epsilon&&r.phase==="warning"&&r.cycle!==state.lastRoarCycle){
      state.lastRoarCycle=r.cycle;this.events.push({type:"roar-warning",at:start+r.cycle*roar.period,message:"Ruggito fra 1,5 s. Accelera Esploratore, Corridore e Branco entro 200 unità."});
    }
    const k=Math.max(0,Math.floor((from-start)/roar.period)),a=travellerPose(source.traveller);
    for(let i=k;i<=k+1;i++){
      const activeFrom=start+i*roar.period+roar.windup,activeUntil=activeFrom+roar.duration;
      const begin=Math.max(from,activeFrom),end=Math.min(until,activeUntil);
      if(end<begin-epsilon)continue;
      for(const target of this.engine.enemies){
        if(target.state!=="active"||target.enteredAt>until||!roar.affectedFamilies.includes(target.definition.id))continue;
        const b=travellerPose(target.traveller);if(Math.hypot(a.x-b.x,a.y-b.y)>roar.radius+epsilon)continue;
        if(end>Math.max(begin,target.enteredAt)+epsilon)target.celerity.push({source:prefix+source.id,node:"ruggito",strength:roar.speedMultiplier,from:Math.max(begin,target.enteredAt),until:end});
        if(until>=activeFrom-epsilon&&until<activeUntil-epsilon){const list=this.coverage.get(target.id)??[];list.push({source:source.id,until:activeUntil});this.coverage.set(target.id,list);}
      }
    }
  }
  private applyTail(enemy:CombatEnemy,state:State,from:number,until:number):void{
    if(state.tail&&state.tail.impactAt<=until+epsilon){
      const cast=state.tail;let applied=0;
      for(const target of cast.targets)if(this.towers?.source.byUid(target.uid)&&this.towers.disable(target.uid,tail.duration,cast.impactAt))applied++;
      state.lastTail=cast;state.tail=null;
      this.events.push({type:"tail-hit",at:cast.impactAt,message:applied?"Coda: "+applied+(applied===1?" difesa sospesa":" difese sospese")+" per 2,5 s. Gli attacchi già partiti continuano.":"Coda: nessuna difesa sospesa."});
    }
    if(state.nextTail>from+epsilon||state.tail)return;
    const at=state.nextTail,center=travellerPose(enemy.traveller);
    const candidates=(this.towers?.source.towers??[]).flatMap(tower=>{
      const origin=this.origins.get(tower.slot);if(!origin||this.towers!.isDisabled(tower.uid))return[];
      const distance=Math.hypot(center.x-origin.x,center.y-origin.y);
      return distance<=tail.radius+epsilon?[{uid:tower.uid,slot:tower.slot,...origin,distance}]:[];
    }).sort((a,b)=>a.distance-b.distance||(a.slot<b.slot?-1:a.slot>b.slot?1:0)).slice(0,tail.maxTargets);
    if(!candidates.length){state.nextTail=at+tail.emptyRetry;return;}
    const targets=Object.freeze(candidates.map(({uid,slot,x,y},index)=>Object.freeze({uid,slot,x,y,order:index+1})));
    state.tail=Object.freeze({center:Object.freeze({x:center.x,y:center.y}),targets,startedAt:at,impactAt:at+tail.windup});
    state.nextTail=at+tail.period;
    this.events.push({type:"tail-warning",at,message:"Coda fra 1,5 s sulle piazzole "+targets.map(target=>target.slot).join(", ")+". Bersagli fissati, massimo due difese."});
  }
}
