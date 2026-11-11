import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import config from '../data/prototype.json';
import { asphaltMaterial } from './asphalt';

const track = config.track;
const circuitLength = track.halfStraight * 4 + Math.PI * 2 * track.radius;
export function trackPoint(
  distance: number,
  offset = 0,
  out = new THREE.Vector3(),
) {
  let d = ((distance % circuitLength) + circuitLength) % circuitLength;
  const r = track.radius + offset;
  const straight = track.halfStraight * 2;
  if (d < straight) return out.set(r, 0, -track.halfStraight + d);
  d -= straight;
  if (d < Math.PI * track.radius) {
    const angle = d / track.radius;
    return out.set(
      Math.cos(angle) * r,
      0,
      track.halfStraight + Math.sin(angle) * r,
    );
  }
  d -= Math.PI * track.radius;
  if (d < straight) return out.set(-r, 0, track.halfStraight - d);
  d -= straight;
  const angle = Math.PI + d / track.radius;
  return out.set(
    Math.cos(angle) * r,
    0,
    -track.halfStraight + Math.sin(angle) * r,
  );
}

export function createTrack(scene: THREE.Scene, world: RAPIER.World) {
  const standard = (color: number, roughness = 0.7) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.25 });
  const concrete = standard(0x28333f);
  const cyan = new THREE.MeshBasicMaterial({ color: 0x45dce4 });
  const amber = new THREE.MeshBasicMaterial({ color: 0xe8c271 });
  const pink = new THREE.MeshBasicMaterial({ color: 0xcd5b9d });
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    collision = false,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    if (collision)
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2)
          .setTranslation(x, y, z)
          .setFriction(0.5),
      );
    return mesh;
  };
  box(1300, 1, 1300, 0, -0.55, 0, standard(0x101d29), true);
  const roadMaterial = asphaltMaterial();
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  const count = 480;
  for (let i = 0; i <= count; i++) {
    for (const offset of [-track.width / 2, track.width / 2]) {
      const p = trackPoint((i / count) * circuitLength, offset);
      positions.push(p.x, 0.005, p.z);
      uv.push(offset < 0 ? 0 : 1, i / 3);
    }
    if (i < count) {
      const n = i * 2;
      indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();
  const road = new THREE.Mesh(roadGeo, roadMaterial);
  road.receiveShadow = true;
  scene.add(road);
  const dummy = new THREE.Object3D();
  const p = new THREE.Vector3(),
    next = new THREE.Vector3();
  const instanceStrip = (
    offset: number,
    spacing: number,
    width: number,
    length: number,
    material: THREE.Material,
  ) => {
    const total = Math.floor(circuitLength / spacing);
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(width, 0.025, length),
      material,
      total,
    );
    for (let i = 0; i < total; i++) {
      trackPoint((i / total) * circuitLength, offset, p);
      trackPoint((i / total) * circuitLength + 0.2, offset, next);
      dummy.position.set(p.x, 0.035, p.z);
      dummy.rotation.set(0, Math.atan2(next.x - p.x, next.z - p.z), 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(mesh);
  };
  instanceStrip(0, 9, 0.18, 3.8, amber);
  instanceStrip(-11, 3.8, 0.18, 3.9, cyan);
  instanceStrip(11, 3.8, 0.18, 3.9, cyan);
  // Fixed segmented collision barriers follow both edges, including the curves.
  for (const offset of [-13.4, 13.4]) {
    const segments = 240;
    const barrierMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.65, 0.8, circuitLength / segments + 0.3),
      concrete,
      segments,
    );
    const capMesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.68, 0.055, circuitLength / segments + 0.3),
      cyan,
      segments,
    );
    for (let i = 0; i < segments; i++) {
      const distance = ((i + 0.5) / segments) * circuitLength;
      trackPoint(distance, offset, p);
      trackPoint(distance + 0.2, offset, next);
      const angle = Math.atan2(next.x - p.x, next.z - p.z);
      dummy.position.set(p.x, 0.4, p.z);
      dummy.rotation.set(0, angle, 0);
      dummy.updateMatrix();
      barrierMesh.setMatrixAt(i, dummy.matrix);
      const rotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        angle,
      );
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          0.325,
          0.4,
          circuitLength / segments / 2 + 0.15,
        )
          .setTranslation(p.x, 0.4, p.z)
          .setRotation(rotation)
          .setFriction(0.15)
          .setRestitution(0.15),
      );
      dummy.position.y = 0.82;
      dummy.updateMatrix();
      capMesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(barrierMesh, capMesh);
  }
  // Industrial basin and original port structures are scenery outside the drivable ribbon.
  box(
    92,
    0.05,
    212,
    0,
    0.01,
    0,
    new THREE.MeshPhysicalMaterial({
      color: 0x082330,
      metalness: 0.7,
      roughness: 0.16,
      clearcoat: 1,
    }),
  );
  box(9, 1.2, 216, -51, 0.3, 0, concrete);
  box(9, 1.2, 216, 51, 0.3, 0, concrete);
  let seed = track.seed;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const buildingMat = standard(0x1c293b);
  const buildings = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    buildingMat,
    130,
  );
  const windows = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    amber,
    520,
  );
  for (let i = 0; i < 130; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (130 + random() * 240),
      z = (random() - 0.5) * 820;
    const w = 13 + random() * 21,
      d = 12 + random() * 22,
      h = 12 + random() * 85;
    dummy.position.set(x, h / 2, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    buildings.setMatrixAt(i, dummy.matrix);
    for (let row = 0; row < 4; row++) {
      dummy.position.set(
        x - side * (w / 2 + 0.04),
        5 + ((h - 10) * row) / 4,
        z,
      );
      dummy.scale.set(0.1, 0.35, d * 0.74);
      dummy.updateMatrix();
      windows.setMatrixAt(i * 4 + row, dummy.matrix);
    }
  }
  scene.add(buildings, windows);
  dummy.scale.set(1, 1, 1);
  const containerMaterials = [
    standard(0x38656a),
    standard(0x64435d),
    standard(0x7b6645),
  ];
  for (let i = 0; i < 30; i++) {
    const x = (i % 2 ? 1 : -1) * (103 + (i % 3) * 9),
      z = -95 + Math.floor(i / 2) * 14;
    box(6, 3.4, 11, x, 1.7, z, containerMaterials[i % 3]);
    for (let n = 0; n < 4; n++)
      box(6.04, 2.8, 0.08, x, 1.7, z - 4.5 + n * 3, concrete);
  }
  for (let i = 0; i < 28; i++) {
    trackPoint((i / 28) * circuitLength, 16, p);
    box(0.22, 9, 0.22, p.x, 4.5, p.z, concrete);
    box(3, 0.12, 0.45, p.x, 9, p.z, amber);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 13),
      new THREE.MeshBasicMaterial({
        color: i % 3 ? 0x77bec9 : 0xd073a3,
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
      }),
    );
    const center = trackPoint((i / 28) * circuitLength, 7);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(center.x, 0.04, center.z);
    scene.add(glow);
  }
  for (const x of [-33, 33]) {
    box(1.5, 34, 1.5, x, 17, 75, concrete);
    box(44, 1.5, 1.5, x, 34, 75, concrete);
    box(0.16, 23, 0.16, x + 18, 22, 75, amber);
  }
  // Start gantry.
  box(0.9, 9, 0.9, 61, 4.5, -40, concrete);
  box(0.9, 9, 0.9, 89, 4.5, -40, concrete);
  box(29, 2.3, 0.8, 75, 8.5, -40, concrete);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#10202e';
  ctx.fillRect(0, 0, 1024, 128);
  ctx.fillStyle = '#d4ef70';
  ctx.font = '700 64px Rajdhani';
  ctx.textAlign = 'center';
  ctx.fillText('BACINO 09 / NIGHT RUN', 512, 86);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 2),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(canvas),
      side: THREE.DoubleSide,
    }),
  );
  sign.position.set(75, 8.5, -40.45);
  sign.rotation.y = Math.PI;
  scene.add(sign);
  for (let i = 0; i < 12; i++)
    box(1, 0.03, 1.4, 64 + i * 2, 0.03, -40, i % 2 ? concrete : amber);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(14, 24, 12),
    new THREE.MeshBasicMaterial({ color: 0xadc4cd }),
  );
  moon.position.set(-220, 215, 340);
  scene.add(moon);
  const pinkLight = new THREE.PointLight(0xeb75bb, 100, 40, 1.3);
  pinkLight.position.set(85, 7, -20);
  scene.add(pinkLight);
  const blueLight = new THREE.PointLight(0x75e1fa, 140, 45, 1.3);
  blueLight.position.set(70, 9, 60);
  scene.add(blueLight);
  // Distant light strips do not introduce additional real-time lights.
  box(1, 65, 1, 154, 34, 104, pink);
  return { length: circuitLength };
}
