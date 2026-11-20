import towerData from "../../docs/dati-torri.json";
import effectData from "../../docs/dati-effetti-combattimento.json";
import signalData from "../../docs/dati-segnali.json";
import { advanceTraveller, travellerPose } from "../movement/traveller";
import type { Traveller } from "../movement/traveller";
import type { Point } from "../field/geometry";
import { clamp, compareEnemies, integratedStrongest, movementMultiplier,
  physicalDamage, renewEffect, strongest } from "./rules";
import type { AttackSnapshot, CombatArea, CombatEnemy, CombatEvent, CombatNode,
  EnemyDefinition, PendingImpact, TimedEffect } from "./types";

const quantum = 1/120, epsilon = 1e-10;
const inside = (a: Point, b: Point, radius: number): boolean =>
  Math.hypot(a.x-b.x, a.y-b.y) <= radius+epsilon;
function validPositive(value: number): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error("Expected a positive finite combat value");
}
export class CombatEngine {
  private tick = 0;
  private accumulator = 0;
  private sequence = 0;
  private actors = new Map<string, CombatEnemy>();
  private actorList: readonly CombatEnemy[] = [];
  private captured = new Map<number, AttackSnapshot>();
  private releasedTargets = new Map<number, Set<string>>();
  private pending: PendingImpact[] = [];
  private zones: CombatArea[] = [];
  private history: CombatEvent[] = [];
  private enemyStep: ((engine: CombatEngine, from: number, until: number) => void) | null = null;
  private enemyBoundary:((from:number,until:number)=>number|null)|null=null;
  private workingTime:number|null=null;
  private playerStep: ((from:number,until:number)=>void) | null = null;
  get time(): number { return this.workingTime??this.tick * quantum; }
  get enemies(): readonly CombatEnemy[] { return this.actorList; }
  get projectiles(): readonly PendingImpact[] { return this.pending; }
  get areas(): readonly CombatArea[] { return this.zones.filter(area => area.until > this.time); }
  get events(): readonly CombatEvent[] { return this.history; }
  drainEvents(): CombatEvent[] { return this.history.splice(0); }
  setEnemyStep(callback: ((engine: CombatEngine, from: number, until: number) => void) | null): void {
    this.enemyStep=callback;
  }
  setEnemyBoundary(callback:((from:number,until:number)=>number|null)|null):void{this.enemyBoundary=callback;}
  setPlayerStep(callback:((from:number,until:number)=>void)|null):void{this.playerStep=callback;}
  get capturedCount():number{return this.captured.size;}
  enemy(id: string): CombatEnemy | undefined { return this.actors.get(id); }
  addEnemy(definition: EnemyDefinition, traveller: Traveller,enteredAt=this.time): void {
    if (this.actors.has(traveller.id) || traveller.state !== "active" || definition.id !== traveller.enemy)
      throw new Error("Duplicate, inactive or mismatched combat enemy");
    validPositive(definition.charge);
    if(!Number.isFinite(enteredAt)||enteredAt+epsilon<this.time)throw new Error("Invalid enemy entry time");
    if ([definition.physicalProtection,definition.sporeProtection].some(value=>!Number.isFinite(value)||value<0||value>100) ||
      !Number.isInteger(definition.reward) || definition.reward<0 || !Number.isFinite(traveller.distance) ||
      traveller.distance<0 || traveller.distance>traveller.path.length)
      throw new Error("Invalid combat enemy data");
    this.actors.set(traveller.id, { id: traveller.id, definition: Object.freeze({...definition}),enteredAt,
      traveller, charge: definition.charge, damageCompensation: 0, state: "active", slows: [], spores: [], reductions: [], celerity: [],
      rootFrom: 0, rootUntil: 0, rootProtectedUntil: 0 });
    this.actorList=Object.freeze([...this.actors.values()]);
  }
  private active(id: string,time=this.time): CombatEnemy | undefined {
    const enemy = this.actors.get(id);
    return enemy?.state === "active"&&enemy.enteredAt<=time+epsilon ? enemy : undefined;
  }
  private record(type: CombatEvent["type"], enemy: string, source: string, amount: number, at = this.time,chargeAfter?:number): void {
    this.history.push({type, enemy, source, amount, at,...(chargeAfter===undefined?{}:{chargeAfter})});
  }
  private neutralize(enemy: CombatEnemy, source: string, at: number): void {
    if (enemy.state !== "active") return;
    enemy.state = "neutralized";
    enemy.charge = 0;
    enemy.slows = []; enemy.spores = []; enemy.reductions = []; enemy.celerity = [];
    this.record("neutralized", enemy.id, source, enemy.definition.reward, at);
  }
  damage(id: string, amount: number, kind: "physical" | "spore", source: string,
    penetration = 0, at = this.time): number {
    if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(penetration) || penetration < 0)
      throw new Error("Invalid damage");
    const enemy = this.active(id,at);
    if (!enemy) return 0;
    const calculated = kind === "physical"
      ? physicalDamage(amount, enemy.definition.physicalProtection, strongest(enemy.reductions, at), penetration)
      : amount * (1-clamp(enemy.definition.sporeProtection, 0, 100)/100);
    const dealt = Math.min(enemy.charge, calculated);
    const corrected = -calculated-enemy.damageCompensation;
    const remaining = enemy.charge+corrected;
    enemy.damageCompensation = (remaining-enemy.charge)-corrected;
    enemy.charge = Math.max(0, remaining);
    if (dealt > 0) this.record("damage", id, source, dealt, at,enemy.charge);
    if (enemy.charge === 0) this.neutralize(enemy, source, at);
    return dealt;
  }
  private effect(source: string, node: string, strength: number, from: number, duration: number): TimedEffect {
    validPositive(duration);
    if (!source || !Number.isFinite(strength) || strength < 0 || !Number.isFinite(from))
      throw new Error("Invalid combat effect");
    return {source, node, strength, from, until: from+duration};
  }
  slow(id: string, source: string, strength: number, duration: number, from = this.time): void {
    const enemy = this.active(id,from);
    if (enemy) renewEffect(enemy.slows, this.effect(source, "slow", strength, from, duration));
  }
  spore(id: string, source: string, node: string, dps: number, duration: number, from = this.time): void {
    const enemy = this.active(id,from);
    if (enemy) renewEffect(enemy.spores, this.effect(source, node, dps, from, duration));
  }
  reduceProtection(id: string, source: string, strength: number, duration: number, from = this.time): void {
    const enemy = this.active(id,from);
    if (enemy) renewEffect(enemy.reductions, this.effect(source, "reduction", strength, from, duration));
  }
  celerity(id: string, source: string, multiplier: number, duration: number): void {
    if (multiplier < 1) throw new Error("Celerity must not slow an enemy");
    const enemy = this.active(id);
    if (enemy) renewEffect(enemy.celerity, this.effect(source, "celerity", multiplier, this.time, duration));
  }
  root(id: string, source: string, at = this.time): boolean {
    const enemy = this.active(id,at);
    if (!enemy) return false;
    const accepted = at+epsilon >= enemy.rootProtectedUntil;
    let slowFrom = at;
    if (accepted) {
      const duration = enemy.definition.boss ? signalData.root.bossDuration : signalData.root.normalDuration;
      const immunity = enemy.definition.boss ? signalData.root.bossImmunity : signalData.root.normalImmunity;
      enemy.rootFrom = at; enemy.rootUntil = at+duration;
      enemy.rootProtectedUntil = enemy.rootUntil+immunity;
      slowFrom = enemy.rootUntil;
    }
    this.slow(id, source, effectData["resina-ambra"].afterSlow,
      effectData["resina-ambra"].afterDuration, slowFrom);
    return accepted;
  }
  sporeStrength(enemy: CombatEnemy, time = this.time): number {
    const p = travellerPose(enemy.traveller);
    return Math.max(strongest(enemy.spores, time), ...this.zones.filter(area =>
      area.kind === "cloud" && area.from <= time && time < area.until && inside(p,area,area.radius)).map(area => area.strength));
  }
  occupiedParasite(source: string): ReadonlySet<string> {
    const ids = new Set<string>();
    for (const enemy of this.enemies)
      if (enemy.state === "active" && enemy.spores.some(effect => effect.source === source &&
          effect.node === "spore-parassita" && effect.until > this.time)) ids.add(enemy.id);
    for (const payload of this.pending)
      if (payload.attack.source === source && payload.attack.node.id === "spore-parassita" &&
          this.active(payload.target)) ids.add(payload.target);
    return ids;
  }
  selectTargets(node: CombatNode, source: string, origin: Point): readonly CombatEnemy[] {
    let candidates = this.enemies.filter(enemy => enemy.state === "active" && enemy.enteredAt<=this.time+epsilon &&
      inside(travellerPose(enemy.traveller), origin, node.range));
    if (node.id === "spore-parassita") {
      const occupied = this.occupiedParasite(source);
      if (occupied.size >= (node.maxMarks ?? 2)) candidates = candidates.filter(enemy => occupied.has(enemy.id));
    }
    candidates.sort(compareEnemies);
    if (node.id === "nido-picchiata")
      candidates.sort((a,b) => Number(b.definition.support)-Number(a.definition.support) || compareEnemies(a,b));
    if (node.kind === "spore") {
      const coverage = (enemy: CombatEnemy): number => Math.max(this.sporeStrength(enemy),
        ...this.pending.filter(payload => payload.target === enemy.id && payload.attack.node.kind === "spore")
          .map(payload => payload.attack.node.damage));
      candidates.sort((a,b) => Number(coverage(a) >= node.damage)-Number(coverage(b) >= node.damage) || compareEnemies(a,b));
    }
    return candidates.slice(0, node.targets ?? 1);
  }
  captureAttack(source: string, nodeId: string, origin: Point): AttackSnapshot | null {
    const definition = towerData.nodes.find(node => node.id === nodeId);
    if (!definition || !source || !Number.isFinite(origin.x) || !Number.isFinite(origin.y))
      throw new Error("Invalid attack source or node");
    const node: CombatNode = Object.freeze({...definition});
    const targets = this.selectTargets(node, source, origin);
    if (!targets.length) return null;
    const attack = Object.freeze({id: ++this.sequence, source, node, origin: Object.freeze({...origin}),
      targets: Object.freeze(targets.map(enemy => enemy.id)), point: Object.freeze({...travellerPose(targets[0]!.traveller)})});
    this.captured.set(attack.id, attack);
    this.releasedTargets.set(attack.id,new Set());
    return attack;
  }
  releaseTarget(attack:AttackSnapshot,target:string,impactDelay:number,at=this.time):boolean{
    if(!Number.isFinite(impactDelay)||impactDelay<0||!Number.isFinite(at)||at+epsilon<this.time||at>this.time+quantum+epsilon)
      throw new Error("Invalid targeted release time");
    const released=this.releasedTargets.get(attack.id);
    if(this.captured.get(attack.id)!==attack||!released||released.has(target)||!attack.targets.includes(target))return false;
    if(!this.active(target,at)){
      released.add(target);
      if(released.size===attack.targets.length){this.captured.delete(attack.id);this.releasedTargets.delete(attack.id);}
      return false;
    }
    if(attack.node.id==="spore-parassita"){
      const occupied=this.occupiedParasite(attack.source);
      if(!occupied.has(target)&&occupied.size>=(attack.node.maxMarks??2)){
        this.cancelAttack(attack);return false;
      }
    }
    released.add(target);
    this.pending.push({order:++this.sequence,attack,target,started:at,due:at+impactDelay});
    if(released.size===attack.targets.length){this.captured.delete(attack.id);this.releasedTargets.delete(attack.id);}
    this.resolveImpacts(this.time);
    return true;
  }
  releaseAttack(attack: AttackSnapshot, impactDelay: number): void {
    if (!Number.isFinite(impactDelay) || impactDelay < 0 || this.captured.get(attack.id) !== attack)
      throw new Error("Invalid or repeated attack release");
    if (attack.node.id === "spore-parassita") {
      const occupied = this.occupiedParasite(attack.source);
      if (attack.targets.some(id => !occupied.has(id)) && occupied.size >= (attack.node.maxMarks ?? 2))
        throw new Error("Parasite reservations are full");
    }
    attack.targets.forEach((target,i)=>{
      this.releaseTarget(attack,target,impactDelay+(attack.node.id==="nido-stormo"?i*signalData.timing.stormoStagger:0));
    });
  }
  cancelAttack(attack: AttackSnapshot): void {
    if (this.captured.get(attack.id) === attack){this.captured.delete(attack.id);this.releasedTargets.delete(attack.id);}
  }
  fire(source: string, node: string, origin: Point, impactDelay: number): AttackSnapshot | null {
    const attack = this.captureAttack(source,node,origin);
    if (attack) this.releaseAttack(attack,impactDelay);
    return attack;
  }
  private addArea(attack: AttackSnapshot, kind: CombatArea["kind"], at: number): void {
    const glue = effectData["resina-colla"];
    const area: CombatArea = {id: ++this.sequence, source: attack.source, node: attack.node.id,
      x: attack.point.x, y: attack.point.y, kind, radius: attack.node.area!,
      strength: kind === "glue" ? glue.slow : attack.node.damage, from: at,
      until: at+(kind === "glue" ? glue.areaDuration : attack.node.duration!)};
    this.zones = this.zones.filter(zone => zone.until > at);
    const own = this.zones.filter(zone => zone.source === attack.source && zone.kind === kind)
      .sort((a,b) => a.from-b.from || a.id-b.id);
    const max = kind === "glue" ? glue.maxAreas : attack.node.maxAreas!;
    for (const old of own.slice(0,Math.max(0,own.length-max+1))) this.zones = this.zones.filter(zone => zone.id !== old.id);
    this.zones.push(area);
  }
  private impact(payload: PendingImpact): void {
    const {attack,target,due} = payload, node = attack.node, enemy = this.active(target,due);
    if (!enemy) {this.record("miss",target,attack.source,0,due);return;}
    const position = travellerPose(enemy.traveller);
    if (node.id.startsWith("roccia-") && node.id !== "roccia-sisma" && !inside(position,attack.origin,node.range)) {
      this.record("miss",target,attack.source,0,due);return;
    }
    this.record("impact",target,attack.source,0,due);
    if (node.id === "resina-colla") {
      this.addArea(attack,"glue",due);
      if (inside(position,attack.point,node.area!)) this.damage(target,node.damage,"physical",attack.source,node.penetration ?? 0,due);
    } else if (node.id === "spore-nube") this.addArea(attack,"cloud",due);
    else if (node.id === "roccia-sisma") {
      for (const victim of this.enemies)
        if (victim.state === "active" && inside(travellerPose(victim.traveller),attack.point,node.area!))
          this.damage(victim.id,node.damage,"physical",attack.source,node.penetration ?? 0,due);
    } else if (node.kind === "spore") this.spore(target,attack.source,node.id,node.damage,node.duration!,due);
    else {
      this.damage(target,node.damage,"physical",attack.source,node.penetration ?? 0,due);
      if (node.id === "resina-base" || node.id === "resina-radici") {
        const effect = effectData[node.id];
        this.slow(target,attack.source,effect.slow,effect.duration,due);
      } else if (node.id === "resina-ambra") this.root(target,attack.source,due);
      else if (node.id === "roccia-frantuma")
        this.reduceProtection(target,attack.source,node.sharedReduction!,node.reductionDuration!,due);
    }
  }
  private resolveImpacts(until: number): void {
    const ready = this.pending.filter(payload => payload.due <= until+epsilon)
      .sort((a,b) => a.due-b.due || a.order-b.order);
    this.pending = this.pending.filter(payload => payload.due > until+epsilon);
    ready.forEach(payload => this.impact(payload));
  }
  private step(from: number, until: number): void {
    this.workingTime=from;
    try{
    this.playerStep?.(from,until);
    // All matured player effects precede movement and exit resolution in this quantum.
    this.resolveImpacts(until);
    this.zones = this.zones.filter(area => area.until > from);
    for (const enemy of this.enemies) {
      if (enemy.state !== "active" || enemy.enteredAt >= until) continue;
      const p = travellerPose(enemy.traveller);
      const spores = [...enemy.spores];
      for (const area of this.zones) {
        if (!inside(p,area,area.radius)) continue;
        if (area.kind === "glue") {
          const begin = Math.max(from,area.from,enemy.enteredAt), end = Math.min(until,area.until);
          if (end > begin) this.slow(enemy.id,"area:"+area.id,area.strength,
            end-begin+effectData["resina-colla"].linger,begin);
        } else spores.push({source: "area:"+area.id, node: area.node, strength: area.strength, from: area.from, until: area.until});
      }
      const damage = integratedStrongest(spores,Math.max(from,enemy.enteredAt),until);
      if (damage > 0) this.damage(enemy.id,damage,"spore","spore",0,until);
    }
    this.enemyStep?.(this,from,until);
    for (const enemy of this.enemies) {
      if (enemy.state !== "active") continue;
      const beginning=Math.max(from,enemy.enteredAt);
      if(beginning>=until)continue;
      const boundaries = [...new Set([beginning,until,enemy.rootFrom,enemy.rootUntil,
        ...[...enemy.slows,...enemy.celerity].flatMap(effect => [effect.from,effect.until])])]
        .filter(time => time >= beginning && time <= until).sort((a,b) => a-b);
      for (let i=1;i<boundaries.length;i++) {
        const start=boundaries[i-1]!, end=boundaries[i]!;
        const result=advanceTraveller(enemy.traveller,end-start,movementMultiplier(enemy,(start+end)/2));
        enemy.traveller=result.traveller;
        if (result.escaped) {
          enemy.state="escaped";
          enemy.slows=[];enemy.spores=[];enemy.reductions=[];enemy.celerity=[];
          this.record("escaped",enemy.id,"portal",enemy.definition.stabilityLoss ?? 0,start+(result.secondsToExit ?? 0));
          break;
        }
      }
      for (const field of ["slows","spores","reductions","celerity"] as const)
        enemy[field]=enemy[field].filter(effect => effect.until > until);
    }
    }finally{this.workingTime=null;}
  }
  advance(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error("Invalid combat time step");
    this.accumulator += seconds;
    while (this.accumulator+epsilon >= quantum) {
      let from=this.time;const until=(this.tick+1)*quantum;
      while(from<until-epsilon){
        const boundary=this.enemyBoundary?.(from,until)??null,next=boundary??until;
        if(!Number.isFinite(next)||next<=from+epsilon||next>until+epsilon)throw new Error("Invalid enemy event boundary");
        this.step(from,next);
        // Exact boundary: movement has reached the warning center. Player impacts
        // at this instant still precede enemy abilities; no simulation time is added.
        if(boundary!==null)this.step(next,next);
        from=next;
      }
      this.tick++;
      this.accumulator=Math.max(0,this.accumulator-quantum);
    }
  }
  effectiveSlow(id: string): number {
    const enemy=this.active(id);
    return enemy ? clamp(strongest(enemy.slows,this.time),0,effectData.slowCap) : 0;
  }
  rootActive(id: string): boolean {
    const enemy=this.active(id);
    return Boolean(enemy && enemy.rootFrom <= this.time && this.time < enemy.rootUntil);
  }
}
