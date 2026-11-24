export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(from: number, to: number, fraction: number): number {
  return from + (to - from) * fraction;
}

export function moveTowards(
  from: number,
  to: number,
  distance: number,
): number {
  return from + clamp(to - from, -distance, distance);
}
