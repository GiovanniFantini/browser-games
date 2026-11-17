import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const perf = JSON.parse(await readFile('src/data/performance.json', 'utf8'));
const appearance = JSON.parse(
  await readFile('src/data/appearance.json', 'utf8'),
);
const levels = Object.fromEntries(
  perf.categories.map((c: { id: string }) => [c.id, 0]),
);
const freshProfile = () => ({
  game: 'night-circuit',
  version: 6,
  exploration: [],
  credits: 0,
  cars: [
    {
      id: 'car-1',
      model: 'silex-c1',
      owned: levels,
      equipped: levels,
      appearance: { ...appearance.defaults, paint: '#bccb44', vinyls: [] },
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
    started: false,
    fame: 0,
    district: 'old-docks',
    defeated: [] as string[],
    wins: {},
    activeSponsor: null,
    sponsorProgress: 0,
    sponsorsDone: [],
    covers: [],
    messages: [{ id: 'welcome', read: true }],
  },
});

const profile = () => {
  const p = freshProfile();
  p.career.started = true;
  p.career.fame = 700;
  p.career.defeated = ['nemi', 'ozra', 'iven', 'selki'];
  p.credits = 200000;
  return p;
};
async function setup(
  page: Page,
  district = 'old-docks',
  unlocked = true,
  model = 'silex-c1',
) {
  const p = profile();
  p.cars[0].model = model;
  p.career.district = district;
  if (!unlocked) p.career.defeated = [];
  await page.addInitScript((p) => {
    if (!localStorage.getItem('night-circuit:v2:auto'))
      localStorage.setItem('night-circuit:v2:auto', JSON.stringify(p));
  }, p);
  await page.goto('/?quality=low&qa=race', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled({ timeout: 90000 });
  await page.evaluate(() => window.__nightCircuitQA.manual());
  await page.getByLabel('Densità traffico').selectOption('0');
  await page.locator('#start').click({ timeout: 60000 });
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
}
async function finish(page: Page) {
  let s = await page.evaluate(() => window.__nightCircuitQA.state());
  for (let i = 0; i < 45 && s.race?.phase !== 'finished'; i++)
    s = await page.evaluate(() => window.__nightCircuitQA.advance(10, true));
  expect(s.race?.phase, JSON.stringify(s)).toBe('finished');
  expect(s.race?.player.retired, JSON.stringify(s)).toBe(false);
  return s;
}
test('fase 8: ponte continuo Old Docks Airport, gate carriera e reset nel quartiere reale', async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      m.type() === 'error' &&
      /Shader Error|VALIDATE_STATUS|ERROR: 0:|GL_INVALID/.test(m.text())
    )
      errors.push(m.text());
  });
  await setup(page);
  await page.keyboard.press('g');
  await page.locator('[data-poi="3-home"]').click();
  await page.keyboard.press('g');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.down('w');
  let s = await page.evaluate(() => window.__nightCircuitQA.state());
  for (let i = 0; i < 42 && s.player.z < 650; i++)
    s = await page.evaluate(() => window.__nightCircuitQA.advance(1, false));
  await page.keyboard.up('w');
  expect(s.player.z, JSON.stringify(s)).toBeGreaterThan(600);
  expect(Math.abs(s.player.x + 4.5)).toBeLessThan(10);
  await expect(page.locator('.location')).toContainText('AIRPORT BELT');
  await expect(page.locator('#gps-info')).toContainText('Garage del bacino');
  await page.keyboard.press('r');
  s = await page.evaluate(() => window.__nightCircuitQA.state());
  expect(s.player.z).toBeCloseTo(770, 0);
  await page.screenshot({ path: 'artifacts/phase8-airport.png' });
  expect(errors).toEqual([]);
  await page.evaluate(() => localStorage.clear());
  await page.close();
});
test('fase 8: ponte chiuso prima dello sblocco', async ({ page }) => {
  test.setTimeout(600000);
  await setup(page, 'old-docks', false);
  await page.keyboard.down('w');
  for (let i = 0; i < 4; i++)
    await page.evaluate(() => window.__nightCircuitQA.advance(10, false));
  await page.keyboard.up('w');
  const s = await page.evaluate(() => window.__nightCircuitQA.state());
  expect(s.player.z, JSON.stringify(s)).toBeLessThan(541);
  expect(s.player.z).toBeGreaterThan(530);
  await expect(page.locator('.location')).toContainText('OLD DOCKS');
});
test('fase 8: terreno Hillcrest, gara regionale e rivale su pendenze fisiche', async ({
  page,
}) => {
  test.setTimeout(900000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      m.type() === 'error' &&
      /Shader Error|VALIDATE_STATUS|ERROR: 0:|GL_INVALID/.test(m.text())
    )
      errors.push(m.text());
  });
  await setup(page, 'hillcrest');
  let s = await page.evaluate(() => window.__nightCircuitQA.advance(2, false));
  expect(s.player.y, JSON.stringify(s)).toBeGreaterThan(20);
  expect(s.player.x).toBeGreaterThan(1000);
  await page.screenshot({ path: 'artifacts/phase8-hillcrest.png' });
  await page.keyboard.press('p');
  await page.locator('[data-phone-tab="route"]').click();
  await page.locator('[data-career-race="career-hillcrest"]').click();
  s = await finish(page);
  expect(s.player.y).toBeGreaterThan(-1);
  await page.locator('#race-free').click();
  expect(errors).toEqual([]);
});
test('fase 8: impostazioni persistenti, rimappatura, salone 51 auto e pioggia con bloom', async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      m.type() === 'error' &&
      /Shader Error|VALIDATE_STATUS|ERROR: 0:|GL_INVALID/.test(m.text())
    )
      errors.push(m.text());
  });
  await setup(page);
  await page.keyboard.press('o');
  await expect(page.locator('#settings')).toBeVisible();
  await page.locator('[data-setting="units"]').selectOption('mph');
  await page.locator('[data-setting="station"]').selectOption('2');
  await page.locator('[data-bind="throttle"]').click();
  await page.keyboard.press('t');
  await page.locator('[data-pad="nitro"]').selectOption('0');
  await page.locator('[data-setting="rain"]').check();
  await page.screenshot({ path: 'artifacts/phase8-settings.png' });
  await page.locator('#close-settings').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.down('t');
  await page.evaluate(() => window.__nightCircuitQA.advance(3, false));
  await page.keyboard.up('t');
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).player.speed,
  ).toBeGreaterThan(5);
  await expect(page.locator('.speed-number small')).toHaveText('MPH');
  await page.keyboard.press('h');
  expect(await page.locator('#garage-model option').count()).toBe(51);
  await page.locator('#garage-model').selectOption({ index: 40 });
  await page.screenshot({ path: 'artifacts/phase8-showroom.png' });
  for (const [index, name] of [
    [15, 'suv'],
    [24, 'supercar'],
    [35, 'single'],
  ] as const) {
    await page.locator('#garage-model').selectOption({ index });
    await page.screenshot({ path: `artifacts/phase8-${name}.png` });
  }
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('o');
  await page.locator('[data-setting="quality"]').selectOption('medium');
  await page.locator('#close-settings').click();
  await page.screenshot({ path: 'artifacts/phase8-rain-bloom.png' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled({ timeout: 90000 });
  await page.locator('#start-settings').click();
  await expect(page.locator('[data-setting="units"]')).toHaveValue('mph');
  await expect(page.locator('[data-setting="station"]')).toHaveValue('2');
  await expect(page.locator('[data-bind="throttle"]')).toContainText('KeyT');
  expect(errors).toEqual([]);
});

