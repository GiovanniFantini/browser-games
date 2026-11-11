import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import config from '../data/prototype.json';
import type { DriveInput } from '../core/input';
import { updatePowertrain, shiftGear, type Powertrain } from './drivetrain';
import { createCar } from './model';
import type { Appearance } from '../tuning/appearance';
import {
  calculateStats,
  stockLevels,
  type CarStats,
} from '../progression/catalog';

export class Vehicle {
  model: ReturnType<typeof createCar>;
  readonly body: RAPIER.RigidBody;
  readonly controller: RAPIER.DynamicRayCastVehicleController;
  readonly power: Powertrain = {
    gear: 1,
    rpm: 950,
    nitro: 1,
    boosting: false,
    drive: 0,
    braking: 0,
  };
  readonly position = new THREE.Vector3();
  readonly rotation = new THREE.Quaternion();
  readonly previousPosition = new THREE.Vector3();
  readonly previousRotation = new THREE.Quaternion();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly velocity = new THREE.Vector3();
  private readonly force = { x: 0, y: 0, z: 0 };
  private readonly torque = { x: 0, y: 0, z: 0 };
  private readonly heldVelocity = { x: 0, y: 0, z: 0 };
  private readonly zeroAngular = { x: 0, y: 0, z: 0 };
  private readonly wheelPositions: THREE.Vector3[] = [];
  private appearanceKey = '';
  private readonly simple: boolean;
  stats: CarStats = calculateStats(stockLevels());
  resetSerial = 0;
  collided = false;
  impactSpeed = 0;
  private readonly contactManifold = (m: RAPIER.TempContactManifold) => {
    if (m.numSolverContacts() > 0 && Math.abs(m.normal().y) < 0.65)
      this.collided = true;
  };
  private readonly contactCollider = (other: RAPIER.Collider) => {
    this.world.contactPair(this.body.collider(0), other, this.contactManifold);
  };
  shift(direction: number) {
    shiftGear(this.power, direction, this.stats.rpmLimit);
  }
  speed = 0;
  slip = 0;
  steering = 0;
  grounded = 0;
  assist = true;

