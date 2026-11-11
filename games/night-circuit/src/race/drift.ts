import data from '../data/modes.json';
export class DriftScore {
  peakAngle = 0;
  activeTime = 0;
  wallHits = 0;
  banked = 0;
  chain = 0;
  multiplier = 1;
  angle = 0;
  duration = 0;
  active = false;
  private idle = 0;
  private lock = 0;
  private progress: number | null = null;
  tick(
    forward: number,
    slip: number,
    grounded: boolean,
    wall: boolean,
    progress: number,
    dt: number,
  ) {
    const c = data.drift,
      delta = this.progress === null ? 0 : progress - this.progress;
    this.progress = progress;
    this.angle =
      (Math.atan2(Math.abs(slip), Math.abs(forward)) * 180) / Math.PI;
    this.peakAngle = Math.max(this.peakAngle, this.angle);
    if (wall) {
      this.wallHits++;
      this.clear();
      this.lock = c.wallLock;
    }
    this.lock = Math.max(0, this.lock - dt);
    this.active =
      !wall &&
      this.lock === 0 &&
      grounded &&
      forward >= c.minSpeed &&
      this.angle >= c.minAngle &&
      this.angle <= c.maxAngle &&
      delta > 0 &&
      delta < 90 * dt;
    if (this.active) {
      this.activeTime += dt;
      this.idle = 0;
      this.duration += dt;
      this.multiplier = Math.min(
        c.maxMultiplier,
        1 + Math.floor(this.duration / c.chainSeconds),
      );
      this.chain += forward * (this.angle / 45) * c.rate * this.multiplier * dt;
    } else {
      this.idle += dt;
      if (this.idle >= c.bankDelay) this.bank();
    }
  }
  bank() {
    this.banked += Math.floor(this.chain);
    this.clear();
  }
  clear() {
    this.chain = 0;
    this.duration = 0;
    this.multiplier = 1;
    this.idle = 0;
    this.active = false;
  }
}
