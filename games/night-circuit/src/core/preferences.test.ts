import { describe, it, expect } from 'vitest';
import {
  defaults,
  parsePreferences,
  preferences,
  bindKey,
  bindPad,
} from './preferences';
import { english } from '../ui/translation';
describe('preferenze e localizzazione', () => {
  it('valida enumerazioni, valori finiti e binding riservati senza alterare i default', () => {
    const p = defaults();
    expect(parsePreferences(JSON.stringify(p))).toEqual(p);
    const parsed = parsePreferences(
      JSON.stringify({
        ...p,
        master: 15,
        music: -1,
        engine: NaN,
        quality: 'ultra',
        keys: { ...p.keys, throttle: 'F3' },
        pad: { ...p.pad, nitro: 1000 },
      }),
    );
    expect(parsed.master).toBe(1);
    expect(parsed.music).toBe(0);
    expect(parsed.engine).toBe(1);
    expect(parsed.quality).toBe('medium');
    expect(parsed.keys.throttle).toBe('KeyW');
    expect(parsed.pad.nitro).toBe(1);
    expect(() => parsePreferences('{')).toThrow();
  });
  it('scambia i duplicati e mantiene F3 e le frecce riservati', () => {
    Object.assign(preferences, defaults());
    bindKey('throttle', 'KeyS');
    expect(preferences.keys.throttle).toBe('KeyS');
    expect(preferences.keys.brake).toBe('KeyW');
    bindKey('throttle', 'ArrowLeft');
    expect(preferences.keys.throttle).toBe('KeyS');
    bindPad('nitro', 0);
    expect(preferences.pad.nitro).toBe(0);
    expect(preferences.pad.handbrake).toBe(1);
    Object.assign(preferences, defaults());
  });
  it('traduce frasi, errori e valori dinamici mantenendo nomi originali e spazi', () => {
    expect(english('Impostazioni')).toBe('Settings');
    expect(english('  Premi E al ritrovo per avviare. ')).toBe(
      '  Press E at the meeting point to start. ',
    );
    expect(english('Frammento raccolto: 3/12. +250 CR.')).toBe(
      'Fragment collected: 3/12. +250 CR.',
    );
    expect(english('SFIDA NEMI / F')).toBe('CHALLENGE NEMI / F');
    expect(english('GARA · Anello dei Fonditori')).toBe(
      'RACE · Anello dei Fonditori',
    );
    expect(english('Inventario estetico non valido.')).toBe(
      'Invalid appearance inventory.',
    );
  });
});
