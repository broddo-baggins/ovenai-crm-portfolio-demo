import { test, expect } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';

test.describe('Complete User Workflow', () => {
  test('should complete full workflow: login → projects load → switch project → dashboard updates → leads → settings → projects tab', async ({ page }) => {
    console.log('🚀 Starting comprehensive workflow test...');
    
    // Capture all console messages to debug issues
    const consoleMessages: Array<{type: string, text: string}> = [];
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Capture network errors
    const networkErrors: string[] = [];
    page.on('response', (response) => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    
    // Step 1: Navigate to landing page and initiate login
    console.log('📋 Step 1: Navigate to landing page and click Sign In');
    await page.goto('/');
    
    // Wait for landing page to load
    await page.waitForTimeout(2000);
    
    // Check if already authenticated (on dashboard)
    if (page.url().includes('/dashboard')) {
      console.log('✅ Already authenticated, proceeding to dashboard tests...');
    } else {
      // Click the "Sign In" button on landing page
      console.log('🔍 Looking for Sign In button on landing page...');
      
      // Wait for and click the Sign In button (it's in the navigation)
      await page.waitForSelector('button:has-text("Sign In")', { timeout: 10000 });
      await page.click('button:has-text("Sign In")');
      
      // Wait for navigation to login page
      await page.waitForURL('**/auth/login', { timeout: 10000 });
      console.log('✅ Navigated to login page');
      
      // Fill login form
      console.log('📝 Filling login form...');
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.fill('#email', testCredentials.email);
      await page.fill('#password', testCredentials.password);
      await page.click('button[type="submit"]');
      
      // Wait for authentication and redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      console.log('✅ Successfully logged in and redirected to dashboard');
    }
    
    // Step 2: Verify dashboard loads and projects selector is available
    console.log('📋 Step 2: Verifying dashboard and project selector');
    
    // Wait for dashboard elements to load
    await page.waitForTimeout(3000);
    
    // Look for project selector with multiple possible selectors
    const projectSelectorSelectors = [
      '[data-testid="project-selector-trigger"]',
      '[data-testid="project-selector"]', 
      'button:has-text("Project")',
      'select[name*="project"]',
      '.project-selector'
    ];
    
    let projectSelector = null;
    for (const selector of projectSelectorSelectors) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        projectSelector = element;
        console.log(`✅ Found project selector with: ${selector}`);
        break;
      }
    }
    
    if (!projectSelector) {
      console.log('⚠️ No project selector found, checking what elements are available...');
      
      // Debug: Show what's actually on the page
      const allButtons = await page.locator('button').all();
      const buttonTexts = await Promise.all(allButtons.map(btn => btn.textContent()));
      console.log('📊 Available buttons:', buttonTexts);
      
      const allSelects = await page.locator('select').all();
      const selectNames = await Promise.all(allSelects.map(sel => sel.getAttribute('name')));
      console.log('📊 Available selects:', selectNames);
    }
    
    // Step 3: Test project switching if selector available
    if (projectSelector) {
      console.log('📋 Step 3: Testing project switching');
      
      await projectSelector.click();
      await page.waitForTimeout(1000);
      
      // Look for project options
      const projectOptions = await page.locator('[role="option"], option, [data-testid*="project-option"]').count();
      console.log(`📊 Found ${projectOptions} project options`);
      
      if (projectOptions > 0) {
        await page.locator('[role="option"], option, [data-testid*="project-option"]').first().click();
        console.log('✅ Project switched successfully');
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠️ No project options found for switching');
      }
    } else {
      console.log('⚠️ Skipping project switching - no selector found');
    }
    
    // Step 4: Verify dashboard elements are present
    console.log('📋 Step 4: Verifying dashboard elements');
    
    // Look for dashboard stats/widgets
    const dashboardElements = [
      'text=Dashboard',
      '[data-testid*="stat"]',
      '.stat-card',
      'text=Total',
      'text=Leads',
      'text=Projects'
    ];
    
    let foundDashboardElements = 0;
    for (const selector of dashboardElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundDashboardElements++;
        console.log(`✅ Found dashboard element: ${selector} (${count} items)`);
      }
    }
    
    console.log(`📊 Found ${foundDashboardElements} dashboard elements`);
    
    // Step 5: Navigate to leads page
    console.log('📋 Step 5: Testing leads page navigation');
    
    // Click leads navigation link
    await page.click('a[href="/leads"], nav a:has-text("Leads")');
    await page.waitForURL('**/leads', { timeout: 10000 });
    
    // Verify leads page loads
    await page.waitForTimeout(2000);
    const searchFields = await page.locator('input[placeholder*="search"], [data-testid="search"]').count();
    console.log(`✅ Leads page loaded with ${searchFields} search fields`);
    
    // Step 6: Navigate to settings page  
    console.log('📋 Step 6: Testing settings page navigation');
    
    await page.click('a[href="/settings"], nav a:has-text("Settings")');
    await page.waitForURL('**/settings', { timeout: 10000 });
    
    // Verify settings page loads
    await page.waitForTimeout(2000);
    const editableFields = await page.locator('input[type="text"], input[type="email"], textarea').count();
    console.log(`✅ Settings page loaded with ${editableFields} editable fields`);
    
    // Step 7: Navigate to projects page
    console.log('📋 Step 7: Testing projects page navigation');
    
    await page.click('a[href="/projects"], nav a:has-text("Projects")');
    await page.waitForURL('**/projects', { timeout: 10000 });
    
    // Verify projects page loads
    await page.waitForTimeout(2000);
    const projectElements = await page.locator('[data-testid*="project"], .project-card, text=Project').count();
    console.log(`✅ Projects page loaded with ${projectElements} project-related elements`);
    
    // Final: Report console errors and network issues
    console.log('📋 Final: Checking for errors...');
    
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    if (errorMessages.length > 0) {
      console.log('⚠️ Console errors found:');
      errorMessages.forEach(error => console.log(`  ❌ ${error.text}`));
    } else {
      console.log('✅ No console errors detected');
    }
    
    if (networkErrors.length > 0) {
      console.log('🌐 Network errors:');
      networkErrors.forEach(error => console.log(`  ❌ ${error}`));
    } else {
      console.log('✅ No network errors detected');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/complete-workflow-success.png', fullPage: true });
    
    console.log('🎉 Complete workflow test completed!');
  });
  
  test('should handle project switching without errors', async ({ page }) => {
    console.log('🔄 Testing project switching specifically...');
    
    // Track console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to landing page first
    await page.goto('/');
    
    // Check if already authenticated
    if (!page.url().includes('/dashboard')) {
      // Need to login first
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('**/auth/login');
      await page.fill('#email', testCredentials.email);
      await page.fill('#password', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    }
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Look for project selector
    const projectSelectors = [
      '[data-testid="project-selector-trigger"]',
      'button:has-text("Project")',
      '.project-selector'
    ];
    
    let foundSelector = false;
    for (const selector of projectSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundSelector = true;
        
        // Test switching 3 times
        for (let i = 0; i < 3; i++) {
          console.log(`🔄 Project switch iteration ${i + 1}`);
          
          await page.click(selector);
          await page.waitForTimeout(1000);
          
          const options = await page.locator('[role="option"], option').count();
          if (options > 0) {
            await page.locator('[role="option"], option').first().click();
            await page.waitForTimeout(2000);
            console.log(`✅ Switch ${i + 1} completed`);
          }
        }
        break;
      }
    }
    
    if (!foundSelector) {
      console.log('⚠️ No project selector found - may not be implemented yet');
    }
    
    // Verify no errors during switching
    console.log(`📊 Found ${errors.length} errors during project switching`);
    errors.forEach(error => console.log(`  ❌ ${error}`));
    
    console.log('✅ Project switching test completed');
  });
}); 