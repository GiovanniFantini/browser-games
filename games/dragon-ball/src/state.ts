export const SAVE_KEY = 'browsergames.dragon-ball.save';
export const STAGES = ['catch-fish', 'meet-bulma', 'show-sphere', 'return-bulma', 'complete'] as const;
export type Stage = (typeof STAGES)[number];
export type Position = { x: number; z: number };
export type Save = {
  version: 1;
  zone: 'mount-paozu';
  stage: Stage;
  position: Position;
  yaw: number;
  cameraYaw: number;
  cameraPitch: number;
  quality: 'high' | 'low';
  updatedAt: string;
};
export type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type LoadResult = { kind: 'empty' } | { kind: 'valid'; save: Save } | { kind: 'invalid' | 'unavailable' };

export const OBJECTIVES: Record<Stage, { title: string; detail: string; target: Position; label: string }> = {
  'catch-fish': { title: 'Un pesce per cena', detail: 'Raggiungi la riva e recupera il pesce gigante.', target: { x: -22, z: 13 }, label: 'Riva del torrente' },
  'meet-bulma': { title: 'Un mostro sulla strada?', detail: 'Torna verso casa passando dal sentiero sterrato.', target: { x: 8, z: 9 }, label: 'Sentiero di montagna' },
  'show-sphere': { title: 'Il ricordo del nonno', detail: 'Entra in casa con Bulma e mostrale la Sfera sul comò.', target: { x: -13.3, z: -14.4 }, label: 'Sfera del Drago' },
  'return-bulma': { title: 'Sette sfere, un desiderio', detail: 'Ascolta Bulma in casa e decidi se accompagnarla.', target: { x: -13, z: -12 }, label: 'Bulma' },
  'complete': { title: 'L’avventura ha inizio', detail: 'Prima tappa completata. Puoi continuare a esplorare le montagne.', target: { x: 8, z: 9 }, label: 'Bulma' },
};

export function freshSave(): Save {
  return { version: 1, zone: 'mount-paozu', stage: 'catch-fish', position: { x: -22, z: 18 }, yaw: Math.PI, cameraYaw: 0, cameraPitch: 0.23, quality: 'high', updatedAt: new Date().toISOString() };
}

const finiteBetween = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

export function parseSave(raw: string): Save | null {
  try {
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || s.zone !== 'mount-paozu' || !STAGES.includes(s.stage) ||
      !s.position || !finiteBetween(s.position.x, -57, 57) || !finiteBetween(s.position.z, -57, 57) ||
      !finiteBetween(s.yaw, -Math.PI, Math.PI) || !finiteBetween(s.cameraYaw, -Math.PI, Math.PI) ||
      !finiteBetween(s.cameraPitch, 0.12, 1.1) || !['high', 'low'].includes(s.quality) ||
      typeof s.updatedAt !== 'string' || !Number.isFinite(Date.parse(s.updatedAt))) return null;
    return { version: 1, zone: s.zone, stage: s.stage, position: { x: s.position.x, z: s.position.z }, yaw: s.yaw, cameraYaw: s.cameraYaw, cameraPitch: s.cameraPitch, quality: s.quality, updatedAt: s.updatedAt };
  } catch { return null; }
}

export function loadSave(store: Store): LoadResult {
  try {
    const raw = store.getItem(SAVE_KEY);
    if (raw === null) return { kind: 'empty' };
    const save = parseSave(raw);
    return save ? { kind: 'valid', save } : { kind: 'invalid' };
  } catch { return { kind: 'unavailable' }; }
}

export function writeSave(store: Store, save: Save): boolean {
  try { store.setItem(SAVE_KEY, JSON.stringify(save)); return true; }
  catch { return false; }
}

export function advanceStage(stage: Stage, interaction: 'bulma' | 'sphere' | 'fish'): Stage {
  if (stage === 'catch-fish' && interaction === 'fish') return 'meet-bulma';
  if (stage === 'meet-bulma' && interaction === 'bulma') return 'show-sphere';
  if (stage === 'show-sphere' && interaction === 'sphere') return 'return-bulma';
  if (stage === 'return-bulma' && interaction === 'bulma') return 'complete';
  return stage;
}
