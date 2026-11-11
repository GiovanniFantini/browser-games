import { test, expect } from '@playwright/test';
test('fase 8: le tre radio generano audio procedurale e i volumi a zero producono silenzio', async ({
  page,
}) => {
  test.setTimeout(300000);
  await page.goto('/?quality=low', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#start')).toBeEnabled({ timeout: 90000 });
  const result = await page.evaluate(async () => {
    const soundPath = '/src/audio/soundscape.ts',
      prefPath = '/src/core/preferences.ts';
    const { Soundscape } = await import(/* @vite-ignore */ soundPath),
      { preferences: p } = await import(/* @vite-ignore */ prefPath);
    const original = { ...p };
    const energy: number[] = [];
    try {
      for (let station = 0; station < 4; station++) {
        p.station = station;
        p.music = station === 3 ? 0 : 1;
        p.effects = 0;
        const ctx = new OfflineAudioContext(1, 22050, 22050),
          master = ctx.createGain();
        master.connect(ctx.destination);
        const scene = new Soundscape(ctx, master);
        scene.update(3000, 1, false, 0, false, false);
        const buffer = await ctx.startRendering(),
          samples = buffer.getChannelData(0);
        energy.push(
          samples.reduce((sum, v) => sum + v * v, 0) / samples.length,
        );
      }
      p.station = 3;
      p.music = 0;
      p.effects = 1;
      const ctx = new OfflineAudioContext(1, 22050, 22050),
        master = ctx.createGain();
      master.connect(ctx.destination);
      const scene = new Soundscape(ctx, master);
      const suspended = ctx.suspend(0.05);
      const rendering = ctx.startRendering();
      await suspended;
      scene.update(950, 0, false, 0, false, false, 20);
      await ctx.resume();
      const buffer = await rendering,
        samples = buffer.getChannelData(0);
      energy.push(samples.reduce((sum, v) => sum + v * v, 0) / samples.length);
    } finally {
      Object.assign(p, original);
    }
    return energy;
  });
  expect(
    result.slice(0, 3).every((e) => e > 0.00001),
    JSON.stringify(result),
  ).toBe(true);
  expect(result[3]).toBe(0);
  expect(result[4]).toBeGreaterThan(0.00001);
});
