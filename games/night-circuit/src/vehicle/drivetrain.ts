import modeConfig from '../data/modes.json';
import {
  calculateStats,
  stockLevels,
  type CarStats,
} from '../progression/catalog';

const stock = calculateStats(stockLevels());
export interface Powertrain {
  gear: number;
  rpm: number;
  nitro: number;
  boosting: boolean;
  drive: number;
  braking: number;
  manual?: boolean;
  fragile?: boolean;
  damage?: number;
  limiterTime?: number;
  launchHeld?: boolean;
  shiftTime?: number;
  shiftFactor?: number;
  shiftLabel?: string;
}

export function updatePowertrain(
  state: Powertrain,
  speed: number,
  throttle: number,
  brake: number,
  boost: boolean,
  grounded: boolean,
  dt: number,
  car: CarStats = stock,
) {
  const reversing = brake > 0.1 && speed < 0.7 && throttle < 0.1;
  const opposing =
    (speed < -0.8 && throttle > 0.1) || (speed > 0.7 && brake > 0.1);
  const demand = reversing ? -brake : throttle;
  state.braking = opposing ? Math.max(brake, throttle) : 0;
  state.boosting =
    boost &&
    throttle > 0.1 &&
    !opposing &&
    speed > 2 &&
    grounded &&
    state.nitro > 0;
  if (state.boosting)
    state.nitro = Math.max(0, state.nitro - dt / car.nitroDuration);
  else if (!boost)
    state.nitro = Math.min(1, state.nitro + dt * car.nitroRecharge);
  state.gear =
    reversing || speed < -0.8
      ? -1
      : state.manual
        ? Math.max(1, Math.min(6, state.gear))
        : Math.min(6, 1 + Math.floor(Math.max(0, speed) / car.gearStep));
  const ratio = car.gears[Math.max(0, state.gear - 1)];
  const rawRpm = Math.max(
    950,
    Math.abs(speed) * ratio * 150 + Math.abs(demand) * 950,
  );
  const targetRpm =
    state.manual && state.launchHeld
      ? 950 + throttle * (car.rpmLimit - 950)
      : rawRpm;
  state.rpm = state.manual
    ? state.rpm +
      (Math.min(car.rpmLimit, targetRpm) - state.rpm) * (1 - Math.exp(-dt * 8))
    : Math.min(car.rpmLimit, targetRpm);
  if (
    state.manual &&
    state.fragile &&
    !state.launchHeld &&
    state.rpm > car.rpmLimit * 0.98 &&
    throttle > 0.75
  ) {
    state.limiterTime = (state.limiterTime ?? 0) + dt;
    state.damage = Math.min(
      1,
      (state.damage ?? 0) + dt / modeConfig.drag.failureSeconds,
    );
  }
  state.shiftTime = Math.max(0, (state.shiftTime ?? 0) - dt);
  const limit = reversing
    ? car.reverseSpeed
    : car.maxSpeed * (state.boosting ? 1.17 : 1);
  const fade = Math.max(0, 1 - Math.pow(Math.abs(speed) / limit, 3));
  state.drive = opposing
    ? 0
    : demand *
      car.engineForce *
      fade *
      (state.boosting ? car.nitroMultiplier : 1);
  state.drive *=
    0.85 + 0.25 * Math.sin(Math.min(1, state.rpm / car.rpmLimit) * Math.PI);
  if (state.manual) {
    if (state.launchHeld || (state.damage ?? 0) >= 1 || rawRpm >= car.rpmLimit)
      state.drive = 0;
    else
      state.drive *= (state.shiftTime ?? 0) > 0 ? (state.shiftFactor ?? 1) : 1;
  }
}

export function shiftGear(
  state: Powertrain,
  direction: number,
  rpmLimit: number,
) {
  if (
    !state.manual ||
    state.launchHeld ||
    (state.damage ?? 0) >= 1 ||
    (state.shiftTime ?? 0) > 0
  )
    return;
  const gear = Math.max(1, Math.min(6, state.gear + Math.sign(direction)));
  if (gear === state.gear) return;
  const ratio = state.rpm / rpmLimit,
    c = modeConfig.drag;
  state.shiftLabel =
    ratio >= c.perfectMin && ratio <= c.perfectMax
      ? 'PERFETTO'
      : ratio < c.perfectMin
        ? 'PRESTO'
        : 'TARDI';
  state.shiftFactor = state.shiftLabel === 'PERFETTO' ? 1.15 : 0.7;
  state.shiftTime = c.shiftDuration;
  state.gear = gear;
}
