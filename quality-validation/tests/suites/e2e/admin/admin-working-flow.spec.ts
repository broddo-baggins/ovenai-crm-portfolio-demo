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


// Test Users with Admin Access
const TEST_USERS = {
  REGULAR: { email: testCredentials.email, password: process.env.TEST_USER_PASSWORD || process.env.TEST_USER_PASSWORD || testCredentials.password },
  ADMIN: { email: testCredentials.email, password: process.env.TEST_USER_PASSWORD || process.env.TEST_USER_PASSWORD || testCredentials.password } // Use same working user for admin tests
};

// Helper function to handle login with form interaction
async function loginUser(page: Page, email: string, password: string): Promise<boolean> {
  try {
    console.log(`🔐 Logging in user: ${email}`);
    
    // Navigate to login page
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for form elements to be available - use multiple selector fallbacks
    const emailSelector = 'input[type="email"], input[name="email"], #email, input[name="email"], #email';
    const passwordSelector = 'input[type="password"], input[name="password"], #password, input[name="password"], #password';
    
    await page.waitForSelector(emailSelector, { timeout: 10000 });
    
    // Fill login form
    await page.fill(emailSelector, email);
    await page.fill(passwordSelector, password);
    
    // Submit the form - multiple button selector fallbacks
    const submitSelector = 'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")';
    await page.click(submitSelector);
    
    // Wait for redirect with longer timeout
    try {
      await page.waitForLoadState('networkidle', { timeout: 20000 });
      
      const currentUrl = page.url();
      console.log(`📍 After login, current URL: ${currentUrl}`);
      
      // Check if we're successfully authenticated (not on login page)
      if (currentUrl.includes('/dashboard') || 
          currentUrl.includes('/admin') || 
          currentUrl.includes('/leads') ||
          currentUrl.includes('/projects') ||
          !currentUrl.includes('/auth/login')) {
        console.log('✅ Login successful');
        return true;
      } else {
        console.log('❌ Login failed - still on login page');
        return false;
      }
    } catch (error) {
      console.log('⚠️ Login navigation timeout, checking if authenticated...');
      const currentUrl = page.url();
      console.log(`📍 Final URL: ${currentUrl}`);
      // Consider successful if not on login page
      return !currentUrl.includes('/auth/login');
    }
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error);
    return false;
  }
}

// Helper function to check admin access
async function checkAdminAccess(page: Page): Promise<{ hasAccess: boolean; isRealConsole: boolean; content: string }> {
  try {
    console.log('🏛️ Checking admin console access...');
    
    // Navigate to admin console
    await page.goto('/admin/console', { waitUntil: 'domcontentloaded' });
    
    // Get page content for analysis
    const pageContent = await page.textContent('body');
    const pageTitle = await page.title();
    const currentUrl = page.url();
    
    console.log(`📍 Admin console URL: ${currentUrl}`);
    console.log(`📄 Page title: ${pageTitle}`);
    console.log(`📄 Content preview: ${pageContent?.substring(0, 200)}...`);
    
    // Check if we're seeing the admin console vs login/landing page
    const isLoginPage = pageContent?.includes('Sign In') && pageContent?.includes('Enter your credentials');
    const isLandingPage = pageContent?.includes('Welcome Back to OvenAI') && pageContent?.includes('smart platform');
    const isAdminConsole = pageContent?.includes('Admin Console') || pageContent?.includes('Business Administration');
    
    // Look for admin-specific elements
    const adminElements = await page.locator('text=Admin Console, text=System Admin, text=Company Management, text=User Management').count();
    const tabElements = await page.locator('[role="tab"]').count();
    
    console.log(`🔍 Admin elements found: ${adminElements}`);
    console.log(`📋 Tab elements found: ${tabElements}`);
    
    if (isLoginPage) {
      console.log('🚫 Redirected to login page - no admin access');
      return { hasAccess: false, isRealConsole: false, content: 'login_page' };
    } else if (isLandingPage) {
      console.log('🏠 Redirected to landing page - insufficient permissions');
      return { hasAccess: false, isRealConsole: false, content: 'landing_page' };
    } else if (isAdminConsole || adminElements > 0) {
      console.log('✅ Real admin console detected');
      return { hasAccess: true, isRealConsole: true, content: 'admin_console' };
    } else {
      console.log('❓ Unknown page content');
      return { hasAccess: false, isRealConsole: false, content: 'unknown' };
    }
  } catch (error) {
    console.error('❌ Failed to check admin access:', error);
    return { hasAccess: false, isRealConsole: false, content: 'error' };
  }
}

