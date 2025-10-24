import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '../tests',
  /* Exclude unit tests that should run with Vitest */
  testIgnore: [
    '**/node_modules/**',
    '**/assets/debug/**',
    '**/quality-validation/logs/**',
    '**/test-results/**',
    '**/playwright-report/**',
    '**/.env*',
    '**/credentials/**',
    // Exclude emergency backup directory from tests
    "**/EMERGENCY_BACKUP/**",
    '**/unit/**/*.test.*',
    '**/accessibility/**/*.test.*',
    '**/deprecated/**/*',
    '**/test-*/**/*',
    '**/functional/**/*.test.*',
    '**/build/**/*.test.*',
    '**/regression/**/*.test.*',
    '**/api/**/*.test.*',
    '**/workflows/**/*.test.*',
    '**/integration/**/*.test.*',
    '**/suites/unit/**/*.test.*',
    '**/suites/accessibility/**/__helpers__/*',
    '**/suites/mobile/**/__helpers__/*',
    '**/suites/__helpers__/*',
    '**/__helpers__/setup.ts',
    '**/config/test-setup.ts',
    '**/reports/reports-comprehensive.spec.ts',
    '**/integration/full-system-e2e.spec.ts',
    '**/accessibility/wcag/phase3-accessibility-polish.spec.ts'
  ],
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Reduced workers for stability and performance */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // 🚨 TEXT-ONLY REPORTERS - ABSOLUTELY NO HTML unless specifically requested!
  reporter: [
    ['list'], 
    ['json', { outputFile: '../results/test-results/e2e-results.json' }],
    ['junit', { outputFile: '../results/test-results/e2e-junit.xml' }]
  ],
  /* Global setup for dynamic port detection */
  globalSetup: '../tests/global-setup.ts',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL will be set dynamically by global setup */
    baseURL: 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Optimized timeouts for better performance */
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  
  /* Configure projects for major browsers - optimized for performance */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* Test against mobile viewports - focus on most common */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    /* Optional: Enable for comprehensive testing */
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
  
  /* Dynamic server detection - webServer removed as global setup handles this */
  
  /* Optimized test timeout */
  timeout: 60000,

  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
  
  /* Test result directory in quality-validation/results */
  outputDir: '../results/test-results/',
});
