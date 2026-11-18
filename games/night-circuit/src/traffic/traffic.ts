import { streetPoint } from '../world/street-layout';
import { edgeFrame } from '../world/street-network';
import { roadHeight } from '../world/atlas';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import data from '../data/district.json';
import { findPath, type RoadGraph } from '../world/graph';
import { signalColor } from './signals';
import modeConfig from '../data/modes.json';

interface Point {
  x: number;
  z: number;
  distance: number;
}
interface Stop {
  distance: number;
  node: number;
  vertical: boolean;
}
interface Route {
  points: Point[];
  stops: Stop[];
  length: number;
}
interface Civilian {
  route: Route;
  distance: number;
  speed: number;
  x: number;
  z: number;
  dx: number;
  dz: number;
  body: RAPIER.RigidBody;
}

function makeRoute(graph: RoadGraph, index: number): Route {
  const n = data.coordinates.length,
    left = index % 3,
    top = Math.floor(index / 3) % 3;
  const right = Math.min(n - 1, left + 3 + (index % 3)),
    bottom = Math.min(n - 1, top + 3 + (Math.floor(index / 2) % 3));
  const corners: number[] = [];
  for (let x = left; x < right; x++) corners.push(top * n + x);
  for (let z = top; z < bottom; z++) corners.push(z * n + right);
  for (let x = right; x > left; x--) corners.push(bottom * n + x);
  for (let z = bottom; z > top; z--) corners.push(z * n + left);
  if (index % 2) corners.reverse();
  const ids: number[] = [];
  for (let i = 0; i < corners.length; i++) {
    const path = findPath(graph, corners[i], corners[(i + 1) % corners.length]);
    for (const id of path.slice(0, -1)) {
      if (ids.at(-1) === id) continue;
      if (ids.at(-2) === id) ids.pop();
      else ids.push(id);
    }
  }
  while (ids.length > 3 && ids[1] === ids.at(-1)) {
    ids.shift();
    ids.pop();
  }
  const points: Point[] = [],
    stops: Stop[] = [];
  let length = 0;
  const add = (x: number, z: number) => {
    const previous = points.at(-1);
    if (previous) length += Math.hypot(x - previous.x, z - previous.z);
    points.push({ x, z, distance: length });
  };
  for (let i = 0; i < ids.length; i++) {
    const a = graph.nodes[ids[i]],
      b = graph.nodes[ids[(i + 1) % ids.length]],
      c = graph.nodes[ids[(i + 2) % ids.length]];
    const edge = graph.edges.find(
      (e) => (e.a === a.id && e.b === b.id) || (e.a === b.id && e.b === a.id),
    )!;
    const nextEdge = graph.edges.find(
      (e) => (e.a === b.id && e.b === c.id) || (e.a === c.id && e.b === b.id),
    )!;
    const at = (distance: number) => {
      const f = edgeFrame(
        graph,
        edge,
        edge.a === a.id ? distance / edge.length : 1 - distance / edge.length,
      );
      if (edge.a !== a.id) {
        f.dx *= -1;
        f.dz *= -1;
      }
      return f;
    };
    const end = at(edge.length - 15);
    const next = edgeFrame(
      graph,
      nextEdge,
      nextEdge.a === b.id ? 15 / nextEdge.length : 1 - 15 / nextEdge.length,
    );
    if (nextEdge.a !== b.id) {
      next.dx *= -1;
      next.dz *= -1;
    }
    const dx = end.dx,
      dz = end.dz,
      nx = next.dx,
      nz = next.dz,
      offset = data.laneOffset;
    const endX = end.x - dz * offset,
      endZ = end.z + dx * offset;
    for (let d = 15; d < edge.length - 15; d += 4) {
      const f = at(d);
      add(f.x - f.dz * offset, f.z + f.dx * offset);
    }
    add(endX, endZ);
    stops.push({
      distance: length,
      node: b.id,
      vertical: Math.abs(dz) > Math.abs(dx),
    });
    const nextX = next.x - nz * offset,
      nextZ = next.z + nx * offset;
    // Quadratic spline rounds each junction while remaining inside its square.
    const denominator = Math.max(0.2, 1 + dx * nx + dz * nz);
    const controlX = b.x - ((dz + nz) * offset) / denominator,
      controlZ = b.z + ((dx + nx) * offset) / denominator;
    for (let j = 1; j <= 8; j++) {
      const t = j / 8,
        s = 1 - t;
      add(
        s * s * endX + 2 * s * t * controlX + t * t * nextX,
        s * s * endZ + 2 * s * t * controlZ + t * t * nextZ,
      );
    }
  }
  add(points[0].x, points[0].z);
  return { points, stops, length };
}

