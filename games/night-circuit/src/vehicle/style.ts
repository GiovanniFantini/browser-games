export interface StyleSample {
  speed: number;
  slip: number;
  grounded: number;
  collided: boolean;
  resetSerial: number;
  position: { x: number; y: number; z: number };
  power: { nitro: number; boosting: boolean };
}
export class DrivingStyle {
  private airborne = 0;
  private serial = -1;
  private readonly cooldown = new Float32Array(32);
  private readonly previousDistance = new Float32Array(32).fill(1e6);
  update(
    car: StyleSample,
    dt: number,
    traffic: readonly { x: number; z: number }[],
    count: number,
    driftBonus: boolean,
  ) {
    if (car.resetSerial !== this.serial) {
      this.serial = car.resetSerial;
      this.airborne = 0;
      this.previousDistance.fill(1e6);
    }
    let gain = 0,
      notice = '';
    if (
      !car.power.boosting &&
      driftBonus &&
      car.grounded >= 2 &&
      !car.collided &&
      car.speed > 8 &&
      Math.abs(car.slip) > 3
    )
      gain += dt * 0.04;
    if (!car.grounded && car.speed > 8) this.airborne += dt;
    else {
      if (car.grounded >= 2 && this.airborne > 0.3 && !car.collided) {
        gain += Math.min(0.12, this.airborne * 0.04);
        notice = 'Salto pulito: +nitro';
      }
      this.airborne = 0;
    }
    for (let i = 0; i < count; i++) {
      const p = traffic[i],
        distance = Math.hypot(car.position.x - p.x, car.position.z - p.z);
      this.cooldown[i] = Math.max(0, this.cooldown[i] - dt);
      if (
        this.previousDistance[i] < 4.8 &&
        this.previousDistance[i] > 2.2 &&
        distance > this.previousDistance[i] &&
        car.speed > 12 &&
        !car.collided &&
        car.grounded >= 2 &&
        this.cooldown[i] === 0
      ) {
        gain += 0.07;
        notice = 'Passaggio ravvicinato: +nitro';
        this.cooldown[i] = 8;
      }
      this.previousDistance[i] = distance;
    }
    car.power.nitro = Math.min(1, car.power.nitro + gain);
    return notice;
  }
}
