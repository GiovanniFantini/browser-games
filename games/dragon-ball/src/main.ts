import * as THREE from 'three';
import { createPortraits } from './portraits';
import { createWorld, FISHING, ground, LIMIT, SPHERE } from './world';
import { advanceStage, freshSave, loadSave, OBJECTIVES, writeSave, type LoadResult, type Save, type Stage, type Store } from './state';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
const star = '<span class="dragon-orb" aria-hidden="true"><span>★ ★<br>★ ★</span></span>';
app.innerHTML = `
  <main id="game" aria-label="Dragon Ball: Il primo incontro">
    <div id="viewport" tabindex="0" aria-label="Mondo 3D. WASD per muoverti, Spazio per saltare, E per interagire."></div>
    <div class="vignette"></div>
    <header class="topbar">
      <div class="brand">${star}<div><span class="brand-name">DRAGON BALL</span><span class="brand-sub">LA SAGA DI PILAF</span></div></div>
      <div class="location"><span class="location-dot"></span><div>MONTE PAOZU<small>Il primo incontro</small></div></div>
      <button id="menu-button" class="icon-button" aria-label="Apri menu di pausa" title="Pausa · Esc">Ⅱ</button>
    </header>
    <section id="hud" hidden>
      <aside class="quest"><span class="eyebrow">CAPITOLO 01 <span id="chapter-progress">01 / 04</span></span><h1 id="objective-title"></h1><p id="objective-detail"></p><div class="quest-line"><i></i><i></i><i></i><i></i></div></aside>
      <div id="waypoint" hidden><span class="waypoint-diamond">◆</span><span id="waypoint-name"></span><small id="waypoint-distance"></small></div>
      <button id="interaction" hidden><kbd>E</kbd><span>Parla con Bulma</span></button>
      <aside class="player-card"><div class="player-avatar">孫</div><div><span class="player-name">SON GOKU <small>Lv. 1</small></span><div class="health-bar"><span></span></div><small class="player-caption">Una grande avventura ti aspetta.</small></div></aside>
      <div class="compass" aria-label="Bussola"><span>N</span><i id="compass-needle">↑</i><span>S</span></div>
      <div class="control-hint"><kbd>W A S D</kbd> muovi <span>·</span> <kbd>SPAZIO</kbd> salta <span>·</span> <kbd>MAIUSC</kbd> corri <span>·</span> trascina il mouse per guardarti intorno</div>
    </section>
    <div id="save-status" role="status" aria-live="polite"><i></i><span>Salvataggio automatico</span></div>
    <section id="menu" class="menu-layer" aria-label="Menu iniziale">
      <div class="menu-content"><span class="eyebrow"><span class="tiny-line"></span> CAPITOLO 01 · MONTE PAOZU</span><h1>Goku, Bulma<br>e una grande<br><em>avventura.</em></h1><p>Un pesce gigante per cena, uno strano mostro sulla strada e la Sfera del nonno. Tutto comincia sulle montagne.</p><div class="menu-actions"><button class="primary" id="start-button">Inizia l’avventura <span>↗</span></button><button id="continue-button" class="secondary" hidden>Continua la partita <span>→</span></button></div><div class="menu-footnote"><span class="small-star">✦</span> Esplora con calma. I progressi si salvano da soli.</div><p id="storage-warning" class="storage-warning" role="status" hidden></p></div>
      <div class="scene-caption"><span>01 /</span> LE MONTAGNE DI GOKU<small>La prima tappa del viaggio</small></div>
      <span class="build-label">PRIMA TAPPA GIOCABILE · SINGLE PLAYER</span>
    </section>
    <section id="pause" class="modal-layer" hidden><div class="panel"><span class="eyebrow">PRENDITI UN MOMENTO</span><h2>Il viaggio può aspettare.</h2><p id="pause-objective"></p><button id="resume-button" class="primary">Riprendi <span>→</span></button><button id="quality-button" class="secondary">Qualità grafica: alta</button><button id="home-button" class="secondary">Torna al menu</button><button id="reset-button" class="text-button">Nuova partita</button><div class="panel-controls"><span><kbd>WASD</kbd> movimento</span><span><kbd>MOUSE</kbd> trascina: telecamera</span><span><kbd>SPAZIO</kbd> salto</span><span><kbd>E</kbd> interagisci</span><span><kbd>MAIUSC</kbd> corsa</span><span><kbd>ESC</kbd> pausa</span></div></div></section>
    <section id="confirm" class="modal-layer" hidden><div class="panel"><span class="eyebrow">RICOMINCIARE IL VIAGGIO?</span><h2>Una nuova avventura.</h2><p>La nuova partita sostituirà i progressi di questa tappa salvati in questo browser.</p><button id="confirm-reset" class="primary">Sì, ricomincia</button><button id="cancel-reset" class="secondary">Conserva la partita</button></div></section>
    <section id="dialogue" hidden aria-label="Conversazione"><div class="dialogue-portrait" id="portrait">B</div><div class="dialogue-content"><span id="speaker" class="eyebrow"></span><p id="dialogue-text"></p></div><button id="dialogue-next" aria-label="Avanza il dialogo"><kbd>E</kbd><span>Avanti →</span></button><span id="dialogue-counter"></span></section>
    <div id="toast" role="status" hidden></div>
    <section id="fatal" class="modal-layer" hidden><div class="panel"><span class="eyebrow">IL MONDO NON È ANCORA VISIBILE</span><h2>La grafica 3D non è disponibile.</h2><p>Prova un browser desktop aggiornato e verifica che l’accelerazione grafica sia attiva.</p><button class="primary" id="retry">Riprova</button></div></section>
  </main>`;

