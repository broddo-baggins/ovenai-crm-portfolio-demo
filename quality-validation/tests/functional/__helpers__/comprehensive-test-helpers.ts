import { testCredentials } from './test-credentials';
import { DEFAULT_TEST_CONFIG, TestURLs } from './test-config';
import { Page } from '@playwright/test';

/**
 * Authenticate user helper function
 * @param page - Playwright page object
 * @param userType - Type of user to authenticate ('regular' | 'admin')
 * @returns Promise<void>
 */
export async function authenticateUser(page: Page, userType: 'regular' | 'admin' = 'regular'): Promise<void> {
  const credentials = testCredentials;
  
  // Navigate to login page
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  const email = userType === 'admin' ? credentials.adminEmail : credentials.email;
  const password = userType === 'admin' ? credentials.adminPassword : credentials.password;
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for authentication to complete
  await page.waitForLoadState('networkidle');
  
  // Wait for redirect to dashboard or authenticated area
  await page.waitForTimeout(2000);
}

/**
 * Navigate to a specific page after authentication
 * @param page - Playwright page object
 * @param path - Path to navigate to
 * @returns Promise<void>
 */
export async function navigateToPage(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for element to be visible with timeout
 * @param page - Playwright page object
 * @param selector - CSS selector
 * @param timeout - Timeout in milliseconds
 * @returns Promise<void>
 */
export async function waitForElement(page: Page, selector: string, timeout: number = 10000): Promise<void> {
  await page.waitForSelector(selector, { timeout });
}

/**
 * Check if user is authenticated
 * @param page - Playwright page object
 * @returns Promise<boolean>
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for authenticated elements (adjust selector as needed)
    await page.waitForSelector('[data-testid="authenticated-content"]', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Logout user
 * @param page - Playwright page object
 * @returns Promise<void>
 */
export async function logoutUser(page: Page): Promise<void> {
  try {
    // Click logout button (adjust selector as needed)
    await page.click('[data-testid="logout-button"]');
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.warn('Logout failed:', error);
  }
}

/**
 * Common test setup
 * @param page - Playwright page object
 * @returns Promise<void>
 */
export async function setupTest(page: Page): Promise<void> {
  // Set viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Set longer timeout for slow operations
  page.setDefaultTimeout(30000);
}

/**
 * Common test cleanup
 * @param page - Playwright page object
 * @returns Promise<void>
 */
export async function cleanupTest(page: Page): Promise<void> {
  // Clear local storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Clear cookies
  await page.context().clearCookies();
} 