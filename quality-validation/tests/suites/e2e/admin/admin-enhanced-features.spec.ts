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


test.describe('Admin Console - Safe Enhanced Features', () => {
  
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin user
    await authenticateAsAdmin(page);
    
    // Navigate to admin console if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });

  test('should load admin console with existing tables safely', async ({ page }) => {
    // Check admin console loads
    await expect(page.locator('h1')).toContainText('Admin Console');
    
    // Check stats are loaded from real data
    await expect(page.locator('[data-testid="stat-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-companies"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-leads"]')).toBeVisible();
    
    // Verify system status shows online
    await expect(page.locator('text=System Online')).toBeVisible();
  });

  test('should access all admin tabs without errors', async ({ page }) => {
    const tabs = ['companies', 'users', 'roles', 'settings', 'audit', 'system'];
    
    for (const tab of tabs) {
      await page.click(`[data-value="${tab}"]`);
      await page.waitForTimeout(500);
      
      // Ensure no error messages appear
      await expect(page.locator('text=Error')).toHaveCount(0);
      await expect(page.locator('text=Failed')).toHaveCount(0);
    }
  });

  test('should show existing table data safely', async ({ page }) => {
    // Check companies tab uses existing clients table
    await page.click('[data-value="companies"]');
    await expect(page.locator('text=Using existing \'clients\' table')).toBeVisible();
    
    // Check settings tab references existing user settings tables  
    await page.click('[data-value="settings"]');
    await expect(page.locator('text=existing user settings tables')).toBeVisible();
    
    // Check audit tab references existing audit log table
    await page.click('[data-value="audit"]');
    await expect(page.locator('text=existing \'client_audit_log\' table')).toBeVisible();
  });

  test('should show real database statistics', async ({ page }) => {
    // Check system tab shows real schema info
    await page.click('[data-value="system"]');
    await expect(page.locator('text=Current (20 tables)')).toBeVisible();
    await expect(page.locator('text=Connected')).toBeVisible();
    await expect(page.locator('text=Monitoring')).toBeVisible();
    
    // Refresh stats button should work
    await page.click('button:has-text("Refresh System Stats")');
    await page.waitForTimeout(1000);
    await expect(page.locator('button:has-text("Refresh System Stats")')).toBeVisible();
  });

  test('should not attempt any schema modifications', async ({ page }) => {
    // Monitor network for any CREATE TABLE or ALTER TABLE requests
    const dbRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('supabase') && request.method() === 'POST') {
        dbRequests.push(request.url());
      }
    });
    
    // Navigate through all tabs
    const tabs = ['companies', 'users', 'roles', 'settings', 'audit', 'system'];
    for (const tab of tabs) {
      await page.click(`[data-value="${tab}"]`);
      await page.waitForTimeout(500);
    }
    
    // Refresh stats
    await page.click('[data-value="system"]');
    await page.click('button:has-text("Refresh System Stats")');
    await page.waitForTimeout(2000);
    
    // Verify no dangerous SQL operations
    const dangerousOperations = dbRequests.filter(req => 
      req.includes('CREATE') || req.includes('ALTER') || req.includes('DROP')
    );
    expect(dangerousOperations).toHaveLength(0);
  });

  test('should preserve Agent DB sync safety', async ({ page }) => {
    // Check system monitoring indicates safe operation
    await page.click('[data-value="system"]');
    
    await expect(page.locator('text=Agent DB Sync')).toBeVisible();
    await expect(page.locator('text=Monitoring')).toBeVisible();
    
    // No sync warnings should appear
    await expect(page.locator('text=Sync Error')).toHaveCount(0);
    await expect(page.locator('text=Sync Failed')).toHaveCount(0);
  });

  test('should load user creation wizard safely', async ({ page }) => {
    await page.click('[data-value="users"]');
    
    // Check user creation wizard is available
    await expect(page.locator('text=User Creation')).toBeVisible();
    
    // Check password reset manager is available
    await expect(page.locator('text=Password Reset')).toBeVisible();
  });

  test('should access role management without errors', async ({ page }) => {
    await page.click('[data-value="roles"]');
    
    // Should show role management interface
    await expect(page.locator('[data-testid="role-management-table"]')).toBeVisible();
    
    // No table creation errors
    await expect(page.locator('text=does not exist')).toHaveCount(0);
  });

  test('should work in RTL mode', async ({ page }) => {
    // Switch to Hebrew/RTL
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'he';
    });
    
    await page.reload();
    await page.waitForSelector('[data-testid="admin-console"]');
    
    // Check RTL layout works
    await expect(page.locator('h1')).toContainText('Admin Console');
    
    // Test all tabs work in RTL
    const tabs = ['companies', 'users', 'roles', 'settings'];
    for (const tab of tabs) {
      await page.click(`[data-value="${tab}"]`);
      await expect(page.locator('text=Error')).toHaveCount(0);
    }
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Check loading indicators
    await page.reload();
    
    // Should show loading state initially
    await expect(page.locator('text=...')).toBeVisible();
    
    // Should resolve to actual numbers
    await page.waitForTimeout(2000);
    await expect(page.locator('text=...')).toHaveCount(0);
  });

});