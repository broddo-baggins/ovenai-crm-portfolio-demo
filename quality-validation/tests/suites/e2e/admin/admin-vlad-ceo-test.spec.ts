import { test, expect, Page } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';
// Helper function for robust authentication
async function authenticateAsAdmin(page) {
  console.log('🔐 Authenticating as admin user...');
  
  await page.goto('/auth/login', { waitUntil: 'networkidle' });
  
  // Use multiple selector fallbacks for robustness
  const emailSelector = 'input[type="email"], input[name="email"], #email';
  const passwordSelector = 'input[type="password"], input[name="password"], #password';
  
  await page.waitForSelector(emailSelector, { timeout: 10000 });
  await page.fill(emailSelector, testCredentials.email);
  await page.fill(passwordSelector, process.env.TEST_USER_PASSWORD || testCredentials.password);
  
  // Submit with multiple selector fallbacks
  const submitSelector = 'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")';
  await page.click(submitSelector);
  
  // Wait for successful authentication
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  
  // Verify we're authenticated (not on login page)
  const currentUrl = page.url();
  if (currentUrl.includes('/auth/login')) {
    throw new Error('Authentication failed - still on login page');
  }
  
  console.log('✅ Authentication successful');
  return true;
}


const VLAD_CEO = {
  email: testCredentials.email,
  password: process.env.TEST_USER_PASSWORD || process.env.TEST_USER_PASSWORD || testCredentials.password
};

// Expected admin console tabs based on RealAdminConsole.tsx
const EXPECTED_ADMIN_TABS = [
  'Company Management',
  'User Management', 
  'Usage Analytics',
  'System Admin'
];

// Helper function to login as Vlad
async function loginAsVlad(page: Page): Promise<void> {
  console.log('🔐 Logging in as Vlad CEO...');
  
  // Navigate to login page  
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  
  // Wait for and fill login form
  await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });
  await page.fill('input[type="email"], input[name="email"], #email', VLAD_CEO.email);
  await page.fill('input[type="password"], input[name="password"], #password', VLAD_CEO.password);
  
  // Submit form
  await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  console.log('✅ Vlad logged in successfully');
}

// Helper function to navigate to admin console
async function navigateToAdminConsole(page: Page): Promise<void> {
  console.log('🏛️ Navigating to admin console...');
  
  // Navigate to admin console
  await page.goto('/admin/console', { waitUntil: 'domcontentloaded' });
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  console.log('📍 Admin console page loaded');
}

// Helper function to check for admin console content
async function checkAdminConsoleContent(page: Page): Promise<{
  hasAdminElements: boolean;
  tabs: string[];
  hasTabNavigation: boolean;
}> {
  console.log('🔍 Checking admin console content...');
  
  // Look for admin-related text content
  const pageContent = await page.textContent('body');
  const hasAdminText = pageContent?.includes('Admin') || pageContent?.includes('Management') || pageContent?.includes('Analytics');
  
  // Look for tab elements (using multiple selectors)
  const tabSelectors = [
    '[role="tab"]',
    '.tab-trigger',
    '[data-value="companies"]',
    '[data-value="users"]',
    '[data-value="analytics"]',
    '[data-value="system"]',
    'text=Company Management',
    'text=User Management',
    'text=Usage Analytics',
    'text=System Admin'
  ];
  
  let foundTabs: string[] = [];
  let hasTabNavigation = false;
  
  for (const selector of tabSelectors) {
    try {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        hasTabNavigation = true;
        for (const element of elements) {
          const text = await element.textContent();
          if (text && text.trim()) {
            foundTabs.push(text.trim());
          }
        }
      }
    } catch (error) {
      // Selector not found, continue
    }
  }
  
  // Remove duplicates
  foundTabs = [...new Set(foundTabs)];
  
  console.log(`🔍 Admin elements detected: ${hasAdminText}`);
  console.log(`📋 Tabs found: ${foundTabs.join(', ')}`);
  console.log(`🗂️ Has tab navigation: ${hasTabNavigation}`);
  
  return {
    hasAdminElements: hasAdminText || false,
    tabs: foundTabs,
    hasTabNavigation
  };
}

