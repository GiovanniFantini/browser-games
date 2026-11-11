import exploration from '../data/exploration.json';
import {
  freshCareer,
  parseCareer,
  careerRace,
  careerLevel,
  careerData,
  raceLock,
  type CareerState,
} from './career';
import { parseGhost, type GhostRecord } from '../race/ghost';
import { parseCup, type CupState } from '../race/tournament';
import { catalog, stockLevels, type Levels } from './catalog';
import {
  defaultAppearance,
  defaultVisualOwned,
  parseAppearance,
  appearanceCost,
  visualIds,
  visualSelection,
  type Appearance,
} from '../tuning/appearance';

export const MAX_SAVE_BYTES = 2097152;

export interface GarageCar {
  id: string;
  model: string;
  owned: Levels;
  equipped: Levels;
  appearance: Appearance;
  visualOwned: string[];
}
export interface Result {
  id: string;
  event: string;
  position: number;
  time: number | null;
  reward: number;
}
export interface Profile {
  game: 'night-circuit';
  version: 6;
  exploration: string[];
  career: CareerState;
  ghost: GhostRecord | null;
  cup: CupState | null;
  bestScores: Record<string, number>;
  credits: number;
  cars: GarageCar[];
  activeCar: string;
  bestTimes: Record<string, number>;
  results: Result[];
  settled: string[];
}
export function freshProfile(): Profile {
  return {
    game: 'night-circuit',
    version: 6,
    exploration: [],
    career: freshCareer(),
    ghost: null,
    cup: null,
    bestScores: {},
    credits: catalog.initialCredits,
    cars: [
      {
        id: 'car-1',
        model: catalog.model.id,
        owned: stockLevels(),
        equipped: stockLevels(),
        appearance: defaultAppearance(),
        visualOwned: defaultVisualOwned(),
      },
    ],
    activeCar: 'car-1',
    bestTimes: {},
    results: [],
    settled: [],
  };
}
export const activeCar = (p: Profile) =>
  p.cars.find((c) => c.id === p.activeCar)!;
