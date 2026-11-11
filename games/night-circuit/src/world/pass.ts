import data from '../data/exploration.json';
import races from '../data/races.json';
import { RaceRoute } from '../race/route';
import type { RoadGraph } from './graph';
export const passRoutes = [
  new RaceRoute(data.passLinks[0]),
  new RaceRoute(races.events.find((e) => e.id === 'drift-hills')!),
  new RaceRoute(data.passLinks[1]),
];
export const interchangeRoute = new RaceRoute(data.airportInterchange);
export function passHeight(x: number, z: number) {
  let best = 64,
    height = 0;
  for (const route of passRoutes)
    for (let i = 1; i < route.points.length; i++) {
      const a = route.points[i - 1],
        b = route.points[i],
        dx = b.x - a.x,
        dz = b.z - a.z,
        length = dx * dx + dz * dz;
      if (!length) continue;
      const t = Math.max(
          0,
          Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / length),
        ),
        distance = (a.x + dx * t - x) ** 2 + (a.z + dz * t - z) ** 2;
      if (distance < best) {
        best = distance;
        height = (a.y ?? 0) + ((b.y ?? 0) - (a.y ?? 0)) * t;
      }
    }
  return height;
}
export function appendPassGraph(graph: RoadGraph) {
  let previous = 162 + 44;
  const points = passRoutes.flatMap((r) => r.points);
  for (let i = 0; i < points.length; i++) {
    const p = points[i],
      a = graph.nodes[previous],
      length = Math.hypot(a.x - p.x, a.z - p.z);
    if (length < 0.00001) continue;
    const id = i === points.length - 1 ? 162 + 71 : graph.nodes.length;
    if (id === graph.nodes.length)
      graph.nodes.push({ id, x: p.x, z: p.z, neighbors: [] });
    graph.nodes[previous].neighbors.push(id);
    graph.nodes[id].neighbors.push(previous);
    graph.edges.push({ a: previous, b: id, length });
    previous = id;
  }
}

export function interchangeHeight(x: number, z: number) {
  let best = 64,
    height = 0;
  const points = interchangeRoute.points;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dx = b.x - a.x,
      dz = b.z - a.z,
      length = dx * dx + dz * dz;
    if (!length) continue;
    const t = Math.max(
        0,
        Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / length),
      ),
      distance = (a.x + dx * t - x) ** 2 + (a.z + dz * t - z) ** 2;
    if (distance < best) {
      best = distance;
      height = (a.y ?? 0) + ((b.y ?? 0) - (a.y ?? 0)) * t;
    }
  }
  return height;
}
export function appendInterchangeGraph(graph: RoadGraph) {
  let previous = 243 + 74;
  for (let i = 1; i < interchangeRoute.points.length; i++) {
    const p = interchangeRoute.points[i],
      a = graph.nodes[previous],
      length = Math.hypot(p.x - a.x, p.z - a.z);
    if (length < 0.00001) continue;
    const id =
      i === interchangeRoute.points.length - 1 ? 243 + 78 : graph.nodes.length;
    if (id === graph.nodes.length)
      graph.nodes.push({ id, x: p.x, z: p.z, neighbors: [] });
    graph.nodes[previous].neighbors.push(id);
    graph.nodes[id].neighbors.push(previous);
    graph.edges.push({ a: previous, b: id, length });
    previous = id;
  }
}
