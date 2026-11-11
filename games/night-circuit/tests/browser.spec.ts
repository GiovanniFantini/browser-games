import { test, expect, type Page } from '@playwright/test';

async function accelerate(page: Page) {
  await page.keyboard.down('w');
  await expect
    .poll(async () => Number(await page.locator('#speed').textContent()), {
      timeout: 60000,
    })
    .toBeGreaterThan(20);
  await page.keyboard.up('w');
}

test('fase 1: guida, audio, camere, nitro, pausa e reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?world=track&quality=low', {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('#quality').selectOption('low');
  await page.getByRole('button', { name: 'ENTRA IN PISTA ↗' }).click();
  await expect(page.locator('#overlay')).toBeHidden();
  await accelerate(page);
  await page.keyboard.down('w');
  await page.keyboard.down('Shift');
  await expect(page.locator('#status')).toHaveText('NITRO ATTIVO');
  await page.keyboard.up('Shift');
  await page.keyboard.up('w');
  for (const camera of ['LONTANA', 'COFANO', 'PARAURTI', 'VICINA']) {
    await page.keyboard.press('c');
    await expect(page.locator('#camera')).toHaveText(camera);
  }
  await page.keyboard.press('m');
  await expect(page.locator('#sound')).toHaveText('AUDIO OFF');
  await page.keyboard.press('Escape');
  await expect(page.locator('#overlay')).toBeVisible();
  await page.locator('#quality').selectOption('low');
  await page.getByRole('button', { name: 'RIPRENDI LA GUIDA ↗' }).click();
  await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('r');
  await page.keyboard.press('F3');
  await expect(page.locator('#speed')).toHaveText('000');
  await expect(page.locator('#debug')).toContainText('Fisica 60 Hz');
  await page.screenshot({ path: 'artifacts/phase1-driving.png' });
  expect(errors).toEqual([]);
});

test('fase 2: quartiere, mappa, GPS, filtri e traffico', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?quality=low', { waitUntil: 'domcontentloaded' });
  await page.locator('#quality').selectOption('low');
  await page.getByLabel('Densità traffico').selectOption('0');
  await page.getByRole('button', { name: 'ENTRA IN PISTA ↗' }).click();
  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('#minimap')).toBeVisible();
  await accelerate(page);
  await page.keyboard.press('g');
  await expect(
    page.getByRole('dialog', { name: 'Mappa di Old Docks' }),
  ).toBeVisible();
  await page.locator('[data-poi="workshop"]').click();
  await expect(page.locator('#map-info')).toContainText(
    'GPS impostato: Officina Torqen',
  );
  await page.getByLabel('Negozi', { exact: true }).uncheck();
  await expect(page.locator('[data-poi="workshop"]')).toBeHidden();
  await page.getByLabel('Negozi', { exact: true }).check();
  await page.screenshot({ path: 'artifacts/phase2-map.png' });
  await page.getByRole('button', { name: 'TORNA ALLA GUIDA G' }).click();
  await expect(page.locator('.city-map')).toBeHidden();
  await expect(page.locator('#gps-info')).toContainText('Officina Torqen');
  await page.getByRole('button', { name: 'Ruota minimappa' }).click();
  await expect(page.locator('#rotate-map')).toHaveText('AUTO ↑');
  await page.keyboard.press('Escape');
  await page.getByLabel('Densità traffico').selectOption('32');
  await page.getByRole('button', { name: 'RIPRENDI LA GUIDA ↗' }).click();
  await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('r');
  await expect(page.locator('#speed')).toHaveText('000');
  const minimap = await page.locator('.mini-wrap').boundingBox();
  const speedometer = await page.locator('.speed-cluster').boundingBox();
  expect(minimap!.x + minimap!.width).toBeLessThanOrEqual(speedometer!.x);
  await page.screenshot({ path: 'artifacts/phase2-driving.png' });
  expect(errors).toEqual([]);
});

test('fase 2: clic sulla strada, cancella GPS e chiude dai filtri', async ({
  page,
}) => {
  await page.goto('/?quality=low', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'ENTRA IN PISTA ↗' }).click();
  await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('g');
  await expect(page.locator('.city-map')).toBeVisible();
  await page.locator('#city-canvas').click({ position: { x: 250, y: 250 } });
  await expect(page.locator('#map-info')).toContainText(
    'GPS impostato: Destinazione sulla strada',
  );
  await page.locator('#clear-gps').click();
  await expect(page.locator('#map-info')).toHaveText('Percorso cancellato.');
  await page.getByLabel('Negozi', { exact: true }).uncheck();
  await page.keyboard.press('g');
  await expect(page.locator('.city-map')).toBeHidden();
});
