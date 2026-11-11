import { it, expect } from 'vitest';
import { DrivingStyle } from './style';
it('premia il passaggio reale e il salto pulito, senza ripetere premi o premiare urti e reset', () => {
  const style = new DrivingStyle(),
    car = {
      speed: 18,
      slip: 0,
      grounded: 4,
      collided: false,
      resetSerial: 0,
      position: { x: 3, y: 1, z: 0 },
      power: { nitro: 0, boosting: false },
    },
    traffic = [{ x: 0, z: 0 }];
  style.update(car, 0.1, traffic, 1, true);
  car.position.z = 1;
  expect(style.update(car, 0.1, traffic, 1, true)).toContain('Passaggio');
  expect(car.power.nitro).toBeCloseTo(0.07);
  car.position.z = 2;
  style.update(car, 0.1, traffic, 1, true);
  expect(car.power.nitro).toBeCloseTo(0.07);
  car.grounded = 0;
  style.update(car, 0.6, [], 0, true);
  car.grounded = 4;
  expect(style.update(car, 0.1, [], 0, true)).toContain('Salto');
  car.collided = true;
  car.grounded = 0;
  style.update(car, 0.6, [], 0, true);
  car.grounded = 4;
  const before = car.power.nitro;
  style.update(car, 0.1, [], 0, true);
  expect(car.power.nitro).toBe(before);
  car.collided = false;
  car.grounded = 0;
  style.update(car, 0.6, [], 0, true);
  car.resetSerial++;
  car.grounded = 4;
  style.update(car, 0.1, [], 0, true);
  expect(car.power.nitro).toBe(before);
});
