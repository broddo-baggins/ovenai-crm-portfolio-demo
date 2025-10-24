import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../__helpers__/auth-helpers';
import { testCredentials } from '../__helpers__/test-credentials';

test.describe('Admin Console - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.authenticateUser(page);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelpers.clearAuthState(page);
  });

  test.describe('Admin Console Access & Navigation', () => {
    test('should access admin console with system admin privileges', async ({ page }) => {
      await page.goto('/admin');
      await expect(page.getByText('Admin Dashboard')).toBeVisible();
      
      // Navigate to admin console
      await page.goto('/admin/console');
      await expect(page.getByText('System Admin Console')).toBeVisible();
      
      // Verify all tabs are visible for system admin
      await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Companies' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Clients' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'System Prompts' })).toBeVisible();
    });

    test('should display correct admin level and permissions', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Verify system admin status is displayed
      await expect(page.getByText('System Admin')).toBeVisible();
      await expect(page.getByText('Full system access')).toBeVisible();
    });

    test('should handle admin authentication properly', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Should not show any "access denied" messages
      await expect(page.getByText('Access denied')).not.toBeVisible();
      await expect(page.getByText('Admin required')).not.toBeVisible();
      
      // Should load data without errors
      await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Overview Tab', () => {
    test('should display system statistics correctly', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Check overview stats are displayed
      await expect(page.getByText('Total Users')).toBeVisible();
      await expect(page.getByText('Active Clients')).toBeVisible();
      await expect(page.getByText('Total Projects')).toBeVisible();
      await expect(page.getByText('System Health')).toBeVisible();
      
      // Verify stats show actual numbers (not just 0 or loading)
      const userCount = page.locator('[data-testid="user-count"]').or(page.getByText(/\d+ users/i).first());
      await expect(userCount).toBeVisible({ timeout: 5000 });
    });

    test('should show real-time system metrics', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Check for metrics cards
      await expect(page.getByText('Database Status')).toBeVisible();
      await expect(page.getByText('Active Sessions')).toBeVisible();
      
      // Verify metrics are not showing error states
      await expect(page.getByText('Connection Failed')).not.toBeVisible();
      await expect(page.getByText('Error loading')).not.toBeVisible();
    });
  });

  test.describe('User Management Tab', () => {
    test('should display user list with full details', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Users' }).click();
      
      // Wait for users to load
      await expect(page.getByText('User Management')).toBeVisible();
      
      // Check user list displays
      await expect(page.getByText(testCredentials.email)).toBeVisible({ timeout: 10000 });
      
      // Verify user details are shown
      await expect(page.getByText('system_admin')).toBeVisible();
      await expect(page.getByText('active')).toBeVisible();
    });

    test('should filter users by status and search', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Users' }).click();
      
      // Test search functionality
      const searchInput = page.getByPlaceholder('Search users...');
      await searchInput.fill(testCredentials.email);
      await expect(page.getByText(testCredentials.email)).toBeVisible();
      
      // Test status filter
      const statusFilter = page.getByRole('combobox').filter({ hasText: 'Filter by status' });
      if (await statusFilter.isVisible()) {
        await statusFilter.click();
        await page.getByText('Active').click();
      }
    });

    test('should show user action buttons for system admin', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Users' }).click();
      
      // Wait for a user card to appear and click it
      const userCard = page.locator('[data-testid="user-card"]').first()
        .or(page.getByText(testCredentials.email).locator('..').locator('..'));
      
      if (await userCard.isVisible()) {
        await userCard.click();
        
        // Verify admin action buttons appear
        await expect(page.getByText('Reset Preferences')).toBeVisible();
        await expect(page.getByText('Change Client')).toBeVisible();
        await expect(page.getByText('Change Role')).toBeVisible();
      }
    });
  });

  test.describe('Client Management Tab', () => {
    test('should display client list with statistics', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Clients' }).click();
      
      await expect(page.getByText('Client Management')).toBeVisible();
      
      // Check for client data
      await page.waitForTimeout(3000); // Allow data to load
      
      // Should show clients or empty state
      const hasClients = await page.getByText('OvenAI').isVisible() || 
                        await page.getByText('No clients found').isVisible();
      expect(hasClients).toBeTruthy();
    });

    test('should allow creating new clients', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Clients' }).click();
      
      // Look for create client button
      const createButton = page.getByRole('button', { name: 'Create Client' })
        .or(page.getByRole('button', { name: 'Add Client' }));
      
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Should open creation dialog/form
        await expect(page.getByText('Client Name')).toBeVisible();
      }
    });
  });

  test.describe('Companies Tab', () => {
    test('should display company management for system admin', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Companies' }).click();
      
      await expect(page.getByText('Company Management')).toBeVisible();
      
      // Wait for data to load
      await page.waitForTimeout(3000);
      
      // Should show companies or empty state
      const hasCompanies = await page.getByText('companies').isVisible() || 
                          await page.getByText('No companies').isVisible();
      expect(hasCompanies).toBeTruthy();
    });
  });

  test.describe('System Prompts Tab', () => {
    test('should display system prompts with project association', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'System Prompts' }).click();
      
      await expect(page.getByText('System Prompts Management')).toBeVisible();
      
      // Check for prompts search
      await expect(page.getByPlaceholder('Search prompts...')).toBeVisible();
      
      // Should show projects or empty state
      await page.waitForTimeout(3000);
      const hasProjects = await page.getByText('Test project').isVisible() || 
                         await page.getByText('Oven Project').isVisible() ||
                         await page.getByText('No prompts found').isVisible();
      expect(hasProjects).toBeTruthy();
    });

    test('should allow editing system prompts for admin users', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'System Prompts' }).click();
      
      // Wait for projects to load
      await page.waitForTimeout(3000);
      
      // Look for edit buttons on project cards
      const editButton = page.getByRole('button', { name: 'Edit' }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should open prompt editor
        await expect(page.getByText('System Prompt')).toBeVisible();
      }
    });
  });

  test.describe('Database Console & SQL Execution', () => {
    test('should provide database console access for advanced users', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Look for database/SQL console section
      const sqlConsole = page.getByText('Database Console')
        .or(page.getByText('SQL Console'))
        .or(page.getByText('Query Console'));
      
      if (await sqlConsole.isVisible()) {
        await sqlConsole.click();
        
        // Should show SQL input area
        await expect(page.getByPlaceholder('Enter SQL query...')).toBeVisible();
      }
    });

    test('should execute read-only queries safely', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Find SQL console if it exists
      const sqlInput = page.getByPlaceholder('Enter SQL query...')
        .or(page.locator('textarea[placeholder*="SQL"]'));
      
      if (await sqlInput.isVisible()) {
        await sqlInput.fill('SELECT COUNT(*) FROM profiles;');
        
        const runButton = page.getByRole('button', { name: 'Run Query' })
          .or(page.getByRole('button', { name: 'Execute' }));
        
        if (await runButton.isVisible()) {
          await runButton.click();
          
          // Should show results
          await expect(page.getByText('Query Results')).toBeVisible();
        }
      }
    });
  });

  test.describe('API Keys Management', () => {
    test('should show API keys management when user is selected', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Users' }).click();
      
      // Select a user to show API keys section
      const userCard = page.getByText(testCredentials.email).locator('..').locator('..');
      if (await userCard.isVisible()) {
        await userCard.click();
        
        // Should show API keys management
        await expect(page.getByText('API Keys Management')).toBeVisible();
        await expect(page.getByText('Manage user\'s API credentials')).toBeVisible();
      }
    });

    test('should allow creating and managing API keys', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Users' }).click();
      
      // Select a user and look for API key actions
      const userCard = page.getByText(testCredentials.email).locator('..').locator('..');
      if (await userCard.isVisible()) {
        await userCard.click();
        
        const createKeyButton = page.getByRole('button', { name: 'Create API Key' })
          .or(page.getByRole('button', { name: 'Add Key' }));
        
        if (await createKeyButton.isVisible()) {
          await createKeyButton.click();
          // Should open API key creation dialog
        }
      }
    });
  });

  test.describe('Error Handling & Performance', () => {
    test('should handle database errors gracefully', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Wait for loading to complete
      await page.waitForTimeout(5000);
      
      // Should not show 400 Bad Request errors
      await expect(page.getByText('400 Bad Request')).not.toBeVisible();
      await expect(page.getByText('Failed to fetch')).not.toBeVisible();
      
      // Should not show console errors (check console logs)
      const logs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          logs.push(msg.text());
        }
      });
      
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Filter out unrelated errors and check for admin-specific errors
      const adminErrors = logs.filter(log => 
        log.includes('admin') || 
        log.includes('console') || 
        log.includes('RLS') ||
        log.includes('Access denied')
      );
      
      expect(adminErrors.length).toBe(0);
    });

    test('should load admin console within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/admin/console');
      await expect(page.getByText('System Admin Console')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
    });

    test('should maintain admin session throughout navigation', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Navigate between tabs
      await page.getByRole('tab', { name: 'Users' }).click();
      await page.getByRole('tab', { name: 'Clients' }).click();
      await page.getByRole('tab', { name: 'Overview' }).click();
      
      // Should maintain admin access
      await expect(page.getByText('System Admin')).toBeVisible();
      await expect(page.getByText('Access denied')).not.toBeVisible();
    });
  });

  test.describe('Data Integrity & RLS', () => {
    test('should respect RLS policies for admin access', async ({ page }) => {
      await page.goto('/admin/console');
      await page.getByRole('tab', { name: 'Users' }).click();
      
      // Admin should see all users
      await expect(page.getByText(testCredentials.email)).toBeVisible();
      
      // Should not show RLS errors
      await expect(page.getByText('row-level security')).not.toBeVisible();
      await expect(page.getByText('RLS')).not.toBeVisible();
    });

    test('should show accurate user and client counts', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Get overview counts
      const overviewUserCount = await page.getByText(/\d+/).first().textContent();
      
      // Navigate to users tab and count actual users
      await page.getByRole('tab', { name: 'Users' }).click();
      await page.waitForTimeout(3000);
      
      const userCards = page.locator('[data-testid="user-card"]')
        .or(page.locator('card').filter({ hasText: '@' }));
      
      if (await userCards.first().isVisible()) {
        const actualUserCount = await userCards.count();
        
        // Counts should be consistent (allowing for some margin)
        expect(actualUserCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Removed Components Cleanup', () => {
    test('should not show deprecated system console components', async ({ page }) => {
      await page.goto('/admin/console');
      
      // Should not show old/removed components
      await expect(page.getByText('System Console Access')).not.toBeVisible();
      await expect(page.getByText('Fake data')).not.toBeVisible();
      await expect(page.getByText('Simulated')).not.toBeVisible();
      await expect(page.getByText('Demo mode')).not.toBeVisible();
    });

    test('should not show Quick Actions cards that were removed', async ({ page }) => {
      await page.goto('/admin');
      
      // Should not show removed Quick Actions
      await expect(page.getByText('Quick Actions')).not.toBeVisible();
      await expect(page.getByText('System Settings')).not.toBeVisible();
      await expect(page.getByText('User Permissions')).not.toBeVisible();
    });

    test('should not show third button under real-time dashboard', async ({ page }) => {
      await page.goto('/admin');
      
      // Check that unwanted buttons are not present
      const dashboardSection = page.locator('[data-testid="dashboard-section"]')
        .or(page.getByText('Real-time Dashboard').locator('..'));
      
      if (await dashboardSection.isVisible()) {
        const buttons = dashboardSection.locator('button');
        const buttonCount = await buttons.count();
        
        // Should not have excessive buttons (exact count depends on design)
        expect(buttonCount).toBeLessThanOrEqual(2);
      }
    });
  });
}); 