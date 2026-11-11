import { describe, expect, it } from 'vitest';
import { Box3 } from 'three';
import {
  freshProfile,
  settleRace,
  parseProfile,
  buyPart,
  buyCar,
  applyAppearance,
  tradeCar,
  tradeInValue,
} from './profile';
import {
  startCareer,
  careerLevel,
  raceLock,
  districtUnlocked,
  travel,
  acceptSponsor,
  claimSponsor,
  recordSpeed,
  coverLock,
  claimCover,
  careerData,
} from './career';
import { calculateStats, stockLevels } from './catalog';
import { createCar } from '../vehicle/model';
import { ProfileStore } from './storage';
import { SAVE_KEY } from './storage';
import { newCup } from '../race/tournament';
const result = (
  id: string,
  event = 'sprint-quays',
  position = 1,
  time: number | null = 90,
) => ({ id, event, position, time });
describe('carriera e progressione', () => {
  it('sostituisce un modello a garage pieno, trasferendo componenti e aspetto sullo stesso posto', () => {
    const p = freshProfile();
    p.credits = 100000;
    buyCar(p);
    buyCar(p);
    buyPart(p, 'engine', 1);
    const look = structuredClone(p.cars[2].appearance);
    look.parts.kit = 1;
    applyAppearance(p, look);
    startCareer(p);
    p.career.fame = 400;
    const others = structuredClone(p.cars.slice(0, 2)),
      old = structuredClone(p.cars[2]),
      credits = p.credits;
    expect(tradeInValue(old)).toBe(4500);
    tradeCar(p, 'car-3', 'velan-gt');
    expect(p.cars).toHaveLength(3);
    expect(p.activeCar).toBe('car-3');
    expect(p.cars[2].model).toBe('velan-gt');
    expect(p.credits).toBe(credits - 17500);
    expect(p.cars[2].equipped).toEqual(old.equipped);
    expect(p.cars[2].appearance).toEqual(old.appearance);
    expect(p.cars.slice(0, 2)).toEqual(others);
    expect(parseProfile(JSON.stringify(p))).toEqual(p);
  });
  it('rifiuta sostituzioni non sbloccate, uguali o non sostenibili senza modificare il profilo', () => {
    const p = freshProfile();
    startCareer(p);
    const initial = structuredClone(p);
    expect(() => tradeCar(p, 'car-1', 'lyra-r2')).toThrow();
    expect(p).toEqual(initial);
    p.career.fame = 400;
    p.credits = 0;
    const poor = structuredClone(p);
    expect(() => tradeCar(p, 'car-1', 'velan-gt')).toThrow('Crediti');
    expect(p).toEqual(poor);
    expect(() => tradeCar(p, 'car-1', 'silex-c1')).toThrow();
    expect(() => tradeCar(p, 'missing', 'velan-gt')).toThrow();
    expect(p).toEqual(poor);
  });
  it('rende recuperabile la sostituzione e non applica il cambio se la scrittura del nuovo profilo fallisce', () => {
    const map = new Map<string, string>();
    let fail = false;
    const store = new ProfileStore({
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => {
        if (fail && k === SAVE_KEY) throw Error('quota');
        map.set(k, v);
      },
    });
    store.commit((p) => {
      startCareer(p);
      p.career.fame = 400;
      p.credits = 40000;
    });
    const before = structuredClone(store.profile);
    store.commit((p) => tradeCar(p, 'car-1', 'velan-gt'), { backup: true });
    expect(store.profile.cars[0].model).toBe('velan-gt');
    store.restore();
    expect(store.profile).toEqual(before);
    fail = true;
    expect(() =>
      store.commit((p) => tradeCar(p, 'car-1', 'velan-gt'), { backup: true }),
    ).toThrow('quota');
    expect(store.profile).toEqual(before);
    const unavailable = new ProfileStore(null);
    expect(() =>
      unavailable.commit(
        (p) => {
          startCareer(p);
          p.career.fame = 400;
          tradeCar(p, 'car-1', 'lyra-r2');
        },
        { backup: true },
      ),
    ).toThrow();
    expect(unavailable.profile.career.started).toBe(false);
  });
  it('assegna reputazione soltanto da arrivi definitivi, una volta, con bonus estetico reale', () => {
    const p = freshProfile();
    startCareer(p);
    const before = p.credits;
    settleRace(p, result('retired', 'sprint-quays', 1, null), 1);
    expect(p.credits).toBe(before);
    expect(p.career.fame).toBe(0);
    const look = structuredClone(p.cars[0].appearance);
    look.parts.kit = 1;
    applyAppearance(p, look);
    settleRace(p, result('clean'), 1);
    expect(p.career.fame).toBe(67);
    const saved = structuredClone(p);
    settleRace(p, result('clean'), 1);
    expect(p).toEqual(saved);
    expect(p.career.messages.some((m) => m.id === 'welcome')).toBe(true);
  });
  it('applica livelli ai nuovi acquisti, preserva i pezzi posseduti e sblocca modelli effettivi', () => {
    const p = freshProfile();
    p.credits = 1e6;
    buyPart(p, 'engine', 1);
    buyPart(p, 'engine', 2);
    startCareer(p);
    expect(() => buyPart(p, 'engine', 3)).toThrow('carriera');
    expect(() => buyCar(p, 'lyra-r2')).toThrow();
    p.career.fame = 160;
    expect(careerLevel(p.career)).toBe(2);
    buyCar(p, 'lyra-r2');
    expect(p.cars[1].model).toBe('lyra-r2');
    const a = calculateStats(stockLevels()),
      b = calculateStats(stockLevels(), 'lyra-r2');
    expect(b.engineForce / b.mass).toBeGreaterThan(a.engineForce / a.mass);
    expect(parseProfile(JSON.stringify(p)).cars[0].equipped.engine).toBe(2);
  });
  it('non apre rivali fuori ordine, non premia sconfitte e apre i quattro accessi in sequenza', () => {
    const p = freshProfile();
    startCareer(p);
    p.career.fame = 1000;
    expect(raceLock(p, 'rival-ozra')).not.toBeNull();
    const before = p.credits;
    expect(() => settleRace(p, result('locked', 'rival-ozra'), 1)).toThrow();
    expect(p.credits).toBe(before);
    settleRace(p, result('loss', 'rival-nemi', 2), 1);
    expect(p.career.defeated).toEqual([]);
    for (const [i, r] of careerData.rivals.entries()) {
      expect(raceLock(p, r.event)).toBeNull();
      settleRace(p, result('boss-' + i, r.event), 1);
      expect(p.career.defeated).toHaveLength(i + 1);
      const next = careerData.districts[Math.min(i + 1, 3)];
      expect(districtUnlocked(p.career, next.id)).toBe(true);
      travel(p, next.id);
    }
    expect(p.career.messages.some((m) => m.id === 'complete')).toBe(true);
    expect(parseProfile(JSON.stringify(p)).career.defeated).toHaveLength(4);
  });
  it('conta gli sponsor dalla firma, ignora ritiri e liquida un contratto una volta', () => {
    const p = freshProfile();
    startCareer(p);
    settleRace(p, result('before'), 1);
    acceptSponsor(p, 'torqen-trials');
    settleRace(p, result('bad', 'sprint-quays', 1, null), 1);
    expect(p.career.sponsorProgress).toBe(0);
    expect(() => acceptSponsor(p, 'velyra-lines')).toThrow();
    settleRace(p, result('a'), 1);
    const restored = parseProfile(JSON.stringify(p));
    settleRace(restored, result('b'), 1);
    expect(restored.career.sponsorProgress).toBe(2);
    const credits = restored.credits;
    claimSponsor(restored);
    expect(restored.credits).toBe(credits + 1800);
    expect(() => claimSponsor(restored)).toThrow();
    expect(() => acceptSponsor(restored, 'torqen-trials')).toThrow();
  });
  it('misura la velocità finita e distingue una vittoria drift da un normale arrivo', () => {
    const p = freshProfile();
    startCareer(p);
    p.career.fame = 300;
    acceptSponsor(p, 'aervik-speed');
    recordSpeed(p, NaN);
    recordSpeed(p, 99);
    expect(p.career.sponsorProgress).toBe(0);
    recordSpeed(p, 101);
    expect(p.career.sponsorProgress).toBe(100);
    claimSponsor(p);
    acceptSponsor(p, 'velyra-lines');
    settleRace(p, result('sprint'), 1);
    expect(p.career.sponsorProgress).toBe(0);
    settleRace(p, result('drift', 'drift-foundry'), 1);
    expect(p.career.sponsorProgress).toBe(1);
  });
  it('richiede fama e aspetto applicato per copertine e impedisce premi duplicati', () => {
    const p = freshProfile();
    startCareer(p);
    p.career.fame = 90;
    expect(coverLock(p, 'afterglow')).not.toBeNull();
    const a = structuredClone(p.cars[0].appearance);
    a.parts.kit = 1;
    applyAppearance(p, a);
    expect(coverLock(p, 'afterglow')).toBeNull();
    claimCover(p, 'afterglow');
    const before = p.credits;
    expect(() => claimCover(p, 'afterglow')).toThrow();
    expect(p.credits).toBe(before);
  });
  it('migra v4 senza cancellare fantasma, coppa, inventari o record e rifiuta progressioni malformate', () => {
    const p = freshProfile(),
      legacy = { ...p, version: 4, career: undefined };
    legacy.ghost = {
      version: 1,
      event: 'ghost-foundry',
      duration: 10,
      frames: [
        [0, 0, 1, 0, 0, 0, 0, 1],
        [10, 10, 1, 10, 0, 0, 0, 1],
      ],
    };
    legacy.cup = newCup(1, 0.5);
    legacy.bestTimes = { 'sprint-quays': 99 };
    const migrated = parseProfile(JSON.stringify(legacy));
    expect(migrated.version).toBe(6);
    expect(migrated.bestTimes).toEqual(legacy.bestTimes);
    expect(migrated.ghost).toEqual(legacy.ghost);
    expect(migrated.cup).toEqual(legacy.cup);
    expect(migrated.career.started).toBe(false);
    for (const c of [
      { ...p.career, fame: NaN },
      { ...p.career, defeated: ['ozra'] },
      { ...p.career, district: 'airport-belt' },
      { ...p.career, messages: [{ id: 'unknown', read: false }] },
      { ...p.career, activeSponsor: 'not-a-contract' },
    ])
      expect(() => parseProfile(JSON.stringify({ ...p, career: c }))).toThrow();
  });
  it('usa modelli originali con sagome diverse mantenendo ruote e risorse riutilizzabili', () => {
    const cars = careerData.models.map((m) => createCar({ model: m.id }));
    const heights = cars.map((c) => new Box3().setFromObject(c.root).max.y);
    expect(heights[1]).toBeLessThan(heights[0]);
    expect(heights[2]).toBeGreaterThan(heights[0]);
    expect(cars).toHaveLength(51);
    expect(careerData.makers).toHaveLength(12);
    expect(cars.every((c) => c.wheels.length === 4)).toBe(true);
    cars.forEach((c) => c.dispose());
  });
  it('mantiene atomica una liquidazione che fallisce la validazione carriera', () => {
    const store = new ProfileStore(null);
    store.commit(startCareer);
    const before = structuredClone(store.profile);
    expect(() =>
      store.commit((p) => {
        settleRace(p, result('x'), 1);
        p.career.district = 'airport-belt';
      }),
    ).toThrow();
    expect(store.profile).toEqual(before);
  });
});
