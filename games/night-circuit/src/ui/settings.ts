import {
  preferences as p,
  savePreferences,
  defaults,
  bindKey,
  bindPad,
  defaultKeys,
  graphicsQuality,
  setSessionQuality,
} from '../core/preferences';
import { setLanguage, t } from './translation';
const labels: Record<string, string> = {
  throttle: 'Accelera',
  brake: 'Freno / retro',
  left: 'Sterza sinistra',
  right: 'Sterza destra',
  handbrake: 'Freno a mano',
  nitro: 'Nitro',
  pause: 'Pausa',
  reset: 'Ripristina',
  camera: 'Visuale',
  mute: 'Audio',
  map: 'Mappa',
  races: 'Gare',
  garage: 'Garage',
  interact: 'Interagisci',
  'gear-up': 'Marcia su',
  'gear-down': 'Marcia giù',
  manual: 'Cambio manuale',
  challenge: 'Sfida',
  phone: 'Telefono',
  settings: 'Impostazioni',
};
export class SettingsUI {
  readonly panel = document.createElement('div');
  open = false;
  onOpen = () => {};
  onClose = () => {};
  onChange = () => {};
  private returnFocus: HTMLElement | null = null;
  private capture?: string;
  private padCapture?: string;
  private poll = 0;
  private previous = new Set<number>();
  constructor() {
    const button = document.createElement('button');
    button.id = 'open-settings';
    button.innerHTML = 'IMPOSTAZIONI <kbd>O</kbd>';
    button.onclick = () => this.onOpen();
    document.querySelector('.top-actions')!.prepend(button);
    const start = document.createElement('button');
    start.id = 'start-settings';
    start.className = 'start-quick';
    start.textContent = 'IMPOSTAZIONI / O';
    start.onclick = () => this.onOpen();
    document.querySelector('#start')!.after(start);
    this.panel.id = 'settings';
    this.panel.hidden = true;
    this.panel.className = 'settings-overlay';
    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-modal', 'true');
    this.panel.setAttribute('aria-label', 'Impostazioni');
    document.body.append(this.panel);
    this.panel.addEventListener(
      'keydown',
      (e) => {
        if (this.capture) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (e.code === 'Escape') {
            this.capture = undefined;
            this.render();
            return;
          }
          if (e.code === 'F3' || e.code.startsWith('Arrow')) return;
          const code = e.code;
          if (
            !/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Tab|Enter|Backspace|F[1-9]|F1[012])$/.test(
              code,
            )
          )
            return;
          bindKey(this.capture, code);
          this.capture = undefined;
          this.changed();
        } else if (e.key === 'Tab') {
          const els = [
              ...this.panel.querySelectorAll<HTMLElement>(
                'button,select,input',
              ),
            ],
            first = els[0],
            last = els.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      },
      true,
    );
  }
  get capturing() {
    return this.capture !== undefined || this.padCapture !== undefined;
  }
  show() {
    this.returnFocus = document.activeElement as HTMLElement;
    this.open = true;
    this.render();
    this.panel.hidden = false;
    this.panel.querySelector<HTMLElement>('button')!.focus();
    this.pollPad();
  }
  hide() {
    this.open = false;
    this.capture = this.padCapture = undefined;
    cancelAnimationFrame(this.poll);
    this.panel.hidden = true;
    this.returnFocus?.focus({ preventScroll: true });
  }
  private changed(key = '') {
    if (key === 'quality' || key === 'reset') setSessionQuality();
    savePreferences();
    setLanguage(p.language);
    this.onChange();
    this.render();
  }
  private pollPad = () => {
    if (!this.open) return;
    const pad = [...(navigator.getGamepads?.() ?? [])].find(
      (g) => g?.connected && g.mapping === 'standard',
    );
    if (pad) {
      for (let i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i].pressed) {
          if (this.padCapture && !this.previous.has(i)) {
            bindPad(this.padCapture, i);
            this.padCapture = undefined;
            this.changed();
          }
          this.previous.add(i);
        } else this.previous.delete(i);
      }
    }
    this.poll = requestAnimationFrame(this.pollPad);
  };
  private render() {
    const select = (
      key: string,
      label: string,
      values: [string, string][],
      current: string,
    ) =>
      `<label>${t(label)} <select data-setting="${key}">${values.map(([v, n]) => `<option value="${v}" ${v === current ? 'selected' : ''}>${t(n)}</option>`).join('')}</select></label>`;
    this.panel.innerHTML = `<section class="settings-card"><header><h2>${t('Impostazioni')}</h2><button id="close-settings">${t('TORNA ALLA GUIDA')}</button></header><div class="settings-grid">${select(
      'language',
      'Lingua',
      [
        ['it', 'Italiano'],
        ['en', 'English'],
      ],
      p.language,
    )}${select(
      'units',
      'Unità',
      [
        ['kmh', 'km/h'],
        ['mph', 'mph'],
      ],
      p.units,
    )}${select(
      'quality',
      'Grafica',
      [
        ['low', 'Bassa'],
        ['medium', 'Media'],
        ['high', 'Alta'],
      ],
      graphicsQuality(),
    )}${select(
      'station',
      'Radio',
      [
        ['0', 'Lumen Drive · 112 BPM'],
        ['1', 'Vector Pulse · 138 BPM'],
        ['2', 'Late Current · 86 BPM'],
        ['3', 'Radio spenta'],
      ],
      String(p.station),
    )}${select(
      'traffic',
      'Traffico',
      [
        ['0', 'Assente'],
        ['8', 'Leggero'],
        ['16', 'Medio'],
        ['32', 'Intenso'],
      ],
      String(p.traffic),
    )}${(['master', 'engine', 'music', 'effects'] as const).map((k, i) => `<label>${t(['Volume generale', 'Motore', 'Musica', 'Effetti'][i])} <input aria-label="${t(['Volume generale', 'Motore', 'Musica', 'Effetti'][i])}" type="range" min="0" max="1" step="0.05" data-setting="${k}" value="${p[k]}"></label>`).join('')}${(['rain', 'bloom', 'assist'] as const).map((k, i) => `<label><input type="checkbox" data-setting="${k}" ${p[k] ? 'checked' : ''}>${t(['Pioggia', 'Bloom (media/alta)', 'Controsterzo assistito'][i])}</label>`).join('')}</div><h3>${t('Controlli tastiera')}</h3><p>${t('Seleziona un comando e premi il nuovo tasto. I duplicati si scambiano. Escape annulla. Frecce e F3 restano riservati.')}</p><div class="bindings">${Object.keys(
      defaultKeys,
    )
      .map(
        (a) =>
          `<button data-bind="${a}">${t(labels[a])}: ${this.capture === a ? t('Premi un tasto…') : p.keys[a]}</button>`,
      )
      .join(
        '',
      )}</div><h3>${t('Controlli gamepad')}</h3><p>${t('Gamepad standard: seleziona un comando, poi premi un pulsante. Le impostazioni funzionano anche senza un controller collegato.')}</p><div class="bindings">${Object.keys(
      p.pad,
    )
      .map(
        (a) =>
          `<label>${t(labels[a])} <select data-pad="${a}">${Array.from({ length: 17 }, (_, n) => `<option value="${n}" ${p.pad[a] === n ? 'selected' : ''}>${n}</option>`).join('')}</select><button data-pad-capture="${a}">${this.padCapture === a ? t('Premi un pulsante…') : t('Assegna')}</button></label>`,
      )
      .join('')}</div>${select(
      'steerAxis',
      'Asse sterzo',
      [
        ['0', '0'],
        ['1', '1'],
        ['2', '2'],
        ['3', '3'],
      ],
      String(p.steerAxis),
    )}<label><input type="checkbox" data-setting="invertSteer" ${p.invertSteer ? 'checked' : ''}>${t('Inverti sterzo')}</label><p id="settings-status" role="status">${t('Impostazioni locali salvate automaticamente.')}</p><button id="restore-settings">${t('RIPRISTINA IMPOSTAZIONI')}</button><details><summary>${t('Crediti e licenze')}</summary><p>${t('Codice, veicoli, marchi, ambienti, musica e suoni originali generati proceduralmente per NIGHT CIRCUIT. Circuit Grid: font originale generato nel progetto. Three.js: MIT. Rapier: Apache-2.0. Licenze complete nei file distribuiti e in CREDITS.md.')}</p></details></section>`;
    this.panel.querySelector<HTMLButtonElement>('#close-settings')!.onclick =
      () => this.onClose();
    this.panel.querySelector<HTMLButtonElement>('#restore-settings')!.onclick =
      () => {
        Object.assign(p, defaults());
        this.changed('reset');
      };
    for (const el of this.panel.querySelectorAll<
      HTMLInputElement | HTMLSelectElement
    >('[data-setting]'))
      el.onchange = () => {
        const key = el.dataset.setting as keyof typeof p,
          value =
            el instanceof HTMLInputElement && el.type === 'checkbox'
              ? el.checked
              : [
                    'station',
                    'traffic',
                    'steerAxis',
                    'master',
                    'engine',
                    'music',
                    'effects',
                  ].includes(key)
                ? Number(el.value)
                : el.value;
        Object.assign(p, { [key]: value });
        this.changed(key);
      };
    for (const el of this.panel.querySelectorAll<HTMLButtonElement>(
      '[data-bind]',
    ))
      el.onclick = () => {
        this.capture = el.dataset.bind;
        this.render();
        this.panel
          .querySelector<HTMLElement>(`[data-bind="${this.capture}"]`)!
          .focus();
      };
    for (const el of this.panel.querySelectorAll<HTMLSelectElement>(
      '[data-pad]',
    ))
      el.onchange = () => {
        bindPad(el.dataset.pad!, Number(el.value));
        this.changed();
      };
    for (const el of this.panel.querySelectorAll<HTMLButtonElement>(
      '[data-pad-capture]',
    ))
      el.onclick = () => {
        this.padCapture = el.dataset.padCapture;
        this.render();
      };
    if (!savePreferences())
      this.panel.querySelector('#settings-status')!.textContent = t(
        'Memoria locale non disponibile. Impostazioni attive solo in questa sessione.',
      );
  }
}
