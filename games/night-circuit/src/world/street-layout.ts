import layout from '../data/street-layout.json' with { type: 'json' };

export const STREET_ORIGINS = [
  { x: 0, z: 0 },
  { x: 1080, z: 0 },
  { x: 1080, z: 1080 },
  { x: 0, z: 1080 },
] as const;
export const streetLayout = layout.districts;
export const streetDistrict = (x: number, z: number) =>
  z > 540 ? (x > 540 ? 2 : 3) : x > 540 ? 1 : 0;
const smooth = (a: number, b: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function influence(x: number, z: number, index: number) {
  const o = STREET_ORIGINS[index],
    u = x - o.x,
    v = z - o.z;
  const edge =
    (1 - smooth(240, 480, Math.abs(u))) * (1 - smooth(240, 480, Math.abs(v)));
  // Keep the authored underpass, docks, tunnel and inter-district portals intact.
  const protectedStreet =
    index === 0
      ? 1 - smooth(55, 210, Math.abs(u))
      : index === 3
        ? (1 - smooth(36, 190, Math.abs(u))) *
          (1 - smooth(240, 480, Math.abs(v)))
        : 0;
  const waterfront = index === 0 ? 1 - smooth(120, 220, u) : 1;
  return edge * (1 - protectedStreet) * waterfront;
}
export function streetPoint(x: number, z: number, out = { x: 0, z: 0 }) {
  const index = streetDistrict(x, z),
    o = STREET_ORIGINS[index],
    c = streetLayout[index];
  const u = x - o.x,
    v = z - o.z,
    f = influence(x, z, index);
  out.x = x + f * c.bend[0] * Math.sin(v / 230 + c.phase) * Math.cos(u / 390);
  out.z = z + f * c.bend[1] * Math.sin(u / 255 - c.phase) * Math.cos(v / 420);
  // Pull the outer avenues into unequal rounded corners; leave portals fixed.
  const rimEnvelope = (a: number) => 1 - smooth(480, 540, Math.abs(a));
  let rim = influenceRim(u, v, index) * c.rim;
  if (index === 0) rim *= 1 - smooth(120, 220, u);
  if (index === 2 && u > 0) rim *= 1 - smooth(0, 300, u);
  if (index === 3 && v > 0) rim *= smooth(24, 80, Math.abs(Math.abs(u) - 240));
  out.x -=
    Math.sign(u) *
    rim *
    smooth(320, 480, Math.abs(u)) *
    smooth(120, 300, Math.abs(v)) *
    rimEnvelope(u) *
    rimEnvelope(v);
  out.z -=
    Math.sign(v) *
    rim *
    smooth(320, 480, Math.abs(v)) *
    smooth(120, 300, Math.abs(u)) *
    rimEnvelope(u) *
    rimEnvelope(v);
  return out;
}
function influenceRim(u: number, v: number, index: number) {
  return 0.72 + 0.28 * Math.sin((u + v) / 310 + index * 1.7) ** 2;
}
export function coveredStreet(x: number, z: number) {
  return (
    (Math.abs(x) < 24 && z > -355 && z < -250) ||
    (Math.abs(x) < 20 && Math.abs(z - 1080) < 252)
  );
}
const inverseSample = { x: 0, z: 0 },
  inverseX = { x: 0, z: 0 },
  inverseZ = { x: 0, z: 0 },
  heightLogical = { x: 0, z: 0 };
export function streetLogical(x: number, z: number, out = { x: 0, z: 0 }) {
  let lx = x,
    lz = z;
  for (let i = 0; i < 10; i++) {
    const p = streetPoint(lx, lz, inverseSample),
      dx = x - p.x,
      dz = z - p.z;
    if (dx * dx + dz * dz < 1e-12) break;
    streetPoint(lx + 0.05, lz, inverseX);
    streetPoint(lx, lz + 0.05, inverseZ);
    const a = (inverseX.x - p.x) / 0.05,
      b = (inverseZ.x - p.x) / 0.05,
      c = (inverseX.z - p.z) / 0.05,
      d = (inverseZ.z - p.z) / 0.05,
      det = a * d - b * c;
    const sx = (d * dx - b * dz) / det,
      sz = (-c * dx + a * dz) / det;
    const scale = Math.min(1, 70 / Math.max(Math.abs(sx), Math.abs(sz)));
    lx += sx * scale;
    lz += sz * scale;
  }
  out.x = lx;
  out.z = lz;
  return out;
}
export function logicalElevation(x: number, z: number) {
  const index = streetDistrict(x, z),
    o = STREET_ORIGINS[index];
  const u = x - o.x,
    v = z - o.z;
  const hill =
    index === 2 && Math.abs(u) <= 480 && Math.abs(v) <= 480
      ? 55 *
        Math.sin(((u + 480) / 960) * Math.PI) *
        Math.sin(((v + 480) / 960) * Math.PI)
      : 0;
  const c = streetLayout[index],
    f = influence(x, z, index);
  return (
    hill +
    f *
      c.rise *
      (0.5 +
        0.25 * Math.sin(u / 180 + c.phase) +
        0.25 * Math.cos(v / 215 - c.phase))
  );
}
export const TERRAIN_STEP = 12;
const GRID_MIN = -552,
  GRID_SIZE = 183;
const terrain = new Float32Array(GRID_SIZE * GRID_SIZE * 3);
const sample = { x: 0, z: 0 };
for (let iz = 0; iz < GRID_SIZE; iz++)
  for (let ix = 0; ix < GRID_SIZE; ix++) {
    const x = GRID_MIN + ix * TERRAIN_STEP,
      z = GRID_MIN + iz * TERRAIN_STEP,
      i = (iz * GRID_SIZE + ix) * 3;
    streetPoint(x, z, sample);
    terrain[i] = sample.x;
    terrain[i + 1] = logicalElevation(x, z);
    terrain[i + 2] = sample.z;
  }
const cells = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;
function triangleHeight(x: number, z: number, a: number, b: number, c: number) {
  const det =
    (terrain[b + 2] - terrain[c + 2]) * (terrain[a] - terrain[c]) +
    (terrain[c] - terrain[b]) * (terrain[a + 2] - terrain[c + 2]);
  const u =
    ((terrain[b + 2] - terrain[c + 2]) * (x - terrain[c]) +
      (terrain[c] - terrain[b]) * (z - terrain[c + 2])) /
    det;
  const v =
    ((terrain[c + 2] - terrain[a + 2]) * (x - terrain[c]) +
      (terrain[a] - terrain[c]) * (z - terrain[c + 2])) /
    det;
  return u >= -1e-7 && v >= -1e-7 && u + v <= 1 + 1e-7
    ? u * terrain[a + 1] + v * terrain[b + 1] + (1 - u - v) * terrain[c + 1]
    : NaN;
}
/** Barycentric height on the exact warped triangles used by Rapier and the renderer. */
export function streetHeight(x: number, z: number) {
  const l = streetLogical(x, z, heightLogical),
    ax = Math.floor((l.x - GRID_MIN) / TERRAIN_STEP),
    az = Math.floor((l.z - GRID_MIN) / TERRAIN_STEP);
  for (const [dx, dz] of cells) {
    const ix = ax + dx,
      iz = az + dz;
    if (ix < 0 || iz < 0 || ix >= GRID_SIZE - 1 || iz >= GRID_SIZE - 1)
      continue;
    const a = (iz * GRID_SIZE + ix) * 3,
      b = a + 3,
      c = a + GRID_SIZE * 3,
      d = c + 3;
    const first = triangleHeight(x, z, a, c, b);
    if (Number.isFinite(first)) return first;
    const second = triangleHeight(x, z, b, c, d);
    if (Number.isFinite(second)) return second;
  }
  return logicalElevation(l.x, l.z);
}
export function streetSpawn(x: number, z: number, clearance = 1.15) {
  const p = streetPoint(x, z);
  return [p.x, streetHeight(p.x, p.z) + clearance, p.z] as [
    number,
    number,
    number,
  ];
}