const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const viewport = element('viewport');
let storage: Store;
try { storage = window.localStorage; }
catch { storage = { getItem: () => { throw new Error('storage unavailable'); }, setItem: () => { throw new Error('storage unavailable'); }, removeItem: () => {} }; }
let loaded: LoadResult = loadSave(storage);
let save: Save = loaded.kind === 'valid' ? loaded.save : freshSave();
let mode: 'menu' | 'playing' | 'paused' | 'dialogue' | 'confirm' = 'menu';
let started = false;
let saveAllowed = loaded.kind !== 'invalid';
let storageFailed = loaded.kind === 'unavailable';
let gameReady = false;
let yaw = save.cameraYaw;
let pitch = save.cameraPitch;
let verticalVelocity = 0;
let grounded = true;
let previousGround = { ...save.position };
let interactionTarget: 'bulma' | 'sphere' | 'sign' | 'fish' | null = null;
let drag = false;
let dialogue: { speaker: string; text: string }[] = [];
let dialogueIndex = 0;
let dialogueEnd = () => {};
let confirmOrigin: 'menu' | 'paused' = 'menu';
let toastTimer: ReturnType<typeof setTimeout>;
const keys = new Set<string>();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x42a8f3);
scene.fog = new THREE.Fog(0x8acdfb, 100, 220);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 240);
const hemi = new THREE.HemisphereLight(0xd9f0ff, 0x334c4b, 1.3); scene.add(hemi);
const sunlight = new THREE.DirectionalLight(0xfff6e3, 2.0);
sunlight.position.set(-28, 48, 20); sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -45; sunlight.shadow.camera.right = 45;
sunlight.shadow.camera.top = 45; sunlight.shadow.camera.bottom = -45;
sunlight.shadow.camera.far = 140; sunlight.shadow.normalBias = 0.055;
sunlight.shadow.bias = -0.0002; scene.add(sunlight, sunlight.target);
const world = createWorld(); scene.add(world.group);
const player = world.goku.root;
const bulmaRoute = new THREE.CatmullRomCurve3([
  new THREE.Vector3(8, 0, 9), new THREE.Vector3(-5, 0, 4),
  new THREE.Vector3(-15, 0, -7), new THREE.Vector3(-15, 0, -11), new THREE.Vector3(-13, 0, -12),
]);
const isHomeStage = () => save.stage === 'show-sphere' || save.stage === 'return-bulma';
let bulmaProgress = isHomeStage() ? 1 : 0;
let carArrival = save.stage === 'catch-fish' ? 0 : 1;
let carMoving = false;
let carLiftStart = -100;
const carRoute = new THREE.CatmullRomCurve3([new THREE.Vector3(29, 0, -10), new THREE.Vector3(21, 0, 2), new THREE.Vector3(11.6, 0, 10.5)]);
function placeBulma() {
  const point = bulmaRoute.getPoint(bulmaProgress);
  world.bulma.root.position.set(point.x, ground(point.x, point.z), point.z);
}
placeBulma();
player.position.set(save.position.x, ground(save.position.x, save.position.z), save.position.z);
player.rotation.y = save.yaw;
let renderer!: THREE.WebGLRenderer;
let portraits: Record<string,string> = {};
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  viewport.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Montagne del Monte Paozu, Goku e Bulma');
  portraits = createPortraits(renderer, world.goku.root, world.bulma.root);
  const avatar = document.querySelector<HTMLElement>('.player-avatar')!;
  avatar.textContent = ''; avatar.style.backgroundImage = `url(${portraits.goku})`; avatar.setAttribute('aria-label','Goku');
  gameReady = true;
} catch (error) {
  console.error('Impossibile inizializzare la grafica 3D.', error);
  element('fatal').hidden = false;
}

