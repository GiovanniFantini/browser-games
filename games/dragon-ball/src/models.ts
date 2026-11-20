import * as THREE from 'three';
import { ellipsoid, material, mesh } from './geometry.ts';
export { box, ellipsoid, material, mesh } from './geometry.ts';
export { character, type Character } from './characters.ts';

export function giantFish() {
  const fish = new THREE.Group();
  ellipsoid(fish, 0x267b9d, [0.62, 0.82, 1.8], [0, 0, 0], 2);
  ellipsoid(fish, 0xd9f4de, [0.54, 0.48, 1.6], [0, -0.38, 0.08], 1);
  const tail = mesh(new THREE.ConeGeometry(0.76, 1.1, 3), 0xe8813f, fish, 0, 0, -2.05);
  tail.rotation.x = Math.PI / 2; tail.scale.x = 0.24;
  mesh(new THREE.ConeGeometry(0.5, 1, 3), 0x1a587f, fish, 0, 0.83, -0.35).scale.x = 0.2;
  for (const side of [-1, 1]) {
    ellipsoid(fish, 0xfff8d7, [0.09, 0.2, 0.2], [side * 0.53, 0.25, 0.95]);
    ellipsoid(fish, 0x111c27, [0.055, 0.11, 0.11], [side * 0.61, 0.25, 1.0]);
    const fin = mesh(new THREE.ConeGeometry(0.4, 0.9, 3), 0xe8813f, fish, side * 0.66, -0.1, 0);
    fin.rotation.z = side * -1.1; fin.scale.z = 0.25;
  }
  ellipsoid(fish, 0x254456, [0.3, 0.15, 0.09], [0, -0.1, 1.73]);
  return fish;
}

export function dragonBall(parent: THREE.Object3D) {
  const ball = new THREE.Group();
  parent.add(ball);
  const orb = mesh(new THREE.SphereGeometry(0.25, 20, 14), 0xf7a632, ball);
  orb.material = new THREE.MeshStandardMaterial({ color: 0xffae32, roughness: 0.2, metalness: 0.12, emissive: 0xe07713, emissiveIntensity: 0.22 });
  for (const x of [-0.075, 0.075]) for (const y of [-0.075, 0.075]) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const angle = Math.PI / 2 + i * Math.PI / 5;
      const r = i % 2 ? 0.021 : 0.05;
      if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    shape.closePath();
    const star = new THREE.Mesh(new THREE.ShapeGeometry(shape), material(0xaf3d24));
    star.position.set(x, y, 0.248 - (x * x + y * y));
    ball.add(star);
  }
  return ball;
}