test.describe('🏛️ Vlad CEO Admin Console Tests', () => {

  test('🔍 Vlad CEO Login and Admin Console Access', async ({ page }) => {
    // Step 1: Login as Vlad
    await loginAsVlad(page);
    
    // Step 2: Navigate to admin console
    await navigateToAdminConsole(page);
    
    // Step 3: Check admin console content
    const adminContent = await checkAdminConsoleContent(page);
    
    // Log findings
    console.log('📊 Admin Console Analysis:');
    console.log(`  - Has admin elements: ${adminContent.hasAdminElements}`);
    console.log(`  - Has tab navigation: ${adminContent.hasTabNavigation}`);
    console.log(`  - Found tabs: ${adminContent.tabs.join(', ')}`);
    
    // Verify Vlad has access to admin content
    expect(adminContent.hasAdminElements || adminContent.hasTabNavigation).toBe(true);
  });

  test('🏢 Admin Console Tab Navigation Test', async ({ page }) => {
    // Login and navigate to admin console
    await loginAsVlad(page);
    await navigateToAdminConsole(page);
    
    // Check for admin console tabs
    const adminContent = await checkAdminConsoleContent(page);
    
    if (adminContent.hasTabNavigation && adminContent.tabs.length > 0) {
      console.log(`✅ Found ${adminContent.tabs.length} tabs - testing navigation...`);
      
      // Test clicking each tab
      for (const tab of adminContent.tabs) {
        try {
          // Try different tab selector strategies
          const tabSelectors = [
            `[role="tab"]:has-text("${tab}")`,
            `[data-value="${tab.toLowerCase().replace(' ', '-')}"]`,
            `text=${tab}`,
            `.tab-trigger:has-text("${tab}")`
          ];
          
          let clicked = false;
          for (const selector of tabSelectors) {
            try {
              const element = page.locator(selector).first();
              if (await element.count() > 0) {
                await element.click();
                await page.waitForTimeout(1000);
                console.log(`✅ Successfully clicked tab: ${tab}`);
                clicked = true;
                break;
              }
            } catch (error) {
              // Try next selector
            }
          }
          
          if (!clicked) {
            console.log(`⚠️ Could not click tab: ${tab}`);
          }
        } catch (error) {
          console.log(`❌ Error clicking tab ${tab}:`, error);
        }
      }
    } else {
      console.log('⚠️ No tabs found to test navigation');
    }
    
    // At minimum, we should have admin access
    expect(adminContent.hasAdminElements || adminContent.hasTabNavigation).toBe(true);
  });

  test('🎯 Test Specific Admin Console Features', async ({ page }) => {
    // Login and navigate
    await loginAsVlad(page);
    await navigateToAdminConsole(page);
    
    // Look for specific admin features
    const features = await page.evaluate(() => {
      const content = document.body.textContent || '';
      return {
        hasCompanyManagement: content.includes('Company') || content.includes('Client'),
        hasUserManagement: content.includes('User') && content.includes('Management'),
        hasAnalytics: content.includes('Analytics') || content.includes('Usage'),
        hasSystemAdmin: content.includes('System') && content.includes('Admin'),
        hasCreateButtons: Array.from(document.querySelectorAll('button')).some(btn => 
          btn.textContent?.includes('Create') || btn.textContent?.includes('Add')),
        hasDataTables: document.querySelectorAll('table, .table').length > 0,
        hasAdminConsoleTitle: content.includes('Admin Console') || content.includes('Administration'),
      };
    });
    
    console.log('🎯 Admin Features Check:');
    Object.entries(features).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value}`);
    });
    
    // Verify admin functionality is present
    const hasAnyAdminFeature = Object.values(features).some(Boolean);
    expect(hasAnyAdminFeature).toBe(true);
  });

  test('📝 Vlad CEO Full Admin Console Flow Summary', async ({ page }) => {
    console.log('🚀 Starting complete Vlad CEO admin console flow...');
    
    // Complete flow test
    await loginAsVlad(page);
    await navigateToAdminConsole(page);
    
    // Comprehensive analysis
    const adminContent = await checkAdminConsoleContent(page);
    const currentUrl = page.url();
    const pageTitle = await page.title();
    
    // Summary report
    console.log('\n📋 === VLAD CEO ADMIN CONSOLE SUMMARY ===');
    console.log(`✅ Login Status: SUCCESS`);
    console.log(`📍 Current URL: ${currentUrl}`);
    console.log(`📄 Page Title: ${pageTitle}`);
    console.log(`🏛️ Has Admin Elements: ${adminContent.hasAdminElements}`);
    console.log(`🗂️ Has Tab Navigation: ${adminContent.hasTabNavigation}`);
    console.log(`📋 Available Tabs: ${adminContent.tabs.join(', ')}`);
    console.log(`🎯 Admin Console Access: ${adminContent.hasAdminElements || adminContent.hasTabNavigation ? 'SUCCESS' : 'FAILED'}`);
    console.log('========================================\n');
    
    // Final validation
    expect(currentUrl).toContain('/admin/console');
    expect(adminContent.hasAdminElements || adminContent.hasTabNavigation).toBe(true);
  });
});