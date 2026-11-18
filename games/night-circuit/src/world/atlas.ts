import rawDistrict from '../data/district.json';
import { STREET_ORIGINS, streetHeight, streetPoint } from './street-layout';
import { districtGraph } from './street-network';
import {
  worldRaces as raceCatalog,
  worldDistrict as district,
  worldExploration as exploration,
} from './world-data';
import {
  passHeight,
  appendPassGraph,
  interchangeHeight,
  appendInterchangeGraph,
} from './pass';
import data from '../data/career.json';
import type { RoadGraph } from './graph';
export const ORIGINS = STREET_ORIGINS;
export function districtIndex(x: number, z: number) {
  return z > 540 ? (x > 540 ? 2 : 3) : x > 540 ? 1 : 0;
}
export function roadHeight(x: number, z: number) {
  if (districtIndex(x, z) === 3 && z >= 1560) return interchangeHeight(x, z);
  if (districtIndex(x, z) === 2 && x > 1560) return passHeight(x, z);
  return streetHeight(x, z);
}
export function atlasGraph(unlocked = 4): RoadGraph {
  const graph: RoadGraph = { nodes: [], edges: [] };
  for (let i = 0; i < Math.min(4, unlocked); i++) {
    const local = districtGraph(i),
      offset = graph.nodes.length;
    for (const n of local.nodes)
      graph.nodes.push({
        ...n,
        id: n.id + offset,
        x: n.x,
        z: n.z,
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
      { id: a, ...streetPoint(passage.a.x, passage.a.z), neighbors: [] },
      { id: b, ...streetPoint(passage.b.x, passage.b.z), neighbors: [] },
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
        ...streetPoint((p.a.x + p.b.x) / 2, p.a.z),
        description:
          'Scorciatoia percorribile attraverso il centro dell’isolato.',
      })),
  ];
  if (index === 0) return [...district.pois, ...extra];
  const o = ORIGINS[index],
    name = data.districts[index].name;
  return [
    ...rawDistrict.pois
      .filter((p) =>
        ['home', 'workshop', 'paint', 'body', 'dealer'].includes(p.id),
      )
      .map((p) => ({
        ...p,
        id: `${index}-${p.id}`,
        ...streetPoint(p.x + o.x, p.z + o.z),
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
  return districtGraph(index);
}
export const accessCount = (defeated: readonly string[]) =>
  Math.min(4, defeated.length + 1);
