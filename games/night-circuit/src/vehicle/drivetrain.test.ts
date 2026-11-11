import { describe, expect, it } from 'vitest';
import { updatePowertrain, type Powertrain } from './drivetrain';

const fresh = (): Powertrain => ({
  gear: 1,
  rpm: 950,
  nitro: 1,
  boosting: false,
  drive: 0,
  braking: 0,
});
describe('transmissione e nitro', () => {
  it('frena prima di inserire la retromarcia', () => {
    const state = fresh();
    updatePowertrain(state, 20, 0, 1, false, true, 1 / 60);
    expect(state.drive).toBe(0);
    expect(state.braking).toBe(1);
    updatePowertrain(state, 0, 0, 1, false, true, 1 / 60);
    expect(state.gear).toBe(-1);
    expect(state.drive).toBeLessThan(0);
  });
  it('consuma e ricarica il nitro con limiti, senza spinta in aria', () => {
    const state = fresh();
    updatePowertrain(state, 20, 1, 0, true, false, 1);
    expect(state.boosting).toBe(false);
    updatePowertrain(state, 20, 1, 0, true, true, 1);
    expect(state.nitro).toBeCloseTo(0.8);
    updatePowertrain(state, 20, 1, 0, true, true, 10);
    expect(state.nitro).toBe(0);
    updatePowertrain(state, 20, 1, 0, true, true, 1 / 60);
    expect(state.boosting).toBe(false);
    expect(state.nitro).toBe(0);
    updatePowertrain(state, 0, 0, 0, false, true, 100);
    expect(state.nitro).toBe(1);
  });
  it('limita la spinta senza valori negativi oltre la velocità massima', () => {
    const state = fresh();
    updatePowertrain(state, 90, 1, 0, false, true, 1 / 60);
    expect(state.drive).toBe(0);
    expect(state.gear).toBe(6);
    expect(state.rpm).toBeLessThanOrEqual(7600);
  });
});