function toast(text: string) {
  element('toast').textContent = text; element('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { element('toast').hidden = true; }, 4800);
}
function updateMenu() {
  element('continue-button').hidden = loaded.kind !== 'valid';
  element('start-button').textContent = loaded.kind === 'valid' ? 'Nuova partita ↗' : 'Inizia l’avventura ↗';
  const warning = element('storage-warning');
  warning.hidden = loaded.kind !== 'invalid' && loaded.kind !== 'unavailable';
  warning.textContent = loaded.kind === 'invalid' ? 'Il salvataggio esistente non è leggibile o appartiene a un’altra versione. Verrà sostituito solo se confermi una nuova partita.' : 'Il browser non consente di salvare. Puoi giocare, ma i progressi andranno persi chiudendo la pagina.';
}
function updateObjectives() {
  const objective = OBJECTIVES[save.stage];
  element('objective-title').textContent = objective.title;
  element('objective-detail').textContent = objective.detail;
  element('pause-objective').textContent = objective.detail;
  element('waypoint-name').textContent = objective.label;
  const index = ['catch-fish', 'meet-bulma', 'show-sphere', 'return-bulma', 'complete'].indexOf(save.stage);
  element('chapter-progress').textContent = `${String(Math.min(index + 1, 4)).padStart(2, '0')} / 04`;
  document.querySelectorAll<HTMLElement>('.quest-line i').forEach((line, i) => line.classList.toggle('done', i < index));
  world.marker.position.set(objective.target.x, ground(objective.target.x, objective.target.z) + 4, objective.target.z);
  world.marker.visible = save.stage !== 'complete';
  element('waypoint').hidden = save.stage === 'complete';
}
function applyQuality() {
  if (!gameReady) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, save.quality === 'high' ? 1.75 : 1));
  renderer.shadowMap.enabled = save.quality === 'high';
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      const mats = Array.isArray(object.material) ? object.material : [object.material];
      mats.forEach(mat => { mat.needsUpdate = true; });
    }
  });
  element('quality-button').textContent = `Qualità grafica: ${save.quality === 'high' ? 'alta' : 'leggera'}`;
}
function persist() {
  if (!started || !saveAllowed) return;
  save.position = { ...previousGround };
  save.yaw = normalizeAngle(player.rotation.y);
  save.cameraYaw = normalizeAngle(yaw); save.cameraPitch = pitch;
  save.updatedAt = new Date().toISOString();
  const ok = writeSave(storage, save);
  element('save-status').classList.toggle('save-failed', !ok);
  element('save-status').querySelector('span')!.textContent = ok ? 'Progressi salvati' : 'Salvataggio non disponibile';
  if (!ok && !storageFailed) toast('Il browser non consente di salvare. La partita continua, ma i progressi non saranno conservati.');
  storageFailed = !ok;
  if (ok) loaded = { kind: 'valid', save: structuredClone(save) };
}
function normalizeAngle(angle: number) { return Math.atan2(Math.sin(angle), Math.cos(angle)); }
function switchMode(next: typeof mode) {
  mode = next; keys.clear(); drag = false;
  if (document.pointerLockElement) document.exitPointerLock();
  element('menu').hidden = next !== 'menu'; element('pause').hidden = next !== 'paused';
  element('confirm').hidden = next !== 'confirm'; element('dialogue').hidden = next !== 'dialogue';
  element('hud').hidden = next === 'menu' || (next === 'confirm' && confirmOrigin === 'menu');
  element('interaction').hidden = true;
  element('menu-button').hidden = next === 'menu';
  if (next === 'playing') viewport.focus({ preventScroll: true });
  if (next === 'paused') element('resume-button').focus();
  if (next === 'confirm') element('cancel-reset').focus();
}
function begin(reset: boolean) {
  if (!gameReady) return;
  if (reset) save = freshSave();
  else if (loaded.kind === 'valid') save = structuredClone(loaded.save);
  saveAllowed = true; started = true;
  player.position.set(save.position.x, ground(save.position.x, save.position.z), save.position.z);
  player.rotation.y = save.yaw; yaw = save.cameraYaw; pitch = save.cameraPitch;
  previousGround = { ...save.position }; verticalVelocity = 0; grounded = true;
  bulmaProgress = isHomeStage() ? 1 : 0; placeBulma();
  carArrival = save.stage === 'catch-fish' ? 0 : 1; carMoving = false; carLiftStart = -100;
  applyQuality(); updateObjectives(); switchMode('playing');
  updateCamera(1, true); persist();
  if (reset) toast('Monte Paozu. Goku ha fame: il pesce gigante è sulla riva del torrente.');
}
function requestNew() {
  if (loaded.kind === 'valid' || loaded.kind === 'invalid' || started) {
    confirmOrigin = mode === 'menu' ? 'menu' : 'paused'; switchMode('confirm');
  } else begin(true);
}
element('start-button').onclick = requestNew;
element('continue-button').onclick = () => begin(false);
element('confirm-reset').onclick = () => begin(true);
element('cancel-reset').onclick = () => { switchMode(confirmOrigin); if (confirmOrigin === 'menu') element('start-button').focus(); };
element('reset-button').onclick = requestNew;
element('resume-button').onclick = () => switchMode('playing');
element('menu-button').onclick = () => { if (mode === 'playing') { persist(); switchMode('paused'); } };
element('home-button').onclick = () => { persist(); updateMenu(); switchMode('menu'); };
element('quality-button').onclick = () => { save.quality = save.quality === 'high' ? 'low' : 'high'; applyQuality(); persist(); };
element('retry').onclick = () => location.reload();

