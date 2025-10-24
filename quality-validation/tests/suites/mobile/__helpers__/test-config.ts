/**
 * Dynamic Test Configuration Helper
 * Provides runtime configuration for E2E tests with smart server detection
 */

import { testCredentials } from './test-credentials';

export interface TestConfig {
  baseURL: string;
  port: number;
  timeout: {
    navigation: number;
    action: number;
    test: number;
  };
  auth: {
    email: string;
    password: string;
  };
  retries: number;
}

/**
 * Get the dynamic base URL for tests
 * Uses the server detected by global setup
 */
export function getBaseURL(): string {
  // Priority order:
  // 1. Environment variable from global setup
  // 2. Playwright baseURL
  // 3. Default fallback
  return process.env.DETECTED_BASE_URL || 
         process.env.PLAYWRIGHT_BASE_URL || 
         'http://localhost:3000';
}

/**
 * Get the port from base URL
 */
export function getPort(): number {
  const baseURL = getBaseURL();
  const url = new URL(baseURL);
  return parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
}

/**
 * Get full test configuration
 */
export function getTestConfig(): TestConfig {
  const baseURL = getBaseURL();
  
  return {
    baseURL,
    port: getPort(),
    timeout: {
      navigation: 20000,
      action: 10000,
      test: 45000,
    },
    auth: {
      email: process.env.TEST_USER_EMAIL || testCredentials.email,
      password: process.env.TEST_USER_PASSWORD || testCredentials.password,
    },
    retries: process.env.CI ? 2 : 1,
  };
}

/**
 * Build a full URL for testing
 */
export function buildTestURL(path: string = ''): string {
  const baseURL = getBaseURL();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseURL}${cleanPath}`;
}

/**
 * Wait for server to be ready
 */
export async function waitForServer(maxAttempts: number = 10): Promise<boolean> {
  const baseURL = getBaseURL();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(baseURL, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok || response.status === 404) {
        console.log(`✅ Server ready at ${baseURL}`);
        return true;
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(`❌ Server not ready after ${maxAttempts} attempts: ${error}`);
        return false;
      }
      
      console.log(`⏳ Server check ${attempt}/${maxAttempts}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
}

/**
 * Default test configuration instance
 */
export const DEFAULT_TEST_CONFIG = getTestConfig();

/**
 * Common test URLs builder
 */
export const TestURLs = {
  home: () => buildTestURL('/'),
  login: () => buildTestURL('/auth/login'),
  dashboard: () => buildTestURL('/dashboard'),
  leads: () => buildTestURL('/leads'),
  messages: () => buildTestURL('/messages'),
  reports: () => buildTestURL('/reports'),
  settings: () => buildTestURL('/settings'),
  admin: () => buildTestURL('/admin/console'),
  build: (path: string) => buildTestURL(path),
} as const;

/**
 * Log current test configuration
 */
export function logTestConfig(): void {
  const config = getTestConfig();
  console.log('🔧 Test Configuration:');
  console.log(`   Base URL: ${config.baseURL}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Auth: ${config.auth.email}`);
  console.log(`   Timeouts: nav=${config.timeout.navigation}ms, action=${config.timeout.action}ms`);
}