import { describe, expect, it } from 'vitest';
import { Group, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { ChaseCamera } from './camera';
import type { Vehicle } from './vehicle';

describe('visuali frontali', () => {
  it('guarda davanti all’auto anche lontano dall’origine e dopo una svolta', () => {
    const root = new Group();
    root.position.set(300, 0.6, -220);
    root.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), 1.2);
    const car = {
      model: { root, spec: { roof: 1, length: 4.25 } },
      power: { boosting: false },
      speed: 12,
    } as unknown as Vehicle;
    const camera = new PerspectiveCamera();
    const chase = new ChaseCamera(camera);
    const forward = new Vector3(0, 0, 1).applyQuaternion(root.quaternion);
    for (const mode of [2, 3]) {
      chase.mode = mode;
      chase.reset();
      chase.update(car, 1 / 60);
      const orientation = camera.getWorldDirection(new Vector3());
      expect(orientation.dot(forward)).toBeGreaterThan(0.99);
      expect(camera.quaternion.equals(new Quaternion())).toBe(false);
    }
  });
});

it('mantiene vicina la visuale durante una traslazione veloce dell’auto', () => {
  const root = new Group();
  const car = {
    model: { root, spec: { roof: 1, length: 4.25 } },
    speed: 30,
    slip: 0,
    power: { boosting: false },
  } as unknown as Vehicle;
  const camera = new PerspectiveCamera(59, 1.6, 0.1, 2000);
  const chase = new ChaseCamera(camera);
  chase.update(car, 1 / 60);
  const initialDistance = camera.position.z - root.position.z;
  for (let frame = 0; frame < 180; frame++) {
    root.position.x += 0.1;
    root.position.z += car.speed / 60;
    chase.update(car, 1 / 60);
  }
  expect(camera.position.z - root.position.z).toBeCloseTo(initialDistance, 3);
  expect(Math.abs(camera.position.x - root.position.x)).toBeLessThan(0.01);
});
