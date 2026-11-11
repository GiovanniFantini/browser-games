import { preferences, defaults, bindPad } from './preferences';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from './input';

afterEach(() => vi.unstubAllGlobals());
describe('pulsanti gamepad', () => {
  it('Start tenuto durante pausa/ripresa genera un solo comando', () => {
    const buttons = Array.from({ length: 17 }, () => ({
      value: 0,
      pressed: false,
    }));
    const pad = { mapping: 'standard', connected: true, buttons, axes: [0, 0] };
    vi.stubGlobal('window', new EventTarget());
    vi.stubGlobal('navigator', { getGamepads: () => [pad] });
    const action = vi.fn();
    const input = new Input(action);
    buttons[9].value = 1;
    input.sample();
    input.clear();
    input.sample();
    expect(action).toHaveBeenCalledTimes(1);
    buttons[9].value = 0;
    input.sample();
    buttons[9].value = 1;
    input.sample();
    expect(action).toHaveBeenCalledTimes(2);
  });
});

it('usa i pulsanti rimappati e l’asse sterzo scelto, senza confondere nitro e freno a mano', () => {
  Object.assign(preferences, defaults());
  const buttons = Array.from({ length: 17 }, () => ({
    value: 0,
    pressed: false,
  }));
  const pad = { mapping: 'standard', connected: true, buttons, axes: [0, 0.6] };
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('navigator', { getGamepads: () => [pad] });
  const input = new Input(() => {});
  input.enabled = true;
  bindPad('nitro', 0);
  preferences.steerAxis = 1;
  preferences.invertSteer = true;
  buttons[0] = { value: 1, pressed: true };
  let state = input.sample();
  expect(state.nitro).toBe(true);
  expect(state.handbrake).toBe(false);
  expect(state.steer).toBeCloseTo(0.6);
  buttons[0] = { value: 0, pressed: false };
  buttons[1] = { value: 1, pressed: true };
  state = input.sample();
  expect(state.nitro).toBe(false);
  expect(state.handbrake).toBe(true);
  Object.assign(preferences, defaults());
});

it('durante una cattura non esegue il vecchio comando né lo ripete alla fine della cattura', () => {
  const buttons = Array.from({ length: 17 }, () => ({
    value: 0,
    pressed: false,
  }));
  const pad = { mapping: 'standard', connected: true, buttons, axes: [0, 0] };
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('navigator', { getGamepads: () => [pad] });
  const action = vi.fn(),
    input = new Input(action);
  input.suppressPadActions = true;
  buttons[9].value = 1;
  input.sample();
  expect(action).not.toHaveBeenCalled();
  input.suppressPadActions = false;
  input.sample();
  expect(action).not.toHaveBeenCalled();
  buttons[9].value = 0;
  input.sample();
  buttons[9].value = 1;
  input.sample();
  expect(action).toHaveBeenCalledWith('pause');
  expect(action).toHaveBeenCalledTimes(1);
});

it('chiude i menu con il tasto pausa rimappato anche da un select, lasciando inattiva la guida nel campo', () => {
  class Select {}
  class TextInput {}
  vi.stubGlobal('HTMLSelectElement', Select);
  vi.stubGlobal('HTMLInputElement', TextInput);
  const surface = new EventTarget();
  vi.stubGlobal('window', surface);
  vi.stubGlobal('navigator', { getGamepads: () => [] });
  Object.assign(preferences, defaults());
  preferences.keys.pause = 'KeyB';
  const action = vi.fn(),
    input = new Input(action);
  input.enabled = true;
  const send = (code: string) => {
    const event = new Event('keydown', { cancelable: true });
    Object.defineProperty(event, 'code', { value: code });
    Object.defineProperty(event, 'target', { value: new Select() });
    surface.dispatchEvent(event);
  };
  send('KeyB');
  expect(action).toHaveBeenCalledWith('pause');
  send('KeyW');
  expect(input.sample().throttle).toBe(0);
  Object.assign(preferences, defaults());
});
