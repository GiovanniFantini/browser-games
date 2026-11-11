import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { DriftScore } from './drift';
import { newCup, advanceCup, parseCup } from './tournament';
import { GhostRecorder, parseGhost } from './ghost';
import { freshProfile, parseProfile } from '../progression/profile';
import {
  updatePowertrain,
  shiftGear,
  type Powertrain,
} from '../vehicle/drivetrain';
import { ModeSession } from './mode-session';
import { RaceRoute } from './route';
import catalog from '../data/races.json';
describe('regole delle modalità aggiuntive', () => {
  it('non accetta un traguardo interpolato oltre la scadenza e non rompe il motore in guida manuale libera', () => {
    const route = new RaceRoute(
        catalog.events.find((e) => e.id === 'ghost-foundry')!,
      ),
      session = new ModeSession(route, [
        { id: 'player', name: 'Tu', position: route.points[0] },
      ]);
    session.phase = 'finished';
    session.elapsed = 360.01;
    session.player.finishTime = 360.001;
    const car = {
      power: { nitro: 1, damage: 0 },
    } as unknown as import('../vehicle/vehicle').Vehicle;
    session.evaluate(car, 1 / 60);
    expect(session.player.retired).toBe(true);
    expect(session.reason).toContain('limite');
    const state: Powertrain = {
      gear: 1,
      rpm: 7600,
      nitro: 1,
      boosting: false,
      drive: 0,
      braking: 0,
      manual: true,
    };
    updatePowertrain(state, 20, 1, 0, false, true, 20);
    expect(state.damage ?? 0).toBe(0);
  });
  it('congela un arrivo drag valido anche se il danno cresce dopo il traguardo', () => {
    const route = new RaceRoute(
        catalog.events.find((e) => e.id === 'drag-channel')!,
      ),
      session = new ModeSession(route, [
        { id: 'opponent', name: 'Rivale', position: route.points[0] },
        { id: 'player', name: 'Tu', position: route.points[0] },
      ]);
    session.phase = 'running';
    session.elapsed = 110;
    session.player.finishTime = 40;
    const car = {
      power: { nitro: 1, damage: 1 },
    } as unknown as import('../vehicle/vehicle').Vehicle;
    session.evaluate(car, 1 / 60);
    expect(session.player.retired).toBe(false);
    expect(session.player.finishTime).toBe(40);
  });
  it('assegna drift solo in movimento, azzera catena e moltiplicatore al muro, conserva i punti già bancati', () => {
    const score = new DriftScore();
    let progress = 0;
    for (let i = 0; i < 240; i++) {
      progress += 0.2;
      score.tick(12, 5, true, false, progress, 1 / 60);
    }
    expect(score.chain).toBeGreaterThan(500);
    expect(score.multiplier).toBeGreaterThan(1);
    score.bank();
    const banked = score.banked;
    for (let i = 0; i < 60; i++) {
      progress += 0.2;
      score.tick(12, 5, true, false, progress, 1 / 60);
    }
    score.tick(12, 5, true, true, progress + 0.2, 1 / 60);
    expect(score.chain).toBe(0);
    expect(score.multiplier).toBe(1);
    expect(score.banked).toBe(banked);
    for (let i = 0; i < 200; i++)
      score.tick(12, 5, true, false, progress, 1 / 60);
    expect(score.chain).toBe(0);
    expect(score.banked).toBe(banked);
  });
  it('il cambio manuale resta nella marcia selezionata e il limitatore causa il guasto', () => {
    const state: Powertrain = {
      gear: 1,
      rpm: 950,
      nitro: 1,
      boosting: false,
      drive: 0,
      braking: 0,
      manual: true,
      fragile: true,
    };
    for (let i = 0; i < 360; i++)
      updatePowertrain(state, 20, 1, 0, false, true, 1 / 60);
    expect(state.gear).toBe(1);
    expect(state.damage).toBe(1);
    expect(state.drive).toBe(0);
    state.damage = 0;
    state.rpm = 6500;
    shiftGear(state, 1, 7600);
    expect(state.gear).toBe(2);
    expect(state.shiftLabel).toBe('PERFETTO');
    state.launchHeld = true;
    updatePowertrain(state, 0, 0.65, 0, false, true, 1);
    expect(state.drive).toBe(0);
    expect(state.rpm).toBeGreaterThan(4000);
  });
  it('un checkpoint fuori tempo non prolunga la prova', () => {
    const route = new RaceRoute(
      catalog.events.find((e) => e.id === 'checkpoint-lanterns')!,
    );
    const session = new ModeSession(route, [
      { id: 'player', name: 'Tu', position: route.points[0] },
    ]);
    session.phase = 'running';
    session.elapsed = 36;
    const car = {
      speed: 0,
      slip: 0,
      grounded: 4,
      collided: false,
      power: { nitro: 1 },
      position: new THREE.Vector3(),
    } as unknown as import('../vehicle/vehicle').Vehicle;
    session.evaluate(car, 1 / 60);
    expect(session.phase).toBe('finished');
    expect(session.player.retired).toBe(true);
  });
  it('registra pose fisiche e valida tempi ordinati, quaternion e completamento del fantasma', () => {
    const recorder = new GhostRecorder(),
      position = new THREE.Vector3(),
      rotation = new THREE.Quaternion();
    for (let i = 0; i <= 10; i++) {
      position.z = i * 5;
      recorder.capture(i * 0.2, position, rotation);
    }
    const record = recorder.finish('ghost-foundry', 2)!;
    expect(parseGhost(record)).toEqual(record);
    expect(() =>
      parseGhost({ ...record, frames: [record.frames[1], record.frames[0]] }),
    ).toThrow();
    expect(() =>
      parseGhost({
        ...record,
        frames: record.frames.map((f) => [...f.slice(0, 4), 0, 0, 0, 0]),
      }),
    ).toThrow();
    recorder.valid = false;
    expect(recorder.finish('ghost-foundry', 2)).toBeNull();
  });
  it('somma il torneo, risolve i pari punti col tempo e conserva la tappa nel profilo', () => {
    const cup = newCup(1, 0.5),
      ranking = cup.standings.map((s, i) => ({
        id: s.id,
        finishTime: 90 + i,
        retired: false,
      }));
    advanceCup(cup, ranking);
    expect(cup.round).toBe(1);
    expect(cup.standings[0].points).toBe(10);
    const p = freshProfile();
    p.cup = cup;
    expect(parseProfile(JSON.stringify(p)).cup).toEqual(cup);
    advanceCup(cup, [...ranking].reverse());
    expect(cup.round).toBe(2);
    expect(() => parseCup({ ...cup, round: 3 })).toThrow();
  });
  it('migra v3 senza perdere estetica e limita i nuovi dati', () => {
    const p = freshProfile();
    p.cars[0].appearance.paint = '#abcdef';
    const v3 = {
      ...p,
      version: 3,
      ghost: undefined,
      cup: undefined,
      bestScores: undefined,
    };
    const migrated = parseProfile(JSON.stringify(v3));
    expect(migrated.version).toBe(6);
    expect(migrated.cars[0].appearance.paint).toBe('#abcdef');
    expect(migrated.ghost).toBeNull();
    expect(() =>
      parseProfile(JSON.stringify({ ...p, bestScores: { unknown: 100 } })),
    ).toThrow();
  });
});