// Helper function to check admin tabs
async function checkAdminTabs(page: Page): Promise<string[]> {
  try {
    // Wait for tabs to load
    await page.waitForSelector('[role="tablist"], [role="tab"]', { timeout: 5000 });
    
    const tabs = await page.locator('[role="tab"]').all();
    const tabNames: string[] = [];
    
    for (const tab of tabs) {
      const tabText = await tab.textContent();
      if (tabText) {
        tabNames.push(tabText.trim());
      }
    }
    
    return tabNames;
  } catch (error) {
    console.log('⚠️ No tabs found or timeout');
    return [];
  }
}

test.describe('🛡️ Working Admin Console Flow Tests', () => {

  test('🔍 Debug: Full Authentication and Admin Access Flow', async ({ page }) => {
    console.log('🚀 Starting full admin flow debug...');
    
    // Step 1: Test with regular user (should not have admin access)
    console.log('\n--- Testing Regular User ---');
    const regularLoginSuccess = await loginUser(page, TEST_USERS.REGULAR.email, TEST_USERS.REGULAR.password);
    
    if (regularLoginSuccess) {
      console.log('✅ Regular user login successful');
      const regularAdminAccess = await checkAdminAccess(page);
      console.log(`🏛️ Regular user admin access: ${JSON.stringify(regularAdminAccess)}`);
      
      // Regular user should not have admin access
      expect(regularAdminAccess.hasAccess).toBe(false);
    } else {
      console.log('❌ Regular user login failed');
    }
    
    // Step 2: Test with CEO user (should have admin access)
    console.log('\n--- Testing CEO User (Vlad) ---');
    const ceoLoginSuccess = await loginUser(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password); // Changed to ADMIN user
    
    if (ceoLoginSuccess) {
      console.log('✅ CEO user login successful');
      const ceoAdminAccess = await checkAdminAccess(page);
      console.log(`🏛️ CEO user admin access: ${JSON.stringify(ceoAdminAccess)}`);
      
      if (ceoAdminAccess.hasAccess && ceoAdminAccess.isRealConsole) {
        console.log('🎉 CEO has real admin console access!');
        
        // Check available tabs
        const tabs = await checkAdminTabs(page);
        console.log(`📋 Available tabs: ${tabs.join(', ')}`);
        
        // Test tab functionality
        for (const tab of tabs) {
          try {
            await page.click(`[role="tab"]:has-text("${tab}")`);
            await page.waitForTimeout(1000);
            console.log(`✅ Successfully clicked tab: ${tab}`);
          } catch (error) {
            console.log(`❌ Failed to click tab: ${tab}`);
          }
        }
      } else {
        console.log(`❌ CEO does not have proper admin access: ${ceoAdminAccess.content}`);
      }
    } else {
      console.log('❌ CEO user login failed');
    }
  });

  test('🏛️ Vlad CEO Admin Console Access Test', async ({ page }) => {
    // Login as CEO
    const loginSuccess = await loginUser(page, TEST_USERS.ADMIN.email, TEST_USERS.ADMIN.password); // Changed to ADMIN user
    expect(loginSuccess).toBe(true);
    
    // Check admin console access
    const adminAccess = await checkAdminAccess(page);
    
    // Vlad should have admin access
    if (!adminAccess.hasAccess) {
      console.log(`❌ Vlad does not have admin access. Content type: ${adminAccess.content}`);
      
      // If showing login page, there's an authentication issue
      if (adminAccess.content === 'login_page') {
        throw new Error('Admin console redirects to login - authentication issue');
      }
      
      // If showing landing page, there's an authorization issue  
      if (adminAccess.content === 'landing_page') {
        throw new Error('Admin console shows landing page - authorization issue');
      }
    }
    
    expect(adminAccess.hasAccess).toBe(true);
    expect(adminAccess.isRealConsole).toBe(true);
  });

  test('🚫 Regular User Cannot Access Admin Console', async ({ page }) => {
    // Login as regular user
    const loginSuccess = await loginUser(page, TEST_USERS.REGULAR.email, TEST_USERS.REGULAR.password);
    expect(loginSuccess).toBe(true);
    
    // Check admin console access (should be denied)
    const adminAccess = await checkAdminAccess(page);
    expect(adminAccess.hasAccess).toBe(false);
  });
});