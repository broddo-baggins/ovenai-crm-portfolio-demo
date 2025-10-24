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


test.describe('🔧 Simple Admin Debug Tests', () => {

  test('🔍 Debug: Check Login Page Load Issues', async ({ page }) => {
    console.log('🔧 Starting login page debug...');
    
    // Enable console error tracking
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Track page errors
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
      errors.push(error.message);
    });

    try {
      console.log('📍 Navigating to login page...');
      await page.goto('/auth/login', { 
        waitUntil: 'domcontentloaded', // Don't wait for full load
        timeout: 10000 
      });
      
      console.log('✅ Page navigation completed');
      
      // Check if basic elements exist
      const bodyText = await page.locator('body').textContent().catch(() => 'No body text');
      console.log('📄 Page content length:', bodyText.length);
      
      // Look for login form elements
      const emailInput = await page.locator('input[type="email"], input[name="email"], #email').count();
      const passwordInput = await page.locator('input[type="password"], input[name="password"], #password').count();
      const loginButton = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Sign in")').count();
      
      console.log(`🔍 Found elements - Email: ${emailInput}, Password: ${passwordInput}, Button: ${loginButton}`);
      
      // Check for error messages in UI
      const errorMessages = await page.locator('.error, .alert-error, [role="alert"]').count();
      console.log(`⚠️ Error messages in UI: ${errorMessages}`);
      
      if (errors.length > 0) {
        console.log('❌ JavaScript errors detected:');
        errors.forEach(error => console.log('  -', error));
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
    } catch (error) {
      console.log('❌ Navigation failed:', error);
    }
  });

  test('🔍 Debug: Check Admin Console Direct Access', async ({ page }) => {
    console.log('🔧 Starting admin console debug...');
    
    // Enable console error tracking
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
      errors.push(error.message);
    });

    try {
      console.log('📍 Navigating to admin console...');
      await page.goto('/admin/console', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      console.log('✅ Page navigation completed');
      
      // Check what page we actually landed on
      const url = page.url();
      const title = await page.title().catch(() => 'No title');
      const bodyText = await page.locator('body').textContent().catch(() => 'No body text');
      
      console.log('📍 Current URL:', url);
      console.log('📄 Page title:', title);
      console.log('📄 Page content length:', bodyText.length);
      console.log('📄 Page content preview:', bodyText.substring(0, 200) + '...');
      
      // Check for admin-specific elements
      const adminElements = await page.locator('text=Admin, text=Console, text=System, text=Management').count();
      console.log(`🏛️ Admin-related elements found: ${adminElements}`);
      
      // Check for tabs
      const tabElements = await page.locator('[role="tab"], .tab, .tabs').count();
      console.log(`📋 Tab elements found: ${tabElements}`);
      
      if (errors.length > 0) {
        console.log('❌ JavaScript errors detected:');
        errors.forEach(error => console.log('  -', error));
      } else {
        console.log('✅ No JavaScript errors detected');
      }
      
    } catch (error) {
      console.log('❌ Navigation failed:', error);
    }
  });

  test('🔍 Debug: Test Regular Dashboard Access', async ({ page }) => {
    console.log('🔧 Testing dashboard access...');
    
    try {
      console.log('📍 Navigating to dashboard (should redirect to login)...');
      await page.goto('/dashboard', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      const url = page.url();
      const title = await page.title().catch(() => 'No title');
      
      console.log('📍 Final URL:', url);
      console.log('📄 Page title:', title);
      
      if (url.includes('/auth/login')) {
        console.log('✅ Correctly redirected to login');
      } else if (url.includes('/dashboard')) {
        console.log('⚠️ Stayed on dashboard (user might be logged in)');
      } else {
        console.log('❓ Redirected to unexpected page');
      }
      
    } catch (error) {
      console.log('❌ Dashboard navigation failed:', error);
    }
  });
  
  test('🔍 Debug: Basic Home Page Load', async ({ page }) => {
    console.log('🔧 Testing basic home page...');
    
    try {
      console.log('📍 Navigating to home page...');
      await page.goto('/', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      const url = page.url();
      const title = await page.title().catch(() => 'No title');
      const bodyText = await page.locator('body').textContent().catch(() => 'No body text');
      
      console.log('📍 Current URL:', url);
      console.log('📄 Page title:', title);
      console.log('📄 Has content:', bodyText.length > 0);
      console.log('✅ Home page loads successfully');
      
    } catch (error) {
      console.log('❌ Home page navigation failed:', error);
    }
  });
});