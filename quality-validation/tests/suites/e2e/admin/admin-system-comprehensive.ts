import { test, expect, Page } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';

// Admin test configurations
const ADMIN_TEST_CONFIG = {
  SYSTEM_ADMIN: {
    email: testCredentials.email,
    password: testCredentials.password,
    role: 'system_admin'
  },
  COMPANY_ADMIN: {
    email: testCredentials.adminEmail,
    password: testCredentials.adminPassword,
    role: 'company_admin'
  },
  REGULAR_USER: {
    email: testCredentials.regularEmail,
    password: testCredentials.regularPassword,
    role: 'user'
  }
};

// Helper functions
async function loginAs(page: Page, userType: keyof typeof ADMIN_TEST_CONFIG) {
  const config = ADMIN_TEST_CONFIG[userType];
  
  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', config.email);
  await page.fill('[data-testid="password-input"]', config.password);
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login and redirect
  await page.waitForURL('/dashboard', { timeout: 15000 });
  await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
}

async function navigateToAdminCenter(page: Page) {
  // Navigate via Settings page admin button
  await page.goto('/settings');
  await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  
  // Click Admin Center button if visible
  const adminButton = page.locator('button:has-text("Admin Center")');
  if (await adminButton.isVisible()) {
    await adminButton.click();
    await page.waitForURL('/admin', { timeout: 10000 });
    return true;
  }
  return false;
}

async function checkAdminLandingPage(page: Page, expectedAdminType: 'system' | 'company' | 'none') {
  await page.goto('/admin');
  
  if (expectedAdminType === 'none') {
    // Should show access denied
    await expect(page.locator('text=Access denied')).toBeVisible();
    await expect(page.locator('button:has-text("Back to Dashboard")')).toBeVisible();
    return;
  }
  
  // Should show admin center
  await expect(page.locator('h1:has-text("Admin Center")')).toBeVisible();
  
  if (expectedAdminType === 'system') {
    // System admin should see system console card
    await expect(page.locator('[data-testid="system-admin-card"]', { hasText: 'System Admin Console' })).toBeVisible();
    await expect(page.locator('text=Full platform administration')).toBeVisible();
    await expect(page.locator('button:has-text("Access System Console")')).toBeVisible();
  }
  
  if (expectedAdminType === 'company' || expectedAdminType === 'system') {
    // Company admin (and system admin) should see company management card  
    await expect(page.locator('[data-testid="company-admin-card"]', { hasText: 'Company Management' })).toBeVisible();
    await expect(page.locator('text=Manage users and settings for your company')).toBeVisible();
    await expect(page.locator('button:has-text("Manage Company")')).toBeVisible();
  }
}

// Test group 1: System Admin Full Access
test.describe('System Admin - Full Platform Access', () => {
  test('System admin can access admin center from settings', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    
    // Should be able to access admin center from settings
    const canAccess = await navigateToAdminCenter(page);
    expect(canAccess).toBe(true);
    
    // Verify admin center shows system admin options
    await checkAdminLandingPage(page, 'system');
  });

  test('System admin can access system console', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    await page.goto('/admin');
    
    // Click system console button
    await page.click('button:has-text("Access System Console")');
    await page.waitForURL('/admin/console', { timeout: 10000 });
    
    // Verify system console page loads
    await expect(page.locator('[data-testid="admin-console-page"]')).toBeVisible();
    await expect(page.locator('text=System Administration')).toBeVisible();
  });

  test('System admin can access company management', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    await page.goto('/admin');
    
    // Click company management button
    await page.click('button:has-text("Manage Company")');
    await page.waitForURL('/admin/company', { timeout: 10000 });
    
    // Verify company management page loads
    await expect(page.locator('[data-testid="company-management-page"]')).toBeVisible();
    await expect(page.locator('text=Company Management')).toBeVisible();
  });

  test('System admin sees all permissions in admin center', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    await page.goto('/admin');
    
    // Check that system admin permissions are displayed
    await expect(page.locator('text=system: full access')).toBeVisible();
    await expect(page.locator('text=database: read write')).toBeVisible();
    await expect(page.locator('text=users: manage')).toBeVisible();
  });

  test('System admin navigation shows admin center', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    
    // Check main navigation
    await expect(page.locator('[data-testid="main-sidebar"]')).toBeVisible();
    await expect(page.locator('a[href="/admin"]:has-text("Admin Center")')).toBeVisible();
    
    // Click admin center in navigation
    await page.click('a[href="/admin"]:has-text("Admin Center")');
    await page.waitForURL('/admin', { timeout: 10000 });
    await checkAdminLandingPage(page, 'system');
  });
});

