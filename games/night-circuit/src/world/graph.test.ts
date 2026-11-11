import { describe, expect, it } from 'vitest';
import { createGraph, findPath, nearestRoad, routeFromPosition } from './graph';
describe('rete stradale e GPS', () => {
  it('collega tutti gli incroci e restituisce un percorso minimo', () => {
    const graph = createGraph([0, 100, 200]);
    expect(graph.nodes).toHaveLength(9);
    const path = findPath(graph, 0, 8);
    expect(path).toHaveLength(5);
    for (let i = 1; i < path.length; i++)
      expect(graph.nodes[path[i - 1]].neighbors).toContain(path[i]);
    expect(findPath(graph, -1, 2)).toEqual([]);
    expect(findPath(graph, 4, 4)).toEqual([4]);
  });
  it('gestisce strade scollegate e proietta le destinazioni sulla carreggiata', () => {
    const graph = createGraph([0, 100]);
    expect(nearestRoad(graph, 40, 8)).toEqual({ x: 40, z: 0 });
    for (const node of graph.nodes) node.neighbors = [];
    expect(findPath(graph, 0, 3)).toEqual([]);
  });
  it('non torna indietro quando la destinazione è sulla stessa strada', () => {
    const graph = createGraph([0, 100, 200]);
    const route = routeFromPosition(graph, { x: 60, z: 0 }, { x: 200, z: 100 });
    expect(route[0]).toEqual({ x: 60, z: 0 });
    expect(route[1].x).toBe(100);
    expect(route.at(-1)).toEqual({ x: 200, z: 100 });
    expect(routeFromPosition(graph, { x: 60, z: 0 }, { x: 80, z: 0 })).toEqual([
      { x: 60, z: 0 },
      { x: 80, z: 0 },
    ]);
  });
});
