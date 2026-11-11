import data from '../data/races.json';
import { RaceRoute, gateCrossing, type Point, type RoutePoint } from './route';

export interface RacerProgress {
  id: string;
  name: string;
  lap: number;
  gate: number;
  progress: number;
  finishTime: number | null;
  retired: boolean;
  previous: Point;
  projection: RoutePoint;
  lapStarted: number;
  bestLap: number | null;
  lastGateAt: number;
}
export type RacePhase = 'countdown' | 'running' | 'finished';
export class RaceSession {
  phase: RacePhase = 'countdown';
  countdown = data.countdown;
  elapsed = 0;
  penalty = 0;
  playerFinishedAt: number | null = null;
  readonly racers: RacerProgress[] = [];
  readonly ranking: RacerProgress[] = [];
  readonly player: RacerProgress;

  constructor(
    readonly route: RaceRoute,
    participants: readonly { id: string; name: string; position: Point }[],
  ) {
    for (const racer of participants)
      this.racers.push({
        id: racer.id,
        name: racer.name,
        lap: 0,
        gate: 0,
        progress: 0,
        finishTime: null,
        retired: false,
        previous: { ...racer.position },
        projection: route.sample(0),
        lapStarted: 0,
        bestLap: null,
        lastGateAt: 0,
      });
    this.ranking.push(...this.racers);
    this.player = this.racers.find((racer) => racer.id === 'player')!;
    this.rank();
  }
  tick(dt: number, positions: readonly (Point & { y?: number })[]) {
    if (this.phase === 'finished') return;
    if (this.phase === 'countdown') {
      this.countdown = Math.max(0, this.countdown - dt);
      for (let i = 0; i < this.racers.length; i++)
        Object.assign(this.racers[i].previous, positions[i]);
      if (this.countdown < 0.0001) {
        this.phase = 'running';
        this.countdown = 0;
      }
      return;
    }
    this.elapsed += dt;
    for (let i = 0; i < this.racers.length; i++) {
      const racer = this.racers[i],
        position = positions[i];
      if (racer.finishTime !== null || racer.retired) continue;
      const gate = this.route.gates[racer.gate];
      const crossing =
        Math.abs((position.y ?? 0) - (gate.y ?? 0)) < 3
          ? gateCrossing(racer.previous, position, gate)
          : null;
      if (crossing !== null) {
        racer.lastGateAt = this.elapsed - dt + crossing * dt;
        racer.gate++;
        if (racer.gate === this.route.gates.length) {
          racer.lap++;
          racer.gate = 0;
          const crossingTime = this.elapsed - dt + crossing * dt;
          const lapTime = crossingTime - racer.lapStarted;
          racer.bestLap =
            racer.bestLap === null ? lapTime : Math.min(racer.bestLap, lapTime);
          racer.lapStarted = crossingTime;
          if (racer.lap >= this.route.definition.laps) {
            racer.finishTime =
              crossingTime + (racer.id === 'player' ? this.penalty : 0);
            if (racer.id === 'player') this.playerFinishedAt = this.elapsed;
          }
        }
      }
      const floor =
        racer.gate === 0 ? 0 : this.route.gates[racer.gate - 1].distance;
      const ceiling = this.route.gates[racer.gate].distance;
      this.route.project(
        position,
        Math.max(0, floor - 15),
        Math.min(this.route.length, ceiling + 5),
        racer.projection,
      );
      racer.progress =
        racer.finishTime !== null
          ? this.route.length * this.route.definition.laps
          : racer.lap * this.route.length +
            Math.max(floor, Math.min(ceiling, racer.projection.distance));
      racer.previous.x = position.x;
      racer.previous.z = position.z;
    }
    if (
      this.playerFinishedAt !== null &&
      this.elapsed - this.playerFinishedAt > data.finishGrace + this.penalty
    ) {
      for (const racer of this.racers)
        if (racer.finishTime === null) racer.retired = true;
    }
    this.rank();
    let complete = true;
    for (const racer of this.racers)
      if (racer.finishTime === null && !racer.retired) {
        complete = false;
        break;
      }
    if (complete) this.phase = 'finished';
  }
  rank() {
    this.ranking.sort(this.compare);
  }
  private readonly compare = (a: RacerProgress, b: RacerProgress) => {
    if (a.finishTime !== null && b.finishTime !== null)
      return a.finishTime - b.finishTime;
    if (a.finishTime !== null) return -1;
    if (b.finishTime !== null) return 1;
    return (
      Number(a.retired) - Number(b.retired) ||
      b.progress - a.progress ||
      this.racers.indexOf(a) - this.racers.indexOf(b)
    );
  };
  resetPosition(id: string, position: Point) {
    const racer = this.racers.find((racer) => racer.id === id)!;
    racer.previous.x = position.x;
    racer.previous.z = position.z;
    if (id === 'player') this.penalty += data.resetPenalty;
  }
  retirePlayer() {
    this.player.retired = true;
    for (const racer of this.racers)
      if (racer.finishTime === null) racer.retired = true;
    this.rank();
    this.phase = 'finished';
  }
}
