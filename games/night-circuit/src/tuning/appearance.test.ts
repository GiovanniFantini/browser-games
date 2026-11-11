import { describe, expect, it } from 'vitest';
import {
  appearanceCost,
  aestheticScore,
  defaultAppearance,
  defaultVisualOwned,
  parseAppearance,
  visualCatalog,
  type VinylLayer,
} from './appearance';
import {
  activeCar,
  applyAppearance,
  buyCar,
  freshProfile,
  parseProfile,
} from '../progression/profile';
import { layerTransform, visibleLayers } from './vinyl';
import { createCar } from '../vehicle/model';
import * as THREE from 'three';
import { sideSurfaceX } from './vinyl-surface';

const layer = (): VinylLayer => ({
  id: 'layer-1',
  shape: 'flame',
  side: 'left',
  x: 0.2,
  y: 0.6,
  scaleX: 0.5,
  scaleY: 0.8,
  rotation: 30,
  color: '#ffad42',
  opacity: 0.8,
  mirror: true,
});
describe('personalizzazione e salvataggi v3', () => {
  it('mantiene le pinze ancorate al mozzo mentre pneumatici e cerchi girano', () => {
    const car = createCar(),
      wheel = car.wheels[0],
      brake = car.root.getObjectByName('brake-carrier')!.children[0];
    wheel.rotation.set(0, 0.3, 0);
    wheel.userData.spin = 0;
    car.animate(0, 0);
    car.root.updateMatrixWorld(true);
    const before = brake.getWorldPosition(new THREE.Vector3());
    wheel.rotation.set(0, 0.3, 0);
    wheel.rotateX(1.3);
    wheel.userData.spin = 1.3;
    car.animate(1, 10);
    car.root.updateMatrixWorld(true);
    expect(
      brake.getWorldPosition(new THREE.Vector3()).distanceTo(before),
    ).toBeLessThan(0.00001);
    car.dispose();
  });
  it('mantiene il vinile esterno ai pannelli centrali del kit più largo', () => {
    const a = defaultAppearance();
    a.parts.kit = 5;
    const car = createCar({ appearance: a });
    car.root.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(
      new THREE.Vector3(3, 0, 0),
      new THREE.Vector3(-1, 0, 0),
    );
    const hit = ray.intersectObjects(car.root.children, true)[0];
    expect(sideSurfaceX(a, 0, 0)).toBeGreaterThan(hit.point.x);
    expect(sideSurfaceX(a, 0, 0) - hit.point.x).toBeLessThan(0.02);
    car.dispose();
  });
  it('segue anche la porta chiusa e la barra inferiore dei kit', () => {
    for (const [kit, y, z] of [
      [0, 0.15, -0.2],
      [1, -0.125, 0],
      [3, -0.125, 0],
    ]) {
      const a = defaultAppearance();
      a.parts.kit = kit;
      const car = createCar({ appearance: a });
      car.root.updateMatrixWorld(true);
      const ray = new THREE.Raycaster(
        new THREE.Vector3(3, y, z),
        new THREE.Vector3(-1, 0, 0),
      );
      expect(sideSurfaceX(a, y, z)).toBeGreaterThan(
        ray.intersectObjects(car.root.children, true)[0].point.x,
      );
      car.dispose();
    }
  });
  it('contiene cinque kit oltre la serie e trenta cerchi con configurazioni distinte', () => {
    expect(visualCatalog.slots.kit.options.length).toBeGreaterThanOrEqual(6);
    expect(visualCatalog.wheels).toHaveLength(30);
    expect(
      new Set(
        visualCatalog.wheels.map(
          (w) => `${w.spokes}/${w.twist}/${w.double}/${w.ring}`,
        ),
      ).size,
    ).toBe(30);
  });
  it('paga ogni pezzo una volta, mantiene inventari indipendenti e rifiuta saldi insufficienti', () => {
    const p = freshProfile(),
      a = defaultAppearance();
    a.parts.kit = 2;
    a.wheel = 8;
    a.vinyls = [layer()];
    const cost = appearanceCost(a, activeCar(p).visualOwned);
    applyAppearance(p, a);
    expect(p.credits).toBe(12000 - cost);
    expect(appearanceCost(a, activeCar(p).visualOwned)).toBe(0);
    applyAppearance(p, defaultAppearance());
    applyAppearance(p, a);
    expect(p.credits).toBe(12000 - cost);
    p.credits = 20000;
    buyCar(p);
    expect(activeCar(p).appearance.parts.kit).toBe(0);
    expect(appearanceCost(a, activeCar(p).visualOwned)).toBe(cost);
    p.credits = 0;
    expect(() => applyAppearance(p, a)).toThrow('insufficienti');
    expect(activeCar(p).appearance.parts.kit).toBe(0);
    expect(parseProfile(JSON.stringify(p))).toEqual(p);
  });
  it('migra v2 senza perdere crediti, prestazioni, auto o record', () => {
    const old = freshProfile();
    old.credits = 22000;
    old.cars[0].equipped.engine = old.cars[0].owned.engine = 2;
    buyCar(old);
    old.bestTimes['sprint-quays'] = 95;
    const v2 = {
      ...old,
      version: 2,
      cars: old.cars.map(({ id, model, owned, equipped }) => ({
        id,
        model,
        owned,
        equipped,
      })),
    };
    const migrated = parseProfile(JSON.stringify(v2));
    expect(migrated.version).toBe(6);
    expect(migrated.credits).toBe(old.credits);
    expect(migrated.cars).toHaveLength(2);
    expect(migrated.cars[0].equipped.engine).toBe(2);
    expect(migrated.bestTimes).toEqual(old.bestTimes);
    expect(migrated.cars[1].appearance).toEqual(defaultAppearance());
  });
  it('valida colori, proprietà dei pezzi e limiti degli strati senza propagare dati arbitrari', () => {
    const a = defaultAppearance();
    expect(() => parseAppearance({ ...a, paint: 'url(bad)' })).toThrow();
    expect(() => parseAppearance({ ...a, tint: Infinity })).toThrow();
    expect(() =>
      parseAppearance({
        ...a,
        vinyls: Array.from({ length: 13 }, () => layer()),
      }),
    ).toThrow();
    expect(() =>
      parseAppearance({ ...a, vinyls: [layer(), layer()] }),
    ).toThrow();
    expect(() =>
      parseAppearance({ ...a, vinyls: [{ ...layer(), scaleX: 0 }] }),
    ).toThrow();
    expect(() =>
      parseAppearance({ ...a, vinyls: [{ ...layer(), side: ['left'] }] }),
    ).toThrow();
    const p = freshProfile();
    p.cars[0].appearance.parts.kit = 5;
    expect(() => parseProfile(JSON.stringify(p))).toThrow('posseduta');
    expect(
      Object.hasOwn(
        parseAppearance({ ...a, arbitrary: 'not preserved' }),
        'arbitrary',
      ),
    ).toBe(false);
    expect(appearanceCost(defaultAppearance(), defaultVisualOwned())).toBe(0);
  });
  it('calcola uno stile limitato e non premia duplicazioni identiche dei vinili', () => {
    const a = defaultAppearance();
    expect(aestheticScore(a)).toBe(0);
    a.vinyls = [layer()];
    const score = aestheticScore(a);
    a.vinyls = Array.from({ length: 12 }, (_, i) => ({
      ...layer(),
      id: `layer-${i}`,
    }));
    expect(aestheticScore(a)).toBe(score);
    Object.keys(a.parts).forEach((k) => (a.parts[k as 'kit'] = 1));
    a.wheel = 29;
    a.spinner = true;
    a.paint = '#1199aa';
    expect(aestheticScore(a)).toBeGreaterThan(score);
    expect(aestheticScore(a)).toBeLessThanOrEqual(10);
  });
  it('specchia coordinate, rotazione e forma solo sul lato opposto conservando l’ordine', () => {
    const l = layer();
    expect(visibleLayers([l], 'right')).toEqual([l]);
    expect(visibleLayers([l], 'hood')).toEqual([]);
    const mirrored = layerTransform(l, 'right');
    expect(mirrored.x).toBeCloseTo(409.6);
    expect(mirrored.sx).toBeLessThan(0);
    expect(mirrored.angle).toBeLessThan(0);
    expect(visibleLayers([{ ...l, mirror: false }], 'right')).toEqual([]);
  });
  it('il modello applica aperture e spinner reali e libera geometrie e materiali sostituiti', () => {
    const a = defaultAppearance();
    a.spinner = true;
    a.parts.kit = 5;
    const model = createCar({ appearance: a });
    model.wheels[0].rotation.x = 3;
    model.animate(5, 0, true, { doors: true, hood: true, hatch: true });
    expect(model.root.children.some((c) => Math.abs(c.rotation.x) > 1)).toBe(
      true,
    );
    let disposed = 0;
    model.root.traverse((object) => {
      if ('geometry' in object)
        (
          object.geometry as {
            addEventListener(type: string, fn: () => void): void;
          }
        ).addEventListener('dispose', () => disposed++);
    });
    model.dispose();
    expect(disposed).toBeGreaterThan(20);
  });
});
