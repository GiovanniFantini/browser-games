import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceStage, freshSave, loadSave, parseSave, SAVE_KEY, writeSave, type Store } from './state.ts';

function memoryStore(): Store {
  const data = new Map<string, string>();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }, removeItem: key => { data.delete(key); } };
}
test('il percorso parte dal pesce e richiede gli incontri nell’ordine, senza duplicati', () => {
  assert.equal(freshSave().stage, 'catch-fish');
  assert.equal(advanceStage('catch-fish', 'bulma'), 'catch-fish');
  assert.equal(advanceStage('catch-fish', 'fish'), 'meet-bulma');
  assert.equal(advanceStage('meet-bulma', 'fish'), 'meet-bulma');
  assert.equal(advanceStage('meet-bulma', 'sphere'), 'meet-bulma');
  let stage = advanceStage('meet-bulma', 'bulma');
  assert.equal(stage, 'show-sphere');
  assert.equal(advanceStage(stage, 'bulma'), 'show-sphere');
  stage = advanceStage(stage, 'sphere');
  assert.equal(stage, 'return-bulma');
  assert.equal(advanceStage(stage, 'sphere'), 'return-bulma');
  stage = advanceStage(stage, 'bulma');
  assert.equal(stage, 'complete');
  assert.equal(advanceStage(stage, 'bulma'), 'complete');
});
test('un salvataggio precedente all’introduzione del pesce conserva progressi e impostazioni', () => {
  const previous = { ...freshSave(), stage: 'show-sphere', position: { x: -15, z: -8 }, cameraYaw: 0.8 };
  assert.deepEqual(parseSave(JSON.stringify(previous)), previous);
});
test('posizione, telecamera e missione si conservano dopo una nuova lettura', () => {
  const store = memoryStore(), save = freshSave();
  save.stage = 'return-bulma'; save.position = { x: 5.25, z: -4.5 }; save.cameraYaw = -2.1; save.quality = 'low';
  assert.equal(writeSave(store, save), true);
  assert.deepEqual(loadSave(store), { kind: 'valid', save });
});
test('salvataggi malformati e futuri restano intatti e sono riconosciuti', () => {
  const store = memoryStore();
  for (const raw of ['{', 'null', '[]', JSON.stringify({ ...freshSave(), version: 2 }), JSON.stringify({ ...freshSave(), stage: 'unknown' }), JSON.stringify({ ...freshSave(), position: { x: 999, z: 0 } }), JSON.stringify({ ...freshSave(), cameraPitch: -10 }), JSON.stringify({ ...freshSave(), updatedAt: 'bad' })]) {
    store.setItem(SAVE_KEY, raw);
    assert.deepEqual(loadSave(store), { kind: 'invalid' });
    assert.equal(store.getItem(SAVE_KEY), raw);
    assert.equal(parseSave(raw), null);
  }
});
test('assenza e indisponibilità dello storage sono situazioni distinte', () => {
  assert.deepEqual(loadSave(memoryStore()), { kind: 'empty' });
  const blocked: Store = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  assert.deepEqual(loadSave(blocked), { kind: 'unavailable' });
  assert.equal(writeSave(blocked, freshSave()), false);
});