  constructor(
    private readonly world: RAPIER.World,
    scene: THREE.Scene,
    private spawn = config.track.spawn,
    appearance: { color?: string; simple?: boolean } = {},
  ) {
    this.simple = !!appearance.simple;
    this.model = createCar(appearance);
    const car = config.car;
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(...(config.track.spawn as [number, number, number]))
        .setLinearDamping(0.16)
        .setAngularDamping(2.2)
        .setCanSleep(false)
        .setCcdEnabled(true),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(car.width / 2, 0.24, car.length / 2)
        .setMass(car.mass)
        .setFriction(0.15)
        .setRestitution(0.1),
      this.body,
    );
    this.controller = world.createVehicleController(this.body);
    this.controller.indexUpAxis = 1;
    this.controller.setIndexForwardAxis = 2;
    for (let i = 0; i < 4; i++) {
      const x = i % 2 === 0 ? -0.88 : 0.88;
      const z = i < 2 ? car.wheelbase / 2 : -car.wheelbase / 2;
      const connection = new THREE.Vector3(x, -0.08, z);
      this.wheelPositions.push(connection);
      this.controller.addWheel(
        connection,
        { x: 0, y: -1, z: 0 },
        { x: -1, y: 0, z: 0 },
        car.suspensionLength,
        car.wheelRadius,
      );
      this.controller.setWheelSuspensionStiffness(i, car.suspensionStiffness);
      this.controller.setWheelSuspensionCompression(
        i,
        car.suspensionCompression,
      );
      this.controller.setWheelSuspensionRelaxation(i, car.suspensionRelaxation);
      this.controller.setWheelMaxSuspensionForce(i, 22000);
      this.controller.setWheelMaxSuspensionTravel(i, 0.22);
      this.controller.setWheelFrictionSlip(i, car.grip);
      this.controller.setWheelSideFrictionStiffness(i, 1.2);
    }
    this.body.setTranslation(
      { x: this.spawn[0], y: this.spawn[1], z: this.spawn[2] },
      true,
    );
    scene.add(this.model.root);
    this.capture();
    this.previousPosition.copy(this.position);
    this.previousRotation.copy(this.rotation);
  }

  applyAppearance(appearance: Appearance, model = 'silex-c1') {
    const key = model + JSON.stringify(appearance);
    if (key === this.appearanceKey) return;
    this.appearanceKey = key;
    const old = this.model,
      parent = old.root.parent;
    this.model = createCar({ appearance, model, simple: this.simple });
    parent?.remove(old.root);
    parent?.add(this.model.root);
    old.dispose();
    this.render(1, 0);
  }
  applyStats(stats: CarStats) {
    this.stats = stats;
    this.body.setLinearDamping(stats.damping);
    this.body
      .collider(0)
      .setShape(new RAPIER.Cuboid(stats.width / 2, 0.24, stats.length / 2));
    this.body.collider(0).setMass(stats.mass);
    this.body.recomputeMassPropertiesFromColliders();
    for (let i = 0; i < 4; i++) {
      this.wheelPositions[i].set(
        ((i % 2 ? 1 : -1) * stats.track) / 2,
        -0.08,
        ((i < 2 ? 1 : -1) * stats.wheelbase) / 2,
      );
      this.controller.setWheelChassisConnectionPointCs(
        i,
        this.wheelPositions[i],
      );
      this.controller.setWheelSuspensionStiffness(i, stats.suspensionStiffness);
      this.controller.setWheelSuspensionCompression(
        i,
        stats.suspensionCompression,
      );
      this.controller.setWheelSuspensionRelaxation(
        i,
        stats.suspensionRelaxation,
      );
      this.controller.setWheelFrictionSlip(i, stats.grip);
    }
  }

  setSpawn(x: number, y: number, z: number) {
    this.spawn = [x, y, z];
  }

  reset() {
    const [x, y, z] = this.spawn;
    this.place(x, y, z, 0);
  }

  place(x: number, y: number, z: number, yaw: number) {
    this.resetSerial++;
    this.impactSpeed = 0;
    this.body.setTranslation({ x, y, z }, true);
    this.body.setRotation(
      { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
      true,
    );
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.body.resetForces(true);
    this.body.resetTorques(true);
    this.steering = this.speed = this.slip = 0;
    this.power.boosting = false;
    this.capture();
    this.previousPosition.copy(this.position);
    this.previousRotation.copy(this.rotation);
  }

  hold() {
    this.heldVelocity.y = this.body.linvel().y;
    this.body.setLinvel(this.heldVelocity, true);
    this.body.setAngvel(this.zeroAngular, true);
    this.power.boosting = false;
  }

  setEnabled(enabled: boolean) {
    this.body.setEnabled(enabled);
    this.model.root.visible = enabled;
  }

  step(input: DriveInput, dt: number) {
    const car = this.stats;
    this.previousPosition.copy(this.position);
    this.previousRotation.copy(this.rotation);
    this.forward.set(0, 0, 1).applyQuaternion(this.rotation);
    this.right.set(1, 0, 0).applyQuaternion(this.rotation);
    this.up.set(0, 1, 0).applyQuaternion(this.rotation);
    this.velocity.copy(this.body.linvel());
    this.speed = this.velocity.dot(this.forward);
    this.slip = this.velocity.dot(this.right);
    this.grounded = 0;
    for (let i = 0; i < 4; i++)
      if (this.controller.wheelIsInContact(i)) this.grounded++;
    updatePowertrain(
      this.power,
      this.speed,
      input.throttle,
      input.brake,
      input.nitro,
      this.grounded > 1,
      dt,
      car,
    );
    // Lost lateral traction unloads the engine even when forward wheel speed drops.
    if (this.grounded > 1 && input.throttle > 0.1 && Math.abs(this.slip) > 2) {
      const lostTraction = Math.min(
        1,
        Math.abs(this.slip) / Math.max(6, Math.hypot(this.speed, this.slip)),
      );
      this.power.rpm = Math.max(
        this.power.rpm,
        950 + lostTraction * input.throttle * car.rpmLimit * 0.7,
      );
    }
    const targetSteer =
      input.steer * (0.48 / (1 + Math.abs(this.speed) * 0.022));
    const counter =
      this.assist && Math.abs(this.speed) > 5
        ? THREE.MathUtils.clamp(
            (this.slip / Math.abs(this.speed)) * 0.14,
            -0.12,
            0.12,
          )
        : 0;
    this.steering = THREE.MathUtils.damp(
      this.steering,
      targetSteer + counter,
      9,
      dt,
    );
    for (let i = 0; i < 4; i++) {
      this.controller.setWheelSteering(i, i < 2 ? this.steering : 0);
      this.controller.setWheelEngineForce(i, this.power.drive / 4);
      this.controller.setWheelBrake(
        i,
        this.power.braking * car.brake + (input.handbrake && i >= 2 ? 18 : 0),
      );
      this.controller.setWheelFrictionSlip(
        i,
        input.handbrake
          ? i >= 2
            ? car.handbrakeGripRear
            : car.grip * car.handbrakeGripFront
          : car.grip,
      );
      this.controller.setWheelSideFrictionStiffness(
        i,
        input.handbrake
          ? i >= 2
            ? car.handbrakeStiffnessRear
            : car.handbrakeStiffnessFront
          : 1.2,
      );
    }
    this.body.resetForces(false);
    this.body.resetTorques(false);
    if (this.grounded > 1) {
      const grip = input.handbrake
        ? car.handbrakeLateralDamping
        : 2.4 * (car.grip / config.car.grip);
      const lateral = -this.slip * car.mass * grip;
      const drag = -this.speed * Math.abs(this.speed) * car.aeroDrag;
      this.force.x = this.right.x * lateral + this.forward.x * drag;
      this.force.y = -Math.abs(this.speed) * 19;
      this.force.z = this.right.z * lateral + this.forward.z * drag;
      this.body.addForce(this.force, true);
      // Roll/pitch stabilization retains suspension movement and airborne rotation.
      this.torque.x = -this.up.z * 4200;
      this.torque.y = input.handbrake
        ? input.steer *
          Math.min(Math.abs(this.speed), 18) *
          car.handbrakeYawTorque
        : 0;
      this.torque.z = this.up.x * 4200;
      this.body.addTorque(this.torque, true);
    }
    this.controller.updateVehicle(dt, RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC);
  }

  capture() {
    this.collided = false;
    this.world.contactPairsWith(this.body.collider(0), this.contactCollider);
    if (this.collided)
      this.impactSpeed = Math.max(
        this.impactSpeed,
        Math.hypot(this.speed, this.slip),
      );
    this.position.copy(this.body.translation());
    this.rotation.copy(this.body.rotation());
    if (
      this.position.y < -12 ||
      Math.abs(this.position.x) > 2100 ||
      Math.abs(this.position.z) > 1800
    )
      this.reset();
  }

  render(alpha: number, time: number) {
    const root = this.model.root;
    root.position.lerpVectors(this.previousPosition, this.position, alpha);
    root.quaternion.slerpQuaternions(
      this.previousRotation,
      this.rotation,
      alpha,
    );
    for (let i = 0; i < 4; i++) {
      const wheel = this.model.wheels[i];
      wheel.position.copy(this.wheelPositions[i]);
      wheel.position.y -=
        this.controller.wheelSuspensionLength(i) ?? config.car.suspensionLength;
      wheel.rotation.set(0, i < 2 ? this.steering : 0, 0);
      const spin = this.controller.wheelRotation(i) ?? 0;
      wheel.userData.spin = spin;
      wheel.rotateX(spin);
    }
    this.model.flame.visible = this.power.boosting;
    this.model.flame.scale.y = 0.8 + Math.sin(time * 80) * 0.2;
    this.model.animate(time, this.speed, this.power.braking > 0);
  }
}
