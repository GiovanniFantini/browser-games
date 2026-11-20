import signal from "../../docs/dati-segnali.json";
import tuning from "../../docs/dati-cicli-torri.json";
import { towerDefinition } from "../economy/model";
import type { BuiltTower } from "../economy/model";
import type { Point } from "../field/geometry";
import type { CombatEngine } from "../combat/engine";
import type { AttackSnapshot, CombatEvent } from "../combat/types";

interface TowerSource {
  readonly towers: readonly BuiltTower[];
  byUid(uid: string): BuiltTower | null;
}
interface Cycle {
  readonly attack: AttackSnapshot;
  readonly start: number;
  readonly preparation: number;
  readonly emitter: number;
  launched: number;
}
interface Emitter {
  readonly uid: string;
  node: string;
  localTime: number;
  nextStart: number;
  disabledUntil: number;
  sequence: number;
  cycle: Cycle | null;
  lastCycle: Cycle | null;
}
export interface TowerPose {
  readonly uid: string;
  readonly node: string;
  readonly preparation: number;
  readonly preparing: boolean;
  readonly prepared: boolean;
  readonly preparingTargets: number;
  readonly recovery: number;
  readonly emitter: number;
  readonly disabled: boolean;
  readonly disabledRemaining:number;
  readonly cooldownFraction: number;
}
export interface ReleasedVisual {
  readonly attack: AttackSnapshot;
  readonly target: string;
  readonly emitter: number;
  readonly ally: number;
  readonly mountNode: string;
  readonly launchedAt: number;
  readonly impactAt: number;
  readonly returnAt: number;
  readonly number: number;
  sourceLostAt: number|null;
  outcome: "pending"|"hit"|"miss";
}
const epsilon = 1e-9;
const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const preparationFor = (node: string): number => node.startsWith("roccia-") ? signal.timing.rocciaWindup :
  node.startsWith("nido-") ? signal.timing.nidoPreparation : node.startsWith("spore-") ? signal.timing.sporePreparation : signal.timing.resinaPreparation;

