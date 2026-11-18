import { careerData } from '../progression/career';
import { calculateStats, stockLevels } from '../progression/catalog';
import { defaultAppearance } from '../tuning/appearance';
import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { worldRaces as catalog } from '../world/world-data';
import type { DriveInput } from '../core/input';
import { Vehicle } from '../vehicle/vehicle';
import type { Traffic } from '../traffic/traffic';
import type { Navigation } from '../ui/navigation';
import { RaceUI, type RaceOptions } from '../ui/races';
import { RaceDriver } from './driver';
import { RaceRoute, type RoutePoint } from './route';
import { RaceSession } from './session';
import { ModeSession } from './mode-session';
import settings from '../data/modes.json';
import { HillCourse } from './hill';
import { GhostCar, GhostRecorder, type GhostRecord } from './ghost';
import { newCup, advanceCup, type CupState } from './tournament';
import type { Profile } from '../progression/profile';
import { RaceVisuals } from './visuals';
import { DriftPilot } from './drift-pilot';

const NEUTRAL: DriveInput = Object.freeze({
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: false,
  nitro: false,
});
export class RaceSystem {
  readonly ui = new RaceUI();
  private readonly publicEvents = catalog.events.filter(
    (e) => !('hidden' in e && e.hidden),
  );
  readonly routes = catalog.events.map((event) => new RaceRoute(event, true));
  readonly opponents: Vehicle[] = [];
  readonly drivers: RaceDriver[] = [];
  readonly cars: Vehicle[] = [];
  readonly markers: { x: number; z: number; color: string }[] = [];
  private readonly positions: THREE.Vector3[] = [];
  private readonly parking: {
    x: number;
    z: number;
    parked: boolean;
    input: DriveInput;
  }[] = [];
  private readonly visuals: RaceVisuals;
  private readonly playerDriver = new RaceDriver(0.94, 0, 7);
  private readonly sample: RoutePoint = {
    x: 0,
    z: 0,
    dx: 0,
    dz: 1,
    distance: 0,
  };
  private savedTraffic = 0;
  private resultsNotified = false;
  private settledNotified = false;
  private nearId: string | null = null;
  private nearName: string | null = null;
  private renderTimer = 0;
  session: ModeSession | null = null;
  private activeOpponents = 4;
  private sessionPositions: THREE.Vector3[] = [];
  private hill?: HillCourse;
  private readonly ghostCar: GhostCar;
  private recorder: GhostRecorder | null = null;
  private bestGhost: GhostRecord | null = null;
  private newGhost: GhostRecord | null = null;
  cup: CupState | null = null;
  private cupActive = false;
  private completed = false;
  private resetSerial = 0;
  private savedAssist = true;
  private driftPilot = import.meta.env.DEV ? new DriftPilot() : null;
  private displayedEvent = '';
  private readonly dragLane = [-4.5, 4.5, -4.5, 4.5, 4.5];
  private readonly roamer: Vehicle;
  private readonly roamDriver = new RaceDriver(0.94, 2.8, 3);
  private readonly roamRoute: RaceRoute;
  private readonly roamSession: RaceSession;
  private readonly roamPositions: THREE.Vector3[];
  private readonly roamCars: Vehicle[] = [];
  private roamTime = 0;
  nearChallenge = false;
  districtId = 'old-docks';
  setFreeDistrict(id: string) {
    this.districtId = id;
    this.visuals.setDistrict(id);
    this.roamer.setEnabled(id === 'old-docks');
  }

  options: RaceOptions = { ...catalog.defaults };
  onResults: () => void = () => {};
  onSettled: () => void = () => {};

