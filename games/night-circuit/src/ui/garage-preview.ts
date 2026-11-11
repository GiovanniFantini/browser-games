import { createWorkshopStage } from './workshop-stage';
import { t } from './translation';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCar, type StudioPose } from '../vehicle/model';
import { visualCatalog, type Appearance } from '../tuning/appearance';
import { createWorkshopReflection } from './workshop-reflection';

export class GaragePreview {
  private readonly renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  private readonly controls: OrbitControls;
  private frame = 0;
  private last = 0;
  private readonly observer: ResizeObserver;
  private running = false;
  private car = createCar();
  private appearanceKey = '';
  private pose: StudioPose = { doors: false, hood: false, hatch: false };
  private jumpAt = -100;
  private readonly photoRoot = document.createElement('div');
  private photoHost: HTMLElement;
  private filter = 'none';
  isPhoto = false;
  constructor(private readonly host: HTMLElement) {
    const renderer = this.renderer;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute(
      'aria-label',
      'Auto 3D: trascina per ruotare, usa la rotella per lo zoom',
    );
    host.append(renderer.domElement);
    this.camera.position.set(4.1, 1.55, 4.8);
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.target.set(0, 0.75, 0);
    this.controls.enablePan = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.car.root.position.y = 0.62;
    this.positionWheels();
    this.scene.background = new THREE.Color(0x101c29);
    this.scene.environment = createWorkshopReflection(renderer).texture;
    this.scene.environmentIntensity = 0.45;
    this.scene.add(
      this.car.root,
      new THREE.HemisphereLight(0xb3d1d4, 0x3f4153, 0.2),
    );
    this.photoRoot.id = 'photo-studio';
    this.photoRoot.hidden = true;
    this.photoRoot.setAttribute('role', 'dialog');
    this.photoRoot.setAttribute('aria-modal', 'true');
    this.photoRoot.setAttribute('aria-label', 'Studio fotografico');
    this.photoRoot.innerHTML = `<div id="photo-host"></div><div class="photo-toolbar"><span>STUDIO / PNG 1600 × 900</span><label>Filtro <select id="photo-filter">${visualCatalog.filters.map((f) => `<option value="${f.id}">${f.name}</option>`).join('')}</select></label><button id="photo-export">ESPORTA PNG</button><button id="photo-close">TORNA AL GARAGE / ESC</button><span id="photo-status" role="status"></span></div>`;
    document.body.append(this.photoRoot);
    this.photoHost = this.photoRoot.querySelector('#photo-host')!;
    this.photoRoot.querySelector<HTMLSelectElement>('#photo-filter')!.onchange =
      (event) => {
        this.filter = visualCatalog.filters.find(
          (f) => f.id === (event.target as HTMLSelectElement).value,
        )!.css;
        this.renderer.domElement.style.filter = this.filter;
      };
    this.photoRoot.querySelector<HTMLButtonElement>('#photo-close')!.onclick =
      () => this.closePhoto();
    this.photoRoot.querySelector<HTMLButtonElement>('#photo-export')!.onclick =
      () => {
        void this.exportPhoto();
      };
    this.photoRoot.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = [
          ...this.photoRoot.querySelectorAll<HTMLElement>('button,select'),
        ],
        first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    const light = new THREE.SpotLight(0xffdfb2, 110, 18, 0.65, 0.8, 1.6);
    light.position.set(-3.5, 2.8, 5.2);
    light.target.position.set(0, 0.6, 0);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 20;
    light.shadow.normalBias = 0.01;
    light.shadow.bias = -0.0001;
    this.scene.add(light, light.target);
    const rim = new THREE.DirectionalLight(0x71cfe9, 0.7);
    rim.position.set(4, 2.5, -3);
    this.scene.add(rim);
    createWorkshopStage(this.scene);
    this.configureCar();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.receiveShadow = true;
        if (object.position.y > 2.5) object.castShadow = false;
      }
    });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.observer.observe(this.photoHost);
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.stop();
      host.setAttribute(
        'data-error',
        'Anteprima non disponibile. Puoi continuare a configurare l’auto.',
      );
    });
  }
  setAppearance(appearance: Appearance, model = 'silex-c1') {
    const key = model + JSON.stringify(appearance);
    if (key === this.appearanceKey) return;
    this.appearanceKey = key;
    const old = this.car;
    this.car = createCar({ appearance, model });
    this.configureCar();
    this.scene.remove(old.root);
    old.dispose();
    this.scene.add(this.car.root);
    this.positionWheels();
  }
  private configureCar() {
    this.car.root.traverse((o) => {
      if (o instanceof THREE.SpotLight) o.intensity = 0;
      if (o instanceof THREE.Mesh)
        for (const material of Array.isArray(o.material)
          ? o.material
          : [o.material]) {
          if (
            material instanceof THREE.MeshPhysicalMaterial &&
            material.name === 'vehicle-glass'
          ) {
            material.envMap = this.scene.environment;
            material.envMapIntensity = 1.2;
            material.clearcoat = 0.6;
            material.clearcoatRoughness = 0.025;
            material.roughness = 0.05;
            material.needsUpdate = true;
          }
        }
    });
  }
  private positionWheels() {
    this.car.root.position.y = 0.62;
    this.car.wheels.forEach((wheel, i) =>
      wheel.position.set(
        ((i % 2 ? 1 : -1) * this.car.spec.track) / 2,
        -0.28,
        ((i < 2 ? 1 : -1) * this.car.spec.wheelbase) / 2,
      ),
    );
  }
  setPose(key: keyof StudioPose, value: boolean) {
    this.pose[key] = value;
  }
  resetPose() {
    this.pose = { doors: false, hood: false, hatch: false };
  }
  jump() {
    this.jumpAt = performance.now() / 1000;
  }
  view(index: number) {
    const views = [
      [4.1, 1.55, 4.8],
      [-4.1, 1.9, -4.8],
      [6, 1.65, 0],
      [0, 7, 0.1],
      [-6, 1.65, 0],
    ];
    this.camera.position.fromArray(views[index]);
    this.controls.target.set(0, 0.75, 0);
    this.controls.update();
  }
  photo() {
    this.isPhoto = true;
    this.photoRoot.hidden = false;
    this.photoHost.append(this.renderer.domElement);
    this.renderer.domElement.style.filter = this.filter;
    this.resize();
    this.photoRoot.querySelector<HTMLSelectElement>('#photo-filter')!.focus();
  }
  closePhoto() {
    if (!this.isPhoto) return;
    this.isPhoto = false;
    this.photoRoot.hidden = true;
    this.host.append(this.renderer.domElement);
    this.renderer.domElement.style.filter = 'none';
    this.resize();
    document.querySelector<HTMLButtonElement>('#studio-photo')?.focus();
  }
  async exportCover(title: string, edition: string) {
    return this.exportPhoto({ title, edition });
  }
  private async exportPhoto(cover?: { title: string; edition: string }) {
    const status = this.photoRoot.querySelector<HTMLElement>('#photo-status')!;
    try {
      const ratio = this.renderer.getPixelRatio();
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 900;
      try {
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(1600, 900, false);
        this.camera.aspect = 16 / 9;
        this.camera.updateProjectionMatrix();
        this.car.animate(performance.now() / 1000, 0, false, this.pose);
        this.renderer.render(this.scene, this.camera);
        const ctx = canvas.getContext('2d')!;
        ctx.filter = this.filter;
        ctx.drawImage(this.renderer.domElement, 0, 0);
        if (cover) {
          ctx.filter = 'none';
          const gradient = ctx.createLinearGradient(0, 0, 0, 900);
          gradient.addColorStop(0, '#07111ac9');
          gradient.addColorStop(0.4, '#07111a00');
          gradient.addColorStop(1, '#07111ad9');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1600, 900);
          ctx.fillStyle = '#d3ec7b';
          ctx.font = '700 96px "Circuit Grid"';
          ctx.fillText(cover.title.toUpperCase(), 65, 125, 1470);
          ctx.fillStyle = '#eaf4f7';
          ctx.font = '600 32px "Circuit Grid"';
          ctx.fillText(cover.edition, 70, 180);
          ctx.font = '700 60px "Circuit Grid"';
          ctx.fillText(t('LA TUA FIRMA. LA TUA NOTTE.'), 70, 810);
          ctx.font = '400 27px "Circuit Grid"';
          ctx.fillText(t('PORT RIDERS / SERVIZIO ORIGINALE'), 70, 856);
        }
      } finally {
        this.renderer.setPixelRatio(ratio);
        this.resize();
      }
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(Error('Immagine non disponibile.'))),
          'image/png',
        ),
      );
      const url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = cover
        ? 'night-circuit-copertina.png'
        : 'night-circuit-studio.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = 'Foto esportata.';
      return true;
    } catch {
      status.textContent = 'Esportazione non riuscita. Riprova.';
      return false;
    }
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.resize();
    this.last = 0;
    this.frame = requestAnimationFrame(this.draw);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }
  private resize() {
    const { clientWidth: width, clientHeight: height } = this.isPhoto
      ? this.photoHost
      : this.host;
    if (!width || !height) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  private draw = (now: number) => {
    if (!this.running) return;
    if (now - this.last > 50 && !document.hidden) {
      this.last = now;
      const time = now / 1000,
        age = time - this.jumpAt;
      this.car.root.position.y =
        0.62 +
        (age < 2 ? Math.abs(Math.sin(age * 6)) * Math.exp(-age * 2) * 0.65 : 0);
      this.car.animate(time, 0, false, this.pose);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
    this.frame = requestAnimationFrame(this.draw);
  };
}
