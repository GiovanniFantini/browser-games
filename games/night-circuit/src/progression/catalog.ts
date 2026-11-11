import career from '../data/career.json';
import data from '../data/performance.json';
import prototype from '../data/prototype.json';

export const catalog = data;
export type Levels = Record<string, number>;
export type CarStats = typeof prototype.car & {
  rpmLimit: number;
  gearStep: number;
  sound: number;
  turbo: number;
};
export const stockLevels = (): Levels =>
  Object.fromEntries(data.categories.map((c) => [c.id, 0]));
export function calculateStats(
  levels: Levels,
  modelId = data.model.id,
): CarStats {
  const car: CarStats = {
    ...prototype.car,
    gears: [...prototype.car.gears],
  };
  const model = career.models.find((m) => m.id === modelId) ?? career.models[0];
  car.mass *= model.mass;
  car.engineForce *= model.power;
  car.grip *= model.grip;
  car.maxSpeed *= model.speed;
  car.damping /= model.speed ** 4;
  car.aeroDrag /= model.speed ** 1.5;
  car.brake *= model.braking;
  car.width = model.width;
  car.length = model.length;
  car.wheelbase = model.wheelbase;
  car.track = model.track;
  car.gearStep *= model.speed;
  car.gears = car.gears.map((ratio) => ratio / model.speed);
  for (const category of data.categories) {
    const tier = category.tiers[(levels[category.id] ?? 0) - 1];
    if (!tier) continue;
    for (const [key, factor] of Object.entries(tier.effects)) {
      if (key === 'sound' || key === 'turbo') car[key] += factor;
      else if (key in car && typeof car[key as keyof CarStats] === 'number') {
        const field = key as keyof Pick<
          CarStats,
          | 'mass'
          | 'engineForce'
          | 'maxSpeed'
          | 'brake'
          | 'grip'
          | 'suspensionStiffness'
          | 'suspensionCompression'
          | 'suspensionRelaxation'
          | 'nitroDuration'
          | 'nitroRecharge'
          | 'nitroMultiplier'
          | 'rpmLimit'
          | 'gearStep'
        >;
        car[field] *= factor;
      }
    }
  }
  const transmission = levels.transmission ?? 0;
  car.gears = car.gears.map((r) => r / (1 + transmission * 0.035));
  return car;
}

export function summary(stats: CarStats) {
  const base = prototype.car;
  return {
    acceleration: Math.round(
      (100 * (stats.engineForce / stats.mass)) / (base.engineForce / base.mass),
    ),
    handling: Math.round((100 * stats.grip) / base.grip),
    braking: Math.round((100 * stats.brake) / base.brake),
    speed: Math.round(stats.maxSpeed * 3.6),
  };
}
