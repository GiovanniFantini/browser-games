import { beforeAll, describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Traffic } from './traffic';
import { createGraph, nearestRoad } from '../world/graph';
import { districtGraph } from '../world/street-network';
import { roadHeight } from '../world/atlas';

beforeAll(async () => {
  await RAPIER.init();
});
describe('traffico reale', () => {
  it('nasce sulla strada, si arresta al rosso, riparte al verde e disattiva i collisori con densità zero', () => {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = 1 / 60;
    const traffic = new Traffic(new Scene(), world, createGraph());
    const bodies: RAPIER.RigidBody[] = [];
    world.forEachRigidBody((body) => bodies.push(body));
    for (const body of bodies) {
      const p = body.translation();
      expect(p.y).toBeCloseTo(roadHeight(p.x, p.z) + 0.53);
    }
    traffic.setDensity(1);
    const player = new Vector3(1000, 0, 1000);
    for (let i = 0; i < 900; i++) {
      traffic.step(1 / 60, 0, player);
      world.step();
    }
    const stopped = bodies[0].translation();
    expect(stopped.x).toBeCloseTo(-378, 0);
    expect(Math.abs(bodies[0].linvel().x)).toBeLessThan(0.1);
    for (let i = 0; i < 120; i++) {
      traffic.step(1 / 60, 12, player);
      world.step();
    }
    expect(bodies[0].translation().x).toBeGreaterThan(stopped.x + 5);
    traffic.setDensity(0);
    for (const body of bodies) expect(body.isEnabled()).toBe(false);
    world.free();
  });
  it('segue le curve e aggira le strade omesse senza uscire dalla carreggiata', () => {
    for (let district = 0; district < 4; district++) {
      const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 }),
        g = districtGraph(district),
        traffic = new Traffic(new Scene(), world, g);
      for (let tick = 0; tick < 45; tick++) {
        traffic.step(1, 12, new Vector3(10000, 0, 10000));
        world.step();
        for (const car of traffic.vehicles) {
          const p = nearestRoad(g, car.x, car.z);
          expect(Number.isFinite(car.x + car.z)).toBe(true);
          expect(Math.hypot(p.x - car.x, p.z - car.z)).toBeLessThan(11);
        }
      }
      world.free();
    }
  });
});
