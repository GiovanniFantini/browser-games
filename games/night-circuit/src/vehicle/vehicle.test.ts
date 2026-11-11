import { careerData } from '../progression/career';
import { calculateStats, stockLevels } from '../progression/catalog';
import { beforeAll, describe, expect, it } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { Scene } from 'three';
import { Vehicle } from './vehicle';
import type { DriveInput } from '../core/input';

beforeAll(async () => {
  await RAPIER.init();
});
describe('veicolo raycast su strada', () => {
  it('si appoggia su quattro ruote, accelera, frena e va in retromarcia', () => {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = 1 / 60;
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(600, 0.5, 600).setTranslation(0, -0.55, 0),
    );
    const vehicle = new Vehicle(world, new Scene());
    const input: DriveInput = {
      throttle: 0,
      brake: 0,
      steer: 0,
      handbrake: false,
      nitro: false,
    };
    const advance = (frames: number) => {
      for (let i = 0; i < frames; i++) {
        vehicle.step(input, 1 / 60);
        world.step();
        vehicle.capture();
      }
    };
    world.step();
    vehicle.capture();
    advance(180);
    expect(vehicle.grounded).toBe(4);
    expect(vehicle.position.y).toBeGreaterThan(0.3);
    expect(vehicle.position.y).toBeLessThan(0.9);
    input.throttle = 1;
    advance(300);
    expect(vehicle.speed).toBeGreaterThan(10);
    expect(vehicle.position.z).toBeGreaterThan(-50);
    input.throttle = 0;
    input.brake = 1;
    advance(600);
    expect(vehicle.speed).toBeLessThan(-2);
    expect(vehicle.speed).toBeGreaterThan(-11);
    vehicle.reset();
    expect(vehicle.body.linvel()).toEqual({ x: 0, y: 0, z: 0 });
    expect(vehicle.position.z).toBe(-65);
    world.free();
  });
});

it('supercar originale supera 300 km/h con quattro ruote fisiche e geometria allineata al catalogo', () => {
  const spec = careerData.models.filter((m) => m.family === 'super').at(-1)!;
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 1 / 60;
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(100, 1, 1600).setTranslation(0, -1, 0),
  );
  const car = new Vehicle(world, new Scene(), [0, 1.15, -1400]);
  car.applyStats(calculateStats(stockLevels(), spec.id));
  const input = {
    throttle: 1,
    brake: 0,
    steer: 0,
    handbrake: false,
    nitro: false,
  };
  let peak = 0;
  for (let i = 0; i < 2400; i++) {
    car.step(input, 1 / 60);
    world.step();
    car.capture();
    peak = Math.max(peak, car.speed);
  }
  expect(peak * 3.6).toBeGreaterThan(300);
  expect(car.grounded).toBe(4);
  expect(car.controller.wheelChassisConnectionPointCs(0)!.x).toBeCloseTo(
    -spec.track / 2,
  );
  world.free();
});

it('rende guidabili tutti i 51 telai, con quattro ruote a terra e accelerazione reale', () => {
  for (const spec of careerData.models) {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 }),
      car = new Vehicle(world, new Scene(), [0, 1.15, -20], { simple: true });
    world.timestep = 1 / 60;
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(100, 0.5, 100).setTranslation(0, -0.5, 0),
    );
    car.applyStats(calculateStats(stockLevels(), spec.id));
    const input = {
      throttle: 0,
      brake: 0,
      steer: 0,
      handbrake: false,
      nitro: false,
    };
    for (let i = 0; i < 240; i++) {
      input.throttle = i >= 120 ? 1 : 0;
      car.step(input, 1 / 60);
      world.step();
      car.capture();
    }
    expect(car.grounded, spec.id).toBe(4);
    expect(car.speed, spec.id).toBeGreaterThan(5);
    car.model.dispose();
    world.free();
  }
});
it('i rapporti manuali delle nuove supercar consentono la sesta oltre 250 km/h senza limitatore anticipato', () => {
  const spec = careerData.models.filter((m) => m.family === 'super').at(-1)!,
    world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 1 / 60;
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(100, 1, 1600).setTranslation(0, -1, 0),
  );
  const car = new Vehicle(world, new Scene(), [0, 1.15, -1400], {
    simple: true,
  });
  car.applyStats(calculateStats(stockLevels(), spec.id));
  car.power.manual = true;
  const input = {
    throttle: 1,
    brake: 0,
    steer: 0,
    handbrake: false,
    nitro: false,
  };
  let peak = 0;
  for (let i = 0; i < 2400; i++) {
    if (car.power.rpm > car.stats.rpmLimit * 0.85) car.shift(1);
    car.step(input, 1 / 60);
    world.step();
    car.capture();
    peak = Math.max(peak, car.speed);
  }
  expect(car.power.gear).toBe(6);
  expect(peak * 3.6).toBeGreaterThan(250);
  expect(car.power.rpm).toBeLessThan(car.stats.rpmLimit);
  world.free();
});
it('conserva il picco di un urto fino al consumo audio anche dopo molti passi fisici', () => {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  world.timestep = 1 / 60;
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(100, 0.5, 100).setTranslation(0, -0.5, 0),
  );
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(50, 5, 0.5).setTranslation(0, 5, 15),
  );
  const car = new Vehicle(world, new Scene(), [0, 1.15, 0], { simple: true }),
    input = { throttle: 1, brake: 0, steer: 0, handbrake: false, nitro: false };
  for (let i = 0; i < 600; i++) {
    car.step(input, 1 / 60);
    world.step();
    car.capture();
  }
  expect(car.speed).toBeLessThan(1);
  expect(car.impactSpeed).toBeGreaterThan(5);
  car.reset();
  expect(car.impactSpeed).toBe(0);
  world.free();
});
