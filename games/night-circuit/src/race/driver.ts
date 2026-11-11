import config from '../data/races.json';
import type { DriveInput } from '../core/input';
import type { Vehicle } from '../vehicle/vehicle';
import { RaceRoute, type RoutePoint } from './route';
import type { RacerProgress } from './session';

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
export class RaceDriver {
  readonly input: DriveInput = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    nitro: false,
  };
  private readonly target: RoutePoint = {
    x: 0,
    z: 0,
    dx: 0,
    dz: 1,
    distance: 0,
  };
  private readonly far: RoutePoint = { x: 0, z: 0, dx: 0, dz: 1, distance: 0 };
  stuck = 0;
  private lastProgress = 0;
  constructor(
    readonly skill: number,
    readonly lane: number,
    readonly seed: number,
  ) {}
  private readonly cornerA = { x: 0, z: 0, distance: 0, dx: 0, dz: 1 };
  private readonly cornerB = { x: 0, z: 0, distance: 0, dx: 0, dz: 1 };
  reset() {
    this.stuck = 0;
    this.lastProgress = 0;
    this.input.throttle = this.input.brake = this.input.steer = 0;
  }

  drive(
    car: Vehicle,
    progress: RacerProgress,
    route: RaceRoute,
    dt: number,
    time: number,
    playerProgress: number,
    rubberBand: number,
    speedScale: number,
    others: readonly Vehicle[],
  ) {
    const q = car.rotation;
    const fx = 2 * (q.x * q.z + q.w * q.y),
      fz = 1 - 2 * (q.x * q.x + q.y * q.y);
    const look =
      config.ai.lookAhead + Math.abs(car.speed) * config.ai.speedLookAhead;
    const distance = progress.projection.distance;
    const target = this.target,
      far = this.far;
    route.sample(distance + look, target);
    route.sample(distance + look + 18, far);
    let lane = this.lane,
      slipstream = false,
      gapSpeed = Infinity;
    for (const other of others) {
      if (other === car || !other.body.isEnabled()) continue;
      const x = other.position.x - car.position.x,
        z = other.position.z - car.position.z;
      const ahead = x * fx + z * fz,
        side = Math.abs(x * fz - z * fx);
      if (ahead > 0 && ahead < 20 && side < 2.5) {
        slipstream = true;
        if (ahead < 16) {
          let clear = this.lane !== 0;
          for (const neighbor of others) {
            if (
              neighbor === car ||
              neighbor === other ||
              !neighbor.body.isEnabled()
            )
              continue;
            const px = neighbor.position.x - car.position.x,
              pz = neighbor.position.z - car.position.z;
            if (
              Math.abs(px * fx + pz * fz) < 12 &&
              Math.abs(px * fz - pz * fx + 2 * this.lane) < 2.5
            )
              clear = false;
          }
          if (clear) lane = -this.lane;
          else
            gapSpeed = Math.min(
              gapSpeed,
              Math.max(0, other.speed + (ahead - 7) * 1.2),
            );
        }
      }
    }
    target.x += target.dz * lane;
    target.z -= target.dx * lane;
    const x = target.x - car.position.x,
      z = target.z - car.position.z;
    const angle = Math.atan2(fz * x - fx * z, fx * x + fz * z);
    const straight =
        car.stats.maxSpeed *
        config.ai.straightFraction *
        this.skill *
        speedScale,
      braking = (config.ai.brakingAcceleration * car.stats.brake) / 32,
      horizon = Math.min(
        config.ai.brakeLookAheadMax,
        Math.max(45, (car.speed * car.speed) / (2 * braking) + 30),
      );
    let desired = straight;
    for (let ahead = 0; ahead <= horizon; ahead += 8) {
      route.sample(distance + ahead, this.cornerA);
      route.sample(distance + ahead + 6, this.cornerB);
      const turn = Math.acos(
          clamp(
            this.cornerA.dx * this.cornerB.dx +
              this.cornerA.dz * this.cornerB.dz,
            -1,
            1,
          ),
        ),
        radius = 6 / Math.max(turn, 0.0001),
        cornerLimit =
          Math.max(
            config.ai.cornerSpeed,
            Math.sqrt(car.stats.grip * config.ai.lateralAcceleration * radius),
          ) *
          this.skill *
          speedScale;
      desired = Math.min(
        desired,
        Math.sqrt(
          cornerLimit * cornerLimit + 2 * braking * Math.max(0, ahead - 5),
        ),
      );
    }
    desired = Math.min(
      desired,
      straight / (1 + Math.max(0, Math.abs(angle) - 0.2) * 0.8),
    );
    desired *=
      1 +
      clamp((playerProgress - progress.progress) / 250, -1, 1) *
        0.06 *
        rubberBand;
    if (slipstream) desired *= 1.04;
    if (Math.abs(angle) > 1.1) desired = Math.min(desired, 5);
    desired = Math.min(desired, gapSpeed);
    const errorPhase = (time + this.seed * 2.1) % 19;
    const error =
      errorPhase > 10 && errorPhase < 11.3
        ? Math.sin(((errorPhase - 10) * Math.PI) / 1.3) *
          (1 - this.skill) *
          0.15
        : 0;
    this.input.steer = clamp(angle * 2.4 + error, -1, 1);
    this.input.throttle =
      car.speed < desired ? clamp((desired - car.speed) * 0.35, 0.18, 1) : 0;
    this.input.brake =
      car.speed > desired + 0.8 ? clamp((car.speed - desired) * 0.18, 0, 1) : 0;
    this.input.nitro = false;
    this.input.handbrake = false;
    if (progress.progress > this.lastProgress + 0.5) {
      this.stuck = 0;
      this.lastProgress = progress.progress;
    } else this.stuck += dt;
    return this.input;
  }
}
