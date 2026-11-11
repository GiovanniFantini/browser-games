import * as THREE from 'three';
import { workshopTubes, workshopTubeRadiance } from './workshop-fixtures';
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
  for (const tube of workshopTubes)
    add(
      tube.width,
      tube.depth,
      tube.x,
      tube.y - 0.7,
      tube.z,
      Math.PI / 2,
      0,
      new THREE.Color().setRGB(...workshopTubeRadiance),
    );
  for (const x of [-3, 3])
    add(
      2.8,
      0.09,
      x,
      3.65 - 0.7,
      -5.55,
      0,
      0,
      new THREE.Color().setRGB(1.4, 1.3, 1.0),
    );
  add(12, 12, 0, -0.7, 0, Math.PI / 2, 0, new THREE.Color(0x26332f));
  const generator = new THREE.PMREMGenerator(renderer),
    target = generator.fromScene(room, 0.01, 0.1, 100, { size: 128 });
  generator.dispose();
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  return target;
}
