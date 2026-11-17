import { expect, test } from '@playwright/test';

test('riflessi separati, ombre correnti e risorse ai cambi di zona e qualità', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(
    (url) => url.pathname === '/src/main.ts',
    async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        'ready = true;',
        `
      const metrics = { depth: 0, maximumDepth: 0, main: 0, reflection: 0,
        matrices: 0, shadows: 0, wrongShadowCamera: false };
      const originalRender = renderer.render.bind(renderer);
      renderer.render = (s, c) => {
        const worldPass = s === scene;
        if (worldPass) {
          metrics.depth++;
          metrics.maximumDepth = Math.max(metrics.maximumDepth, metrics.depth);
          if (c === camera) metrics.main++;
          else if (c === wetRoad.mirror?.getReflectionCamera(camera)) metrics.reflection++;
        }
        try { return originalRender(s, c); } finally { if (worldPass) metrics.depth--; }
      };
      const originalMatrices = scene.updateMatrixWorld.bind(scene);
      scene.updateMatrixWorld = (...args) => { metrics.matrices++; return originalMatrices(...args); };
      const originalShadows = renderer.shadowMap.render.bind(renderer.shadowMap);
      renderer.shadowMap.render = (lights, s, c) => {
        if (renderer.shadowMap.enabled && lights.length &&
            (renderer.shadowMap.autoUpdate || renderer.shadowMap.needsUpdate)) {
          metrics.shadows++; metrics.wrongShadowCamera ||= c !== camera;
        }
        return originalShadows(lights, s, c);
      };
      window.__renderTest = {
        metrics,
        shadowCases: () => {
          loop.stop();
          const position = camera.position.clone(), rotation = camera.quaternion.clone();
          const autoMatrices = scene.matrixWorldAutoUpdate;
          const renderMirror = wetRoad.renderMirror;
          let mirrorAttempts = 0;
          wetRoad.renderMirror = (...args) => { mirrorAttempts++; return renderMirror(...args); };
          try {
            wetRoad.update(vehicle.position);
            scene.updateMatrixWorld();
            scene.matrixWorldAutoUpdate = false;
            const results = [];
            for (const below of [false, true]) {
              // The mirror's culling sphere has a 127 m radius. Move above it
              // completely so the first pose really exercises the frustum exit.
              camera.position.copy(wetRoad.mirror.position).y += below ? -10 : 200;
              camera.lookAt(camera.position.clone().add(new THREE.Vector3(0, 1, 0)));
              camera.updateMatrixWorld();
              const main = metrics.main, reflection = metrics.reflection, shadows = metrics.shadows;
              const attempts = mirrorAttempts;
              effects.render(vehicle.position.x, vehicle.position.y, vehicle.position.z, 10, false);
              results.push({
                main: metrics.main - main, reflection: metrics.reflection - reflection,
                shadows: metrics.shadows - shadows, autoUpdate: renderer.shadowMap.autoUpdate,
                intersects: wetRoad.frustum.intersectsObject(wetRoad.mirror),
                visible: wetRoad.mirror.visible,
                attempts: mirrorAttempts - attempts,
              });
            }
            const invalidLights = [];
            scene.traverse(object => {
              if (object instanceof THREE.Light && object.castShadow && !object.layers.isEnabled(0))
                invalidLights.push(object.uuid);
            });
            return { results, invalidLights, wrongShadowCamera: metrics.wrongShadowCamera };
          } finally {
            camera.position.copy(position); camera.quaternion.copy(rotation);
            camera.updateMatrixWorld(); scene.matrixWorldAutoUpdate = autoMatrices;
            wetRoad.renderMirror = renderMirror;
            loop.start();
          }
        },
        state: () => ({
          mirror: wetRoad.mirror?.uuid ?? null,
          mirrorVisible: wetRoad.mirror?.visible ?? false,
          composer: !!effects.composer,
          probe: !!carReflections.target,
        }),
        reflectionAspect: () => {
          const inverse = wetRoad.mirror?.getReflectionCamera(camera).projectionMatrixInverse;
          return inverse ? inverse.elements[0] / inverse.elements[5] : null;
        },
        probeBindings: () => {
          let count = 0;
          vehicle.model.root.traverse((object) => {
            if (object instanceof THREE.Mesh)
              for (const material of Array.isArray(object.material) ? object.material : [object.material])
                if (carReflections.target && material.envMap === carReflections.target.texture) count++;
          });
          return count;
        },
        place: (x, y, z) => { qa.manual = true; vehicle.place(x, y, z, 0); chase.reset(); },
      };
      ready = true;`,
      );
      await route.fulfill({ response, body });
    },
  );
  await page.goto('/?qa=race');
  await page.waitForFunction(
    () => !!(window as unknown as { __renderTest?: unknown }).__renderTest,
    null,
    { timeout: 180000 },
  );
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __renderTest: { probeBindings(): number } }
      ).__renderTest.probeBindings(),
    ),
  ).toBe(0);
  await page.locator('#start').click({ timeout: 180000 });
  await expect(page.locator('#overlay')).toBeHidden();
  await page.waitForFunction(() => {
    const api = (
      window as unknown as { __renderTest: { metrics: { main: number } } }
    ).__renderTest;
    return api?.metrics.main >= 12;
  });
  const metrics = await page.evaluate(
    () =>
      (
        window as unknown as {
          __renderTest: { metrics: Record<string, number | boolean> };
        }
      ).__renderTest.metrics,
  );
  expect(metrics.maximumDepth).toBe(1);
  expect(metrics.reflection).toBeGreaterThan(0);
  expect(metrics.matrices).toBe(metrics.main);
  expect(metrics.shadows).toBe(metrics.main);
  expect(metrics.wrongShadowCamera).toBe(false);
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { __renderTest: { probeBindings(): number } }
      ).__renderTest.probeBindings(),
    ),
  ).toBeGreaterThan(0);

  const alternateShadows = await page.evaluate(() =>
    (
      window as unknown as {
        __renderTest: {
          shadowCases(): {
            results: Record<string, number | boolean>[];
            invalidLights: string[];
            wrongShadowCamera: boolean;
          };
        };
      }
    ).__renderTest.shadowCases(),
  );
  expect(alternateShadows.results).toEqual([
    {
      main: 1,
      reflection: 0,
      shadows: 1,
      autoUpdate: true,
      intersects: false,
      visible: true,
      attempts: 0,
    },
    {
      main: 1,
      reflection: 0,
      shadows: 1,
      autoUpdate: true,
      intersects: true,
      visible: true,
      attempts: 1,
    },
  ]);
  expect(alternateShadows.invalidLights).toEqual([]);
  expect(alternateShadows.wrongShadowCamera).toBe(false);

  await page.keyboard.down('w');
  await page.waitForFunction(
    () => {
      const player = (
        window as unknown as {
          __nightCircuitQA: {
            state(): { player: { z: number; speed: number } };
          };
        }
      ).__nightCircuitQA.state().player;
      return player.z > -250 && player.speed > 10;
    },
    null,
    { timeout: 30000 },
  );
  await page.keyboard.up('w');
  await page.screenshot({ path: 'artifacts/render-optimization-driving.png' });

  const state = () =>
    page.evaluate(() =>
      (
        window as unknown as {
          __renderTest: {
            state(): {
              mirror: string | null;
              mirrorVisible: boolean;
              composer: boolean;
              probe: boolean;
            };
          };
        }
      ).__renderTest.state(),
    );
  const original = await state();
  await page.evaluate(() =>
    (
      window as unknown as {
        __renderTest: { place(x: number, y: number, z: number): void };
      }
    ).__renderTest.place(1080, 55.65, 1080),
  );
  await expect.poll(async () => (await state()).mirrorVisible).toBe(false);
  expect((await state()).mirror).toBe(original.mirror);
  await page.setViewportSize({ width: 1440, height: 810 });
  await page.evaluate(() =>
    (
      window as unknown as {
        __renderTest: { place(x: number, y: number, z: number): void };
      }
    ).__renderTest.place(-4.5, 0.65, -310),
  );
  await expect.poll(async () => (await state()).mirrorVisible).toBe(true);
  expect((await state()).mirror).toBe(original.mirror);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { __renderTest: { reflectionAspect(): number } }
        ).__renderTest.reflectionAspect(),
      ),
    )
    .toBeCloseTo(1440 / 810, 8);

  await page.locator('#quality').evaluate((select) => {
    (select as HTMLSelectElement).value = 'low';
    select.dispatchEvent(new Event('change'));
  });
  await expect.poll(state).toEqual({
    mirror: null,
    mirrorVisible: false,
    composer: false,
    probe: false,
  });
  await page.locator('#quality').evaluate((select) => {
    (select as HTMLSelectElement).value = 'high';
    select.dispatchEvent(new Event('change'));
  });
  // The probe's normal schedule follows simulation time, which place() froze.
  await page.evaluate(() =>
    (
      window as unknown as {
        __nightCircuitQA: {
          advance(seconds: number, autodrive: boolean): void;
        };
      }
    ).__nightCircuitQA.advance(0.2, false),
  );
  await expect
    .poll(async () => {
      const value = await state();
      return value.mirrorVisible && value.composer && value.probe;
    })
    .toBe(true);
  await page.evaluate(() =>
    (
      window as unknown as {
        __nightCircuitQA: { manual(value: boolean): void };
      }
    ).__nightCircuitQA.manual(false),
  );
  await expect
    .poll(() =>
      page.evaluate(() =>
        (
          window as unknown as { __renderTest: { probeBindings(): number } }
        ).__renderTest.probeBindings(),
      ),
    )
    .toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
