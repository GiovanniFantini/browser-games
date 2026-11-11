import * as THREE from 'three';
import { MAPS, type MapKind } from './generator';
import {
  DEFAULT_SEED,
  loadTextureLibrary,
  clearTextureCache,
  materialFromBitmaps,
} from './library';
import './debug.css';

export async function showTextureDebug() {
  document.body.innerHTML = `<main class="texture-lab"><header><div><small>NIGHT CIRCUIT / MATERIAL LAB 01</small><h1>Superfici di Port Riders</h1><p>17 materiali originali. Superfici consumate, vetro, finestre e cielo notturno.</p></div><a href="?">Torna alla guida</a></header>
  <form><label>Seed <input id="texture-seed" type="number" value="${DEFAULT_SEED}" min="0" max="4294967295" required></label><label>Risoluzione <select id="texture-size"><option>512</option><option>256</option></select></label><button>Genera / carica</button><button type="button" id="texture-clear">Svuota cache texture</button></form>
  <p id="texture-status" role="status">Generazione in corso...</p>
  <section class="texture-preview"><canvas id="material-preview"></canvas><div><small>ANTEPRIMA PBR</small><h2 id="preview-name">Asfalto bagnato</h2><p>Luce ambra e azzurra su superficie curva e piano ripetuto. Trascina per ruotare.</p><label>Vista <select id="texture-view"><option value="all">Tutte le mappe</option>${MAPS.map((map) => `<option>${map}</option>`).join('')}</select></label><p>Fai clic su una mappa per ingrandirla a risoluzione nativa.</p></div></section>
  <section id="texture-grid"></section><dialog id="texture-detail"><button>Chiudi</button><p></p><img alt="Texture a risoluzione nativa"></dialog></main>`;
  const status = document.querySelector<HTMLElement>('#texture-status')!;
  const grid = document.querySelector<HTMLElement>('#texture-grid')!;
  const dialog = document.querySelector<HTMLDialogElement>('dialog')!;
  dialog.querySelector('button')!.onclick = () => dialog.close();
  const canvas =
    document.querySelector<HTMLCanvasElement>('#material-preview')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(700, 330, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1520');
  const camera = new THREE.PerspectiveCamera(38, 700 / 330, 0.1, 30);
  camera.position.set(3.8, 2.8, 5.8);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xbfe6ff, 0x283025, 2));
  for (const [color, x] of [
    [0xffc17b, -3],
    [0x46daff, 3],
  ]) {
    const light = new THREE.DirectionalLight(color, 3);
    light.position.set(x, 4, 2);
    scene.add(light);
  }
  const group = new THREE.Group();
  scene.add(group);
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 32),
    new THREE.MeshStandardMaterial(),
  );
  sphere.position.y = 0.2;
  group.add(sphere);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 4),
    new THREE.MeshStandardMaterial(),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.85;
  group.add(plane);
  const draw = () => renderer.render(scene, camera);
  let dragging = false,
    last = 0;
  canvas.onpointerdown = (event) => {
    dragging = true;
    last = event.clientX;
    canvas.setPointerCapture(event.pointerId);
  };
  canvas.onpointerup = canvas.onpointercancel = () => {
    dragging = false;
  };
  canvas.onpointermove = (event) => {
    if (dragging) {
      group.rotation.y += (event.clientX - last) * 0.01;
      last = event.clientX;
      draw();
    }
  };
  const urls: string[] = [],
    bitmaps: ImageBitmap[] = [];
  const disposeMaterial = (m: THREE.Material) => {
    const material = m as THREE.MeshStandardMaterial;
    for (const t of [
      material.map,
      material.roughnessMap,
      material.normalMap,
      material.emissiveMap,
    ])
      t?.dispose();
    material.dispose();
  };
  const view = document.querySelector<HTMLSelectElement>('#texture-view')!;
  view.onchange = () => {
    grid.dataset.view = view.value;
  };
  let busy = false;
  async function load() {
    if (busy) return;
    busy = true;
    const buttons = [
      ...document.querySelectorAll<HTMLButtonElement>('form button'),
    ];
    buttons.forEach((b) => (b.disabled = true));
    status.textContent = 'Generazione / lettura cache in corso...';
    try {
      const seed = Number(
        document.querySelector<HTMLInputElement>('#texture-seed')!.value,
      );
      const size = Number(
        document.querySelector<HTMLSelectElement>('#texture-size')!.value,
      );
      const library = await loadTextureLibrary(seed, size);
      urls.forEach(URL.revokeObjectURL);
      urls.length = 0;
      disposeMaterial(sphere.material);
      disposeMaterial(plane.material);
      bitmaps.forEach((b) => b.close());
      bitmaps.length = 0;
      grid.replaceChildren();
      for (const pack of library.packs) {
        const row = document.createElement('article');
        row.className = 'texture-row';
        row.dataset.id = pack.id;
        const heading = document.createElement('button');
        heading.className = 'texture-name';
        heading.textContent = pack.label;
        row.append(heading);
        let maps: Record<MapKind, ImageBitmap> | undefined;
        const preview = async () => {
          if (!maps) {
            const images = await Promise.all(
              MAPS.map((map) =>
                createImageBitmap(pack.maps[map], {
                  imageOrientation: 'flipY',
                }),
              ),
            );
            bitmaps.push(...images);
            maps = Object.fromEntries(
              MAPS.map((map, i) => [map, images[i]]),
            ) as Record<MapKind, ImageBitmap>;
          }
          disposeMaterial(sphere.material);
          disposeMaterial(plane.material);
          sphere.material = materialFromBitmaps(maps, 1, pack.id);
          plane.material = materialFromBitmaps(maps, 3, pack.id);
          document.querySelector('#preview-name')!.textContent = pack.label;
          draw();
        };
        heading.onclick = () => {
          void preview();
        };
        for (const map of MAPS) {
          const url = URL.createObjectURL(pack.maps[map]);
          urls.push(url);
          const card = document.createElement('button');
          card.className = 'texture-map';
          card.dataset.map = map;
          const img = document.createElement('img');
          img.src = url;
          img.alt = `${pack.id} / ${map}`;
          const caption = document.createElement('span');
          caption.textContent = `${map} / ${size} px`;
          card.append(img, caption);
          row.append(card);
          card.onclick = () => {
            dialog.querySelector('img')!.src = url;
            dialog.querySelector('p')!.textContent = `${pack.label} / ${map}`;
            dialog.showModal();
          };
        }
        grid.append(row);
        if (pack.id === 'asphalt') await preview();
      }
      status.textContent = `${library.packs.length} materiali / ${library.packs.length * 4} mappe / ${library.generated} generati / ${library.hits} dalla cache / ${(library.milliseconds / 1000).toFixed(2)} s / ${library.cache}`;
      status.dataset.ready = 'true';
      status.dataset.hits = String(library.hits);
      status.dataset.generated = String(library.generated);
    } catch (error) {
      status.textContent = `Errore: ${String(error)}`;
    } finally {
      busy = false;
      buttons.forEach((b) => (b.disabled = false));
    }
  }
  document.querySelector('form')!.onsubmit = (event) => {
    event.preventDefault();
    void load();
  };
  document.querySelector<HTMLButtonElement>('#texture-clear')!.onclick =
    async () => {
      try {
        await clearTextureCache();
        status.textContent =
          'Cache texture svuotata. Premi Genera / carica per rigenerare.';
      } catch (error) {
        status.textContent = String(error);
      }
    };
  await load();
}