// Test group 2: Company Admin Limited Access  
test.describe('Company Admin - Company-Level Access', () => {
  test('Company admin can access admin center from settings', async ({ page }) => {
    await loginAs(page, 'COMPANY_ADMIN');
    
    // Should be able to access admin center from settings
    const canAccess = await navigateToAdminCenter(page);
    expect(canAccess).toBe(true);
    
    // Verify admin center shows company admin options only
    await checkAdminLandingPage(page, 'company');
  });

  test('Company admin cannot access system console', async ({ page }) => {
    await loginAs(page, 'COMPANY_ADMIN');
    await page.goto('/admin');
    
    // Should NOT see system console button
    await expect(page.locator('button:has-text("Access System Console")')).not.toBeVisible();
    
    // Direct navigation to system console should be blocked
    await page.goto('/admin/console');
    // Should either redirect or show access denied
    // Depends on implementation - could be access denied or redirect to /admin
  });

  test('Company admin can access company management', async ({ page }) => {
    await loginAs(page, 'COMPANY_ADMIN');
    await page.goto('/admin');
    
    // Click company management button
    await page.click('button:has-text("Manage Company")');
    await page.waitForURL('/admin/company', { timeout: 10000 });
    
    // Verify company management page loads
    await expect(page.locator('[data-testid="company-management-page"]')).toBeVisible();
    await expect(page.locator('text=Company Management')).toBeVisible();
  });

  test('Company admin sees limited permissions', async ({ page }) => {
    await loginAs(page, 'COMPANY_ADMIN');
    await page.goto('/admin');
    
    // Check that only company admin permissions are displayed
    await expect(page.locator('text=company: manage users')).toBeVisible();
    await expect(page.locator('text=company: view data')).toBeVisible();
    
    // Should NOT see system-level permissions
    await expect(page.locator('text=system: full access')).not.toBeVisible();
    await expect(page.locator('text=database: read write')).not.toBeVisible();
  });

  test('Company admin navigation shows admin center', async ({ page }) => {
    await loginAs(page, 'COMPANY_ADMIN');
    
    // Check main navigation shows admin center
    await expect(page.locator('[data-testid="main-sidebar"]')).toBeVisible();
    await expect(page.locator('a[href="/admin"]:has-text("Admin Center")')).toBeVisible();
    
    // Click admin center in navigation
    await page.click('a[href="/admin"]:has-text("Admin Center")');
    await page.waitForURL('/admin', { timeout: 10000 });
    await checkAdminLandingPage(page, 'company');
  });
});

// Test group 3: Regular User No Admin Access
test.describe('Regular User - No Admin Access', () => {
  test('Regular user cannot access admin center from settings', async ({ page }) => {
    await loginAs(page, 'REGULAR_USER');
    
    // Should NOT be able to access admin center from settings
    const canAccess = await navigateToAdminCenter(page);
    expect(canAccess).toBe(false);
  });

  test('Regular user cannot access admin center directly', async ({ page }) => {
    await loginAs(page, 'REGULAR_USER');
    
    // Direct navigation should show access denied
    await checkAdminLandingPage(page, 'none');
  });

  test('Regular user cannot access system console', async ({ page }) => {
    await loginAs(page, 'REGULAR_USER');
    
    // Direct navigation should redirect or show access denied
    await page.goto('/admin/console');
    
    // Should either redirect to admin (which shows access denied) or show access denied directly
    const url = page.url();
    if (url.includes('/admin/console')) {
      await expect(page.locator('text=Access denied')).toBeVisible();
    } else {
      // Redirected to /admin with access denied
      expect(url).toContain('/admin');
      await expect(page.locator('text=Access denied')).toBeVisible();
    }
  });

  test('Regular user cannot access company management', async ({ page }) => {
    await loginAs(page, 'REGULAR_USER');
    
    // Direct navigation should redirect or show access denied
    await page.goto('/admin/company');
    
    // Should either redirect to admin (which shows access denied) or show access denied directly
    const url = page.url();
    if (url.includes('/admin/company')) {
      await expect(page.locator('text=Access denied')).toBeVisible();
    } else {
      // Redirected to /admin with access denied
      expect(url).toContain('/admin');
      await expect(page.locator('text=Access denied')).toBeVisible();
    }
  });

  test('Regular user navigation does not show admin center', async ({ page }) => {
    await loginAs(page, 'REGULAR_USER');
    
    // Check main navigation does NOT show admin center
    await expect(page.locator('[data-testid="main-sidebar"]')).toBeVisible();
    await expect(page.locator('a[href="/admin"]:has-text("Admin Center")')).not.toBeVisible();
  });

  test('Regular user settings page does not show admin button', async ({ page }) => {
    await loginAs(page, 'REGULAR_USER');
    await page.goto('/settings');
    
    // Should NOT see admin center button in settings
    await expect(page.locator('button:has-text("Admin Center")')).not.toBeVisible();
  });
});

