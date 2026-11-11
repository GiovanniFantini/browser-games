import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import defaultData from '../data/district.json';
import type { RoadGraph } from './graph';
import { signalColor } from '../traffic/signals';
import { asphaltMaterial } from './asphalt';

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
      concrete: new THREE.MeshStandardMaterial({
        color: 0x29343d,
        roughness: 0.8,
      }),
      building: new THREE.MeshStandardMaterial({
        color: 0x2f3b49,
        roughness: 0.6,
        metalness: 0.2,
      }),
      brick: new THREE.MeshStandardMaterial({
        color: 0x4a3b3e,
        roughness: 0.7,
      }),
      metal: new THREE.MeshStandardMaterial({
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
          'concrete',
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
    for (let z = 0; z < coords.length - 1; z++)
      for (let x = 0; x < coords.length - 1; x++) {
        const cx = (coords[x] + coords[x + 1]) / 2,
          cz = (coords[z] + coords[z + 1]) / 2;
        const group = new THREE.Group(),
          detail = new THREE.Group();
        group.add(detail);
        const chunk: Chunk = { group, detail, x: cx, z: cz };
        this.chunks.push(chunk);
        this.scene.add(group);
        const docks = this.data.theme.water && x >= 6,
          lanterns = this.data.theme.lanterns || (x <= 1 && z >= 4);
        if (docks) {
          this.box(group, 72, 0.08, 77, cx + 3, 0.005, cz, 'water');
          this.box(group, 7, 0.7, 82, cx - 37, 0.3, cz, 'concrete');
          // The dock water is blocked by a visible low guardrail.
          for (const side of [-1, 1]) {
            this.box(group, 79, 0.9, 0.5, cx, 0.45, cz + side * 40, 'metal');
            world.createCollider(
              RAPIER.ColliderDesc.cuboid(39.5, 0.45, 0.25).setTranslation(
                cx,
                0.45,
                cz + side * 40,
              ),
            );
            this.box(group, 0.5, 0.9, 80, cx + side * 40, 0.45, cz, 'metal');
            world.createCollider(
              RAPIER.ColliderDesc.cuboid(0.25, 0.45, 40).setTranslation(
                cx + side * 40,
                0.45,
                cz,
              ),
            );
          }
          this.box(group, 1.5, 32, 1.5, cx - 29, 16, cz, 'metal');
          this.box(group, 48, 1.3, 1.3, cx - 6, 32, cz, 'metal');
          this.box(detail, 0.1, 18, 0.1, cx + 15, 23, cz, 'amber');
          continue;
        }
        const count = 4;
        const buildings = new THREE.InstancedMesh(
          this.boxGeometry,
          this.materials[lanterns ? 'brick' : 'building'],
          count,
        );
        const strips = new THREE.InstancedMesh(
          this.boxGeometry,
          this.materials[lanterns ? 'pink' : 'amber'],
          count * 4,
        );
        buildings.castShadow = buildings.receiveShadow = true;
        for (let i = 0; i < count; i++) {
          const bx = cx + (i % 2 ? 23 : -23),
            bz = cz + (i < 2 ? -23 : 23);
          const w = 27 + random() * 7,
            d = 26 + random() * 8,
            h =
              this.data.theme.heightMin +
              random() *
                (lanterns
                  ? this.data.theme.lanternRange
                  : this.data.theme.heightRange);
          this.dummy.position.set(bx, h / 2, bz);
          this.dummy.scale.set(w, h, d);
          this.dummy.updateMatrix();
          buildings.setMatrixAt(i, this.dummy.matrix);
          world.createCollider(
            RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(
              bx,
              h / 2,
              bz,
            ),
          );
          for (let row = 0; row < 4; row++) {
            this.dummy.position.set(
              bx,
              2 + (row * (h - 3)) / 4,
              bz + (i < 2 ? -1 : 1) * (d / 2 + 0.04),
            );
            this.dummy.scale.set(w * 0.8, 0.22, 0.08);
            this.dummy.updateMatrix();
            strips.setMatrixAt(i * 4 + row, this.dummy.matrix);
          }
          this.box(detail, w + 0.5, 0.25, d + 0.5, bx, h + 0.1, bz, 'metal');
          if (lanterns)
            for (let j = 0; j < 3; j++)
              this.box(
                detail,
                0.9,
                1.5,
                0.9,
                bx - 8 + j * 8,
                4,
                bz - d / 2 - 0.8,
                'pink',
              );
          else if (i < 2) {
            this.box(detail, 9, 3, 5, bx, 1.5, cz, 'metal');
            world.createCollider(
              RAPIER.ColliderDesc.cuboid(4.5, 1.5, 2.5).setTranslation(
                bx,
                1.5,
                cz,
              ),
            );
            for (let j = 0; j < 4; j++)
              this.box(
                detail,
                0.15,
                2.7,
                5.04,
                bx - 3 + j * 2,
                1.5,
                cz,
                'concrete',
              );
          }
        }
        group.add(buildings);
        detail.add(strips);
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
      context.font = '700 38px Rajdhani';
      context.fillText(poi.name.toUpperCase(), 256, 60);
      context.fillStyle = '#85dce6';
      context.font = '600 23px Rajdhani';
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