const integer = (value: unknown, max: number) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= max;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Struttura del salvataggio non valida.');
  return value as Record<string, unknown>;
}
function levels(value: unknown): Levels {
  const input = object(value),
    result = stockLevels();
  if (Object.keys(input).length !== catalog.categories.length)
    throw Error('Categorie mancanti o sconosciute.');
  for (const key of Object.keys(result)) {
    if (!integer(input[key], 3)) throw Error('Livello componente non valido.');
    result[key] = input[key] as number;
  }
  return result;
}
const events = Object.keys(catalog.rewards);
export function parseProfile(raw: string): Profile {
  if (raw.length > MAX_SAVE_BYTES)
    throw Error('File troppo grande (massimo 2 MB).');
  const input = object(JSON.parse(raw));
  // Version 1 is the documented minimal interchange format, never a prior game release.
  if (input.version === 1 && input.game === 'night-circuit') {
    const upgraded = freshProfile();
    upgraded.credits = input.credits as number;
    const parts = levels(input.upgrades);
    upgraded.cars[0].owned = { ...parts };
    upgraded.cars[0].equipped = { ...parts };
    return parseProfile(JSON.stringify(upgraded));
  }
  if (
    input.game === 'night-circuit' &&
    input.version === 2 &&
    Array.isArray(input.cars)
  ) {
    return parseProfile(
      JSON.stringify({
        ...input,
        version: 3,
        cars: input.cars.map((value) => ({
          ...object(value),
          appearance: defaultAppearance(),
          visualOwned: defaultVisualOwned(),
        })),
      }),
    );
  }
  if (input.game === 'night-circuit' && input.version === 3)
    return parseProfile(
      JSON.stringify({
        ...input,
        version: 4,
        ghost: null,
        cup: null,
        bestScores: {},
      }),
    );
  if (input.game === 'night-circuit' && input.version === 4)
    return parseProfile(
      JSON.stringify({ ...input, version: 5, career: freshCareer() }),
    );
  if (input.game === 'night-circuit' && input.version === 5)
    return parseProfile(
      JSON.stringify({ ...input, version: 6, exploration: [] }),
    );
  if (input.game !== 'night-circuit' || input.version !== 6)
    throw Error('Gioco o versione del salvataggio non supportati.');
  if (!integer(input.credits, 1e9)) throw Error('Saldo non valido.');
  if (
    !Array.isArray(input.cars) ||
    !input.cars.length ||
    input.cars.length > catalog.capacity
  )
    throw Error('Garage non valido.');
  const cars: GarageCar[] = input.cars.map((value) => {
    const car = object(value);
    if (
      !['car-1', 'car-2', 'car-3'].includes(String(car.id)) ||
      !careerData.models.some((m) => m.id === car.model)
    )
      throw Error('Auto non riconosciuta.');
    const owned = levels(car.owned),
      equipped = levels(car.equipped);
    for (const key of Object.keys(owned))
      if (equipped[key] > owned[key])
        throw Error('Componente installato non posseduto.');
    const appearance = parseAppearance(car.appearance);
    if (
      !Array.isArray(car.visualOwned) ||
      car.visualOwned.length > 150 ||
      car.visualOwned.some(
        (id) => typeof id !== 'string' || !visualIds.has(id),
      ) ||
      new Set(car.visualOwned).size !== car.visualOwned.length
    )
      throw Error('Inventario estetico non valido.');
    const visualOwned = [
      ...new Set([...defaultVisualOwned(), ...(car.visualOwned as string[])]),
    ];
    if (visualSelection(appearance).some((id) => !visualOwned.includes(id)))
      throw Error('Parte estetica non posseduta.');
    return {
      id: String(car.id),
      model: String(car.model),
      owned,
      equipped,
      appearance,
      visualOwned,
    };
  });
  if (
    new Set(cars.map((c) => c.id)).size !== cars.length ||
    !cars.some((c) => c.id === input.activeCar)
  )
    throw Error('Riferimento auto non valido.');
  const bestTimes: Record<string, number> = {};
  for (const [key, time] of Object.entries(object(input.bestTimes))) {
    if (
      !events.includes(key) ||
      typeof time !== 'number' ||
      !Number.isFinite(time) ||
      time <= 0 ||
      time > 86400
    )
      throw Error('Tempo non valido.');
    bestTimes[key] = time;
  }
  if (
    !Array.isArray(input.settled) ||
    input.settled.length > 10000 ||
    input.settled.some(
      (id) => typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(id),
    ) ||
    new Set(input.settled).size !== input.settled.length
  )
    throw Error('Identificativi gara non validi.');
  if (!Array.isArray(input.results) || input.results.length > 30)
    throw Error('Storico non valido.');
  const settled = input.settled as string[];
  const results = input.results.map((value) => {
    const r = object(value);
    if (
      !settled.includes(String(r.id)) ||
      !events.includes(String(r.event)) ||
      !integer(r.position, 5) ||
      r.position === 0 ||
      !integer(r.reward, 100000) ||
      (r.time !== null &&
        (typeof r.time !== 'number' ||
          !Number.isFinite(r.time) ||
          r.time <= 0 ||
          r.time > 86400))
    )
      throw Error('Risultato non valido.');
    return {
      id: String(r.id),
      event: String(r.event),
      position: r.position as number,
      reward: r.reward as number,
      time: r.time as number | null,
    };
  });
  const bestScores: Record<string, number> = {};
  for (const [id, value] of Object.entries(object(input.bestScores))) {
    if (!['drift-foundry', 'drift-hills'].includes(id) || !integer(value, 1e8))
      throw Error('Punteggio non valido.');
    bestScores[id] = value as number;
  }
  const ghost = parseGhost(input.ghost),
    cup = parseCup(input.cup);
  if (
    !Array.isArray(input.exploration) ||
    input.exploration.length > exploration.collectibles.length ||
    new Set(input.exploration).size !== input.exploration.length ||
    input.exploration.some(
      (id) => !exploration.collectibles.some((p) => p.id === id),
    )
  )
    throw Error('Collezionabili non validi.');
  return {
    game: 'night-circuit',
    version: 6,
    exploration: [...input.exploration] as string[],
    career: parseCareer(input.career),
    ghost,
    cup,
    bestScores,
    credits: input.credits as number,
    cars,
    activeCar: input.activeCar as string,
    bestTimes,
    results,
    settled: [...input.settled] as string[],
  };
}

