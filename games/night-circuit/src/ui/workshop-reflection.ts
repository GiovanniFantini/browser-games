import * as THREE from 'three';
/** Original reflection rig, generated from primitives and authored light panels. */
export function createWorkshopReflection(renderer: THREE.WebGLRenderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x101c22);
  const geometries: THREE.BufferGeometry[] = [],
    materials: THREE.Material[] = [];
  const add = (
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    color: THREE.Color,
  ) => {
    const geometry = new THREE.PlaneGeometry(w, h),
      material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, 0);
    room.add(mesh);
    geometries.push(geometry);
    materials.push(material);
  };
  add(8, 2.8, 0, 5, 0, Math.PI / 2, 0, new THREE.Color().setRGB(1.8, 1.7, 1.4));
  add(
    2.5,
    4,
    -5,
    2,
    0,
    0,
    Math.PI / 2,
    new THREE.Color().setRGB(1.0, 1.4, 1.6),
  );
  add(
    1.5,
    3.5,
    5,
    2,
    0,
    0,
    Math.PI / 2,
    new THREE.Color().setRGB(1.4, 1.2, 0.8),
  );
  add(12, 12, 0, -1, 0, Math.PI / 2, 0, new THREE.Color(0x26332f));
  const generator = new THREE.PMREMGenerator(renderer),
    target = generator.fromScene(room, 0.04, 0.1, 100, { size: 64 });
  generator.dispose();
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  return target;
}
