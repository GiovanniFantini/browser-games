import * as THREE from 'three';
import { generatedMaterial } from '../textures/library';

export const MODULES = [
  'plinth',
  'shopfront',
  'cafe-front',
  'garage-door',
  'brick-floor',
  'plaster-floor',
  'office-floor',
  'glass-floor',
  'stone-pier',
  'cornice',
  'parapet',
  'flat-roof',
  'pitched-roof',
  'warehouse',
  'fire-escape',
  'awning',
  'air-conditioner',
  'roof-chiller',
  'blade-sign',
  'roof-billboard',
  'water-tank',
  'antenna',
  'chimney',
  'balcony',
  'doorway',
  'drainpipe',
  'loading-dock',
  'skylight',
  'roof-vent',
  'planter',
  'bollard',
] as const;
export type ModuleId = (typeof MODULES)[number];
const geometries = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sign: (() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, 0.28 + uv.getY(i) * 0.42);
    return g;
  })(),
  cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 4),
  sphere: new THREE.SphereGeometry(0.5, 8, 5),
};
type Shape = keyof typeof geometries;
const materialCache = new Map<string, THREE.MeshStandardMaterial>();
function material(key: string) {
  const cached = materialCache.get(key);
  if (cached) return cached;
  const texture =
    key === 'shop'
      ? 'storefront'
      : key === 'billboard'
        ? 'billboard'
        : key === 'sign-cyan'
          ? 'sign-cyan'
          : key === 'sign-pink'
            ? 'sign-pink'
            : key === 'brick'
              ? 'brick-russet'
              : key === 'sand'
                ? 'brick-sand'
                : key === 'stone'
                  ? 'concrete'
                  : key === 'floor'
                    ? 'facade-amber'
                    : key === 'rose'
                      ? 'facade-rose'
                      : key === 'metal'
                        ? 'corrugated'
                        : key === 'shutter'
                          ? 'shutter'
                          : key === 'glass'
                            ? 'glass'
                            : undefined;
  const mat = texture ? generatedMaterial(texture) : undefined;
  const result =
    mat ??
    new THREE.MeshStandardMaterial({
      color:
        key === 'iron'
          ? 0x273331
          : key === 'roof'
            ? 0x383e39
            : key === 'lit'
              ? 0xf4d4a0
              : key === 'cyan'
                ? 0x72c9c0
                : key === 'red'
                  ? 0xb36e55
                  : 0x8e8c78,
      roughness: 0.8,
    });
  if (key === 'lit' || key === 'cyan') {
    result.emissive.copy(result.color);
    result.emissiveIntensity = key === 'lit' ? 1.3 : 1.6;
  }
  if (key === 'shop') {
    result.emissiveIntensity = 1.2;
  }
  if (key === 'sign-cyan' || key === 'sign-pink') result.emissiveIntensity = 3;
  if (key === 'glass') {
    result.roughness = 0.3;
    result.metalness = 0.25;
  }
  materialCache.set(key, result);
  return result;
}
interface Item {
  matrix: THREE.Matrix4;
  color: THREE.Color;
}
export class KitBatch {
  private readonly entries = new Map<
    string,
    { shape: Shape; material: string; items: Item[] }
  >();
  private readonly dummy = new THREE.Object3D();
  readonly used = new Set<ModuleId>();
  constructor(readonly root: THREE.Group) {}
  add(
    shape: Shape,
    key: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d = w,
    angle = 0,
    tint = 0xffffff,
    rx = 0,
    rz = 0,
  ) {
    const id = shape + ':' + key;
    let entry = this.entries.get(id);
    if (!entry) {
      entry = { shape, material: key, items: [] };
      this.entries.set(id, entry);
    }
    this.dummy.position.set(x, y, z);
    this.dummy.scale.set(w, h, d);
    this.dummy.rotation.set(rx, angle, rz);
    this.dummy.updateMatrix();
    entry.items.push({
      matrix: this.dummy.matrix.clone(),
      color: new THREE.Color(tint),
    });
  }
  flush() {
    for (const { shape, material: key, items } of this.entries.values()) {
      const mesh = new THREE.InstancedMesh(
        geometries[shape],
        material(key),
        items.length,
      );
      items.forEach((item, i) => {
        mesh.setMatrixAt(i, item.matrix);
        mesh.setColorAt(i, item.color);
      });
      mesh.castShadow = key !== 'lit' && key !== 'cyan';
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      this.root.add(mesh);
    }
    this.entries.clear();
  }
}
export interface BuildingSpec {
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  district: number;
  seed: number;
}
export class BuildingKit {
  private facadeAxis = 0;
  private get w() {
    return this.facadeAxis ? this.spec.depth : this.spec.width;
  }
  private get d() {
    return this.facadeAxis ? this.spec.width : this.spec.depth;
  }
  private readonly wall: string;
  constructor(
    private readonly batch: KitBatch,
    private readonly spec: BuildingSpec,
  ) {
    this.wall =
      spec.district === 1
        ? 'rose'
        : spec.district === 2
          ? 'sand'
          : spec.seed % 3 === 0
            ? 'sand'
            : 'brick';
  }
  private box(
    key: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d = w,
    angle = 0,
    rx = 0,
    rz = 0,
  ) {
    this.batch.add(
      'box',
      key,
      this.spec.x + (this.facadeAxis ? z : x),
      this.spec.y + y,
      this.spec.z + (this.facadeAxis ? -x : z),
      w,
      h,
      d,
      angle + (this.facadeAxis ? Math.PI / 2 : 0),
      0xffffff,
      rx,
      rz,
    );
  }
  private cylinder(
    key: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d = w,
    angle = 0,
    rx = 0,
    rz = 0,
  ) {
    this.batch.add(
      'cylinder',
      key,
      this.spec.x + (this.facadeAxis ? z : x),
      this.spec.y + y,
      this.spec.z + (this.facadeAxis ? -x : z),
      w,
      h,
      d,
      angle + (this.facadeAxis ? Math.PI / 2 : 0),
      0xffffff,
      rx,
      rz,
    );
  }
  module(id: ModuleId, y = 0, side = 1) {
    this.batch.used.add(id);
    const w = this.w,
      d = this.d,
      edge = side * (d / 2 + 0.08);
    switch (id) {
      case 'plinth':
        this.box('stone', 0, 0.4, 0, w + 0.18, 0.8, d + 0.18);
        break;
      case 'brick-floor':
      case 'plaster-floor':
      case 'office-floor':
      case 'glass-floor': {
        this.box(
          id === 'brick-floor'
            ? this.wall
            : id === 'plaster-floor'
              ? 'floor'
              : id === 'office-floor'
                ? 'rose'
                : 'glass',
          0,
          y + 1.65,
          0,
          w,
          3.3,
          d,
        );
        this.box('stone', 0, y + 0.05, 0, w + 0.12, 0.13, d + 0.12);
        for (const x of [-w / 2 + 0.15, w / 2 - 0.15])
          this.box(this.wall, x, y + 1.65, (side * d) / 2, 0.48, 3.3, 0.3);
        if (id === 'brick-floor') {
          const axis = this.facadeAxis;
          for (let face = 0; face < 2; face++) {
            this.facadeAxis = face;
            for (const side of [-1, 1])
              for (let x = -this.w / 2 + 2.5; x < this.w / 2 - 1; x += 4.5) {
                const lit =
                  (Math.floor(x * 3) + Math.floor(y) * 7 + this.spec.seed) % 5 <
                  2;
                this.box(
                  'iron',
                  x,
                  y + 1.8,
                  side * (this.d / 2 + 0.04),
                  1.9,
                  1.9,
                  0.12,
                );
                this.box(
                  lit ? 'shop' : 'glass',
                  x,
                  y + 1.8,
                  side * (this.d / 2 + 0.115),
                  1.65,
                  1.6,
                  0.05,
                );
                this.box(
                  'stone',
                  x,
                  y + 0.95,
                  side * (this.d / 2 + 0.18),
                  2.05,
                  0.09,
                  0.4,
                );
              }
          }
          this.facadeAxis = axis;
        }
        break;
      }
      case 'stone-pier':
        for (let x = -w / 2; x <= w / 2 + 0.01; x += w / 4)
          this.box('stone', x, y + 1.6, edge, 0.45, 3.2, 0.52);
        break;
      case 'shopfront':
      case 'cafe-front':
      case 'garage-door': {
        if (!this.facadeAxis && side === 1)
          this.box(this.wall, 0, 1.9, 0, w, 3.8, d);
        const bays = Math.max(2, Math.floor(w / 5)),
          bay = w / bays;
        for (let i = 0; i < bays; i++) {
          const x = -w / 2 + (i + 0.5) * bay;
          this.box('iron', x, 1.75, edge, bay - 0.18, 3.25, 0.16);
          this.box(
            id === 'garage-door' ? 'shutter' : 'shop',
            x,
            1.55,
            edge + side * 0.1,
            bay - 0.5,
            2.55,
            0.08,
          );
          this.batch.add(
            'sign',
            i % 2 ? 'sign-cyan' : 'sign-pink',
            this.spec.x + (this.facadeAxis ? edge + side * 0.17 : x),
            this.spec.y + 3.0,
            this.spec.z + (this.facadeAxis ? -x : edge + side * 0.17),
            bay - 0.45,
            0.56,
            0.05,
            this.facadeAxis ? Math.PI / 2 : 0,
          );
          if (id !== 'garage-door') {
            this.box(
              'lit',
              x,
              2.72,
              edge + side * 0.12,
              bay - 0.65,
              0.16,
              0.08,
            );
            this.box('iron', x, 1.5, edge + side * 0.18, 0.045, 2.5, 0.1);
            this.box('iron', x, 0.9, edge + side * 0.18, bay - 0.5, 0.035, 0.1);
            this.box(
              'stone',
              x,
              0.22,
              edge + side * 0.22,
              bay - 0.22,
              0.17,
              0.46,
            );
            if (i % 2 === 0) {
              this.box(
                'stone',
                x,
                1.0,
                edge + side * 0.01,
                bay - 0.7,
                0.12,
                0.25,
              );
              this.box(
                'red',
                x - 0.7,
                0.65,
                edge + side * 0.03,
                0.7,
                0.65,
                0.15,
              );
            }
          }
        }
        this.box('stone', 0, 3.48, edge, w + 0.3, 0.22, 0.65);
        if (id === 'cafe-front') this.module('awning', 3.05, side);
        break;
      }
      case 'cornice':
        this.box('stone', 0, y + 0.12, 0, w + 0.6, 0.24, d + 0.6);
        this.box(this.wall, 0, y - 0.16, 0, w + 0.25, 0.14, d + 0.25);
        break;
      case 'parapet':
        for (const s of [-1, 1]) {
          this.box(this.wall, 0, y + 0.45, (s * d) / 2, w, 0.9, 0.25);
          this.box('stone', 0, y + 0.94, (s * d) / 2, w + 0.35, 0.12, 0.45);
          this.box(this.wall, (s * w) / 2, y + 0.45, 0, 0.25, 0.9, d);
        }
        break;
      case 'flat-roof':
        this.box('roof', 0, y, 0, w - 0.2, 0.14, d - 0.2);
        break;
      case 'pitched-roof':
        this.batch.add(
          'cone',
          'roof',
          this.spec.x,
          this.spec.y + y + 1.8,
          this.spec.z,
          w * 1.4,
          3.6,
          d * 1.4,
          Math.PI / 4,
        );
        break;
      case 'warehouse':
        this.box(this.wall, 0, 3.5, 0, w, 7, d);
        this.module('garage-door', 0, side);
        this.box('glass', 0, 5.7, edge, w * 0.78, 1.05, 0.1);
        break;
      case 'awning':
        this.box(
          'red',
          0,
          y,
          edge + side * 0.75,
          w * 0.9,
          0.12,
          1.6,
          0,
          -side * 0.12,
        );
        for (let x = -w * 0.42; x < w * 0.45; x += 1.4)
          this.box(
            'sand',
            x,
            y - 0.12,
            edge + side * 0.76,
            0.45,
            0.04,
            1.6,
            0,
            -side * 0.12,
          );
        this.box('red', 0, y - 0.2, edge + side * 1.5, w * 0.9, 0.35, 0.08);
        break;
      case 'fire-escape': {
        const x = w / 2 + 0.65;
        for (let level = 4; level < y; level += 3.3) {
          this.box('iron', x, level, 0, 1.25, 0.12, d * 0.45);
          for (const z of [-d * 0.225, d * 0.225])
            this.box('iron', x, level + 0.5, z, 1.25, 0.05, 0.05);
          this.box('iron', x + 0.5, level + 0.5, 0, 0.05, 0.05, d * 0.45);
          for (let j = 0; j < 10; j++)
            this.box(
              'iron',
              x,
              level + j * 0.33,
              -d * 0.18 + j * 0.2,
              1.05,
              0.04,
              0.23,
            );
        }
        break;
      }
      case 'air-conditioner':
        for (const x of [-w * 0.24, w * 0.23]) {
          this.box('stone', x, y, edge + 0.3 * side, 1.05, 0.65, 0.65);
          for (let j = 0; j < 5; j++)
            this.box(
              'iron',
              x,
              y - 0.22 + j * 0.1,
              edge + 0.65 * side,
              0.8,
              0.025,
              0.02,
            );
        }
        break;
      case 'roof-chiller':
        this.box('metal', w * 0.2, y + 0.65, 0, 2.5, 1.3, 2);
        for (const x of [-0.6, 0.6])
          this.cylinder('iron', w * 0.2 + x, y + 1.33, 0, 0.85, 0.08);
        break;
      case 'blade-sign':
        this.box('iron', -w * 0.35, y, edge + side * 0.6, 0.1, 0.08, 1.3);
        this.box('lit', -w * 0.35, y - 0.7, edge + side * 1.1, 0.16, 1.5, 1);
        break;
      case 'roof-billboard':
        for (const x of [-w * 0.27, w * 0.27])
          this.box('iron', x, y + 1, 0, 0.1, 2, 0.1);
        this.box('billboard', 0, y + 2.3, 0, w * 0.5, 4.2, 0.16);
        this.box('cyan', 0, y + 3.45, -0.12, w * 0.71, 0.065, 0.18);
        break;
      case 'water-tank':
        this.cylinder('metal', -w * 0.24, y + 2.0, d * 0.2, 2.6, 2.5);
        for (const x of [-1, 1])
          for (const z of [-1, 1])
            this.box(
              'iron',
              -w * 0.24 + x,
              y + 0.65,
              d * 0.2 + z,
              0.1,
              1.3,
              0.1,
            );
        this.cylinder('roof', -w * 0.24, y + 3.3, d * 0.2, 2.8, 0.15);
        break;
      case 'antenna':
        this.cylinder('iron', 0, y + 2, 0, 0.06, 4);
        for (let j = 0; j < 4; j++)
          this.box('iron', 0, y + 1.3 + j * 0.5, 0, 2 - j * 0.3, 0.035, 0.035);
        break;
      case 'chimney':
        this.box(this.wall, w * 0.3, y + 1.1, -d * 0.25, 0.9, 2.2, 0.9);
        this.box('stone', w * 0.3, y + 2.25, -d * 0.25, 1.1, 0.2, 1.1);
        break;
      case 'balcony':
        for (const x of [-w * 0.26, w * 0.25]) {
          this.box('stone', x, y, edge + side * 0.7, 3.2, 0.15, 1.4);
          this.box('iron', x, y + 0.8, edge + side * 1.35, 3.2, 0.055, 0.055);
          for (let j = 0; j < 7; j++)
            this.box(
              'iron',
              x - 1.5 + j * 0.5,
              y + 0.4,
              edge + side * 1.35,
              0.035,
              0.8,
              0.035,
            );
        }
        break;
      case 'doorway':
        this.box('stone', w * 0.25, 1.65, edge + side * 0.12, 1.8, 3.3, 0.25);
        this.box('iron', w * 0.25, 1.55, edge + side * 0.28, 1.4, 2.9, 0.05);
        this.box('glass', w * 0.25, 1.9, edge + side * 0.32, 1.1, 1.7, 0.03);
        this.box('lit', w * 0.25, 3.3, edge + side * 0.6, 1.2, 0.1, 0.9);
        break;
      case 'drainpipe':
        this.cylinder('iron', -w * 0.45, y / 2, edge + 0.18 * side, 0.1, y);
        break;
      case 'loading-dock':
        this.box('stone', 0, 0.65, edge + side * 1.0, w * 0.6, 1.3, 2);
        for (const x of [-w * 0.2, w * 0.2])
          this.box('iron', x, 0.7, edge + side * 2.05, 0.25, 0.8, 0.12);
        break;
      case 'skylight':
        this.box('iron', 0, y + 0.2, 0, w * 0.5, 0.45, 2.3);
        this.box('glass', 0, y + 0.45, 0, w * 0.49, 0.08, 2.2);
        break;
      case 'roof-vent':
        this.cylinder('metal', w * 0.3, y + 0.5, d * 0.25, 0.65, 1);
        this.cylinder('iron', w * 0.3, y + 1.05, d * 0.25, 0.95, 0.12);
        break;
      case 'planter':
        for (const x of [-w * 0.3, w * 0.3]) {
          this.box('stone', x, 0.4, edge + side * 0.7, 1.6, 0.8, 0.8);
          this.batch.add(
            'sphere',
            'iron',
            this.spec.x + x,
            this.spec.y + 0.95,
            this.spec.z + edge + side * 0.7,
            1.5,
            0.9,
            0.7,
          );
        }
        break;
      case 'bollard':
        for (let x = -w * 0.4; x < w * 0.45; x += 3)
          this.cylinder('iron', x, 0.55, edge + side * 2, 0.18, 1.1);
        break;
    }
  }
  get bodyHeight() {
    return this.spec.seed % 7 === 0 && this.spec.district !== 1
      ? 7
      : 3.8 + Math.max(1, Math.round((this.spec.height - 3.8) / 3.3)) * 3.3;
  }
  build() {
    const n = this.spec.seed,
      type = n % 7;
    this.module('plinth');
    if (type === 0 && this.spec.district !== 1) {
      this.module('warehouse');
      this.module('loading-dock');
      this.module('flat-roof', 7.1);
      this.module('skylight', 7.1);
      this.module('roof-vent', 7.1);
      return;
    }
    const floors = Math.max(1, Math.round((this.spec.height - 3.8) / 3.3));
    for (let axis = 0; axis < 2; axis++) {
      this.facadeAxis = axis;
      for (const side of [-1, 1]) {
        this.module(
          type % 3 === 0
            ? 'garage-door'
            : type % 2 === 0
              ? 'cafe-front'
              : 'shopfront',
          0,
          side,
        );
        this.module('doorway', 0, side);
        this.module('stone-pier', 0, side);
      }
    }
    this.facadeAxis = 0;
    for (let floor = 0; floor < floors; floor++) {
      this.module(
        this.spec.district === 1
          ? 'office-floor'
          : type % 3 === 1
            ? 'brick-floor'
            : type % 3 === 2
              ? 'office-floor'
              : 'plaster-floor',
        3.8 + floor * 3.3,
      );
      if (type === 3 && floor % 2 === 0)
        this.module('balcony', 4.1 + floor * 3.3);
    }
    const top = 3.8 + floors * 3.3;
    this.module('cornice', top);
    this.module('flat-roof', top + 0.15);
    if ((this.spec.district === 2 && type % 2) || type === 5)
      this.module('pitched-roof', top);
    else this.module('parapet', top);
    this.module(type % 2 ? 'roof-chiller' : 'water-tank', top + 0.15);
    this.module('chimney', top);
    this.module('antenna', top);
    if (type % 3 === 0) this.module('roof-billboard', top);
    if (type % 2 === 0) this.module('fire-escape', top);
    this.module('air-conditioner', 4.6);
    this.module('drainpipe', top);
    this.module('blade-sign', 4.3);
    if (type % 2) this.module('planter');
    this.module('bollard');
  }
}
export function resetKitMaterials() {
  materialCache.clear();
}
