import { beforeAll, expect, it } from 'vitest';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Vehicle } from '../vehicle/vehicle';
import { RaceRoute } from './route';
import { ModeSession } from './mode-session';
import { RaceDriver } from './driver';
import { DriftPilot } from './drift-pilot';
import { HillCourse } from './hill';
import catalog from '../data/races.json';
import district from '../data/district.json';
beforeAll(async () => {
  await RAPIER.init();
});
for (const id of ['drift-foundry', 'drift-hills'])
  it(`drift con Rapier reale: ${id}`, () => {
    const scene = new THREE.Scene(),
      world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = 1 / 60;
    const definition = catalog.events.find((e) => e.id === id)!,
      route = new RaceRoute(definition),
      start = route.sample(0);
    if ('hill' in definition && definition.hill)
      new HillCourse(scene, world).enabled(true);
    else {
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(550, 0.5, 550).setTranslation(0, -0.55, 0),
      );
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 8; j++)
          world.createCollider(
            RAPIER.ColliderDesc.cuboid(43, 10, 43).setTranslation(
              (district.coordinates[i] + district.coordinates[i + 1]) / 2,
              10,
              (district.coordinates[j] + district.coordinates[j + 1]) / 2,
            ),
          );
    }
    const car = new Vehicle(
      world,
      scene,
      [start.x, (start.y ?? 0) + 1.15, start.z],
      { simple: true },
    );
    car.place(
      start.x,
      (start.y ?? 0) + 1.15,
      start.z,
      Math.atan2(start.dx, start.dz),
    );
    const session = new ModeSession(route, [
        { id: 'player', name: 'Tu', position: car.position },
      ]),
      pilot = new DriftPilot(),
      driver = new RaceDriver(0.94, 0, 7),
      cars = [car],
      positions = [car.position];
    for (let i = 0; i < 60 * 250 && session.phase !== 'finished'; i++) {
      const input = driver.drive(
        car,
        session.player,
        route,
        1 / 60,
        session.elapsed,
        session.player.progress,
        0,
        1,
        cars,
      );
      if (session.phase === 'countdown')
        input.throttle = input.brake = input.steer = 0;
      else pilot.drive(car, input, session.elapsed);
      car.step(input, 1 / 60);
      world.step();
      car.capture();
      if (session.phase === 'countdown') car.hold();
      session.tick(1 / 60, positions);
      session.evaluate(car, 1 / 60);
    }
    const report = {
      phase: session.phase,
      retired: session.player.retired,
      gate: session.player.gate,
      lap: session.player.lap,
      ...session.metrics(),
      position: car.position.toArray(),
    };
    expect(report, JSON.stringify(report)).toMatchObject({
      phase: 'finished',
      retired: false,
      lap: 1,
    });
    expect(session.drift.banked).toBeGreaterThan(0);
    world.free();
  }, 120000);