  constructor(
    private readonly scene: THREE.Scene,
    private readonly world: RAPIER.World,
    readonly player: Vehicle,
    private readonly traffic: Traffic,
    private readonly navigation: Navigation,
    hill?: HillCourse,
  ) {
    this.hill = hill;
    this.visuals = new RaceVisuals(scene);
    this.ghostCar = new GhostCar(scene);
    this.roamer = new Vehicle(world, scene, [4.5, 1.15, -280], {
      simple: true,
      color: catalog.drivers[0].color,
    });
    this.roamRoute = new RaceRoute({ ...catalog.events[0], laps: 9999 }, true);
    this.roamSession = new RaceSession(this.roamRoute, [
      { id: 'player', name: 'Nemi', position: this.roamer.position },
    ]);
    this.roamSession.phase = 'running';
    this.roamSession.countdown = 0;
    this.roamPositions = [this.roamer.position];
    this.roamCars.push(this.roamer);
    for (let i = 0; i < catalog.drivers.length; i++) {
      const definition = catalog.drivers[i];
      const vehicle = new Vehicle(world, scene, [0, 1.15, -300], {
        color: definition.color,
        simple: true,
      });
      vehicle.setEnabled(false);
      this.opponents.push(vehicle);
      this.drivers.push(new RaceDriver(definition.skill, definition.lane, i));
      this.markers.push({ x: 0, z: 0, color: definition.color });
    }
    this.cars.push(...this.opponents, player);
    this.positions.push(...this.cars.map((car) => car.position));
    for (let i = 0; i < this.cars.length; i++)
      this.parking.push({ x: 0, z: 0, parked: false, input: { ...NEUTRAL } });
  }
  get active() {
    return this.session !== null;
  }
  get resultsVisible() {
    return (
      !!this.session &&
      (this.session.player.finishTime !== null || this.session.player.retired)
    );
  }
  get nearbyEvent() {
    return this.nearId;
  }
  get trafficDensity() {
    return this.traffic.count;
  }

