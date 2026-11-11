import * as THREE from 'three';
import type { RoadGraph } from './graph';
import { lightTexture } from './streetscape';

/** Ground intersections of mirrored street lights, rendered as inexpensive ripple cards. */
export class WetReflections {
  private readonly sources: {
    x: number;
    y: number;
    z: number;
    color: number;
    wide: boolean;
  }[] = [];
  private readonly distance: Float64Array;
  private readonly order: number[];
  private readonly cards = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: lightTexture(true),
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    40,
  );
  private readonly dummy = new THREE.Object3D();
  private readonly color = new THREE.Color();
  private readonly previous = new THREE.Vector3(Infinity, Infinity, Infinity);
  constructor(scene: THREE.Scene, graph: RoadGraph) {
    graph.edges.forEach((edge, i) => {
      const a = graph.nodes[edge.a],
        b = graph.nodes[edge.b],
        vertical = a.x === b.x,
        x = (a.x + b.x) / 2,
        z = (a.z + b.z) / 2;
      for (const side of [-1, 1]) {
        if (Math.abs(x) < 24 && z > -355 && z < -250) continue;
        this.sources.push({
          x: x + (vertical ? side * 14 : 0),
          z: z + (vertical ? 0 : side * 14),
          y: 9.6,
          color: i % 3 ? 0xffbc78 : 0x86b5ef,
          wide: false,
        });
        this.sources.push({
          x: x + (vertical ? side * 25 : 18),
          z: z + (vertical ? 18 : side * 25),
          y: 2.8,
          color: i % 2 ? 0x3bc9de : 0xe8609e,
          wide: true,
        });
      }
    });
    for (let z = -342; z <= -262; z += 16)
      for (const x of [-8.5, 6])
        this.sources.push({ x, y: 7.3, z, color: 0xffc276, wide: false });
    this.distance = new Float64Array(this.sources.length);
    this.order = this.sources.map((_, i) => i);
    this.cards.name = 'view-dependent-wet-light-streaks';
    this.cards.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.cards.frustumCulled = false;
    scene.add(this.cards);
  }
  update(camera: THREE.Camera) {
    if (camera.position.distanceToSquared(this.previous) < 0.0001) return;
    this.previous.copy(camera.position);
    const cx = camera.position.x,
      cz = camera.position.z,
      cy = Math.max(0.5, camera.position.y);
    this.sources.forEach((s, i) => {
      this.distance[i] = (s.x - cx) ** 2 + (s.z - cz) ** 2;
    });
    this.order.sort((a, b) => this.distance[a] - this.distance[b]);
    let count = 0;
    for (const index of this.order) {
      const source = this.sources[index],
        d = Math.sqrt(this.distance[index]);
      if (d > 180 || count === 40) break;
      const t = cy / (cy + source.y),
        dx = source.x - cx,
        dz = source.z - cz;
      const centre = (t + 0.9) * 0.5;
      this.dummy.position.set(cx + dx * centre, 0.042, cz + dz * centre);
      this.dummy.rotation.set(-Math.PI / 2, 0, Math.atan2(-dx, -dz));
      this.dummy.scale.set(
        source.wide ? 1.1 : 0.7,
        Math.min(70, 8 + d * (0.9 - t)),
        1,
      );
      this.dummy.updateMatrix();
      this.cards.setMatrixAt(count, this.dummy.matrix);
      this.color.setHex(source.color).multiplyScalar(2 * (1 - d / 220));
      this.cards.setColorAt(count++, this.color);
    }
    this.cards.count = count;
    this.cards.instanceMatrix.needsUpdate = true;
    if (this.cards.instanceColor) this.cards.instanceColor.needsUpdate = true;
  }
}
