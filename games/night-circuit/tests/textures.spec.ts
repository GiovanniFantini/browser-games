import { test, expect } from '@playwright/test';

test('texture: mappe, seed, cache persistente e anteprima 3D', async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (req) => {
    if (
      /^https?:/.test(req.url()) &&
      !req.url().startsWith('http://127.0.0.1:5175')
    )
      external.push(req.url());
  });
  await page.goto('/?debug=textures');
  const status = page.locator('#texture-status');
  await expect(status).toHaveAttribute('data-ready', 'true');
  await expect(status).toHaveAttribute('data-generated', '17');
  await expect(page.locator('.texture-row')).toHaveCount(17);
  await expect(page.locator('.texture-map img')).toHaveCount(68);
  const dimensions = await page
    .locator('.texture-map img')
    .evaluateAll((images) =>
      images.every((image) => (image as HTMLImageElement).naturalWidth === 512),
    );
  expect(dimensions).toBe(true);
  await page.screenshot({ path: 'artifacts/textures-lab.png' });
  await page.locator('[data-id="facade-amber"] .texture-name').click();
  await expect(page.locator('#preview-name')).toHaveText('Facciata ambra');
  await page.locator('.texture-preview').scrollIntoViewIfNeeded();
  await page
    .locator('.texture-preview')
    .screenshot({ path: 'artifacts/textures-facade-pbr.png' });
  await page.locator('#texture-view').selectOption('albedo');
  await page
    .locator('#texture-grid')
    .screenshot({ path: 'artifacts/textures-albedo.png' });
  await page.locator('[data-id="brick-russet"] [data-map="albedo"]').click();
  await expect(page.locator('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.reload();
  await expect(status).toHaveAttribute('data-hits', '17');
  await expect(status).toHaveAttribute('data-generated', '0');
  // Compare decoded pixels, including normal and emission, across independent worker generations.
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite serves this browser module directly.
    const { generateTexture, MAPS } =
      await import('/src/gen/textures/generator.ts');
    const digest = async (blob: Blob) => {
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            'SHA-256',
            ctx.getImageData(0, 0, canvas.width, canvas.height).data,
          ),
        ),
      ).join(',');
    };
    const a = await generateTexture('facade-amber', 123, 256),
      b = await generateTexture('facade-amber', 123, 256),
      c = await generateTexture('facade-amber', 124, 256);
    const first = await Promise.all(
      MAPS.map((key: string) => digest(a.maps[key])),
    );
    const second = await Promise.all(
      MAPS.map((key: string) => digest(b.maps[key])),
    );
    return {
      same: JSON.stringify(first) === JSON.stringify(second),
      different:
        (await digest(a.maps.albedo)) !== (await digest(c.maps.albedo)),
    };
  });
  expect(result).toEqual({ same: true, different: true });
  await page.locator('#texture-seed').fill('42');
  await page.locator('#texture-size').selectOption('256');
  await page
    .getByRole('button', { name: 'Genera / carica', exact: true })
    .click();
  await expect(status).toContainText('17 generati');
  await expect(page.locator('.texture-map img').first()).toHaveJSProperty(
    'naturalWidth',
    256,
  );
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('texture: senza IndexedDB la generazione resta disponibile', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get: () => {
        throw new Error('Storage disabled');
      },
    });
  });
  await page.goto('/?debug=textures');
  await expect(page.locator('#texture-status')).toHaveAttribute(
    'data-ready',
    'true',
  );
  await expect(page.locator('#texture-status')).toContainText(
    'Cache non disponibile',
  );
  await expect(page.locator('.texture-row')).toHaveCount(17);
});

test('texture: città guidabile con materiali procedurali', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/?quality=low');
  await page
    .getByRole('button', { name: 'ENTRA IN PISTA ↗' })
    .click({ timeout: 120000 });
  await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.down('w');
  await expect
    .poll(async () => Number(await page.locator('#speed').textContent()), {
      timeout: 60000,
    })
    .toBeGreaterThan(15);
  await page.keyboard.up('w');
  await page.screenshot({ path: 'artifacts/textures-city.png' });
  expect(errors).toEqual([]);
});
