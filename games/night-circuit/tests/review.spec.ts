import { test, expect } from '@playwright/test';
test('review: quadranti analogici seguono fisica, unità e lingua anche a 800 pixel', async ({
  page,
}) => {
  await page.goto('/?quality=low&qa=race', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled({ timeout: 90000 });
  await page.evaluate(() => window.__nightCircuitQA.manual());
  await page.getByLabel('Densità traffico').selectOption('0');
  await page.locator('#start').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.down('w');
  const state = await page.evaluate(() =>
    window.__nightCircuitQA.advance(4, false),
  );
  await page.keyboard.up('w');
  expect(state.player.speed).toBeGreaterThan(10);
  await expect(page.locator('#speed-dial')).toHaveAttribute(
    'aria-valuenow',
    String(Math.round(state.player.speed * 3.6)),
  );
  await expect(page.locator('#rpm-dial')).toHaveAttribute(
    'aria-valuenow',
    String(Math.round(state.player.rpm)),
  );
  const angle = Number(
    (await page
      .locator('#speed-dial .dial-needle')
      .getAttribute('transform'))!.match(/rotate\(([-\d.]+)/)![1],
  );
  const maximum = Number(
    await page.locator('#speed-dial').getAttribute('aria-valuemax'),
  );
  expect(angle).toBeCloseTo(
    -120 + Math.min(1, (state.player.speed * 3.6) / maximum) * 240,
    3,
  );
  await page.keyboard.press('o');
  await page.locator('[data-setting="units"]').selectOption('mph');
  await page.locator('[data-setting="language"]').selectOption('en');
  await page.locator('#close-settings').click();
  await expect(
    page.getByRole('meter', { name: 'Speedometer', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('meter', { name: 'Tachometer', exact: true }),
  ).toBeVisible();
  await expect(page.locator('#speed-dial')).toHaveAttribute(
    'aria-valuenow',
    String(Math.round(state.player.speed * 2.236936)),
  );
  await expect(page.locator('#speed-dial .dial-unit')).toHaveText('MPH');
  await page.setViewportSize({ width: 800, height: 850 });
  const mini = (await page.locator('.mini-wrap').boundingBox())!,
    cluster = (await page.locator('.speed-cluster').boundingBox())!;
  expect(mini.x + mini.width).toBeLessThan(cluster.x);
  await page.screenshot({ path: 'artifacts/review/hud-analog-800.png' });
});

test('review: la qualità di emergenza nell’URL non modifica la preferenza salvata', async ({
  page,
}) => {
  await page.goto('/?quality=low', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled({ timeout: 90000 });
  await page.locator('#start-settings').click();
  await expect(page.locator('[data-setting="quality"]')).toHaveValue('low');
  await page.locator('[data-setting="master"]').evaluate((el) => {
    (el as HTMLInputElement).value = '.5';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('night-circuit:preferences:v1')!)
          .quality,
    ),
  ).toBe('medium');
  await page.locator('[data-setting="quality"]').selectOption('high');
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('night-circuit:preferences:v1')!)
          .quality,
    ),
  ).toBe('high');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await expect(page.locator('#quality')).toHaveValue('high');
});