// Local emitter clocks freeze independently of released effects and flying allies.
export class TowerController {
  private emitters = new Map<string, Emitter>();
  private released: ReleasedVisual[] = [];
  private origins: ReadonlyMap<string, Point>;
  private visualSerial = 0;
  readonly engine: CombatEngine;
  readonly source: TowerSource;
  constructor(engine: CombatEngine, source: TowerSource, slots: readonly (Point & { readonly id: string })[]) {
    this.engine = engine; this.source = source;
    this.origins = new Map(slots.map(slot => [slot.id, { x: slot.x, y: slot.y }]));
    engine.setPlayerStep((from, until) => this.step(from, until));
  }
  sync(): void {
    const inventory = new Map(this.source.towers.map(tower => [tower.uid, tower]));
    for (const [uid, emitter] of this.emitters) {
      if (inventory.has(uid)) continue;
      if (emitter.cycle) this.engine.cancelAttack(emitter.cycle.attack);
      this.emitters.delete(uid);
    }
    for (const tower of inventory.values()) {
      if (!this.origins.has(tower.slot)) throw new Error("A tower needs a real slot");
      const current = this.emitters.get(tower.uid);
      if (!current) {
        this.emitters.set(tower.uid, { uid: tower.uid, node: tower.node, localTime: 0, nextStart: 0,
          disabledUntil: 0, sequence: 0, cycle: null, lastCycle: null });
      } else if (current.node !== tower.node) {
        const fraction = Math.max(0, current.nextStart - current.localTime) / towerDefinition(current.node).interval;
        current.nextStart = current.localTime + fraction * towerDefinition(tower.node).interval;
        current.node = tower.node;
      }
    }
    for(const item of this.released)if(item.sourceLostAt===null&&!inventory.has(item.attack.source))item.sourceLostAt=this.engine.time;
    this.released = this.released.filter(item => this.engine.time < item.returnAt + tuning.soldAllyFade);
  }
  disable(uid: string, duration: number,at=this.engine.time): boolean {
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("Invalid tower disable duration");
    if(!Number.isFinite(at)||at<this.engine.time-epsilon||at>this.engine.time+1/120+epsilon)throw new Error("Invalid tower disable time");
    this.sync();
    const emitter = this.emitters.get(uid);
    if (!emitter || emitter.disabledUntil > at) return false;
    emitter.disabledUntil = at + duration;
    return true;
  }
  isDisabled(uid: string): boolean { return (this.emitters.get(uid)?.disabledUntil ?? 0) > this.engine.time; }
  disabledRemaining(uid:string):number{return Math.max(0,(this.emitters.get(uid)?.disabledUntil??0)-this.engine.time);}
  private step(from: number, until: number): void {
    this.sync();
    for (const tower of this.source.towers) {
      const emitter = this.emitters.get(tower.uid)!;
      const activeFrom = Math.max(from, emitter.disabledUntil);
      if (activeFrom >= until) continue;
      const localBegin = emitter.localTime, localEnd = localBegin + until - activeFrom;
      if (!emitter.cycle && emitter.nextStart <= localBegin + epsilon) {
        const attack = this.engine.captureAttack(tower.uid, emitter.node, this.origins.get(tower.slot)!);
        if (attack) {
          const cycle: Cycle = { attack, start: localBegin, preparation: preparationFor(attack.node.id),
            emitter: attack.node.id === "spore-corolla"||attack.node.id==="roccia-base"||attack.node.id==="roccia-massiccio" ? emitter.sequence % 2 :
              attack.node.id==="roccia-frantuma"?1:0, launched: 0 };
          emitter.sequence++; emitter.cycle = emitter.lastCycle = cycle;
          emitter.nextStart = localBegin + towerDefinition(emitter.node).interval;
        }
      }
      const cycle = emitter.cycle;
      if (cycle) {
        while (cycle.launched < cycle.attack.targets.length) {
          const index = cycle.launched;
          const due = cycle.start + cycle.preparation + (cycle.attack.node.id === "nido-stormo" ? index * signal.timing.stormoStagger : 0);
          if (due > localEnd + epsilon) break;
          const at = activeFrom + Math.max(0, due - localBegin);
          const node = cycle.attack.node.id;
          const distance = Math.hypot(cycle.attack.point.x - cycle.attack.origin.x, cycle.attack.point.y - cycle.attack.origin.y);
          const flight = node.startsWith("nido-") ? signal.timing.nidoOutbound : node.startsWith("roccia-") ? signal.timing.rocciaImpulse :
            Math.max(tuning.minimumProjectileFlight, distance / (node.startsWith("spore-") ? tuning.sporeProjectileSpeed : tuning.resinaProjectileSpeed));
          const target = cycle.attack.targets[index]!;
          // A reservation lost during preparation ends cleanly, with no UI exception or retarget.
          const accepted = this.engine.releaseTarget(cycle.attack, target, flight, at);
          if (accepted) this.released.push({ attack: cycle.attack, target, emitter: cycle.emitter,ally:index,mountNode:tower.node,
            launchedAt: at, impactAt: at + flight,
            returnAt: at + (node.startsWith("nido-") ? signal.timing.nidoSortie : flight + tuning.impactDisplay), number: ++this.visualSerial,
            sourceLostAt:null,outcome:"pending" });
          cycle.launched++;
        }
        if (cycle.launched === cycle.attack.targets.length) {
          this.engine.cancelAttack(cycle.attack); emitter.cycle = null;
        }
      }
      emitter.localTime = localEnd;
    }
  }
  pose(uid: string): TowerPose | null {
    const emitter = this.emitters.get(uid);
    if (!emitter) return null;
    const cycle = emitter.lastCycle;
    const age = cycle ? emitter.localTime - cycle.start : Infinity;
    const transition=cycle?.attack.node.id.startsWith("roccia-")?signal.timing.rocciaImpulse:0.06;
    const preparation = cycle ? age < cycle.preparation ? clamp(age / cycle.preparation) : 1-clamp((age-cycle.preparation)/transition) : 0;
    const ramp=cycle?clamp((age-cycle.preparation)/transition):0;
    const recovery = cycle && age >= cycle.preparation ? ramp*(1-clamp((age-cycle.preparation)/Math.max(0.2,towerDefinition(cycle.attack.node.id).interval-cycle.preparation))) : 0;
    return { uid, node: emitter.node, preparation, preparing:Boolean(emitter.cycle&&age<emitter.cycle.preparation),
      prepared:Boolean(emitter.cycle&&age>=emitter.cycle.preparation),preparingTargets:emitter.cycle?.attack.targets.length??0,
      recovery, emitter: cycle?.emitter ?? 0,
      disabled: this.isDisabled(uid),disabledRemaining:this.disabledRemaining(uid), cooldownFraction: clamp((emitter.nextStart - emitter.localTime) / towerDefinition(emitter.node).interval) };
  }
  get flights(): readonly ReleasedVisual[] { return this.released; }
  observeEvents(events:readonly CombatEvent[]):void{
    for(const event of events){
      if(event.type!=="impact"&&event.type!=="miss")continue;
      const visual=this.released.find(item=>item.attack.source===event.source&&item.target===event.enemy&&Math.abs(item.impactAt-event.at)<epsilon);
      if(visual)visual.outcome=event.type==="impact"?"hit":"miss";
    }
    if(events.some(event=>event.type==="neutralized"||event.type==="escaped"))for(const emitter of this.emitters.values()){
      const cycle=emitter.cycle;if(!cycle)continue;
      if(!cycle.attack.targets.slice(cycle.launched).some(id=>this.engine.enemy(id)?.state==="active")){
        this.engine.cancelAttack(cycle.attack);emitter.cycle=null;
      }
    }
  }
  get capturedCycles(): number { return [...this.emitters.values()].filter(item => item.cycle).length; }
  get hasUnfinishedVisuals():boolean{
    const time=this.engine.time;
    return this.released.some(item=>{
      const end=item.attack.node.id.startsWith("nido-")&&item.sourceLostAt!==null&&item.sourceLostAt<item.returnAt?
        Math.max(item.impactAt,item.sourceLostAt)+tuning.soldAllyFade:item.returnAt;
      return time+epsilon<end;
    });
  }
}
