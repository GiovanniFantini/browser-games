import { beforeAll, it, expect } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { Scene } from 'three';
import { passRoutes } from './pass';
import { HillCourse } from '../race/hill';
import { RaceRoute } from '../race/route';
import { RaceSession } from '../race/session';
import { RaceDriver } from '../race/driver';
import { Vehicle } from '../vehicle/vehicle';
beforeAll(async () => {
  await RAPIER.init();
});
it('percorre fisicamente salita, tornanti e rientro del passo continuo senza teletrasporti', () => {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 }),
    scene = new Scene();
  world.timestep = 1 / 60;
  for (const route of passRoutes)
    new HillCourse(scene, world, route.definition, false).enabled(true);
  for (const z of [1080, 1440])
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(20, 0.5, 20).setTranslation(1560, -0.5, z),
    );
  const samples = passRoutes.flatMap((r) => r.points),
    points = samples
      .filter(
        (p, i) =>
          !i ||
          Math.hypot(p.x - samples[i - 1].x, p.z - samples[i - 1].z) > 0.001,
      )
      .map((p) => [p.x, p.z, p.y ?? 0]);
  const route = new RaceRoute({
      ...passRoutes[0].definition,
      points,
      turnRadius: 0,
    }),
    start = route.sample(0),
    car = new Vehicle(world, scene, [start.x, 1.15, start.z], { simple: true });
  car.place(start.x, 1.15, start.z, Math.atan2(start.dx, start.dz));
  const session = new RaceSession(route, [
      { id: 'player', name: 'Tu', position: car.position },
    ]),
    driver = new RaceDriver(0.94, 0, 7),
    cars = [car],
    positions = [car.position];
  Object.assign(session, { phase: 'running', countdown: 0 });
  const serial = car.resetSerial;
  let peak = 0;
  for (let i = 0; i < 60 * 400 && session.phase !== 'finished'; i++) {
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
    car.step(input, 1 / 60);
    world.step();
    car.capture();
    session.tick(1 / 60, positions);
    peak = Math.max(peak, car.position.y);
  }
  const report = {
    phase: session.phase,
    retired: session.player.retired,
    gate: session.player.gate,
    position: car.position.toArray(),
    progress: session.player.progress,
    peak,
  };
  expect(report, JSON.stringify(report)).toMatchObject({
    phase: 'finished',
    retired: false,
  });
  expect(peak).toBeGreaterThan(35);
  expect(car.resetSerial).toBe(serial);
  world.free();
}, 120000);
