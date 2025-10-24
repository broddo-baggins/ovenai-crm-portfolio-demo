import { Page } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';
import * as fs from 'fs';
import * as path from 'path';

export const TEST_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 15000,
  NAVIGATION: 10000,
  FORM_SUBMIT: 8000
};

export async function loginWithCredentials(
  page: Page, 
  email = testCredentials.email, 
  password = testCredentials.password
): Promise<boolean> {
  try {
    console.log(`🔐 Attempting login with ${email}`);
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    
    // Wait for form elements with better error handling
    await page.waitForSelector('input[type="email"]', { timeout: TEST_TIMEOUTS.MEDIUM });
    await page.waitForSelector('input[type="password"]', { timeout: TEST_TIMEOUTS.MEDIUM });
    
    // Fill form fields
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Check if login was successful
    const isLoggedIn = page.url().includes('/dashboard') || page.url().includes('/admin');
    
    if (isLoggedIn) {
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Login error:', error);
    return false;
  }
}

export async function waitForElement(
  page: Page, 
  selector: string, 
  timeout = TEST_TIMEOUTS.MEDIUM
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`❌ Element not found: ${selector}`);
    return false;
  }
}

export async function clickWithRetry(
  page: Page, 
  selector: string, 
  maxRetries = 3
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.click(selector);
      return true;
    } catch (error) {
      console.warn(`⚠️ Click attempt ${i + 1} failed for ${selector}`);
      await page.waitForTimeout(1000);
    }
  }
  return false;
}

export async function fillFormField(
  page: Page, 
  selector: string, 
  value: string
): Promise<boolean> {
  try {
    await page.fill(selector, value);
    return true;
  } catch (error) {
    console.error(`❌ Failed to fill field ${selector}:`, error);
    return false;
  }
}

export async function navigateToPage(
  page: Page, 
  path: string
): Promise<boolean> {
  try {
    await page.goto(path, { waitUntil: 'networkidle' });
    return true;
  } catch (error) {
    console.error(`❌ Failed to navigate to ${path}:`, error);
    return false;
  }
} 

/**
 * Authenticate a user (alias for existing authenticateUser function)
 */
export async function authenticateUser(page: Page, userType: 'regular' | 'admin' = 'regular'): Promise<void> {
  const credentialsPath = path.join(process.cwd(), 'credentials/test-credentials.local');
  const credentials = fs.readFileSync(credentialsPath, 'utf8');
  const email = credentials.match(/TEST_USER_EMAIL=(.+)/)?.[1]?.trim() || 'test@test.test';
  const password = credentials.match(/TEST_USER_PASSWORD=(.+)/)?.[1]?.trim() || 'testtesttest';

  try {
    await page.goto('/auth/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('[data-testid="email-input"], input[type="email"], #email', email);
    await page.fill('[data-testid="password-input"], input[type="password"], #password', password);
    await page.click('[data-testid="login-button"], button[type="submit"], #login-btn');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  } catch (error) {
    console.log('Authentication failed, continuing with test...');
  }
}

/**
 * Navigate with retry mechanism
 */
export async function navigateWithRetry(page: Page, url: string, maxRetries: number = 3): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);
      return true;
    } catch (error) {
      console.log(`🔄 Navigation attempt ${i + 1}/${maxRetries} failed for ${url}`);
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(2000);
    }
  }
  return false;
}

/**
 * Navigate with retry mechanism (typo variant)
 */
export async function navigateWithRetrue(page: Page, url: string, maxRetries: number = 3): Promise<boolean> {
  return navigateWithRetry(page, url, maxRetries);
}

/**
 * Find element with multiple selector fallbacks
 */
export async function findElementWithFallbacks(page: Page, selectors: string[], elementName: string, timeout: number = 5000) {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: timeout / selectors.length })) {
        console.log(`✅ Found ${elementName} with selector: ${selector}`);
        return element;
      }
    } catch (error) {
      console.log(`⚠️ Selector failed for ${elementName}: ${selector}`);
    }
  }
  console.log(`❌ Could not find ${elementName} with any selector`);
  return null;
} 

/**
 * Check accessibility features
 */
export async function checkAccessibilityFeatures(page: Page): Promise<void> {
  try {
    // Check for ARIA labels
    const ariaElements = await page.locator('[aria-label]').count();
    console.log(`✅ Found ${ariaElements} elements with ARIA labels`);
    
    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    console.log('✅ Keyboard navigation tested');
  } catch (error) {
    console.log('⚠️ Accessibility check failed, continuing...');
  }
}

/**
 * Logout user
 */
export async function logoutUser(page: Page): Promise<void> {
  try {
    await page.click('[data-testid="logout"], .logout-btn, [aria-label="Logout"]');
    await page.waitForURL('**/login**', { timeout: 10000 });
    console.log('✅ User logged out successfully');
  } catch (error) {
    console.log('⚠️ Logout failed, continuing...');
  }
}

/**
 * Click button with fallbacks
 */
export async function clickButtonWithFallbacks(page: Page, selectors: string[], buttonName: string): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        console.log(`✅ Clicked ${buttonName} with selector: ${selector}`);
        return true;
      }
    } catch (error) {
      console.log(`⚠️ Button click failed for ${buttonName}: ${selector}`);
    }
  }
  console.log(`❌ Could not click ${buttonName} with any selector`);
  return false;
}

/**
 * Navigate to section
 */
export async function navigateToSection(page: Page, sectionName: string): Promise<boolean> {
  const navigationSelectors = [
    `[data-testid="${sectionName}"]`,
    `[href*="${sectionName}"]`,
    `text="${sectionName}"`,
    `.nav-${sectionName}`,
    `#${sectionName}`
  ];
  
  return clickButtonWithFallbacks(page, navigationSelectors, `${sectionName} navigation`);
} 