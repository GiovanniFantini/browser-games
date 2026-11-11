import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { KitBatch } from '../gen/buildings/kit';

/** Street-scale foreground details and the foundry district's original entrance arch. */
export function createFoundryAvenue(scene: THREE.Scene, world: RAPIER.World) {
  const root = new THREE.Group();
  root.name = 'foundry-avenue';
  scene.add(root);
  const batch = new KitBatch(root);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x517e87,
    roughness: 0.18,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const paneGeometry = new THREE.PlaneGeometry(5.3, 2.05);
  for (const z of [-156, -36, 84])
    for (const side of [-1, 1]) {
      const x = side * 17.2;
      batch.add('box', 'roof', x, 2.65, z, 3.1, 0.16, 6.6);
      batch.add('box', 'warm-panel', x, 2.55, z, 2.8, 0.04, 6.2);
      for (const dx of [-1.2, 1.2])
        for (const dz of [-2.8, 2.8])
          batch.add('box', 'iron', x + dx, 1.28, z + dz, 0.09, 2.56, 0.09);
      const pane = new THREE.Mesh(paneGeometry, glass);
      pane.position.set(x + side * 1.2, 1.4, z);
      pane.rotation.y = Math.PI / 2;
      root.add(pane);
      batch.add('box', 'metal', x, 0.56, z, 0.65, 0.12, 3.5);
      batch.add('box', 'metal', x + side * 0.25, 0.9, z, 0.1, 0.65, 3.5);
      for (const dz of [-1.2, 1.2])
        batch.add('box', 'iron', x, 0.27, z + dz, 0.5, 0.54, 0.1);
      batch.add(
        'box',
        'billboard',
        x - side * 1.12,
        1.3,
        z + 2.25,
        0.12,
        2.25,
        1.25,
      );
      batch.add(
        'sign',
        'brand-7',
        x - side * 1.57,
        2.86,
        z,
        5.2,
        0.62,
        0.12,
        Math.PI / 2,
      );
      batch.add('cylinder', 'iron', x, 0.5, z - 4.1, 0.65, 1, 0.65);
      for (let i = 0; i < 4; i++) {
        batch.add(
          'box',
          'stone',
          side * 15.6,
          0.3,
          z + 6 + i * 2,
          0.8,
          0.6,
          0.8,
        );
        batch.add(
          'box',
          'iron',
          side * 15.6,
          0.63,
          z + 6 + i * 2,
          0.88,
          0.08,
          0.88,
        );
      }
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.35, 0.6, 2.8).setTranslation(
          x + side * 0.9,
          0.6,
          z,
        ),
      );
    }
  batch.flush();
  const archMaterial = new THREE.MeshStandardMaterial({
    color: 0x40515a,
    metalness: 0.65,
    roughness: 0.42,
  });
  const bandMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.85, 0.5, 0.22),
    toneMapped: false,
  });
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-18, 0, 0),
    new THREE.Vector3(0, 28, 0),
    new THREE.Vector3(18, 0, 0),
  );
  const archGeometry = new THREE.TubeGeometry(curve, 32, 0.24, 6, false);
  const bandGeometry = new THREE.TubeGeometry(curve, 32, 0.045, 4, false);
  for (const z of [-96, -93.8]) {
    const arch = new THREE.Mesh(archGeometry, archMaterial);
    arch.position.z = z;
    arch.castShadow = true;
    root.add(arch);
    const band = new THREE.Mesh(bandGeometry, bandMaterial);
    band.position.set(0, 0.28, z);
    root.add(band);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#10262d';
  c.fillRect(0, 0, 512, 128);
  c.strokeStyle = '#8a9a78';
  c.lineWidth = 3;
  c.strokeRect(5, 5, 502, 118);
  c.textAlign = 'center';
  c.fillStyle = '#f5dfac';
  c.font = '700 53px "Circuit Grid"';
  c.fillText('PORT RIDERS', 256, 60);
  c.font = '700 25px "Circuit Grid"';
  c.fillText('OLD DOCKS  /  FOUNDRY AVENUE', 256, 99);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(16, 2.4, 0.25),
    new THREE.MeshStandardMaterial({
      map,
      emissiveMap: map,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
      roughness: 0.65,
    }),
  );
  sign.position.set(0, 10.8, -94.9);
  root.add(sign);
  for (const side of [-1, 1])
    world.createCollider(
      RAPIER.ColliderDesc.cylinder(1.8, 0.4).setTranslation(
        side * 17,
        1.8,
        -95,
      ),
    );
}
