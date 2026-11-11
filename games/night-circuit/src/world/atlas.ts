import raceCatalog from '../data/races.json';
import {
  passHeight,
  appendPassGraph,
  interchangeHeight,
  appendInterchangeGraph,
} from './pass';
import exploration from '../data/exploration.json';
import data from '../data/career.json';
import district from '../data/district.json';
import { createGraph, type RoadGraph } from './graph';
export const ORIGINS = [
  { x: 0, z: 0 },
  { x: 1080, z: 0 },
  { x: 1080, z: 1080 },
  { x: 0, z: 1080 },
] as const;
export function districtIndex(x: number, z: number) {
  return z > 540 ? (x > 540 ? 2 : 3) : x > 540 ? 1 : 0;
}
const elevations = Array.from(
  { length: 81 },
  (_, i) =>
    55 *
    Math.sin(((i % 9) / 8) * Math.PI) *
    Math.sin((Math.floor(i / 9) / 8) * Math.PI),
);
export function roadHeight(x: number, z: number) {
  if (districtIndex(x, z) === 3 && z >= 1560) return interchangeHeight(x, z);
  if (districtIndex(x, z) !== 2) return 0;
  const lx = x - 1080,
    lz = z - 1080;
  if (lx > 480) return passHeight(x, z);
  if (Math.abs(lx) > 480 || Math.abs(lz) > 480) return 0;
  // Piecewise planar interpolation follows the physical terrain triangles.
  const step = 120,
    ax = Math.max(-480, Math.min(360, Math.floor(lx / step) * step)),
    az = Math.max(-480, Math.min(360, Math.floor(lz / step) * step));
  const n = ((az + 480) / 120) * 9 + (ax + 480) / 120;
  const tx = (lx - ax) / step,
    tz = (lz - az) / step;
  const a = elevations[n],
    b = elevations[n + 1],
    c = elevations[n + 9],
    d = elevations[n + 10];
  return tx + tz <= 1
    ? a + (b - a) * tx + (c - a) * tz
    : d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
}
export function atlasGraph(unlocked = 4): RoadGraph {
  const graph: RoadGraph = { nodes: [], edges: [] };
  for (let i = 0; i < Math.min(4, unlocked); i++) {
    const local = createGraph(),
      offset = graph.nodes.length,
      o = ORIGINS[i];
    for (const n of local.nodes)
      graph.nodes.push({
        ...n,
        id: n.id + offset,
        x: n.x + o.x,
        z: n.z + o.z,
        neighbors: n.neighbors.map((id) => id + offset),
      });
    for (const e of local.edges)
      graph.edges.push({ ...e, a: e.a + offset, b: e.b + offset });
  }
  const link = (a: number, b: number) => {
    if (!graph.nodes[a] || !graph.nodes[b]) return;
    graph.nodes[a].neighbors.push(b);
    graph.nodes[b].neighbors.push(a);
    graph.edges.push({ a, b, length: 120 });
  };
  link(44, 81 + 36);
  link(81 + 76, 162 + 4);
  link(162 + 36, 243 + 44);
  link(243 + 4, 76);
  for (let i = 0; i < Math.min(4, unlocked); i++) {
    const passage = exploration.shortcuts[i],
      offset = i * 81,
      a = graph.nodes.length,
      b = a + 1;
    graph.nodes.push(
      { id: a, ...passage.a, neighbors: [] },
      { id: b, ...passage.b, neighbors: [] },
    );
    for (const [from, to] of [
      [a, offset + 36],
      [a, offset + 45],
      [b, offset + 37],
      [b, offset + 46],
      [a, b],
    ]) {
      graph.nodes[from].neighbors.push(to);
      graph.nodes[to].neighbors.push(from);
      graph.edges.push({
        a: from,
        b: to,
        length: Math.hypot(
          graph.nodes[from].x - graph.nodes[to].x,
          graph.nodes[from].z - graph.nodes[to].z,
        ),
      });
    }
  }
  if (unlocked >= 3) appendPassGraph(graph);
  if (unlocked >= 4) appendInterchangeGraph(graph);
  return graph;
}
export function districtPois(index: number) {
  const extra = [
    ...exploration.collectibles
      .filter((p) => p.district === index)
      .map((p) => ({
        ...p,
        type: 'landmark',
        description:
          'Collezionabile: attraversa il segnale per raccoglierlo. Premio 250 CR.',
      })),
    ...exploration.shortcuts
      .filter((p) => p.district === index)
      .map((p) => ({
        id: p.id,
        name: p.name,
        type: 'landmark',
        x: (p.a.x + p.b.x) / 2,
        z: p.a.z,
        description:
          'Scorciatoia percorribile attraverso il centro dell’isolato.',
      })),
  ];
  if (index === 0) return [...district.pois, ...extra];
  const o = ORIGINS[index],
    name = data.districts[index].name;
  return [
    ...district.pois
      .filter((p) =>
        ['home', 'workshop', 'paint', 'body', 'dealer'].includes(p.id),
      )
      .map((p) => ({
        ...p,
        id: `${index}-${p.id}`,
        x: p.x + o.x,
        z: p.z + o.z,
      })),
    {
      id: 'career-' + data.districts[index].id,
      name: 'Gara / ' + name,
      type: 'event',
      ...raceCatalog.events.find(
        (e) => e.id === 'career-' + data.districts[index].id,
      )!.meeting,
      description: 'Ritrovo del quartiere: premi E per gareggiare.',
    },
    ...extra,
    ...(index === 3
      ? [
          {
            id: 'nacelle-interchange',
            name: exploration.airportInterchange.name,
            type: 'landmark',
            x: 0,
            z: 1720,
            description: exploration.airportInterchange.description,
          },
        ]
      : []),
    ...(index === 2
      ? [
          {
            id: 'vetracava-summit',
            name: 'Pendio di Vetracava',
            type: 'event',
            x: 1750,
            z: 820,
            description:
              'Passo collegato alla città. Premi E qui per la gara drift, oppure prosegui in guida libera.',
          },
        ]
      : []),
  ];
}
export const atlasPois = () =>
  data.districts.flatMap((_, i) => districtPois(i));

export function localGraph(index: number) {
  const g = createGraph(),
    o = ORIGINS[index];
  for (const n of g.nodes) {
    n.x += o.x;
    n.z += o.z;
  }
  return g;
}
export const accessCount = (defeated: readonly string[]) =>
  Math.min(4, defeated.length + 1);