const conversations: Record<Stage, { speaker: string; text: string }[]> = {
  'catch-fish': [
    { speaker: 'Goku', text: 'Preso! Con un pesce così, oggi si mangia per bene!' },
    { speaker: 'Goku', text: 'Ora lo porto a casa. Il sentiero passa da quella strada laggiù.' },
  ],
  'meet-bulma': [
    { speaker: 'Goku', text: 'Ehi! Che mostro è questo?! Non ti lascio portare via il mio pesce!' },
    { speaker: 'Bulma', text: 'La mia auto! L’hai sollevata come niente! Mettila giù, non è un mostro!' },
    { speaker: 'Goku', text: 'Un’auto? E tu chi sei? Non avevo mai incontrato qualcuno come te.' },
    { speaker: 'Bulma', text: 'Mi chiamo Bulma. Il mio Radar mi ha portata fin qui. Sto cercando una cosa speciale.' },
    { speaker: 'Goku', text: 'Io sono Goku! Il nonno diceva di trattare bene gli ospiti. Vieni a casa mia, è in fondo al sentiero.' },
  ],
  'show-sphere': [
    { speaker: 'Bulma', text: 'Aspetta... quella sul comò! È la Sfera che indicava il mio Radar!' },
    { speaker: 'Goku', text: 'Questa è del nonno! Ha quattro stelle. Non la do a nessuno.' },
    { speaker: 'Bulma', text: 'È una Sfera del Drago. Ce ne sono sette: se le riunisci, appare un drago che esaudisce un desiderio.' },
    { speaker: 'Goku', text: 'Puoi guardarla, ma non te la lascio. Questa resta con me.' },
    { speaker: 'Bulma', text: 'Allora ho un’idea. Ascolta: potresti venire con me.' },
  ],
  'return-bulma': [
    { speaker: 'Bulma', text: 'Con il mio Radar possiamo trovare le altre Sfere. Tu conosci queste montagne, e te la cavi benissimo da solo.' },
    { speaker: 'Goku', text: 'Non sono mai andato tanto lontano. Ci saranno un sacco di cose da scoprire!' },
    { speaker: 'Bulma', text: 'Allora è deciso? Tu tieni la Sfera del nonno e partiamo insieme.' },
    { speaker: 'Goku', text: 'Va bene! Nonno, porto la tua Sfera con me. Chissà com’è grande il mondo!' },
  ],
  'complete': [
    { speaker: 'Bulma', text: 'Il viaggio è appena cominciato. Prima di scendere a valle, puoi dare un’ultima occhiata alle tue montagne.' },
    { speaker: 'Goku', text: 'Sono pronto! Le altre Sfere ci aspettano.' },
  ],
};
function openDialogue(lines: typeof dialogue, end: () => void) {
  dialogue = lines; dialogueIndex = 0; dialogueEnd = end;
  switchMode('dialogue'); showLine(); element('dialogue-next').focus();
}
function showLine() {
  const line = dialogue[dialogueIndex];
  element('speaker').textContent = line.speaker;
  element('dialogue-text').textContent = line.text;
  const portrait = line.speaker === 'Goku' ? portraits.goku : line.speaker === 'Bulma' ? portraits.bulma : undefined;
  element('portrait').textContent = portrait ? '' : '↗';
  element('portrait').style.backgroundImage = portrait ? `url(${portrait})` : '';
  element('portrait').setAttribute('aria-label',line.speaker);
  element('portrait').classList.toggle('goku', line.speaker === 'Goku');
  element('dialogue-counter').textContent = `${dialogueIndex + 1} / ${dialogue.length}`;
  element('dialogue-next').querySelector('span')!.textContent = dialogueIndex === dialogue.length - 1 ? 'Continua →' : 'Avanti →';
}
function nextLine() {
  if (mode !== 'dialogue') return;
  dialogueIndex++;
  if (dialogueIndex < dialogue.length) showLine();
  else { const done = dialogueEnd; switchMode('playing'); done(); }
}
element('dialogue-next').onclick = nextLine;
function interact() {
  if (mode !== 'playing' || !interactionTarget || !grounded) return;
  if (interactionTarget === 'sign') {
    openDialogue([{ speaker: 'Verso la valle', text: 'Il sentiero prosegue oltre le montagne. Questa prima tappa termina con l’incontro tra Goku e Bulma: le prossime zone non sono ancora disponibili.' }], () => {});
    return;
  }
  const target = interactionTarget;
  if (target === 'fish' && save.stage !== 'catch-fish') return;
  if (target === 'sphere' && save.stage === 'show-sphere' && world.bulma.root.position.distanceTo(player.position) > 6) {
    toast('Bulma sta arrivando lungo il sentiero. Aspettala vicino alla casa.'); return;
  }
  if (target === 'sphere' && save.stage !== 'show-sphere') {
    openDialogue([{ speaker: 'Goku', text: 'La Sfera a quattro stelle del nonno. La terrò sempre al sicuro.' }], () => {}); return;
  }
  if (target === 'bulma' && save.stage === 'show-sphere') {
    openDialogue([{ speaker: 'Bulma', text: 'Entriamo nella stanza. Voglio vedere da vicino la Sfera del nonno, quella sul comò.' }], () => {}); return;
  }
  const point = target === 'bulma' ? world.bulma.root.position : target === 'fish' ? FISHING : SPHERE;
  player.rotation.y = Math.atan2(point.x - player.position.x, point.z - player.position.z);
  if (save.stage === 'meet-bulma' && target === 'bulma') carLiftStart = simulationTime;
  openDialogue(conversations[save.stage], () => {
    const previous = save.stage; save.stage = advanceStage(save.stage, target);
    updateObjectives(); persist();
    if (previous === 'catch-fish') { carArrival = 0; carMoving = false; }
    if (previous !== 'complete' && save.stage === 'complete') toast('Prima tappa completata. Goku e Bulma sono pronti a partire!');
    else if (previous !== save.stage) toast('Obiettivo aggiornato. Progressi salvati.');
  });
}
element('interaction').onclick = interact;