  configureProgress(p: Profile) {
    this.bestGhost = p.ghost;
    this.cup = p.cup ? structuredClone(p.cup) : null;
    this.ui.cupProgress(this.cup, false);
  }
  prepare(id: string, options: RaceOptions, rolling = false) {
    const playerPose = rolling
      ? {
          position: this.player.position.clone(),
          rotation: this.player.rotation.clone(),
        }
      : null;
    const rivalPose = rolling
      ? {
          position: this.roamer.position.clone(),
          rotation: this.roamer.rotation.clone(),
        }
      : null;
    this.stop();
    this.displayedEvent = id;
    this.cupActive = id === 'cup-docks';
    if (this.cupActive) {
      if (!this.cup || this.cup.round >= settings.cup.rounds.length)
        this.cup = newCup(options.speedScale, options.rubberBand);
      options = {
        speedScale: this.cup.speedScale,
        rubberBand: this.cup.rubberBand,
      };
    }
    let route = this.routes.find(
      (route) =>
        route.definition.id ===
        (this.cupActive ? settings.cup.rounds[this.cup!.round] : id),
    );
    if (rolling && route) {
      const points: number[][] = [];
      for (let d = 0; d < this.roamRoute.length; d += 40) {
        const p = this.roamRoute.sample(
          this.roamSession.player.projection.distance - 20 + d,
        );
        points.push([p.x, p.z, p.y ?? 0]);
      }
      route = new RaceRoute({ ...route.definition, points });
    }
    if (!route) throw new Error('Gara non disponibile');
    this.savedAssist = this.player.assist;
    this.completed = false;
    if (import.meta.env.DEV) this.driftPilot = new DriftPilot();
    this.newGhost = null;
    this.options = options;
    this.savedTraffic = this.traffic.count;
    this.activeOpponents = route.definition.opponents ?? 4;
    this.traffic.drag(route.definition.mode === 'drag');
    this.traffic.setDensity(
      route.definition.mode === 'drag' ? settings.drag.trafficCount : 0,
    );
    this.roamer.setEnabled(false);
    if (route.definition.hill) {
      this.hill ??= new HillCourse(this.scene, this.world);
      this.hill.enabled(true);
    }
    const selectedDrivers = route.definition.rival
      ? [catalog.drivers.find((d) => d.id === route.definition.rival)!]
      : catalog.drivers.slice(0, this.activeOpponents);
    for (let i = 0; i < selectedDrivers.length; i++) {
      const driver = selectedDrivers[i],
        rival = route.definition.rival
          ? careerData.rivals.find((r) => r.id === driver.id)
          : undefined,
        model = rival?.model ?? 'silex-c1',
        car = this.opponents[i];
      this.markers[i].color = driver.color;
      car.applyStats(calculateStats(stockLevels(), model));
      car.applyAppearance(
        { ...defaultAppearance(), paint: driver.color },
        model,
      );
      this.drivers[i] = new RaceDriver(
        rival?.skill ?? driver.skill,
        driver.lane,
        catalog.drivers.findIndex((d) => d.id === driver.id),
      );
    }
    const start = route.sample(0, this.sample),
      yaw = Math.atan2(start.dx, start.dz);
    const end = route.points.at(-1)!;
    for (let i = 0; i < this.cars.length; i++) {
      const isPlayer = i === this.cars.length - 1;
      const order = isPlayer ? this.activeOpponents : i;
      const lane =
        route.definition.mode === 'drag'
          ? isPlayer
            ? 4.5
            : -4.5
          : isPlayer
            ? 0
            : i % 2 === 0
              ? -2.8
              : 2.8;
      const row = Math.floor(order / 2) * 8;
      const car = this.cars[i];
      car.setEnabled(isPlayer || i < this.activeOpponents);
      car.place(
        start.x + start.dz * lane - start.dx * row,
        (start.y ?? 0) + 1.15,
        start.z - start.dx * lane - start.dz * row,
        yaw,
      );
      car.power.nitro = 1;
      car.power.manual = route.definition.mode === 'drag';
      car.power.fragile = car.power.manual;
      car.power.damage = 0;
      car.power.limiterTime = 0;
      car.power.gear = 1;
      car.power.shiftTime = 0;
      car.power.launchHeld = false;
      this.dragLane[i] = isPlayer ? 4.5 : -4.5;
      const park = this.parking[i],
        side = i % 2 === 0 ? -catalog.runout.side : catalog.runout.side,
        runout = catalog.runout.distance + i * catalog.runout.spacing;
      park.x = end.x + end.dx * runout + end.dz * side;
      park.z = end.z + end.dz * runout - end.dx * side;
      park.parked = false;
      if (i < this.drivers.length) this.drivers[i].reset();
    }
    this.playerDriver.reset();
    const participants = selectedDrivers.map((driver, i) => ({
      id: driver.id,
      name: driver.name,
      position: this.opponents[i].position,
    }));
    participants.push({
      id: 'player',
      name: 'Tu',
      position: this.player.position,
    });
    if (playerPose && rivalPose) {
      this.player.place(
        playerPose.position.x,
        playerPose.position.y,
        playerPose.position.z,
        Math.atan2(
          2 *
            (playerPose.rotation.w * playerPose.rotation.y +
              playerPose.rotation.x * playerPose.rotation.z),
          1 - 2 * (playerPose.rotation.y ** 2 + playerPose.rotation.x ** 2),
        ),
      );
      this.opponents[0].place(
        rivalPose.position.x,
        rivalPose.position.y,
        rivalPose.position.z,
        Math.atan2(
          2 *
            (rivalPose.rotation.w * rivalPose.rotation.y +
              rivalPose.rotation.x * rivalPose.rotation.z),
          1 - 2 * (rivalPose.rotation.y ** 2 + rivalPose.rotation.x ** 2),
        ),
      );
    }
    this.sessionPositions = [
      ...this.opponents.slice(0, this.activeOpponents).map((c) => c.position),
      this.player.position,
    ];
    this.session = new ModeSession(route, participants);
    this.resetSerial = this.player.resetSerial;
    this.recorder =
      route.definition.mode === 'timeTrial' ? new GhostRecorder() : null;
    this.ghostCar.load(
      route.definition.mode === 'timeTrial' ? this.bestGhost : null,
    );
    this.resultsNotified = this.settledNotified = false;
    this.visuals.setRoute(route);
    this.visuals.update(route, 0, 0);
    this.navigation.clear();
    this.navigation.setRaceRoute(
      route.points,
      route.definition.name,
      this.markers.slice(0, this.activeOpponents),
    );
    this.ui.challengeNearby(false);
    this.ui.start(id, options);
    this.ui.setCupAbandon(this.cupActive);
    this.ui.cupProgress(this.cup, this.cupActive);
    this.nearId = this.nearName = null;
    this.ui.nearby(null);
  }

