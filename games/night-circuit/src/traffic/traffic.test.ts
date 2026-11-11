import { beforeAll, describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Traffic } from './traffic';
import { createGraph } from '../world/graph';

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
    for (const body of bodies) expect(body.translation().y).toBeCloseTo(0.53);
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
});
