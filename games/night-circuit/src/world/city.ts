import { signalPositions } from './street-network';
import { createStreetTerrain, createStreetSurfaces } from './street-surfaces';
import { streetPoint, streetHeight } from './street-layout';
import { nearestRoad } from './graph';
import { BuildingKit, KitBatch } from '../gen/buildings/kit';
import { createFoundryUnderpass } from '../gen/buildings/underpass';
import { createStreetVenue } from '../gen/buildings/street-venue';
import { createFoundryAvenue } from './avenue';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import defaultData from '../data/district.json';
import type { RoadGraph } from './graph';
import { signalColor } from '../traffic/signals';
import { generatedMaterial } from '../gen/textures/library';

interface Chunk {
  group: THREE.Group;
  detail: THREE.Group;
  x: number;
  z: number;
}

export class City {
  private readonly colliders: RAPIER.Collider[] = [];
  private readonly chunks: Chunk[] = [];
  private readonly signalMeshes: THREE.InstancedMesh;
  private readonly signalPoints: ReturnType<typeof signalPositions>[];
  private readonly dummy = new THREE.Object3D();
  private readonly color = new THREE.Color();
  private readonly boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  private readonly materials: Record<string, THREE.Material>;
  private readonly batches = new Map<string, THREE.Matrix4[]>();
  private tick = 0;
  visibleChunks = 0;
  low = false;

