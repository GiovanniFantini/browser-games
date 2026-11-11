import { beforeAll, it, expect } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { Scene } from 'three';
import { RaceRoute, type RaceDefinition } from '../race/route';
import { RaceSession } from '../race/session';
import { RaceDriver } from '../race/driver';
import { HillCourse } from '../race/hill';
import { Vehicle } from '../vehicle/vehicle';
import { calculateStats, stockLevels } from '../progression/catalog';
import races from '../data/races.json';
import exploration from '../data/exploration.json';
beforeAll(async () => {
  await RAPIER.init();
});
function drive(definition: RaceDefinition, model: string, ramp = false) {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 }),
    scene = new Scene();
  world.timestep = 1 / 60;
  if (ramp) {
    new HillCourse(scene, world, definition, false).enabled(true);
    for (const x of [-240, 240])
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(25, 0.5, 30).setTranslation(x, -0.5, 1540),
      );
  } else
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(2200, 0.5, 2200).setTranslation(0, -0.5, 0),
    );
  const route = new RaceRoute(definition),
    start = route.sample(0),
    car = new Vehicle(world, scene, [start.x, 1.15, start.z], { simple: true });
  car.applyStats(calculateStats(stockLevels(), model));
  car.place(start.x, 1.15, start.z, Math.atan2(start.dx, start.dz));
  const serial = car.resetSerial,
    session = new RaceSession(route, [
      { id: 'player', name: 'Tu', position: car.position },
    ]),
    driver = new RaceDriver(0.94, 0, 7),
    cars = [car],
    positions = [car.position];
  session.phase = 'running';
  session.countdown = 0;
  let peak = 0,
    height = 0;
  for (
    let i = 0;
    i < 60 * 300 &&
    session.player.finishTime === null &&
    !session.player.retired;
    i++
  ) {
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
    peak = Math.max(peak, car.speed);
    height = Math.max(height, car.position.y);
  }
  const result = {
    time: session.player.finishTime,
    phase: session.phase,
    peak,
    height,
    resets: car.resetSerial - serial,
  };
  world.free();
  return result;
}
it('la supercar IA sfrutta i rettilinei e migliora il tempo dello stesso pilota sulla compatta', () => {
  const route = races.events.find((e) => e.id === 'career-airport-belt')!;
  const stock = drive(route, 'silex-c1'),
    supercar = drive(route, 'veylune-synova');
  console.info('Confronto IA Rapier', JSON.stringify({ stock, supercar }));
  expect(stock.phase).toBe('finished');
  expect(supercar.phase).toBe('finished');
  expect(supercar.time, JSON.stringify({ stock, supercar })).toBeLessThan(
    stock.time! * 0.95,
  );
  expect(supercar.peak).toBeGreaterThan(35);
  expect(stock.resets + supercar.resets).toBe(0);
}, 120000);
it('percorre lo svincolo sopraelevato collegato ad Airport Belt senza cadute o ripristini', () => {
  const result = drive(exploration.airportInterchange, 'silex-c1', true);
  console.info('Svincolo Rapier', JSON.stringify(result));
  expect(result, JSON.stringify(result)).toMatchObject({
    phase: 'finished',
    resets: 0,
  });
  expect(result.height).toBeGreaterThan(15);
}, 120000);
