import { describe, expect, it } from 'vitest';
import { signalColor } from './signals';
describe('semafori', () => {
  it('non dà mai verde contemporaneo ai flussi perpendicolari', () => {
    for (let node = 0; node < 81; node++)
      for (let time = 0; time < 48; time += 0.25) {
        expect(
          signalColor(node, true, time) === 'green' &&
            signalColor(node, false, time) === 'green',
        ).toBe(false);
      }
  });
  it('alterna verde, giallo e rosso con un intervallo di sicurezza', () => {
    expect(signalColor(0, true, 0)).toBe('green');
    expect(signalColor(0, true, 9.5)).toBe('amber');
    expect(signalColor(0, true, 11)).toBe('red');
    expect(signalColor(0, false, 11)).toBe('red');
    expect(signalColor(0, false, 12)).toBe('green');
  });
});
