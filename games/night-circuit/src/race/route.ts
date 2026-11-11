import data from '../data/races.json';

export interface Point {
  x: number;
  z: number;
  y?: number;
}
export interface RoutePoint extends Point {
  distance: number;
  dx: number;
  dz: number;
}
export interface Gate extends RoutePoint {
  halfWidth: number;
}
export interface RaceDefinition {
  id: string;
  name: string;
  mode: string;
  laps: number;
  description: string;
  meeting: Point;
  points: number[][];
  turnRadius?: number;
  closed?: boolean;
  opponents?: number;
  targetScore?: number;
  timeLimit?: number;
  hill?: boolean;
  hidden?: boolean;
  district?: string;
  rival?: string;
  rivalPace?: number;
}

export class RaceRoute {
  readonly points: RoutePoint[] = [];
  readonly gates: Gate[] = [];
  readonly closed: boolean;
  length = 0;

  constructor(readonly definition: RaceDefinition) {
    this.closed = definition.closed ?? definition.mode === 'circuit';
    const nodes = definition.points.map(([x, z, y = 0]) => ({ x, z, y }));
    const count = nodes.length;
    const add = (p: Point) => {
      const previous = this.points.at(-1);
      if (previous) {
        const length = Math.hypot(p.x - previous.x, p.z - previous.z);
        if (length < 0.001) return;
        previous.dx = (p.x - previous.x) / length;
        previous.dz = (p.z - previous.z) / length;
        this.length += length;
      }
      this.points.push({
        x: p.x,
        z: p.z,
        y: p.y ?? 0,
        distance: this.length,
        dx: 0,
        dz: 1,
      });
    };
    const line = (p: Point) => {
      const previous = this.points.at(-1);
      if (!previous) {
        add(p);
        return;
      }
      const x = previous.x,
        z = previous.z;
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - x, p.z - z) / 4));
      for (let i = 1; i <= steps; i++)
        add({
          x: x + ((p.x - x) * i) / steps,
          z: z + ((p.z - z) * i) / steps,
          y: (previous.y ?? 0) + (((p.y ?? 0) - (previous.y ?? 0)) * i) / steps,
        });
    };
    for (let i = 0; i < count; i++) {
      const p = nodes[i];
      if (!this.closed && (i === 0 || i === count - 1)) {
        line(p);
        continue;
      }
      const prev = nodes[(i - 1 + count) % count],
        next = nodes[(i + 1) % count];
      const a = Math.hypot(p.x - prev.x, p.z - prev.z),
        b = Math.hypot(next.x - p.x, next.z - p.z);
      const ix = (p.x - prev.x) / a,
        iz = (p.z - prev.z) / a,
        ox = (next.x - p.x) / b,
        oz = (next.z - p.z) / b;
      if (ix * ox + iz * oz > 0.999) {
        line(p);
        continue;
      }
      const radius = Math.min(definition.turnRadius ?? 10, a / 3, b / 3);
      const entry = { x: p.x - ix * radius, z: p.z - iz * radius, y: p.y },
        exit = { x: p.x + ox * radius, z: p.z + oz * radius, y: p.y };
      line(entry);
      for (let j = 1; j <= 10; j++) {
        const t = j / 10,
          s = 1 - t;
        add({
          x: s * s * entry.x + 2 * s * t * p.x + t * t * exit.x,
          z: s * s * entry.z + 2 * s * t * p.z + t * t * exit.z,
          y: p.y,
        });
      }
    }
    if (this.closed) line(this.points[0]);
    const last = this.points.at(-1)!,
      before = this.points.at(-2)!;
    last.dx = before.dx;
    last.dz = before.dz;
    for (
      let distance = data.checkpointSpacing;
      distance < this.length - 25;
      distance += data.checkpointSpacing
    ) {
      const p = this.sample(distance);
      this.gates.push({ ...p, halfWidth: data.gateHalfWidth });
    }
    this.gates.push({
      ...this.sample(this.length),
      distance: this.length,
      halfWidth: data.gateHalfWidth,
    });
  }

  sample(
    distance: number,
    out: RoutePoint = { x: 0, z: 0, distance: 0, dx: 0, dz: 1 },
  ): RoutePoint {
    const d =
      this.closed && distance !== this.length
        ? ((distance % this.length) + this.length) % this.length
        : Math.max(0, Math.min(this.length, distance));
    let lo = 0,
      hi = this.points.length - 2;
    while (lo < hi) {
      const middle = Math.ceil((lo + hi) / 2);
      if (this.points[middle].distance <= d) lo = middle;
      else hi = middle - 1;
    }
    const a = this.points[lo],
      b = this.points[lo + 1],
      t = Math.max(
        0,
        Math.min(
          1,
          (d - a.distance) / Math.max(0.001, b.distance - a.distance),
        ),
      );
    out.x = a.x + (b.x - a.x) * t;
    out.z = a.z + (b.z - a.z) * t;
    out.y = (a.y ?? 0) + ((b.y ?? 0) - (a.y ?? 0)) * t;
    out.distance = d;
    out.dx = a.dx;
    out.dz = a.dz;
    return out;
  }

  project(
    position: Point,
    min = 0,
    max = this.length,
    out: RoutePoint = { x: 0, z: 0, distance: 0, dx: 0, dz: 1 },
  ) {
    let best = Infinity;
    for (let i = 0; i < this.points.length - 1; i++) {
      const a = this.points[i],
        b = this.points[i + 1];
      if (b.distance < min || a.distance > max) continue;
      const length = b.distance - a.distance;
      const t = Math.max(
        0,
        Math.min(
          1,
          ((position.x - a.x) * a.dx + (position.z - a.z) * a.dz) / length,
        ),
      );
      const distance = Math.max(min, Math.min(max, a.distance + t * length));
      const x = a.x + a.dx * (distance - a.distance),
        z = a.z + a.dz * (distance - a.distance);
      const squared = (x - position.x) ** 2 + (z - position.z) ** 2;
      if (squared < best) {
        best = squared;
        out.x = x;
        out.z = z;
        out.y =
          (a.y ?? 0) +
          (((b.y ?? 0) - (a.y ?? 0)) * (distance - a.distance)) / length;
        out.distance = distance;
        out.dx = a.dx;
        out.dz = a.dz;
      }
    }
    return out;
  }
}

export function gateCrossing(
  previous: Point,
  current: Point,
  gate: Gate,
): number | null {
  const from =
    (previous.x - gate.x) * gate.dx + (previous.z - gate.z) * gate.dz;
  const to = (current.x - gate.x) * gate.dx + (current.z - gate.z) * gate.dz;
  if (
    from >= 0 ||
    to < 0 ||
    Math.hypot(current.x - previous.x, current.z - previous.z) > 30
  )
    return null;
  const fraction = -from / (to - from);
  const x = previous.x + (current.x - previous.x) * fraction - gate.x,
    z = previous.z + (current.z - previous.z) * fraction - gate.z;
  return Math.abs(x * gate.dz - z * gate.dx) <= gate.halfWidth
    ? fraction
    : null;
}
