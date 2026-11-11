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
