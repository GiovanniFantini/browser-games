import { RaceSession, type RacerProgress } from './session';
import { DriftScore } from './drift';
import config from '../data/modes.json';
import type { Vehicle } from '../vehicle/vehicle';
import type { Point } from './route';
export class ModeSession extends RaceSession {
  readonly drift = new DriftScore();
  reason = '';
  remaining = 0;
  gap = 0;
  leadHold = 0;
  private gateCount = 0;
  private deadline = 0;
  constructor(...args: ConstructorParameters<typeof RaceSession>) {
    super(...args);
    this.deadline = this.route.definition.timeLimit ?? Infinity;
    this.remaining = this.deadline;
  }
  override tick(dt: number, positions: readonly (Point & { y?: number })[]) {
    super.tick(dt, positions);
  }
  evaluate(car: Vehicle, dt: number) {
    if (this.phase === 'countdown') return;
    const mode = this.route.definition.mode,
      p = this.player;
    if (
      mode !== 'checkpoint' &&
      p.finishTime !== null &&
      p.finishTime > this.deadline
    ) {
      this.fail('Traguardo raggiunto oltre il tempo limite.');
      return;
    }
    if (mode === 'drift' || mode === 'downhill') {
      if (this.phase !== 'finished')
        this.drift.tick(
          car.speed,
          car.slip,
          car.grounded > 1,
          car.collided,
          p.progress,
          dt,
        );
      if (this.drift.active)
        car.power.nitro = Math.min(
          1,
          car.power.nitro + dt * config.drift.nitroGain,
        );
      if (this.phase === 'finished') {
        this.drift.bank();
        if (this.drift.banked < (this.route.definition.targetScore ?? 0)) {
          p.retired = true;
          this.reason = 'Obiettivo drift non raggiunto.';
        }
      }
    }
    if (mode === 'checkpoint') {
      const count = p.lap * this.route.gates.length + p.gate;
      if (count > this.gateCount) {
        if (p.lastGateAt + this.penalty > this.deadline) {
          this.fail('Checkpoint raggiunto fuori tempo.');
          return;
        }
        this.deadline += config.checkpoint.bonus * (count - this.gateCount);
        this.gateCount = count;
      }
    }
    this.remaining = Math.max(0, this.deadline - this.elapsed - this.penalty);
    if (
      this.phase !== 'finished' &&
      p.finishTime === null &&
      this.remaining <= 0
    )
      this.fail('Tempo esaurito.');
    if (
      mode === 'drag' &&
      this.phase === 'running' &&
      p.finishTime === null &&
      !p.retired &&
      (car.power.damage ?? 0) >= 1
    )
      this.fail('Motore fuori uso: troppo tempo al limitatore.');
    if (mode === 'challenge' && this.phase === 'running') {
      const rival = this.racers.find((r) => r.id !== 'player')!;
      this.gap = p.progress - rival.progress;
      const lateral = Math.abs(
        (car.position.x - p.projection.x) * p.projection.dz -
          (car.position.z - p.projection.z) * p.projection.dx,
      );
      if (Math.abs(this.gap) >= config.challenge.gap && lateral < 20) {
        const signed = Math.sign(this.gap);
        this.leadHold = this.leadHold * signed < 0 ? 0 : this.leadHold;
        this.leadHold += signed * dt;
      } else this.leadHold = 0;
      if (Math.abs(this.leadHold) >= config.challenge.holdSeconds) {
        if (this.leadHold > 0) {
          p.finishTime = this.elapsed + this.penalty;
          rival.retired = true;
          this.phase = 'finished';
          this.reason = 'Distacco mantenuto: sfida vinta.';
          this.rank();
        } else this.fail('Il rivale ha mantenuto il distacco.');
      }
    }
  }
  fail(reason: string) {
    this.reason = reason;
    this.retirePlayer();
    this.drift.clear();
  }
  metrics() {
    return {
      kind: this.route.definition.mode,
      peakAngle: this.drift.peakAngle,
      activeTime: this.drift.activeTime,
      wallHits: this.drift.wallHits,
      score: this.drift.banked,
      chain: Math.floor(this.drift.chain),
      multiplier: this.drift.multiplier,
      angle: this.drift.angle,
      remaining: this.remaining,
      gap: this.gap,
      hold: this.leadHold,
      reason: this.reason,
    };
  }
  override resetPosition(id: string, position: Point) {
    super.resetPosition(id, position);
    if (id === 'player') {
      this.drift.clear();
      this.leadHold = 0;
    }
  }
}
export type ModeMetrics = ReturnType<ModeSession['metrics']>;
export type ModeProgress = RacerProgress;
