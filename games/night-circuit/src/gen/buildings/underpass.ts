import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { generatedMaterial } from '../textures/library';
import { KitBatch } from './kit';

function arch(
  half: number,
  spring: number,
  rise: number,
  thickness: number,
  depth: number,
) {
  const shape = new THREE.Shape();
  shape.moveTo(-half - thickness, 0);
  shape.lineTo(-half - thickness, spring);
  for (let i = 0; i <= 24; i++) {
    const angle = Math.PI - (i / 24) * Math.PI;
    shape.lineTo(
      Math.cos(angle) * (half + thickness),
      spring + Math.sin(angle) * (rise + thickness),
    );
  }
  shape.lineTo(half + thickness, 0);
  shape.lineTo(half, 0);
  shape.lineTo(half, spring);
  for (let i = 0; i <= 24; i++) {
    const angle = (i / 24) * Math.PI;
    shape.lineTo(Math.cos(angle) * half, spring + Math.sin(angle) * rise);
  }
  shape.lineTo(-half, 0);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    curveSegments: 12,
  });
}
/** Permanent architecture on the existing road: no separate photo scene. */
export function createFoundryUnderpass(
  root: THREE.Object3D,
  world: RAPIER.World,
  z = -302,
) {
  const group = new THREE.Group();
  group.name = 'foundry-underpass';
  root.add(group);
  const masonry =
    generatedMaterial('brick-sand') ??
    new THREE.MeshStandardMaterial({ color: 0x928b69, roughness: 0.92 });
  const concrete =
    generatedMaterial('concrete') ??
    new THREE.MeshStandardMaterial({ color: 0x7e826e, roughness: 0.9 });
  const metal =
    generatedMaterial('corrugated') ??
    new THREE.MeshStandardMaterial({ color: 0x373d35, roughness: 0.7 });
  const rib = arch(16.1, 4.2, 5.3, 0.65, 1.05);
  for (let d = -48; d <= 48; d += 16) {
    const mesh = new THREE.Mesh(rib, masonry);
    mesh.position.z = z + d;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let j = 0; j < 12; j++)
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI,
        b = ((k + 1) / 24) * Math.PI,
        zz = z - 49 + j * 8.25,
        index = positions.length / 3;
      for (const [angle, d] of [
        [a, zz],
        [b, zz],
        [a, zz + 8.25],
        [b, zz + 8.25],
      ]) {
        positions.push(
          Math.cos(angle) * 16.75,
          4.2 + Math.sin(angle) * 5.95,
          d,
        );
        uv.push(angle * 2, d / 4);
      }
      indices.push(
        index,
        index + 1,
        index + 2,
        index + 1,
        index + 3,
        index + 2,
      );
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const ceiling = new THREE.Mesh(geometry, concrete);
  ceiling.material.side = THREE.DoubleSide;
  ceiling.receiveShadow = ceiling.castShadow = true;
  group.add(ceiling);
  const batch = new KitBatch(group);
  for (let d = -48; d <= 48; d += 8) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI,
        b = ((k + 1) / 24) * Math.PI;
      const x1 = Math.cos(a) * 16.6,
        x2 = Math.cos(b) * 16.6;
      const y1 = 4.2 + Math.sin(a) * 5.8,
        y2 = 4.2 + Math.sin(b) * 5.8;
      batch.add(
        'box',
        'iron',
        (x1 + x2) / 2,
        (y1 + y2) / 2,
        z + d,
        Math.hypot(x2 - x1, y2 - y1),
        0.09,
        0.12,
        0,
        0xffffff,
        0,
        Math.atan2(y2 - y1, x2 - x1),
      );
    }
  }
  for (const x of [-13, -9, -4.5, 0, 4.5, 9, 13]) {
    const y = 4.2 + 5.75 * Math.sqrt(1 - (x / 16.5) ** 2);
    batch.add('box', 'iron', x, y, z, 0.16, 0.22, 99);
  }
  for (const side of [-1, 1]) {
    batch.add('box', 'stone', side * 17.3, 2.1, z, 1.5, 4.2, 99);
    batch.add('box', 'stone', side * 15.85, 0.35, z, 0.45, 0.7, 99);
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.75, 2.1, 49.5).setTranslation(
        side * 17.3,
        2.1,
        z,
      ),
    );
    const niche = arch(2.55, 2.1, 1.55, 0.33, 0.2);
    for (let d = -40; d <= 40; d += 16) {
      const mesh = new THREE.Mesh(niche, masonry);
      mesh.rotation.y = (side * Math.PI) / 2;
      mesh.position.set(side * 16.45, 0, z + d);
      group.add(mesh);
      batch.add('box', 'shutter', side * 16.42, 1.75, z + d, 0.12, 3.4, 4.5);
      batch.add('box', 'iron', side * 16.1, 0.45, z + d, 0.4, 0.9, 0.45);
    }
    for (let d = -44; d <= 44; d += 8)
      batch.add('box', 'iron', side * 14.7, 0.45, z + d, 0.11, 0.9, 0.11);
    for (let y = 0.3; y <= 0.9; y += 0.6)
      batch.add('box', 'iron', side * 14.7, y, z, 0.07, 0.06, 96);
  }
  for (let d = -40; d <= 40; d += 16)
    for (const x of [-8.5, 6]) {
      const y = 4.2 + 5.5 * Math.sqrt(1 - (x / 16.5) ** 2);
      batch.add('cylinder', 'iron', x, y - 0.5, z + d, 0.08, 1);
      batch.add('cylinder', 'lit', x, y - 1.04, z + d, 0.75, 0.25);
      batch.add('cylinder', 'iron', x, y - 0.88, z + d, 0.9, 0.12);
    }
  batch.flush();
  // Structural walls must also occlude the road mirror and the vehicle probe.
  group.traverse((object) => object.layers.enable(0));
  // Direction sign generated with the project's own font.
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#123d32';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#b6c4a6';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 112);
    ctx.font = '600 32px "Circuit Grid"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d1dcc1';
    ctx.fillText('BACINI DEL LEVANTE', 256, 51);
    ctx.font = '700 42px "Circuit Grid"';
    ctx.fillText('↑    PORT RIDERS    ↑', 256, 101);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(6.3, 1.58),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
    );
    sign.position.set(-3.5, 6.1, z + 31);
    sign.rotation.y = Math.PI;
    group.add(sign);
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(20, 0.14, 0.2), metal);
    gantry.position.set(0, 7.05, z + 31);
    group.add(gantry);
  }
  return group;
}
