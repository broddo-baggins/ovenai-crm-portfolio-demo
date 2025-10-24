import { test, expect } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';

test.describe('🐛 Bug Fixes - Sidebar, Leads, Dark Mode Tests', () => {
  
  // Setup authentication for each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    await page.goto('/auth/login');
    
    // Login with test credentials
      await page.locator('input[type="email"]').fill(testCredentials.email);
  await page.locator('input[type="password"]').fill(testCredentials.password);
    await page.locator('button[type="submit"]').click();
    
    // Wait for dashboard to load
    await page.waitForURL(/dashboard|app/, { timeout: 15000 });
  });

  test.describe('🔧 Sidebar Issues', () => {
    
    test('sidebar should display navigation items correctly', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard');
      
      // Check that sidebar exists
      const sidebar = page.locator('[data-testid="main-sidebar"]');
      await expect(sidebar).toBeVisible();
      
      // Check that sidebar menu exists and is not empty
      const sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
      await expect(sidebarMenu).toBeVisible();
      
      // Verify navigation items are present
      const expectedNavItems = ['dashboard', 'leads', 'projects', 'messages', 'calendar', 'settings'];
      
      for (const item of expectedNavItems) {
        const navItem = page.locator(`[data-testid="sidebar-item-${item}"]`);
        await expect(navItem).toBeVisible({ timeout: 5000 });
      }
      
      // Check that empty state is not showing
      const emptyState = page.locator('[data-testid="sidebar-empty"]');
      await expect(emptyState).not.toBeVisible();
    });

    test('sidebar user info and logout spacing should be correct', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check sidebar footer exists
      const sidebarFooter = page.locator('[data-testid="sidebar-footer"]');
      await expect(sidebarFooter).toBeVisible();
      
      // Check username is visible
      const username = page.locator('[data-testid="sidebar-username"]');
      await expect(username).toBeVisible();
      await expect(username).toContainText(/\w+/); // Should contain some text
      
      // Check user email is visible
      const userEmail = page.locator('[data-testid="sidebar-user-email"]');
      await expect(userEmail).toBeVisible();
      
      // Check logout button is visible and properly spaced
      const logoutButton = page.locator('[data-testid="sidebar-logout-button"]');
      await expect(logoutButton).toBeVisible();
      
      // Verify spacing by checking the logout button is below user info
      const usernameBox = await username.boundingBox();
      const logoutBox = await logoutButton.boundingBox();
      
      if (usernameBox && logoutBox) {
        expect(logoutBox.y).toBeGreaterThan(usernameBox.y);
        // Should have reasonable spacing (not too far apart)
        expect(logoutBox.y - usernameBox.y).toBeLessThan(100);
      }
    });

    test('sidebar navigation links should work correctly', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test navigation to leads page
      const leadsLink = page.locator('[data-testid="nav-link-leads"]');
      await expect(leadsLink).toBeVisible();
      await leadsLink.click();
      
      await expect(page).toHaveURL(/leads/);
      
      // Test navigation back to dashboard
      const dashboardLink = page.locator('[data-testid="nav-link-dashboard"]');
      await expect(dashboardLink).toBeVisible();
      await dashboardLink.click();
      
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  test.describe('📋 Leads Properties Issues', () => {
    
    test('message button should navigate to conversation page', async ({ page }) => {
      // Go to leads page
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
             // Look for a lead to open (try multiple selectors)
       const leadSelectors = [
         'tr:has-text("test")', 
         'tr:has([data-testid="lead-row"])',
         '.lead-row',
         'tr:first-child'
       ];
       
       let leadRow = page.locator('tr').first(); // Default fallback
       for (const selector of leadSelectors) {
         const candidateRow = page.locator(selector).first();
         if (await candidateRow.isVisible()) {
           leadRow = candidateRow;
           break;
         }
       }
       
       if (await leadRow.isVisible()) {
         // Click on the lead to open properties
         await leadRow.click();
        
        // Wait for properties panel to open
        const propertiesPanel = page.locator('[data-testid="lead-properties-panel"]');
        await expect(propertiesPanel).toBeVisible({ timeout: 5000 });
        
        // Click the message button
        const messageButton = page.locator('[data-testid="action-message-button"]');
        await expect(messageButton).toBeVisible();
        await expect(messageButton).toContainText(/conversation|message/i);
        
        await messageButton.click();
        
        // Should navigate to messages page with lead filter
        await expect(page).toHaveURL(/messages/);
        await expect(page.url()).toMatch(/leadId=|phone=/);
      } else {
        console.log('⚠️ No leads found for testing message navigation');
      }
    });

    test('lead properties panel should display correctly in dark mode', async ({ page }) => {
      // Switch to dark mode first
      await page.goto('/dashboard');
      const themeToggle = page.locator('[data-testid="theme-selector"], .mode-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        const darkOption = page.locator('text=Dark').first();
        if (await darkOption.isVisible()) {
          await darkOption.click();
        }
      }
      
      // Navigate to leads
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Try to open a lead properties panel
      const leadRow = page.locator('tr').first();
      if (await leadRow.isVisible()) {
        await leadRow.click();
        
        const propertiesPanel = page.locator('[data-testid="lead-properties-panel"]');
        await expect(propertiesPanel).toBeVisible({ timeout: 5000 });
        
        // Check dark mode styling
        await expect(propertiesPanel).toHaveClass(/dark:bg-background/);
        
        // Check that lead name is visible in dark mode
        const leadName = page.locator('[data-testid="lead-name"]');
        await expect(leadName).toBeVisible();
        await expect(leadName).toHaveClass(/dark:text-foreground/);
        
        // Check other text elements have proper dark mode colors
        const phoneElement = page.locator('[data-testid="lead-phone"]');
        if (await phoneElement.isVisible()) {
          await expect(phoneElement).toHaveClass(/dark:text-foreground/);
        }
      }
    });

    test('all action buttons should be functional', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      const leadRow = page.locator('tr').first();
      if (await leadRow.isVisible()) {
        await leadRow.click();
        
        const propertiesPanel = page.locator('[data-testid="lead-properties-panel"]');
        await expect(propertiesPanel).toBeVisible({ timeout: 5000 });
        
        // Test call button
        const callButton = page.locator('[data-testid="action-call-button"]');
        if (await callButton.isVisible()) {
          await expect(callButton).toContainText(/call/i);
        }
        
        // Test WhatsApp button  
        const whatsappButton = page.locator('[data-testid="action-whatsapp-button"]');
        if (await whatsappButton.isVisible()) {
          await expect(whatsappButton).toContainText(/whatsapp|message/i);
        }
        
        // Test edit button
        const editButton = page.locator('[data-testid="action-edit-button"]');
        if (await editButton.isVisible()) {
          await expect(editButton).toContainText(/edit/i);
        }
        
        // Test close button
        const closeButton = page.locator('[data-testid="close-properties"]');
        await expect(closeButton).toBeVisible();
        await closeButton.click();
        
        await expect(propertiesPanel).not.toBeVisible();
      }
    });
  });

  test.describe('🎨 Dark Mode Issues', () => {
    
    test('project selector should display correctly in dark mode', async ({ page }) => {
      // Go to dashboard
      await page.goto('/dashboard');
      
      // Switch to dark mode
      const themeToggle = page.locator('[data-testid="theme-selector"], .mode-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        const darkOption = page.locator('text=Dark').first();
        if (await darkOption.isVisible()) {
          await darkOption.click();
          await page.waitForTimeout(1000); // Wait for theme to apply
        }
      }
      
      // Check project selector visibility in dark mode
      const projectSelector = page.locator('[data-testid="project-selector-trigger"]');
      await expect(projectSelector).toBeVisible({ timeout: 5000 });
      
      // Check that project name is visible (not black on black)
      const projectName = page.locator('[data-testid="current-project-name"]');
      if (await projectName.isVisible()) {
        await expect(projectName).toHaveClass(/dark:text-foreground/);
        
        // Check computed styles to ensure text is visible
        const textColor = await projectName.evaluate(el => 
          window.getComputedStyle(el).color
        );
        
        // Should not be completely black (rgb(0, 0, 0)) in dark mode
        expect(textColor).not.toBe('rgb(0, 0, 0)');
      }
      
      // Open project selector dropdown
      await projectSelector.click();
      
      const dropdown = page.locator('[data-testid="project-selector-dropdown"]');
      await expect(dropdown).toBeVisible();
      await expect(dropdown).toHaveClass(/dark:bg-background/);
      
      // Check project options are visible in dark mode
      const projectOptions = page.locator('[data-testid^="project-option-"]');
      if (await projectOptions.first().isVisible()) {
        await expect(projectOptions.first()).toHaveClass(/dark:text-foreground/);
      }
    });

    test('all text should be readable in dark mode', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Switch to dark mode
      const themeToggle = page.locator('[data-testid="theme-selector"], .mode-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        const darkOption = page.locator('text=Dark').first();
        if (await darkOption.isVisible()) {
          await darkOption.click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Check various text elements for proper dark mode colors
      const textSelectors = [
        'h1, h2, h3, h4, h5, h6',
        '.text-foreground',
        '[data-testid="current-project-name"]',
        '[data-testid="sidebar-username"]'
      ];
      
      for (const selector of textSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);
          if (await element.isVisible()) {
            const textColor = await element.evaluate(el => 
              window.getComputedStyle(el).color
            );
            
            // Text should not be black in dark mode
            expect(textColor).not.toBe('rgb(0, 0, 0)');
          }
        }
      }
    });
  });

  test.describe('🔄 Page Refresh Issues', () => {
    
    test('error boundary should not cause page refresh', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard');
      
      // Simulate an error by injecting bad code
      await page.evaluate(() => {
        // Create a component that will throw an error
        const errorDiv = document.createElement('div');
        errorDiv.onclick = () => {
          throw new Error('Test error for error boundary');
        };
        errorDiv.innerHTML = 'Click to trigger error';
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '10px';
        errorDiv.style.right = '10px';
        errorDiv.style.padding = '10px';
        errorDiv.style.background = 'red';
        errorDiv.style.color = 'white';
        errorDiv.style.cursor = 'pointer';
        errorDiv.style.zIndex = '9999';
        errorDiv.id = 'error-trigger';
        document.body.appendChild(errorDiv);
      });
      
      // Track navigation events
      let navigationCount = 0;
      page.on('framenavigated', () => {
        navigationCount++;
      });
      
      // Click the error trigger
      await page.locator('#error-trigger').click();
      
      // Wait a bit to see if error boundary appears
      await page.waitForTimeout(2000);
      
      // Check if error boundary appeared (instead of page reload)
      const errorBoundary = page.locator('[data-testid="error-boundary"]');
      if (await errorBoundary.isVisible()) {
        // Good! Error boundary handled the error
        const retryButton = page.locator('[data-testid="error-retry-button"]');
        await expect(retryButton).toBeVisible();
        
        // Should not have caused navigation/refresh
        expect(navigationCount).toBeLessThanOrEqual(1);
      }
    });

    test('should not have unexpected page reloads during normal usage', async ({ page }) => {
      let unexpectedReloads = 0;
      
      // Track page reloads
      page.on('load', () => {
        unexpectedReloads++;
      });
      
      // Navigate to different pages
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Reset counter after initial load
      unexpectedReloads = 0;
      
      // Navigate through the app
      await page.click('[data-testid="nav-link-leads"]');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="nav-link-projects"]');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="nav-link-messages"]');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="nav-link-dashboard"]');
      await page.waitForTimeout(1000);
      
      // Should not have any unexpected reloads during navigation
      expect(unexpectedReloads).toBe(0);
    });
  });

  test.describe('📋 Comprehensive Component Tests', () => {
    
    test('sidebar should be fully functional on all pages', async ({ page }) => {
      const pages = ['/dashboard', '/leads', '/projects', '/messages', '/settings'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check sidebar is present
        const sidebar = page.locator('[data-testid="main-sidebar"]');
        await expect(sidebar).toBeVisible();
        
        // Check navigation menu is populated
        const sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
        await expect(sidebarMenu).toBeVisible();
        
        // Check user info is visible
        const username = page.locator('[data-testid="sidebar-username"]');
        await expect(username).toBeVisible();
        
        console.log(`✅ Sidebar functional on ${pagePath}`);
      }
    });

    test('project selector should work on all applicable pages', async ({ page }) => {
      const pages = ['/dashboard', '/leads', '/projects'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check if project selector exists on this page
        const projectSelector = page.locator('[data-testid="project-selector-trigger"]');
        if (await projectSelector.isVisible()) {
          // Test opening dropdown
          await projectSelector.click();
          
          const dropdown = page.locator('[data-testid="project-selector-dropdown"]');
          await expect(dropdown).toBeVisible();
          
          // Close dropdown
          await page.keyboard.press('Escape');
          
          console.log(`✅ Project selector functional on ${pagePath}`);
        }
      }
    });

    test('dark mode should work consistently across all pages', async ({ page }) => {
      const pages = ['/dashboard', '/leads', '/projects', '/messages'];
      
      // Enable dark mode
      await page.goto('/dashboard');
      const themeToggle = page.locator('[data-testid="theme-selector"], .mode-toggle').first();
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        const darkOption = page.locator('text=Dark').first();
        if (await darkOption.isVisible()) {
          await darkOption.click();
        }
      }
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check that page has dark mode applied
        const html = page.locator('html');
        await expect(html).toHaveClass(/dark/);
        
        // Check that text is visible (not black on black)
        const headings = page.locator('h1, h2, h3').first();
        if (await headings.isVisible()) {
          const textColor = await headings.evaluate(el => 
            window.getComputedStyle(el).color
          );
          expect(textColor).not.toBe('rgb(0, 0, 0)');
        }
        
        console.log(`✅ Dark mode working on ${pagePath}`);
      }
    });
  });
}); 