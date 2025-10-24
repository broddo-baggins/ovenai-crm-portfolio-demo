import { test, expect } from '@playwright/test';
import { authenticateAndNavigate } from '../__helpers__/auth-helper';

test('Simple Sidebar Test', async ({ page }) => {
  console.log('🧪 Starting simple sidebar test with real authentication...');
  
  try {
    // Use real authentication to navigate to dashboard
    await authenticateAndNavigate(page, '/dashboard');
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    console.log('Current URL:', page.url());
    
    // Check if sidebar is visible
    const sidebar = page.locator('[data-testid="main-sidebar"]');
    const isVisible = await sidebar.isVisible({ timeout: 10000 });
    
    if (isVisible) {
      console.log('✅ Sidebar is visible');
      
      // Check for key sidebar elements
      const sidebarContent = page.locator('[data-testid="sidebar-content"]');
      const sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
      const sidebarFooter = page.locator('[data-testid="sidebar-footer"]');
      
      console.log('Sidebar content visible:', await sidebarContent.isVisible());
      console.log('Sidebar menu visible:', await sidebarMenu.isVisible());
      console.log('Sidebar footer visible:', await sidebarFooter.isVisible());
      
      // Check for navigation items
      const dashboardLink = page.locator('[data-testid="nav-link-dashboard"]');
      const leadsLink = page.locator('[data-testid="nav-link-leads"]');
      const reportsLink = page.locator('[data-testid="nav-link-reports"]');
      
      console.log('Dashboard link visible:', await dashboardLink.isVisible());
      console.log('Leads link visible:', await leadsLink.isVisible());
      console.log('Reports link visible:', await reportsLink.isVisible());
      
      // Check user information
      const username = page.locator('[data-testid="sidebar-username"]');
      const userEmail = page.locator('[data-testid="sidebar-user-email"]');
      
      if (await username.isVisible()) {
        const usernameText = await username.textContent();
        console.log('Username:', usernameText);
      }
      
      if (await userEmail.isVisible()) {
        const emailText = await userEmail.textContent();
        console.log('User email:', emailText);
      }
      
      // Test basic assertions
      await expect(sidebar).toBeVisible();
      await expect(sidebarContent).toBeVisible();
      await expect(sidebarMenu).toBeVisible();
      
      console.log('✅ All basic sidebar tests passed');
      
    } else {
      console.log('❌ Sidebar is not visible');
      
      // Debug: Check what's on the page
      const pageTitle = await page.title();
      const bodyText = await page.locator('body').textContent();
      
      console.log('Page title:', pageTitle);
      console.log('Page contains:', bodyText?.substring(0, 200));
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/debug-sidebar-not-visible.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/debug-sidebar-error.png', fullPage: true });
    
    throw error;
  }
}); 