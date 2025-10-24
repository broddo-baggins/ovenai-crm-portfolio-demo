import { defineConfig, devices } from '@playwright/test';

/**
 * Admin-focused Playwright configuration with dynamic port detection
 */
export default defineConfig({
  testDir: '../tests',
  testMatch: [
    '**/admin/**/*.spec.ts',
    '**/e2e/admin-*.spec.ts',
    '**/suites/admin/**/*.spec.ts'
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // Less retries for admin tests
  workers: process.env.CI ? 1 : 2, // Conservative workers for admin testing
  reporter: [
    ['list'],
    ['json', { outputFile: '../results/test-results/admin-results.json' }],
    ['junit', { outputFile: '../results/test-results/admin-junit.xml' }]
  ],
  /* Global setup for dynamic port detection */
  globalSetup: '../tests/global-setup.ts',
  use: {
    /* Base URL will be set dynamically by global setup */
    baseURL: process.env.DETECTED_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure', 
    video: 'retain-on-failure',
    actionTimeout: 45000, // Longer timeout for admin operations
    navigationTimeout: 45000,
    // Admin-specific settings
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  },
  projects: [
    {
      name: 'admin-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Admin console optimized viewport
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'admin-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  timeout: 120000, // Extended timeout for admin operations
  expect: {
    timeout: 20000, // Longer expect timeout for admin UI
  },
  outputDir: '../results/test-results/admin/',
}); 