import * as THREE from 'three';

const gradient = new THREE.DataTexture(new Uint8Array([80, 155, 225, 255]), 4, 1, THREE.RedFormat);
gradient.minFilter = THREE.NearestFilter; gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;
const palette = new Map<number, THREE.MeshToonMaterial>();
export function material(color: number) {
  if (!palette.has(color)) palette.set(color, new THREE.MeshToonMaterial({ color, gradientMap: gradient }));
  return palette.get(color)!;
}
export function mesh(geometry: THREE.BufferGeometry, color: number, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(geometry, material(color));
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
export function box(parent: THREE.Object3D, color: number, size: [number, number, number], pos: [number, number, number]) {
  return mesh(new THREE.BoxGeometry(...size), color, parent, ...pos);
}
export function ellipsoid(parent: THREE.Object3D, color: number, scale: [number, number, number], pos: [number, number, number], detail = 1) {
  const object = mesh(new THREE.IcosahedronGeometry(1, detail), color, parent, ...pos);
  object.scale.set(...scale);
  return object;
}
