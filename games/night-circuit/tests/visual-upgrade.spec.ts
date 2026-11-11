import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync('src/data/career.json', 'utf8'));

test('asset originali: 51 GLB, parti, UV, AO e budget geometrico', async () => {
  const manifest = JSON.parse(
    readFileSync('public/models/manifest.json', 'utf8'),
  );
  expect(manifest.cars).toHaveLength(51);
  for (const car of data.models) {
    const bytes = readFileSync(`public/models/${car.id}.glb`);
    expect(bytes.readUInt32LE(0), car.id).toBe(0x46546c67);
    const json = JSON.parse(
      bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString(),
    );
    let triangles = 0;
    for (const mesh of json.meshes)
      for (const primitive of mesh.primitives) {
        triangles += json.accessors[primitive.indices].count / 3;
        expect(primitive.attributes.TEXCOORD_0, car.id).toBeDefined();
      }
    expect(triangles, car.id).toBeGreaterThanOrEqual(3000);
    expect(triangles, car.id).toBeLessThanOrEqual(8000);
    expect(json.images.length, car.id).toBeGreaterThan(0);
    const nodes = json.nodes.map((n: { name: string }) => n.name);
    for (const name of [
      'scocca',
      'cofano',
      'paraurti_ant',
      'paraurti_post',
      'minigonna_sx',
      'minigonna_dx',
      'specchietto_sx',
      'specchietto_dx',
      'ruota_ant_sx',
      'ruota_ant_dx',
      'ruota_post_sx',
      'ruota_post_dx',
    ])
      expect(nodes, car.id).toContain(name);
    expect(
      manifest.cars.find((m: { id: string }) => m.id === car.id).triangles,
    ).toBe(triangles);
  }
});

test('GLB compressi: i volumi visibili contengono i vertici di tutte le 51 auto', async ({
  page,
}) => {
  test.setTimeout(300000);
  await page.goto('/?debug=textures', { waitUntil: 'domcontentloaded' });
  const invalid = await page.evaluate(
    async (ids: string[]) => {
      const path = '/src/vehicle/generated.ts';
      const module = await import(path);
      const failures: string[] = [];
      for (const id of ids) {
        await module.prepareDetailedCarModels([id]);
        const car = module.createDetailedCar({ model: id, simple: true });
        car.root.traverse(
          (object: {
            isMesh?: boolean;
            name: string;
            geometry: {
              boundingSphere: {
                center: { x: number; y: number; z: number };
                radius: number;
              } | null;
              computeBoundingSphere(): void;
              attributes: {
                position: {
                  count: number;
                  getX(i: number): number;
                  getY(i: number): number;
                  getZ(i: number): number;
                };
              };
            };
          }) => {
            if (!object.isMesh) return;
            const geometry = object.geometry;
            if (!geometry.boundingSphere) geometry.computeBoundingSphere();
            const sphere = geometry.boundingSphere!,
              position = geometry.attributes.position;
            for (let i = 0; i < position.count; i++)
              if (
                Math.hypot(
                  position.getX(i) - sphere.center.x,
                  position.getY(i) - sphere.center.y,
                  position.getZ(i) - sphere.center.z,
                ) >
                sphere.radius + 0.0001
              ) {
                failures.push(id + '/' + object.name);
                break;
              }
          },
        );
        car.dispose();
      }
      return failures;
    },
    data.models.map((m: { id: string }) => m.id),
  );
  expect(invalid).toEqual([]);
});

test('revisione visiva: guida nel sottopasso e fuori, modello GLB reale', async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/?qa=race&quality=low', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Densità traffico').selectOption('0');
  await page.locator('#start').click({ timeout: 180000 });
  await expect(page.locator('#overlay')).toBeHidden();
  const state = await page.evaluate(() => {
    const api = (
      window as unknown as {
        __nightCircuitQA: {
          manual(v: boolean): void;
          advance(
            s: number,
            auto: boolean,
          ): {
            player: { modelSource: string; modelTriangles: number; y: number };
          };
        };
      }
    ).__nightCircuitQA;
    api.manual(true);
    return api.advance(1, false);
  });
  expect(state.player.modelSource).toBe('/models/silex-c1.glb');
  expect(state.player.modelTriangles).toBeGreaterThanOrEqual(3000);
  expect(state.player.modelTriangles).toBeLessThanOrEqual(8000);
  await page.screenshot({
    path: 'artifacts/visual-underpass-final.png',
    timeout: 120000,
  });
  await page.keyboard.down('w');
  const driven = await page.evaluate(() => {
    const api = (
      window as unknown as {
        __nightCircuitQA: {
          advance(
            s: number,
            auto: boolean,
          ): {
            player: { z: number; speed: number; y: number; collided: boolean };
          };
        };
      }
    ).__nightCircuitQA;
    return api.advance(7, false);
  });
  await page.keyboard.up('w');
  expect(driven.player.z).toBeGreaterThan(-250);
  expect(driven.player.speed).toBeGreaterThan(15);
  expect(driven.player.y).toBeGreaterThan(0.2);
  await page.screenshot({
    path: 'artifacts/visual-city-final.png',
    timeout: 120000,
  });
  await page.keyboard.press('h');
  await expect(page.locator('#garage')).toBeVisible();
  await page.locator('#garage-mode').click();
  await page.locator('[data-part="kit"]').selectOption('3');
  await page.locator('[data-field="wheel"]').selectOption('12');
  await page.locator('[data-part="spoiler"]').selectOption('2');
  await page.locator('[data-field="spinner"]').check();
  await page.screenshot({
    path: 'artifacts/visual-garage-final.png',
    timeout: 120000,
  });
  expect(errors).toEqual([]);
});
