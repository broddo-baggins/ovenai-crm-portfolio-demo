import { Page } from '@playwright/test';
import { testCredentials } from './test-credentials';

/**
 * Enhanced test helpers with better selectors and error handling
 */

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
    
    // Look for submit button with multiple selectors
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      '[data-testid="login-button"]',
      '.auth-submit-button'
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found submit button with selector: ${selector}`);
          await button.click();
          submitClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!submitClicked) {
      throw new Error('Could not find or click submit button');
    }
    
    // Wait for redirect with better timeout handling
    await page.waitForURL('**/dashboard', { timeout: TEST_TIMEOUTS.LONG });
    console.log('✅ Login successful - redirected to dashboard');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error);
    return false;
  }
}

export async function waitForDashboardElements(page: Page): Promise<boolean> {
  try {
    console.log('⏳ Waiting for dashboard elements...');
    
    // Wait for dashboard to load with flexible selectors
    await page.waitForSelector([
      '[data-testid="dashboard-page"]',
      '.dashboard-container', 
      'h1:has-text("Dashboard")',
      '.space-y-6' // Fallback to common dashboard layout class
    ].join(', '), { timeout: TEST_TIMEOUTS.MEDIUM });
    
    // Wait for at least one metric card or stats element to appear
    await page.waitForSelector([
      '[data-testid*="metric-card"]',
      '.metric-card',
      '.stats-card',
      '[class*="grid"]' // Dashboard grid layout
    ].join(', '), { timeout: TEST_TIMEOUTS.FORM_SUBMIT });
    
    console.log('✅ Dashboard elements loaded');
    return true;
  } catch (error) {
    console.error('❌ Dashboard elements not found:', error);
    return false;
  }
}

export async function waitForNavigationElements(page: Page): Promise<boolean> {
  try {
    console.log('⏳ Waiting for navigation elements...');
    
    // Wait for navigation with flexible selectors
    await page.waitForSelector([
      '[data-testid="main-navigation"]',
      'nav',
      '.sidebar',
      '[class*="sidebar"]'
    ].join(', '), { timeout: TEST_TIMEOUTS.MEDIUM });
    
    console.log('✅ Navigation elements loaded');
    return true;
  } catch (error) {
    console.error('❌ Navigation elements not found:', error);
    return false;
  }
}

export async function findDashboardStats(page: Page): Promise<any[]> {
  const stats = [];
  
  // Try multiple selector strategies for dashboard stats
  const statSelectors = [
    '[data-testid*="metric-card"]',
    '.metric-card',
    '.stats-card',
    'div:has-text("Total Leads")',
    'div:has-text("Conversion Rate")',
    'div:has-text("Active Projects")'
  ];
  
  for (const selector of statSelectors) {
    try {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} stats using selector: ${selector}`);
        stats.push(...elements);
      }
    } catch (e) {
      continue;
    }
  }
  
  return stats;
}

export async function waitForLeadsTable(page: Page): Promise<boolean> {
  try {
    console.log('⏳ Waiting for leads table...');
    
    await page.waitForSelector([
      '[data-testid="leads-table"]',
      'table',
      '.leads-table',
      'tbody tr',
      '.table-container'
    ].join(', '), { timeout: TEST_TIMEOUTS.MEDIUM });
    
    console.log('✅ Leads table loaded');
    return true;
  } catch (error) {
    console.error('❌ Leads table not found:', error);
    return false;
  }
}

export async function navigateToSection(page: Page, section: string): Promise<boolean> {
  try {
    console.log(`🧭 Navigating to ${section}...`);
    
    // Try different navigation strategies
    const navSelectors = [
      `a[href="/${section}"]`,
      `a:has-text("${section}")`,
      `[data-testid="nav-link-${section}"]`,
      `nav a:has-text("${section.charAt(0).toUpperCase() + section.slice(1)}")`,
      `.sidebar a:has-text("${section.charAt(0).toUpperCase() + section.slice(1)}")`
    ];
    
    for (const selector of navSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found navigation link with selector: ${selector}`);
          await link.click();
          
          // Wait for navigation to complete
          await page.waitForURL(`**/${section}`, { timeout: TEST_TIMEOUTS.NAVIGATION });
          console.log(`✅ Successfully navigated to ${section}`);
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    
    // Fallback: try direct navigation
    await page.goto(`/${section}`, { waitUntil: 'networkidle' });
    console.log(`✅ Direct navigation to ${section} successful`);
    return true;
    
  } catch (error) {
    console.error(`❌ Navigation to ${section} failed:`, error);
    return false;
  }
}

export async function safeClick(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: TEST_TIMEOUTS.SHORT });
    const element = page.locator(selector).first();
    
    if (await element.isVisible()) {
      await element.click();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Safe click failed for ${selector}:`, error);
    return false;
  }
}

export async function safeFill(page: Page, selector: string, value: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: TEST_TIMEOUTS.SHORT });
    const element = page.locator(selector).first();
    
    if (await element.isVisible()) {
      await element.fill(value);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Safe fill failed for ${selector}:`, error);
    return false;
  }
} 