import data from '../data/district.json';

export interface RoadNode {
  id: number;
  x: number;
  z: number;
  neighbors: number[];
}
export interface RoadEdge {
  a: number;
  b: number;
  length: number;
}
export interface RoadGraph {
  nodes: RoadNode[];
  edges: RoadEdge[];
}
export interface RoadPosition {
  x: number;
  z: number;
}

export function createGraph(
  coordinates: readonly number[] = data.coordinates,
): RoadGraph {
  const nodes: RoadNode[] = [],
    edges: RoadEdge[] = [];
  const n = coordinates.length;
  for (let z = 0; z < n; z++)
    for (let x = 0; x < n; x++) {
      nodes.push({
        id: z * n + x,
        x: coordinates[x],
        z: coordinates[z],
        neighbors: [],
      });
    }
  const connect = (a: number, b: number) => {
    nodes[a].neighbors.push(b);
    nodes[b].neighbors.push(a);
    edges.push({
      a,
      b,
      length: Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z),
    });
  };
  for (const node of nodes) {
    if (node.id % n < n - 1) connect(node.id, node.id + 1);
    if (node.id + n < nodes.length) connect(node.id, node.id + n);
  }
  return { nodes, edges };
}

export function nearestNode(graph: RoadGraph, x: number, z: number) {
  let best = -1,
    distance = Infinity;
  for (const node of graph.nodes) {
    const d = (node.x - x) ** 2 + (node.z - z) ** 2;
    if (d < distance) {
      distance = d;
      best = node.id;
    }
  }
  return best;
}

export function nearestRoad(
  graph: RoadGraph,
  x: number,
  z: number,
): RoadPosition {
  let best = Infinity,
    resultX = x,
    resultZ = z;
  for (const edge of graph.edges) {
    const a = graph.nodes[edge.a],
      b = graph.nodes[edge.b];
    const dx = b.x - a.x,
      dz = b.z - a.z;
    const t = Math.max(
      0,
      Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)),
    );
    const px = a.x + dx * t,
      pz = a.z + dz * t;
    const distance = (px - x) ** 2 + (pz - z) ** 2;
    if (distance < best) {
      best = distance;
      resultX = px;
      resultZ = pz;
    }
  }
  return { x: resultX, z: resultZ };
}

export function findPath(
  graph: RoadGraph,
  start: number,
  goal: number,
): number[] {
  if (!graph.nodes[start] || !graph.nodes[goal]) return [];
  const open = new Set([start]),
    cameFrom = new Map<number, number>();
  const cost = new Map([[start, 0]]),
    estimate = new Map<number, number>();
  const destination = graph.nodes[goal];
  const heuristic = (id: number) =>
    Math.hypot(
      graph.nodes[id].x - destination.x,
      graph.nodes[id].z - destination.z,
    );
  estimate.set(start, heuristic(start));
  while (open.size) {
    let current = -1,
      score = Infinity;
    for (const id of open)
      if ((estimate.get(id) ?? Infinity) < score) {
        current = id;
        score = estimate.get(id)!;
      }
    if (current === goal) {
      const result = [current];
      while (cameFrom.has(current)) {
        current = cameFrom.get(current)!;
        result.push(current);
      }
      return result.reverse();
    }
    open.delete(current);
    for (const next of graph.nodes[current].neighbors) {
      const node = graph.nodes[current],
        neighbor = graph.nodes[next];
      const candidate =
        cost.get(current)! +
        Math.hypot(node.x - neighbor.x, node.z - neighbor.z);
      if (candidate < (cost.get(next) ?? Infinity)) {
        cameFrom.set(next, current);
        cost.set(next, candidate);
        estimate.set(next, candidate + heuristic(next));
        open.add(next);
      }
    }
  }
  return [];
}

// Navigation starts on the nearest edge and chooses the cheaper endpoint, avoiding arbitrary U-turns.
export function routeFromPosition(
  graph: RoadGraph,
  position: RoadPosition,
  target: RoadPosition,
): RoadPosition[] {
  const start = nearestRoad(graph, position.x, position.z),
    end = nearestRoad(graph, target.x, target.z);
  const nodes = graph.nodes.slice();
  const startId = nodes.length,
    endId = startId + 1;
  nodes.push(
    { id: startId, ...start, neighbors: [] },
    { id: endId, ...end, neighbors: [] },
  );
  const includes = (edge: RoadEdge, point: RoadPosition) => {
    const a = nodes[edge.a],
      b = nodes[edge.b];
    return (
      Math.abs(
        Math.hypot(point.x - a.x, point.z - a.z) +
          Math.hypot(point.x - b.x, point.z - b.z) -
          edge.length,
      ) < 0.01
    );
  };
  const connect = (a: number, b: number) => {
    if (nodes[a] === graph.nodes[a])
      nodes[a] = { ...nodes[a], neighbors: [...nodes[a].neighbors] };
    if (nodes[b] === graph.nodes[b])
      nodes[b] = { ...nodes[b], neighbors: [...nodes[b].neighbors] };
    nodes[a].neighbors.push(b);
    nodes[b].neighbors.push(a);
  };
  for (const edge of graph.edges) {
    const hasStart = includes(edge, start),
      hasEnd = includes(edge, end);
    if (hasStart) {
      connect(startId, edge.a);
      connect(startId, edge.b);
    }
    if (hasEnd) {
      connect(endId, edge.a);
      connect(endId, edge.b);
    }
    if (hasStart && hasEnd) connect(startId, endId);
  }
  return findPath({ nodes, edges: graph.edges }, startId, endId).map((id) => ({
    x: nodes[id].x,
    z: nodes[id].z,
  }));
}