  stop() {
    const wasHill = this.session?.route.definition.hill;
    this.traffic.drag(false);
    if (this.session) this.traffic.setDensity(this.savedTraffic);
    this.hill?.enabled(false);
    this.ghostCar.load(null);
    this.recorder = null;
    if (this.session) this.player.assist = this.savedAssist;
    this.player.power.fragile = false;
    this.player.power.manual = false;
    this.player.power.launchHeld = false;
    this.player.power.damage = 0;
    this.roamer.setEnabled(this.districtId === 'old-docks');
    if (wasHill) this.player.reset();
    this.session = null;
    for (const car of this.opponents) car.setEnabled(false);
    this.visuals.setRoute(null);
    this.navigation.setRaceRoute(null, '', []);
    this.ui.stop();
  }
  setAssistPreference(assist: boolean) {
    if (!this.session || assist !== this.savedAssist) {
      this.savedAssist = assist;
      this.player.assist = assist;
    }
  }
  setTrafficPreference(count: number) {
    if (this.session) this.savedTraffic = count;
    else this.traffic.setDensity(count);
  }

  beforeStep(dt: number, playerInput: DriveInput, autodrive = false) {
    const session = this.session;
    if (!session) {
      if (this.districtId !== 'old-docks') return playerInput;
      this.roamTime += dt;
      this.roamer.step(
        this.roamDriver.drive(
          this.roamer,
          this.roamSession.player,
          this.roamRoute,
          dt,
          this.roamTime,
          this.roamSession.player.progress,
          0,
          0.65,
          this.roamCars,
        ),
        dt,
      );
      return playerInput;
    }
    const running = session.phase === 'running';
    for (let i = 0; i < this.activeOpponents; i++) {
      const progress = session.racers[i],
        car = this.opponents[i];
      let controls =
        running && progress.finishTime === null && !progress.retired
          ? this.drivers[i].drive(
              car,
              progress,
              session.route,
              dt,
              session.elapsed,
              session.player.progress,
              this.options.rubberBand,
              this.options.speedScale *
                (session.route.definition.rivalPace ?? 1) *
                (session.route.definition.mode === 'challenge'
                  ? settings.challenge.rivalPace
                  : 1),
              this.cars,
            )
          : progress.finishTime !== null
            ? this.runout(i)
            : NEUTRAL;
      car.power.launchHeld =
        !running && session.route.definition.mode === 'drag';
      if (
        session.route.definition.mode === 'drag' &&
        (session.phase === 'countdown' ||
          (running && progress.finishTime === null && !progress.retired))
      )
        controls = this.dragControls(
          car,
          this.drivers[i].input,
          i,
          true,
          session.phase === 'countdown',
        );
      car.step(controls, dt);
    }
    if (session.player.finishTime !== null)
      return this.runout(this.cars.length - 1);
    this.player.power.launchHeld =
      session.phase === 'countdown' && session.route.definition.mode === 'drag';
    if (this.player.power.launchHeld) {
      if (autodrive)
        return this.dragControls(
          this.player,
          this.playerDriver.input,
          4,
          true,
          true,
        );
      return playerInput;
    }
    if (!running || this.resultsVisible) return NEUTRAL;
    if (autodrive && session.route.definition.mode === 'drag')
      return this.dragControls(
        this.player,
        this.playerDriver.input,
        4,
        true,
        false,
      );
    const result = autodrive
      ? this.playerDriver.drive(
          this.player,
          session.player,
          session.route,
          dt,
          session.elapsed,
          session.player.progress,
          0,
          this.options.speedScale,
          this.cars,
        )
      : playerInput;
    if (
      import.meta.env.DEV &&
      autodrive &&
      (session.route.definition.mode === 'drift' ||
        session.route.definition.mode === 'downhill')
    )
      this.driftPilot!.drive(this.player, result, session.elapsed);
    return result;
  }
  private dragControls(
    car: Vehicle,
    input: DriveInput,
    index: number,
    shift: boolean,
    countdown: boolean,
  ) {
    input.throttle = countdown ? 0.65 : 1;
    input.brake = 0;
    input.handbrake = false;
    input.nitro = false;
    if (countdown) {
      input.steer = 0;
      return input;
    }
    if (shift && car.power.rpm > car.stats.rpmLimit * 0.84) car.shift(1);
    for (const other of this.traffic.vehicles) {
      if (!other.body.isEnabled()) continue;
      const dz = other.z - car.position.z;
      if (dz > 0 && dz < 45 && Math.abs(other.x - this.dragLane[index]) < 2.5) {
        this.dragLane[index] = this.dragLane[index] > 0 ? -4.5 : 4.5;
        break;
      }
    }
    const q = car.rotation,
      yaw = Math.atan2(
        2 * (q.w * q.y + q.x * q.z),
        1 - 2 * (q.y * q.y + q.x * q.x),
      );
    input.steer = Math.max(
      -1,
      Math.min(
        1,
        Math.atan2(this.dragLane[index] - car.position.x, 25) * 3 - yaw * 3,
      ),
    );
    return input;
  }