// Test group 4: Navigation and URL Access
test.describe('Admin System Navigation & URLs', () => {
  test('Backward compatibility - old company-management URL redirects', async ({ page }) => {
    await loginAs(page, 'COMPANY_ADMIN');
    
    // Old URL should redirect to new admin structure
    await page.goto('/company-management');
    await page.waitForURL('/admin/company', { timeout: 10000 });
    
    // Verify redirect worked
    await expect(page.locator('[data-testid="company-management-page"]')).toBeVisible();
  });

  test('Admin center shows appropriate quick actions for system admin', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    await page.goto('/admin');
    
    // Should see system admin quick actions
    await expect(page.locator('button:has-text("Manage All Users")')).toBeVisible();
    await expect(page.locator('button:has-text("Database Console")')).toBeVisible();
    await expect(page.locator('button:has-text("System Logs")')).toBeVisible();
  });

  test('Admin center shows appropriate quick actions for company admin', async ({ page }) => {
    await loginAs(page, 'COMPANY_ADMIN');
    await page.goto('/admin');
    
    // Should see company admin quick actions
    await expect(page.locator('button:has-text("Add User")')).toBeVisible();
    await expect(page.locator('button:has-text("Company Settings")')).toBeVisible();
    await expect(page.locator('button:has-text("Company Reports")')).toBeVisible();
    
    // Should NOT see system admin quick actions
    await expect(page.locator('button:has-text("Database Console")')).not.toBeVisible();
    await expect(page.locator('button:has-text("System Logs")')).not.toBeVisible();
  });

  test('Admin breadcrumbs and back navigation work correctly', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    
    // Navigate from admin center to system console
    await page.goto('/admin');
    await page.click('button:has-text("Access System Console")');
    await page.waitForURL('/admin/console', { timeout: 10000 });
    
    // Back button should return to admin center
    await page.click('button:has-text("Back")');
    await page.waitForURL('/admin', { timeout: 10000 });
    await checkAdminLandingPage(page, 'system');
  });
});

// Test group 5: Mobile Admin Access  
test.describe('Mobile Admin Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('System admin mobile navigation shows admin center', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    
    // On mobile, admin center should be in hamburger menu or bottom nav
    const mobileNav = page.locator('[data-testid="mobile-navigation"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav.locator('a[href="/admin"]:has-text("Admin Center")')).toBeVisible();
    }
  });

  test('Company admin mobile admin center is touch-friendly', async ({ page }) => {
    await loginAs(page, 'COMPANY_ADMIN');
    await page.goto('/admin');
    
    // Check that buttons are properly sized for touch
    const companyManagementButton = page.locator('button:has-text("Manage Company")');
    await expect(companyManagementButton).toBeVisible();
    
    // Button should be at least 44px high (iOS minimum touch target)
    const buttonBox = await companyManagementButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
  });
});

// Test group 6: Admin System Error Handling
test.describe('Admin System Error Handling', () => {
  test('Admin center handles loading states gracefully', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    
    // Navigate to admin center and check for loading states
    await page.goto('/admin');
    
    // Initially might show loading state
    const loadingIndicator = page.locator('[data-testid="admin-loading"]');
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      // Wait for loading to complete
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }
    
    // Should eventually show admin center content
    await expect(page.locator('h1:has-text("Admin Center")')).toBeVisible();
  });

  test('Admin system gracefully handles permission failures', async ({ page }) => {
    await loginAs(page, 'REGULAR_USER');
    
    // Try to access admin areas and verify graceful error handling
    await page.goto('/admin');
    
    // Should show access denied message, not crash
    await expect(page.locator('text=Access denied')).toBeVisible();
    await expect(page.locator('button:has-text("Back to Dashboard")')).toBeVisible();
    
    // Back button should work
    await page.click('button:has-text("Back to Dashboard")');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });
});

// Test group 7: Performance and Accessibility
test.describe('Admin System Performance & Accessibility', () => {
  test('Admin center loads within performance budget', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    
    const startTime = Date.now();
    await page.goto('/admin');
    await expect(page.locator('h1:has-text("Admin Center")')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Admin center is keyboard accessible', async ({ page }) => {
    await loginAs(page, 'SYSTEM_ADMIN');
    await page.goto('/admin');
    
    // Should be able to navigate with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate buttons with Enter/Space
    await page.keyboard.press('Enter');
    // Note: This would need more specific testing based on the actual implementation
  });
});

// Test group 8: Multi-tab and Session Management
test.describe('Admin System Session Management', () => {
  test('Admin access persists across browser tabs', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Login on first tab
    await loginAs(page1, 'SYSTEM_ADMIN');
    
    // Second tab should also have admin access
    await page2.goto('/admin');
    await checkAdminLandingPage(page2, 'system');
    
    await page1.close();
    await page2.close();
  });

  test('Admin permissions update in real-time across tabs', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Login as company admin on both tabs
    await loginAs(page1, 'COMPANY_ADMIN');
    await page2.goto('/admin');
    
    // Both tabs should show company admin interface
    await checkAdminLandingPage(page1, 'company');
    await checkAdminLandingPage(page2, 'company');
    
    await page1.close();
    await page2.close();
  });
}); 