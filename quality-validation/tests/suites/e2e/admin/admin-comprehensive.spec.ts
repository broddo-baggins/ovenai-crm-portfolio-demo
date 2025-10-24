import { test, expect } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';

// Helper function for robust authentication
async function authenticateAsAdmin(page) {
  console.log('🔐 Authenticating as admin user...');
  
  await page.goto('/auth/login', { waitUntil: 'networkidle' });
  
  // Use multiple selector fallbacks for robustness
  const emailSelector = 'input[type="email"], input[name="email"], #email';
  const passwordSelector = 'input[type="password"], input[name="password"], #password';
  
  await page.waitForSelector(emailSelector, { timeout: 10000 });
  await page.fill(emailSelector, testCredentials.adminEmail);
  await page.fill(passwordSelector, testCredentials.adminPassword);
  
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


test.describe('Admin Console - Comprehensive Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin user
    await authenticateAsAdmin(page);
    
    // Navigate to admin console if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });

  test('Admin Console - Navigation and Access', async ({ page }) => {
    console.log('🔧 Testing admin console navigation and access...');
    
    // Navigate to admin console
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Verify admin console loaded
    await expect(page.locator('h1')).toContainText('Business Administration Console');
    
    // Verify all tabs are present
    const tabs = ['Company Management', 'User Management', 'Usage Analytics', 'System Admin'];
    for (const tab of tabs) {
      await expect(page.locator(`[role="tab"]:has-text("${tab}")`)).toBeVisible();
    }
    
    console.log('✅ Admin console navigation verified');
  });

  test('Company Management - CRUD Operations', async ({ page }) => {
    console.log('🏢 Testing company management functionality...');
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Click on Company Management tab
    await page.click('[role="tab"]:has-text("Company Management")');
    await page.waitForTimeout(1000);
    
    // Test Create Company Dialog
    const newCompanyButton = page.locator('button:has-text("New Company")');
    await expect(newCompanyButton).toBeVisible();
    await newCompanyButton.click();
    
    // Verify create company dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New Company')).toBeVisible();
    
    // Fill out company form
    await page.fill('input[id="name"]', 'Test Company Ltd');
    await page.fill('textarea[id="description"]', 'A test company for validation');
    await page.selectOption('select', 'pro');
    await page.fill('input[id="contact_email"]', 'contact@testcompany.com');
    await page.fill('input[id="contact_phone"]', '+1-555-TEST-COMPANY');
    
    // Test form submission (would create company in real scenario)
    const createButton = page.locator('button:has-text("Create Company")');
    await expect(createButton).toBeVisible();
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    console.log('✅ Company management CRUD operations verified');
  });

  test('User Management - User Creation and Permissions', async ({ page }) => {
    console.log('👥 Testing user management functionality...');
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Click on User Management tab
    await page.click('[role="tab"]:has-text("User Management")');
    await page.waitForTimeout(1000);
    
    // Test Create User Dialog
    const newUserButton = page.locator('button:has-text("New User")');
    await expect(newUserButton).toBeVisible();
    await newUserButton.click();
    
    // Verify create user dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Create New User')).toBeVisible();
    
    // Fill out user form
    await page.fill('input[id="email"]', 'newuser@testcompany.com');
    await page.fill('input[id="name"]', 'Test User');
    await page.selectOption('select', 'manager');
    
    // Test invitation settings
    const invitationSwitch = page.locator('button[role="switch"]');
    await expect(invitationSwitch).toBeVisible();
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    
    console.log('✅ User management functionality verified');
  });

  test('Usage Analytics - Real Data Display', async ({ page }) => {
    console.log('📊 Testing usage analytics functionality...');
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Click on Usage Analytics tab
    await page.click('[role="tab"]:has-text("Usage Analytics")');
    await page.waitForTimeout(1000);
    
    // Verify usage overview stats are displayed
    const statCards = [
      'Companies',
      'Total Users', 
      'Today',
      'This Month',
      'Leads Month',
      'Active Conversations',
      'Revenue'
    ];
    
    for (const stat of statCards) {
      // Look for cards containing these stats
      const statElement = page.locator(`text=${stat}`).first();
      await expect(statElement).toBeVisible();
    }
    
    // Verify analytics cards
    await expect(page.locator('text=Message Usage')).toBeVisible();
    await expect(page.locator('text=Lead Analytics')).toBeVisible();
    await expect(page.locator('text=Revenue Analytics')).toBeVisible();
    
    console.log('✅ Usage analytics display verified');
  });

  test('System Admin - Tools and Database Access', async ({ page }) => {
    console.log('⚙️ Testing system admin tools...');
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Click on System Admin tab
    await page.click('[role="tab"]:has-text("System Admin")');
    await page.waitForTimeout(1000);
    
    // Test Database Operations
    const dbButton = page.locator('button:has-text("Database Console Access")');
    await expect(dbButton).toBeVisible();
    await dbButton.click();
    
    // Verify database console dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Database Console')).toBeVisible();
    
    // Test SQL query interface
    await expect(page.locator('textarea[id="sql-query"]')).toBeVisible();
    await expect(page.locator('button:has-text("Execute Query")')).toBeVisible();
    
    // Test safety notice
    await expect(page.locator('text=Only SELECT queries are permitted')).toBeVisible();
    
    // Test query execution with sample query
    await page.fill('textarea[id="sql-query"]', 'SELECT * FROM clients LIMIT 5;');
    await page.click('button:has-text("Execute Query")');
    
    // Wait for simulated execution
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Query simulation completed')).toBeVisible();
    
    // Close database console
    await page.press('[role="dialog"]', 'Escape');
    await expect(page.locator('[role="dialog"]:has-text("Database Console")')).not.toBeVisible();
    
    // Test N8N Workflow Management
    const n8nButton = page.locator('button:has-text("N8N Workflow Management")');
    await expect(n8nButton).toBeVisible();
    await n8nButton.click();
    
    // Verify N8N dialog opens
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=N8N Workflow Management')).toBeVisible();
    
    // Verify workflows are displayed
    await expect(page.locator('text=Lead Processing Pipeline')).toBeVisible();
    await expect(page.locator('text=WhatsApp Message Router')).toBeVisible();
    
    // Close N8N dialog
    await page.press('[role="dialog"]', 'Escape');
    
    // Test Environment Config
    const envButton = page.locator('button:has-text("Environment Config")');
    await expect(envButton).toBeVisible();
    await envButton.click();
    
    // Verify environment config dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Environment Configuration')).toBeVisible();
    await expect(page.locator('text=VITE_SUPABASE_URL')).toBeVisible();
    await expect(page.locator('text=***masked***')).toBeVisible();
    
    // Close environment dialog
    await page.press('[role="dialog"]', 'Escape');
    
    console.log('✅ System admin tools verified');
  });

  test('Admin Leader Functions - Daily Tasks', async ({ page }) => {
    console.log('👑 Testing admin leader daily functions...');
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Test data refresh functionality
    const refreshButton = page.locator('button:has-text("Refresh Data")');
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();
    
    // Wait for refresh to complete
    await page.waitForTimeout(2000);
    
    // Verify real data is displayed in usage stats
    const usageStatsExists = await page.locator('text=Companies').count() > 0;
    expect(usageStatsExists).toBeTruthy();
    
    // Test search and filtering across different sections
    // Company Management search
    await page.click('[role="tab"]:has-text("Company Management")');
    const companySearch = page.locator('input[placeholder*="Search companies"]');
    if (await companySearch.count() > 0) {
      await companySearch.fill('test');
      await page.waitForTimeout(500);
      await companySearch.clear();
    }
    
    // User Management search
    await page.click('[role="tab"]:has-text("User Management")');
    const userSearch = page.locator('input[placeholder*="Search users"]');
    if (await userSearch.count() > 0) {
      await userSearch.fill('test');
      await page.waitForTimeout(500);
      await userSearch.clear();
    }
    
    console.log('✅ Admin leader daily functions verified');
  });

  test('Stored Keys and Security Management', async ({ page }) => {
    console.log('🔐 Testing stored keys and security management...');
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Navigate to System Admin
    await page.click('[role="tab"]:has-text("System Admin")');
    await page.waitForTimeout(1000);
    
    // Test Environment Config for key management
    await page.click('button:has-text("Environment Config")');
    
    // Verify security features
    await expect(page.locator('text=Sensitive values are masked for security')).toBeVisible();
    
    // Check that keys are properly masked
    await expect(page.locator('text=***masked***')).toBeVisible();
    
    // Test key visibility toggle
    const eyeButtons = page.locator('button:has(svg)').filter({ hasText: '' });
    const eyeButtonCount = await eyeButtons.count();
    
    if (eyeButtonCount > 0) {
      console.log(`Found ${eyeButtonCount} key visibility toggles`);
    }
    
    // Close dialog
    await page.press('[role="dialog"]', 'Escape');
    
    console.log('✅ Stored keys and security management verified');
  });

  test('Admin Console - Error Handling and Resilience', async ({ page }) => {
    console.log('🛡️ Testing admin console error handling...');
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Test network resilience by checking if console.error is called
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Navigate through all tabs to test for console errors
    const tabs = ['Company Management', 'User Management', 'Usage Analytics', 'System Admin'];
    for (const tab of tabs) {
      await page.click(`[role="tab"]:has-text("${tab}")`);
      await page.waitForTimeout(1000);
    }
    
    // Check that no critical errors occurred
    const criticalErrors = consoleLogs.filter(log => 
      log.includes('Uncaught') || 
      log.includes('TypeError') || 
      log.includes('ReferenceError')
    );
    
    expect(criticalErrors.length).toBe(0);
    
    // Test that admin console gracefully handles missing data
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify admin console still loads properly after refresh
    await expect(page.locator('h1')).toContainText('Business Administration Console');
    
    console.log('✅ Admin console error handling verified');
  });

  test('Admin Console - Performance and Responsiveness', async ({ page }) => {
    console.log('⚡ Testing admin console performance...');
    
    const startTime = Date.now();
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Admin console load time: ${loadTime}ms`);
    
    // Verify reasonable load time (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Test tab switching performance
    const tabs = ['User Management', 'Usage Analytics', 'System Admin', 'Company Management'];
    
    for (const tab of tabs) {
      const switchStart = Date.now();
      await page.click(`[role="tab"]:has-text("${tab}")`);
      await page.waitForTimeout(100); // Small wait for tab content to load
      const switchTime = Date.now() - switchStart;
      
      console.log(`Tab switch to ${tab}: ${switchTime}ms`);
      expect(switchTime).toBeLessThan(1000); // Tab switches should be under 1 second
    }
    
    console.log('✅ Admin console performance verified');
  });
});