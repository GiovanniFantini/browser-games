import { generatedMaterial } from '../gen/textures/library';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { asphaltMaterial } from './asphalt';
import { roadPaintMaterial } from './road-paint';
import type { RoadGraph } from './graph';
import { edgeFrame, edgePoints } from './street-network';
import {
  logicalElevation,
  streetPoint,
  streetHeight,
  STREET_ORIGINS,
  TERRAIN_STEP,
  coveredStreet,
} from './street-layout';

function geometry(vertices: number[], indices: number[], paint = false) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  g.setAttribute(
    'uv',
    new THREE.Float32BufferAttribute(
      vertices.flatMap((v, i) =>
        i % 3 === 1 ? [] : [v / (paint ? 1.5 : 120)],
      ),
      2,
    ),
  );
  g.setIndex(indices);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
export function createStreetTerrain(
  root: THREE.Object3D,
  world: RAPIER.World,
  index: number,
) {
  const o = STREET_ORIGINS[index],
    vertices: number[] = [],
    indices: number[] = [],
    count = 90;
  for (let z = 0; z <= count; z++)
    for (let x = 0; x <= count; x++) {
      const lx = o.x - 540 + x * TERRAIN_STEP,
        lz = o.z - 540 + z * TERRAIN_STEP,
        p = streetPoint(lx, lz);
      vertices.push(p.x, logicalElevation(lx, lz) - 0.3, p.z);
    }
  for (let z = 0; z < count; z++)
    for (let x = 0; x < count; x++) {
      const n = z * (count + 1) + x;
      indices.push(
        n,
        n + count + 1,
        n + 1,
        n + 1,
        n + count + 1,
        n + count + 2,
      );
    }
  const material = new THREE.MeshStandardMaterial({
    color: index === 2 ? 0x263f31 : 0x303b3d,
    roughness: 0.92,
  });
  const mesh = new THREE.Mesh(geometry(vertices, indices), material);
  mesh.name = 'urban-terrain-' + index;
  mesh.receiveShadow = true;
  root.add(mesh);
  return world.createCollider(
    RAPIER.ColliderDesc.trimesh(
      new Float32Array(vertices),
      new Uint32Array(indices),
    ).setFriction(1),
  );
}
/** A single sampled network supplies asphalt, kerbs, collision surfaces and road paint. */
export function createStreetSurfaces(
  root: THREE.Object3D,
  world: RAPIER.World,
  graph: RoadGraph,
  index: number,
) {
  const road: number[] = [],
    ri: number[] = [],
    walk: number[] = [],
    wi: number[] = [],
    white: number[] = [],
    wpi: number[] = [],
    yellow: number[] = [],
    ypi: number[] = [];
  const point = (buffer: number[], x: number, z: number, height: number) =>
    buffer.push(x, streetHeight(x, z) + height, z);
  const paint = (
    x: number,
    z: number,
    dx: number,
    dz: number,
    length: number,
    width: number,
    amber = false,
  ) => {
    const v = amber ? yellow : white,
      ids = amber ? ypi : wpi,
      n = v.length / 3;
    for (const [along, side] of [
      [-length / 2, -width / 2],
      [-length / 2, width / 2],
      [length / 2, -width / 2],
      [length / 2, width / 2],
    ])
      point(v, x + dx * along + dz * side, z + dz * along - dx * side, 0.045);
    ids.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
  };
  const lampTransforms: THREE.Matrix4[] = [],
    dummy = new THREE.Object3D();
  for (const edge of graph.edges) {
    const path = edgePoints(graph, edge),
      width = edge.width ?? 24,
      cols = 5,
      start = road.length / 3;
    for (let i = 0; i < path.length; i++) {
      const before = path[Math.max(0, i - 1)],
        after = path[Math.min(path.length - 1, i + 1)],
        len = Math.hypot(after.x - before.x, after.z - before.z),
        dx = (after.x - before.x) / len,
        dz = (after.z - before.z) / len;
      for (let j = 0; j < cols; j++) {
        const offset = (j / (cols - 1) - 0.5) * width;
        point(road, path[i].x + dz * offset, path[i].z - dx * offset, 0.015);
      }
      if (i)
        for (let j = 0; j < cols - 1; j++) {
          const n = start + (i - 1) * cols + j;
          ri.push(n, n + cols, n + 1, n + 1, n + cols, n + cols + 1);
        }
    }
    const incident = graph.edges.filter(
      (e) =>
        e !== edge &&
        (e.a === edge.a || e.b === edge.a || e.a === edge.b || e.b === edge.b),
    );
    const crossing = (x: number, z: number) =>
      incident.some((other) => {
        const points = edgePoints(graph, other);
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1],
            b = points[i],
            dx = b.x - a.x,
            dz = b.z - a.z,
            t = Math.max(
              0,
              Math.min(
                1,
                ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz),
              ),
            );
          if (
            Math.hypot(x - a.x - dx * t, z - a.z - dz * t) <
            (other.width ?? 24) / 2 + 4.5
          )
            return true;
        }
        return false;
      });
    const diagonal = Math.abs(edge.b - edge.a) === 10;
    const margin = Math.min(edge.length * 0.32, diagonal ? 40 : 25);

    for (
      let distance = margin;
      distance < edge.length - margin;
      distance += 4
    ) {
      const a = edgeFrame(graph, edge, distance / edge.length),
        b = edgeFrame(
          graph,
          edge,
          Math.min(edge.length - margin, distance + 4) / edge.length,
        );
      const length = Math.hypot(b.x - a.x, b.z - a.z),
        x = (a.x + b.x) / 2,
        z = (a.z + b.z) / 2;
      if (length < 0.01) continue;
      for (const side of [-1, 1]) {
        if (
          crossing(
            x + a.dz * side * (width / 2 + 2),
            z - a.dx * side * (width / 2 + 2),
          )
        )
          continue;
        if (distance > margin + 3 && distance < edge.length - margin - 3)
          paint(
            x + a.dz * side * 0.18,
            z - a.dx * side * 0.18,
            a.dx,
            a.dz,
            length + 0.03,
            0.16,
            true,
          );
        paint(
          x + a.dz * side * (width / 2 - 0.7),
          z - a.dx * side * (width / 2 - 0.7),
          a.dx,
          a.dz,
          length + 0.03,
          0.24,
        );
        if (
          distance > margin + 3 &&
          distance < edge.length - margin - 3 &&
          Math.floor(distance / 4) % 3 === 0
        )
          paint(
            x + (a.dz * side * width) / 4,
            z - (a.dx * side * width) / 4,
            a.dx,
            a.dz,
            Math.min(4, length),
            0.28,
          );
        const n = walk.length / 3;
        for (const [p, offset] of [
          [a, width / 2 + 0.25],
          [a, width / 2 + 3.75],
          [b, width / 2 + 0.25],
          [b, width / 2 + 3.75],
        ] as const)
          point(
            walk,
            p.x + p.dz * offset * side,
            p.z - p.dx * offset * side,
            0.16,
          );
        if (side > 0) wi.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
        else wi.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
        for (const offset of [width / 2 + 0.25, width / 2 + 3.75]) {
          const k = walk.length / 3;
          for (const [p, h] of [
            [a, -0.3],
            [a, 0.16],
            [b, -0.3],
            [b, 0.16],
          ] as const)
            point(
              walk,
              p.x + p.dz * offset * side,
              p.z - p.dx * offset * side,
              h,
            );
          wi.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
        }
      }
    }
    for (const end of [0, 1]) {
      const f = edgeFrame(
        graph,
        edge,
        end === 0 ? margin / edge.length : 1 - margin / edge.length,
      );
      for (
        let offset = -width / 2 + 1.4;
        offset < width / 2 - 0.5;
        offset += 1.6
      ) {
        const x = f.x + f.dz * offset,
          z = f.z - f.dx * offset;
        if (!crossing(x, z)) paint(x, z, f.dx, f.dz, 3.3, 0.65);
      }
    }
    const mid = edgeFrame(graph, edge);
    for (const side of [-1, 1]) {
      const x = mid.x + mid.dz * side * (width / 2 + 2),
        z = mid.z - mid.dx * side * (width / 2 + 2);
      if (coveredStreet(x, z)) continue;
      dummy.position.set(x, streetHeight(x, z) + 4.8, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.22, 9.6, 0.22);
      dummy.updateMatrix();
      lampTransforms.push(dummy.matrix.clone());
    }
  }
  for (const node of graph.nodes) {
    const width =
        graph.edges.find((e) => e.a === node.id || e.b === node.id)?.width ??
        24,
      radius = width * 0.74,
      n = road.length / 3;
    point(road, node.x, node.z, 0.015);
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      point(
        road,
        node.x + Math.cos(angle) * radius,
        node.z + Math.sin(angle) * radius,
        0.015,
      );
      if (i) ri.push(n, n + i + 1, n + i);
    }
  }
  const asphalt = new THREE.Mesh(geometry(road, ri), asphaltMaterial());
  asphalt.name = 'street-asphalt-' + index;
  asphalt.receiveShadow = true;
  root.add(asphalt);
  const sidewalks = new THREE.Mesh(
    geometry(walk, wi),
    generatedMaterial('sidewalk') ??
      new THREE.MeshStandardMaterial({
        color: 0x727774,
        roughness: 0.85,
        side: THREE.DoubleSide,
      }),
  );
  sidewalks.material.side = THREE.DoubleSide;
  sidewalks.name = 'street-sidewalks-' + index;
  sidewalks.receiveShadow = true;
  root.add(sidewalks);
  for (const [v, ids, color, name] of [
    [white, wpi, 0xe9e4d2, 'white'],
    [yellow, ypi, 0xe8b753, 'yellow'],
  ] as const) {
    const mesh = new THREE.Mesh(
      geometry(v, ids, true),
      roadPaintMaterial(color),
    );
    mesh.name = 'street-markings-' + name + '-' + index;
    mesh.receiveShadow = true;
    mesh.renderOrder = 1;
    root.add(mesh);
  }
  const lamps = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x505a5e, roughness: 0.7 }),
    lampTransforms.length,
  );
  const bulbs = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.1, 0.14, 0.7),
    new THREE.MeshBasicMaterial({ color: 0xffd29a }),
    lampTransforms.length,
  );
  lampTransforms.forEach((matrix, i) => {
    lamps.setMatrixAt(i, matrix);
    dummy.matrix.copy(matrix);
    dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
    dummy.position.y += 4.8;
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bulbs.setMatrixAt(i, dummy.matrix);
  });
  root.add(lamps, bulbs);
  return [
    world.createCollider(
      RAPIER.ColliderDesc.trimesh(
        new Float32Array(road.map((v, i) => (i % 3 === 1 ? v - 0.015 : v))),
        new Uint32Array(ri),
      ).setFriction(1),
    ),
    world.createCollider(
      RAPIER.ColliderDesc.trimesh(
        new Float32Array(walk),
        new Uint32Array(wi),
      ).setFriction(1),
    ),
  ];
}
