import {
  createGraph,
  nearestRoad,
  type RoadGraph,
  type RoadEdge,
  type RoadPosition,
} from './graph';
import {
  STREET_ORIGINS,
  streetLayout,
  streetHeight,
  streetPoint,
} from './street-layout';

export function districtGraph(index: number): RoadGraph {
  const graph = createGraph(),
    o = STREET_ORIGINS[index],
    config = streetLayout[index];
  // Stable intersection IDs keep signal timing and inter-district connections compatible.
  const logical = graph.nodes.map((n) => ({ x: n.x + o.x, z: n.z + o.z }));
  graph.edges = graph.edges.filter(
    (e) => !config.omitted.some(([a, b]) => e.a === a && e.b === b),
  );
  for (const [a, b] of config.diagonals) graph.edges.push({ a, b, length: 0 });
  for (const node of graph.nodes) {
    Object.assign(node, streetPoint(logical[node.id].x, logical[node.id].z));
    node.neighbors = [];
  }
  for (const edge of graph.edges) {
    const a = logical[edge.a],
      b = logical[edge.b],
      count = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 8);
    edge.path = Array.from({ length: count + 1 }, (_, i) =>
      streetPoint(
        a.x + ((b.x - a.x) * i) / count,
        a.z + ((b.z - a.z) * i) / count,
      ),
    );
    edge.width = config.width;
    edge.length = edge.path
      .slice(1)
      .reduce(
        (sum, p, i) =>
          sum + Math.hypot(p.x - edge.path![i].x, p.z - edge.path![i].z),
        0,
      );
    graph.nodes[edge.a].neighbors.push(edge.b);
    graph.nodes[edge.b].neighbors.push(edge.a);
  }
  return graph;
}
export function edgePoints(
  graph: RoadGraph,
  edge: RoadEdge,
): readonly RoadPosition[] {
  return edge.path ?? [graph.nodes[edge.a], graph.nodes[edge.b]];
}
export function edgeFrame(graph: RoadGraph, edge: RoadEdge, fraction = 0.5) {
  const points = edgePoints(graph, edge);
  let distance = edge.length * fraction;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      length = Math.hypot(b.x - a.x, b.z - a.z);
    if (distance <= length || i === points.length - 1) {
      const t = Math.max(0, Math.min(1, distance / length));
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
        dx: (b.x - a.x) / length,
        dz: (b.z - a.z) / length,
      };
    }
    distance -= length;
  }
  throw Error('Strada senza segmenti.');
}

/** Put each signal in a clear wedge, including intersections with diagonal arms. */
export function signalPositions(graph: RoadGraph, id: number) {
  const node = graph.nodes[id],
    edges = graph.edges.filter((e) =>
      edgePoints(graph, e).some(
        (p) => (p.x - node.x) ** 2 + (p.z - node.z) ** 2 < 75 ** 2,
      ),
    ),
    local = { nodes: graph.nodes, edges };
  return [0, 1].map((axis) => {
    let selected = { x: node.x, z: node.z },
      best = -Infinity;
    for (const radius of [22, 28, 35, 42]) {
      for (const delta of [
        -0.9, -0.75, -0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75,
        0.9,
      ]) {
        const angle = (axis ? Math.PI / 4 : (-3 * Math.PI) / 4) + delta,
          x = node.x + Math.cos(angle) * radius,
          z = node.z + Math.sin(angle) * radius,
          p = nearestRoad(local, x, z),
          clear = Math.hypot(x - p.x, z - p.z);
        const score = clear - radius * 0.12;
        if (score > best) {
          best = score;
          selected = { x, z };
        }
      }
      if (best > 11) break;
    }
    return { ...selected, y: streetHeight(selected.x, selected.z) };
  });
}