addEventListener('keydown', event => {
  if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code) && mode === 'playing') event.preventDefault();
  if (event.repeat) return;
  if (event.code === 'Escape') {
    if (mode === 'playing') { persist(); switchMode('paused'); }
    else if (mode === 'paused') switchMode('playing');
    else if (mode === 'confirm') switchMode(confirmOrigin);
    return;
  }
  if (event.code === 'KeyE') {
    event.preventDefault();
    if (mode === 'dialogue') nextLine(); else interact();
    return;
  }
  if (mode !== 'playing') return;
  keys.add(event.code);
  if (event.code === 'Space' && grounded) { verticalVelocity = 7.7; grounded = false; }
});
addEventListener('keyup', event => keys.delete(event.code));
viewport.addEventListener('pointerdown', event => {
  if (mode === 'playing' && event.button === 0) {
    drag = true; viewport.setPointerCapture(event.pointerId); viewport.focus();
  }
});
viewport.addEventListener('pointerup', () => { drag = false; });
viewport.addEventListener('pointercancel', () => { drag = false; });
viewport.addEventListener('pointermove', event => {
  if (mode !== 'playing' || (!drag && document.pointerLockElement !== renderer?.domElement)) return;
  yaw = normalizeAngle(yaw - event.movementX * 0.005);
  pitch = THREE.MathUtils.clamp(pitch + event.movementY * 0.004, 0.12, 1.1);
});
viewport.addEventListener('dblclick', () => {
  if (mode === 'playing' && !document.pointerLockElement) renderer.domElement.requestPointerLock()?.catch(() => toast('Trascina il mouse per ruotare la telecamera.'));
});
viewport.addEventListener('contextmenu', event => event.preventDefault());
function suspend() {
  keys.clear(); drag = false;
  if (started) persist();
  if (mode === 'playing') switchMode('paused');
}
addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
addEventListener('pagehide', persist);
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement) drag = false; });
addEventListener('resize', () => {
  if (!gameReady) return;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);
});