test('fase 8: inglese completo nei menu, ritorno IT, frammento persistente e GPS fra quartieri', async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      m.type() === 'error' &&
      /Shader Error|VALIDATE_STATUS|ERROR: 0:|GL_INVALID/.test(m.text())
    )
      errors.push(m.text());
  });
  await setup(page);
  await page.keyboard.press('o');
  await page.locator('[data-setting="language"]').selectOption('en');
  await expect(page.locator('#settings h2')).toHaveText('Settings');
  await expect(page.locator('#close-settings')).toHaveText('BACK TO DRIVING');
  await page.locator('#close-settings').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('p');
  await expect(page.locator('#career-heading')).toHaveText('Your signature.');
  await expect(page.locator('[data-phone-tab="districts"]')).toHaveText(
    'Districts',
  );
  await page.locator('[data-phone-tab="messages"]').click();
  await page.locator('[data-phone-tab="sponsors"]').click();
  await page.locator('[data-phone-tab="covers"]').click();
  await page.locator('[data-phone-tab="route"]').click();
  await page.screenshot({ path: 'artifacts/phase8-english-phone.png' });
  const audit = [await page.locator('#career-phone').innerText()];
  await page.keyboard.press('p');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('q');
  await expect(page.locator('#races-heading')).toHaveText('Choose your race.');
  audit.push(await page.locator('#race-menu').innerText());
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('h');
  await expect(page.locator('#garage')).toContainText(
    'Born among the Basin workshops',
  );
  await page.locator('#garage-model').selectOption('drevalyn-rhelix');
  await expect(page.locator('#garage')).toContainText(
    'Drevalyn builds single-seaters',
  );
  audit.push(await page.locator('#garage').innerText());
  await page.locator('#garage-mode').click();
  audit.push(await page.locator('#garage').innerText());
  await page.locator('[data-visual-tab="color"]').click();
  audit.push(await page.locator('#garage').innerText());
  await page.locator('[data-visual-tab="vinyl"]').click();
  audit.push(await page.locator('#garage').innerText());
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('g');
  await page.locator('[data-poi="3-home"]').click();
  await expect(page.locator('#map-info')).toContainText('GPS set');
  await page.screenshot({ path: 'artifacts/phase8-world-map.png' });
  const map = page.locator('#city-canvas'),
    rect = (await map.boundingBox())!;
  await page.keyboard.down('Alt');
  await map.click({
    position: {
      x: (0.5 + (-420 - 700) / 2440) * rect.width,
      y: (0.5 + (60 - 540) / 2440) * rect.height,
    },
  });
  await page.keyboard.up('Alt');
  await page.keyboard.press('g');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.evaluate(() => window.__nightCircuitQA.advance(0.2, false));
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('night-circuit:v2:auto')!),
  );
  expect(saved.exploration).toContain('fragment-0-0');
  expect(saved.credits).toBe(200250);
  await page.keyboard.press('g');
  const dealerRect = (await page.locator('#city-canvas').boundingBox())!;
  await page.keyboard.down('Alt');
  await page.locator('#city-canvas').click({
    position: {
      x: (0.5 + (-120 - 700) / 2440) * dealerRect.width,
      y: (0.5 + (-240 - 540) / 2440) * dealerRect.height,
    },
  });
  await page.keyboard.up('Alt');
  await page.keyboard.press('g');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('e');
  await expect(page.locator('#garage')).toBeVisible();
  await expect(page.locator('#garage-model')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.press('o');
  await page.locator('[data-setting="language"]').selectOption('it');
  await expect(page.locator('#settings h2')).toHaveText('Impostazioni');
  await page.locator('#close-settings').click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled({ timeout: 90000 });
  const restored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('night-circuit:v2:auto')!),
  );
  expect(restored.exploration).toEqual(['fragment-0-0']);
  await import('node:fs/promises').then((fs) =>
    fs.writeFile('artifacts/phase8-english-audit.txt', audit.join('\n\n')),
  );
  expect(errors).toEqual([]);
});

