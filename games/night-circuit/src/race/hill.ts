import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type { RaceDefinition } from './route';
import { RaceRoute } from './route';
import catalog from '../data/races.json';
import config from '../data/modes.json';
export class HillCourse {
  private readonly root = new THREE.Group();
  private readonly colliders: RAPIER.Collider[] = [];
  constructor(
    scene: THREE.Scene,
    world: RAPIER.World,
    definition: RaceDefinition = catalog.events.find(
      (e) => e.id === 'drift-hills',
    )!,
    platforms = true,
  ) {
    const route = new RaceRoute(definition, true),
      vertices: number[] = [],
      indices: number[] = [];
    const width = config.hill.width / 2;
    for (const p of route.points)
      vertices.push(
        p.x + p.dz * width,
        p.y ?? 0,
        p.z - p.dx * width,
        p.x - p.dz * width,
        p.y ?? 0,
        p.z + p.dx * width,
      );
    for (let i = 1; i < route.points.length; i++) {
      const n = i * 2;
      indices.push(n - 2, n - 1, n, n - 1, n + 1, n);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    this.root.add(
      new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0x344252,
          roughness: 0.6,
          side: THREE.DoubleSide,
        }),
      ),
    );
    this.colliders.push(
      world.createCollider(
        RAPIER.ColliderDesc.trimesh(
          new Float32Array(vertices),
          new Uint32Array(indices),
        ).setFriction(1),
      ),
    );
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x8ba0ae,
      roughness: 0.5,
    });
    for (let i = 1; i < route.points.length; i += 5) {
      const a = route.points[i - 1],
        b = route.points[Math.min(i + 4, route.points.length - 1)];
      const length = Math.hypot(b.x - a.x, b.z - a.z),
        yaw = Math.atan2(b.x - a.x, b.z - a.z);
      for (const side of [-1, 1]) {
        const x = (a.x + b.x) / 2 + ((a.dz + b.dz) / 2) * width * side,
          z = (a.z + b.z) / 2 - ((a.dx + b.dx) / 2) * width * side,
          y = ((a.y ?? 0) + (b.y ?? 0)) / 2 + 0.6;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 1.2, length + 1),
          railMaterial,
        );
        mesh.position.set(x, y, z);
        mesh.rotation.set(
          -Math.atan2((b.y ?? 0) - (a.y ?? 0), length),
          yaw,
          0,
          'YXZ',
        );
        this.root.add(mesh);
        this.colliders.push(
          world.createCollider(
            RAPIER.ColliderDesc.cuboid(0.175, 0.6, length / 2 + 0.5)
              .setTranslation(x, y, z)
              .setRotation(mesh.quaternion),
          ),
        );
      }
    }
    if (platforms) {
      const start = route.points[0];
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(config.hill.width, 0.6, 40),
        new THREE.MeshStandardMaterial({ color: 0x344252 }),
      );
      platform.position.set(start.x, (start.y ?? 0) - 0.3, start.z - 18);
      this.root.add(platform);
      this.colliders.push(
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(width, 0.3, 20).setTranslation(
            start.x,
            (start.y ?? 0) - 0.3,
            start.z - 18,
          ),
        ),
      );
      const end = route.points.at(-1)!;
      const runout = new THREE.Mesh(
        new THREE.BoxGeometry(config.hill.width, 0.6, 90),
        new THREE.MeshStandardMaterial({ color: 0x344252 }),
      );
      runout.position.set(end.x, -0.3, end.z + 40);
      this.root.add(runout);
      this.colliders.push(
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(width, 0.3, 45).setTranslation(
            end.x,
            -0.3,
            end.z + 40,
          ),
        ),
      );
      const hillMat = new THREE.MeshStandardMaterial({
        color: 0x1c3438,
        flatShading: true,
      });
      for (let i = 0; i < 6; i++) {
        const mesh = new THREE.Mesh(new THREE.ConeGeometry(50, 50, 7), hillMat);
        mesh.position.set(start.x + 150, 0, start.z + 60 + i * 90);
        this.root.add(mesh);
      }
    }
    scene.add(this.root);
    this.enabled(false);
  }
  enabled(value: boolean) {
    if (this.root.visible === value) return;
    this.root.visible = value;
    for (const c of this.colliders) c.setEnabled(value);
  }
}