const raycaster = new THREE.Raycaster();
const fadedMaterials = new Map<THREE.Mesh, { original: THREE.Material; faded: THREE.Material }>();
const fadedLastFrame = new Set<THREE.Mesh>();
function fadeCameraObstacles(hits: THREE.Intersection[], indoors = false) {
  const next = new Set<THREE.Mesh>();
  const groups = new Set(hits.map(hit => hit.object.userData.cameraFadeGroup as THREE.Group | undefined).filter((group): group is THREE.Group => !!group));
  if (indoors) groups.add(world.houseShell);
  for (const group of groups) {
    group.traverse(child => {
      if (!(child instanceof THREE.Mesh) || Array.isArray(child.material)) return;
      if (!fadedMaterials.has(child)) {
        const faded = child.material.clone(); faded.transparent = true; faded.opacity = 0.16; faded.depthWrite = false;
        fadedMaterials.set(child, { original: child.material, faded });
      }
      child.material = fadedMaterials.get(child)!.faded; next.add(child);
    });
  }
  for (const child of fadedLastFrame) if (!next.has(child)) child.material = fadedMaterials.get(child)!.original;
  fadedLastFrame.clear(); next.forEach(child => fadedLastFrame.add(child));
}
const lookAt = new THREE.Vector3(), desiredCamera = new THREE.Vector3(), rayDirection = new THREE.Vector3();
function updateCamera(dt: number, snap = false) {
  if (mode === 'menu' || (mode === 'confirm' && confirmOrigin === 'menu')) {
    fadeCameraObstacles([]);
    desiredCamera.set(29, 17, 37); lookAt.set(-5, 1.1, -1);
    camera.position.lerp(desiredCamera, snap ? 1 : 1 - Math.exp(-dt * 2)); camera.lookAt(lookAt); return;
  }
  lookAt.copy(player.position).add(new THREE.Vector3(0, 1.5, 0));
  const distance = 9.8;
  desiredCamera.set(Math.sin(yaw) * Math.cos(pitch) * distance, Math.sin(pitch) * distance, Math.cos(yaw) * Math.cos(pitch) * distance).add(lookAt);
  rayDirection.copy(desiredCamera).sub(lookAt).normalize();
  raycaster.set(lookAt, rayDirection); raycaster.far = distance;
  const hits = raycaster.intersectObjects(world.obstacles, false);
  const indoors = player.position.x > -18 && player.position.x < -12 && player.position.z > -16 && player.position.z < -9.8;
  fadeCameraObstacles(hits, indoors);
  const solid = hits.find(hit => !hit.object.userData.cameraFadeGroup);
  if (solid && solid.distance < distance) desiredCamera.copy(lookAt).addScaledVector(rayDirection, Math.max(0.15, solid.distance - 0.35));
  desiredCamera.y = Math.max(desiredCamera.y, ground(desiredCamera.x, desiredCamera.z) + 0.55);
  // Apply obstacle constraints immediately, smoothing only when moving outward.
  const blocked = !!solid && solid.distance < distance;
  camera.position.lerp(desiredCamera, snap || blocked ? 1 : 1 - Math.exp(-dt * 10)); camera.lookAt(lookAt);
}
function move(dt: number) {
  let x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  let z = Number(keys.has('KeyS')) - Number(keys.has('KeyW'));
  const length = Math.hypot(x, z); if (length) { x /= length; z /= length; }
  const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 7.8 : 4.5;
  const dx = (x * Math.cos(yaw) + z * Math.sin(yaw)) * speed * dt;
  const dz = (-x * Math.sin(yaw) + z * Math.cos(yaw)) * speed * dt;
  let nx = THREE.MathUtils.clamp(player.position.x + dx, -LIMIT, LIMIT);
  let nz = THREE.MathUtils.clamp(player.position.z + dz, -LIMIT, LIMIT);
  for (const collider of world.colliders) {
    const cx = nx - collider.x, cz = nz - collider.z, d = Math.hypot(cx, cz), radius = collider.radius + 0.34;
    if (d < radius) {
      if (d > 0.001) { nx = collider.x + cx / d * radius; nz = collider.z + cz / d * radius; }
      else { nx = collider.x + radius; nz = collider.z; }
    }
  }
  for (const wall of world.walls) {
    const cx = THREE.MathUtils.clamp(nx, wall.minX, wall.maxX), cz = THREE.MathUtils.clamp(nz, wall.minZ, wall.maxZ);
    const dx = nx - cx, dz = nz - cz, distance = Math.hypot(dx, dz), radius = 0.34;
    if (distance > 0.0001 && distance < radius) { nx = cx + dx / distance * radius; nz = cz + dz / distance * radius; }
    else if (distance <= 0.0001) {
      const edges = [nx - wall.minX, wall.maxX - nx, nz - wall.minZ, wall.maxZ - nz];
      const edge = edges.indexOf(Math.min(...edges));
      if (edge === 0) nx = wall.minX - radius; else if (edge === 1) nx = wall.maxX + radius;
      else if (edge === 2) nz = wall.minZ - radius; else nz = wall.maxZ + radius;
    }
  }
  player.position.x = THREE.MathUtils.clamp(nx, -LIMIT, LIMIT); player.position.z = THREE.MathUtils.clamp(nz, -LIMIT, LIMIT);
  if (length) {
    const facing = Math.atan2(dx, dz);
    player.rotation.y = normalizeAngle(player.rotation.y + normalizeAngle(facing - player.rotation.y) * Math.min(1, dt * 13));
  }
  const floor = ground(player.position.x, player.position.z);
  verticalVelocity -= 21 * dt; player.position.y += verticalVelocity * dt;
  if (player.position.y <= floor) { player.position.y = floor; verticalVelocity = 0; grounded = true; }
  else if (grounded) grounded = false;
  if (grounded) previousGround = { x: player.position.x, z: player.position.z };
  if (keys.has('ArrowLeft')) yaw = normalizeAngle(yaw + dt * 1.7);
  if (keys.has('ArrowRight')) yaw = normalizeAngle(yaw - dt * 1.7);
  if (keys.has('ArrowUp')) pitch = Math.max(0.12, pitch - dt);
  if (keys.has('ArrowDown')) pitch = Math.min(1.1, pitch + dt);
  return length ? speed / 6 : 0;
}
function updateInteraction() {
  interactionTarget = null;
  if (mode !== 'playing' || !grounded) { element('interaction').hidden = true; return; }
  const { x, z } = player.position;
  const indoors = x > -18 && x < -12 && z > -16 && z < -9.8;
  if (save.stage === 'catch-fish' && Math.hypot(x - FISHING.x, z - FISHING.z) < 3) interactionTarget = 'fish';
  else if (save.stage === 'show-sphere' && indoors && Math.hypot(x - SPHERE.x, z - SPHERE.z) < 2.6) interactionTarget = 'sphere';
  else if (world.bulma.root.visible && Math.hypot(x - world.bulma.root.position.x, z - world.bulma.root.position.z) < 3.2) interactionTarget = 'bulma';
  else if (world.sphere.visible && indoors && Math.hypot(x - SPHERE.x, z - SPHERE.z) < 2.6) interactionTarget = 'sphere';
  else if (Math.hypot(x - 25, z + 3) < 3) interactionTarget = 'sign';
  const button = element('interaction'); button.hidden = !interactionTarget;
  if (interactionTarget) button.querySelector('span')!.textContent = interactionTarget === 'bulma' ? 'Parla con Bulma' : interactionTarget === 'sphere' ? 'Osserva la Sfera' : interactionTarget === 'fish' ? 'Recupera il pesce gigante' : 'Leggi il cartello';
}
const projected = new THREE.Vector3();
function updateWaypoint() {
  if (save.stage === 'complete' || mode === 'menu') { element('waypoint').hidden = true; return; }
  const target = save.stage === 'show-sphere' || save.stage === 'catch-fish' ? OBJECTIVES[save.stage].target : world.bulma.root.position;
  world.marker.position.set(target.x, ground(target.x, target.z) + 4, target.z);
  projected.set(target.x, ground(target.x, target.z) + 4.8, target.z).project(camera);
  const visible = projected.z < 1 && Math.abs(projected.x) < 0.9 && Math.abs(projected.y) < 0.85;
  element('waypoint').hidden = !visible;
  if (visible) {
    element('waypoint').style.left = `${(projected.x * 0.5 + 0.5) * innerWidth}px`;
    element('waypoint').style.top = `${Math.max(180, (-projected.y * 0.5 + 0.5) * innerHeight)}px`;
  }
  element('waypoint-distance').textContent = `${Math.round(Math.hypot(player.position.x - target.x, player.position.z - target.z))} m`;
  element('compass-needle').style.transform = `rotate(${-yaw}rad)`;
}

