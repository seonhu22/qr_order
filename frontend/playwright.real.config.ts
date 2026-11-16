import { defineConfig, devices } from '@playwright/test';

// No webServer: only the explicitly started dev:real server is used.
// No traces/HAR: login request bodies and session cookies contain credentials.
export default defineConfig({
  testDir: './e2e-real',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  forbidOnly: true,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: 'test-results/real-qa',
  use: {
    ...devices['Desktop Chrome'],
    serviceWorkers: 'block',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },
});
