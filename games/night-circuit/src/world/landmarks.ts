import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { batchBodywork } from '../vehicle/bodywork';
/** Original neighborhood landmarks occupy reserved lots, never the drivable road grid. */
export function landmark(
  parent: THREE.Group,
  world: RAPIER.World,
  colliders: RAPIER.Collider[],
  style: string,
  x: number,
  y: number,
  z: number,
  color: string,
) {
  const root = new THREE.Group();
  parent.add(root);
  const wall = new THREE.MeshStandardMaterial({
      color: 0x485466,
      roughness: 0.72,
    }),
    glass = new THREE.MeshPhysicalMaterial({
      color: 0x448c91,
      metalness: 0.55,
      roughness: 0.22,
    }),
    accent = new THREE.MeshBasicMaterial({ color }),
    trim = new THREE.MeshStandardMaterial({ color: 0xa0aab0 });
  const box = (
    w: number,
    h: number,
    d: number,
    dx: number,
    dy: number,
    dz: number,
    material: THREE.Material = wall,
    solid = false,
  ) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x + dx, y + dy, z + dz);
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    if (solid)
      colliders.push(
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(
            x + dx,
            y + dy,
            z + dz,
          ),
        ),
      );
    return mesh;
  };
  box(56, 1, 56, 0, -0.3, 0, wall, true);
  if (style === 'canopy') {
    // interlocking textile-market roofs and luminous valances
    for (const side of [-1, 1]) {
      box(15, 8, 36, side * 16, 4, 0, wall, true);
      const roof = box(22, 0.8, 42, side * 15, 9, 0, accent);
      roof.rotation.z = side * 0.13;
    }
    for (let i = -2; i <= 2; i++) box(0.7, 8, 0.7, i * 10, 4, 22, trim, true);
  } else if (style === 'screen') {
    box(32, 13, 27, 0, 6.5, 0, wall, true);
    box(34, 18, 1, 0, 23, -9, glass);
    for (let i = 0; i < 5; i++) box(30, 0.45, 1.2, 0, 16 + i * 3, -8.4, accent);
    box(40, 2, 33, 0, 14, 0, trim);
  } else if (style === 'skyframe') {
    for (const side of [-1, 1]) {
      box(9, 32, 18, side * 19, 16, 0, wall, true);
      box(1, 34, 20, side * 24, 17, 0, accent);
    }
    box(48, 5, 15, 0, 28, 0, glass);
    box(48, 0.5, 17, 0, 31, 0, accent);
  } else if (style === 'terrace') {
    for (let i = 0; i < 3; i++) {
      box(46 - i * 10, 5, 36 - i * 7, 0, 2.5 + i * 5, -i * 3, wall, true);
      box(48 - i * 10, 0.5, 38 - i * 7, 0, 5 + i * 5, -i * 3, trim);
    }
    for (let i = -2; i <= 2; i++) box(4, 1.2, 4, i * 8, 6, 15, accent);
  } else if (style === 'glasshouse') {
    box(44, 7, 30, 0, 3.5, 0, glass, true);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(25, 9, 4), glass);
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.72;
    roof.position.set(x, y + 11, z);
    root.add(roof);
    for (let i = -2; i <= 2; i++) box(0.4, 9, 32, i * 9, 4.5, 0, trim);
    box(46, 0.6, 32, 0, 7, 0, accent);
  } else if (style === 'observatory') {
    box(26, 8, 26, 0, 4, 0, wall, true);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(14, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      trim,
    );
    dome.position.set(x, y + 8, z);
    root.add(dome);
    const scope = box(4, 4, 19, 0, 16, 6, glass);
    scope.rotation.x = -0.4;
    box(30, 0.5, 30, 0, 8, 0, accent);
  } else if (style === 'hangar') {
    box(48, 10, 38, 0, 5, 0, wall, true);
    for (let i = -3; i <= 3; i++) {
      box(0.45, 15, 40, i * 7, 7.5, 0, trim);
      box(6, 10, 0.4, i * 7, 5, 19.3, glass);
    }
    box(50, 2, 42, 0, 14, 0, accent);
    box(24, 3, 1, 0, 11, 20, trim);
  } else if (style === 'terminal') {
    box(46, 7, 38, 0, 3.5, 0, glass, true);
    box(54, 1, 44, 0, 8, 0, trim);
    for (const side of [-1, 1]) {
      box(6, 14, 6, side * 22, 7, -15, wall, true);
      box(4, 1, 28, side * 22, 14, -4, accent);
    }
    for (let i = -2; i <= 2; i++) box(2, 4, 11, i * 9, 3, 24, wall, true);
  } else if (style === 'radar') {
    box(23, 16, 23, 0, 8, 0, wall, true);
    box(32, 7, 28, 0, 18, 0, glass);
    box(35, 1, 31, 0, 22, 0, accent);
    box(1.5, 16, 1.5, 0, 30, 0, trim);
    const dish = new THREE.Mesh(
      new THREE.ConeGeometry(10, 3, 12, 1, true),
      trim,
    );
    dish.rotation.z = 0.7;
    dish.position.set(x, y + 34, z);
    root.add(dish);
  }
  batchBodywork(root);
  return root;
}
