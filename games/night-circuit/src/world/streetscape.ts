import { createStreetTrees } from './street-trees';
import { lampStarTexture } from '../gen/textures/lamp-star';
import * as THREE from 'three';
import type { RoadGraph } from './graph';
import RAPIER from '@dimforge/rapier3d-compat';
import { createCar } from '../vehicle/model';

export function lightTexture(streak = false) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, '#ffffffdd');
  g.addColorStop(0.15, '#ffffff80');
  g.addColorStop(0.45, '#ffffff22');
  g.addColorStop(1, '#ffffff00');
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  if (streak) {
    const pixels = c.getImageData(0, 0, 256, 256);
    for (let y = 0; y < 256; y++) {
      const opacity =
        0.25 + 0.65 * Math.abs(Math.sin(y * 0.43) * Math.sin(y * 0.137));
      for (let x = 0; x < 256; x++)
        pixels.data[(y * 256 + x) * 4 + 3] *= opacity;
    }
    c.putImageData(pixels, 0, 0);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** Shared old-console light cards and alpha foliage, all painted from code. */
export function createStreetscape(
  scene: THREE.Scene,
  graph: RoadGraph,
  world: RAPIER.World,
) {
  const positions: number[] = [],
    colors: number[] = [];
  const glow = lightTexture(),
    reflection = lightTexture(true);
  const quads = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(5, 19),
    new THREE.MeshBasicMaterial({
      map: reflection,
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    graph.edges.length * 4,
  );
  const treeCanvas = document.createElement('canvas');
  treeCanvas.width = 256;
  treeCanvas.height = 512;
  const ctx = treeCanvas.getContext('2d')!;
  let seed = 19373;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  ctx.fillStyle = '#30352e';
  ctx.fillRect(122, 230, 12, 282);
  for (let n = 0; n < 1300; n++) {
    const y = 22 + rand() * 290;
    const width = 118 * Math.sqrt(Math.max(0, 1 - ((y - 170) / 152) ** 2));
    const x = 128 + (rand() - 0.5) * width * 2;
    ctx.fillStyle = ['#1a2a27', '#243a31', '#2d4438', '#3d5140'][
      Math.floor(rand() * 4)
    ];
    ctx.beginPath();
    ctx.ellipse(x, y, 5 + rand() * 18, 3 + rand() * 10, rand(), 0, Math.PI * 2);
    ctx.fill();
  }
  const treeMap = new THREE.CanvasTexture(treeCanvas);
  treeMap.colorSpace = THREE.SRGBColorSpace;
  const treeMaterial = new THREE.MeshStandardMaterial({
    map: treeMap,
    transparent: false,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
    roughness: 1,
    color: 0x9ca89d,
  });
  const treeCount = graph.edges.length;
  const trees = Array.from(
    { length: 3 },
    () =>
      new THREE.InstancedMesh(
        new THREE.PlaneGeometry(5.5, 10),
        treeMaterial,
        treeCount,
      ),
  );
  const planter = new THREE.InstancedMesh(
    new THREE.BoxGeometry(2.9, 0.5, 2.9),
    new THREE.MeshStandardMaterial({ color: 0x454852, roughness: 0.9 }),
    treeCount,
  );
  const bin = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.9, 1.3, 0.7),
    new THREE.MeshStandardMaterial({
      color: 0x334a48,
      roughness: 0.65,
      metalness: 0.25,
    }),
    treeCount,
  );
  const dummy = new THREE.Object3D(),
    color = new THREE.Color();
  let lamp = 0;
  graph.edges.forEach((edge, i) => {
    const a = graph.nodes[edge.a],
      b = graph.nodes[edge.b],
      vertical = a.x === b.x;
    const x = (a.x + b.x) / 2,
      z = (a.z + b.z) / 2;
    if (vertical && x === 0 && z > -240 && z < 240) {
      const side = i % 2 ? 1 : -1;
      const parked = createCar({
        simple: true,
        color: i % 2 ? '#535a6a' : '#604a42',
        model: 'silex-c1',
      });
      parked.root.position.set(side * 9.6, 0.62, z + 18);
      parked.root.rotation.y = side > 0 ? Math.PI : 0;
      parked.root.traverse((o) => {
        if (o instanceof THREE.Sprite) o.visible = false;
        if (
          o instanceof THREE.Mesh &&
          o.material instanceof THREE.MeshStandardMaterial &&
          o.material.emissiveIntensity > 0
        )
          o.material.emissiveIntensity = 0;
      });
      scene.add(parked.root);
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.95, 0.58, 2.15).setTranslation(
          side * 9.6,
          0.62,
          z + 18,
        ),
      );
    }
    for (const side of [-1, 1]) {
      const lx = x + (vertical ? side * 14 : 0),
        lz = z + (vertical ? 0 : side * 14);
      if (Math.abs(lx) < 24 && lz > -355 && lz < -250) continue;
      const warm = (i + (side > 0 ? 1 : 0)) % 3 !== 0;
      color.setHex(warm ? 0xffb56c : 0x94b7ff);
      positions.push(lx, 9.58, lz);
      colors.push(color.r * 2, color.g * 2, color.b * 2);
      dummy.position.set(
        lx - (vertical ? side * 3 : 0),
        0.028,
        lz - (vertical ? 0 : side * 3),
      );
      dummy.rotation.set(-Math.PI / 2, 0, vertical ? 0 : Math.PI / 2);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      quads.setMatrixAt(lamp, dummy.matrix);
      quads.setColorAt(lamp++, color);
      dummy.position.set(
        x + (vertical ? side * 10 : 14),
        0.032,
        z + (vertical ? 14 : side * 10),
      );
      dummy.scale.set(0.65, 0.7, 1);
      dummy.updateMatrix();
      quads.setMatrixAt(lamp, dummy.matrix);
      color.setHex(i % 2 ? 0x37b4d7 : 0xdb4f8a);
      quads.setColorAt(lamp++, color);
    }
    const side = i % 2 ? 1 : -1,
      tx = x + (vertical ? side * 19 : 13),
      tz = z + (vertical ? 13 : side * 19);
    for (let n = 0; n < 3; n++) {
      dummy.position.set(tx, 5, tz);
      dummy.rotation.set(0, (n * Math.PI) / 3, 0);
      dummy.scale.setScalar(0.7 + rand() * 0.3);
      dummy.updateMatrix();
      trees[n].setMatrixAt(i, dummy.matrix);
    }
    dummy.position.set(tx, 0.25, tz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    planter.setMatrixAt(i, dummy.matrix);
    dummy.position.set(tx + (vertical ? 0 : 3), 0.65, tz + (vertical ? 3 : 0));
    dummy.updateMatrix();
    bin.setMatrixAt(i, dummy.matrix);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const bulbs = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      map: glow,
      size: 8.5,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  bulbs.name = 'street-lamp-halos';
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      map: lampStarTexture(),
      size: 5.0,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  stars.layers.set(1);
  stars.name = 'street-lamp-optical-rays';
  scene.add(stars);
  quads.name = 'wet-street-light-cards';
  scene.add(bulbs, planter, bin);
  createStreetTrees(scene, graph);
  const hoods = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.38, 0.68, 0.25, 8),
    new THREE.MeshStandardMaterial({
      color: 0x252f39,
      roughness: 0.6,
      metalness: 0.4,
    }),
    positions.length / 3,
  );
  for (let i = 0; i < positions.length / 3; i++) {
    dummy.position.set(positions[i * 3], 9.72, positions[i * 3 + 2]);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1.2, 1, 0.65);
    dummy.updateMatrix();
    hoods.setMatrixAt(i, dummy.matrix);
  }
  scene.add(hoods);
  const pools = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(12, 8),
    new THREE.MeshBasicMaterial({
      map: glow,
      color: 0xf3bc70,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    12,
  );
  let p = 0;
  for (let z = -342; z <= -262; z += 16)
    for (const x of [-8.5, 6]) {
      dummy.position.set(x, 0.036, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      pools.setMatrixAt(p++, dummy.matrix);
    }
  scene.add(pools);
  const streetPools = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(14, 17),
    new THREE.MeshBasicMaterial({
      map: glow,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
    positions.length / 3,
  );
  for (let i = 0; i < positions.length / 3; i++) {
    dummy.position.set(positions[i * 3], 0.132, positions[i * 3 + 2]);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    streetPools.setMatrixAt(i, dummy.matrix);
    color.setRGB(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
    streetPools.setColorAt(i, color);
  }
  scene.add(streetPools);
  const craneMaterial = new THREE.MeshStandardMaterial({
    color: 0x141b25,
    roughness: 0.8,
  });
  for (const [x, z, height] of [
    [-180, 500, 37],
    [85, 480, 50],
    [410, 390, 42],
  ]) {
    const part = (
      w: number,
      h: number,
      d: number,
      px: number,
      py: number,
      pz: number,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), craneMaterial);
      m.position.set(px, py, pz);
      scene.add(m);
    };
    part(1.4, height, 1.4, x, height / 2, z);
    part(44, 1.1, 1.4, x + 8, height, z);
    part(2.7, 2.1, 2.5, x + 3, height - 1.7, z);
    part(0.1, height * 0.65, 0.1, x + 28, height * 0.675, z);
    const lines: number[] = [];
    for (let y = 0; y < height; y += 5) {
      lines.push(
        x - 0.8,
        y,
        z - 0.8,
        x + 0.8,
        Math.min(height, y + 5),
        z + 0.8,
        x + 0.8,
        y,
        z - 0.8,
        x - 0.8,
        Math.min(height, y + 5),
        z + 0.8,
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
    scene.add(
      new THREE.LineSegments(
        geo,
        new THREE.LineBasicMaterial({ color: 0x121923 }),
      ),
    );
  }
}
