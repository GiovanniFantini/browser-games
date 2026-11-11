import * as THREE from 'three';
import type { Vehicle } from './vehicle';

export class ChaseCamera {
  mode = 0;
  private readonly desired = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private readonly look = new THREE.Vector3();
  private readonly direction = new THREE.Quaternion();
  private readonly forward = new THREE.Vector3();
  private initialized = false;
  readonly names = ['VICINA', 'LONTANA', 'COFANO', 'PARAURTI'];
  constructor(readonly camera: THREE.PerspectiveCamera) {}
  reset() {
    this.initialized = false;
  }
  cycle() {
    this.mode = (this.mode + 1) % 4;
    this.reset();
  }
  update(car: Vehicle, dt: number) {
    const root = car.model.root;
    const forward = this.forward.set(0, 0, 1).applyQuaternion(root.quaternion);
    const yaw = Math.atan2(forward.x, forward.z);
    this.direction.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
    if (this.mode < 2) {
      this.desired
        .set(0, this.mode === 0 ? 3.1 : 5.3, this.mode === 0 ? -7.7 : -12)
        .applyQuaternion(this.direction)
        .add(root.position);
      this.target
        .set(0, 0.75, 5.5)
        .applyQuaternion(this.direction)
        .add(root.position);
    } else {
      this.desired
        .set(
          0,
          this.mode === 2 ? 0.7 * car.model.spec.roof : 0,
          this.mode === 2
            ? car.model.spec.length * 0.26
            : car.model.spec.length / 2 + 0.18,
        )
        .applyQuaternion(root.quaternion)
        .add(root.position);
      this.target.copy(this.desired).addScaledVector(forward, 30);
    }
    const blend = this.initialized
      ? 1 - Math.exp(-dt * (this.mode < 2 ? 6 : 30))
      : 1;
    this.camera.position.lerp(this.desired, blend);
    this.look.lerp(this.target, blend);
    this.camera.lookAt(this.look);
    this.camera.fov = THREE.MathUtils.damp(
      this.camera.fov,
      car.power.boosting ? 83 : 65 + Math.min(Math.abs(car.speed) * 0.13, 7),
      4,
      dt,
    );
    this.camera.updateProjectionMatrix();
    this.initialized = true;
  }
}
