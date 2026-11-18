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
  path?: RoadPosition[];
  width?: number;
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

function projectRoad(graph: RoadGraph, x: number, z: number) {
  let best = Infinity,
    bestEndpoint = false,
    result = { edge: graph.edges[0], segment: 0, t: 0, x, z, along: 0 };
  for (const edge of graph.edges) {
    const points = edge.path ?? [graph.nodes[edge.a], graph.nodes[edge.b]];
    let along = 0;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        dx = b.x - a.x,
        dz = b.z - a.z,
        length = Math.hypot(dx, dz);
      if (length < 1e-8) continue;
      const t = Math.max(
        0,
        Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (length * length)),
      );
      const px = a.x + dx * t,
        pz = a.z + dz * t,
        d = (px - x) ** 2 + (pz - z) ** 2;
      const endpoint =
        (i === 1 && t < 1e-8) || (i === points.length - 1 && t > 1 - 1e-8);
      if (
        d < best - 1e-10 ||
        (Math.abs(d - best) < 1e-10 && endpoint && !bestEndpoint)
      ) {
        best = d;
        bestEndpoint = endpoint;
        result = {
          edge,
          segment: i - 1,
          t,
          x: px,
          z: pz,
          along: along + length * t,
        };
      }
      along += length;
    }
  }
  return result;
}
export function nearestRoad(
  graph: RoadGraph,
  x: number,
  z: number,
): RoadPosition {
  const p = projectRoad(graph, x, z);
  return { x: p.x, z: p.z };
}

export function findPath(
  graph: RoadGraph,
  start: number,
  goal: number,
): number[] {
  if (!graph.nodes[start] || !graph.nodes[goal]) return [];
  const weights = new Map(
    graph.edges.flatMap(
      (e) =>
        [
          [`${e.a}:${e.b}`, e.length],
          [`${e.b}:${e.a}`, e.length],
        ] as const,
    ),
  );
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
        (weights.get(`${current}:${next}`) ??
          Math.hypot(node.x - neighbor.x, node.z - neighbor.z));
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
  if (!graph.edges.length) return [];
  const start = projectRoad(graph, position.x, position.z),
    end = projectRoad(graph, target.x, target.z);
  const nodes = graph.nodes.map((n) => ({ ...n, neighbors: [...n.neighbors] })),
    edges = [...graph.edges];
  const startId = nodes.length,
    endId = startId + 1;
  nodes.push(
    { id: startId, x: start.x, z: start.z, neighbors: [] },
    { id: endId, x: end.x, z: end.z, neighbors: [] },
  );
  const connect = (
    a: number,
    b: number,
    path: RoadPosition[],
    length: number,
  ) => {
    nodes[a].neighbors.push(b);
    nodes[b].neighbors.push(a);
    edges.push({ a, b, path, length });
  };
  for (const [p, id] of [
    [start, startId],
    [end, endId],
  ] as const) {
    const path = p.edge.path ?? [graph.nodes[p.edge.a], graph.nodes[p.edge.b]],
      point = { x: p.x, z: p.z };
    connect(
      id,
      p.edge.a,
      [point, ...path.slice(0, p.segment + 1).reverse()],
      p.along,
    );
    connect(
      id,
      p.edge.b,
      [point, ...path.slice(p.segment + 1)],
      p.edge.length - p.along,
    );
  }
  if (start.edge === end.edge) {
    const path = start.edge.path ?? [
        graph.nodes[start.edge.a],
        graph.nodes[start.edge.b],
      ],
      forward = start.along <= end.along;
    const between = forward
      ? path.slice(start.segment + 1, end.segment + 1)
      : path.slice(end.segment + 1, start.segment + 1).reverse();
    connect(
      startId,
      endId,
      [{ x: start.x, z: start.z }, ...between, { x: end.x, z: end.z }],
      Math.abs(end.along - start.along),
    );
  }
  const ids = findPath({ nodes, edges }, startId, endId),
    result: RoadPosition[] = [];
  for (let i = 1; i < ids.length; i++) {
    const a = ids[i - 1],
      b = ids[i],
      edge = edges.find(
        (e) => (e.a === a && e.b === b) || (e.a === b && e.b === a),
      )!;
    const points = edge.path ?? [nodes[edge.a], nodes[edge.b]],
      path = edge.a === a ? points : [...points].reverse();
    for (const p of path)
      if (
        !result.length ||
        Math.hypot(p.x - result.at(-1)!.x, p.z - result.at(-1)!.z) > 0.001
      )
        result.push({ x: p.x, z: p.z });
  }
  return result;
}
