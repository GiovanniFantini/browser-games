export const preferenceKey = 'night-circuit:preferences:v1';
export const defaultKeys: Record<string, string> = {
  throttle: 'KeyW',
  brake: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  handbrake: 'Space',
  nitro: 'ShiftLeft',
  pause: 'Escape',
  reset: 'KeyR',
  camera: 'KeyC',
  mute: 'KeyM',
  map: 'KeyG',
  races: 'KeyQ',
  garage: 'KeyH',
  interact: 'KeyE',
  'gear-up': 'KeyX',
  'gear-down': 'KeyZ',
  manual: 'KeyV',
  challenge: 'KeyF',
  phone: 'KeyP',
  settings: 'KeyO',
};
export const defaultPad: Record<string, number> = {
  throttle: 7,
  brake: 6,
  handbrake: 0,
  nitro: 1,
  pause: 9,
  reset: 3,
  camera: 2,
  mute: 8,
  interact: 4,
  races: 5,
  'gear-up': 12,
  'gear-down': 13,
  manual: 14,
  challenge: 15,
  phone: 10,
};
export interface Preferences {
  version: 1;
  language: 'it' | 'en';
  units: 'kmh' | 'mph';
  quality: 'low' | 'medium' | 'high';
  master: number;
  engine: number;
  music: number;
  effects: number;
  station: number;
  rain: boolean;
  bloom: boolean;
  assist: boolean;
  traffic: number;
  keys: Record<string, string>;
  pad: Record<string, number>;
  steerAxis: number;
  invertSteer: boolean;
}
export const defaults = (): Preferences => ({
  version: 1,
  language: 'it',
  units: 'kmh',
  quality: 'medium',
  master: 1,
  engine: 1,
  music: 0.45,
  effects: 0.7,
  station: 0,
  rain: false,
  bloom: true,
  assist: true,
  traffic: 16,
  keys: { ...defaultKeys },
  pad: { ...defaultPad },
  steerAxis: 0,
  invertSteer: false,
});
export function parsePreferences(raw: string): Preferences {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object')
    throw Error('Impostazioni non valide.');
  const v = value as Record<string, unknown>,
    p = defaults();
  if (v.version !== 1) throw Error('Versione impostazioni non valida.');
  for (const key of ['master', 'engine', 'music', 'effects'] as const) {
    const n = v[key];
    if (typeof n === 'number' && Number.isFinite(n))
      p[key] = Math.max(0, Math.min(1, n));
  }
  if (v.language === 'en') p.language = 'en';
  if (v.units === 'mph') p.units = 'mph';
  if (v.quality === 'low' || v.quality === 'high') p.quality = v.quality;
  for (const key of ['rain', 'bloom', 'assist', 'invertSteer'] as const)
    if (typeof v[key] === 'boolean') p[key] = v[key];
  if ([0, 1, 2, 3].includes(Number(v.station))) p.station = Number(v.station);
  if ([0, 8, 16, 32].includes(Number(v.traffic))) p.traffic = Number(v.traffic);
  if (
    Number.isInteger(v.steerAxis) &&
    Number(v.steerAxis) >= 0 &&
    Number(v.steerAxis) < 4
  )
    p.steerAxis = Number(v.steerAxis);
  const keys = v.keys as Record<string, unknown> | undefined,
    pad = v.pad as Record<string, unknown> | undefined;
  if (keys && typeof keys === 'object') {
    const candidate = { ...p.keys };
    for (const a of Object.keys(candidate)) {
      const k = keys[a];
      if (
        typeof k === 'string' &&
        /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Escape|Tab|Enter|Backspace|F[1-9]|F1[012])$/.test(
          k,
        ) &&
        k !== 'F3' &&
        !k.startsWith('Arrow')
      )
        candidate[a] = k;
    }
    if (
      new Set(Object.values(candidate)).size === Object.keys(candidate).length
    )
      p.keys = candidate;
  }
  if (pad && typeof pad === 'object') {
    const candidate = { ...p.pad };
    for (const a of Object.keys(candidate)) {
      const n = pad[a];
      if (Number.isInteger(n) && Number(n) >= 0 && Number(n) < 17)
        candidate[a] = Number(n);
    }
    if (
      new Set(Object.values(candidate)).size === Object.keys(candidate).length
    )
      p.pad = candidate;
  }
  return p;
}
export const preferences: Preferences = (() => {
  try {
    return parsePreferences(localStorage.getItem(preferenceKey) ?? '');
  } catch {
    return defaults();
  }
})();
export function savePreferences() {
  try {
    localStorage.setItem(preferenceKey, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
export function bindKey(action: string, code: string) {
  if (
    code === 'F3' ||
    code.startsWith('Arrow') ||
    !Object.hasOwn(preferences.keys, action)
  )
    return;
  const other = Object.keys(preferences.keys).find(
    (a) => preferences.keys[a] === code,
  );
  if (other) preferences.keys[other] = preferences.keys[action];
  preferences.keys[action] = code;
}
export function bindPad(action: string, index: number) {
  if (
    !Object.hasOwn(preferences.pad, action) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 16
  )
    return;
  const next = { ...preferences.pad };
  const other = Object.keys(next).find((a) => next[a] === index);
  if (other) next[other] = next[action];
  next[action] = index;
  preferences.pad = next;
}

export const displaySpeed = (metresPerSecond: number) =>
  Math.round(metresPerSecond * (preferences.units === 'mph' ? 2.236936 : 3.6));
export const speedUnit = () => (preferences.units === 'mph' ? 'mph' : 'km/h');

let sessionQuality: Preferences['quality'] | undefined;
export const graphicsQuality = () => sessionQuality ?? preferences.quality;
export function setSessionQuality(value?: Preferences['quality']) {
  sessionQuality = value;
}
