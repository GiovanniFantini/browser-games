import { it, expect } from 'vitest';
import { freshProfile, parseProfile } from './profile';
import { collect } from '../world/exploration';
it('migra v5 e salva ogni frammento una sola volta, rifiutando ID esterni e duplicati', () => {
  const original = freshProfile(),
    p = parseProfile(
      JSON.stringify({ ...original, version: 5, exploration: undefined }),
    );
  expect(p.version).toBe(6);
  expect(p.exploration).toEqual([]);
  expect(collect(p, 'fragment-0-0')).toBe(true);
  expect(collect(p, 'fragment-0-0')).toBe(false);
  expect(p.credits).toBe(original.credits + 250);
  expect(parseProfile(JSON.stringify(p)).exploration).toEqual(['fragment-0-0']);
  expect(() => collect(p, 'other')).toThrow();
  expect(() =>
    parseProfile(
      JSON.stringify({ ...p, exploration: ['fragment-0-0', 'fragment-0-0'] }),
    ),
  ).toThrow();
  expect(() =>
    parseProfile(JSON.stringify({ ...p, exploration: ['fragment-9-0'] })),
  ).toThrow();
});