test('fase 8: cattura il pulsante pausa del gamepad e lo usa come nitro senza chiudere il menu', async ({
  page,
}) => {
  test.setTimeout(600000);
  await page.addInitScript(() => {
    const pad = {
      mapping: 'standard',
      connected: true,
      buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })),
      axes: [0, 0],
    };
    Object.defineProperty(navigator, 'getGamepads', { value: () => [pad] });
    Object.assign(window, { __capturePad: pad });
  });
  await setup(page);
  await page.keyboard.press('o');
  await page.evaluate(() => window.__nightCircuitQA.manual(false));
  await page.locator('[data-pad-capture="nitro"]').click();
  const press = async (buttons: number[]) =>
    page.evaluate((indices) => {
      const pad = (
        window as unknown as {
          __capturePad: { buttons: { value: number; pressed: boolean }[] };
        }
      ).__capturePad;
      pad.buttons.forEach((b, i) => {
        b.value = indices.includes(i) ? 1 : 0;
        b.pressed = indices.includes(i);
      });
    }, buttons);
  await press([9]);
  await expect(page.locator('[data-pad="nitro"]')).toHaveValue('9');
  await expect(page.locator('[data-pad="pause"]')).toHaveValue('1');
  await expect(page.locator('#settings')).toBeVisible();
  await press([]);
  await page.locator('#close-settings').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.evaluate(() => window.__nightCircuitQA.manual());
  await press([7]);
  await page.evaluate(() => window.__nightCircuitQA.advance(3, false));
  await press([7, 9]);
  await page.evaluate(() => window.__nightCircuitQA.advance(1, false));
  await expect(page.locator('#status')).toHaveText('NITRO ATTIVO');
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).playing,
  ).toBe(true);
  await press([]);
  await page.keyboard.press('q');
  await page.locator('[data-start-race="drift-foundry"]').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).player.assist,
  ).toBe(true);
  await page.keyboard.press('o');
  await page.locator('[data-setting="assist"]').uncheck();
  await page.locator('[data-setting="master"]').evaluate((el) => {
    (el as HTMLInputElement).value = '.5';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.locator('#close-settings').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).player.assist,
  ).toBe(false);
  await page.locator('#race-abandon').click();
  await expect(page.locator('#race-results')).toBeVisible();
  await page.locator('#race-free').click();
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  expect(
    (await page.evaluate(() => window.__nightCircuitQA.state())).player.assist,
  ).toBe(false);
});

