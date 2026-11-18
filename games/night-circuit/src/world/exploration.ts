import RAPIER from '@dimforge/rapier3d-compat';
import { streetPoint } from './street-layout';
import * as THREE from 'three';
import { worldExploration as data } from './world-data';
import { roadHeight } from './atlas';
import type { Profile } from '../progression/profile';
export const collectionIds = new Set(data.collectibles.map((p) => p.id));
export function collect(profile: Profile, id: string) {
  if (!collectionIds.has(id)) throw Error('Collezionabile sconosciuto.');
  if (profile.exploration.includes(id)) return false;
  profile.exploration.push(id);
  profile.credits = Math.min(1e9, profile.credits + data.reward);
  return true;
}
export class Exploration {
  private readonly pieces: THREE.Mesh[] = [];
  private readonly roads: {
    collider: RAPIER.Collider;
    district: number;
    x: number;
    z: number;
    enabled: boolean;
  }[] = [];
  constructor(scene: THREE.Scene, world: RAPIER.World) {
    const geometry = new THREE.TorusGeometry(1, 0.16, 5, 8),
      material = new THREE.MeshBasicMaterial({ color: 0xd5ed88 });
    for (const p of data.collectibles) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(p.x, roadHeight(p.x, p.z) + 1.5, p.z);
      scene.add(mesh);
      this.pieces.push(mesh);
    }
    const mat = new THREE.MeshStandardMaterial({
      color: 0x425362,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });
    for (const p of data.shortcuts) {
      const v: number[] = [],
        indices: number[] = [];
      for (let i = 0; i <= 24; i++) {
        const x = p.a.x + ((p.b.x - p.a.x) * i) / 24;
        for (const side of [-1, 1]) {
          const mapped = streetPoint(x, p.a.z + side * 3);
          v.push(mapped.x, roadHeight(mapped.x, mapped.z) + 0.04, mapped.z);
        }
        if (i) {
          const n = i * 2;
          indices.push(n - 2, n - 1, n, n - 1, n + 1, n);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      g.setIndex(indices);
      g.computeVertexNormals();
      scene.add(new THREE.Mesh(g, mat));
      const collider = world.createCollider(
        RAPIER.ColliderDesc.trimesh(
          new Float32Array(v),
          new Uint32Array(indices),
        ).setFriction(1),
      );
      collider.setEnabled(false);
      const middle = streetPoint((p.a.x + p.b.x) / 2, (p.a.z + p.b.z) / 2);
      this.roads.push({
        collider,
        district: p.district,
        ...middle,
        enabled: false,
      });
    }
  }
  update(
    x: number,
    y: number,
    z: number,
    time: number,
    profile: Profile,
    unlocked: number,
    canCollect: boolean,
  ): string | undefined {
    for (const road of this.roads) {
      const enabled =
        road.district < unlocked && Math.hypot(x - road.x, z - road.z) < 1120;
      if (enabled !== road.enabled) {
        road.collider.setEnabled(enabled);
        road.enabled = enabled;
      }
    }
    let found: string | undefined;
    for (let i = 0; i < this.pieces.length; i++) {
      const p = data.collectibles[i],
        mesh = this.pieces[i];
      mesh.visible =
        p.district < unlocked && !profile.exploration.includes(p.id);
      if (!mesh.visible) continue;
      mesh.rotation.y = time;
      mesh.rotation.z = Math.sin(time) * 0.15;
      if (
        canCollect &&
        Math.hypot(p.x - x, p.z - z) < 4.5 &&
        Math.abs(mesh.position.y - y) < 3
      )
        found = p.id;
    }
    return found;
  }
}
