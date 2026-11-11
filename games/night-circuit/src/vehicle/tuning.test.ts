import { beforeAll, expect, it } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { Vehicle } from './vehicle';
import { calculateStats, stockLevels } from '../progression/catalog';

beforeAll(async () => {
  await RAPIER.init();
});
it('motore e massa cambiano l’accelerazione reale, freni potenziati riducono lo spazio di arresto', () => {
  function run(engine: number, weight: number, brakes: number) {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = 1 / 60;
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(1000, 0.5, 1000).setTranslation(0, -0.55, 0),
    );
    const car = new Vehicle(world, new THREE.Scene(), [0, 1.15, 0], {
      simple: true,
    });
    const stats = calculateStats({ ...stockLevels(), engine, weight, brakes });
    car.applyStats(stats);
    expect(car.body.mass()).toBeCloseTo(stats.mass, 0);
    for (let i = 0; i < 300; i++) {
      car.step(
        { throttle: 1, brake: 0, steer: 0, handbrake: false, nitro: false },
        1 / 60,
      );
      world.step();
      car.capture();
    }
    const speed = car.speed;
    // Same initial speed and pose for a meaningful comparison of stopping distance.
    car.place(0, 0.65, 0, 0);
    car.body.setLinvel({ x: 0, y: 0, z: 25 }, true);
    for (let i = 0; i < 600; i++) {
      car.step(
        { throttle: 0, brake: 1, steer: 0, handbrake: false, nitro: false },
        1 / 60,
      );
      world.step();
      car.capture();
      if (car.speed < 1 && i > 10) break;
    }
    const distance = car.position.z;
    world.free();
    return { speed, distance };
  }
  const base = run(0, 0, 0),
    tuned = run(3, 3, 0),
    braking = run(0, 0, 3);
  expect(tuned.speed).toBeGreaterThan(base.speed * 1.15);
  expect(braking.distance).toBeLessThan(base.distance * 0.9);
});
