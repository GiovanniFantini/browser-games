import { describe, expect, it } from 'vitest';
import {
  activeCar,
  buyCar,
  buyPart,
  equipPart,
  freshProfile,
  parseProfile,
  settleRace,
} from './profile';
import { calculateStats, catalog, stockLevels } from './catalog';
import { ProfileStore, SAVE_KEY } from './storage';

describe('catalogo, economia e compatibilità', () => {
  it('offre undici categorie con tre livelli che modificano statistiche effettive', () => {
    expect(catalog.categories).toHaveLength(11);
    const base = calculateStats(stockLevels());
    for (const c of catalog.categories) {
      expect(c.tiers).toHaveLength(3);
      let previous = base;
      for (let level = 1; level <= 3; level++) {
        const stats = calculateStats({ ...stockLevels(), [c.id]: level });
        expect(stats).not.toEqual(previous);
        expect(
          Object.values(stats)
            .filter((v) => typeof v === 'number')
            .every((v) => Number.isFinite(v) && v >= 0),
        ).toBe(true);
        previous = stats;
      }
    }
    expect(
      calculateStats({ ...stockLevels(), exhaust: 3 }).sound,
    ).toBeGreaterThan(base.sound);
    expect(
      calculateStats({ ...stockLevels(), boost: 3 }).turbo,
    ).toBeGreaterThan(base.turbo);
  });
  it('rifiuta doppio acquisto, salti di livello e saldo insufficiente senza addebiti', () => {
    const p = freshProfile();
    expect(() => buyPart(p, 'engine', 2)).toThrow();
    expect(p.credits).toBe(12000);
    buyPart(p, 'engine', 1);
    const balance = p.credits;
    expect(() => buyPart(p, 'engine', 1)).toThrow();
    expect(p.credits).toBe(balance);
    equipPart(p, 'engine', 0);
    equipPart(p, 'engine', 1);
    expect(p.credits).toBe(balance);
    p.credits = 0;
    expect(() => buyPart(p, 'engine', 2)).toThrow();
    expect(activeCar(p).owned.engine).toBe(1);
    expect(() => equipPart(p, 'engine', 3)).toThrow();
  });
  it('mantiene le modifiche separate tra auto e limita i posti a tre', () => {
    const p = freshProfile();
    buyPart(p, 'engine', 1);
    p.credits = 30000;
    buyCar(p);
    expect(activeCar(p).equipped.engine).toBe(0);
    buyPart(p, 'brakes', 1);
    buyCar(p);
    expect(() => buyCar(p)).toThrow('pieno');
    p.activeCar = 'car-1';
    expect(activeCar(p).equipped.engine).toBe(1);
    expect(activeCar(p).equipped.brakes).toBe(0);
    expect(parseProfile(JSON.stringify(p))).toEqual(p);
  });
  it('assegna premio una volta, aggiorna i record e non paga i ritiri', () => {
    const p = freshProfile();
    const result = {
      id: 'run-1',
      event: 'sprint-quays',
      position: 2,
      time: 90,
    };
    expect(settleRace(p, result, 1)).toBe(1500);
    expect(settleRace(p, result, 1)).toBe(0);
    expect(p.credits).toBe(13500);
    settleRace(p, { ...result, id: 'run-2', time: 95 }, 1);
    settleRace(p, { ...result, id: 'run-3', time: null }, 1.1);
    expect(p.bestTimes['sprint-quays']).toBe(90);
    expect(p.results[0].reward).toBe(0);
  });
  it('migra il formato v1 di interscambio e rifiuta dati incompatibili o incoerenti', () => {
    const upgrades = { ...stockLevels(), engine: 2 };
    const p = parseProfile(
      JSON.stringify({
        game: 'night-circuit',
        version: 1,
        credits: 5000,
        upgrades,
      }),
    );
    expect(p.version).toBe(6);
    expect(activeCar(p).owned.engine).toBe(2);
    for (const corrupt of [
      { ...p, version: 99 },
      { ...p, credits: -1 },
      { ...p, credits: 1.5 },
      { ...p, activeCar: 'missing' },
      { ...p, cars: [...p.cars, ...p.cars] },
      { ...p, bestTimes: { unknown: 20 } },
    ])
      expect(() => parseProfile(JSON.stringify(corrupt))).toThrow();
    activeCar(p).equipped.engine = 3;
    expect(() => parseProfile(JSON.stringify(p))).toThrow('posseduto');
    expect(() => parseProfile('{broken')).toThrow();
  });
});

describe('persistenza e recupero', () => {
  it('riesce a reimportare il proprio export anche al limite del registro gare', () => {
    const store = new ProfileStore(null);
    store.profile.settled = Array.from(
      { length: 10000 },
      (_, i) => `run-${String(i).padStart(76, '0')}`,
    );
    expect(parseProfile(store.export())).toEqual(store.profile);
  });
  const memory = () => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
  };
  it('salva acquisti e tre slot, recupera il profilo precedente a un caricamento', () => {
    const disk = memory(),
      store = new ProfileStore(disk);
    store.commit((p) => buyPart(p, 'engine', 1));
    store.manual(1);
    store.commit((p) => buyPart(p, 'engine', 2));
    store.manual(2);
    store.commit((p) => buyPart(p, 'engine', 3));
    store.manual(3);
    expect(new ProfileStore(disk).profile).toEqual(store.profile);
    store.load(1);
    expect(activeCar(store.profile).equipped.engine).toBe(1);
    store.restore();
    expect(activeCar(store.profile).equipped.engine).toBe(3);
    expect(activeCar(store.slot(2)!).equipped.engine).toBe(2);
    expect(() => store.manual(4)).toThrow();
  });
  it('conserva intatto un autosave corrotto e permette un recupero esplicito', () => {
    const disk = memory();
    disk.data.set(SAVE_KEY, 'future data');
    const store = new ProfileStore(disk);
    store.commit((p) => buyPart(p, 'engine', 1));
    expect(disk.data.get(SAVE_KEY)).toBe('future data');
    expect(store.status).toContain('intatto');
    store.replace(freshProfile());
    expect(parseProfile(disk.data.get(SAVE_KEY)!).credits).toBe(12000);
    store.restore();
    expect(activeCar(store.profile).equipped.engine).toBe(1);
  });
  it('mantiene progressi in memoria se il disco è pieno e non applica importazioni fallite', () => {
    const store = new ProfileStore({
      getItem: () => null,
      setItem: () => {
        throw Error('quota');
      },
    });
    store.commit((p) => buyPart(p, 'engine', 1));
    expect(store.status).toContain('memoria');
    expect(activeCar(parseProfile(store.export())).equipped.engine).toBe(1);
    expect(() => store.replace(freshProfile())).toThrow();
    expect(activeCar(store.profile).equipped.engine).toBe(1);
    expect(() =>
      store.commit((p) => {
        p.credits = -1;
      }),
    ).toThrow();
    expect(store.profile.credits).toBe(10200);
  });
});
