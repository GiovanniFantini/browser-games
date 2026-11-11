import { beforeAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import catalog from '../data/races.json';
import district from '../data/district.json';
import { Vehicle } from '../vehicle/vehicle';
import { RaceRoute } from './route';
import { RaceSession } from './session';
import { RaceDriver } from './driver';

beforeAll(async () => {
  await RAPIER.init();
});
describe('IA con fisica reale', () => {
  for (const difficulty of catalog.difficulties)
    for (const definition of catalog.events.filter(
      (e) => e.id === 'circuit-foundry' || e.id === 'sprint-quays',
    ))
      it(`percorre e termina ${definition.name} / ${difficulty.name} attraversando i checkpoint`, () => {
        const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
        world.timestep = 1 / 60;
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(550, 0.5, 550).setTranslation(0, -0.55, 0),
        );
        for (let x = 0; x < district.coordinates.length - 1; x++)
          for (let z = 0; z < district.coordinates.length - 1; z++) {
            const cx =
                (district.coordinates[x] + district.coordinates[x + 1]) / 2,
              cz = (district.coordinates[z] + district.coordinates[z + 1]) / 2;
            world.createCollider(
              RAPIER.ColliderDesc.cuboid(43, 10, 43).setTranslation(cx, 10, cz),
            );
          }
        const route = new RaceRoute(definition),
          start = route.sample(0);
        const car = new Vehicle(
          world,
          new THREE.Scene(),
          [start.x, 1.15, start.z],
          { simple: true },
        );
        car.place(start.x, 1.15, start.z, Math.atan2(start.dx, start.dz));
        const driver = new RaceDriver(0.94, 0, 7);
        const session = new RaceSession(route, [
          { id: 'player', name: 'Tu', position: car.position },
        ]);
        const others = [car],
          positions = [car.position];
        for (
          let frame = 0;
          frame < 60 * 300 && session.phase !== 'finished';
          frame++
        ) {
          const input = driver.drive(
            car,
            session.player,
            route,
            1 / 60,
            session.elapsed,
            session.player.progress,
            0,
            difficulty.speedScale,
            others,
          );
          if (session.phase === 'countdown') {
            input.throttle = input.brake = input.steer = 0;
          }
          car.step(input, 1 / 60);
          world.step();
          car.capture();
          if (session.phase === 'countdown') car.hold();
          session.tick(1 / 60, positions);
        }
        expect({
          position: car.position.toArray(),
          gate: session.player.gate,
          lap: session.player.lap,
          time: session.elapsed,
          stuck: driver.stuck,
        }).toMatchObject({ lap: definition.laps });
        expect(session.player.finishTime).not.toBeNull();
        expect(session.phase).toBe('finished');
        world.free();
      }, 120000);
});
