import { Mesh } from 'three';
import { describe, expect, it } from 'vitest';
import data from '../data/career.json';
import { calculateStats, stockLevels } from './catalog';
import { createCar } from '../vehicle/model';
import { ProfileStore, SAVE_KEY } from './storage';
import { freshProfile, settleRace } from './profile';

describe('accettazione review del catalogo e dei salvataggi', () => {
  it('ogni costruttore ha una firma originale e ogni sagoma differisce dalle altre', () => {
    expect(new Set(data.makers.map((m) => JSON.stringify(m.design))).size).toBe(
      12,
    );
    const features = data.models.map((m) => [
      m.length / 4,
      m.width / 2,
      m.roof,
      m.cabin,
      m.cabinOffset,
      ...Object.values(m.design),
    ]);
    let minimum = Infinity;
    for (let a = 0; a < features.length; a++)
      for (let b = a + 1; b < features.length; b++) {
        const distance = Math.hypot(
          ...features[a].map((v, i) => v - features[b][i]),
        );
        minimum = Math.min(minimum, distance);
      }
    expect(minimum).toBeGreaterThan(0.18);
  });
  it('i prezzi crescono con l’indice prestazionale all’interno di ogni livello', () => {
    const index = (m: (typeof data.models)[number]) =>
      (0.5 * m.power) / m.mass +
      0.35 * m.speed +
      0.1 * m.grip +
      0.05 * m.braking;
    for (const level of [1, 2, 3]) {
      const models = data.models
        .filter((m) => m.level === level)
        .sort((a, b) => index(a) - index(b));
      for (let i = 1; i < models.length; i++)
        expect(models[i].price, models[i].id).toBeGreaterThanOrEqual(
          models[i - 1].price,
        );
    }
  });
  it('la carrozzeria statica viene raggruppata conservando ruote e parti animate', () => {
    const car = createCar({ model: 'silex-c1' });
    let meshes = 0;
    car.root.traverse((o) => {
      if ('isMesh' in o) meshes++;
    });
    expect(meshes).toBeLessThan(80);
    expect(car.wheels).toHaveLength(4);
    expect(car.root.getObjectByName('roof-surface')).toBeDefined();
    car.dispose();
    for (const model of data.models.filter((m) => m.family !== 'single')) {
      const sample = createCar({ model: model.id });
      sample.root.updateMatrixWorld(true);
      const roof = sample.root.getObjectByName('roof-surface') as Mesh;
      roof.geometry.computeBoundingBox();
      const top = roof.geometry
        .boundingBox!.clone()
        .applyMatrix4(roof.matrixWorld).max.y;
      for (const name of ['front-glazing', 'rear-glazing']) {
        const glass = sample.root.getObjectByName(name) as Mesh;
        glass.geometry.computeBoundingBox();
        expect(
          glass.geometry.boundingBox!.clone().applyMatrix4(glass.matrixWorld)
            .max.y,
          model.id + '/' + name,
        ).toBeLessThanOrEqual(top + 0.001);
      }
      sample.dispose();
    }
  });
  it('due schede non sovrascrivono progressi successivi all’apertura del profilo', () => {
    const values = new Map<string, string>(),
      disk = {
        getItem: (k: string) => values.get(k) ?? null,
        setItem: (k: string, v: string) => {
          values.set(k, v);
        },
      };
    const a = new ProfileStore(disk),
      b = new ProfileStore(disk);
    a.commit((p) => {
      p.credits += 100;
    });
    b.commit((p) => {
      p.credits += 200;
    });
    expect(JSON.parse(disk.getItem(SAVE_KEY)!).credits).toBe(12100);
    expect(b.profile.credits).toBe(12200);
    expect(b.status).toContain('altra scheda');
  });
  it('il registro recente continua a liquidare gare legittime una volta raggiunto il limite', () => {
    const p = freshProfile();
    p.settled = Array.from({ length: 10000 }, (_, i) => 'old-' + i);
    const result = {
      id: 'new-race',
      event: 'sprint-quays',
      position: 1,
      time: 85,
    };
    const reward = settleRace(p, result, 1);
    expect(reward).toBeGreaterThan(0);
    expect(p.settled).toHaveLength(2048);
    expect(settleRace(p, result, 1)).toBe(0);
  });
  it('i rivali aumentano capacità e auto lungo la carriera', () => {
    const speeds = data.rivals.map(
      (r) => calculateStats(stockLevels(), r.model).maxSpeed,
    );
    expect(new Set(data.rivals.map((r) => r.model)).size).toBe(4);
    expect(speeds.at(-1)).toBeGreaterThan(speeds[0] * 1.4);
    expect(data.rivals.at(-1)!.skill).toBeGreaterThan(data.rivals[0].skill);
  });
});