test('fase 8: tetto e vinile della monoposto aderenti alla copertura posteriore e guida configurata', async ({
  page,
}) => {
  test.setTimeout(600000);
  // Share the same module cache for the preload and car factory after Vite HMR.
  await page.route('**/src/**', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(\/src\/[^"'\s?]+)\?t=\d+/g,
      '$1',
    );
    await route.fulfill({ response, body });
  });
  await setup(page, 'old-docks', true, 'drevalyn-rhelix');
  await page.keyboard.press('h');
  await page.locator('#garage-mode').click();
  await page.locator('[data-part="roof"]').selectOption('2');
  await page.locator('[data-visual-tab="vinyl"]').click();
  await page.locator('#vinyl-side').selectOption('roof');
  await page.locator('#vinyl-shape').selectOption('arrow');
  await page.locator('#vinyl-add').click();
  await page.locator('#appearance-apply').click();
  await expect(page.locator('#appearance-status')).toContainText(
    'Configurazione applicata',
  );
  await page.locator('[data-view="3"]').click();
  await page.locator('#garage').evaluate((el) => el.scrollTo(0, 0));
  await page.screenshot({ path: 'artifacts/phase8-single-roof-vinyl.png' });
  const allBounds = await page.evaluate(async () => {
    const path = '/src/vehicle/model.ts',
      mod = await import(/* @vite-ignore */ path),
      generatedPath = '/src/vehicle/generated.ts',
      generated = await import(/* @vite-ignore */ generatedPath),
      threePath = '/node_modules/three/build/three.module.js',
      THREE = await import(/* @vite-ignore */ threePath),
      p = JSON.parse(localStorage.getItem('night-circuit:v2:auto')!).cars[0],
      catalogPath = '/src/data/career.json?import',
      catalog = (await import(/* @vite-ignore */ catalogPath)).default;
    await generated.prepareDetailedCarModels(
      catalog.models.map((m: { id: string }) => m.id),
    );
    type Resource = {
      addEventListener(type: 'dispose', listener: () => void): void;
    };
    type MeshResources = {
      isMesh?: boolean;
      geometry: Resource;
      material: Resource | Resource[];
    };
    const disposeChecked = (car: {
      root: { traverse(fn: (object: MeshResources) => void): void };
      dispose(): void;
    }) => {
      const resources = new Set<Resource>(),
        released = new Set<Resource>();
      car.root.traverse((object) => {
        if (!object.isMesh) return;
        resources.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          resources.add(material);
      });
      for (const resource of resources)
        resource.addEventListener('dispose', () => released.add(resource));
      car.dispose();
      return resources.size === released.size;
    };
    return catalog.models.map((model: { id: string; family: string }) => {
      const car = mod.createCar({ appearance: p.appearance, model: model.id });
      car.root.updateMatrixWorld(true);
      const cover = car.root.getObjectByName('roof-surface'),
        decal = car.root.getObjectByName('vinyl-roof');
      if (!cover || !decal)
        throw Error(`Superficie o vinile mancanti nel GLB ${model.id}`);
      const surfaceVertices = cover.geometry.attributes.position,
        decalVertices = decal.geometry.attributes.position,
        uv = decal.geometry.attributes.uv;
      let surfaceError = 0,
        uvMin = Infinity,
        uvMax = -Infinity;
      for (let i = 0; i < surfaceVertices.count; i++) {
        surfaceError = Math.max(
          surfaceError,
          Math.abs(surfaceVertices.getX(i) - decalVertices.getX(i)),
          Math.abs(surfaceVertices.getY(i) - decalVertices.getY(i)),
          Math.abs(surfaceVertices.getZ(i) - decalVertices.getZ(i)),
        );
        uvMin = Math.min(uvMin, uv.getX(i), uv.getY(i));
        uvMax = Math.max(uvMax, uv.getX(i), uv.getY(i));
      }
      const result = {
        model: model.id,
        family: model.family,
        parent: cover.parent.name,
        source: car.root.userData.assetSource,
        sameParent: cover.parent === decal.parent,
        surfaceError,
        sameVertices: surfaceVertices.count === decalVertices.count,
        transformError: Math.max(
          ...cover.matrix.elements.map((v: number, i: number) =>
            Math.abs(v - decal.matrix.elements[i]),
          ),
        ),
        polygonOffset:
          decal.material.polygonOffset &&
          decal.material.polygonOffsetFactor < 0,
        depthWrite: decal.material.depthWrite,
        carbon: cover.material.color.getHex(),
        uvMin,
        uvMax,
      };
      const surfaceReleased = disposeChecked(car);
      const ventCar = mod.createCar({
        appearance: {
          ...p.appearance,
          parts: { ...p.appearance.parts, roof: 1 },
        },
        model: model.id,
      });
      ventCar.root.updateMatrixWorld(true);
      const vent = ventCar.root.getObjectByName('roof-intake'),
        surface = ventCar.root.getObjectByName('roof-surface');
      if (!vent || !surface) throw Error(`Presa mancante nel GLB ${model.id}`);
      const vertices = vent.geometry.attributes.position,
        normals = vent.geometry.attributes.normal,
        ray = new THREE.Raycaster(),
        point = new THREE.Vector3(),
        down = new THREE.Vector3(0, -1, 0);
      let gap = 0,
        contacts = 0;
      for (let i = 0; i < vertices.count; i++) {
        if (normals.getY(i) > -0.5) continue;
        point.fromBufferAttribute(vertices, i).applyMatrix4(vent.matrixWorld);
        const y = point.y;
        point.y += 1;
        ray.set(point, down);
        const hit = ray.intersectObject(surface, false)[0];
        if (!hit) throw Error(`Base fuori dalla superficie ${model.id}`);
        gap = Math.max(gap, Math.abs(y - hit.point.y));
        contacts++;
      }
      const intake = {
        attached: vent.parent === surface,
        gap,
        contacts,
        material: vent.material.name,
        surfaceMaterial: surface.material.name,
        source: ventCar.root.userData.assetSource,
      };
      const intakeReleased = disposeChecked(ventCar);
      return { ...result, intake, surfaceReleased, intakeReleased };
    });
  });
  expect(allBounds).toHaveLength(51);
  for (const bounds of allBounds) {
    expect(bounds.source, bounds.model).toContain(
      `/models/${bounds.model}.glb`,
    );
    if (bounds.family === 'single')
      expect(bounds.parent, bounds.model).toBe('portellone-pivot');
    expect(bounds.intake.source, bounds.model).toBe(bounds.source);
    expect(bounds.intake.attached, bounds.model).toBe(true);
    expect(bounds.surfaceReleased, bounds.model).toBe(true);
    expect(bounds.intakeReleased, bounds.model).toBe(true);
    expect(bounds.intake.contacts, bounds.model).toBeGreaterThanOrEqual(4);
    expect(bounds.intake.gap, bounds.model).toBeLessThan(0.001);
    expect(bounds.intake.material, bounds.model).not.toBe('vehicle-glass');
    expect(bounds.intake.surfaceMaterial, bounds.model).not.toBe(
      'vehicle-glass',
    );
    expect(bounds.sameParent, bounds.model).toBe(true);
    expect(bounds.sameVertices, bounds.model).toBe(true);
    expect(bounds.surfaceError, bounds.model).toBeLessThan(1e-7);
    expect(bounds.transformError, bounds.model).toBeLessThan(1e-7);
    expect(bounds.polygonOffset, bounds.model).toBe(true);
    expect(bounds.depthWrite, bounds.model).toBe(false);
    expect(bounds.carbon, bounds.model).toBe(0x27312f);
    expect(bounds.uvMin, bounds.model).toBeCloseTo(0, 6);
    expect(bounds.uvMax, bounds.model).toBeCloseTo(1, 6);
  }
  await page.keyboard.press('Escape');
  await expect
    .poll(() => page.evaluate(() => window.__nightCircuitQA.state().playing))
    .toBe(true);
  await page.keyboard.down('w');
  const state = await page.evaluate(() =>
    window.__nightCircuitQA.advance(2, false),
  );
  await page.keyboard.up('w');
  expect(state.player.speed).toBeGreaterThan(5);
});
