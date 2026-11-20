import * as THREE from 'three';
import { box, character, dragonBall, ellipsoid, giantFish, mesh, type Character } from './models';
import { mountainHouse, turboCar } from './props';

export type Collider = { x: number; z: number; radius: number };
export type Wall = { minX: number; maxX: number; minZ: number; maxZ: number };
export const SPHERE = { x: -13.3, z: -14.4 };
export const FISHING = { x: -22, z: 13 };
const WATER_Y = Math.sin(-28 * 0.075) * 0.7 + Math.cos(10 * 0.11) * 0.5 + Math.sin(-18 * 0.045) * 0.6;
export const LIMIT = 53;
export function ground(x: number, z: number) {
  const base = Math.sin(x * 0.075) * 0.7 + Math.cos(z * 0.11) * 0.5 + Math.sin((x + z) * 0.045) * 0.6;
  const edge = Math.min(18, Math.max(0, Math.hypot(x, z) - 36));
  const homeBlend = 1 - THREE.MathUtils.smoothstep(Math.max(Math.abs(x + 15), Math.abs(z + 13)), 3.5, 5.5);
  const homeGround = Math.sin(-15 * 0.075) * 0.7 + Math.cos(-13 * 0.11) * 0.5 + Math.sin(-28 * 0.045) * 0.6;
  const terrainHeight = THREE.MathUtils.lerp(base + edge * edge * 0.012, homeGround, homeBlend);
  const poolDistance = Math.hypot((x + 28) / 6.3, (z - 10) / 5.3);
  return THREE.MathUtils.lerp(WATER_Y - 0.8, terrainHeight, THREE.MathUtils.smoothstep(poolDistance, 0.65, 1.15));
}
function seeded(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export type World = {
  group: THREE.Group;
  obstacles: THREE.Object3D[];
  colliders: Collider[];
  walls: Wall[];
  goku: Character;
  bulma: Character;
  marker: THREE.Group;
  sphere: THREE.Group;
  car: THREE.Group;
  fish: THREE.Group;
  carriedFish: THREE.Group;
  houseShell: THREE.Group;
  update: (time: number) => void;
};

export function createWorld(): World {
  const group = new THREE.Group();
  const obstacles: THREE.Object3D[] = [];
  const colliders: Collider[] = [];
  const walls: Wall[] = [];
  const random = seeded(414);
  const geometry = new THREE.PlaneGeometry(210, 210, 140, 140);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const colors: number[] = [];
  const color = new THREE.Color();
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i);
    positions.setY(i, ground(x, z));
    color.set(0x38a83e).lerp(new THREE.Color(0x72c641), random() * 0.35);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const terrain = new THREE.Mesh(geometry, new THREE.MeshToonMaterial({ vertexColors: true }));
  terrain.receiveShadow = true;
  group.add(terrain);
  obstacles.push(terrain);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-15, 0, -8), new THREE.Vector3(-10, 0, -3), new THREE.Vector3(-5, 0, 4),
    new THREE.Vector3(8, 0, 9), new THREE.Vector3(19, 0, 4), new THREE.Vector3(28, 0, -8), new THREE.Vector3(36, 0, -28),
  ]);
  const pathPositions: number[] = [], indices: number[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120, point = curve.getPoint(t), tangent = curve.getTangent(t);
    const width = 1.65 + Math.sin(t * 30) * 0.16;
    for (const side of [-1, 1]) {
      const x = point.x + tangent.z * width * side, z = point.z - tangent.x * width * side;
      pathPositions.push(x, ground(x, z) + 0.045, z);
    }
    if (i < 120) { const n = i * 2; indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
  }
  const pathGeometry = new THREE.BufferGeometry();
  pathGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pathPositions, 3));
  pathGeometry.setIndex(indices); pathGeometry.computeVertexNormals();
  const path = new THREE.Mesh(pathGeometry, new THREE.MeshToonMaterial({ color: 0xc9944d, side: THREE.DoubleSide }));
  path.receiveShadow = true; group.add(path);
  const nearPath = (x: number, z: number) => {
    for (let i = 0; i <= 30; i++) { const p = curve.getPoint(i / 30); if (Math.hypot(x - p.x, z - p.z) < 3.3) return true; }
    return false;
  };
  function tree(x: number, z: number, size: number, variant: number) {
    const treeGroup = new THREE.Group(); treeGroup.position.set(x, ground(x, z), z); group.add(treeGroup);
    mesh(new THREE.CylinderGeometry(0.18 * size, 0.29 * size, 3.3 * size, 7), 0x773c23, treeGroup, 0, 1.65 * size, 0);
    colliders.push({ x, z, radius: 0.34 * size });
    if (variant < 0.3) {
      // Tall, narrow broadleaf trees and bamboo replace the park-like firs.
      for (let j = 0; j < 3; j++) {
        mesh(new THREE.CylinderGeometry(0.09, 0.12, 4.8 * size, 6), 0x568c28, treeGroup, (j - 1) * 0.42, 2.4 * size, 0.25);
        ellipsoid(treeGroup, [0x1a6b32, 0x27843a, 0x399e30][j], [1.1 * size, 1.7 * size, 0.8 * size], [(j - 1) * 0.6, (4.1 + j * 0.4) * size, 0]);
      }
    } else {
      const crown = ellipsoid(treeGroup, 0x167336, [1.8 * size, 1.7 * size, 1.8 * size], [0, 4.1 * size, 0]);
      crown.rotation.y = variant;
      ellipsoid(treeGroup, 0x3f9f29, [1.3 * size, 1.3 * size, 1.3 * size], [-0.8 * size, 4.5 * size, 0.4 * size]);
      ellipsoid(treeGroup, 0x2d8e28, [1.2 * size, 1.2 * size, 1.2 * size], [0.9 * size, 4.3 * size, 0.2 * size]);
    }
    for (const child of treeGroup.children) child.userData.cameraFadeGroup = treeGroup;
    obstacles.push(...treeGroup.children);
  }
  for (let i = 0; i < 210; i++) {
    const x = (random() - 0.5) * 117, z = (random() - 0.5) * 115;
    if (nearPath(x, z) || Math.hypot(x + 15, z + 12) < 8 || Math.hypot(x - 8, z - 9) < 6 || Math.hypot(x + 12, z + 1) < 3 || Math.hypot(x + 28, z - 10) < 9 || (x > 0 && x < 34 && z > 13 && z < 40)) continue;
    tree(x, z, 0.75 + random() * 0.8, random());
  }
  // Irregular, tapered ridges: avoid a uniform wall of grey cylinders.
  for (let i = 0; i < 18; i++) {
    const angle = i / 18 * Math.PI * 2;
    const radius = 78 + random() * 34;
    const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius;
    const h = 17 + random() * 24;
    const peak = new THREE.Group(); peak.position.set(x, ground(x, z) - 3, z); group.add(peak);
    const rock = mesh(new THREE.CylinderGeometry(1.5 + random() * 2, 11 + random() * 8, h, 6, 3), i % 2 ? 0x677e8a : 0x7f9093, peak, 0, h / 2, 0);
    rock.rotation.y = random() * 3;
    ellipsoid(peak, 0x327547, [3.6, 2.4, 3.7], [0, h - 0.5, 0]);
    const shoulder = ellipsoid(peak, 0x7a8e8e, [9, h * 0.3, 9], [5, h * 0.26, -3]);
    shoulder.rotation.z = 0.3;
    obstacles.push(rock);
  }
  // Scattered rocks and flowers leave the main route clear.
  const grassGeometry = new THREE.ConeGeometry(0.12, 0.6, 3);
  for (let i = 0; i < 280; i++) {
    const x = (random() - 0.5) * 100, z = (random() - 0.5) * 100;
    if (nearPath(x, z) || Math.hypot(x + 15, z + 12) < 6 || Math.hypot(x + 28, z - 10) < 8) continue;
    if (i % 9 === 0) {
      const scale = 0.4 + random() * 1.3;
      const stone = ellipsoid(group, i % 2 ? 0x929d9e : 0x738783, [scale, scale * 0.7, scale * 0.85], [x, ground(x, z) + scale * 0.2, z]);
      colliders.push({ x, z, radius: scale * 0.8 }); obstacles.push(stone);
    } else {
      const blade = mesh(grassGeometry, i % 3 ? 0x2c8b2d : 0x70ba30, group, x, ground(x, z) + 0.25, z);
      blade.castShadow = false; blade.rotation.z = random() * 0.3;
      if (i % 4 === 0) ellipsoid(group, i % 8 ? 0xffda32 : 0xf64d7c, [0.13, 0.1, 0.13], [x, ground(x, z) + 0.58, z], 0).castShadow = false;
    }
  }
  // The keepsake belongs inside the grandfather's one-room house.
  const home = mountainHouse();
  home.house.position.set(-15, ground(-15, -13), -13); group.add(home.house);
  obstacles.push(...home.shell.children);
  for (const [minX, maxX, minZ, maxZ] of [
    [-18.35, -18.05, -16.3, -9.7], [-11.95, -11.65, -16.3, -9.7],
    [-18.3, -11.7, -16.35, -16.05], [-18.3, -16.3, -9.95, -9.65],
    [-13.7, -11.7, -9.95, -9.65],
  ]) walls.push({ minX, maxX, minZ, maxZ });
  const sphere = dragonBall(home.house); sphere.position.copy(home.spherePosition);
  const lamp = new THREE.PointLight(0xffbd72, 4, 8); lamp.position.set(-15, ground(-15, -13) + 2.8, -13); group.add(lamp);

  const car = turboCar(); car.position.set(11.6, ground(11.6, 10.5), 10.5); car.rotation.y = -0.5; group.add(car);
  colliders.push({ x: 11.6, z: 10.5, radius: 2.2 }); obstacles.push(...car.children);

  // A rocky fishing pool establishes Goku's life in the wilderness.
  const pool = new THREE.Group(); pool.position.set(-28, WATER_Y + 0.02, 10); group.add(pool);
  const water = new THREE.Mesh(new THREE.CircleGeometry(6.3, 48), new THREE.MeshBasicMaterial({ color: 0x159fdb, side: THREE.DoubleSide }));
  water.rotation.x = -Math.PI / 2; water.scale.y = 0.84; pool.add(water);
  colliders.push({ x: -28, z: 10, radius: 5.7 });
  const ripples: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.5 + i * 0.7, 0.54 + i * 0.7, 48), new THREE.MeshBasicMaterial({ color: 0xa5e9ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    ripple.rotation.x = -Math.PI / 2; ripple.position.y = 0.03; ripple.scale.y = 0.84; pool.add(ripple); ripples.push(ripple);
  }
  for (let i = 0; i < 14; i++) {
    const angle = i / 14 * Math.PI * 2;
    if (angle > 0.3 && angle < 1.2) continue;
    const x = -28 + Math.sin(angle) * 6.2, z = 10 + Math.cos(angle) * 5.3;
    const rock = ellipsoid(group, i % 2 ? 0x697e87 : 0x93a4a9, [1.1, 0.7 + random() * 0.6, 0.9], [x, ground(x, z) + 0.25, z]);
    obstacles.push(rock); colliders.push({ x, z, radius: 0.85 });
  }
  const fish = giantFish(); fish.position.set(FISHING.x - 1, ground(FISHING.x, FISHING.z) + 0.35, FISHING.z - 1.4); fish.rotation.z = 0.5; fish.rotation.y = -0.8; group.add(fish);

  // A wooden marker at the edge of this first playable area.
  const sign = new THREE.Group(); sign.position.set(25, ground(25, -3), -3); group.add(sign);
  box(sign, 0x7e654b, [0.15, 2.2, 0.15], [0, 1.1, 0]);
  box(sign, 0xb69b6d, [2, 0.7, 0.15], [0, 2, 0]);
  const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 128;
  const context = canvas.getContext('2d')!; context.fillStyle = '#b69b6d'; context.fillRect(0, 0, 384, 128);
  context.fillStyle = '#3d493b'; context.font = 'bold 32px sans-serif'; context.textAlign = 'center'; context.fillText('VERSO LA VALLE →', 192, 78);
  const signText = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.63), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
  signText.position.set(0, 2, 0.085); sign.add(signText);

  const goku = character('goku'), bulma = character('bulma');
  group.add(goku.root, bulma.root);
  const carriedFish = giantFish(); carriedFish.scale.setScalar(0.8); carriedFish.rotation.z = -Math.PI / 2; carriedFish.rotation.y = 0.25; carriedFish.position.set(-0.55, 2.3, -0.2); goku.root.add(carriedFish); carriedFish.visible = false;
  bulma.root.position.set(8, ground(8, 9), 9); bulma.root.rotation.y = -1.7;
  const marker = new THREE.Group(); group.add(marker);
  const diamond = mesh(new THREE.OctahedronGeometry(0.24), 0xe8a34d, marker, 0, 0, 0);
  diamond.material = new THREE.MeshBasicMaterial({ color: 0xf0ab4b });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.61, 40), new THREE.MeshBasicMaterial({ color: 0xf4d99b, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; marker.add(ring); ring.position.y = -3.5;

  const clouds: THREE.Group[] = [];
  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group(); cloud.position.set((random() - 0.5) * 220, 35 + random() * 25, (random() - 0.5) * 220);
    for (let j = 0; j < 4; j++) {
      const puff = ellipsoid(cloud, 0xffffff, [4 + random() * 3, 1.3 + random(), 2.3], [(j - 1.5) * 4, random() * 0.7, 0]);
      puff.castShadow = false; puff.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    }
    group.add(cloud); clouds.push(cloud);
  }
  return { group, obstacles, colliders, walls, goku, bulma, marker, sphere, car, fish, carriedFish, houseShell: home.shell, update(time) {
    ripples.forEach((ripple, i) => { ripple.scale.setScalar(0.85 + Math.sin(time * 1.2 + i) * 0.08); });
    fish.rotation.x = Math.sin(time * 3) * 0.04;
    diamond.rotation.y = time * 0.8; diamond.position.y = Math.sin(time * 2.6) * 0.13;
    sphere.rotation.y = Math.sin(time * 0.45) * 0.45;
    bulma.animate(time, 0);
    clouds.forEach((cloud, i) => { cloud.position.x += Math.sin(time * 0.02 + i) * 0.0015; });
  } };
}
