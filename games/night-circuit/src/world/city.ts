import { BuildingKit, KitBatch } from '../gen/buildings/kit';
import { createFoundryUnderpass } from '../gen/buildings/underpass';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import defaultData from '../data/district.json';
import type { RoadGraph } from './graph';
import { signalColor } from '../traffic/signals';
import { asphaltMaterial } from './asphalt';
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
      road: asphaltMaterial(),
      cyan: new THREE.MeshBasicMaterial({ color: 0x77dbe5 }),
      pink: new THREE.MeshBasicMaterial({ color: 0xd47dad }),
      amber: new THREE.MeshBasicMaterial({ color: 0xedd594 }),
      paint: new THREE.MeshStandardMaterial({
        color: 0xa3bbc1,
        roughness: 0.45,
      }),
    };
    this.box(this.scene, 1100, 1, 1100, 0, -0.55, 0, 'concrete');
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(550, 0.5, 550).setTranslation(0, -0.55, 0),
    );
    this.roads(world);
    this.blocks(world);
    if (this.openBorders) createFoundryUnderpass(this.scene, world);
    this.signalMeshes = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.27, 6, 4),
      new THREE.MeshBasicMaterial(),
      graph.nodes.length * 2,
    );
    this.signalMeshes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(this.signalMeshes);
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
    const roadWidth = this.data.roadWidth,
      size = this.data.coordinates.at(-1)! - this.data.coordinates[0];
    // Each road strip is derived from an edge; intersection squares close their joins.
    const roads = new THREE.InstancedMesh(
      this.boxGeometry,
      this.materials.road,
      this.graph.edges.length + this.graph.nodes.length,
    );
    const markings = new THREE.InstancedMesh(
      this.boxGeometry,
      this.materials.paint,
      this.graph.edges.length * 8,
    );
    const lamps = new THREE.InstancedMesh(
      this.boxGeometry,
      this.materials.concrete,
      this.graph.edges.length * 2,
    );
    const bulbs = new THREE.InstancedMesh(
      this.boxGeometry,
      this.materials.amber,
      this.graph.edges.length * 2,
    );
    roads.receiveShadow = true;
    let r = 0,
      m = 0,
      l = 0;
    const place = (
      mesh: THREE.InstancedMesh,
      index: number,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
    ) => {
      this.dummy.position.set(x, y, z);
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.set(w, h, d);
      this.dummy.updateMatrix();
      mesh.setMatrixAt(index, this.dummy.matrix);
    };
    for (const edge of this.graph.edges) {
      const a = this.graph.nodes[edge.a],
        b = this.graph.nodes[edge.b];
      const vertical = a.x === b.x;
      const x = (a.x + b.x) / 2,
        z = (a.z + b.z) / 2,
        span = edge.length - roadWidth;
      place(
        roads,
        r++,
        x,
        -0.02,
        z,
        vertical ? roadWidth : span,
        0.05,
        vertical ? span : roadWidth,
      );
      for (const side of [-1, 1]) {
        const sx = x + (vertical ? side * (roadWidth / 2 + 2) : 0);
        const sz = z + (vertical ? 0 : side * (roadWidth / 2 + 2));
        this.box(
          this.scene,
          vertical ? 4 : span,
          0.17,
          vertical ? span : 4,
          sx,
          0.04,
          sz,
          'sidewalk',
        );
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(
            vertical ? 2 : span / 2,
            0.085,
            vertical ? span / 2 : 2,
          ).setTranslation(sx, 0.04, sz),
        );
        place(lamps, l, sx, 4.8, sz, 0.22, 9.6, 0.22);
        place(
          bulbs,
          l++,
          sx,
          9.6,
          sz,
          vertical ? 3.4 : 0.6,
          0.13,
          vertical ? 0.6 : 3.4,
        );
      }
      for (let j = 0; j < 8; j++) {
        const t = (j + 0.5) / 8;
        const px = a.x + (b.x - a.x) * t,
          pz = a.z + (b.z - a.z) * t;
        place(
          markings,
          m++,
          px,
          0.016,
          pz,
          vertical ? 0.17 : 4.5,
          0.015,
          vertical ? 4.5 : 0.17,
        );
      }
    }
    for (const node of this.graph.nodes) {
      place(roads, r++, node.x, -0.02, node.z, roadWidth, 0.05, roadWidth);
      this.box(
        this.scene,
        0.18,
        6,
        0.18,
        node.x - 13,
        3,
        node.z - 13,
        'concrete',
      );
      this.box(
        this.scene,
        0.18,
        6,
        0.18,
        node.x + 13,
        3,
        node.z + 13,
        'concrete',
      );
      this.box(
        this.scene,
        1.1,
        1.5,
        0.65,
        node.x - 13,
        5.8,
        node.z - 13,
        'building',
      );
      this.box(
        this.scene,
        0.65,
        1.5,
        1.1,
        node.x + 13,
        5.8,
        node.z + 13,
        'building',
      );
    }
    this.scene.add(roads, markings, lamps, bulbs);
    if (!this.openBorders)
      for (const side of [-1, 1]) {
        const bound = size / 2 + 20;
        this.box(
          this.scene,
          1.5,
          1.5,
          size + 42,
          side * bound,
          0.75,
          0,
          'concrete',
        );
        this.box(
          this.scene,
          size + 42,
          1.5,
          1.5,
          0,
          0.75,
          side * bound,
          'concrete',
        );
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(
            0.75,
            0.75,
            (size + 42) / 2,
          ).setTranslation(side * bound, 0.75, 0),
        );
        world.createCollider(
          RAPIER.ColliderDesc.cuboid(
            (size + 42) / 2,
            0.75,
            0.75,
          ).setTranslation(0, 0.75, side * bound),
        );
      }
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
            x: coords[sx * 2] + 120,
            z: coords[sz * 2] + 120,
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
          const bx = cx + (i % 2 ? 23 : -23),
            bz = cz + (i < 2 ? -23 : 23),
            w = 24 + random() * 10,
            d = 24 + random() * 9;
          const n = Math.floor(random() * 100000),
            h = 7 + Math.floor(random() * 5) * 3.3;
          const building = new BuildingKit(sector.batch, {
            x: bx,
            y: 0,
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
              bodyHeight / 2,
              d / 2,
            ).setTranslation(bx, bodyHeight / 2, bz),
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
      this.box(this.scene, 0.25, 7, 0.25, x, 3.5, z, 'metal');
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
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), material);
        sign.position.set(x, 6, z + (direction ? -0.05 : 0.05));
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
        this.dummy.position.set(
          node.x + (axis ? 13 : -13),
          5.8,
          node.z + (axis ? 13 : -13),
        );
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
