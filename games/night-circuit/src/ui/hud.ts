import { preferences } from '../core/preferences';
import config from '../data/prototype.json';
import type { Appearance } from '../tuning/appearance';
import type { Vehicle } from '../vehicle/vehicle';

function dial(id: string, label: string) {
  const ticks = Array.from({ length: 21 }, (_, i) => {
    const a = ((-120 + i * 12) * Math.PI) / 180,
      inner = i % 5 === 0 ? 40 : 44;
    return `<line x1="${60 + Math.sin(a) * inner}" y1="${61 - Math.cos(a) * inner}" x2="${60 + Math.sin(a) * 49}" y2="${61 - Math.cos(a) * 49}"/>`;
  }).join('');
  const labels = Array.from({ length: 5 }, (_, i) => {
    const a = ((-120 + i * 60) * Math.PI) / 180;
    return `<text data-dial-label="${i}" x="${60 + Math.sin(a) * 31}" y="${64 - Math.cos(a) * 31}">0</text>`;
  }).join('');
  return `<svg id="${id}" viewBox="0 0 120 120" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0"><circle class="dial-face" cx="60" cy="61" r="53"/><path class="dial-arc" d="M16.7 86 A50 50 0 1 1 103.3 86"/><g class="dial-ticks">${ticks}</g>${id === 'rpm-dial' ? '<path class="dial-redline" d="M109.2 69.7 A50 50 0 0 1 103.3 86"/>' : ''}${labels}<path class="dial-needle" d="M59 66 L60 23 L61 66 Z" transform="rotate(-120 60 61)"/><circle class="dial-hub" cx="60" cy="61" r="3"/><text class="dial-unit" x="60" y="94">${id === 'speed-dial' ? 'KM/H' : 'RPM ×1000'}</text></svg>`;
}
export class Hud {
  private readonly root = document.querySelector<HTMLDivElement>('#interface')!;
  readonly overlay: HTMLElement;
  readonly start: HTMLButtonElement;
  readonly quality: HTMLSelectElement;
  readonly assist: HTMLInputElement;
  private readonly speed: HTMLElement;
  private readonly gear: HTMLElement;
  private readonly rpm: HTMLElement;
  private readonly nitro: HTMLElement;
  private readonly status: HTMLElement;
  private readonly debug: HTMLElement;
  private readonly sound: HTMLButtonElement;
  private readonly camera: HTMLElement;
  private readonly device: HTMLElement;
  private readonly message: HTMLElement;
  private readonly speedDial: SVGElement;
  private readonly rpmDial: SVGElement;
  private readonly speedNeedle: SVGElement;
  private readonly rpmNeedle: SVGElement;
  private readonly speedLabels: NodeListOf<SVGTextElement>;
  private readonly rpmLabels: NodeListOf<SVGTextElement>;
  private readonly dialUnit: SVGTextElement;
  private lastDialScale = '';
  private lastBarScale = '';
  private elapsed = 0;
  private messageUntil = 0;
  showDebug = false;

