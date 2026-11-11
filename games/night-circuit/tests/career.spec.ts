import { expect, test, type Page } from '@playwright/test';
import { readFile, copyFile } from 'node:fs/promises';
const saved = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem('night-circuit:v2:auto')!),
  );
async function ready(page: Page) {
  await page.goto('/?quality=low&qa=race', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await page.evaluate(() => window.__nightCircuitQA.manual());
}
async function phone(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('p');
  await expect(page.locator('#career-phone')).toBeVisible();
}
async function finish(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  let state = await page.evaluate(() => window.__nightCircuitQA.state());
  for (let i = 0; i < 45 && state.race?.phase !== 'finished'; i++)
    state = await page.evaluate(() =>
      window.__nightCircuitQA.advance(10, true),
    );
  expect(state.race?.phase, JSON.stringify(state)).toBe('finished');
  expect(state.race?.player.retired, JSON.stringify(state)).toBe(false);
  await expect(page.locator('#race-results')).toBeVisible();
  return state;
}
async function leave(page: Page) {
  await page.locator('#race-free').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
}
async function startPhoneRace(page: Page, id: string) {
  await page.locator('[data-phone-tab="route"]').click();
  await page.locator(`[data-career-race="${id}"]`).click();
  return finish(page);
}
test('fase 7: carriera completa, sponsor, copertina, quattro rivali, viaggi e modello sbloccato', async ({
  page,
}) => {
  test.setTimeout(1800000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await page.locator('#start-career').click();
  await page.locator('#career-begin').click();
  await page.locator('[data-phone-tab="districts"]').click();
  await expect(page.locator('[data-travel="neon-district"]')).toBeDisabled();
  await page.locator('[data-phone-tab="sponsors"]').click();
  await page.locator('[data-sponsor="torqen-trials"]').click();
  await page.keyboard.press('p');
  await page.locator('#start-garage').click();
  await page.locator('[data-tier="1"]').click();
  await expect(page.locator('[data-tier="2"]')).toHaveText(
    'SERVE LIVELLO CARRIERA 2',
  );
  await page.locator('#garage-mode').click();
  await page.locator('[data-part="kit"]').selectOption('1');
  await page.locator('#appearance-apply').click();
  await expect(page.locator('#appearance-status')).toContainText(
    'Configurazione applicata',
  );
  await page.keyboard.press('Escape');
  await page.locator('#start-career').click();
  await startPhoneRace(page, 'sprint-quays');
  expect((await saved(page)).career.sponsorProgress).toBe(1);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await page.evaluate(() => window.__nightCircuitQA.manual());
  await page.locator('#start-career').click();
  await startPhoneRace(page, 'sprint-quays');
  await leave(page);
  await phone(page);
  await page.locator('[data-phone-tab="sponsors"]').click();
  await page.locator('#sponsor-claim').click();
  expect((await saved(page)).career.sponsorsDone).toContain('torqen-trials');
  await page.locator('[data-phone-tab="route"]').click();
  for (let i = 0; (await saved(page)).career.fame < 90 && i < 3; i++) {
    await startPhoneRace(page, 'sprint-quays');
    await leave(page);
    await phone(page);
  }
  const nemi = await startPhoneRace(page, 'rival-nemi');
  expect(nemi.race?.ranking[0].id).toBe('player');
  expect((await saved(page)).career.defeated).toEqual(['nemi']);
  console.info('Carriera: Nemi battuta, sponsor Torqen concluso.');
  await leave(page);
  await phone(page);
  await page.locator('[data-phone-tab="covers"]').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-cover="afterglow"]').click();
  const download = await downloadPromise,
    bytes = await readFile((await download.path())!);
  expect(bytes.readUInt32BE(16)).toBe(1600);
  expect(bytes.readUInt32BE(20)).toBe(900);
  await copyFile((await download.path())!, 'artifacts/phase7-cover.png');
  await expect
    .poll(async () => (await saved(page)).career.covers)
    .toContain('afterglow');
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await phone(page);
  await page.locator('[data-phone-tab="districts"]').click();
  await page.locator('[data-travel="neon-district"]').click();
  await expect(page.locator('.location')).toContainText('NEON DISTRICT');
  await page.evaluate(() => window.__nightCircuitQA.advance(3, false));
  const neon = await page.evaluate(() => window.__nightCircuitQA.state());
  expect(neon.player.y).toBeGreaterThan(0);
  expect(neon.player.y).toBeLessThan(2);
  await page.screenshot({ path: 'artifacts/phase7-neon-district.png' });
  await page.keyboard.press('g');
  await expect(
    page.getByRole('dialog', { name: 'Mappa di Neon District' }),
  ).toBeVisible();
  await page.locator('[data-poi="career-neon-district"]').click();
  await expect(page.locator('#map-info')).toContainText('GPS impostato');
  await page.keyboard.press('g');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  // The improved rivals now require the unlocked tuning, rather than staying at 24 m/s.
  await page.keyboard.press('h');
  await expect(page.locator('#garage')).toBeVisible();
  if (!(await page.locator('[data-category="engine"]').isVisible()))
    await page.locator('#garage-mode').click();
  await page.locator('[data-category="engine"]').click();
  await page.locator('[data-tier="2"]').click();
  await page.locator('[data-category="tires"]').click();
  await page.locator('[data-tier="1"]').click();
  await page.keyboard.press('Escape');
  await phone(page);
  await startPhoneRace(page, 'rival-ozra');
  expect((await saved(page)).career.defeated).toEqual(['nemi', 'ozra']);
  console.info('Carriera: Ozra battuta, Hillcrest aperto.');
  await leave(page);
  await page.keyboard.press('h');
  await page.locator('#garage-model').selectOption('lyra-r2');
  await page.locator('[data-buy-car]').first().click();
  expect((await saved(page)).cars[1].model).toBe('lyra-r2');
  await page.screenshot({ path: 'artifacts/phase7-lyra-garage.png' });
  await page.locator('[data-car="car-1"]').click();
  await page.locator('[data-save="1"]').click();
  await page.keyboard.press('Escape');
  for (const [district, rival, threshold] of [
    ['hillcrest', 'iven', 360],
    ['airport-belt', 'selki', 520],
  ] as const) {
    await phone(page);
    await page.locator('[data-phone-tab="districts"]').click();
    await page.locator(`[data-travel="${district}"]`).click();
    await expect(page.locator('.location')).toContainText(
      district === 'hillcrest' ? 'HILLCREST' : 'AIRPORT BELT',
    );
    await page.evaluate(() => window.__nightCircuitQA.advance(2, false));
    await page.screenshot({ path: `artifacts/phase7-${district}.png` });
    await phone(page);
    await page.locator('[data-phone-tab="route"]').click();
    for (let i = 0; (await saved(page)).career.fame < threshold && i < 5; i++) {
      await startPhoneRace(page, 'career-' + district);
      await leave(page);
      await phone(page);
    }
    if (rival === 'selki') {
      const catalog = JSON.parse(
        await readFile('src/data/career.json', 'utf8'),
      );
      const price = catalog.models.find(
        (m: { id: string }) => m.id === 'veylune-synova',
      ).price;
      for (
        let i = 0;
        (await saved(page)).credits < price + 12000 && i < 50;
        i++
      ) {
        await startPhoneRace(page, 'career-airport-belt');
        await leave(page);
        await phone(page);
      }
      await page.keyboard.press('p');
      await expect
        .poll(() =>
          page.evaluate(() => window.__nightCircuitQA.state().playing),
        )
        .toBe(true);
      await page.keyboard.press('h');
      await expect(page.locator('#garage')).toBeVisible();
      await page.locator('#garage-model').selectOption('veylune-synova');
      await page.locator('[data-buy-car]').first().click();
      await page.locator('[data-category="engine"]').click();
      await page.locator('[data-tier="1"]').click();
      await page.locator('[data-tier="2"]').click();
      await page.locator('[data-category="tires"]').click();
      await page.locator('[data-tier="1"]').click();
      await page.keyboard.press('Escape');
      await phone(page);
    }
    const state = await startPhoneRace(page, 'rival-' + rival);
    expect(state.race?.ranking[0].id, JSON.stringify(state)).toBe('player');
    console.info(`Carriera: ${rival} battuto.`);
    await leave(page);
  }
  await phone(page);
  await expect(page.locator('#career-phone')).toContainText(
    'Carriera principale completata',
  );
  const complete = await saved(page);
  expect(complete.career.defeated).toEqual(['nemi', 'ozra', 'iven', 'selki']);
  expect(complete.career.fame).toBeGreaterThanOrEqual(600);
  await page.locator('[data-phone-tab="messages"]').click();
  await expect(page.locator('#career-phone')).toContainText('Le quattro firme');
  expect(
    (await saved(page)).career.messages.every((m: { read: boolean }) => m.read),
  ).toBe(true);
  await page.screenshot({ path: 'artifacts/phase7-phone-complete.png' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#start-career').click();
  expect((await saved(page)).career.defeated).toHaveLength(4);
  expect((await saved(page)).cars[1].model).toBe('lyra-r2');
  await expect(page.locator('.location')).toContainText('AIRPORT BELT');
  expect(errors).toEqual([]);
});

test('fase 7: sponsor velocità da telemetria reale, livello 3 e telefono a 800 pixel', async ({
  page,
}) => {
  test.setTimeout(600000);
  const perf = JSON.parse(await readFile('src/data/performance.json', 'utf8'));
  const appearance = JSON.parse(
    await readFile('src/data/appearance.json', 'utf8'),
  );
  const prototype = JSON.parse(
    await readFile('src/data/prototype.json', 'utf8'),
  );
  const levels = Object.fromEntries(
    perf.categories.map((c: { id: string }) => [c.id, 0]),
  );
  const fixture = {
    game: 'night-circuit',
    version: 5,
    credits: 40000,
    cars: [
      {
        id: 'car-1',
        model: 'silex-c1',
        owned: levels,
        equipped: levels,
        appearance: {
          ...appearance.defaults,
          paint: prototype.car.color,
          vinyls: [],
        },
        visualOwned: [
          ...Object.keys(appearance.slots).map((k) => k + ':0'),
          'wheel:0',
        ],
      },
    ],
    activeCar: 'car-1',
    bestTimes: {},
    bestScores: {},
    results: [],
    settled: [],
    ghost: null,
    cup: null,
    career: {
      started: true,
      fame: 300,
      district: 'old-docks',
      defeated: [],
      wins: {},
      activeSponsor: null,
      sponsorProgress: 0,
      sponsorsDone: [],
      covers: [],
      messages: [{ id: 'welcome', read: true }],
    },
  };
  await page.addInitScript((profile) => {
    if (!localStorage.getItem('night-circuit:v2:auto'))
      localStorage.setItem('night-circuit:v2:auto', JSON.stringify(profile));
  }, fixture);
  await ready(page);
  await page.locator('#start-career').click();
  await page.locator('[data-phone-tab="sponsors"]').click();
  await page.locator('[data-sponsor="aervik-speed"]').click();
  await page.keyboard.press('p');
  await page.locator('#start-quick-race').click();
  await page.locator('[data-start-race="drag-channel"]').click();
  await finish(page);
  expect((await saved(page)).career.sponsorProgress).toBe(100);
  await leave(page);
  await phone(page);
  await page.locator('[data-phone-tab="sponsors"]').click();
  const before = (await saved(page)).credits;
  await page.locator('#sponsor-claim').click();
  expect((await saved(page)).credits).toBe(before + 3200);
  expect((await saved(page)).career.fame).toBeGreaterThanOrEqual(400);
  await page.setViewportSize({ width: 800, height: 850 });
  expect(
    await page
      .locator('#career-phone')
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.locator('[data-phone-tab="messages"]').click();
  await expect(page.locator('#career-phone')).toContainText(
    'Livello 3 raggiunto',
  );
  await page.screenshot({ path: 'artifacts/phase7-phone-narrow.png' });
  await page.keyboard.press('p');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('h');
  await expect(
    page.locator('#garage-model option[value="velan-gt"]'),
  ).toBeEnabled();
  await page.locator('#garage-model').selectOption('velan-gt');
  await page.locator('[data-buy-car]').first().click();
  expect((await saved(page)).cars[1].model).toBe('velan-gt');
  await page.locator('[data-save="2"]').click();
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('r');
  await page.keyboard.down('w');
  await page.evaluate(() => window.__nightCircuitQA.advance(3, false));
  await page.keyboard.up('w');
  expect(
    Math.abs(
      (await page.evaluate(() => window.__nightCircuitQA.state())).player.speed,
    ),
  ).toBeGreaterThan(5);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#start-career').click();
  expect((await saved(page)).career.sponsorsDone).toContain('aervik-speed');
  await page.keyboard.press('Tab');
  expect(
    await page.evaluate(() =>
      document.querySelector('#career-phone')!.contains(document.activeElement),
    ),
  ).toBe(true);
});

test('fase 7: garage pieno, sostituzione con trasferimento e ripristino della copia precedente', async ({
  page,
}) => {
  test.setTimeout(600000);
  const perf = JSON.parse(await readFile('src/data/performance.json', 'utf8'));
  const visual = JSON.parse(await readFile('src/data/appearance.json', 'utf8'));
  const prototype = JSON.parse(
    await readFile('src/data/prototype.json', 'utf8'),
  );
  const levels = Object.fromEntries(
    perf.categories.map((c: { id: string }) => [c.id, 0]),
  );
  const profile = {
    game: 'night-circuit',
    version: 5,
    credits: 40000,
    cars: [1, 2, 3].map((i) => ({
      id: 'car-' + i,
      model: 'silex-c1',
      owned: { ...levels, engine: i === 1 ? 1 : 0 },
      equipped: { ...levels, engine: i === 1 ? 1 : 0 },
      appearance: {
        ...visual.defaults,
        paint: prototype.car.color,
        parts: { ...visual.defaults.parts, kit: i === 1 ? 1 : 0 },
        vinyls: [],
      },
      visualOwned: [
        ...Object.keys(visual.slots).map((k) => k + ':0'),
        'wheel:0',
        ...(i === 1 ? ['kit:1'] : []),
      ],
    })),
    activeCar: 'car-1',
    bestTimes: {},
    bestScores: {},
    results: [],
    settled: [],
    ghost: null,
    cup: null,
    career: {
      started: true,
      fame: 400,
      district: 'old-docks',
      defeated: [],
      wins: {},
      activeSponsor: null,
      sponsorProgress: 0,
      sponsorsDone: [],
      covers: [],
      messages: [],
    },
  };
  await page.addInitScript((p) => {
    if (!localStorage.getItem('night-circuit:v2:auto'))
      localStorage.setItem('night-circuit:v2:auto', JSON.stringify(p));
  }, profile);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await page.locator('#start-garage').click();
  await expect(page.locator('[data-buy-car]')).toHaveCount(0);
  await page.locator('#garage-model').selectOption('velan-gt');
  await page.locator('[data-trade-car="car-1"]').click();
  expect((await saved(page)).credits).toBe(40000);
  expect((await saved(page)).cars[0].model).toBe('silex-c1');
  await page.locator('[data-cancel-trade]').click();
  expect((await saved(page)).credits).toBe(40000);
  await page.locator('[data-trade-car="car-1"]').click();
  await page.locator('[data-confirm-trade="car-1"]').click();
  const next = await saved(page);
  expect(next.credits).toBe(22500);
  expect(next.cars).toHaveLength(3);
  expect(next.cars[0].model).toBe('velan-gt');
  expect(next.cars[0].equipped.engine).toBe(1);
  expect(next.cars[0].appearance.parts.kit).toBe(1);
  expect(next.cars.slice(1)).toEqual(profile.cars.slice(1));
  await page.locator('#garage').evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({ path: 'artifacts/phase7-full-garage.png' });
  await page.locator('#save-backup').click();
  expect((await saved(page)).credits).toBe(40000);
  expect((await saved(page)).cars[0].model).toBe('silex-c1');
  await page.locator('#save-backup').click();
  expect((await saved(page)).credits).toBe(22500);
  expect((await saved(page)).cars[0].model).toBe('velan-gt');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  expect((await saved(page)).cars[0].equipped.engine).toBe(1);
  expect(errors).toEqual([]);
});
