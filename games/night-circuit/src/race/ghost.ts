import { streetPoint, streetHeight } from '../world/street-layout';
import * as THREE from 'three';
import settings from '../data/modes.json';
import { createCar } from '../vehicle/model';
export interface GhostRecord {
  version: number;
  layout?: 2;
  event: string;
  duration: number;
  frames: number[][];
}
export class GhostRecorder {
  private readonly buffer = new Float32Array(settings.ghost.maxFrames * 8);
  private count = 0;
  private last = -1;
  valid = true;
  capture(
    time: number,
    position: THREE.Vector3,
    rotation: THREE.Quaternion,
    force = false,
  ) {
    if (
      !this.valid ||
      time <= this.last ||
      (!force && time - this.last < settings.ghost.sampleInterval - 1e-5)
    )
      return;
    if (this.count >= settings.ghost.maxFrames) {
      this.valid = false;
      return;
    }
    const offset = this.count++ * 8;
    this.last = time;
    this.buffer[offset] = time;
    this.buffer[offset + 1] = position.x;
    this.buffer[offset + 2] = position.y;
    this.buffer[offset + 3] = position.z;
    this.buffer[offset + 4] = rotation.x;
    this.buffer[offset + 5] = rotation.y;
    this.buffer[offset + 6] = rotation.z;
    this.buffer[offset + 7] = rotation.w;
  }
  finish(event: string, duration: number): GhostRecord | null {
    if (!this.valid || this.count < 2 || duration > settings.ghost.maxDuration)
      return null;
    const frames: number[][] = [];
    for (let i = 0; i < this.count; i++) {
      const frame = Array.from(
        this.buffer.subarray(i * 8, i * 8 + 8),
        (v) => Math.round(v * 10000) / 10000,
      );
      // A forced finish sample can round to the preceding sample's timestamp.
      // Keep the final pose without emitting two frames at the same instant.
      if (frames.at(-1)?.[0] === frame[0]) frames[frames.length - 1] = frame;
      else frames.push(frame);
    }
    try {
      return parseGhost({
        version: settings.ghost.version,
        layout: 2,
        event,
        duration,
        frames,
      });
    } catch {
      // An unusable recording must never invalidate the race reward transaction.
      return null;
    }
  }
}
export function parseGhost(value: unknown): GhostRecord | null {
  if (value === null) return null;
  if (!value || typeof value !== 'object') throw Error('Fantasma non valido.');
  const g = value as GhostRecord;
  if (
    g.version !== settings.ghost.version ||
    g.event !== 'ghost-foundry' ||
    (g.layout !== undefined && g.layout !== 2) ||
    !Number.isFinite(g.duration) ||
    g.duration <= 0 ||
    g.duration > settings.ghost.maxDuration ||
    !Array.isArray(g.frames) ||
    g.frames.length < 2 ||
    g.frames.length > settings.ghost.maxFrames
  )
    throw Error('Fantasma non valido.');
  let last = -1;
  const frames = g.frames.map((frame) => {
    if (
      !Array.isArray(frame) ||
      frame.length !== 8 ||
      frame.some((v) => typeof v !== 'number' || !Number.isFinite(v)) ||
      frame[0] <= last ||
      frame[0] > g.duration + 0.025 ||
      frame.slice(1, 4).some((v) => Math.abs(v) > 850) ||
      Math.abs(Math.hypot(...frame.slice(4)) - 1) > 0.01
    )
      throw Error('Fotogramma fantasma non valido.');
    last = frame[0];
    return [...frame];
  });
  if (frames[0][0] !== 0 || Math.abs(frames.at(-1)![0] - g.duration) > 0.025)
    throw Error('Fantasma incompleto.');
  return {
    version: g.version,
    ...(g.layout === 2 ? { layout: 2 as const } : {}),
    event: g.event,
    duration: g.duration,
    frames,
  };
}
export class GhostCar {
  private readonly car = createCar({ simple: true, color: '#55d8ed' });
  private readonly next = new THREE.Quaternion();
  private record: GhostRecord | null = null;
  private index = 0;
  constructor(scene: THREE.Scene) {
    this.car.root.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = false;
        o.receiveShadow = false;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.transparent = true;
          m.opacity = 0.28;
          m.depthWrite = false;
        }
      }
    });
    this.car.wheels.forEach((w, i) =>
      w.position.set(i % 2 ? 0.88 : -0.88, -0.4, i < 2 ? 1.33 : -1.33),
    );
    this.car.root.visible = false;
    scene.add(this.car.root);
  }
  load(record: GhostRecord | null) {
    // Legacy recordings remain importable. Adapt their pose at playback only,
    // leaving the saved original and its timing untouched.
    this.record =
      record && record.layout !== 2
        ? {
            ...record,
            layout: 2,
            frames: record.frames.map((frame) => {
              const f = [...frame],
                p = streetPoint(f[1], f[3]);
              const q = new THREE.Quaternion(f[4], f[5], f[6], f[7]);
              const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
              const next = streetPoint(f[1] + forward.x, f[3] + forward.z);
              const delta =
                Math.atan2(next.x - p.x, next.z - p.z) -
                Math.atan2(forward.x, forward.z);
              q.premultiply(
                new THREE.Quaternion().setFromAxisAngle(
                  THREE.Object3D.DEFAULT_UP,
                  delta,
                ),
              );
              const oldPitch = Math.asin(Math.max(-1, Math.min(1, forward.y))),
                newPitch = Math.atan2(
                  streetHeight(next.x, next.z) - streetHeight(p.x, p.z),
                  Math.hypot(next.x - p.x, next.z - p.z),
                );
              const yaw = Math.atan2(next.x - p.x, next.z - p.z);
              q.premultiply(
                new THREE.Quaternion().setFromAxisAngle(
                  new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)),
                  oldPitch - newPitch,
                ),
              );
              f[1] = p.x;
              f[2] += streetHeight(p.x, p.z);
              f[3] = p.z;
              f[4] = q.x;
              f[5] = q.y;
              f[6] = q.z;
              f[7] = q.w;
              return f;
            }),
          }
        : record;
    this.index = 0;
    this.car.root.visible = false;
  }
  render(time: number) {
    const g = this.record;
    if (!g || time > g.duration) {
      this.car.root.visible = false;
      return;
    }
    this.car.root.visible = true;
    while (
      this.index < g.frames.length - 2 &&
      g.frames[this.index + 1][0] < time
    )
      this.index++;
    const a = g.frames[this.index],
      b = g.frames[this.index + 1],
      t = Math.max(0, Math.min(1, (time - a[0]) / (b[0] - a[0])));
    this.car.root.position.set(
      a[1] + (b[1] - a[1]) * t,
      a[2] + (b[2] - a[2]) * t,
      a[3] + (b[3] - a[3]) * t,
    );
    this.car.root.quaternion.set(a[4], a[5], a[6], a[7]);
    this.next.set(b[4], b[5], b[6], b[7]);
    this.car.root.quaternion.slerp(this.next, t);
  }
  get visible() {
    return this.car.root.visible;
  }
}