  applyAppearance(a: Appearance) {
    this.rpm.style.background = a.hudColor;
    this.root.style.setProperty('--dial-color', a.hudColor);
    this.nitro.style.background = a.nitroColor;
    this.root.querySelector<HTMLElement>('.speed-number')!.style.color =
      a.hudColor;
  }
  constructor(onPause: () => void, onSound: () => void, onReset: () => void) {
    this.root.innerHTML = `
      <header class="topbar"><div class="wordmark">N<span>/</span>C <i></i> <small>NIGHT CIRCUIT</small></div>
        <div class="location"><span class="live-dot"></span> PORT RIDERS <span class="separator">/</span> BACINO 09</div>
        <div class="top-actions"><button id="sound" aria-label="Disattiva audio">AUDIO ON</button><button id="pause" aria-label="Metti in pausa">PAUSA <kbd>ESC</kbd></button></div>
      </header>
      <aside class="session"><span class="eyebrow">SESSIONE 001</span><h2>La notte è tua.</h2><p>Guida libera · Pista di prova</p><div class="session-rule"></div><span class="session-label">${config.car.maker.toUpperCase()} / ${config.car.name.toUpperCase()}</span></aside>
      <div id="message" class="toast" role="status" aria-live="polite"></div>
      <footer class="driving-hud"><div class="telemetry"><span class="eyebrow">CONTROLLO VEICOLO</span><div id="status">IN ATTESA</div><p><span id="device">TASTIERA</span> <span class="separator">/</span> <span id="camera">VICINA</span></p><button id="reset">RIPOSIZIONA <kbd>R</kbd></button></div>
        <div class="speed-cluster"><div class="analog-dials">${dial('rpm-dial', 'Contagiri')}${dial('speed-dial', 'Tachimetro')}</div><div class="rpm-scale"><span>0</span><span>2</span><span>4</span><span>6</span><span class="redline">8</span></div><div class="rpm-track"><div id="rpm-bar"></div></div><div class="speed-row"><div class="gear-box"><small>MARCIA</small><span id="gear">1</span><small>AUTO</small></div><div class="speed-number"><span id="speed">000</span><small>KM/H</small></div></div><div class="nitro-row"><span>NITRO</span><div class="nitro-track"><div id="nitro-bar"></div></div><kbd>SHIFT</kbd></div></div>
      </footer>
      <div class="bottom-hint"><span><kbd>W A S D</kbd> GUIDA</span><span><kbd>SPAZIO</kbd> DERAPATA</span><span><kbd>C</kbd> VISUALE</span><span><kbd>M</kbd> AUDIO</span></div>
      <pre id="debug" hidden></pre>
      <div id="overlay" class="overlay"><section class="start-card" aria-labelledby="screen-title"><span class="eyebrow">PORT RIDERS / DOPO IL TRAMONTO</span><h1 id="screen-title">NIGHT<br><span>CIRCUIT</span><sup>01</sup></h1><div class="subtitle">NEON STREETS</div><p id="intro">L’asfalto si accende. Il resto può aspettare.<br>Prendi il volante e trova il tuo ritmo.</p><div class="start-details"><span>01 AUTO ORIGINALE</span><span>01 PISTA NOTTURNA</span><span>GUIDA LIBERA</span></div><div class="options"><label>Grafica <select id="quality"><option value="medium">Media</option><option value="low">Bassa</option><option value="high">Alta</option></select></label><label class="check"><input type="checkbox" id="assist" checked> Controsterzo assistito</label></div><button class="primary" id="start" disabled>PREPARAZIONE PISTA…</button><p class="controls">W / ↑ accelera · S / ↓ frena e retro · A D / ← → sterza<br>Spazio freno a mano · Shift nitro · C visuale · R ripristina<br>Gamepad: RT / LT guida · levetta sterza · A freno a mano · B nitro<br>X visuale · Y ripristina · Start pausa · View audio</p><div class="build-label">PROTOTIPO GUIDABILE <span>FASE 1 / 8</span></div></section></div>
      <div class="boost-vignette"></div>`;
    const get = <T extends HTMLElement>(selector: string) =>
      this.root.querySelector<T>(selector)!;
    this.overlay = get('#overlay');
    this.start = get('#start');
    this.quality = get('#quality');
    this.assist = get('#assist');
    this.speed = get('#speed');
    this.gear = get('#gear');
    this.rpm = get('#rpm-bar');
    this.speedDial = this.root.querySelector<SVGElement>('#speed-dial')!;
    this.rpmDial = this.root.querySelector<SVGElement>('#rpm-dial')!;
    this.speedNeedle =
      this.speedDial.querySelector<SVGElement>('.dial-needle')!;
    this.rpmNeedle = this.rpmDial.querySelector<SVGElement>('.dial-needle')!;
    this.speedLabels =
      this.speedDial.querySelectorAll<SVGTextElement>('[data-dial-label]');
    this.rpmLabels =
      this.rpmDial.querySelectorAll<SVGTextElement>('[data-dial-label]');
    this.dialUnit = this.speedDial.querySelector<SVGTextElement>('.dial-unit')!;
    this.nitro = get('#nitro-bar');
    this.status = get('#status');
    this.debug = get('#debug');
    this.sound = get('#sound');
    this.camera = get('#camera');
    this.device = get('#device');
    this.message = get('#message');
    get('#pause').onclick = onPause;
    this.sound.onclick = onSound;
    get('#reset').onclick = onReset;
  }
  ready() {
    this.start.disabled = false;
    this.start.textContent = 'ENTRA IN PISTA ↗';
  }
  cityMode(traffic: number, changeTraffic: (count: number) => void) {
    this.root.classList.add('city-mode');
    this.root.querySelector('.location')!.innerHTML =
      '<span class="live-dot"></span> PORT RIDERS <span class="separator">/</span> OLD DOCKS';
    this.root.querySelector('.session p')!.textContent =
      'Guida libera · Old Docks';
    this.root.querySelector('.start-details')!.innerHTML =
      '<span>04 QUARTIERI COLLEGATI</span><span>51 AUTO ORIGINALI</span><span>GPS + TRAFFICO</span>';
    this.root.querySelector('.build-label')!.innerHTML =
      'CITTÀ NOTTURNA <span>FASE 8 / 8</span>';
    this.root
      .querySelector('.bottom-hint')!
      .insertAdjacentHTML('beforeend', '<span><kbd>G</kbd> MAPPA + GPS</span>');
    const label = document.createElement('label');
    label.className = 'traffic-option';
    label.innerHTML = `Traffico <select id="traffic-density" aria-label="Densità traffico"><option value="0">Assente</option><option value="8">Leggero</option><option value="16">Medio</option><option value="32">Intenso</option></select>`;
    this.root.querySelector('.options')!.append(label);
    label.querySelector('select')!.value = String(traffic);
    label.querySelector('select')!.onchange = (event) =>
      changeTraffic(Number((event.target as HTMLSelectElement).value));
  }
  error(text: string) {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>(
      '#quick-races,#start-quick-race',
    ))
      button.disabled = true;
    this.overlay.hidden = false;
    this.root.querySelector('#screen-title')!.textContent = 'AVVIO INTERROTTO';
    this.root.querySelector('#intro')!.textContent = text;
    this.start.disabled = false;
    this.start.textContent = 'RIPROVA';
    this.start.onclick = () => location.reload();
    this.start.focus();
  }
  pause(paused: boolean) {
    this.overlay.hidden = !paused;
    if (paused) {
      this.start.textContent = 'RIPRENDI LA GUIDA ↗';
      this.start.focus();
    }
  }
  soundLabel(muted: boolean) {
    this.sound.textContent = muted ? 'AUDIO OFF' : 'AUDIO ON';
    this.sound.setAttribute(
      'aria-label',
      muted ? 'Attiva audio' : 'Disattiva audio',
    );
  }
  toast(message: string) {
    this.message.textContent = message;
    this.messageUntil = performance.now() + 2600;
  }
  update(
    car: Vehicle,
    dt: number,
    device: string,
    camera: string,
    fps: number,
    calls: number,
    triangles: number,
  ) {
    this.elapsed += dt;
    this.root.classList.toggle('boosting', car.power.boosting);
    if (this.elapsed < 0.065) return;
    this.elapsed = 0;
    const speed =
        Math.hypot(car.speed, car.slip) *
        (preferences.units === 'mph' ? 2.236936 : 3.6),
      maximum = Math.max(
        50,
        Math.ceil(
          (car.stats.maxSpeed *
            (preferences.units === 'mph' ? 2.236936 : 3.6)) /
            50,
        ) * 50,
      ),
      scaleKey = `${preferences.units}/${preferences.language}/${maximum}/${car.stats.rpmLimit}`;
    if (scaleKey !== this.lastDialScale) {
      this.lastDialScale = scaleKey;
      this.dialUnit.textContent = preferences.units === 'mph' ? 'MPH' : 'KM/H';
      this.speedDial.setAttribute('aria-valuemax', String(maximum));
      this.rpmDial.setAttribute('aria-valuemax', String(car.stats.rpmLimit));
      this.speedLabels.forEach((label, i) => {
        label.textContent = String(Math.round((maximum * i) / 4));
      });
      this.rpmLabels.forEach((label, i) => {
        label.textContent = String(Math.round((car.stats.rpmLimit * i) / 4000));
      });
    }
    this.speedNeedle.setAttribute(
      'transform',
      `rotate(${-120 + Math.min(1, speed / maximum) * 240} 60 61)`,
    );
    this.rpmNeedle.setAttribute(
      'transform',
      `rotate(${-120 + Math.min(1, Math.max(0, car.power.rpm / car.stats.rpmLimit)) * 240} 60 61)`,
    );
    this.speedDial.setAttribute('aria-valuenow', String(Math.round(speed)));
    this.rpmDial.setAttribute(
      'aria-valuenow',
      String(Math.round(car.power.rpm)),
    );
    this.speed.textContent = String(
      Math.round(
        Math.hypot(car.speed, car.slip) *
          (preferences.units === 'mph' ? 2.236936 : 3.6),
      ),
    ).padStart(3, '0');
    this.root.querySelector('.speed-number small')!.textContent =
      preferences.units === 'mph' ? 'MPH' : 'KM/H';
    const transmission =
      this.gear.parentElement?.querySelector('small:last-child');
    if (transmission)
      transmission.textContent = car.power.manual ? 'MANUALE' : 'AUTO';
    this.gear.textContent = car.power.gear < 0 ? 'R' : String(car.power.gear);
    this.rpm.style.transform = `scaleX(${Math.min(1, Math.max(0, car.power.rpm / car.stats.rpmLimit))})`;
    const barScale = `${car.stats.rpmLimit}/${preferences.language}`;
    if (this.lastBarScale !== barScale) {
      this.lastBarScale = barScale;
      this.root.querySelectorAll('.rpm-scale span').forEach((label, i) => {
        label.textContent = ((car.stats.rpmLimit * i) / 4000)
          .toFixed(1)
          .replace('.', preferences.language === 'it' ? ',' : '.');
      });
    }
    this.nitro.style.transform = `scaleX(${car.power.nitro})`;
    this.status.textContent = car.power.boosting
      ? 'NITRO ATTIVO'
      : Math.abs(car.slip) > 3
        ? 'DERAPATA'
        : Math.abs(car.speed) < 0.8
          ? 'PRONTO A PARTIRE'
          : car.power.gear < 0
            ? 'RETROMARCIA'
            : 'ADERENZA';
    this.device.textContent = device;
    this.camera.textContent = camera;
    this.message.classList.toggle(
      'visible',
      performance.now() < this.messageUntil,
    );
    this.debug.hidden = !this.showDebug;
    if (this.showDebug)
      this.debug.textContent = `F3 / TELEMETRIA\n${Math.round(fps)} fps · ${calls} draw call\n${triangles.toLocaleString(preferences.language === 'en' ? 'en-GB' : 'it-IT')} triangoli\nFisica 60 Hz / ${car.grounded}/4 ruote a terra\nv ${car.speed.toFixed(1)} m/s · slip ${car.slip.toFixed(1)}\nrpm ${Math.round(car.power.rpm)} · sterzo ${car.steering.toFixed(2)}\npos ${car.position.x.toFixed(1)}, ${car.position.y.toFixed(1)}, ${car.position.z.toFixed(1)}\nR ripristina · ESC pausa`;
  }
}
