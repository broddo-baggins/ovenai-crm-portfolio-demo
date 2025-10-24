import { defineConfig, devices } from '@playwright/test';

/**
 * Mobile-focused Playwright configuration with dynamic port detection
 */
export default defineConfig({
  testDir: '../tests',
  testMatch: [
    '**/mobile/**/*.spec.ts',
    '**/mobile/**/*.spec.js',
    '**/suites/mobile/**/*.spec.ts'
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 2, // Reduced for stability
  reporter: [
    ['list'],
    ['json', { outputFile: '../results/test-results/mobile-results.json' }],
    ['junit', { outputFile: '../results/test-results/mobile-junit.xml' }]
  ],
  /* Global setup for dynamic port detection */
  globalSetup: '../tests/global-setup.ts',
  use: {
    /* Base URL will be set dynamically by global setup */
    baseURL: process.env.DETECTED_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific optimizations
        viewport: { width: 393, height: 851 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // iOS-specific optimizations
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'Mobile Chrome Landscape',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 851, height: 393 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
        hasTouch: true,
        isMobile: false,
      },
    },
  ],
  timeout: 90000, // Longer timeout for mobile tests
  expect: {
    timeout: 15000,
  },
  outputDir: '../results/test-results/mobile/',
}); 