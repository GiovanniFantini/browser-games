import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 300000,
  expect: { timeout: 20000 },
  workers: 1,
  reporter: 'list',
  outputDir: './artifacts/browser',
  use: {
    actionTimeout: 30000,
    navigationTimeout: 60000,
    baseURL: 'http://127.0.0.1:5175',
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-unsafe-swiftshader'] },
  },
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: true,
    timeout: 180000,
  },
});
