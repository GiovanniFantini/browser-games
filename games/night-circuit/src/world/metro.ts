import { BuildingKit, KitBatch } from '../gen/buildings/kit';
import { landmark } from './landmarks';
import exploration from '../data/exploration.json';
import district from '../data/district.json';
import { t } from '../ui/translation';
import { HillCourse } from '../race/hill';
import { passRoutes } from './pass';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import data from '../data/career.json';
import { createGraph } from './graph';
import { ORIGINS, roadHeight, districtIndex, districtPois } from './atlas';
import { asphaltMaterial } from './asphalt';
import { signalColor } from '../traffic/signals';

export class MetroWorld {
  readonly hill: HillCourse;
  private readonly passLinks: HillCourse[];
  private readonly interchange: HillCourse;
  private raceHill = false;
  private readonly areas: {
    root: THREE.Group;
    colliders: RAPIER.Collider[];
    signals: THREE.InstancedMesh;
    lights: THREE.InstancedMesh;
    index: number;
    enabled: boolean | undefined;
  }[] = [];
  private readonly gates: {
    root: THREE.Group;
    collider: RAPIER.Collider;
    index: number;
  }[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly color = new THREE.Color();
  private tick = 0;
  unlocked = 1;
  constructor(
    scene: THREE.Scene,
    private readonly world: RAPIER.World,
  ) {
    this.hill = new HillCourse(scene, world);
    this.interchange = new HillCourse(
      scene,
      world,
      exploration.airportInterchange,
      false,
    );
    this.passLinks = [passRoutes[0], passRoutes[2]].map(
      (r) => new HillCourse(scene, world, r.definition, false),
    );
    for (let index = 1; index < 4; index++) {
      const o = ORIGINS[index],
        info = data.districts[index],
        root = new THREE.Group(),
        colliders: RAPIER.Collider[] = [];
      scene.add(root);
      const vertices: number[] = [],
        triangles: number[] = [];
      for (let z = -480; z <= 480; z += 120)
        for (let x = -480; x <= 480; x += 120)
          vertices.push(x + o.x, roadHeight(x + o.x, z + o.z) - 0.05, z + o.z);
      for (let z = 0; z < 8; z++)
        for (let x = 0; x < 8; x++) {
          const n = z * 9 + x;
          triangles.push(n, n + 9, n + 1, n + 1, n + 9, n + 10);
        }
      const ground = new THREE.BufferGeometry();
      ground.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3),
      );
      ground.setIndex(triangles);
      ground.computeVertexNormals();
      root.add(
        new THREE.Mesh(
          ground,
          new THREE.MeshStandardMaterial({
            color: index === 2 ? 0x20382d : 0x293440,
            roughness: 0.85,
          }),
        ),
      );
      colliders.push(
        world.createCollider(
          RAPIER.ColliderDesc.trimesh(
            new Float32Array(vertices),
            new Uint32Array(triangles),
          ),
        ),
      );
      const borderMat = new THREE.MeshStandardMaterial({
        color: index === 2 ? 0x20382d : 0x293440,
        roughness: 0.85,
      });
      for (const side of [-1, 1])
        for (const axis of [0, 1])
          this.block(
            root,
            colliders,
            o.x + (axis === 0 ? side * 490 : 0),
            -0.55,
            o.z + (axis === 1 ? side * 490 : 0),
            axis === 0 ? 20 : 1000,
            1,
            axis === 1 ? 20 : 1000,
            borderMat,
          );
      const box = new THREE.BoxGeometry(1, 1, 1),
        buildMat = new THREE.MeshStandardMaterial({
          color: index === 1 ? 0x343349 : 0x3b464a,
          roughness: 0.6,
        }),
        glowMat = new THREE.MeshBasicMaterial({ color: info.color });
      const buildings = new THREE.InstancedMesh(box, buildMat, 256),
        lights = new THREE.InstancedMesh(box, glowMat, 1024);
      const architecture = new KitBatch(root);
      let seed = info.seed;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        return (seed >>> 0) / 4294967296;
      };
      const reservedLots = new Set(
        info.architecture.map(
          (lot) =>
            `${Math.round((lot.x + 420) / 120)},${Math.round((lot.z + 420) / 120)}`,
        ),
      );
      for (let z = 0; z < 8; z++)
        for (let x = 0; x < 8; x++)
          for (let k = 0; k < 4; k++) {
            const id = (z * 8 + x) * 4 + k;
            if (reservedLots.has(`${x},${z}`)) {
              this.dummy.matrix.makeScale(0, 0, 0);
              buildings.setMatrixAt(id, this.dummy.matrix);
              for (let row = 0; row < 4; row++)
                lights.setMatrixAt(id * 4 + row, this.dummy.matrix);
              continue;
            }
            const bx = o.x - 420 + x * 120 + (k % 2 ? 23 : -23),
              bz = o.z - 420 + z * 120 + (k < 2 ? -23 : 23),
              w = 24 + random() * 9,
              d = 24 + random() * 9,
              h = info.theme.heightMin + random() * info.theme.heightRange,
              y = roadHeight(bx, bz);
            this.dummy.position.set(bx, y + h / 2, bz);
            this.dummy.scale.set(w, h, d);
            this.dummy.rotation.set(0, 0, 0);
            this.dummy.updateMatrix();
            buildings.setMatrixAt(id, this.dummy.matrix);
            const building = new BuildingKit(architecture, {
              x: bx,
              y,
              z: bz,
              width: w,
              depth: d,
              height: Math.min(h, index === 1 ? 42 : index === 2 ? 14 : 22),
              district: index,
              seed: id * 7919 + info.seed,
            });
            building.build();
            const bodyHeight = building.bodyHeight;
            colliders.push(
              world.createCollider(
                RAPIER.ColliderDesc.cuboid(
                  w / 2,
                  bodyHeight / 2,
                  d / 2,
                ).setTranslation(bx, y + bodyHeight / 2, bz),
              ),
            );
            for (let row = 0; row < 4; row++) {
              this.dummy.position.set(
                bx,
                y + 2 + (row * (h - 3)) / 4,
                bz - d / 2 - 0.03,
              );
              this.dummy.scale.set(w * 0.8, 0.22, 0.08);
              this.dummy.updateMatrix();
              lights.setMatrixAt(id * 4 + row, this.dummy.matrix);
            }
          }
      architecture.flush();
      lights.count = 0;
      root.add(lights);
      const roofGeometry =
          index === 2
            ? new THREE.ConeGeometry(1, 1, 4)
            : new THREE.BoxGeometry(1, 1, 1),
        roofMat = new THREE.MeshStandardMaterial({
          color: index === 1 ? 0x71335e : index === 2 ? 0x38495a : 0x697078,
        }),
        roofs = new THREE.InstancedMesh(roofGeometry, roofMat, 256);
      const treeGeometry = new THREE.ConeGeometry(2.5, 8, 5),
        trees = new THREE.InstancedMesh(
          treeGeometry,
          new THREE.MeshStandardMaterial({ color: 0x183a35 }),
          index === 2 ? 128 : 1,
        );
      for (let id = 0; id < 256; id++) {
        buildings.getMatrixAt(id, this.dummy.matrix);
        if (this.dummy.matrix.elements[0] === 0) {
          roofs.setMatrixAt(id, this.dummy.matrix);
          continue;
        }
        this.dummy.matrix.decompose(
          this.dummy.position,
          this.dummy.quaternion,
          this.dummy.scale,
        );
        const h = this.dummy.scale.y;
        this.dummy.position.y += h / 2 + (index === 2 ? 2 : 1);
        this.dummy.scale.y = index === 2 ? 4 : 2;
        if (index === 2) {
          this.dummy.rotation.y = Math.PI / 4;
          this.dummy.scale.x *= 0.72;
          this.dummy.scale.z *= 0.72;
        }
        this.dummy.updateMatrix();
        roofs.setMatrixAt(id, this.dummy.matrix);
      }
      roofs.dispose();
      for (const lot of info.architecture)
        landmark(
          root,
          world,
          colliders,
          lot.style,
          o.x + lot.x,
          roadHeight(o.x + lot.x, o.z + lot.z),
          o.z + lot.z,
          info.color,
        );
      if (index === 2) {
        for (let n = 0; n < 128; n++) {
          const x = o.x - 420 + (n % 8) * 120,
            z = o.z - 420 + Math.floor(n / 8) * 60;
          this.dummy.position.set(x, roadHeight(x, z) + 4, z);
          this.dummy.rotation.set(0, 0, 0);
          this.dummy.scale.setScalar(1);
          this.dummy.updateMatrix();
          trees.setMatrixAt(n, this.dummy.matrix);
        }
        root.add(trees);
      }
      for (let i = 0; i < info.zones.length; i++)
        this.sign(
          root,
          info.zones[i],
          o.x - 240 + i * 240,
          roadHeight(o.x - 240 + i * 240, o.z - 120) + 9,
          o.z - 120,
          info.color,
        );
      const graph = createGraph(),
        roadVerts: number[] = [],
        roadIndices: number[] = [];
      const width = index === 1 ? 18 : index === 3 ? 36 : 24;
      for (const e of graph.edges) {
        const a = graph.nodes[e.a],
          b = graph.nodes[e.b],
          dx = (b.x - a.x) / e.length,
          dz = (b.z - a.z) / e.length,
          n = roadVerts.length / 3;
        for (const [p, s] of [
          [a, -1],
          [a, 1],
          [b, -1],
          [b, 1],
        ] as const) {
          const x = p.x + o.x + ((dz * width) / 2) * s,
            z = p.z + o.z - ((dx * width) / 2) * s;
          roadVerts.push(x, roadHeight(x, z) + 0.025, z);
        }
        roadIndices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
      }
      // Intersection pads leave every spline turn on a physical surface.
      for (const p of graph.nodes) {
        const n = roadVerts.length / 3;
        for (const [x, z] of [
          [-width / 2, -width / 2],
          [width / 2, -width / 2],
          [-width / 2, width / 2],
          [width / 2, width / 2],
        ])
          roadVerts.push(
            p.x + o.x + x,
            roadHeight(p.x + o.x + x, p.z + o.z + z) + 0.026,
            p.z + o.z + z,
          );
        roadIndices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
      }
      const roads = new THREE.BufferGeometry();
      roads.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(roadVerts, 3),
      );
      roads.setIndex(roadIndices);
      roads.setAttribute(
        'uv',
        new THREE.Float32BufferAttribute(
          roadVerts.flatMap((v, i) => (i % 3 === 1 ? [] : [v / 120])),
          2,
        ),
      );
      roads.computeVertexNormals();
      const roadMaterial = asphaltMaterial();
      roadMaterial.side = THREE.DoubleSide;
      roadMaterial.clearcoat = 0.35;
      roadMaterial.roughness = 0.8;
      root.add(new THREE.Mesh(roads, roadMaterial));
      const pavement: number[] = [],
        pavementIndices: number[] = [];
      for (const edge of graph.edges) {
        const a = graph.nodes[edge.a],
          b = graph.nodes[edge.b],
          dx = (b.x - a.x) / edge.length,
          dz = (b.z - a.z) / edge.length;
        for (const side of [-1, 1]) {
          const n = pavement.length / 3;
          for (const [along, offset] of [
            [width / 2 + 1, width / 2 + 0.5],
            [width / 2 + 1, width / 2 + 3.5],
            [edge.length - width / 2 - 1, width / 2 + 0.5],
            [edge.length - width / 2 - 1, width / 2 + 3.5],
          ]) {
            const x = o.x + a.x + dx * along + dz * offset * side,
              z = o.z + a.z + dz * along - dx * offset * side;
            pavement.push(x, roadHeight(x, z) + 0.13, z);
          }
          pavementIndices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
        }
      }
      const walks = new THREE.BufferGeometry();
      walks.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(pavement, 3),
      );
      walks.setIndex(pavementIndices);
      walks.computeVertexNormals();
      root.add(
        new THREE.Mesh(
          walks,
          new THREE.MeshStandardMaterial({
            color: 0x3c4855,
            roughness: 0.8,
            side: THREE.DoubleSide,
          }),
        ),
      );
      colliders.push(
        world.createCollider(
          RAPIER.ColliderDesc.trimesh(
            new Float32Array(pavement),
            new Uint32Array(pavementIndices),
          ).setFriction(1),
        ),
      );
      const poles = new THREE.InstancedMesh(
        box,
        new THREE.MeshStandardMaterial({ color: 0x465361, roughness: 0.7 }),
        162,
      );
      for (const node of graph.nodes)
        for (let d = 0; d < 2; d++) {
          this.dummy.position.set(
            node.x + o.x + (d ? 10 : -10),
            roadHeight(node.x + o.x, node.z + o.z) + 2,
            node.z + o.z + 10,
          );
          this.dummy.rotation.set(0, 0, 0);
          this.dummy.scale.set(0.15, 4, 0.15);
          this.dummy.updateMatrix();
          poles.setMatrixAt(node.id * 2 + d, this.dummy.matrix);
        }
      root.add(poles);
      const signals = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.3, 5, 4),
        new THREE.MeshBasicMaterial(),
        162,
      );
      for (const n of graph.nodes)
        for (let d = 0; d < 2; d++) {
          this.dummy.position.set(
            n.x + o.x + (d ? 10 : -10),
            roadHeight(n.x + o.x, n.z + o.z) + 4,
            n.z + o.z + 10,
          );
          this.dummy.scale.setScalar(1);
          this.dummy.updateMatrix();
          signals.setMatrixAt(n.id * 2 + d, this.dummy.matrix);
        }
      root.add(signals);
      for (const poi of districtPois(index))
        this.sign(
          root,
          poi.name,
          poi.x + 16,
          roadHeight(poi.x, poi.z) + 6,
          poi.z + 16,
          info.color,
        );
      if (index === 3) {
        // Open-ended tunnel over the western expressway.
        for (let z = -240; z <= 240; z += 24) {
          this.block(root, colliders, o.x - 18, 4, o.z + z, 1, 8, 24, buildMat);
          this.block(root, colliders, o.x + 18, 4, o.z + z, 1, 8, 24, buildMat);
        }
        this.block(root, colliders, o.x, 8.5, o.z, 38, 1, 504, buildMat);
        this.sign(
          root,
          'NACELLE / AIRPORT BELT',
          o.x + 240,
          45,
          o.z + 240,
          info.color,
        );
      }
      this.areas.push({
        root,
        colliders,
        signals,
        lights,
        index,
        enabled: undefined,
      });
    }
    const perimeter = new THREE.Group();
    scene.add(perimeter);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x465868 });
    for (let index = 0; index < 4; index++)
      for (const side of [-1, 1])
        for (const axis of [0, 1]) {
          const o = ORIGINS[index];
          const portal =
            (index === 0 && side === 1) ||
            (index === 1 &&
              ((axis === 0 && side === -1) || (axis === 1 && side === 1))) ||
            (index === 2 && side === -1) ||
            (index === 3 &&
              ((axis === 0 && side === 1) || (axis === 1 && side === -1)));
          const portals = portal ? [0] : [];
          if (index === 2 && axis === 0 && side === 1) portals.push(0, 360);
          if (index === 3 && axis === 1 && side === 1) portals.push(-240, 240);
          const cuts = [
            -500,
            ...[...new Set(portals)]
              .sort((a, b) => a - b)
              .flatMap((c) => [c - 14, c + 14]),
            500,
          ];
          for (let i = 0; i < cuts.length; i += 2) {
            const length = cuts[i + 1] - cuts[i],
              center = (cuts[i + 1] + cuts[i]) / 2;
            const x = o.x + (axis === 0 ? side * 500 : center),
              z = o.z + (axis === 0 ? center : side * 500),
              w = axis === 0 ? 1 : length,
              d = axis === 0 ? length : 1;
            this.block(perimeter, [], x, 0.75, z, w, 1.5, d, wallMat);
          }
        }
    const links = [
      { a: [480, 0], b: [600, 0], index: 1 },
      { a: [1080, 480], b: [1080, 600], index: 2 },
      { a: [600, 1080], b: [480, 1080], index: 3 },
      { a: [0, 600], b: [0, 480], index: 3 },
    ];
    for (const link of links) {
      const x = (link.a[0] + link.b[0]) / 2,
        z = (link.a[1] + link.b[1]) / 2,
        vertical = link.a[0] === link.b[0],
        root = new THREE.Group();
      scene.add(root);
      this.block(
        root,
        [],
        x,
        -0.3,
        z,
        vertical ? 26 : 122,
        0.6,
        vertical ? 122 : 26,
        asphaltMaterial(),
      );
      // Bridge collider is permanent; the barrier alone controls access.
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          vertical ? 13 : 61,
          0.3,
          vertical ? 61 : 13,
        ).setTranslation(x, -0.3, z),
      );
      const rail = new THREE.MeshStandardMaterial({ color: 0x81909f });
      for (const side of [-1, 1])
        this.block(
          root,
          [],
          x + (vertical ? side * 13 : 0),
          0.65,
          z + (vertical ? 0 : side * 13),
          vertical ? 0.6 : 122,
          1.3,
          vertical ? 122 : 0.6,
          rail,
        );
      const gateRoot = new THREE.Group();
      scene.add(gateRoot);
      const material = new THREE.MeshStandardMaterial({
        color: 0x735756,
        emissive: 0x452423,
      });
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(vertical ? 26 : 1, 3, vertical ? 1 : 26),
        material,
      );
      barrier.position.set(x, 1.5, z);
      gateRoot.add(barrier);
      const collider = world.createCollider(
        RAPIER.ColliderDesc.cuboid(
          vertical ? 13 : 0.5,
          1.5,
          vertical ? 0.5 : 13,
        ).setTranslation(x, 1.5, z),
      );
      this.sign(
        gateRoot,
        data.districts[link.index].name + ' / ACCESSO RISERVATO',
        x,
        7,
        z,
        '#e6ac83',
      );
      this.gates.push({ root: gateRoot, collider, index: link.index });
    }
    this.update(district.spawn[0], district.spawn[2], 0, 1);
  }
  private block(
    root: THREE.Group,
    colliders: RAPIER.Collider[],
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    root.add(mesh);
    if (colliders.length || h > 1)
      colliders.push(
        this.world.createCollider(
          RAPIER.ColliderDesc.cuboid(w / 2, h / 2, d / 2).setTranslation(
            x,
            y,
            z,
          ),
        ),
      );
  }
  private sign(
    root: THREE.Group,
    text: string,
    x: number,
    y: number,
    z: number,
    color: string,
  ) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 96;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#10202c';
    ctx.fillRect(0, 0, 512, 96);
    ctx.font = '700 34px "Circuit Grid"';
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    const texture = new THREE.CanvasTexture(c);
    const draw = () => {
      ctx.fillStyle = '#10202c';
      ctx.fillRect(0, 0, 512, 96);
      ctx.fillStyle = color;
      ctx.fillText(t(text.toUpperCase()), 256, 60, 490);
      texture.needsUpdate = true;
    };
    draw();
    window.addEventListener('nc-language', draw);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 2.6),
      new THREE.MeshBasicMaterial({
        map: texture,
      }),
    );
    m.position.set(x, y, z + 0.03);
    const back = m.clone();
    back.rotation.y = Math.PI;
    back.position.z = z - 0.03;
    root.add(m, back);
  }
  update(
    x: number,
    z: number,
    time: number,
    unlocked: number,
    raceHill = false,
  ) {
    if (
      time < this.tick &&
      unlocked === this.unlocked &&
      raceHill === this.raceHill
    )
      return;
    this.raceHill = raceHill;
    const passOpen =
      (unlocked >= 3 && Math.hypot(x - 1750, z - 1080) < 1200) || raceHill;
    this.hill.enabled(passOpen);
    for (const link of this.passLinks) link.enabled(passOpen && unlocked >= 3);
    this.interchange.enabled(unlocked >= 4 && Math.hypot(x, z - 1560) < 1200);
    this.tick = time + 0.2;
    this.unlocked = unlocked;
    for (const a of this.areas) {
      const o = ORIGINS[a.index],
        near = Math.hypot(x - o.x, z - o.z) < 1120,
        enabled = a.index < unlocked;
      a.root.visible = near;
      a.lights.visible = Math.hypot(x - o.x, z - o.z) < 750;
      const physicsEnabled = near && enabled;
      if (a.enabled !== physicsEnabled) {
        for (const c of a.colliders) c.setEnabled(physicsEnabled);
        a.enabled = physicsEnabled;
      }
      for (let n = 0; n < 81; n++)
        for (let d = 0; d < 2; d++) {
          this.color.set(
            signalColor(n, d === 1, time) === 'green' ? 0x6dd9a4 : 0xe17b71,
          );
          a.signals.setColorAt(n * 2 + d, this.color);
        }
      if (a.signals.instanceColor) a.signals.instanceColor.needsUpdate = true;
    }
    for (const gate of this.gates) {
      const closed = gate.index >= unlocked;
      gate.root.visible = closed;
      gate.collider.setEnabled(closed);
    }
  }
  region(x: number, z: number) {
    return data.districts[districtIndex(x, z)].id;
  }
}
