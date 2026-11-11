import data from '../data/appearance.json';
import prototype from '../data/prototype.json';

export const visualCatalog = data;
export type VisualSlot = keyof typeof data.slots;
export type VinylSide = 'left' | 'right' | 'hood' | 'roof';
export interface VinylLayer {
  id: string;
  shape: string;
  side: VinylSide;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  color: string;
  opacity: number;
  mirror: boolean;
}
export interface Appearance {
  parts: Record<VisualSlot, number>;
  wheel: number;
  diameter: number;
  spinner: boolean;
  paint: string;
  secondary: string;
  rims: string;
  calipers: string;
  neonColor: string;
  headColor: string;
  tailColor: string;
  hudColor: string;
  nitroColor: string;
  tint: number;
  vinyls: VinylLayer[];
}
export function defaultAppearance(): Appearance {
  return {
    ...data.defaults,
    paint: prototype.car.color,
    parts: { ...data.defaults.parts },
    vinyls: [],
  };
}
export const defaultVisualOwned = () => [
  ...Object.keys(data.slots).map((k) => `${k}:0`),
  'wheel:0',
];
export const visualIds = new Set([
  ...Object.entries(data.slots).flatMap(([key, slot]) =>
    slot.options.map((o) => `${key}:${o.id}`),
  ),
  ...data.wheels.map((w) => `wheel:${w.id}`),
  'spinner',
  'vinyl',
]);
export function visualSelection(a: Appearance) {
  return [
    ...Object.entries(a.parts).map(([key, id]) => `${key}:${id}`),
    `wheel:${a.wheel}`,
    ...(a.spinner ? ['spinner'] : []),
    ...(a.vinyls.length ? ['vinyl'] : []),
  ];
}
function price(id: string) {
  if (id === 'spinner') return data.spinnerPrice;
  if (id === 'vinyl') return data.vinylUnlockPrice;
  const [key, index] = id.split(':');
  return key === 'wheel'
    ? data.wheels[Number(index)].price
    : data.slots[key as VisualSlot].options[Number(index)].price;
}
export function appearanceCost(a: Appearance, owned: readonly string[]) {
  return visualSelection(a)
    .filter((id) => !owned.includes(id))
    .reduce((sum, id) => sum + price(id), 0);
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Configurazione estetica non valida.');
  return value as Record<string, unknown>;
}
function number(value: unknown, min: number, max: number) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw Error('Regolazione estetica non valida.');
  return value;
}
function color(value: unknown) {
  if (typeof value !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(value))
    throw Error('Colore non valido.');
  return value.toLowerCase();
}
export function parseAppearance(value: unknown): Appearance {
  const input = record(value),
    parts = record(input.parts),
    result = defaultAppearance();
  if (Object.keys(parts).length !== Object.keys(data.slots).length)
    throw Error('Parti estetiche mancanti.');
  for (const key of Object.keys(data.slots) as VisualSlot[]) {
    const n = number(parts[key], 0, data.slots[key].options.length - 1);
    if (!Number.isInteger(n)) throw Error('Parte estetica non valida.');
    result.parts[key] = n;
  }
  result.wheel = number(input.wheel, 0, data.wheels.length - 1);
  if (!Number.isInteger(result.wheel)) throw Error('Cerchio non valido.');
  result.diameter = number(input.diameter, 17, 22);
  result.tint = number(input.tint, 0, 0.9);
  if (typeof input.spinner !== 'boolean') throw Error('Spinner non valido.');
  result.spinner = input.spinner;
  for (const key of [
    'paint',
    'secondary',
    'rims',
    'calipers',
    'neonColor',
    'headColor',
    'tailColor',
    'hudColor',
    'nitroColor',
  ] as const)
    result[key] = color(input[key]);
  if (!Array.isArray(input.vinyls) || input.vinyls.length > 12)
    throw Error('Massimo dodici strati di vinile.');
  result.vinyls = input.vinyls.map((value) => {
    const l = record(value);
    if (
      typeof l.id !== 'string' ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(l.id) ||
      !data.shapes.some((s) => s.id === l.shape) ||
      typeof l.side !== 'string' ||
      !['left', 'right', 'hood', 'roof'].includes(l.side) ||
      typeof l.mirror !== 'boolean'
    )
      throw Error('Strato di vinile non valido.');
    return {
      id: l.id,
      shape: String(l.shape),
      side: l.side as VinylSide,
      x: number(l.x, 0, 1),
      y: number(l.y, 0, 1),
      scaleX: number(l.scaleX, 0.05, 2),
      scaleY: number(l.scaleY, 0.05, 2),
      rotation: number(l.rotation, -180, 180),
      color: color(l.color),
      opacity: number(l.opacity, 0.1, 1),
      mirror: l.mirror,
    };
  });
  if (new Set(result.vinyls.map((l) => l.id)).size !== result.vinyls.length)
    throw Error('Strati duplicati.');
  return result;
}
export function aestheticScore(a: Appearance) {
  const base = defaultAppearance();
  let points = a.parts.kit ? 1.8 : 0;
  for (const key of [
    'front',
    'rear',
    'skirts',
    'spoiler',
    'hood',
    'roof',
    'mirrors',
    'fuel',
    'exhaust',
    'audio',
  ] as const)
    if (a.parts[key]) points += 0.35;
  points += a.wheel ? 1 : 0;
  points += a.spinner ? 0.25 : 0;
  points += a.parts.finish ? 0.8 : 0;
  points += a.parts.neon ? 0.7 : 0;
  points += a.parts.neon > 1 ? 0.25 : 0;
  points += a.parts.lights ? 0.4 : 0;
  points += Math.min(1.4, new Set(a.vinyls.map((l) => l.shape)).size * 0.35);
  points +=
    ['paint', 'rims', 'calipers'].filter(
      (k) => a[k as 'paint'] !== base[k as 'paint'],
    ).length * 0.2;
  points += a.tint !== base.tint ? 0.15 : 0;
  return Math.min(10, Math.round(points * 10) / 10);
}