export function buyPart(p: Profile, category: string, tier: number) {
  const definition = catalog.categories.find((c) => c.id === category),
    car = activeCar(p);
  if (!definition || !integer(tier, 3) || tier === 0)
    throw Error('Componente non valido.');
  if (car.owned[category] >= tier) throw Error('Componente già posseduto.');
  if (car.owned[category] !== tier - 1)
    throw Error('Acquista prima il livello precedente.');
  if (p.career.started && tier > careerLevel(p.career))
    throw Error('Livello carriera insufficiente.');
  const price = definition.tiers[tier - 1].price;
  if (p.credits < price) throw Error('Crediti insufficienti.');
  p.credits -= price;
  car.owned[category] = tier;
  car.equipped[category] = tier;
}
export function equipPart(p: Profile, category: string, tier: number) {
  const car = activeCar(p);
  if (
    !Object.hasOwn(car.owned, category) ||
    !integer(tier, 3) ||
    car.owned[category] < tier
  )
    throw Error('Componente non posseduto.');
  car.equipped[category] = tier;
}
function purchasableModel(p: Profile, modelId: string) {
  const model = careerData.models.find((m) => m.id === modelId);
  if (
    !model ||
    (!p.career.started && model.level > 1) ||
    (p.career.started && model.level > careerLevel(p.career))
  )
    throw Error('Modello non ancora sbloccato.');
  return model;
}
export function tradeInValue(car: GarageCar) {
  const model = careerData.models.find((m) => m.id === car.model);
  if (!model) throw Error('Modello non riconosciuto.');
  return Math.floor(model.price * careerData.tradeInRate);
}
export function tradeCar(p: Profile, id: string, modelId: string) {
  const model = purchasableModel(p, modelId),
    car = p.cars.find((c) => c.id === id);
  if (!car || car.model === modelId)
    throw Error('Scegli un modello diverso da sostituire.');
  const value = tradeInValue(car);
  if (p.credits + value < model.price) throw Error('Crediti insufficienti.');
  p.credits = Math.min(1e9, p.credits + value - model.price);
  car.model = model.id;
  p.activeCar = car.id;
}
export function buyCar(p: Profile, modelId = catalog.model.id) {
  const model = purchasableModel(p, modelId);
  if (p.cars.length >= catalog.capacity) throw Error('Garage pieno.');
  if (p.credits < model.price) throw Error('Crediti insufficienti.');
  const id = ['car-1', 'car-2', 'car-3'].find(
    (id) => !p.cars.some((c) => c.id === id),
  )!;
  p.credits -= model.price;
  p.cars.push({
    id,
    model: model.id,
    owned: stockLevels(),
    equipped: stockLevels(),
    appearance: defaultAppearance(),
    visualOwned: defaultVisualOwned(),
  });
  p.activeCar = id;
}
export function settleRace(
  p: Profile,
  result: Omit<Result, 'reward'>,
  difficulty: number,
): number {
  if (p.settled.includes(result.id)) return 0;

  const rewards = catalog.rewards[result.event as keyof typeof catalog.rewards];
  const scale =
    catalog.difficultyRewards[
      String(difficulty) as keyof typeof catalog.difficultyRewards
    ];
  if (!rewards || !scale || result.position < 1 || result.position > 5)
    throw Error('Premio gara non valido.');
  const lock = raceLock(p, result.event);
  if (lock) throw Error(lock);
  const reward =
    result.time === null ? 0 : Math.round(rewards[result.position - 1] * scale);
  p.credits = Math.min(1e9, p.credits + reward);
  p.settled.splice(0, Math.max(0, p.settled.length - 2047));
  p.settled.push(result.id);
  p.results.unshift({ ...result, reward });
  p.results = p.results.slice(0, 30);
  if (result.time !== null)
    p.bestTimes[result.event] = Math.min(
      p.bestTimes[result.event] ?? Infinity,
      result.time,
    );
  careerRace(p, result, p.career.district);
  return reward;
}

export function applyAppearance(p: Profile, value: Appearance) {
  const appearance = parseAppearance(value),
    car = activeCar(p);
  const cost = appearanceCost(appearance, car.visualOwned);
  if (p.credits < cost)
    throw Error('Crediti insufficienti per questa configurazione.');
  p.credits -= cost;
  car.visualOwned = [
    ...new Set([...car.visualOwned, ...visualSelection(appearance)]),
  ];
  car.appearance = appearance;
}
