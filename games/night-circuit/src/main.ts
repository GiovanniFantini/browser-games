import { WetRoad } from './world/wet-road';
import { CarReflections } from './world/car-reflections';
import { createSkyline } from './world/skyline';
import { prepareDetailedCarModels } from './vehicle/generated';
import { Atmosphere } from './world/atmosphere';
import { reflectionEnvironment } from './world/reflections';
import { createStreetscape } from './world/streetscape';
import { TireSmoke } from './vehicle/smoke';
import { WetReflections } from './world/wet-reflections';
import { prepareBakedLighting } from './gen/lighting/lightmaps';
import { WorldLighting } from './world/lighting';
import {
  preferences,
  savePreferences,
  graphicsQuality,
  setSessionQuality,
} from './core/preferences';
import { SettingsUI } from './ui/settings';
import { setLanguage } from './ui/translation';
import './ui/settings.css';
import { CareerUI } from './ui/career';
import {
  careerData,
  raceLock,
  travel,
  coverLock,
  claimCover,
  recordSpeed,
} from './progression/career';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { FixedLoop, FIXED_DT } from './core/loop';
import { Input } from './core/input';
import { Vehicle } from './vehicle/vehicle';
import { ChaseCamera } from './vehicle/camera';
import { createTrack } from './world/track';
import { Hud } from './ui/hud';
import { EngineAudio } from './audio/engine';
import {
  worldDistrict as district,
  worldRaces as raceCatalog,
} from './world/world-data';
import { districtGraph } from './world/street-network';
import { streetSpawn } from './world/street-layout';
import { City } from './world/city';
import { Exploration, collect } from './world/exploration';
import { DrivingStyle } from './vehicle/style';
import { Effects } from './world/effects';
import { MetroWorld } from './world/metro';
import {
  atlasGraph,
  districtPois,
  ORIGINS,
  roadHeight,
  localGraph,
  accessCount,
  districtIndex,
} from './world/atlas';
import { Traffic } from './traffic/traffic';
import { Navigation } from './ui/navigation';
import { RaceSystem } from './race/system';
import type { RaceOptions } from './ui/races';
import type { QAControls } from './core/qa';
import { GarageUI } from './ui/garage';
import { browserStore } from './progression/storage';
import { activeCar, settleRace } from './progression/profile';
import { calculateStats } from './progression/catalog';
import './ui/style.css';
import './ui/navigation.css';
import './ui/races.css';
import {
  prepareWorldTextures,
  generatedEnvironment,
} from './gen/textures/library';

