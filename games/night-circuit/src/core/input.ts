import { preferences } from './preferences';
export interface DriveInput {
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  nitro: boolean;
}

export class Input {
  readonly state: DriveInput = {
    throttle: 0,
    brake: 0,
    steer: 0,
    handbrake: false,
    nitro: false,
  };
  private readonly keys = new Set<string>();
  private readonly previousButtons = new Set<number>();
  private readonly controlled = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Space',
    'F3',
  ]);
  private padBindingSource = preferences.pad;
  private padActions = Object.entries(preferences.pad);
  device = 'TASTIERA';
  enabled = false;
  suppressPadActions = false;

  constructor(private readonly action: (action: string) => void) {
    window.addEventListener('keydown', (event) => {
      const requested =
        event.code === 'F3'
          ? 'debug'
          : Object.keys(preferences.keys).find(
              (a) => preferences.keys[a] === event.code,
            );
      const modalKey = [
        'pause',
        'garage',
        'map',
        'phone',
        'settings',
        'debug',
      ].includes(requested ?? '');
      if (
        !modalKey &&
        ((event.target instanceof HTMLSelectElement &&
          event.code !== preferences.keys.pause &&
          event.code !== preferences.keys.map) ||
          (event.target instanceof HTMLInputElement &&
            event.target.type !== 'checkbox'))
      )
        return;
      if (
        event.code === 'F3' ||
        (this.enabled &&
          (this.controlled.has(event.code) ||
            Object.values(preferences.keys).includes(event.code)))
      )
        event.preventDefault();
      this.keys.add(event.code);
      if (!event.repeat) {
        const name = Object.keys(preferences.keys).find(
          (a) => preferences.keys[a] === event.code,
        );
        if (event.code === 'F3') this.action('debug');
        else if (
          name &&
          ![
            'throttle',
            'brake',
            'left',
            'right',
            'handbrake',
            'nitro',
          ].includes(name)
        )
          this.action(name);
      }
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    window.addEventListener('blur', () => this.clear());
  }

  clear() {
    this.keys.clear();
    this.state.throttle = this.state.brake = this.state.steer = 0;
    this.state.handbrake = this.state.nitro = false;
  }

  private down(a: string, b = a) {
    return this.keys.has(a) || this.keys.has(b);
  }

  sample() {
    const s = this.state;
    s.throttle = s.brake = s.steer = 0;
    s.handbrake = s.nitro = false;
    if (this.enabled) {
      s.throttle = Number(this.down(preferences.keys.throttle, 'ArrowUp'));
      s.brake = Number(this.down(preferences.keys.brake, 'ArrowDown'));
      s.steer =
        Number(this.down(preferences.keys.left, 'ArrowLeft')) -
        Number(this.down(preferences.keys.right, 'ArrowRight'));
      s.handbrake = this.down(preferences.keys.handbrake);
      s.nitro = this.down(
        preferences.keys.nitro,
        preferences.keys.nitro === 'ShiftLeft'
          ? 'ShiftRight'
          : preferences.keys.nitro,
      );
    }
    if (this.keys.size) this.device = 'TASTIERA';
    const pads = navigator.getGamepads?.();
    let pad: Gamepad | null = null;
    if (pads)
      for (let i = 0; i < pads.length; i++) {
        const candidate = pads[i];
        if (candidate?.connected && candidate.mapping === 'standard') {
          pad = candidate;
          break;
        }
      }
    if (!pad) {
      this.previousButtons.clear();
      return s;
    }
    if (this.padBindingSource !== preferences.pad) {
      this.padBindingSource = preferences.pad;
      this.padActions = Object.entries(preferences.pad);
    }
    for (const [action, index] of this.padActions) {
      const pressed = (pad.buttons[index]?.value ?? 0) > 0.5;
      if (
        pressed &&
        !this.suppressPadActions &&
        !this.previousButtons.has(index) &&
        action !== 'throttle' &&
        action !== 'brake' &&
        action !== 'handbrake' &&
        action !== 'nitro'
      )
        this.action(action);
      if (pressed) this.previousButtons.add(index);
      else this.previousButtons.delete(index);
    }
    if (!this.enabled) return s;
    const axis =
      Math.abs(pad.axes[preferences.steerAxis] ?? 0) > 0.12
        ? -(pad.axes[preferences.steerAxis] ?? 0)
        : 0;
    const throttle = pad.buttons[preferences.pad.throttle]?.value ?? 0,
      brake = pad.buttons[preferences.pad.brake]?.value ?? 0;
    const handbrake = pad.buttons[preferences.pad.handbrake]?.pressed ?? false,
      nitro = pad.buttons[preferences.pad.nitro]?.pressed ?? false;
    if (
      Math.abs(axis) + throttle + brake + Number(handbrake) + Number(nitro) >
      0.05
    ) {
      this.device = 'GAMEPAD';
      s.steer = axis * (preferences.invertSteer ? -1 : 1);
      s.throttle = throttle;
      s.brake = brake;
      s.handbrake = handbrake;
      s.nitro = nitro;
    }
    return s;
  }
}
