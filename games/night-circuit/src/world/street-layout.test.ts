import { describe, it, expect, beforeAll } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { Group } from 'three';
import {
  streetPoint,
  streetLogical,
  streetHeight,
  STREET_ORIGINS,
} from './street-layout';
import { districtGraph, signalPositions } from './street-network';
import { routeFromPosition, nearestRoad } from './graph';
import { createStreetTerrain } from './street-surfaces';
import { RaceRoute } from '../race/route';
import races from '../data/races.json';

beforeAll(async () => {
  await RAPIER.init();
});
describe('strade curve e quote condivise', () => {
  it('mantiene invertibile il terreno e preserva gli accessi ai ponti e il sottopasso', () => {
    for (const o of STREET_ORIGINS)
      for (let z = -480; z <= 480; z += 23)
        for (let x = -480; x <= 480; x += 19) {
          const p = streetPoint(o.x + x, o.z + z),
            l = streetLogical(p.x, p.z);
          expect(Math.hypot(l.x - o.x - x, l.z - o.z - z)).toBeLessThan(0.001);
        }
    for (const o of STREET_ORIGINS)
      for (const [x, z] of [
        [0, -480],
        [480, 0],
        [0, 480],
        [-480, 0],
      ]) {
        expect(streetPoint(o.x + x, o.z + z)).toEqual({
          x: o.x + x,
          z: o.z + z,
        });
        expect(streetHeight(o.x + x, o.z + z)).toBeCloseTo(0, 5);
      }
    for (let z = -350; z <= -110; z += 20) {
      expect(streetPoint(0, z)).toEqual({ x: 0, z });
      expect(streetHeight(0, z)).toBe(0);
    }
  });
  it('limita la compressione e tiene i semafori fuori dalle carreggiate diagonali', () => {
    for (const o of STREET_ORIGINS)
      for (let z = -480; z <= 480; z += 23)
        for (let x = -480; x <= 480; x += 19) {
          const p = streetPoint(o.x + x, o.z + z),
            a = streetPoint(o.x + x + 0.05, o.z + z),
            b = streetPoint(o.x + x, o.z + z + 0.05);
          expect(
            ((a.x - p.x) * (b.z - p.z) - (a.z - p.z) * (b.x - p.x)) / 0.0025,
          ).toBeGreaterThan(0.4);
        }
    for (let index = 0; index < 4; index++) {
      const g = districtGraph(index);
      for (const n of g.nodes)
        for (const p of signalPositions(g, n.id)) {
          const q = nearestRoad(g, p.x, p.z);
          expect(Math.hypot(p.x - q.x, p.z - q.z)).toBeGreaterThan(12.2);
        }
    }
    for (let z = -480; z <= 480; z += 13)
      expect(streetPoint(240, z)).toEqual({ x: 240, z });
    for (const [x, z] of [
      [1560, 1080],
      [1560, 1440],
      [-240, 1560],
      [240, 1560],
    ])
      expect(streetPoint(x, z)).toEqual({ x, z });
  });
  it('offre curve, diagonali e un GPS che segue i segmenti reali in entrambi i sensi', () => {
    for (let index = 0; index < 4; index++) {
      const g = districtGraph(index);
      expect(g.edges.some((e) => Math.abs(e.a - e.b) === 10)).toBe(true);
      const e = g.edges.reduce((a, b) =>
        a.length -
          Math.hypot(
            g.nodes[a.a].x - g.nodes[a.b].x,
            g.nodes[a.a].z - g.nodes[a.b].z,
          ) >
        b.length -
          Math.hypot(
            g.nodes[b.a].x - g.nodes[b.b].x,
            g.nodes[b.a].z - g.nodes[b.b].z,
          )
          ? a
          : b,
      );
      const a = e.path![2],
        b = e.path!.at(-3)!;
      for (const [start, end] of [
        [a, b],
        [b, a],
      ]) {
        const path = routeFromPosition(g, start, end);
        expect(path[0].x).toBeCloseTo(start.x);
        expect(path.at(-1)!.z).toBeCloseTo(end.z);
        expect(path.length).toBeGreaterThan(3);
        for (const p of path) {
          const q = nearestRoad(g, p.x, p.z);
          expect(Math.hypot(p.x - q.x, p.z - q.z)).toBeLessThan(0.001);
        }
      }
    }
  });
  it('condivide le quote con i triangoli Rapier, anche fra i campioni delle curve', () => {
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    for (let index = 0; index < 4; index++)
      createStreetTerrain(new Group(), world, index);
    world.step();
    for (const o of STREET_ORIGINS)
      for (let z = -450; z < 480; z += 117)
        for (let x = -450; x < 480; x += 113) {
          const p = streetPoint(o.x + x, o.z + z),
            hit = world.castRay(
              new RAPIER.Ray({ x: p.x, y: 100, z: p.z }, { x: 0, y: -1, z: 0 }),
              200,
              true,
            );
          expect(hit).not.toBeNull();
          expect(100 - hit!.timeOfImpact).toBeCloseTo(
            streetHeight(p.x, p.z) - 0.3,
            3,
          );
        }
    world.free();
  });
  it('genera gare finite con quote corrette senza mescolare coordinate logiche e fisiche', () => {
    for (const def of races.events) {
      const route = new RaceRoute(def, true);
      expect(Number.isFinite(route.length)).toBe(true);
      for (const p of route.points) {
        expect(Number.isFinite(p.dx + p.dz + p.distance)).toBe(true);
        const o =
          STREET_ORIGINS[p.z > 540 ? (p.x > 540 ? 2 : 3) : p.x > 540 ? 1 : 0];
        if (Math.abs(p.x - o.x) < 430 && Math.abs(p.z - o.z) < 430)
          expect(p.y).toBeCloseTo(streetHeight(p.x, p.z), 3);
      }
    }
  });
});
