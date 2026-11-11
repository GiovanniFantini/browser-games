import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function ready(page: Page) {
  await page.goto('/?quality=low&qa=race', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await expect
    .poll(() => page.evaluate(() => typeof window.__nightCircuitQA))
    .toBe('object');
  await page.evaluate(() => window.__nightCircuitQA.manual());
}
const saved = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem('night-circuit:v2:auto')!),
  );

test('fase 4: negozio, garage 360°, due auto indipendenti, tre slot e persistenza', async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  await page.locator('#start-garage').click();
  await expect(page.locator('#garage')).toBeVisible();
  await expect(page.locator('#garage-preview canvas')).toBeVisible();
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).playing,
  ).toBe(false);
  await expect(page.locator('#garage-wallet')).toContainText('12.000');
  await expect(page.locator('[data-tier="2"]')).toBeDisabled();
  const categories = await page
    .locator('[data-category]')
    .evaluateAll((buttons) =>
      buttons.map((button) => (button as HTMLElement).dataset.category!),
    );
  expect(categories).toHaveLength(11);
  for (const category of categories) {
    await page.locator(`[data-category="${category}"]`).click();
    await expect(page.locator('.part-cards article')).toHaveCount(3);
  }
  await page.locator('[data-category="engine"]').click();
  await page.locator('[data-tier="1"]').click();
  await expect(page.locator('#garage-wallet')).toContainText('10.200');
  await expect(page.locator('[data-tier="1"]')).toHaveText('INSTALLATO');
  await page.locator('#garage-stock').click();
  await expect(page.locator('[data-tier="1"]')).toHaveText('INSTALLA');
  await page.locator('[data-tier="1"]').click();
  await expect(page.locator('#garage-wallet')).toContainText('10.200');
  await page.locator('.garage-car summary').click();
  await expect(page.locator('.garage-car svg')).toBeVisible();
  const preview = page.locator('#garage-preview canvas');
  const box = (await preview.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 60,
    box.y + box.height / 2 + 20,
    { steps: 5 },
  );
  await page.mouse.up();
  await page.mouse.wheel(0, -150);
  await page.screenshot({ path: 'artifacts/phase4-garage.png' });
  await page.locator('[data-save="1"]').click();
  await page.locator('[data-buy-car]').first().click();
  await expect(page.locator('#garage-wallet')).toContainText('1200');
  await expect(page.locator('[data-tier="1"]')).toHaveText(
    'CREDITI INSUFFICIENTI',
  );
  await page.locator('[data-category="brakes"]').click();
  await page.locator('[data-tier="1"]').click();
  await page.locator('[data-save="2"]').click();
  await page.locator('[data-save="3"]').click();
  const profile = await saved(page);
  expect(profile.cars[0].equipped.engine).toBe(1);
  expect(profile.cars[0].equipped.brakes).toBe(0);
  expect(profile.cars[1].equipped.engine).toBe(0);
  expect(profile.cars[1].equipped.brakes).toBe(1);
  expect(profile.credits).toBe(400);
  await page.locator('[data-load="1"]').click();
  expect((await saved(page)).cars).toHaveLength(1);
  await page.locator('#save-backup').click();
  expect((await saved(page)).cars).toHaveLength(2);
  await page.locator('[data-car="car-1"]').click();
  await page.locator('#garage-close').click();
  await expect(page.locator('#garage')).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await page.keyboard.press('h');
  await expect(page.locator('#garage-wallet')).toContainText('400');
  await page.locator('[data-category="engine"]').click();
  await expect(page.locator('[data-tier="1"]')).toHaveText('INSTALLATO');
  await expect(page.locator('.garage-cars h3')).toContainText('2 di 3');
  await page.locator('#garage-close').click();
  await page.locator('#start').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('h');
  await expect(page.locator('#garage')).toBeVisible();
  const before = await page.evaluate(
    () => window.__nightCircuitQA.state().player,
  );
  await page.evaluate(() => window.__nightCircuitQA.advance(2, false));
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).player,
  ).toEqual(before);
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.evaluate(() => window.__nightCircuitQA.manual());
  await page.keyboard.down('w');
  for (let i = 0; i < 15; i++) {
    const state = await page.evaluate(() =>
      window.__nightCircuitQA.advance(1, false),
    );
    if (state.player.z > -259) break;
  }
  await page.keyboard.up('w');
  await expect(page.locator('#garage-interact')).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.locator('#garage')).toBeVisible();
  expect(errors).toEqual([]);
});

test('fase 4: export, import validato e migrazione v1, tre posti, saldo e anteprima stretta', async ({
  page,
}) => {
  await ready(page);
  await page.locator('#start-garage').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#save-export').click();
  const download = await downloadPromise;
  const exported = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(exported.version).toBe(6);
  expect(exported.credits).toBe(12000);
  await page.locator('#save-import').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...exported, credits: -1 })),
  });
  await expect(page.locator('#garage-status')).toContainText(
    'Saldo non valido',
  );
  await expect(page.locator('#import-preview')).toBeHidden();
  await expect(page.locator('#garage-wallet')).toContainText('12.000');
  await page.locator('#save-import').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('#garage')).toBeHidden();
  await page.keyboard.press('h');
  await expect(page.locator('#garage')).toBeVisible();
  const legacy = {
    game: 'night-circuit',
    version: 1,
    credits: 50000,
    upgrades: { ...exported.cars[0].owned, exhaust: 2, nitro: 3 },
  };
  await page.locator('#save-import').setInputFiles({
    name: 'legacy.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect(page.locator('#import-preview')).toBeVisible();
  await expect(page.locator('#garage-wallet')).toContainText('12.000');
  await page.locator('#import-apply').click();
  await expect(page.locator('#garage-wallet')).toContainText('50.000');
  expect((await saved(page)).cars[0].equipped.nitro).toBe(3);
  await page.locator('[data-buy-car]').first().click();
  await page.locator('[data-buy-car]').click();
  await expect(page.locator('.garage-cars h3')).toContainText('3 di 3');
  await expect(page.locator('[data-buy-car]')).toHaveCount(0);
  expect((await saved(page)).credits).toBe(32000);
  await page.setViewportSize({ width: 800, height: 850 });
  await page.locator('#garage').evaluate((el) => el.scrollTo(0, 0));
  expect(
    await page
      .locator('#garage')
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: 'artifacts/phase4-garage-narrow.png' });
  await page.keyboard.press('F3');
  await expect(page.locator('#debug-credits')).toHaveText(
    'CREDITI INFINITI: OFF',
  );
  await page.locator('#debug-credits').click();
  await page.locator('[data-tier="1"]').click();
  expect((await saved(page)).credits).toBe(1000000000);
  await page.locator('#debug-credits').click();
  await page.keyboard.press('F3');
  await expect(page.locator('#debug-credits')).toHaveCount(0);
});
