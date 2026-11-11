import { expect, test, type Page } from '@playwright/test';

interface RaceSnapshot {
  playing: boolean;
  trafficDensity: number;
  player: {
    x: number;
    z: number;
    y: number;
    speed: number;
    gear: number;
    rpm: number;
    manual: boolean;
    damage: number;
  };
  opponents: { x: number; z: number; speed: number; enabled: boolean }[];
  race: null | {
    mode: {
      kind: string;
      score: number;
      chain: number;
      remaining: number;
      reason: string;
      gap: number;
    };
    ghostVisible: boolean;
    event: string;
    phase: string;
    countdown: number;
    elapsed: number;
    penalty: number;
    player: {
      lap: number;
      gate: number;
      finishTime: number | null;
      retired: boolean;
    };
    ranking: {
      id: string;
      lap: number;
      gate: number;
      progress: number;
      finishTime: number | null;
      retired: boolean;
    }[];
  };
}
declare global {
  interface Window {
    __nightCircuitQA: {
      manual(enabled?: boolean): void;
      state(): RaceSnapshot;
      advance(seconds: number, autodrive?: boolean): RaceSnapshot;
    };
  }
}
async function ready(page: Page) {
  await page.goto('/?quality=low&qa=race', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await expect
    .poll(() => page.evaluate(() => typeof window.__nightCircuitQA))
    .toBe('object');
  await page.evaluate(() => window.__nightCircuitQA.manual());
}
async function start(page: Page, id: string) {
  await page.locator('#start-quick-race').click();
  await page.locator(`[data-start-race="${id}"]`).click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
}
async function finish(page: Page, verifyFocus = false) {
  let state = await page.evaluate(() => window.__nightCircuitQA.state());
  let focusVerified = false;
  for (let i = 0; i < 400 && state.race?.phase !== 'finished'; i++) {
    state = await page.evaluate(
      (seconds) => window.__nightCircuitQA.advance(seconds, true),
      verifyFocus && !focusVerified ? 1 : 10,
    );
    if (
      verifyFocus &&
      !focusVerified &&
      state.race?.player.finishTime !== null &&
      state.race?.phase === 'running'
    ) {
      await expect(page.locator('#race-results')).toBeVisible();
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      const paused = await page.evaluate(() => window.__nightCircuitQA.state());
      expect(paused.playing).toBe(false);
      const after = await page.evaluate(() =>
        window.__nightCircuitQA.advance(2, true),
      );
      expect(after.race?.elapsed).toBe(paused.race?.elapsed);
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      expect(
        (await page.evaluate(() => window.__nightCircuitQA.state())).playing,
      ).toBe(true);
      focusVerified = true;
    }
  }
  if (verifyFocus) expect(focusVerified).toBe(true);
  expect(state.race, JSON.stringify(state)).not.toBeNull();
  expect(state.race!.phase, JSON.stringify(state)).toBe('finished');
  await expect(page.locator('#race-reward')).toContainText('Premio:');
  const profile = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('night-circuit:v2:auto')!),
  );
  expect(profile.results).toHaveLength(1);
  expect(profile.results[0].reward).toBeGreaterThan(0);
  expect(profile.credits).toBe(12000 + profile.results[0].reward);
  expect(profile.bestTimes[state.race!.event]).toBeCloseTo(
    state.race!.player.finishTime!,
    5,
  );
  await page.evaluate(() => window.__nightCircuitQA.advance(5));
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).credits,
    ),
  ).toBe(profile.credits);

  expect(state.race!.player.retired, JSON.stringify(state)).toBe(false);
  expect(state.race!.player.finishTime).toBeGreaterThan(20);
  expect(
    state.race!.ranking.filter((racer) => racer.finishTime !== null).length,
    JSON.stringify(state),
  ).toBe(5);
  await expect(page.locator('#race-results')).toBeVisible();
  await expect(page.locator('#race-result-info')).toContainText(
    'Classifica finale',
  );
  await expect(page.locator('#race-standings tr')).toHaveCount(5);
  return state;
}

