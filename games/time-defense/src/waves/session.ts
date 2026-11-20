import enemyData from "../../docs/dati-nemici.json";
import { CombatEngine } from "../combat/engine";
import { AttemptEconomy } from "../economy/model";
import { compilePath } from "../movement/path";
import { createTraveller } from "../movement/traveller";
import type { SessionPhase, WaveEvent, WaveLevel, WaveResult } from "./types";
import { TowerController } from "../towers/controller";
import type { CombatEvent } from "../combat/types";
import type { BossEvent } from "../enemies/boss";
import { EnemyController } from "../enemies/controller";

export interface PresentationPacket {readonly time:number;readonly combat:readonly CombatEvent[];readonly boss:readonly BossEvent[];}
const step = 1 / 120, epsilon = 1e-10;
type Spawn = { at: number; kind: string; route: string; group: number; index: number };
let serial = 0;

// One session owns the clock, ledger and engine. No wall time enters the engine directly.
export class WaveSession {
  readonly level: WaveLevel;
  readonly attempt = "waves:" + (++serial);
  readonly engine = new CombatEngine();
  readonly economy: AttemptEconomy;
  readonly towers: TowerController;
  readonly enemies: EnemyController;
  private paths;
  private phaseValue: SessionPhase = "preparation";
  private waveIndex = -1;
  private clearedValue = 0;
  private stabilityValue: number;
  private speedValue: 1 | 2 = 1;
  private accumulator = 0;
  private scheduled: Spawn[] = [];
  private cursor = 0;
  private entryOrder = 0;
  private bossSpawned = 0;
  private bossNeutralized = 0;
  private resultValue: WaveResult | null = null;
  private events: WaveEvent[] = [];
  private finishingWave=false;
  private presentation=new Set<(packet:PresentationPacket)=>void>();
  observePresentation(listener:(packet:PresentationPacket)=>void):()=>void{this.presentation.add(listener);return()=>{this.presentation.delete(listener);};}
  private present(combat:CombatEvent[],boss:BossEvent[]):void{
    if(!this.presentation.size)return;for(const event of combat)Object.freeze(event);for(const event of boss)Object.freeze(event);
    const packet=Object.freeze({time:this.engine.time,combat:Object.freeze(combat),boss:Object.freeze(boss)});
    for(const listener of this.presentation)try{listener(packet);}catch{this.presentation.delete(listener);}
  }

