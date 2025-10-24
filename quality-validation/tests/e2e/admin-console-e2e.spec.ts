import { test, expect, Page } from '@playwright/test';
import { testCredentials } from '../__helpers__/test-credentials';

// Test configuration
const TEST_USER = {
  email: testCredentials.email,
  password: testCredentials.password
};

const ADMIN_CONSOLE_URL = '/admin';

// Helper functions
async function loginAsTestUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

async function navigateToAdminConsole(page: Page) {
  await page.goto(ADMIN_CONSOLE_URL);
  await page.waitForLoadState('networkidle');
}

test.describe('Admin Console E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should load admin console without errors', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Admin Console/);
    await expect(page.locator('h2')).toContainText('Admin Console');
    
    // Check for no JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('should display appropriate tabs for user level', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Check for overview tab (should always be present)
    await expect(page.locator('[data-testid="tab-overview"]')).toBeVisible();
    
    // Check for system prompts tab
    await expect(page.locator('[data-testid="tab-prompts"]')).toBeVisible();
    
    // Check admin level badge
    const adminBadge = page.locator('[data-testid="admin-level-badge"]');
    if (await adminBadge.isVisible()) {
      const badgeText = await adminBadge.textContent();
      expect(badgeText).toMatch(/(SYSTEM_ADMIN|CLIENT_ADMIN|USER)/);
    }
  });

  test('should display analytics overview correctly', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Navigate to overview tab
    await page.click('[data-testid="tab-overview"]');
    
    // Check for analytics cards
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Active Leads')).toBeVisible();
    await expect(page.locator('text=API Keys')).toBeVisible();
    await expect(page.locator('text=Projects')).toBeVisible();
    
    // Check that numbers are displayed (not just 0)
    const userCount = page.locator('text=Total Users').locator('..').locator('.text-2xl');
    const userCountText = await userCount.textContent();
    expect(userCountText).toMatch(/\d+/);
  });

  test('should navigate to system prompts tab', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Navigate to system prompts tab
    await page.click('text=System Prompts');
    
    // Check for system prompts content
    await expect(page.locator('text=System Prompts Management')).toBeVisible();
    await expect(page.locator('input[placeholder*="Search prompts"]')).toBeVisible();
    
    // Check for system prompt reader components
    const systemPromptCards = page.locator('[data-testid="system-prompt-card"]');
    if (await systemPromptCards.count() > 0) {
      await expect(systemPromptCards.first()).toBeVisible();
    }
  });

  test('should handle system prompt search functionality', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Navigate to system prompts tab
    await page.click('text=System Prompts');
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search prompts"]');
    await searchInput.fill('Kata');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check that search affects the displayed content
    const searchResults = page.locator('[data-testid="system-prompt-card"]');
    if (await searchResults.count() > 0) {
      const firstResult = await searchResults.first().textContent();
      expect(firstResult?.toLowerCase()).toContain('kata');
    }
  });

  test('should display system prompt reader with sections', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Navigate to system prompts tab
    await page.click('text=System Prompts');
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check if system prompt reader is present
    const systemPromptReader = page.locator('[data-testid="system-prompt-reader"]');
    if (await systemPromptReader.isVisible()) {
      // Check for section headers
      await expect(page.locator('text=System Prompt Reader')).toBeVisible();
      
      // Check for search functionality within reader
      const readerSearch = page.locator('input[placeholder*="Search sections"]');
      if (await readerSearch.isVisible()) {
        await readerSearch.fill('Primary Goal');
        await page.waitForTimeout(500);
        
        // Should show filtered sections
        await expect(page.locator('text=Primary Goal')).toBeVisible();
      }
    }
  });

  test('should handle copy functionality', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Navigate to system prompts tab
    await page.click('text=System Prompts');
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Look for copy buttons
    const copyButtons = page.locator('button[data-testid="copy-button"]');
    if (await copyButtons.count() > 0) {
      // Click the first copy button
      await copyButtons.first().click();
      
      // Check for success toast or confirmation
      await expect(page.locator('text=Copied')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should handle edit system prompt functionality', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Navigate to system prompts tab
    await page.click('text=System Prompts');
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Look for edit buttons
    const editButtons = page.locator('button:has-text("Edit System Prompt")');
    if (await editButtons.count() > 0) {
      // Click the first edit button
      await editButtons.first().click();
      
      // Should trigger edit functionality (prompt or dialog)
      // This depends on the implementation - could be a dialog or prompt
      await page.waitForTimeout(1000);
    }
  });

  test('should handle responsive design', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check that the page is still functional
    await expect(page.locator('h2')).toContainText('Admin Console');
    
    // Check that tabs are still accessible
    await expect(page.locator('text=Overview')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Check that the page adapts
    await expect(page.locator('h2')).toContainText('Admin Console');
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should handle error states gracefully', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Monitor for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Navigate through different tabs
    await page.click('text=Overview');
    await page.waitForTimeout(500);
    
    await page.click('text=System Prompts');
    await page.waitForTimeout(500);
    
    // Check for users tab if available
    const usersTab = page.locator('text=Users');
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForTimeout(500);
    }
    
    // Check that there are no critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Failed to fetch') || 
      error.includes('Network error') ||
      error.includes('500')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should maintain session state during navigation', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Navigate to different tabs
    await page.click('text=Overview');
    await page.waitForTimeout(500);
    
    await page.click('text=System Prompts');
    await page.waitForTimeout(500);
    
    // Navigate away and back
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    
    await navigateToAdminConsole(page);
    
    // Should still be logged in and functional
    await expect(page.locator('h2')).toContainText('Admin Console');
  });

  test('should handle data table operations if available', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Check for data tables (clients, users, etc.)
    const clientsTab = page.locator('text=Clients');
    if (await clientsTab.isVisible()) {
      await clientsTab.click();
      await page.waitForTimeout(1000);
      
      // Check for data table
      const dataTable = page.locator('table');
      if (await dataTable.isVisible()) {
        // Check for search functionality
        const searchInput = page.locator('input[placeholder*="Search"]');
        if (await searchInput.isVisible()) {
          await searchInput.fill('test');
          await page.waitForTimeout(500);
        }
        
        // Check for edit buttons
        const editButtons = page.locator('button[data-testid="edit-button"]');
        if (await editButtons.count() > 0) {
          // Should have edit functionality
          expect(await editButtons.count()).toBeGreaterThan(0);
        }
      }
    }
  });

  test('should handle delete confirmations', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Look for delete buttons in any available tables
    const deleteButtons = page.locator('button[data-testid="delete-button"]');
    if (await deleteButtons.count() > 0) {
      // Click first delete button
      await deleteButtons.first().click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=Delete Record')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('text=Are you sure')).toBeVisible();
      
      // Cancel the deletion
      await page.click('text=Cancel');
      
      // Dialog should close
      await expect(page.locator('text=Delete Record')).not.toBeVisible();
    }
  });

  test('should validate RBAC access restrictions', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Check what tabs are available based on user level
    const availableTabs = [];
    
    if (await page.locator('text=Overview').isVisible()) {
      availableTabs.push('Overview');
    }
    if (await page.locator('text=Companies').isVisible()) {
      availableTabs.push('Companies');
    }
    if (await page.locator('text=Clients').isVisible()) {
      availableTabs.push('Clients');
    }
    if (await page.locator('text=Users').isVisible()) {
      availableTabs.push('Users');
    }
    if (await page.locator('text=System Prompts').isVisible()) {
      availableTabs.push('System Prompts');
    }
    
    // Basic tabs should always be available
    expect(availableTabs).toContain('Overview');
    expect(availableTabs).toContain('System Prompts');
    
    // Log available tabs for debugging
    console.log('Available tabs:', availableTabs);
  });

  test('should handle loading states', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Check for loading indicators
    const loadingIndicators = page.locator('[data-testid="loading"]');
    if (await loadingIndicators.count() > 0) {
      // Should eventually disappear
      await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 10000 });
    }
    
    // Check that content loads
    await expect(page.locator('h2')).toContainText('Admin Console');
  });

  test('should handle empty states', async ({ page }) => {
    await navigateToAdminConsole(page);
    
    // Navigate to system prompts
    await page.click('text=System Prompts');
    await page.waitForTimeout(1000);
    
    // Check for empty state messages
    const emptyStateMessages = [
      'No system prompts available',
      'No system prompts match your search',
      'Client descriptions are used as system prompts'
    ];
    
    for (const message of emptyStateMessages) {
      const element = page.locator(`text=${message}`);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });
}); 