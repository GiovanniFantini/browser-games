import type { Point } from "../field/geometry";

export interface DistancePath {
  readonly id: string;
  readonly points: readonly Point[];
  readonly cumulative: readonly number[];
  readonly length: number;
}
export interface PathPose extends Point {
  readonly heading: number;
  readonly remaining: number;
}
export function compilePath(id: string, source: readonly Point[]): DistancePath {
  const points: Point[] = [], cumulative: number[] = [];
  let length = 0;
  for (const point of source) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y))
      throw new Error("Non-finite path coordinate");
    const previous = points.at(-1);
    const segment = previous ? Math.hypot(point.x - previous.x, point.y - previous.y) : 0;
    if (previous && segment === 0) continue;
    length += segment;
    if (!Number.isFinite(length)) throw new Error("Non-finite path length");
    points.push({ x: point.x, y: point.y });
    cumulative.push(length);
  }
  if (points.length < 2 || length <= 0) throw new Error("A movement path must have positive length");
  return { id, points, cumulative, length };
}
function positionAt(path: DistancePath, distance: number): Point {
  const d = Math.max(0, Math.min(path.length, distance));
  let low = 1, high = path.points.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (path.cumulative[middle]! < d) low = middle + 1;
    else high = middle;
  }
  const start = path.points[low - 1]!, end = path.points[low]!;
  const ratio = (d - path.cumulative[low - 1]!) /
    (path.cumulative[low]! - path.cumulative[low - 1]!);
  return { x: start.x + (end.x - start.x) * ratio, y: start.y + (end.y - start.y) * ratio };
}
export function pathPose(path: DistancePath, distance: number): PathPose {
  if (!Number.isFinite(distance)) throw new Error("Invalid path distance");
  const d = Math.max(0, Math.min(path.length, distance));
  const before = positionAt(path, d - 3), after = positionAt(path, d + 3);
  return { ...positionAt(path, d), heading: Math.atan2(after.y - before.y, after.x - before.x),
    remaining: path.length - d };
}
