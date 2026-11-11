import * as THREE from 'three';
import type { Vehicle } from '../vehicle/vehicle';
export class DebugGeometry {
  private readonly positions = new Float32Array(24);
  private readonly rays: THREE.LineSegments;
  private readonly origin = new THREE.Vector3();
  private readonly direction = new THREE.Vector3();
  private readonly line = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xf7ad55, depthTest: false }),
  );
  private routeKey: unknown;
  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    this.rays = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: 0x9aefb1, depthTest: false }),
    );
    this.rays.frustumCulled = false;
    this.rays.renderOrder = 100;
    this.line.renderOrder = 99;
    scene.add(this.rays, this.line);
  }
  update(
    car: Vehicle,
    visible: boolean,
    route?: readonly { x: number; y?: number; z: number }[],
  ) {
    this.rays.visible = this.line.visible = visible;
    if (!visible) return;
    for (let i = 0; i < 4; i++) {
      const connection = car.controller.wheelChassisConnectionPointCs(i);
      if (!connection) continue;
      this.origin
        .copy(connection)
        .applyQuaternion(car.rotation)
        .add(car.position);
      this.direction
        .set(0, -0.8, 0)
        .applyQuaternion(car.rotation)
        .add(this.origin);
      const offset = i * 6;
      this.positions[offset] = this.origin.x;
      this.positions[offset + 1] = this.origin.y;
      this.positions[offset + 2] = this.origin.z;
      this.positions[offset + 3] = this.direction.x;
      this.positions[offset + 4] = this.direction.y;
      this.positions[offset + 5] = this.direction.z;
    }
    this.rays.geometry.attributes.position.needsUpdate = true;
    if (this.routeKey !== route) {
      this.routeKey = route;
      this.line.geometry.dispose();
      this.line.geometry = new THREE.BufferGeometry().setFromPoints(
        (route ?? []).map(
          (p) => new THREE.Vector3(p.x, (p.y ?? 0) + 0.25, p.z),
        ),
      );
    }
  }
}