export class Traffic {
  private readonly cars: Civilian[] = [];
  private readonly shell: THREE.InstancedMesh;
  private readonly cabin: THREE.InstancedMesh;
  private readonly tires: THREE.InstancedMesh;
  private readonly lamps: THREE.InstancedMesh;
  private readonly meshes: THREE.InstancedMesh[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly quaternion = new THREE.Quaternion();
  private readonly translation = { x: 0, y: 0.53, z: 0 };
  private readonly offset = new THREE.Vector3();
  count = data.traffic.default;
  stopped = 0;
  private savedRoutes: { route: Route; distance: number }[] | null = null;
  get vehicles() {
    return this.cars;
  }
  drag(enabled: boolean) {
    if (enabled && !this.savedRoutes) {
      this.savedRoutes = this.cars.map((c) => ({
        route: c.route,
        distance: c.distance,
      }));
      for (let i = 0; i < modeConfig.drag.trafficCount; i++) {
        const x = i % 2 ? 4.5 : -4.5,
          points: Point[] = [];
        let distance = 0;
        const corners = [
          [x, -480],
          [x, 480],
          [x + 120, 480],
          [x + 120, -480],
          [x, -480],
        ];
        for (let j = 0; j < corners.length - 1; j++) {
          const a = corners[j],
            b = corners[j + 1],
            steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4);
          for (let k = j ? 1 : 0; k <= steps; k++) {
            const p = streetPoint(
                a[0] + ((b[0] - a[0]) * k) / steps,
                a[1] + ((b[1] - a[1]) * k) / steps,
              ),
              last = points.at(-1);
            if (last) distance += Math.hypot(p.x - last.x, p.z - last.z);
            points.push({ ...p, distance });
          }
        }
        const c = this.cars[i];
        c.route = { points, stops: [], length: distance };
        c.distance = 250 + i * 105;
        c.speed = modeConfig.drag.trafficSpeed;
        this.locate(c);
        c.body.setTranslation(
          { x: c.x, y: roadHeight(c.x, c.z) + 0.53, z: c.z },
          false,
        );
      }
    } else if (!enabled && this.savedRoutes) {
      this.cars.forEach((c, i) => {
        c.route = this.savedRoutes![i].route;
        c.distance = this.savedRoutes![i].distance;
        this.locate(c);
        c.body.setTranslation(
          { x: c.x, y: roadHeight(c.x, c.z) + 0.53, z: c.z },
          false,
        );
      });
      this.savedRoutes = null;
    }
  }

