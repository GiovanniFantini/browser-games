import * as THREE from 'three';
import { atlasPois, districtIndex, roadHeight } from './atlas';
/** Four persistent uniforms, even when no sign is close enough to contribute light. */
export class WorldLighting {
  private readonly lights = Array.from(
    { length: 4 },
    () => new THREE.PointLight(0x72d4e5, 0, 35, 1.4),
  );
  private readonly sources = atlasPois()
    .filter(
      (p) => !p.id.startsWith('fragment-') && !p.id.startsWith('passage-'),
    )
    .map((p) => {
      const index = districtIndex(p.x, p.z),
        offset = index === 0 ? 18 : 16;
      return {
        x: p.x + offset,
        y: roadHeight(p.x, p.z) + 5,
        z: p.z + offset,
        index,
        color: p.type === 'shop' ? 0xe775b2 : 0x72d4e5,
      };
    });
  private readonly distances = new Float64Array(4);
  private readonly picks = new Int32Array(4);
  private next = 0;
  private x = Infinity;
  private z = Infinity;
  private access = 0;
  constructor(scene: THREE.Scene) {
    scene.add(...this.lights);
  }
  update(x: number, y: number, z: number, time: number, unlocked: number) {
    if (
      time < this.next &&
      Math.abs(x - this.x) + Math.abs(z - this.z) < 3 &&
      unlocked === this.access
    )
      return;
    this.next = time + 0.2;
    this.x = x;
    this.z = z;
    this.access = unlocked;
    this.distances.fill(Infinity);
    this.picks.fill(-1);
    for (let i = 0; i < this.sources.length; i++) {
      const p = this.sources[i];
      if (p.index >= unlocked) continue;
      const distance = (p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2;
      for (let slot = 0; slot < 4; slot++)
        if (distance < this.distances[slot]) {
          for (let j = 3; j > slot; j--) {
            this.distances[j] = this.distances[j - 1];
            this.picks[j] = this.picks[j - 1];
          }
          this.distances[slot] = distance;
          this.picks[slot] = i;
          break;
        }
    }
    for (let i = 0; i < 4; i++) {
      const p = this.sources[this.picks[i]],
        light = this.lights[i];
      light.intensity = p ? 85 : 0;
      if (p) {
        light.position.set(p.x, p.y, p.z);
        light.color.setHex(p.color);
      }
    }
  }
}
