import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { KitBatch } from './kit';
import { lightTexture } from '../../world/streetscape';

/** An original corner diner with a curved canopy, real interior and glazed lantern roof. */
export function createStreetVenue(
  scene: THREE.Object3D,
  world: RAPIER.World,
  x: number,
  z: number,
) {
  const root = new THREE.Group();
  scene.add(root);
  const batch = new KitBatch(root);
  const box = (
    key: string,
    px: number,
    py: number,
    pz: number,
    w: number,
    h: number,
    d: number,
  ) => batch.add('box', key, x + pz, py, z - px, w, h, d, Math.PI / 2);
  box('stone', 0, 0.18, 0, 31, 0.36, 21);
  box('brick', 0, 2.3, 8.5, 30, 4.6, 3);
  box('brick', -14, 2.3, 0, 2, 4.6, 20);
  box('brick', 14, 2.3, 0, 2, 4.6, 20);
  box('stone', 0, 0.6, -9.5, 29, 1.2, 0.4);
  box('stone', 0, 4, -9.5, 30, 0.35, 0.5);
  box('roof', 0, 4.2, 0, 30, 0.25, 20);
  box('stone', 0, 0.42, 0, 27, 0.12, 17);
  box('warm-panel', 0, 3.85, 3, 22, 0.12, 1.3);
  box('red', 0, 1.0, 3, 23, 1.1, 1.2);
  box('stone', 0, 1.6, 3, 23, 0.12, 1.5);
  for (let i = 0; i < 6; i++) {
    const px = -12 + i * 4.8;
    box('iron', px, 2.4, -9.6, 0.1, 3.2, 0.24);
    box('red', px, 0.78, -3, 2.3, 0.4, 1.1);
    box('red', px, 1.22, -2.6, 2.3, 0.8, 0.24);
    box('stone', px, 1.0, -5, 1.8, 0.08, 1.1);
    box('iron', px, 0.72, -5, 0.12, 0.55, 0.12);
    box('lit', px, 3.15, -6, 0.5, 0.12, 0.5);
  }
  for (const p of [-10, 10]) box('stone', p, 2.2, -12, 0.24, 4.4, 0.24);
  for (const side of [-1, 1]) {
    box('iron', side * 7.5, 5.2, 0, 0.12, 1.9, 14);
    box('cyan', side * 7.45, 5.7, 0, 0.08, 1.1, 13.8);
  }
  box('iron', 0, 6.3, 0, 15, 0.12, 14);
  batch.add('sign', 'brand-1', x - 11, 4.6, z, 15, 1.3, 0.16, Math.PI / 2);
  batch.add('cylinder', 'iron', x - 18, 5.4, z + 18, 0.2, 10.8, 0.2);
  batch.add('sign', 'brand-1', x - 18, 10.6, z + 18, 5.4, 1.8, 0.18);
  batch.add('box', 'cyan', x - 18, 9.42, z + 18, 5.5, 0.08, 0.2);
  batch.flush();
  const glazing = new THREE.MeshPhysicalMaterial({
    color: 0x536f73,
    roughness: 0.12,
    metalness: 0.08,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 6; i++) {
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 2.7, 4.6),
      glazing,
    );
    pane.position.set(x - 9.68, 2.45, z + 12 - i * 4.8);
    root.add(pane);
  }
  const roofGlass = new THREE.MeshPhysicalMaterial({
    color: 0x4797a1,
    emissive: 0x316a74,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.2,
  });
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(8.1, 0.08, 14),
      roofGlass,
    );
    panel.position.set(x + side * 3.8, 5.8, z);
    panel.rotation.z = -side * 0.18;
    root.add(panel);
  }
  const outline = new THREE.Shape(),
    w = 34,
    d = 25,
    r = 3;
  outline.moveTo(-w / 2 + r, -d / 2);
  outline.lineTo(w / 2 - r, -d / 2);
  outline.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  outline.lineTo(w / 2, d / 2 - r);
  outline.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  outline.lineTo(-w / 2 + r, d / 2);
  outline.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  outline.lineTo(-w / 2, -d / 2 + r);
  outline.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSize: 0.05,
    bevelThickness: 0.04,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.rotateY(Math.PI / 2);
  const canopy = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: 0x245361,
      metalness: 0.3,
      roughness: 0.35,
    }),
  );
  canopy.position.set(x, 4.05, z);
  canopy.castShadow = canopy.receiveShadow = true;
  root.add(canopy);
  const rim = new THREE.Mesh(geometry, [
    new THREE.MeshBasicMaterial({ color: 0x1b272d }),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.2, 0.36, 0.1),
      toneMapped: false,
    }),
  ]);
  rim.position.set(x, 3.83, z);
  rim.scale.y = 0.25;
  root.add(rim);
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 34),
    new THREE.MeshBasicMaterial({
      map: lightTexture(),
      color: 0xffc485,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x - 14, 0.03, z);
  root.add(pool);
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(10, 2.2, 15).setTranslation(x, 2.2, z),
  );
}
