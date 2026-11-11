import * as THREE from 'three';
import { generatedMaterial } from '../gen/textures/library';
/** The work bay sits inside a complete original workshop, visible through a full orbit. */
export function createWorkshopStage(scene: THREE.Scene) {
  const concrete =
    generatedMaterial('concrete') ??
    new THREE.MeshStandardMaterial({ color: 0x686b60, roughness: 0.9 });
  const brick =
    generatedMaterial('brick-dark') ??
    new THREE.MeshStandardMaterial({ color: 0x594b42, roughness: 0.9 });
  const metal =
    generatedMaterial('corrugated') ??
    new THREE.MeshStandardMaterial({
      color: 0x405859,
      metalness: 0.4,
      roughness: 0.5,
    });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x1f2726,
    roughness: 0.82,
  });
  const red = new THREE.MeshStandardMaterial({
    color: 0x614237,
    roughness: 0.55,
    metalness: 0.25,
  });
  const silver = new THREE.MeshStandardMaterial({
    color: 0x9ca59b,
    roughness: 0.4,
    metalness: 0.65,
  });
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), concrete);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.03;
  floor.receiveShadow = true;
  scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), brick);
  back.position.set(0, 2.5, -6);
  scene.add(back);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), concrete);
  wall.rotation.y = Math.PI / 2;
  wall.position.set(-6, 2.5, 0);
  scene.add(wall);
  for (const [x, z, yaw] of [
    [0, -11, 0],
    [0, 11, Math.PI],
    [-11, 0, Math.PI / 2],
    [11, 0, -Math.PI / 2],
  ]) {
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(22, 6), brick);
    outer.position.set(x, 3, z);
    outer.rotation.y = yaw;
    scene.add(outer);
    for (let i = -8; i <= 8; i += 4) {
      if (x === 0) box(i, 3, z * 0.99, 0.15, 6, 0.2, metal);
      else box(x * 0.99, 3, i, 0.2, 6, 0.15, metal);
    }
  }
  const shutter = generatedMaterial('shutter') ?? metal;
  box(4.3, 1.7, 10.85, 4.6, 3.4, 0.1, shutter);
  box(10.85, 1.7, 3.7, 0.1, 3.4, 4.2, shutter);
  for (const z of [-8, -4, 0, 4, 8]) {
    box(0, 5.7, z, 22, 0.18, 0.22, metal);
    for (const x of [-6, 6])
      box(
        x,
        5.55,
        z,
        2.6,
        0.08,
        0.28,
        new THREE.MeshBasicMaterial({ color: 0xe1dec2 }),
      );
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), concrete);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 6;
  scene.add(ceiling);
  for (const x of [-4, 0, 4]) {
    box(x, 0.86, -5.55, 1.5, 1.72, 0.65, x === 0 ? red : metal);
    box(x, 1.62, -5.55, 1.65, 0.12, 0.8, silver);
    for (const y of [0.4, 0.85, 1.3]) box(x, y, -5.2, 1.25, 0.025, 0.04, dark);
    box(x, 1.42, -5.13, 0.4, 0.035, 0.05, silver);
  }
  box(-3.4, 1.05, -4.45, 3.8, 0.15, 1.05, metal);
  for (const x of [-4.8, -2]) box(x, 0.5, -4.45, 0.12, 1, 1.0, dark);
  for (let i = 0; i < 3; i++) {
    const tyre = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.115, 6, 18),
      dark,
    );
    tyre.rotation.x = Math.PI / 2;
    tyre.position.set(-4.8, 0.13 + i * 0.23, -2.9);
    scene.add(tyre);
  }
  for (const x of [-3, 3]) {
    box(
      x,
      3.65,
      -5.55,
      2.8,
      0.09,
      0.35,
      new THREE.MeshBasicMaterial({ color: 0xd8d9b5 }),
    );
    box(x, 1.9, -3.6, 0.18, 3.8, 0.3, metal);
  }
  box(0, 3.75, -3.6, 6.2, 0.12, 0.3, metal);
  const stripe = new THREE.MeshBasicMaterial({
    color: 0xb8a65e,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  for (const z of [-2.6, 2.6]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.065), stripe);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.005, z);
    scene.add(line);
  }
  for (const x of [-1.6, 1.6]) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.065, 5.2), stripe);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.005, 0);
    scene.add(line);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#193336';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#8aaf9b';
  ctx.strokeRect(5, 5, 502, 118);
  ctx.fillStyle = '#d9d9b7';
  ctx.font = '700 52px "Circuit Grid"';
  ctx.textAlign = 'center';
  ctx.fillText('TORQEN', 256, 72);
  ctx.font = '400 20px "Circuit Grid"';
  ctx.fillText('PORT RIDERS / NIGHT SERVICE', 256, 106);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.8),
    new THREE.MeshBasicMaterial({ map }),
  );
  sign.position.set(0, 2.8, -5.98);
  scene.add(sign);
}