  constructor(scene: THREE.Scene, world: RAPIER.World, graph: RoadGraph) {
    const max = data.traffic.maximum;
    const box = new THREE.BoxGeometry(1, 1, 1);
    this.shell = new THREE.InstancedMesh(
      box,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.3,
        metalness: 0.5,
      }),
      max,
    );
    this.cabin = new THREE.InstancedMesh(
      box,
      new THREE.MeshStandardMaterial({
        color: 0x153341,
        metalness: 0.6,
        roughness: 0.16,
      }),
      max,
    );
    this.tires = new THREE.InstancedMesh(
      box,
      new THREE.MeshStandardMaterial({ color: 0x0c111c }),
      max * 4,
    );
    this.lamps = new THREE.InstancedMesh(
      box,
      new THREE.MeshBasicMaterial({ color: 0xd6f1ec }),
      max * 2,
    );
    const colors = [0x6d8d98, 0x7c6f9c, 0xac9164, 0x50796d, 0xb1b9ac];
    for (let i = 0; i < max; i++) {
      const route = makeRoute(graph, i);
      const body = world.createRigidBody(
        RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
          0,
          -100,
          0,
        ),
      );
      world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.88, 0.43, 2)
          .setFriction(0.1)
          .setRestitution(0.05),
        body,
      );
      const car = {
        route,
        distance: route.length * ((i * 0.6180339) % 1),
        speed: 0,
        x: 0,
        z: 0,
        dx: 0,
        dz: 1,
        body,
      };
      this.locate(car);
      body.setTranslation(
        { x: car.x, y: roadHeight(car.x, car.z) + 0.53, z: car.z },
        false,
      );
      this.dummy.rotation.set(
        -Math.atan2(
          roadHeight(car.x + car.dx, car.z + car.dz) -
            roadHeight(car.x - car.dx, car.z - car.dz),
          2,
        ),
        Math.atan2(car.dx, car.dz),
        0,
        'YXZ',
      );
      this.quaternion.copy(this.dummy.quaternion);
      body.setRotation(this.quaternion, false);
      this.cars.push(car);
      this.shell.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    }
    this.meshes.push(this.shell, this.cabin, this.tires, this.lamps);
    for (const mesh of this.meshes) {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      scene.add(mesh);
    }
    this.setDensity(this.count);
  }

  get positions(): readonly { x: number; z: number }[] {
    return this.cars;
  }
  setDistrict(graph: RoadGraph) {
    this.drag(false);
    this.cars.forEach((c, i) => {
      c.route = makeRoute(graph, i);
      c.distance = c.route.length * ((i * 0.6180339) % 1);
      this.locate(c);
      c.speed = 0;
      c.body.setTranslation(
        { x: c.x, y: roadHeight(c.x, c.z) + 0.53, z: c.z },
        false,
      );
    });
  }
  setDensity(count: number) {
    this.count = Math.max(0, Math.min(data.traffic.maximum, count));
    this.shell.count = this.cabin.count = this.count;
    this.tires.count = this.count * 4;
    this.lamps.count = this.count * 2;
    for (let i = 0; i < this.cars.length; i++)
      this.cars[i].body.setEnabled(i < this.count);
  }

  step(dt: number, time: number, player: THREE.Vector3) {
    this.stopped = 0;
    for (let i = 0; i < this.count; i++) {
      const car = this.cars[i],
        route = car.route;
      let targetSpeed = data.traffic.speed * (0.88 + (i % 4) * 0.08);
      for (const stop of route.stops) {
        const distance =
          (stop.distance - car.distance + route.length) % route.length;
        if (
          distance < 25 &&
          signalColor(stop.node, stop.vertical, time) !== 'green'
        )
          targetSpeed = Math.min(
            targetSpeed,
            Math.max(0, (distance - 3) * 1.5),
          );
      }
      const px = player.x - car.x,
        pz = player.z - car.z;
      const ahead = px * car.dx + pz * car.dz,
        side = Math.abs(px * car.dz - pz * car.dx);
      if (ahead > 0 && ahead < 14 && side < 3)
        targetSpeed = Math.min(targetSpeed, Math.max(0, (ahead - 7) * 1.5));
      for (let j = 0; j < this.count; j++)
        if (i !== j) {
          const other = this.cars[j],
            dx = other.x - car.x,
            dz = other.z - car.z;
          const along = dx * car.dx + dz * car.dz;
          if (
            along > 0 &&
            along < 16 &&
            Math.abs(dx * car.dz - dz * car.dx) < 2.8 &&
            car.dx * other.dx + car.dz * other.dz > 0.6
          )
            targetSpeed = Math.min(targetSpeed, Math.max(0, (along - 7) * 1.2));
        }
      car.speed = THREE.MathUtils.damp(
        car.speed,
        targetSpeed,
        targetSpeed < car.speed ? 5 : 1.5,
        dt,
      );
      if (car.speed < 0.4) this.stopped++;
      car.distance = (car.distance + car.speed * dt) % route.length;
      this.locate(car);
      this.translation.y = roadHeight(car.x, car.z) + 0.53;
      this.translation.x = car.x;
      this.translation.z = car.z;
      this.dummy.rotation.set(
        -Math.atan2(
          roadHeight(car.x + car.dx, car.z + car.dz) -
            roadHeight(car.x - car.dx, car.z - car.dz),
          2,
        ),
        Math.atan2(car.dx, car.dz),
        0,
        'YXZ',
      );
      this.quaternion.copy(this.dummy.quaternion);
      car.body.setNextKinematicTranslation(this.translation);
      car.body.setNextKinematicRotation(this.quaternion);
    }
  }

  render() {
    for (let i = 0; i < this.count; i++) {
      const car = this.cars[i],
        position = car.body.translation(),
        rotation = car.body.rotation();
      this.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      this.part(this.shell, i, position, 0, 0, 0, 1.8, 0.52, 4.1);
      this.part(this.cabin, i, position, 0, 0.48, -0.3, 1.5, 0.48, 1.9);
      for (let j = 0; j < 4; j++)
        this.part(
          this.tires,
          i * 4 + j,
          position,
          j % 2 ? 0.88 : -0.88,
          -0.24,
          j < 2 ? 1.28 : -1.28,
          0.25,
          0.62,
          0.62,
        );
      for (let j = 0; j < 2; j++)
        this.part(
          this.lamps,
          i * 2 + j,
          position,
          j ? 0.58 : -0.58,
          0.08,
          2.06,
          0.4,
          0.08,
          0.03,
        );
    }
    for (const mesh of this.meshes) mesh.instanceMatrix.needsUpdate = true;
  }

  private locate(car: Civilian) {
    const route = car.route;
    let segment = 0;
    while (
      segment < route.points.length - 2 &&
      route.points[segment + 1].distance < car.distance
    )
      segment++;
    const a = route.points[segment],
      b = route.points[segment + 1];
    const t =
      (car.distance - a.distance) / Math.max(0.001, b.distance - a.distance);
    car.x = THREE.MathUtils.lerp(a.x, b.x, t);
    car.z = THREE.MathUtils.lerp(a.z, b.z, t);
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    if (length > 0.001) {
      car.dx = (b.x - a.x) / length;
      car.dz = (b.z - a.z) / length;
    }
  }

  private part(
    mesh: THREE.InstancedMesh,
    index: number,
    position: RAPIER.Vector,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) {
    this.offset.set(x, y, z).applyQuaternion(this.quaternion);
    this.dummy.position.set(
      position.x + this.offset.x,
      position.y + this.offset.y,
      position.z + this.offset.z,
    );
    this.dummy.quaternion.copy(this.quaternion);
    this.dummy.scale.set(w, h, d);
    this.dummy.updateMatrix();
    mesh.setMatrixAt(index, this.dummy.matrix);
  }
}
