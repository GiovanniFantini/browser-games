import { ORIGINS } from '../world/atlas';
import career from '../data/career.json';
import { describe, expect, it } from 'vitest';
import catalog from '../data/races.json';
import { RaceRoute, gateCrossing } from './route';
import { RaceSession } from './session';

describe('regole di gara', () => {
  it('attende il tempo penalizzato prima di dichiarare ritirati gli altri piloti', () => {
    const route = new RaceRoute(catalog.events[1]);
    const session = new RaceSession(route, [
      { id: 'rival', name: 'Nemi', position: route.points[0] },
      { id: 'player', name: 'Tu', position: route.points[0] },
    ]);
    session.phase = 'running';
    session.elapsed = 144;
    session.playerFinishedAt = 100;
    session.player.finishTime = 160;
    session.penalty = 60;
    session.tick(2, [route.points[0], route.points[0]]);
    expect(session.racers[0].retired).toBe(false);
    session.racers[0].finishTime = 150;
    session.tick(5, [route.points[0], route.points[0]]);
    expect(session.ranking[0].id).toBe('rival');
    expect(session.phase).toBe('finished');
  });
  it('richiede direzione corretta, larghezza del cancello e movimento fisico continuo', () => {
    const gate = { x: 0, z: 0, dx: 0, dz: 1, distance: 10, halfWidth: 11 };
    expect(gateCrossing({ x: 0, z: -2 }, { x: 0, z: 2 }, gate)).toBe(0.5);
    expect(gateCrossing({ x: 0, z: 2 }, { x: 0, z: -2 }, gate)).toBeNull();
    expect(gateCrossing({ x: 12, z: -2 }, { x: 12, z: 2 }, gate)).toBeNull();
    expect(gateCrossing({ x: 0, z: -100 }, { x: 0, z: 100 }, gate)).toBeNull();
  });
  it('non assegna il traguardo se vengono saltati checkpoint e congela il timer nel conto alla rovescia', () => {
    const route = new RaceRoute(catalog.events[1]);
    const session = new RaceSession(route, [
      { id: 'player', name: 'Tu', position: route.points[0] },
    ]);
    session.tick(1, [route.points[0]]);
    expect(session.elapsed).toBe(0);
    session.tick(2, [route.points[0]]);
    expect(session.phase).toBe('running');
    const finish = route.gates.at(-1)!;
    session.player.previous = {
      x: finish.x - finish.dx,
      z: finish.z - finish.dz,
    };
    session.tick(1 / 60, [
      { x: finish.x + finish.dx, z: finish.z + finish.dz },
    ]);
    expect(session.player.finishTime).toBeNull();
    expect(session.player.gate).toBe(0);
  });
  it('completa solo il numero richiesto di giri, registra i tempi e applica la penalità del ripristino', () => {
    const route = new RaceRoute(catalog.events[0]);
    const session = new RaceSession(route, [
      { id: 'player', name: 'Tu', position: route.points[0] },
    ]);
    session.tick(3, [route.points[0]]);
    session.resetPosition('player', route.points[0]);
    for (let lap = 0; lap < 2; lap++) {
      for (const gate of route.gates) {
        session.player.previous = { x: gate.x - gate.dx, z: gate.z - gate.dz };
        session.tick(1, [{ x: gate.x + gate.dx, z: gate.z + gate.dz }]);
      }
      if (lap === 0) {
        expect(session.player.finishTime).toBeNull();
        expect(session.player.lap).toBe(1);
      }
    }
    expect(session.phase).toBe('finished');
    expect(session.player.lap).toBe(2);
    expect(session.player.finishTime).toBeCloseTo(
      session.elapsed - 0.5 + catalog.resetPenalty,
    );
    expect(session.player.bestLap).toBeGreaterThan(0);
  });
  it('classifica gli arrivi per tempo e mette i ritirati dopo chi termina', () => {
    const route = new RaceRoute(catalog.events[1]);
    const session = new RaceSession(route, [
      { id: 'rival', name: 'Nemi', position: route.points[0] },
      { id: 'player', name: 'Tu', position: route.points[0] },
    ]);
    session.racers[0].finishTime = 70;
    session.player.finishTime = 65;
    session.rank();
    expect(session.ranking[0].id).toBe('player');
    session.player.finishTime = null;
    session.retirePlayer();
    expect(session.ranking[0].id).toBe('rival');
    expect(session.phase).toBe('finished');
  });
  it('arrotonda le curve sulle strade senza scorciatoie attraverso gli isolati', () => {
    for (const definition of catalog.events.filter(
      (e) => !('hill' in e && e.hill),
    )) {
      const index =
        'district' in definition
          ? career.districts.findIndex((d) => d.id === definition.district)
          : 0;
      const origin = ORIGINS[Math.max(0, index)];
      const route = new RaceRoute(definition);
      expect(route.length).toBeGreaterThan(800);
      for (const point of route.points) {
        const distanceToStreet = Math.min(
          ...[-480, -360, -240, -120, 0, 120, 240, 360, 480].map((coordinate) =>
            Math.min(
              Math.abs(point.x - origin.x - coordinate),
              Math.abs(point.z - origin.z - coordinate),
            ),
          ),
        );
        expect(distanceToStreet).toBeLessThan(12);
      }
      for (let i = 1; i < route.gates.length; i++)
        expect(route.gates[i].distance).toBeGreaterThan(
          route.gates[i - 1].distance,
        );
    }
  });
});
