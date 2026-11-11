import * as THREE from 'three';
import { visualCatalog, type Appearance } from './appearance';

// Follow the exterior of the procedural side panels instead of hiding decals inside wide kits.
export function sideSurfaceX(a: Appearance, y: number, z: number) {
  const width = visualCatalog.slots.kit.options[a.parts.kit].width;
  let x = 0.93;
  if (y >= 0.14 && z >= -0.845 && z <= 0.505) x = Math.max(x, 0.9475);
  if (a.parts.kit && y >= -0.24 && y <= -0.12 && Math.abs(z) <= 0.8)
    x = Math.max(x, 0.99 * width + 0.035);
  if (
    a.parts.kit &&
    y >= -0.05 &&
    y <= 0.17 &&
    (Math.abs(z - 1.33) <= 0.47 || Math.abs(z + 1.33) <= 0.47)
  )
    x = Math.max(x, 0.94 * width + 0.07);
  const skirtHeight = 0.14 + a.parts.skirts * 0.025;
  if (Math.abs(z) <= 1.35 && Math.abs(y + 0.14) <= skirtHeight / 2)
    x = Math.max(x, 0.94 * width + (0.12 + a.parts.skirts * 0.045) / 2);
  if (
    a.parts.kit === 5 &&
    Math.abs(z + 0.25) <= 0.75 &&
    Math.abs(y + 0.03) <= 0.12
  )
    x = Math.max(x, 1.145);
  if (
    a.parts.kit === 3 &&
    Math.abs(z + 1.3) <= 0.6 &&
    Math.abs(y - 0.17) <= 0.065
  )
    x = Math.max(x, 1.13);
  if (a.parts.kit === 2 && Math.abs(z - 1.1) <= 0.2)
    for (let i = 0; i < 3; i++)
      if (Math.abs(y - (0.05 + i * 0.08)) < 0.045) x = Math.max(x, 1.085);
  return x + 0.006;
}
export function sideVinylGeometry(a: Appearance, left: boolean) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [],
    columns = 120,
    rows = 16;
  for (let row = 0; row <= rows; row++)
    for (let col = 0; col <= columns; col++) {
      const u = col / columns,
        v = row / rows,
        z = (left ? -1 : 1) * (1.9 - u * 3.8),
        y = -0.13 + 0.29 * v;
      positions.push(sideSurfaceX(a, y, z) * (left ? -1 : 1), y, z);
      uvs.push(u, v);
    }
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      const i = row * (columns + 1) + col;
      indices.push(
        i,
        i + 1,
        i + columns + 1,
        i + 1,
        i + columns + 2,
        i + columns + 1,
      );
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
