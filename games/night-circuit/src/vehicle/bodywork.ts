import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Only open panel boundaries, without drawing the triangles inside the skin. */
export function panelSeamGeometry(mesh: THREE.Mesh) {
  const g = mesh.geometry,
    p = g.attributes.position,
    n = g.attributes.normal;
  const edges = new Map<string, { a: number; b: number; count: number }>();
  const keys = Array.from({ length: p.count }, (_, i) =>
    [p.getX(i), p.getY(i), p.getZ(i)].map((v) => v.toFixed(4)).join(','),
  );
  const count = g.index?.count ?? p.count;
  for (let i = 0; i < count; i += 3) {
    const face = [0, 1, 2].map((k) => g.index?.getX(i + k) ?? i + k);
    for (let j = 0; j < 3; j++) {
      const a = face[j],
        b = face[(j + 1) % 3];
      const key = [keys[a], keys[b]].sort().join('/');
      const edge = edges.get(key);
      if (edge) edge.count++;
      else edges.set(key, { a, b, count: 1 });
    }
  }
  const vertices: number[] = [];
  for (const edge of edges.values())
    if (edge.count === 1)
      for (const i of [edge.a, edge.b])
        vertices.push(
          p.getX(i) + n.getX(i) * 0.0018,
          p.getY(i) + n.getY(i) * 0.0018,
          p.getZ(i) + n.getZ(i) * 0.0018,
        );
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  return geometry;
}

export function bodyGeometry(
  width: number,
  design: {
    noseHeight: number;
    frontTaper: number;
    rearTaper: number;
    waist: number;
    deckOffset: number;
  },
  family: string,
) {
  const geometry = new THREE.BufferGeometry(),
    positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const rear =
    family === 'compact' || family === 'suv'
      ? 0.34
      : family === 'coupe' || family === 'super'
        ? 0.15
        : 0.26;
  const rings = [
    [-2.025, (width * design.rearTaper) / 2, rear + design.deckOffset * 0.3],
    [-1.05 + design.deckOffset, width / 2, design.waist + 0.04],
    [0.35, width / 2, design.waist],
    [1.35, width * 0.46, design.noseHeight],
    [2.025, (width * design.frontTaper) / 2, design.noseHeight - 0.1],
  ];
  for (const [z, half, top] of rings)
    for (const [x, y] of [
      [-half, top],
      [half, top],
      [half, -0.16],
      [-half, -0.16],
    ]) {
      positions.push(x, y, z);
      uv.push(x / width + 0.5, z / 4.05 + 0.5);
    }
  for (let r = 0; r < rings.length - 1; r++)
    for (let s = 0; s < 4; s++) {
      const a = r * 4 + s,
        b = r * 4 + ((s + 1) % 4),
        c = a + 4,
        d = b + 4;
      indices.push(a, c, b, b, c, d);
    }
  indices.push(0, 1, 2, 0, 2, 3, 16, 18, 17, 16, 19, 18);
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Merge static siblings only. Every animated pivot and transparent surface stays independent. */
export function batchBodywork(root: THREE.Object3D) {
  const parents: THREE.Object3D[] = [];
  root.traverse((o) => {
    if (o instanceof THREE.Group) parents.push(o);
  });
  for (const parent of parents) {
    const groups = new Map<
      string,
      { material: THREE.Material; meshes: THREE.Mesh[] }
    >();
    for (const object of parent.children) {
      if (
        !(object instanceof THREE.Mesh) ||
        !object.visible ||
        object instanceof THREE.InstancedMesh ||
        object.name ||
        object.children.length ||
        Array.isArray(object.material) ||
        object.material.transparent
      )
        continue;
      const geometry: THREE.BufferGeometry = object.geometry;
      const layout = Object.entries(geometry.attributes)
        .map(
          ([key, a]) =>
            `${key}:${a.itemSize}:${a.normalized}:${(a instanceof THREE.InterleavedBufferAttribute ? a.data.array : a.array).constructor.name}`,
        )
        .sort()
        .join('/');
      const key = `${object.material.uuid}/${!!object.geometry.index}/${layout}`;
      const group: { material: THREE.Material; meshes: THREE.Mesh[] } =
        groups.get(key) ?? {
          material: object.material,
          meshes: [],
        };
      group.meshes.push(object);
      groups.set(key, group);
    }
    for (const { material, meshes } of groups.values()) {
      if (meshes.length < 2) continue;
      const geometries = meshes.map((mesh) => {
        mesh.updateMatrix();
        return mesh.geometry.clone().applyMatrix4(mesh.matrix);
      });
      const merged = mergeGeometries(geometries);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      const batch = new THREE.Mesh(merged, material);
      batch.castShadow = meshes.some((m) => m.castShadow);
      batch.receiveShadow = meshes.some((m) => m.receiveShadow);
      for (const mesh of meshes) {
        parent.remove(mesh);
        mesh.geometry.dispose();
      }
      parent.add(batch);
    }
  }
}