  constructor(level: WaveLevel) {
    this.level=level;
    if (!level.waves.length || !Number.isSafeInteger(level.stability) || level.stability <= 0)
      throw new Error("Invalid wave level");
    this.paths = new Map(level.routes.map(route => [route.id, compilePath(route.id, route.points)]));
    if (this.paths.size !== level.routes.length) throw new Error("Duplicate wave route");
    const ids = new Set<string>();
    for (const wave of level.waves) {
      if (!wave.id || ids.has(wave.id) || !Number.isSafeInteger(wave.bonus) || wave.bonus < 0 || !wave.groups.length)
        throw new Error("Invalid wave definition");
      ids.add(wave.id);
      for (const group of wave.groups) {
        const route = level.routes.find(route => route.id === group.path);
        if (!enemyData.enemies.some(enemy => enemy.id === group.enemy) || !route ||
            (route.allowedEnemies !== null && !route.allowedEnemies.includes(group.enemy)) ||
            !Number.isSafeInteger(group.count) || group.count <= 0 ||
            !Number.isFinite(group.start) || group.start < 0 ||
            !Number.isFinite(group.interval) || group.interval <= 0)
          throw new Error("Invalid wave group");
      }
    }
    if (level.bossRequirement) {
      const boss = level.bossRequirement;
      const appearances = level.waves.flatMap((wave, index) => wave.groups.filter(group => group.enemy === boss.enemy)
        .map(group => ({ count: group.count, wave: index + 1 })));
      if (!boss.mustSpawn || !boss.mustNeutralize || boss.escape !== "instant-defeat" ||
          !appearances.length || appearances.some(item => item.wave !== boss.wave) ||
          appearances.reduce((total, item) => total + item.count, 0) !== boss.count)
        throw new Error("Invalid boss requirement");
    }
    this.stabilityValue = level.stability;
    this.economy = new AttemptEconomy(this.attempt, level.budget, level.slots.map(slot => slot.id), level.firstEntryTowers);
    this.towers = new TowerController(this.engine,this.economy,level.slots);
    this.enemies = new EnemyController(this.engine,this.towers,level.slots);
  }
  get phase(): SessionPhase { return this.phaseValue; }
  get wave(): number { return this.waveIndex + 1; }
  get cleared(): number { return this.clearedValue; }
  get stability(): number { return this.stabilityValue; }
  get speed(): 1 | 2 { return this.speedValue; }
  get result(): WaveResult | null { return this.resultValue; }
  get remainingSpawns(): number { return this.scheduled.length - this.cursor; }
  get activeEnemies() { return this.engine.enemies.filter(enemy => enemy.state === "active" && enemy.enteredAt <= this.engine.time + epsilon); }
  drainEvents(): WaveEvent[] { return this.events.splice(0); }
  private emit(type: WaveEvent["type"], message: string): void { this.events.push({ type, message }); }
  start(): boolean {
    if (this.phase !== "preparation" && this.phase !== "intermission") return false;
    const wave = this.level.waves[++this.waveIndex]!;
    this.economy.markFirstWaveStarted();
    this.scheduled = wave.groups.flatMap((group, groupIndex) => Array.from({ length: group.count }, (_, index) => ({
      at: this.engine.time + group.start + index * group.interval, kind: group.enemy,
      route: group.path, group: groupIndex, index,
    }))).sort((a, b) => a.at - b.at || a.group - b.group || a.index - b.index);
    this.cursor = 0; this.accumulator = 0; this.phaseValue = "active";this.finishingWave=false;
    this.spawnThrough(this.engine.time);
    this.emit("started", "Ondata " + this.wave + ": " + wave.name + ". Rimborso delle difese: 70%.");
    return true;
  }
  pause(): void {
    if (this.phase !== "active") return;
    this.phaseValue = "paused"; this.accumulator = 0;
    this.emit("paused", "Ondata in pausa. Nessun tempo avanza. Riprendi quando sei pronto.");
  }
  resume(): void {
    if (this.phase !== "paused") return;
    this.phaseValue = "active"; this.accumulator = 0; this.emit("resumed", "Ondata ripresa.");
  }
  setSpeed(speed: 1 | 2): void {
    if (speed !== 1 && speed !== 2) throw new Error("Invalid wave speed");
    this.speedValue = speed; this.emit("speed", "Velocità " + speed + "x.");
  }
  private spawnThrough(until: number): void {
    while (this.cursor < this.scheduled.length && this.scheduled[this.cursor]!.at <= until + epsilon) {
      const spawn = this.scheduled[this.cursor++]!;
      const definition = enemyData.enemies.find(enemy => enemy.id === spawn.kind)!;
      const id = this.attempt + ":w" + this.wave + ":g" + spawn.group + ":n" + spawn.index;
      this.engine.addEnemy(definition, createTraveller(id, definition.id, this.entryOrder++, this.paths.get(spawn.route)!, definition.speed), spawn.at);
      if (definition.id === this.level.bossRequirement?.enemy) this.bossSpawned++;
    }
  }
  private settle(): void {
    let bossEscaped = false;
    const events=this.engine.drainEvents();this.towers.observeEvents(events);this.enemies.observeEvents(events);
    const bossEvents=this.enemies.boss.drainEvents();this.present(events,bossEvents);let liberated=false;
    for (const event of events) {
      const actor = this.engine.enemy(event.enemy);
      if (!actor) continue;
      if (event.type === "neutralized") {
        this.economy.applyCombatReward(this.attempt, event, actor.definition.id);
        if (actor.definition.id === this.level.bossRequirement?.enemy){this.bossNeutralized++;liberated=true;}
      } else if (event.type === "escaped") {
        this.stabilityValue = Math.max(0, this.stabilityValue - (actor.definition.stabilityLoss ?? 0));
        bossEscaped ||= Boolean(actor.definition.instantDefeatOnEscape);
      }
    }
    // Defeat takes priority, including a simultaneous last neutralization.
    if (bossEscaped || this.stability === 0) {
      this.enemies.clearDepartures();
      this.finish("lost", bossEscaped ? "Il Custode ha raggiunto il portale." : "La stabilità del portale è esaurita.");
      return;
    }
    for(const event of bossEvents)this.emit("boss",event.message);
    if(liberated)this.emit("boss","Custode liberato. Le eventuali creature rimaste vanno ancora neutralizzate.");
    if (this.remainingSpawns || this.engine.enemies.some(enemy=>enemy.state==="active"&&enemy.enteredAt<=this.engine.time+epsilon)) return;
    // Close already released shots and natural ally returns before freezing the intermission.
    if(this.engine.projectiles.length||this.towers.capturedCycles||this.towers.hasUnfinishedVisuals){
      if(!this.finishingWave){this.finishingWave=true;this.emit("returning","Ultimi attacchi e rientri in corso.");}return;
    }
    this.enemies.clearDepartures();
    const wave = this.level.waves[this.waveIndex]!;
    const final=this.wave===this.level.waves.length,boss=this.level.bossRequirement;
    if(final&&boss&&(this.bossSpawned!==boss.count||this.bossNeutralized!==boss.count)){
      this.finish("lost","Il Custode deve essere neutralizzato per stabilizzare la Frattura.");return;
    }
    this.economy.awardWaveBonus(this.attempt, wave.id, wave.bonus);
    this.clearedValue++;
    if (final) this.finish("won", "Tutte le ondate sono risolte e il portale è stabile.");
    else {
      this.phaseValue = "intermission"; this.accumulator = 0;
      this.emit("cleared", "Ondata " + this.wave + " risolta. Bonus " + wave.bonus + " Scintille. Prepara le difese, poi avvia la prossima.");
    }
  }
  private finish(outcome: "won" | "lost", reason: string): void {
    if (this.resultValue) return;
    this.phaseValue = outcome; this.accumulator = 0;
    this.resultValue = Object.freeze({ outcome, level: this.level.id, stability: this.stability,
      initialStability: this.level.stability, cleared: this.cleared, reason });
    this.emit(outcome, reason);
  }
  advanceReal(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error("Invalid real elapsed time");
    if (this.phase !== "active") return;
    this.accumulator += seconds * this.speed;
    while (this.phase === "active" && this.accumulator + epsilon >= step) {
      this.spawnThrough(this.engine.time + step);
      this.engine.advance(step);
      this.accumulator = Math.max(0, this.accumulator - step);
      this.settle();
    }
  }
}