const DRIFT_MODES = new Set(['drift', 'downhill']);
async function boot() {
  let playing = false;
  let ready = false;
  const audio = new EngineAudio();
  const hud = new Hud(
    () => action('pause'),
    () => action('mute'),
    () => action('reset'),
  );
  const settings = new SettingsUI();
  let settingsWasDriving = false;
  settings.onOpen = () => {
    if (
      !ready ||
      startPending ||
      garage?.open ||
      phone?.open ||
      races?.ui.menuVisible ||
      navigation?.open ||
      races?.resultsVisible
    )
      return;
    settingsWasDriving = playing;
    suspend();
    hud.pause(false);
    settings.show();
  };
  settings.onClose = () => {
    settings.hide();
    if (settingsWasDriving) void resume();
    else hud.pause(true);
  };
  const input = new Input(action);
  let vehicle: Vehicle;
  let wetReflections: WetReflections | undefined;
  let chase: ChaseCamera;
  let loop: FixedLoop;
  let renderer: THREE.WebGLRenderer;
  let visualEffects: Effects | undefined;
  let startPending = false;
  let resumeGeneration = 0;
  let city: City | undefined;
  let traffic: Traffic | undefined;
  let navigation: Navigation | undefined;
  let races: RaceSystem | undefined;
  let raceMenuWasDriving = false;
  let garage: GarageUI | undefined;
  let garageWasDriving = false;
  let phone: CareerUI | undefined;
  let phoneWasDriving = false;
  let currentDistrict = 'old-docks';
  let currentDistrictIndex = 0;
  const pendingFragments = new Set<string>();
  let currentDistrictName = 'Old Docks';
  let shownRegionalPrompt = false;
  let metro: MetroWorld | undefined;
  let knownAccess = 0;
  let changeDistrict: (id: string, teleport?: boolean) => void = () => {};
  let coverBusy = false;
  let speedTarget = 0;
  let runId = '';

  const store = browserStore();
  let garagePois = district.pois.filter(
    (p) =>
      p.type === 'garage' ||
      p.id === 'workshop' ||
      p.id === 'paint' ||
      p.id === 'body' ||
      p.id === 'dealer',
  );
  const qa: QAControls = { manual: false, advancing: false, autodrive: false };
  const testTrack =
    new URLSearchParams(location.search).get('world') === 'track';
  const initialLow =
    new URLSearchParams(location.search).get('quality') === 'low' ||
    preferences.quality === 'low';
  if (new URLSearchParams(location.search).get('quality') === 'low')
    setSessionQuality('low');
  hud.quality.value = graphicsQuality();

  function deferProgress(
    change: (p: typeof store.profile) => void,
    after: () => void = () => {},
  ) {
    queueMicrotask(() => {
      try {
        store.commit(change);
        after();
      } catch (e) {
        hud.toast(e instanceof Error ? e.message : 'Progressi non registrati.');
      }
    });
  }
  function refreshPhone(preserveNavigation = false) {
    const c = store.profile.career;
    const goal = careerData.sponsors.find(
      (s) => s.id === c.activeSponsor && s.kind === 'speed',
    );
    speedTarget = goal && c.sponsorProgress < goal.target ? goal.target : 0;
    phone?.refresh();
    const unlocked = accessCount(store.profile.career.defeated);
    if (navigation && unlocked !== knownAccess) {
      knownAccess = unlocked;
      navigation.setAtlas(atlasGraph(unlocked), unlocked);
      navigation.setDistrict(
        currentDistrictName,
        careerData.districts
          .slice(0, unlocked)
          .flatMap((_, i) => districtPois(i)),
        preserveNavigation,
      );
    }
    navigation?.setCollected(store.profile.exploration);
  }
  function openPhone() {
    if (!phone || !ready || startPending || garage?.open || coverBusy) return;
    if (races?.active) {
      hud.toast('Esci dalla gara per aprire il telefono.');
      return;
    }
    phoneWasDriving = playing;
    suspend();
    navigation?.hide();
    races?.ui.hideMenu();
    hud.pause(false);
    phone.show();
  }
  function closePhone() {
    phone?.hide();
    if (phoneWasDriving) void resume();
    else hud.pause(true);
  }
  async function makeCover(id: string) {
    if (coverBusy || !garage) return;
    const lock = coverLock(store.profile, id);
    if (lock) {
      hud.toast(lock);
      return;
    }
    const m = careerData.magazines.find((m) => m.id === id)!;
    const car = JSON.stringify(activeCar(store.profile));
    coverBusy = true;
    phone?.hide();
    openGarage(true);
    garageWasDriving = phoneWasDriving;
    try {
      if (!(await garage.exportCover(m.name, m.edition)))
        throw Error('Copertina non esportata. Riprova.');
      if (JSON.stringify(activeCar(store.profile)) !== car)
        throw Error('Configurazione cambiata. Riprova il servizio.');
      store.commit((p) => claimCover(p, id));
      garage.refreshProgress();
      refreshPhone();
      hud.toast(`Copertina esportata. Premio assegnato. ${store.status}`);
    } catch (e) {
      hud.toast(e instanceof Error ? e.message : 'Servizio non riuscito.');
    } finally {
      coverBusy = false;
    }
  }
  async function resume() {
    if (!ready || startPending) return;
    const generation = ++resumeGeneration;
    startPending = true;
    try {
      await audio.start();
    } catch {
      audio.muted = true;
      hud.soundLabel(true);
      hud.toast('Audio non disponibile. La guida resta attiva.');
    }
    startPending = false;
    if (!ready || generation !== resumeGeneration || document.hidden) {
      void audio.pause();
      return;
    }
    playing = true;
    input.clear();
    input.enabled = !races?.resultsVisible;
    if (races?.resultsVisible) void audio.pause();
    hud.pause(false);
    hud.start.blur();
    loop.start();
  }

  function suspend() {
    resumeGeneration++;
    playing = false;
    input.enabled = false;
    input.clear();
    void audio.pause();
  }

  function pause() {
    if (!playing && !startPending) return;
    suspend();
    hud.pause(true);
  }
  function continueResults() {
    if (
      !ready ||
      document.hidden ||
      !races?.resultsVisible ||
      races.session?.phase !== 'running'
    )
      return;
    playing = true;
    input.enabled = false;
    input.clear();
    hud.pause(false);
    loop.start();
  }

  function openRaces() {
    if (
      !races ||
      !ready ||
      startPending ||
      garage?.open ||
      phone?.open ||
      coverBusy
    )
      return;
    if (races.active && !races.resultsVisible) {
      hud.toast(
        'Gara in corso. Termina o abbandona per scegliere un altro evento.',
      );
      return;
    }
    raceMenuWasDriving = playing || races.resultsVisible;
    if (races.active) races.stop();
    garage?.setAvailable(true);
    phone?.setAvailable(true);
    suspend();
    navigation?.hide();
    hud.pause(false);
    races.ui.showMenu();
  }
  function closeRaces() {
    races?.ui.hideMenu();
    if (raceMenuWasDriving) void resume();
    else hud.pause(true);
  }
  async function beginRace(id: string, options: RaceOptions, rolling = false) {
    if (!races || !ready || startPending || coverBusy) return;
    const lock = raceLock(store.profile, id);
    if (lock) {
      hud.toast(lock);
      return;
    }
    const definition = raceCatalog.events.find((e) => e.id === id);
    if (!definition) {
      hud.toast('Evento sconosciuto.');
      return;
    }
    const target =
      'district' in definition && typeof definition.district === 'string'
        ? definition.district
        : id === 'drift-hills' && currentDistrict === 'hillcrest'
          ? 'hillcrest'
          : 'old-docks';
    if (
      store.profile.career.started &&
      store.profile.career.district !== target
    )
      store.commit((p) => travel(p, target));
    changeDistrict(target);
    phone?.hide();
    suspend();
    navigation?.hide();
    hud.pause(false);
    runId = crypto.randomUUID();

    races.prepare(id, options, rolling);
    visualEffects?.refreshMaterials();
    races.ui.nearby(null);
    shownRegionalPrompt = false;
    garage?.setAvailable(false);
    phone?.setAvailable(false);
    document.querySelector('#race-hud .eyebrow')!.textContent = (
      careerData.districts.find((d) => d.id === target)!.name + ' / GARA'
    ).toUpperCase();
    refreshPhone();
    chase.reset();
    await resume();
  }
  function exitRace() {
    races?.stop();
    garage?.setAvailable(true);
    phone?.setAvailable(true);
    chase.reset();
    void resume();
  }

  function applyConfiguration() {
    const stats = calculateStats(
      activeCar(store.profile).equipped,
      activeCar(store.profile).model,
    );
    vehicle.applyStats(stats);
    vehicle.applyAppearance(
      activeCar(store.profile).appearance,
      activeCar(store.profile).model,
    );
    hud.applyAppearance(activeCar(store.profile).appearance);
    visualEffects?.refreshMaterials();
    vehicle.hold();
    audio.sound = stats.sound;
    audio.turbo = stats.turbo;
    races?.configureProgress(store.profile);
    document.querySelector('.session-label')!.textContent = careerData.models
      .find((m) => m.id === activeCar(store.profile).model)!
      .name.toUpperCase();
    changeDistrict(store.profile.career.district);
    refreshPhone();
  }
  function openGarage(style = false) {
    if (!garage || !ready || startPending || garage.open || phone?.open) return;
    if (races?.active) {
      hud.toast('Esci dalla gara per entrare in garage.');
      return;
    }
    garageWasDriving = playing;
    suspend();
    navigation?.hide();
    races?.ui.hideMenu();
    hud.pause(false);
    garage.show(style);
  }
  function closeGarage() {
    garage?.hide();
    if (garageWasDriving) void resume();
    else hud.pause(true);
  }
  function nearPass() {
    return (
      currentDistrict === 'hillcrest' &&
      Math.hypot(vehicle.position.x - 1750, vehicle.position.z - 820) < 22
    );
  }
  function regionalEvent() {
    return nearPass() ? 'drift-hills' : 'career-' + currentDistrict;
  }
  function nearRegionalMeeting() {
    if (nearPass()) return true;
    const meeting = raceCatalog.events.find(
      (e) => e.id === 'career-' + currentDistrict,
    )?.meeting;
    return (
      !!meeting &&
      Math.hypot(
        vehicle.position.x - meeting.x,
        vehicle.position.z - meeting.z,
      ) < 22
    );
  }
  function nearGarage() {
    for (let i = 0; i < garagePois.length; i++) {
      const p = garagePois[i];
      if (Math.hypot(vehicle.position.x - p.x, vehicle.position.z - p.z) < 22)
        return true;
    }
    return false;
  }

  function toggleMap() {
    if (!navigation) return;
    if (navigation.open) {
      navigation.hide();
      void resume();
    } else if (playing) {
      playing = false;
      input.enabled = false;
      input.clear();
      void audio.pause();
      navigation.show();
    }
  }

  function action(name: string) {
    if (!ready) return;
    if (settings.open) {
      if (name === 'pause' || name === 'settings') settings.onClose();
      return;
    }
    if (name === 'settings') {
      settings.onOpen();
      return;
    }
    if (phone?.open) {
      if (name === 'pause' || name === 'phone') closePhone();
      return;
    }
    if (garage?.open) {
      if (name === 'pause' && garage.closePhoto()) return;
      if (name === 'debug') garage.toggleDebug();
      if (name === 'pause' || name === 'garage') closeGarage();
      return;
    }
    if (name === 'phone') {
      openPhone();
      return;
    }
    if (name === 'garage') {
      openGarage();
      return;
    }
    if (races?.ui.menuVisible) {
      if (name === 'pause' || name === 'races') closeRaces();
      return;
    }
    if (races?.resultsVisible) {
      if (name === 'pause') exitRace();
      else if (name === 'races') openRaces();
      return;
    }
    if (navigation?.open) {
      if (name === 'pause' || name === 'map') toggleMap();
      return;
    }
    if (playing && name === 'gear-up') vehicle.shift(1);
    if (playing && name === 'gear-down') vehicle.shift(-1);
    if (playing && name === 'manual') {
      if (races?.session?.route.definition.mode === 'drag')
        hud.toast('Cambio manuale obbligatorio nel drag.');
      else {
        vehicle.power.manual = !vehicle.power.manual;
        vehicle.power.gear = 1;
        hud.toast(
          vehicle.power.manual ? 'Cambio manuale: X/Z.' : 'Cambio automatico.',
        );
      }
    }
    if (
      playing &&
      name === 'challenge' &&
      !races?.active &&
      races?.nearChallenge
    ) {
      void beginRace('duel-docks', races.ui.options, true);
      return;
    }
    if (name === 'map') toggleMap();
    if (name === 'races') openRaces();
    if (name === 'interact' && playing && !races?.active && nearGarage()) {
      openGarage(
        districtPois(currentDistrictIndex).some(
          (p) =>
            ['paint', 'body'].some((id) => p.id.endsWith(id)) &&
            Math.hypot(vehicle.position.x - p.x, vehicle.position.z - p.z) < 22,
        ),
      );
      if (
        garagePois.some(
          (p) =>
            p.id.endsWith('dealer') &&
            Math.hypot(vehicle.position.x - p.x, vehicle.position.z - p.z) < 22,
        )
      )
        garage?.focusCatalog();
      return;
    }
    if (
      name === 'interact' &&
      playing &&
      !races?.active &&
      currentDistrict !== 'old-docks' &&
      nearRegionalMeeting()
    ) {
      void beginRace(regionalEvent(), races!.ui.options);
      return;
    }
    if (name === 'interact' && playing && races?.nearbyEvent)
      void beginRace(races.nearbyEvent, races.ui.options);
    if (name === 'pause') {
      if (playing) pause();
      else void resume();
    }
    if (name === 'mute') {
      audio.muted = !audio.muted;
      hud.soundLabel(audio.muted);
    }
    if (name === 'reset' && playing) {
      if (races?.active) {
        if (!races.resetPlayer()) {
          hud.toast('Ripristino disponibile dopo il via.');
          return;
        }
        chase.reset();
        hud.toast(
          `Ultimo checkpoint ripristinato. Penalità: ${raceCatalog.resetPenalty} secondi.`,
        );
        return;
      }
      vehicle.reset();
      chase.reset();
      hud.toast(
        testTrack
          ? 'Auto riposizionata sul rettilineo.'
          : 'Auto riposizionata a ' +
              careerData.districts.find((d) => d.id === currentDistrict)!.name +
              '.',
      );
    }
    if (name === 'camera' && playing) {
      chase.cycle();
      hud.toast(`Visuale ${chase.names[chase.mode].toLowerCase()}`);
    }
    if (name === 'debug') hud.showDebug = !hud.showDebug;
  }

  try {
    const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, initialLow ? 1 : 1.5));
    renderer.setSize(innerWidth, innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !initialLow;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.info.autoReset = false;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1525);
    scene.fog = new THREE.FogExp2(0x151a22, 0.0038);
    const camera = new THREE.PerspectiveCamera(
      65,
      innerWidth / innerHeight,
      0.1,
      1100,
    );
    scene.add(new THREE.HemisphereLight(0x8fabbc, 0x171c20, 0.24));
    const moon = new THREE.DirectionalLight(0x9dc4d0, 0.28);
    moon.position.set(-45, 75, 30);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    moon.shadow.camera.left = -30;
    moon.shadow.camera.right = 30;
    moon.shadow.camera.top = 30;
    moon.shadow.camera.bottom = -30;
    moon.shadow.camera.far = 180;
    moon.shadow.normalBias = 0.03;
    scene.add(moon, moon.target);
    await Promise.all([
      RAPIER.init(),
      document.fonts.load('700 64px "Circuit Grid"'),
      prepareWorldTextures(),
      prepareBakedLighting(),
      prepareDetailedCarModels(['silex-c1', activeCar(store.profile).model]),
    ]);
    const sky = generatedEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const reflectionSky = reflectionEnvironment();
    scene.environment = pmrem.fromEquirectangular(reflectionSky).texture;
    reflectionSky.dispose();
    scene.environmentIntensity = 0.4;
    scene.background = sky;
    const atmosphere = new Atmosphere(scene);
    pmrem.dispose();
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    world.timestep = FIXED_DT;
    if (testTrack) createTrack(scene, world);
    else {
      const graph = districtGraph(0);
      const cityRoot = new THREE.Scene();
      scene.add(cityRoot);
      city = new City(cityRoot, world, graph, initialLow, district, true);
      createStreetscape(cityRoot, graph, world);
      wetReflections = new WetReflections(cityRoot, graph);
      metro = new MetroWorld(scene, world);
      createSkyline(scene);
      traffic = new Traffic(scene, world, graph);
      navigation = new Navigation(graph, scene);
      navigation.bindOpen(toggleMap);
      navigation.onClose = toggleMap;
      hud.cityMode(traffic.count, (count) => {
        preferences.traffic = count;
        savePreferences();
        if (races) races.setTrafficPreference(count);
        else traffic!.setDensity(count);
      });
    }
    vehicle = new Vehicle(world, scene, testTrack ? undefined : district.spawn);
    chase = new ChaseCamera(camera);
    world.step();
    vehicle.capture();
    if (traffic && navigation) {
      races = new RaceSystem(
        scene,
        world,
        vehicle,
        traffic,
        navigation,
        metro?.hill,
      );
      races.ui.onQuick = openRaces;
      races.ui.onBack = closeRaces;
      races.ui.onFree = exitRace;
      races.ui.onStart = (id, options) => {
        void beginRace(id, options);
      };
      races.ui.onInteract = () => {
        if (currentDistrict !== 'old-docks' && playing && !races?.active) {
          void beginRace(regionalEvent(), races!.ui.options);
          return;
        }
        if (races?.nearbyEvent)
          void beginRace(races.nearbyEvent, races.ui.options);
      };
      races.ui.onChallenge = () => {
        if (races?.nearChallenge && !races.active)
          void beginRace('duel-docks', races.ui.options, true);
      };
      races.ui.onNextCup = () => {
        if (races!.session?.phase !== 'finished') return;
        void beginRace('cup-docks', races!.options);
      };
      races.ui.onResetCup = () => {
        store.commit((p) => {
          p.cup = null;
        });
        races!.cup = null;
        races!.ui.cupProgress(null, false);
      };
      races.ui.onAbandon = () => races!.abandon();
      races.onResults = () => {
        input.enabled = false;
        input.clear();
        void audio.pause();
      };
      races.onSettled = () => {
        const result = races!.completeSession();
        const previousFame = store.profile.career.fame;
        try {
          let reward = 0;
          store.commit((p) => {
            reward = settleRace(
              p,
              {
                id: races!.settlementId ?? runId,
                ...result,
              },
              races!.options.speedScale,
            );
            races!.writeProgress(p);
          });
          races!.confirmProgress(store.profile);
          races!.ui.setReward(
            `Premio: ${reward.toLocaleString(preferences.language === 'en' ? 'en-GB' : 'it-IT')} CR. Saldo: ${store.profile.credits.toLocaleString(preferences.language === 'en' ? 'en-GB' : 'it-IT')} CR. +${store.profile.career.fame - previousFame} REP. ${store.status}`,
          );
        } catch (error) {
          races!.ui.setReward(
            error instanceof Error ? error.message : 'Premio non registrato.',
          );
        }
        const rival = careerData.rivals.find((r) => r.event === result.event);
        if (rival && store.profile.career.defeated.includes(rival.id))
          races!.ui.setRetryAvailable(false);
        refreshPhone();
        suspend();
      };
      garage = new GarageUI(store);
      garage.onOpen = openGarage;
      garage.onClose = closeGarage;
      garage.onChange = applyConfiguration;
      phone = new CareerUI(store);
      phone.onOpen = openPhone;
      phone.onClose = closePhone;
      phone.onChange = refreshPhone;
      phone.onRace = (id) => {
        void beginRace(id, races!.ui.options);
      };
      changeDistrict = (id, teleport = true) => {
        const index = careerData.districts.findIndex((d) => d.id === id);
        if (index < 0) throw Error('Quartiere sconosciuto.');
        const info = careerData.districts[index],
          o = ORIGINS[index];
        if (id !== currentDistrict) {
          if (teleport) races!.stop();
          currentDistrict = id;
          currentDistrictIndex = index;
          currentDistrictName = info.name;
          shownRegionalPrompt = false;
          traffic!.setDistrict(localGraph(index));
          races!.setFreeDistrict(id);
          garagePois = districtPois(index).filter(
            (p) => p.type === 'garage' || p.type === 'shop',
          );
          knownAccess = 0;
          refreshPhone(!teleport);
          document.querySelector('.session > p')!.textContent =
            'Guida libera · ' + info.name;
          document.querySelector('.location')!.innerHTML =
            `<span class="live-dot"></span> PORT RIDERS <span class="separator">/</span> ${info.name.toUpperCase()}`;
          vehicle.setSpawn(...streetSpawn(o.x - 4.5, o.z - 310));
          if (teleport) {
            metro!.update(
              o.x,
              o.z,
              0,
              accessCount(store.profile.career.defeated),
            );
            vehicle.reset();
            chase.reset();
          }
        }
      };
      phone.onTravel = (id) => {
        try {
          store.commit((p) => travel(p, id));
          changeDistrict(id);
          phoneWasDriving = true;
          closePhone();
          refreshPhone();
        } catch (e) {
          hud.toast(
            e instanceof Error ? e.message : 'Viaggio non disponibile.',
          );
        }
      };
      phone.onCover = (id) => {
        void makeCover(id);
      };
      applyConfiguration();
    }
    let fps = 60,
      time = 0;
    let pausedRenderClock = 0.25;
    hud.start.onclick = () => {
      void resume();
    };
    hud.assist.onchange = () => {
      preferences.assist = hud.assist.checked;
      savePreferences();
      if (races) races.setAssistPreference(hud.assist.checked);
      else vehicle.assist = hud.assist.checked;
    };
    let appliedQuality = '';
    const applyQuality = () => {
      const value = graphicsQuality();
      hud.quality.value = value;
      if (appliedQuality === value) return;
      appliedQuality = value;
      const low = value === 'low';
      renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1 : 1.5));
      renderer.shadowMap.enabled = !low;
      scene.environmentIntensity = low ? 0.3 : 0.4;
      if (city) city.low = low;
      visualEffects?.resize();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          for (const material of materials) material.needsUpdate = true;
        }
      });
    };
    hud.quality.onchange = () => {
      setSessionQuality();
      preferences.quality = hud.quality.value as typeof preferences.quality;
      savePreferences();
      applyQuality();
    };
    const applyPreferences = () => {
      applyQuality();
      hud.assist.checked = preferences.assist;
      if (races) races.setAssistPreference(preferences.assist);
      else vehicle.assist = preferences.assist;
      races?.setTrafficPreference(preferences.traffic);
      const density =
        document.querySelector<HTMLSelectElement>('#traffic-density');
      if (density) density.value = String(preferences.traffic);
      setLanguage(preferences.language);
    };
    settings.onChange = applyPreferences;
    applyPreferences();
    window.addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
      else if (document.hasFocus()) continueResults();
    });
    window.addEventListener('blur', pause);
    window.addEventListener('focus', continueResults);
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      pause();
      ready = false;
      navigation?.hide();
      settings.hide();
      garage?.hide();
      garage?.setAvailable(false);
      phone?.hide();
      phone?.setAvailable(false);
      loop.stop();
      races?.stop();
      hud.error('Contesto grafico perso. Ricarica la pagina per riprovare.');
    });
    const explorationWorld = testTrack
      ? undefined
      : new Exploration(scene, world);
    const drivingStyle = new DrivingStyle();
    const lighting = metro ? new WorldLighting(scene) : undefined;
    lighting?.update(
      vehicle.position.x,
      vehicle.position.y,
      vehicle.position.z,
      time,
      accessCount(store.profile.career.defeated),
    );
    const effects = new Effects(renderer, scene, camera);
    const tireSmoke = new TireSmoke(scene, renderer);
    const carReflections = new CarReflections(renderer, scene);
    const wetRoad = new WetRoad(scene, camera);
    effects.beforeSceneRender = () =>
      wetRoad.renderReflection(renderer, camera);
    visualEffects = effects;
    window.addEventListener('resize', () => effects.resize());
    const previousSettingsChange = settings.onChange;
    settings.onChange = () => {
      previousSettingsChange();
      effects.resize();
    };
    let debugGeometry: import('./core/debug').DebugGeometry | undefined;
    if (import.meta.env.DEV) {
      const { DebugGeometry } = await import('./core/debug');
      debugGeometry = new DebugGeometry(scene);
      if (navigation)
        navigation.onTeleport = (x, z) => {
          if (!races?.active) {
            vehicle.place(x, roadHeight(x, z) + 1.15, z, 0);
            chase.reset();
            hud.toast('F3 / Auto riposizionata sulla strada.');
          }
        };
    }
    const step = (dt: number) => {
      if (qa.manual && !qa.advancing) return;
      input.suppressPadActions = settings.capturing;
      const controls = input.sample();
      if (!playing) return;
      time += dt;
      traffic?.step(dt, time, vehicle.position);
      const raceControls =
        races?.beforeStep(dt, controls, qa.autodrive) ?? controls;
      metro?.update(
        vehicle.position.x,
        vehicle.position.z,
        time,
        accessCount(store.profile.career.defeated),
        races?.session?.route.definition.hill === true,
      );
      city?.enabled(Math.hypot(vehicle.position.x, vehicle.position.z) < 1120);
      vehicle.step(raceControls, dt);
      world.step();
      vehicle.capture();
      tireSmoke.update(vehicle, dt, raceControls.handbrake);
      races?.afterStep(dt);
      if (traffic) {
        const notice = drivingStyle.update(
          vehicle,
          dt,
          traffic.positions,
          traffic.count,
          !DRIFT_MODES.has(races?.session?.route.definition.mode ?? ''),
        );
        if (notice) hud.toast(notice);
      }
      const fragment = explorationWorld?.update(
        vehicle.position.x,
        vehicle.position.y,
        vehicle.position.z,
        time,
        store.profile,
        accessCount(store.profile.career.defeated),
        !races?.active,
      );
      if (fragment && !pendingFragments.has(fragment)) {
        pendingFragments.add(fragment);
        deferProgress(
          (p) => {
            collect(p, fragment);
          },
          () => {
            pendingFragments.delete(fragment);
            navigation?.setCollected(store.profile.exploration);
            hud.toast(
              `Frammento raccolto: ${store.profile.exploration.length}/12. +250 CR. ${store.status}`,
            );
          },
        );
      }
      if (metro && !races?.active) {
        const index = districtIndex(vehicle.position.x, vehicle.position.z),
          id = careerData.districts[index].id;
        if (
          id !== currentDistrict &&
          index < accessCount(store.profile.career.defeated)
        ) {
          if (store.profile.career.started)
            deferProgress(
              (p) => travel(p, id),
              () => refreshPhone(true),
            );
          changeDistrict(id, false);
        }
      }
      if (speedTarget && vehicle.speed * 3.6 >= speedTarget) {
        const speed = vehicle.speed * 3.6;
        speedTarget = 0;
        deferProgress(
          (p) => recordSpeed(p, speed),
          () => {
            refreshPhone();
            hud.toast('Obiettivo sponsor raggiunto. Riscuoti dal telefono.');
          },
        );
      }
    };
    loop = new FixedLoop(step, (alpha, dt) => {
      if (garage?.open || phone?.open || settings.open) return;
      if (!playing || races?.resultsVisible) {
        pausedRenderClock += dt;
        if (pausedRenderClock < 0.25) return;
        dt = pausedRenderClock;
      }
      pausedRenderClock = 0;
      fps = THREE.MathUtils.damp(fps, 1 / Math.max(dt, 0.001), 2, dt);
      const blend = playing && !qa.manual ? alpha : 1;
      renderer.info.reset();
      document
        .querySelector('#interface')!
        .classList.toggle('driving', playing);
      vehicle.render(blend, time);
      races?.render(blend, time, dt, playing);
      if (races && currentDistrict !== 'old-docks' && !races.active) {
        const near = playing && !navigation?.open && nearRegionalMeeting();
        if (near !== shownRegionalPrompt) {
          shownRegionalPrompt = near;
          races.ui.nearby(
            near
              ? nearPass()
                ? 'Pendio di Vetracava'
                : 'Gara / ' + currentDistrictName
              : null,
          );
        }
      }
      lighting?.update(
        vehicle.position.x,
        vehicle.position.y,
        vehicle.position.z,
        time,
        accessCount(store.profile.career.defeated),
      );
      traffic?.render();
      city?.update(vehicle.position.x, vehicle.position.z, time);
      const q = vehicle.rotation;
      const yaw = Math.atan2(
        2 * (q.w * q.y + q.x * q.z),
        1 - 2 * (q.y * q.y + q.x * q.x),
      );
      navigation?.update(vehicle.position.x, vehicle.position.z, yaw, dt);
      garage?.nearby(
        playing &&
          Math.hypot(vehicle.speed, vehicle.slip) < 5 &&
          !races?.active &&
          !navigation?.open &&
          nearGarage(),
      );
      chase.update(vehicle, dt);
      atmosphere.update(camera);
      wetReflections?.enabled(graphicsQuality() === 'low');
      wetReflections?.update(camera);
      wetRoad.update(vehicle.position);
      moon.position.set(
        vehicle.position.x - 45,
        vehicle.position.y + 75,
        vehicle.position.z + 30,
      );
      moon.target.position.copy(vehicle.position);
      const matrixWorldAutoUpdate = scene.matrixWorldAutoUpdate;
      // Low quality has a single scene pass. Keep its original update order,
      // including disposal of the local environment before world transforms.
      if (graphicsQuality() !== 'low') {
        scene.updateMatrixWorld();
        scene.matrixWorldAutoUpdate = false;
      }
      try {
        if (!garage?.open) carReflections.update(vehicle.model.root, time);
        audio.update(
          vehicle.power.rpm,
          input.state.throttle,
          vehicle.grounded ? Math.abs(vehicle.slip) : 0,
          vehicle.power.boosting,
          vehicle.speed,
          vehicle.collided,
          preferences.rain,
          vehicle.impactSpeed,
        );
        vehicle.impactSpeed = 0;
        debugGeometry?.update(
          vehicle,
          hud.showDebug,
          races?.session?.route.points,
        );
        if (!garage?.open)
          effects.render(
            vehicle.position.x,
            vehicle.position.y,
            vehicle.position.z,
            time,
            vehicle.power.boosting,
            vehicle.speed,
          );
        hud.update(
          vehicle,
          dt,
          input.device,
          chase.names[chase.mode],
          fps,
          renderer.info.render.calls,
          renderer.info.render.triangles,
        );
      } finally {
        scene.matrixWorldAutoUpdate = matrixWorldAutoUpdate;
      }
    });
    if (
      import.meta.env.DEV &&
      races &&
      new URLSearchParams(location.search).get('qa') === 'race'
    ) {
      const { installRaceQA } = await import('./core/qa');
      installRaceQA(qa, races, step, () => playing);
    }
    document.querySelector('.build-label')!.innerHTML =
      'NIGHT CIRCUIT <span>FASE 8 / 8</span>';
    document
      .querySelector('.controls')!
      .insertAdjacentHTML(
        'afterbegin',
        '<span>Comandi predefiniti. Assegnazioni attuali in Impostazioni.</span><br>',
      );
    setLanguage(preferences.language);
    city?.enabled(Math.hypot(vehicle.position.x, vehicle.position.z) < 1120);
    await effects.prepare();
    ready = true;
    hud.ready();
    // Render the actual scene behind the start panel while physics remains paused.
    loop.start();
  } catch (error) {
    console.error(error);
    hud.error(
      'La pista non è stata caricata. Serve un browser con WebGL2 e accelerazione grafica. Se il problema persiste, prova a ricaricare.',
    );
  }
}

if (new URLSearchParams(location.search).get('debug') === 'textures') {
  void document.fonts.load('16px "Circuit Grid"').then(async () => {
    const { showTextureDebug } = await import('./gen/textures/debug');
    await showTextureDebug();
  });
} else void boot();
