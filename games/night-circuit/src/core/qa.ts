import type { RaceSystem } from '../race/system';

export interface QAControls {
  manual: boolean;
  advancing: boolean;
  autodrive: boolean;
}
export function installRaceQA(
  controls: QAControls,
  races: RaceSystem,
  step: (dt: number) => void,
  isPlaying: () => boolean,
) {
  const api = {
    manual(enabled = true) {
      controls.manual = enabled;
    },
    state() {
      return {
        playing: isPlaying(),
        trafficDensity: races.trafficDensity,
        race: races.snapshot(),
        player: {
          x: races.player.position.x,
          z: races.player.position.z,
          speed: races.player.speed,
          y: races.player.position.y,
          gear: races.player.power.gear,
          modelSource: races.player.model.root.userData.assetSource ?? null,
          modelTriangles: races.player.model.root.userData.triangles ?? 0,
          assist: races.player.assist,
          rpm: races.player.power.rpm,
          manual: races.player.power.manual ?? false,
          damage: races.player.power.damage ?? 0,
          collided: races.player.collided,
        },
        opponents: races.opponents.map((car) => ({
          x: car.position.x,
          z: car.position.z,
          speed: car.speed,
          enabled: car.body.isEnabled(),
        })),
      };
    },
    advance(seconds: number, autodrive = true) {
      if (!Number.isFinite(seconds) || seconds < 0 || seconds > 10)
        throw new Error('Intervallo QA non valido');
      controls.advancing = true;
      controls.autodrive = autodrive;
      try {
        for (let i = 0; i < Math.round(seconds * 60); i++) step(1 / 60);
      } finally {
        controls.advancing = false;
        controls.autodrive = false;
      }
      return api.state();
    },
  };
  Object.defineProperty(window, '__nightCircuitQA', {
    value: api,
    configurable: true,
  });
}