  afterStep(dt: number) {
    const session = this.session;
    if (!session) {
      if (this.districtId !== 'old-docks') return;
      this.roamer.capture();
      this.roamSession.tick(dt, this.roamPositions);
      if (this.roamDriver.stuck > 6) {
        const p = this.roamRoute.sample(
          this.roamSession.player.projection.distance,
        );
        this.roamer.place(p.x, (p.y ?? 0) + 1.15, p.z, Math.atan2(p.dx, p.dz));
        this.roamSession.resetPosition('player', this.roamer.position);
        this.roamDriver.reset();
      }
      return;
    }
    for (let i = 0; i < this.activeOpponents; i++) this.opponents[i].capture();
    if (session.phase === 'countdown') for (const car of this.cars) car.hold();
    const wasCountdown = session.phase === 'countdown';
    session.tick(dt, this.sessionPositions);
    if (
      wasCountdown &&
      session.phase === 'running' &&
      session.route.definition.mode === 'drag'
    ) {
      for (const car of this.cars) {
        const ratio = car.power.rpm / car.stats.rpmLimit;
        car.power.shiftFactor =
          ratio >= settings.drag.launchMin && ratio <= settings.drag.launchMax
            ? 1.2
            : 0.65;
        car.power.shiftTime = 0.8;
        car.power.shiftLabel =
          car.power.shiftFactor > 1 ? 'PARTENZA PULITA' : 'PARTENZA DIFFICILE';
      }
    }
    session.evaluate(this.player, dt);
    if (this.recorder && this.player.resetSerial !== this.resetSerial)
      this.recorder.valid = false;
    if (this.recorder && session.phase !== 'countdown') {
      this.recorder.capture(
        session.phase === 'finished'
          ? (session.player.finishTime ?? session.elapsed)
          : session.elapsed,
        this.player.position,
        this.player.rotation,
        session.phase === 'finished',
      );
    }
    for (let i = 0; i < this.activeOpponents; i++) {
      const progress = session.racers[i];
      if (
        (progress.finishTime !== null && this.parking[i].parked) ||
        progress.retired
      )
        this.opponents[i].hold();
      else if (
        progress.finishTime === null &&
        session.phase === 'running' &&
        this.drivers[i].stuck > catalog.ai.recoverySeconds
      ) {
        this.restore(i);
        this.drivers[i].reset();
      }
    }
    if (this.resultsVisible) {
      if (
        this.session!.player.retired ||
        this.parking[this.cars.length - 1].parked
      )
        this.player.hold();
      this.visuals.showGate(false);
      if (!this.resultsNotified) {
        this.resultsNotified = true;
        this.onResults();
      }
    }
    if (session.phase === 'finished' && !this.settledNotified) {
      this.settledNotified = true;
      this.onSettled();
    }
  }

