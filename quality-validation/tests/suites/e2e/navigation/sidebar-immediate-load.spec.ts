import { test, expect } from '@playwright/test';
import { authenticateAndNavigate } from '../__helpers__/auth-helper';

test.describe('Sidebar Immediate Load Test', () => {
  // Reduce timeout for faster feedback
  test.setTimeout(30000);

  test('should show navigation items immediately on page load', async ({ page }) => {
    console.log('🧪 Testing immediate sidebar visibility...');
    
    try {
      // Use the auth helper instead of manual navigation
      await authenticateAndNavigate(page, '/dashboard');
      
      // Check that sidebar is visible IMMEDIATELY
      const sidebar = page.locator('[data-testid="main-sidebar"]');
      await expect(sidebar).toBeVisible({ timeout: 5000 });
      
      // Check that navigation items are visible IMMEDIATELY (within 2 seconds)
      console.log('🔍 Checking immediate visibility of navigation items...');
      
      const dashboardLink = page.locator('[data-testid="nav-link-dashboard"]');
      const leadsLink = page.locator('[data-testid="nav-link-leads"]');
      const reportsLink = page.locator('[data-testid="nav-link-reports"]');
      
      // These should be visible immediately, not after auth loading
      await expect(dashboardLink).toBeVisible({ timeout: 2000 });
      await expect(leadsLink).toBeVisible({ timeout: 2000 });
      await expect(reportsLink).toBeVisible({ timeout: 2000 });
      
      console.log('✅ Navigation items are visible immediately!');
      
      // Verify the links have proper text
      await expect(dashboardLink).toContainText('Dashboard');
      await expect(leadsLink).toContainText('Leads');
      await expect(reportsLink).toContainText('Reports');
      
      // Check that sidebar menu is not empty
      const sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
      await expect(sidebarMenu).toBeVisible();
      
      // Ensure no "Loading navigation..." message is shown
      const loadingMessage = page.locator('[data-testid="sidebar-empty"]');
      await expect(loadingMessage).not.toBeVisible();
      
      console.log('✅ Sidebar loads immediately with all navigation items!');
    } catch (error) {
      console.error('❌ Test failed:', error);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/sidebar-immediate-load-failure.png' });
      
      // Re-throw the error to fail the test
      throw error;
    }
  });

  test('should show user info after auth completes', async ({ page }) => {
    console.log('🧪 Testing user info loading...');
    
    try {
      // Use auth helper with shorter timeout
      await authenticateAndNavigate(page, '/dashboard');
      
      // Wait a shorter time for auth to complete
      await page.waitForTimeout(1000);
      
      // Check that user info is loaded
      const username = page.locator('[data-testid="sidebar-username"]');
      const userEmail = page.locator('[data-testid="sidebar-user-email"]');
      
      await expect(username).toBeVisible({ timeout: 5000 });
      await expect(userEmail).toBeVisible({ timeout: 5000 });
      
      // Should not show "Loading..." anymore (give it time to update)
      await page.waitForTimeout(2000);
      await expect(username).not.toContainText('Loading...');
      await expect(userEmail).not.toContainText('Loading...');
      
      console.log('✅ User info loads properly after authentication!');
    } catch (error) {
      console.error('❌ User info test failed:', error);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/sidebar-user-info-failure.png' });
      
      // Log current page state for debugging
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      const username = page.locator('[data-testid="sidebar-username"]');
      const userEmail = page.locator('[data-testid="sidebar-user-email"]');
      
      const usernameText = await username.textContent().catch(() => 'NOT_FOUND');
      const userEmailText = await userEmail.textContent().catch(() => 'NOT_FOUND');
      
      console.log('Username text:', usernameText);
      console.log('User email text:', userEmailText);
      
      // Re-throw the error to fail the test
      throw error;
    }
  });

  test('should handle sidebar toggle functionality', async ({ page }) => {
    console.log('🧪 Testing sidebar toggle functionality...');
    
    try {
      await authenticateAndNavigate(page, '/dashboard');
      
      // Find the sidebar toggle button
      const toggleButton = page.locator('[data-testid="sidebar-toggle"]');
      await expect(toggleButton).toBeVisible({ timeout: 5000 });
      
      // Test toggle functionality
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Verify sidebar state changed (collapsed/expanded)
      const sidebar = page.locator('[data-testid="main-sidebar"]');
      await expect(sidebar).toBeVisible(); // Should still be visible, just collapsed
      
      // Toggle back
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      console.log('✅ Sidebar toggle functionality works!');
    } catch (error) {
      console.error('❌ Sidebar toggle test failed:', error);
      throw error;
    }
  });
}); 