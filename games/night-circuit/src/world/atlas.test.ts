import { describe, it, expect } from 'vitest';
import { atlasGraph, roadHeight, ORIGINS } from './atlas';
import { findPath, routeFromPosition } from './graph';
import exploration from '../data/exploration.json';
import { streetPoint } from './street-layout';
describe('città continua', () => {
  it('collega ogni nodo dei soli quartieri aperti e include passaggi reali', () => {
    for (let count = 1; count <= 4; count++) {
      const g = atlasGraph(count);
      expect(g.nodes.length).toBeGreaterThanOrEqual(count * 83);
      if (count < 3) expect(g.nodes).toHaveLength(count * 83);
      const visited = new Set([0]),
        queue = [0];
      for (let j = 0; j < queue.length; j++)
        for (const n of g.nodes[queue[j]].neighbors)
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
      expect(visited.size).toBe(g.nodes.length);
      for (const e of g.edges) {
        const points = e.path ?? [g.nodes[e.a], g.nodes[e.b]];
        expect(e.length).toBeCloseTo(
          points
            .slice(1)
            .reduce(
              (sum, p, i) =>
                sum + Math.hypot(p.x - points[i].x, p.z - points[i].z),
              0,
            ),
          6,
        );
      }
    }
  });
  it('calcola un GPS fra quartieri attraverso i ponti e usa le scorciatoie', () => {
    const g = atlasGraph(4),
      path = findPath(g, 0, 283);
    expect(path.length).toBeGreaterThan(10);
    expect(
      path.some(
        (n, i) => i > 0 && Math.floor(n / 81) !== Math.floor(path[i - 1] / 81),
      ),
    ).toBe(true);
    for (let i = 0; i < 4; i++) {
      const s = exploration.shortcuts[i],
        a = streetPoint(s.a.x, s.a.z),
        b = streetPoint(s.b.x, s.b.z),
        route = routeFromPosition(g, a, b);
      expect(route[0]).toEqual(a);
      expect(route.at(-1)).toEqual(b);
      expect(
        route.reduce(
          (sum, p, i) =>
            sum +
            (i ? Math.hypot(p.x - route[i - 1].x, p.z - route[i - 1].z) : 0),
          0,
        ),
      ).toBeCloseTo(Math.hypot(b.x - a.x, b.z - a.z), 3);
    }
  });
  it('ha quote continue e pendenze fisiche limitate, con accessi piani ai ponti', () => {
    expect(roadHeight(1080, 1080)).toBeGreaterThan(50);
    expect(roadHeight(1080, 1080)).toBeLessThan(65);
    for (const p of ORIGINS) expect(roadHeight(p.x, p.z - 480)).toBeCloseTo(0);
    for (let z = 600; z < 1560; z += 15)
      for (let x = 600; x < 1560; x += 15) {
        expect(Math.abs(roadHeight(x + 1, z) - roadHeight(x, z))).toBeLessThan(
          0.19,
        );
        expect(Math.abs(roadHeight(x, z + 1) - roadHeight(x, z))).toBeLessThan(
          0.19,
        );
      }
  });
});