updateMenu(); updateObjectives(); applyQuality(); switchMode('menu'); updateCamera(1, true);
let lastTime = performance.now(), accumulated = 0, simulationTime = 0, moving = 0, saveTime = 0;
if (gameReady) renderer.setAnimationLoop((now: number) => {
  const dt = Math.min((now - lastTime) / 1000, 0.1); lastTime = now;
  accumulated += dt;
  while (accumulated >= 1 / 60) {
    if (mode === 'playing') moving = move(1 / 60); else moving = 0;
    simulationTime += 1 / 60; accumulated -= 1 / 60;
  }
  world.goku.animate(simulationTime, moving, !grounded); world.update(simulationTime);
  const targetProgress = isHomeStage() ? 1 : 0;
  const nearRoad = Math.hypot(player.position.x - 8, player.position.z - 9) < 13;
  if (save.stage === 'meet-bulma' && nearRoad && carArrival < 1 && mode === 'playing') carMoving = true;
  if (carMoving && mode === 'playing') {
    carArrival = Math.min(1, carArrival + dt / 2.4);
    if (carArrival === 1) { carMoving = false; toast('Un’auto sul sentiero! Avvicinati e premi E.'); }
  }
  const carPoint = carRoute.getPoint(carArrival);
  world.car.position.set(carPoint.x, ground(carPoint.x, carPoint.z), carPoint.z);
  world.car.visible = save.stage !== 'catch-fish' && (carMoving || carArrival > 0);
  world.car.rotation.set(0, carArrival < 1 ? Math.atan2(carRoute.getTangent(carArrival).x, carRoute.getTangent(carArrival).z) : -0.5, 0);
  const liftTime = simulationTime - carLiftStart;
  const lifting = liftTime >= 0 && liftTime < 3.2;
  if (lifting) {
    const height = Math.sin(Math.min(1, liftTime / 3.2) * Math.PI);
    world.car.position.x = THREE.MathUtils.lerp(world.car.position.x, player.position.x, height);
    world.car.position.z = THREE.MathUtils.lerp(world.car.position.z, player.position.z, height);
    world.car.position.y += height * 2.4; world.car.rotation.z = height * 0.45;
  }
  const carrying = (save.stage === 'meet-bulma' || save.stage === 'show-sphere') && Math.hypot(player.position.x + 15, player.position.z + 13) > 7;
  world.carriedFish.visible = carrying && !lifting;
  world.fish.visible = save.stage === 'catch-fish' || (save.stage !== 'meet-bulma' && !carrying);
  if (save.stage !== 'catch-fish') {
    world.fish.position.set(-19.5, ground(-19.5, -7) + 0.6, -7);
    world.fish.rotation.z = Math.PI / 2;
  } else {
    world.fish.position.set(FISHING.x - 1, ground(FISHING.x, FISHING.z) + 0.35, FISHING.z - 1.4);
    world.fish.rotation.z = 0.5;
  }
  world.sphere.visible = save.stage !== 'complete';
  world.goku.root.userData.pose = lifting ? 'lift' : carrying ? 'carry' : '';
  world.bulma.root.visible = save.stage !== 'catch-fish' && carArrival >= 1;
  if (mode === 'playing' || mode === 'dialogue') {
    const oldProgress = bulmaProgress;
    bulmaProgress = THREE.MathUtils.clamp(bulmaProgress + Math.sign(targetProgress - bulmaProgress) * dt / 7, 0, 1);
    placeBulma();
    const walking = Math.abs(oldProgress - bulmaProgress) > 0.00001;
    world.bulma.animate(simulationTime, walking ? 0.7 : 0);
    if (walking) {
      const tangent = bulmaRoute.getTangent(bulmaProgress).multiplyScalar(targetProgress === 1 ? 1 : -1);
      world.bulma.root.rotation.y = Math.atan2(tangent.x, tangent.z);
    } else world.bulma.root.rotation.y = Math.atan2(player.position.x - world.bulma.root.position.x, player.position.z - world.bulma.root.position.z);
  }
  updateCamera(dt); updateInteraction(); updateWaypoint();
  if (mode === 'playing') { saveTime += dt; if (saveTime >= 5 && grounded) { persist(); saveTime = 0; } }
  renderer.render(scene, camera);
});
