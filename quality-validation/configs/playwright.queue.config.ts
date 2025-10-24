import { defineConfig, devices } from '@playwright/test';

/**
 * Queue Testing Configuration with Dynamic Port Detection
 * 
 * Optimized for testing:
 * - Current Implementation: Basic queue functionality, tabs, metrics
 * - HubSpot-Style Features: Bulk selection, conflict detection, preview bar
 * - Database Integration: Real-time updates, data persistence
 * - Performance & Accessibility: Load times, keyboard navigation
 */
export default defineConfig({
  testDir: '../tests',
  testMatch: [
    '**/queue-focused.spec.ts',           // Primary queue functionality tests
    '**/queue-management-*.spec.ts',      // Additional queue management tests
    '**/queue-*.spec.ts'                  // Any other queue-specific tests
  ],
  
  /* OPTIMIZED EXECUTION STRATEGY */
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,  // Reduced workers for better stability and performance
  
  /* ENHANCED RETRY & RELIABILITY */
  retries: process.env.CI ? 2 : 1,  // More retries in CI environment
  forbidOnly: !!process.env.CI,
  
  /* COMPREHENSIVE REPORTING - NO HTML unless specifically requested */
  reporter: [
    ['list'],  // Real-time progress
    ['json', {
      outputFile: '../results/test-results/queue-results.json'
    }],
    ['junit', {
      outputFile: '../results/test-results/queue-junit.xml'
    }]
  ],
  
  /* EXTENDED TIMEOUTS FOR COMPLEX QUEUE OPERATIONS */
  timeout: 60000,      // 60 second test timeout for database operations
  expect: { 
    timeout: 15000     // 15 second assertion timeout for UI elements
  },
  
  /* ENHANCED NAVIGATION & INTERACTION SETTINGS */
  use: {
    /* Base URL will be set dynamically by global setup */
    baseURL: process.env.DETECTED_BASE_URL || 'http://localhost:3000',
    
    // Enhanced tracing for debugging queue issues
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Optimized timeouts for queue management pages
    navigationTimeout: 30000,  // 30 second navigation timeout
    actionTimeout: 20000,      // 20 second action timeout
    
    // Enhanced interaction settings for complex UX
    hasTouch: false,
    isMobile: false,
    
    // Improved viewport for queue table testing
    viewport: { width: 1400, height: 900 },  // Wider for data tables
    
    // Enhanced error handling
    ignoreHTTPSErrors: true,
    
    // Improved context settings
    storageState: undefined,  // Don't persist auth between tests
  },

  /* Global setup for dynamic port detection */
  globalSetup: '../tests/global-setup.ts',
  
  /* MULTIPLE BROWSER CONFIGURATIONS FOR QUEUE TESTING */
  projects: [
    {
      name: 'queue-chromium-current',
      testMatch: '**/queue-focused.spec.ts',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimized for current implementation testing
        viewport: { width: 1400, height: 900 },
        ignoreHTTPSErrors: true,
      },
    },
    
    {
      name: 'queue-chromium-hubspot',
      testMatch: '**/queue-focused.spec.ts',
      grep: /HubSpot-Style|Advanced Features|Enhanced/,
      use: { 
        ...devices['Desktop Chrome'],
        // Optimized for HubSpot-style feature testing
        viewport: { width: 1600, height: 1000 },  // Larger for advanced UI
        hasTouch: false,
        isMobile: false,
      },
    },
    
    {
      name: 'queue-database-integration',
      testMatch: '**/queue-focused.spec.ts',
      grep: /Database Integration|Real-time|Performance/,
      use: { 
        ...devices['Desktop Chrome'],
        // Optimized for database operations
        ignoreHTTPSErrors: true,
        storageState: undefined,
      },
      // Extended timeouts for database operations
      timeout: 90000,
      expect: { timeout: 20000 },
    },
    
    {
      name: 'queue-mobile-responsive',
      testMatch: '**/queue-focused.spec.ts',
      grep: /Mobile|Responsive|Accessibility/,
      use: { 
        ...devices['iPhone 13'],
        // Mobile-specific queue testing
        hasTouch: true,
        isMobile: true,
      },
    },
    
    // Cross-browser testing for queue management
    {
      name: 'queue-firefox',
      testMatch: '**/queue-focused.spec.ts',
      grep: /Current Implementation/,
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1400, height: 900 },
      },
    },
    
    {
      name: 'queue-webkit',
      testMatch: '**/queue-focused.spec.ts',
      grep: /Current Implementation/,
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1400, height: 900 },
      },
    },
  ],

  /* ENHANCED WEB SERVER CONFIGURATION */
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,  // 2 minutes for server startup
    stdout: 'pipe',
    stderr: 'pipe',
  },

  /* GLOBAL TEST CONFIGURATION */
  globalTeardown: undefined,
  
  /* Test result directory in quality-validation/results */
  outputDir: '../results/test-results/queue/',
  
  /* METADATA FOR REPORTING */
  metadata: {
    testSuite: 'Queue Management',
    description: 'Comprehensive testing for HubSpot-style queue management system',
    features: [
      'Current Implementation Testing',
      'HubSpot-Style Advanced Features',
      'Database Integration & Real-time Updates',
      'Performance & Accessibility Testing'
    ],
    coverage: [
      'Queue Management Page',
      'Bulk Selection & Conflict Detection', 
      'Preview Bar & Timeline Visualization',
      'Left-rail Navigation & Settings',
      'Enhanced Feedback System',
      'Three-tier Settings Organization'
    ]
  }
}); 