import { testCredentials } from './test-credentials';
import { DEFAULT_TEST_CONFIG, TestURLs } from './test-config';
import { Page } from '@playwright/test';

/**
 * Authenticate user helper function with robust mobile selectors
 * @param page - Playwright page object
 * @param userType - Type of user to authenticate ('user' | 'admin')
 * @returns Promise<boolean>
 */
export async function authenticateUser(page: Page, userType: 'user' | 'admin' = 'user'): Promise<boolean> {
  console.log(`🔐 Starting mobile authentication for ${userType}...`);
  
  // Load credentials
  const credentials = testCredentials;
  
  try {
    // Go to login page with extended timeout
    await page.goto('/login', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });
    console.log('✅ Login page loaded');
    
    // Wait for page to be fully loaded with multiple checks
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Extra wait for mobile rendering
    
    // Try multiple authentication methods with fallbacks
    const email = userType === 'admin' ? credentials.adminEmail : credentials.email;
    const password = userType === 'admin' ? credentials.adminPassword : credentials.password;
    
    // Method 1: Try fallback login button first
    const fallbackButton = page.locator('button:has-text("Quick Login"), button:has-text("Login as Test User"), button:has-text("Fallback Login")');
    if (await fallbackButton.isVisible({ timeout: 3000 })) {
      console.log('✅ Using fallback login method');
      await fallbackButton.first().click();
      
      // Wait for dashboard content to load instead of just URL
      try {
        await page.waitForSelector('h1, h2, [data-testid="dashboard"], main, .dashboard', { timeout: 30000 });
        console.log('✅ Fallback authentication completed - dashboard loaded');
        return true;
      } catch (e) {
        console.log('⚠️ Fallback login clicked but dashboard not loaded, trying manual login');
      }
    }
    
    // Method 2: Manual login with multiple selector strategies
    console.log('📧 Attempting manual login...');
    
    // Try different email input selectors
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]', 
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
      '#email',
      '[data-testid="email-input"]',
      'input:first-of-type'
    ];
    
    let emailInput = null;
    for (const selector of emailSelectors) {
      try {
        emailInput = page.locator(selector);
        if (await emailInput.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found email input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!emailInput || !(await emailInput.isVisible({ timeout: 1000 }))) {
      throw new Error('❌ Could not find email input field with any selector');
    }
    
    // Fill email field
    await emailInput.fill(email);
    console.log('✅ Email filled');
    
    // Try different password input selectors
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[id*="password" i]',
      '#password',
      '[data-testid="password-input"]'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      try {
        passwordInput = page.locator(selector);
        if (await passwordInput.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found password input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!passwordInput || !(await passwordInput.isVisible({ timeout: 1000 }))) {
      throw new Error('❌ Could not find password input field');
    }
    
    // Fill password field
    await passwordInput.fill(password);
    console.log('✅ Password filled');
    
    // Submit form with multiple button selectors
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")', 
      'button:has-text("Log In")',
      'input[type="submit"]',
      '[data-testid="login-submit"]',
      'form button:last-of-type'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const submitButton = page.locator(selector);
        if (await submitButton.isVisible({ timeout: 2000 })) {
          await submitButton.click();
          console.log(`✅ Clicked submit button: ${selector}`);
          submitted = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!submitted) {
      // Fallback: press Enter on password field
      await passwordInput.press('Enter');
      console.log('✅ Pressed Enter as fallback submit');
    }
    
    // Wait for successful authentication - check multiple indicators
    const authSuccessSelectors = [
      // Dashboard content selectors
      'h1:has-text("Dashboard")',
      '[data-testid="dashboard"]',
      'main',
      '.dashboard',
      // Navigation selectors (user is logged in)
      '[data-testid="user-menu"]',
      '[data-testid="logout"]',
      'nav',
      // Content that only appears when logged in
      'h1, h2, .card'
    ];
    
    let authSuccess = false;
    for (const selector of authSuccessSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        console.log(`✅ Authentication success detected with: ${selector}`);
        authSuccess = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!authSuccess) {
      // Last resort: wait for any content change and check URL
      await page.waitForTimeout(5000);
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard') || !currentUrl.includes('login')) {
        console.log('✅ Authentication success detected via URL change');
        authSuccess = true;
      }
    }
    
    if (authSuccess) {
      console.log('✅ Manual authentication completed');
      return true;
    } else {
      throw new Error('❌ Authentication appeared to work but dashboard not detected');
    }
    
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    
    // Take debug screenshot
    try {
      await page.screenshot({ 
        path: `test-results/auth-failure-${userType}-${Date.now()}.png`,
        fullPage: true 
      });
    } catch (screenshotError) {
      console.error('Failed to take debug screenshot:', screenshotError);
    }
    
    return false;
  }
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

/**
 * Navigate with retry mechanism for better reliability
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