  private runout(index: number) {
    const park = this.parking[index],
      car = this.cars[index],
      input = park.input;
    const x = park.x - car.position.x,
      z = park.z - car.position.z,
      distance = Math.hypot(x, z);
    if (park.parked || distance < 2.3) {
      park.parked = true;
      input.throttle = input.brake = input.steer = 0;
      return input;
    }
    const q = car.rotation,
      fx = 2 * (q.x * q.z + q.w * q.y),
      fz = 1 - 2 * (q.x * q.x + q.y * q.y);
    const angle = Math.atan2(fz * x - fx * z, fx * x + fz * z),
      desired = Math.min(catalog.runout.speed, Math.max(1, distance * 0.65));
    input.steer = Math.max(-1, Math.min(1, angle * 2.4));
    input.throttle =
      car.speed < desired
        ? Math.max(0.2, Math.min(1, (desired - car.speed) * 0.4))
        : 0;
    input.brake =
      car.speed > desired + 0.5 ? Math.min(1, (car.speed - desired) * 0.2) : 0;
    return input;
  }

  private restore(index: number) {
    const session = this.session!,
      progress =
        index === this.cars.length - 1 ? session.player : session.racers[index];
    const distance =
      progress.gate === 0 ? 0 : session.route.gates[progress.gate - 1].distance;
    const point = session.route.sample(distance, this.sample),
      car = this.cars[index];
    car.place(
      point.x,
      (point.y ?? 0) + 1.15,
      point.z,
      Math.atan2(point.dx, point.dz),
    );
    session.resetPosition(progress.id, car.position);
  }
  resetPlayer() {
    if (
      !this.session ||
      this.session.phase !== 'running' ||
      this.resultsVisible
    )
      return false;
    if (this.recorder) this.recorder.valid = false;
    this.restore(this.cars.length - 1);
    this.playerDriver.reset();
    return true;
  }
  abandon() {
    if (!this.session) return;
    if (this.cupActive) {
      this.cup = null;
      this.ui.cupProgress(null, false);
    }
    this.session.retirePlayer();
    if (this.recorder) this.recorder.valid = false;
    this.resultsNotified = this.settledNotified = true;
    this.player.hold();
    this.onResults();
    this.onSettled();
  }

  render(alpha: number, time: number, dt: number, driving: boolean) {
    this.roamer.render(alpha, time);
    if (
      this.session?.route.definition.mode === 'timeTrial' &&
      this.session.phase !== 'countdown'
    )
      this.ghostCar.render(this.session.elapsed);
    for (let i = 0; i < this.opponents.length; i++) {
      const car = this.opponents[i];
      if (this.active) car.render(alpha, time);
      this.markers[i].x = car.position.x;
      this.markers[i].z = car.position.z;
    }
    this.renderTimer += dt;
    if (this.renderTimer < 0.1) return;
    this.renderTimer = 0;
    const session = this.session;
    if (session) {
      const player = session.player,
        projection = player.projection;
      const lateral = Math.abs(
        (this.player.position.x - projection.x) * projection.dz -
          (this.player.position.z - projection.z) * projection.dx,
      );
      const nextGate = session.route.gates[player.gate];
      const missed =
        (this.player.position.x - nextGate.x) * nextGate.dx +
          (this.player.position.z - nextGate.z) * nextGate.dz >
        20;
      const velocity = this.player.body.linvel(),
        wrongWay = velocity.x * projection.dx + velocity.z * projection.dz < -2;
      const warning = this.resultsVisible
        ? ''
        : session.phase === 'countdown'
          ? 'Attendi il via'
          : wrongWay
            ? 'CONTROMANO'
            : lateral > 15 || missed
              ? 'FUORI PERCORSO · R per ripristinare con penalità'
              : `Prossimo checkpoint: ${Math.round(Math.hypot(this.player.position.x - session.route.gates[player.gate].x, this.player.position.z - session.route.gates[player.gate].z))} m`;
      if (!this.resultsVisible)
        this.visuals.update(session.route, player.gate, player.lap);
      this.ui.update(session, 0.1, warning);
      this.ui.modeInfo(session, this.player, this.ghostCar.visible);
      return;
    }
    this.nearChallenge =
      this.districtId === 'old-docks' &&
      driving &&
      Math.hypot(
        this.player.position.x - this.roamer.position.x,
        this.player.position.z - this.roamer.position.z,
      ) < settings.challenge.encounterDistance;
    this.ui.challengeNearby(this.nearChallenge);
    let near: string | null = null,
      name: string | null = null,
      best = 20;
    if (this.districtId === 'old-docks' && driving && !this.ui.menuVisible)
      for (const event of this.publicEvents) {
        const distance = Math.hypot(
          event.meeting.x - this.player.position.x,
          event.meeting.z - this.player.position.z,
        );
        if (distance < best) {
          best = distance;
          near = event.id;
          name = event.name;
        }
      }
    this.nearId = near;
    if (name !== this.nearName) {
      this.nearName = name;
      this.ui.nearby(name);
    }
  }