  constructor(
    private readonly scene: THREE.Scene,
    world: RAPIER.World,
    readonly graph: RoadGraph,
    low = false,
    private readonly data: typeof defaultData = defaultData,
    private readonly openBorders = false,
  ) {
    const previous = new Set<number>();
    world.forEachCollider((c) => previous.add(c.handle));
    this.low = low;
    this.signalPoints = graph.nodes.map((n) => signalPositions(graph, n.id));
    this.materials = {
      concrete:
        generatedMaterial('concrete', 3) ??
        new THREE.MeshStandardMaterial({
          color: 0x29343d,
          roughness: 0.8,
        }),
      sidewalk:
        generatedMaterial('sidewalk') ??
        new THREE.MeshStandardMaterial({ color: 0x6d7168, roughness: 0.9 }),
      building:
        generatedMaterial('facade-amber', 2) ??
        new THREE.MeshStandardMaterial({
          color: 0x2f3b49,
          roughness: 0.6,
          metalness: 0.2,
        }),
      brick:
        generatedMaterial('brick-russet', 4) ??
        new THREE.MeshStandardMaterial({
          color: 0x4a3b3e,
          roughness: 0.7,
        }),
      metal:
        generatedMaterial('corrugated', 3) ??
        new THREE.MeshStandardMaterial({
          color: 0x2e535d,
          roughness: 0.45,
          metalness: 0.65,
        }),
      water: new THREE.MeshPhysicalMaterial({
        color: 0x071e2a,
        metalness: 0.8,
        roughness: 0.16,
        clearcoat: 1,
      }),
      cyan: new THREE.MeshBasicMaterial({ color: 0x77dbe5 }),
      pink: new THREE.MeshBasicMaterial({ color: 0xd47dad }),
      amber: new THREE.MeshBasicMaterial({ color: 0xedd594 }),
    };
    createStreetTerrain(this.scene, world, 0);
    this.roads(world);
    this.blocks(world);
    if (this.openBorders) {
      createFoundryUnderpass(this.scene, world);
      createFoundryAvenue(this.scene, world);
    }
    this.signalMeshes = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.27, 6, 4),
      new THREE.MeshBasicMaterial(),
      graph.nodes.length * 2,
    );
    this.signalMeshes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.signalMeshes);
    const signalPoles = new THREE.InstancedMesh(
      this.boxGeometry,
      new THREE.MeshStandardMaterial({ color: 0x465361, roughness: 0.7 }),
      graph.nodes.length * 2,
    );
    this.signalPoints.forEach((pair, id) =>
      pair.forEach((p, axis) => {
        this.dummy.position.set(p.x, p.y + 2.8, p.z);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.scale.set(0.15, 5.6, 0.15);
        this.dummy.updateMatrix();
        signalPoles.setMatrixAt(id * 2 + axis, this.dummy.matrix);
      }),
    );
    scene.add(signalPoles);

    this.landmarks();
    for (const [key, matrices] of this.batches) {
      const mesh = new THREE.InstancedMesh(
        this.boxGeometry,
        this.materials[key],
        matrices.length,
      );
      for (let i = 0; i < matrices.length; i++)
        mesh.setMatrixAt(i, matrices[i]);
      mesh.receiveShadow = true;
      mesh.castShadow = key !== 'cyan' && key !== 'pink' && key !== 'amber';
      scene.add(mesh);
    }
    this.batches.clear();
    this.update(this.data.spawn[0], this.data.spawn[2], 0);
    world.forEachCollider((c) => {
      if (!previous.has(c.handle)) this.colliders.push(c);
    });
  }

  enabled(value: boolean) {
    if (this.scene.visible === value) return;
    this.scene.visible = value;
    for (const c of this.colliders) c.setEnabled(value);
  }

  private box(
    parent: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    key: string,
  ) {
    const mesh = new THREE.Mesh(this.boxGeometry, this.materials[key]);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow =
      key !== 'cyan' && key !== 'pink' && key !== 'amber';
    if (parent === this.scene) {
      mesh.updateMatrix();
      if (!this.batches.has(key)) this.batches.set(key, []);
      this.batches.get(key)!.push(mesh.matrix.clone());
    } else parent.add(mesh);
    return mesh;
  }

  private roads(world: RAPIER.World) {
    createStreetSurfaces(this.scene, world, this.graph, 0);
  }

  private blocks(world: RAPIER.World) {
    let seed = this.data.seed;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      return (seed >>> 0) / 4294967296;
    };
    const coords = this.data.coordinates;
    const sectors = new Map<string, { batch: KitBatch; detail: KitBatch }>();
    for (let z = 0; z < coords.length - 1; z++)
      for (let x = 0; x < coords.length - 1; x++) {
        const sx = Math.floor(x / 2),
          sz = Math.floor(z / 2),
          key = `${sx}:${sz}`;
        let sector = sectors.get(key);
        if (!sector) {
          const group = new THREE.Group(),
            detail = new THREE.Group();
          group.add(detail);
          this.scene.add(group);
          this.chunks.push({
            group,
            detail,
            ...streetPoint(coords[sx * 2] + 120, coords[sz * 2] + 120),
          });
          sector = { batch: new KitBatch(group), detail: new KitBatch(detail) };
          sectors.set(key, sector);
        }
        const cx = (coords[x] + coords[x + 1]) / 2,
          cz = (coords[z] + coords[z + 1]) / 2;
        const docks = this.data.theme.water && x >= 6;
        if (docks) {
          sector.batch.add('box', 'glass', cx, 0.005, cz, 78, 0.05, 80);
          sector.batch.add('box', 'stone', cx - 40, 0.35, cz, 3, 0.7, 85);
          for (const side of [-1, 1]) {
            sector.batch.add(
              'box',
              'iron',
              cx,
              0.45,
              cz + side * 40,
              79,
              0.9,
              0.5,
            );
            sector.batch.add(
              'box',
              'iron',
              cx + side * 40,
              0.45,
              cz,
              0.5,
              0.9,
              80,
            );
            world.createCollider(
              RAPIER.ColliderDesc.cuboid(39.5, 0.45, 0.25).setTranslation(
                cx,
                0.45,
                cz + side * 40,
              ),
            );
            world.createCollider(
              RAPIER.ColliderDesc.cuboid(0.25, 0.45, 40).setTranslation(
                cx + side * 40,
                0.45,
                cz,
              ),
            );
          }
          continue;
        }
        for (let i = 0; i < 4; i++) {
          if (cx === 60 && cz === -180 && i === 2) continue;
          if (cx === 60 && cz === -180 && i === 0) {
            createStreetVenue(this.scene, world, 37, -177);
            continue;
          }
          const location = streetPoint(
              cx + (i % 2 ? 23 : -23),
              cz + (i < 2 ? -23 : 23),
            ),
            bx = location.x,
            bz = location.z,
            base = streetHeight(bx, bz),
            w = 19 + random() * 15,
            d = 20 + random() * 13;
          const road = nearestRoad(this.graph, bx, bz);
          if (Math.hypot(road.x - bx, road.z - bz) < Math.hypot(w, d) / 2 + 15)
            continue;
          sector.batch.add('box', 'stone', bx, base - 1.5, bz, w, 3, d);
          let n = Math.floor(random() * 100000);
          if (i === 0 && (x + z) % 2 === 0) n = n - (n % 7) + 6;
          if (i === 3 && (x + z) % 2 !== 0) n = n - (n % 7) + 5;
          const h =
            7 + Math.floor(random() * 6) * 3.3 + (n % 11 === 0 ? 23.1 : 0);
          const building = new BuildingKit(sector.batch, {
            x: bx,
            y: base,
            z: bz,
            width: w,
            depth: d,
            height: h,
            district: 0,
            seed: n,
          });
          building.build();
          const bodyHeight = building.bodyHeight;
          world.createCollider(
            RAPIER.ColliderDesc.cuboid(
              w / 2,
              (bodyHeight + 3) / 2,
              d / 2,
            ).setTranslation(bx, base + bodyHeight / 2 - 1.5, bz),
          );
        }
      }
    for (const sector of sectors.values()) {
      sector.batch.flush();
      sector.detail.flush();
    }
  }

  private landmarks() {
    if (this.data.theme.scenery === 'hills') {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x26483e,
        flatShading: true,
      });
      for (let i = 0; i < 8; i++) {
        const hill = new THREE.Mesh(new THREE.ConeGeometry(90, 80, 7), mat);
        hill.position.set(590, 10, -480 + i * 140);
        this.scene.add(hill);
      }
    }
    if (this.data.theme.scenery === 'tower') {
      this.box(this.scene, 5, 70, 5, 420, 35, 420, 'concrete');
      this.box(this.scene, 24, 8, 24, 420, 72, 420, 'cyan');
    }
    for (const poi of this.data.pois) {
      const x = poi.x + 18,
        z = poi.z + 18;
      if (this.openBorders && Math.abs(x) < 35 && z > -355 && z < -250)
        continue;
      this.box(
        this.scene,
        0.25,
        5.5,
        0.25,
        x,
        streetHeight(x, z) + 2.75,
        z,
        'metal',
      );
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#10202c';
      context.fillRect(0, 0, 512, 128);
      context.fillStyle = '#d3ec7b';
      context.textAlign = 'center';
      context.font = '700 38px "Circuit Grid"';
      context.fillText(poi.name.toUpperCase(), 256, 60);
      context.fillStyle = '#85dce6';
      context.font = '600 23px "Circuit Grid"';
      context.fillText(
        this.data.name.toUpperCase() + ' / PORT RIDERS',
        256,
        100,
      );
      const material = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(canvas),
      });
      for (const direction of [0, Math.PI]) {
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.3), material);
        sign.position.set(
          x,
          streetHeight(x, z) + 5,
          z + (direction ? -0.05 : 0.05),
        );
        sign.rotation.y = direction;
        this.scene.add(sign);
      }
    }
  }

  update(x: number, z: number, time: number) {
    if (time < this.tick) return;
    this.tick = time + 0.2;
    this.visibleChunks = 0;
    const near = this.low ? 180 : 290,
      far = this.low ? 340 : 520;
    for (const chunk of this.chunks) {
      const distance = Math.hypot(chunk.x - x, chunk.z - z);
      chunk.group.visible = distance < far;
      chunk.detail.visible = distance < near;
      if (chunk.group.visible) this.visibleChunks++;
    }
    for (const node of this.graph.nodes)
      for (let axis = 0; axis < 2; axis++) {
        const p = this.signalPoints[node.id][axis];
        this.dummy.position.set(p.x, p.y + 5.8, p.z);
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        const id = node.id * 2 + axis;
        this.signalMeshes.setMatrixAt(id, this.dummy.matrix);
        const light = signalColor(node.id, axis === 0, time);
        this.color.setHex(
          light === 'green'
            ? 0x75edb4
            : light === 'amber'
              ? 0xf4c467
              : 0xef647b,
        );
        this.signalMeshes.setColorAt(id, this.color);
      }
    this.signalMeshes.instanceMatrix.needsUpdate = true;
    if (this.signalMeshes.instanceColor)
      this.signalMeshes.instanceColor.needsUpdate = true;
  }
}