test('fase 3: circuito completo con quattro IA, due giri, griglia e risultati', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await page.getByLabel('Densità traffico').selectOption('8');
  await start(page, 'circuit-foundry');
  const initial = await page.evaluate(() => window.__nightCircuitQA.state());
  expect(initial.race?.phase).toBe('countdown');
  expect(initial.opponents.filter((car) => car.enabled)).toHaveLength(4);
  expect(initial.trafficDensity).toBe(0);
  await page.keyboard.down('w');
  const countdown = await page.evaluate(() =>
    window.__nightCircuitQA.advance(2, false),
  );
  await page.keyboard.up('w');
  expect(countdown.player.x).toBeCloseTo(initial.player.x, 1);
  expect(countdown.player.z).toBeCloseTo(initial.player.z, 1);
  expect(countdown.race?.elapsed).toBe(0);
  await page.screenshot({ path: 'artifacts/phase3-grid.png' });
  const final = await finish(page, true);
  expect(final.race?.player.lap).toBe(2);
  await page.screenshot({ path: 'artifacts/phase3-circuit-results.png' });
  await page.locator('#race-free').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().race))
    .toBeNull();
  const free = await page.evaluate(() => window.__nightCircuitQA.state());
  expect(free.trafficDensity).toBe(8);
  expect(free.opponents.every((car) => !car.enabled)).toBe(true);
  expect(errors).toEqual([]);
});

test('fase 3: sprint completo, mappa gara, penalità, riprova e abbandono', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await start(page, 'sprint-quays');
  await page.evaluate(() => window.__nightCircuitQA.advance(8, true));
  await page.keyboard.press('r');
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).race?.penalty,
  ).toBe(3);
  await page.keyboard.press('g');
  await expect(page.locator('.city-map')).toBeVisible();
  await expect(page.locator('#map-info')).toContainText(
    'Percorso gara: Rotta del Levante',
  );
  await expect(page.locator('#clear-gps')).toBeDisabled();
  const before = (await page.evaluate(() => window.__nightCircuitQA.state()))
    .race?.elapsed;
  await page.evaluate(() => window.__nightCircuitQA.advance(3, true));
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).race?.elapsed,
  ).toBe(before);
  await page.locator('#close-map').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  const final = await finish(page);
  expect(final.race?.player.lap).toBe(1);
  await page.screenshot({ path: 'artifacts/phase3-sprint-results.png' });
  await page.locator('#race-retry').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).race?.penalty,
  ).toBe(0);
  await page.locator('#race-abandon').click();
  await expect(page.locator('#race-result-heading')).toHaveText(
    'Gara abbandonata',
  );
  await page.locator('#race-free').click();
  await expect(page.locator('#race-hud')).toBeHidden();
  expect(errors).toEqual([]);
});

test('fase 3: incontro sulla strada e avvio dal ritrovo', async ({ page }) => {
  await ready(page);
  await page.locator('#start').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await expect(page.locator('#race-interact')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.locator('#race-hud')).toBeVisible();
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).race?.event,
  ).toBe('circuit-foundry');
  await expect(page.locator('#quick-races')).toBeDisabled();
  await expect(page.locator('#open-garage')).toBeDisabled();
  await page.keyboard.press('h');
  await expect(page.locator('#garage')).toBeHidden();
  await page.evaluate(() => window.__nightCircuitQA.advance(1.5, false));
  await expect(page.locator('#race-warning')).toHaveText('Attendi il via');
  await page.screenshot({ path: 'artifacts/phase3-grid.png' });
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('g');
  await expect(page.locator('.map-card > p').first()).toContainText(
    'Mappa della gara',
  );
  await page.locator('#close-map').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.locator('#race-abandon').click();
  await expect(page.locator('#race-results')).toBeVisible();
  await page.locator('#race-free').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await expect(page.locator('#quick-races')).toBeEnabled();
  await page.locator('#quick-races').click();
  await expect(page.locator('#race-menu')).toBeVisible();
  await page
    .locator('#game')
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
    );
  await expect(page.locator('#race-menu')).toBeHidden();
  await expect(page.locator('#screen-title')).toHaveText('AVVIO INTERROTTO');
  await expect(page.locator('#start-quick-race')).toBeDisabled();
});