  completeSession() {
    const s = this.session!;
    let event = s.route.definition.id,
      position = s.ranking.indexOf(s.player) + 1,
      time = s.player.retired ? null : s.player.finishTime;
    if (!this.completed) {
      this.completed = true;
      if (
        this.recorder &&
        !s.player.retired &&
        time !== null &&
        s.penalty === 0
      ) {
        this.recorder.capture(
          time,
          this.player.position,
          this.player.rotation,
          true,
        );
        this.newGhost = this.recorder.finish(event, time);
      }
      if (this.cupActive && this.cup) {
        advanceCup(this.cup, s.ranking);
        this.ui.cupProgress(this.cup, true, true);
      }
    }
    if (
      this.cupActive &&
      this.cup &&
      this.cup.round === settings.cup.rounds.length
    ) {
      event = 'cup-docks';
      position = this.cup.standings.findIndex((r) => r.id === 'player') + 1;
      const p = this.cup.standings[position - 1];
      time = p.finishes ? p.time : null;
    }
    return { event, position, time };
  }
  writeProgress(p: Profile) {
    const s = this.session!,
      id = s.route.definition.id;
    if (id === 'drift-foundry' || id === 'drift-hills')
      p.bestScores[id] = Math.max(p.bestScores[id] ?? 0, s.drift.banked);
    if (
      this.newGhost &&
      (!p.ghost ||
        p.ghost.layout !== 2 ||
        this.newGhost.duration < p.ghost.duration)
    ) {
      p.ghost = this.newGhost;
    }
    if (this.cupActive)
      p.cup =
        this.cup && this.cup.round < settings.cup.rounds.length
          ? structuredClone(this.cup)
          : null;
  }
  confirmProgress(p: Profile) {
    this.bestGhost = p.ghost;
  }
  get settlementId() {
    return this.cupActive && this.cup
      ? `${this.cup.id}-round-${this.cup.round}`
      : null;
  }
  get eventId() {
    return this.displayedEvent;
  }
  snapshot() {
    const session = this.session;
    return session
      ? {
          event: session.route.definition.id,
          mode: session.metrics(),
          ghostVisible: this.ghostCar.visible,
          cup: this.cup,
          phase: session.phase,
          countdown: session.countdown,
          elapsed: session.elapsed,
          penalty: session.penalty,
          player: {
            lap: session.player.lap,
            gate: session.player.gate,
            finishTime: session.player.finishTime,
            retired: session.player.retired,
          },
          ranking: session.ranking.map((racer) => ({
            id: racer.id,
            lap: racer.lap,
            gate: racer.gate,
            progress: racer.progress,
            finishTime: racer.finishTime,
            retired: racer.retired,
          })),
        }
      : null;
  }
}
