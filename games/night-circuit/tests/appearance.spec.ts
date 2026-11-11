import { expect, test } from '@playwright/test';
import { readFile, copyFile } from 'node:fs/promises';

test('fase 5: vinili sul kit largo e trascinamento preciso nell’editor ridimensionato', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 850 });
  await page.goto('/?quality=low', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#start-garage').click();
  await page.locator('#garage-mode').click();
  await page.locator('[data-part="kit"]').selectOption('5');
  await page.locator('[data-visual-tab="vinyl"]').click();
  await page.locator('#vinyl-add').click();
  await page.locator('[data-layer="mirror"]').check();
  const points = await page.locator('#vinyl-workspace').evaluate((svg) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM()!;
    const from = new DOMPoint(260, 90).matrixTransform(matrix),
      to = new DOMPoint(390, 45).matrixTransform(matrix);
    return { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y } };
  });
  await page.mouse.move(points.from.x, points.from.y);
  await page.mouse.down();
  await page.mouse.move(points.to.x, points.to.y, { steps: 4 });
  await page.mouse.up();
  await page.locator('#appearance-apply').click();
  await expect(page.locator('#appearance-status')).toContainText(
    'Configurazione applicata',
  );
  const layer = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).cars[0]
        .appearance.vinyls[0],
  );
  expect(layer.x).toBeCloseTo(0.75, 2);
  expect(layer.y).toBeCloseTo(0.25, 2);
  await page.locator('[data-vinyl-view="left"]').click();
  await page.locator('#studio-photo').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#photo-export').click();
  const download = await downloadPromise;
  await copyFile((await download.path())!, 'artifacts/phase5-wide-kit.png');
  await page.keyboard.press('Escape');
  expect(
    await page
      .locator('#garage')
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
});

test('fase 5: elaborazione visiva, vinili, anteprima, acquisto e persistenza in strada', async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/?quality=low&qa=race', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#start-garage').click();
  await page.locator('#garage-mode').click();
  await expect(page.locator('[data-part="kit"] option')).toHaveCount(6);
  await expect(page.locator('[data-field="wheel"] option')).toHaveCount(30);
  for (const [key, value] of Object.entries({
    kit: '1',
    hood: '2',
    roof: '2',
    spoiler: '2',
    audio: '1',
  }))
    await page.locator(`[data-part="${key}"]`).selectOption(value);
  await page.locator('[data-field="wheel"]').selectOption('12');
  await page.locator('[data-field="diameter"]').evaluate((el) => {
    (el as HTMLInputElement).value = '20';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('[data-field="spinner"]').check();
  await page.locator('[data-visual-tab="color"]').click();
  await page.locator('[data-part="finish"]').selectOption('4');
  await page.locator('[data-part="neon"]').selectOption('3');
  for (const [key, value] of Object.entries({
    paint: '#8a3cf0',
    secondary: '#1ddacb',
    rims: '#deba64',
    calipers: '#ff566f',
    neonColor: '#05e6ee',
    hudColor: '#ef5dad',
    nitroColor: '#65e856',
  }))
    await page.locator(`[data-field="${key}"]`).evaluate((input, value) => {
      (input as HTMLInputElement).value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  await page.locator('[data-visual-tab="vinyl"]').click();
  await page.locator('#vinyl-shape').selectOption('flame');
  await page.locator('#vinyl-add').click();
  await page.locator('[data-layer="mirror"]').check();
  const points = await page.locator('#vinyl-workspace').evaluate((svg) => {
    const matrix = (svg as SVGSVGElement).getScreenCTM()!;
    const from = new DOMPoint(260, 90).matrixTransform(matrix),
      to = new DOMPoint(338, 72).matrixTransform(matrix);
    return { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y } };
  });
  await page.mouse.move(points.from.x, points.from.y);
  await page.mouse.down();
  await page.mouse.move(points.to.x, points.to.y, { steps: 4 });
  await page.mouse.up();
  await page.locator('[data-layer="rotation"]').evaluate((el) => {
    (el as HTMLInputElement).value = '25';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#vinyl-duplicate').click();
  await page.locator('#vinyl-down').click();
  await page.locator('#vinyl-up').click();
  await page.locator('#vinyl-side').selectOption('hood');
  await page.locator('#vinyl-shape').selectOption('sigil');
  await page.locator('#vinyl-add').click();
  await expect(page.locator('#vinyl-layers button')).toHaveCount(3);
  await page.locator('[data-pose="doors"]').check();
  await page.locator('[data-pose="hood"]').check();
  await page.locator('[data-pose="hatch"]').check();
  await page.locator('#studio-jump').click();
  await page.locator('#appearance-apply').click();
  await expect(page.locator('#appearance-status')).toContainText(
    'Configurazione applicata',
  );
  const profile = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('night-circuit:v2:auto')!),
  );
  expect(profile.version).toBe(6);
  expect(profile.credits).toBeLessThan(12000);
  expect(profile.cars[0].appearance.vinyls).toHaveLength(3);
  expect(
    profile.cars[0].appearance.vinyls.filter(
      (l: { mirror: boolean }) => l.mirror,
    ),
  ).toHaveLength(2);
  await expect(page.locator('#appearance-apply')).toBeDisabled();
  await page.locator('#garage').evaluate((el) => el.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/phase5-editor.png' });
  await page.locator('#studio-photo').click();
  await expect(page.locator('#photo-studio')).toBeVisible();
  await page.locator('#photo-filter').selectOption('noir');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#photo-export').click();
  const download = await downloadPromise;
  const bytes = await readFile((await download.path())!);
  expect(bytes.readUInt32BE(16)).toBe(1600);
  expect(bytes.readUInt32BE(20)).toBe(900);
  await copyFile((await download.path())!, 'artifacts/phase5-photo.png');
  const pixels = await page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob(),
      image = await createImageBitmap(blob),
      canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, 1600, 900).data;
    let nonBlack = 0,
      difference = 0;
    for (let i = 0; i < data.length; i += 4 * 67) {
      if (data[i] + data[i + 1] + data[i + 2] > 90) nonBlack++;
      difference = Math.max(
        difference,
        Math.abs(data[i] - data[i + 1]),
        Math.abs(data[i + 1] - data[i + 2]),
      );
    }
    return { nonBlack, difference };
  }, bytes.toString('base64'));
  expect(pixels.nonBlack).toBeGreaterThan(100);
  expect(pixels.difference).toBeLessThanOrEqual(2);
  await page.keyboard.press('Escape');
  await expect(page.locator('#photo-studio')).toBeHidden();
  await expect(page.locator('#garage')).toBeVisible();
  await page.locator('#garage-close').click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled();
  await page.locator('#start-garage').click();
  await page.locator('#garage-mode').click();
  await expect(page.locator('[data-part="kit"]')).toHaveValue('1');
  await expect(page.locator('[data-field="wheel"]')).toHaveValue('12');
  await page.locator('[data-part="kit"]').selectOption('5');
  await page.locator('#garage-close').click();
  await page.keyboard.press('h');
  await page.locator('#garage-mode').click();
  await expect(page.locator('[data-part="kit"]')).toHaveValue('1');
  expect(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem('night-circuit:v2:auto')!),
      )
    ).credits,
  ).toBe(profile.credits);
  await page.locator('#garage-close').click();
  await page.locator('#start').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('.speed-number')).toHaveCSS(
    'color',
    'rgb(239, 93, 173)',
  );
  await page.keyboard.press('c');
  await page.screenshot({ path: 'artifacts/phase5-street.png' });
  expect(errors).toEqual([]);
});
