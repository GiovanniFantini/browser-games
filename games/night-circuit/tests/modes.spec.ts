import { expect, test, type Page } from '@playwright/test';
async function ready(page: Page) {
  await page.goto('/?quality=low&qa=race', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled({ timeout: 180000 });
  await expect
    .poll(() => page.evaluate(() => typeof window.__nightCircuitQA))
    .toBe('object');
  await page.evaluate(() => window.__nightCircuitQA.manual());
}
async function reloadReady(page: Page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled({ timeout: 180000 });
  await page.evaluate(() => window.__nightCircuitQA.manual());
}
async function start(page: Page, id: string) {
  await page.locator('#start-quick-race').click();
  await page.locator(`[data-start-race="${id}"]`).click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
}
async function finish(page: Page, limit = 45) {
  let state = await page.evaluate(() => window.__nightCircuitQA.state());
  for (let i = 0; i < limit && state.race?.phase !== 'finished'; i++)
    state = await page.evaluate(() =>
      window.__nightCircuitQA.advance(10, true),
    );
  expect(state.race?.phase, JSON.stringify(state)).toBe('finished');
  await expect(page.locator('#race-results')).toBeVisible();
  return state;
}
async function free(page: Page) {
  await page.locator('#race-free').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#start-quick-race')).toBeVisible();
}
test('fase 6: sprint a tempo e fantasma persistente riprodotto al tentativo seguente', async ({
  page,
}) => {
  test.setTimeout(600000);
  await ready(page);
  await start(page, 'checkpoint-lanterns');
  let state = await finish(page);
  expect(state.race?.player.retired, JSON.stringify(state)).toBe(false);
  await free(page);
  await start(page, 'ghost-foundry');
  state = await finish(page);
  expect(state.race?.player.retired).toBe(false);
  const record = await page.evaluate(
    () => JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).ghost,
  );
  expect(record.frames.length).toBeGreaterThan(50);
  expect(record.duration).toBeGreaterThan(10);
  await page.screenshot({ path: 'artifacts/phase6-ghost-results.png' });
  await reloadReady(page);
  await start(page, 'ghost-foundry');
  await page.evaluate(() => window.__nightCircuitQA.advance(8, true));
  await expect(page.locator('#mode-hud')).toContainText(
    'FANTASMA DEL MIGLIOR GIRO',
  );
  await page.keyboard.press('r');
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).race?.penalty,
  ).toBe(3);
  await page.locator('#race-abandon').click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).ghost
          .duration,
    ),
  ).toBe(record.duration);
});
test('fase 6: drag manuale con traffico, cambiata e guasto al limitatore', async ({
  page,
}) => {
  test.setTimeout(600000);
  await ready(page);
  await start(page, 'drag-channel');
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).trafficDensity,
  ).toBe(6);
  await page.keyboard.press('v');
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).player.manual,
  ).toBe(true);
  await page.evaluate(() => window.__nightCircuitQA.advance(4.2, false));
  await page.keyboard.press('x');
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).player.gear,
  ).toBe(2);
  await page.evaluate(() => window.__nightCircuitQA.advance(0.5, false));
  await page.keyboard.press('z');
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).player.gear,
  ).toBe(1);
  const state = await finish(page);
  expect(state.race?.player.retired, JSON.stringify(state)).toBe(false);
  expect(state.player.gear).toBeGreaterThan(1);
  await page.screenshot({ path: 'artifacts/phase6-drag-results.png' });
  await page.locator('#race-retry').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.down('w');
  for (let i = 0; i < 15; i++) {
    const s = await page.evaluate(() =>
      window.__nightCircuitQA.advance(3, false),
    );
    if (s.race?.phase === 'finished') break;
  }
  await page.keyboard.up('w');
  await expect(page.locator('#mode-result')).toContainText('Motore fuori uso');
});
test('fase 6: drift su circuito e discesa con punteggio reale', async ({
  page,
}) => {
  test.setTimeout(600000);
  await ready(page);
  for (const id of ['drift-foundry', 'drift-hills']) {
    await start(page, id);
    const state = await finish(page);
    expect(state.race?.player.retired, JSON.stringify(state)).toBe(false);
    expect(state.race!.mode.score).toBeGreaterThan(0);
    await page.screenshot({ path: `artifacts/phase6-${id}.png` });
    await free(page);
  }
});
test('fase 6: sfida incontrata in strada e torneo ripreso dopo ricarica', async ({
  page,
}) => {
  test.setTimeout(900000);
  await page.route(
    (url) => url.pathname === '/src/main.ts',
    async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        'ready = true;',
        `
        const originalCupSteps = races.opponents.map(car => car.step);
        window.__holdCupOpponents = (hold = true) => {
          // Keep real opponents stationary while the QA pilot drives the real
          // player through every checkpoint. No finish state is fabricated.
          races.opponents.forEach((car, i) => {
            car.step = hold ? () => car.hold() : originalCupSteps[i];
          });
        };
        ready = true;`,
      );
      await route.fulfill({ response, body });
    },
  );
  await ready(page);
  await page.locator('#start').click();
  await expect(page.locator('#street-challenge')).toBeVisible();
  const before = await page.evaluate(
    () => window.__nightCircuitQA.state().player,
  );
  await page.keyboard.press('f');
  await expect(page.locator('#race-hud')).toBeVisible();
  const after = await page.evaluate(
    () => window.__nightCircuitQA.state().player,
  );
  expect(after.x).toBeCloseTo(before.x, 2);
  expect(after.z).toBeCloseTo(before.z, 2);
  await page.evaluate(() => window.__nightCircuitQA.advance(10, true));
  await expect(page.locator('#challenge-gap')).toBeVisible();
  await expect(page.locator('#challenge-gap')).toHaveAttribute('min', '-80');
  await expect(page.locator('#challenge-gap')).toHaveAttribute('max', '80');
  await page.screenshot({ path: 'artifacts/phase6-street-challenge.png' });
  const duel = await finish(page);
  expect(duel.race?.player.retired, JSON.stringify(duel)).toBe(false);
  await free(page);
  await start(page, 'cup-docks');
  await finish(page);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).cup.round,
    ),
  ).toBe(1);
  await reloadReady(page);
  await start(page, 'cup-docks');
  await page.evaluate(() =>
    (window as unknown as { __holdCupOpponents(): void }).__holdCupOpponents(),
  );
  let provisional = await page.evaluate(() => window.__nightCircuitQA.state());
  for (let i = 0; i < 450 && provisional.race?.player.finishTime === null; i++)
    provisional = await page.evaluate(() =>
      window.__nightCircuitQA.advance(1, true),
    );
  expect(provisional.race?.player.finishTime).not.toBeNull();
  expect(provisional.race?.phase).toBe('running');
  await expect(page.locator('#race-result-info')).toContainText(
    'Classifica provvisoria',
  );
  await expect(page.locator('#cup-next')).toBeHidden();
  // A programmatic activation cannot bypass the same lifecycle guard.
  await page
    .locator('#cup-next')
    .evaluate((button) => (button as HTMLButtonElement).click());
  const unchanged = await page.evaluate(() => window.__nightCircuitQA.state());
  expect(unchanged.race?.event).toBe('cup-quays');
  expect(unchanged.race?.phase).toBe('running');
  expect(unchanged.race?.cup?.round).toBe(1);
  await finish(page);
  await expect(page.locator('#cup-next')).toBeVisible();
  await page.evaluate(() =>
    (
      window as unknown as { __holdCupOpponents(hold: boolean): void }
    ).__holdCupOpponents(false),
  );
  await page.locator('#cup-next').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).race?.event,
  ).toBe('cup-return');
  await finish(page);
  await expect(page.locator('#race-result-heading')).toContainText(
    'Coppa conclusa',
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).cup,
    ),
  ).toBeNull();
  await page.screenshot({ path: 'artifacts/phase6-cup-results.png' });
  await free(page);
  await start(page, 'cup-docks');
  const credits = await page.evaluate(
    () => JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).credits,
  );
  await page.locator('#race-abandon').click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).cup,
    ),
  ).toBeNull();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).credits,
    ),
  ).toBe(credits);
});

test('fase 6: scadenza checkpoint e griglia normale dopo drag', async ({
  page,
}) => {
  test.setTimeout(600000);
  await ready(page);
  await start(page, 'checkpoint-lanterns');
  for (let i = 0; i < 4; i++)
    await page.evaluate(() => window.__nightCircuitQA.advance(10, false));
  await expect(page.locator('#mode-result')).toContainText('Tempo esaurito');
  await free(page);
  await start(page, 'drag-channel');
  await page.evaluate(() => window.__nightCircuitQA.advance(5, true));
  await page.locator('#race-abandon').click();
  await free(page);
  await start(page, 'circuit-foundry');
  const before = await page.evaluate(
    () => window.__nightCircuitQA.state().player,
  );
  const after = await page.evaluate(
    () => window.__nightCircuitQA.advance(1, false).player,
  );
  expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeLessThan(0.15);
  expect(after.manual).toBe(false);
  await page.locator('#race-abandon').click();
});
