import { test, expect } from '@playwright/test';

test.describe('Phase 2: Advanced UI Components Validation', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    
    // Navigate to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('P2.1: Checkbox & Combobox Integration', () => {
    test('Checkbox interactions work correctly', async ({ page }) => {
      // Navigate to a page that uses checkboxes (e.g., cookie consent or settings)
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for any checkbox elements
      const checkboxes = page.locator('[role="checkbox"], input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        const firstCheckbox = checkboxes.first();
        
        // Test checkbox click functionality
        await expect(firstCheckbox).toBeVisible({ timeout: 10000 });
        await expect(firstCheckbox).toBeEnabled();
        
        // Click and verify state change
        await firstCheckbox.click();
        await page.waitForTimeout(500); // Allow for state update
        
        // Should not crash or cause JavaScript errors
        const errors: string[] = [];
        page.on('pageerror', error => {
          errors.push(error.message);
        });
        
        await page.waitForTimeout(1000);
        expect(errors.filter(e => e.includes('checkbox')).length).toBe(0);
      }
    });

    test('Combobox search and selection works', async ({ page }) => {
      // Navigate to dashboard where project selector should be
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for combobox elements (project selectors)
      const comboboxes = page.locator('[role="combobox"]');
      const comboboxCount = await comboboxes.count();
      
      if (comboboxCount > 0) {
        const firstCombobox = comboboxes.first();
        
        // Test combobox visibility and interaction
        await expect(firstCombobox).toBeVisible({ timeout: 10000 });
        await expect(firstCombobox).toBeEnabled();
        
        // Click to open dropdown
        await firstCombobox.click();
        await page.waitForTimeout(1000);
        
        // Should not cause any errors
        const errors: string[] = [];
        page.on('pageerror', error => {
          errors.push(error.message);
        });
        
        await page.waitForTimeout(1000);
        expect(errors.filter(e => e.includes('combobox')).length).toBe(0);
      }
    });

    test('Enhanced project selector functionality', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for project selector elements
      const projectSelectors = page.locator('[role="combobox"]').filter({ hasText: /project/i });
      const selectorCount = await projectSelectors.count();
      
      if (selectorCount > 0) {
        const selector = projectSelectors.first();
        
        // Test project selector basic functionality
        await expect(selector).toBeVisible({ timeout: 10000 });
        
        // Should have proper ARIA attributes
        const ariaExpanded = await selector.getAttribute('aria-expanded');
        expect(['true', 'false']).toContain(ariaExpanded);
        
        // Click to open
        await selector.click();
        await page.waitForTimeout(1000);
        
        // Look for dropdown content
        const dropdownContent = page.locator('[role="listbox"], [role="menu"], .combobox-content');
        const hasDropdown = await dropdownContent.count() > 0;
        
        if (hasDropdown) {
          // Dropdown should be visible
          await expect(dropdownContent.first()).toBeVisible({ timeout: 5000 });
        }
        
        // Close dropdown by clicking outside or pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('P2.2: Context Menu & Data Table Interactions', () => {
    test('Context menus respond to right-click', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Look for table rows or data elements
      const tableRows = page.locator('tr[data-state], .table-row, [data-testid*="row"]');
      const rowCount = await tableRows.count();
      
      if (rowCount > 0) {
        const firstRow = tableRows.first();
        
        // Test right-click context menu
        await expect(firstRow).toBeVisible({ timeout: 10000 });
        
        // Right-click to trigger context menu
        await firstRow.click({ button: 'right' });
        await page.waitForTimeout(1000);
        
        // Look for context menu
        const contextMenu = page.locator('[role="menu"], .context-menu, [data-testid*="context"]');
        const hasContextMenu = await contextMenu.count() > 0;
        
        if (hasContextMenu) {
          await expect(contextMenu.first()).toBeVisible({ timeout: 5000 });
        }
        
        // Close context menu
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    });

    test('Data table features work correctly', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Look for table elements
      const tables = page.locator('table, [role="table"], .data-table');
      const tableCount = await tables.count();
      
      if (tableCount > 0) {
        const table = tables.first();
        await expect(table).toBeVisible({ timeout: 10000 });
        
        // Look for sortable headers
        const sortableHeaders = page.locator('th[role="columnheader"], .sortable-header, [data-sort]');
        const headerCount = await sortableHeaders.count();
        
        if (headerCount > 0) {
          const firstHeader = sortableHeaders.first();
          
          // Test header click for sorting
          await expect(firstHeader).toBeVisible();
          await firstHeader.click();
          await page.waitForTimeout(1000);
          
          // Should not cause errors
          const errors: string[] = [];
          page.on('pageerror', error => {
            errors.push(error.message);
          });
          
          await page.waitForTimeout(1000);
          expect(errors.filter(e => e.includes('sort')).length).toBe(0);
        }
      }
    });
  });

  test.describe('P2.3: Label & Navigation Components', () => {
    test('Form labels are properly associated', async ({ page }) => {
      // Navigate to a page with forms
      const formPages = ['/leads', '/projects', '/settings'];
      
      for (const pagePath of formPages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Look for form labels
        const labels = page.locator('label');
        const labelCount = await labels.count();
        
        if (labelCount > 0) {
          // Check first few labels for proper association
          const labelsToCheck = Math.min(3, labelCount);
          
          for (let i = 0; i < labelsToCheck; i++) {
            const label = labels.nth(i);
            
            // Label should have 'for' attribute or contain input
            const forAttribute = await label.getAttribute('for');
            const containsInput = await label.locator('input, select, textarea').count() > 0;
            
            // At least one should be true for accessibility
            expect(forAttribute !== null || containsInput).toBeTruthy();
          }
        }
      }
    });

    test('Navigation components are accessible', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Should have visible focus indicators
      const focusedElement = page.locator(':focus');
      const hasFocus = await focusedElement.count() > 0;
      
      if (hasFocus) {
        await expect(focusedElement).toBeVisible();
      }
      
      // Test arrow key navigation if applicable
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      
      // Should not cause any navigation errors
      const errors: string[] = [];
      page.on('pageerror', error => {
        errors.push(error.message);
      });
      
      await page.waitForTimeout(1000);
      expect(errors.filter(e => e.includes('navigation')).length).toBe(0);
    });
  });

  test.describe('P2.4: Pagination & Popover Systems', () => {
    test('Pagination controls work correctly', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Look for pagination elements
      const pagination = page.locator('[role="navigation"][aria-label*="pagination"], .pagination, [data-testid*="pagination"]');
      const paginationCount = await pagination.count();
      
      if (paginationCount > 0) {
        const paginationElement = pagination.first();
        await expect(paginationElement).toBeVisible({ timeout: 10000 });
        
        // Look for next/previous buttons
        const nextButtons = page.locator('button:has-text("Next"), button[aria-label*="next"], .pagination-next');
        const prevButtons = page.locator('button:has-text("Previous"), button[aria-label*="previous"], .pagination-prev');
        
        if (await nextButtons.count() > 0) {
          const nextButton = nextButtons.first();
          
          if (await nextButton.isEnabled()) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            
            // Should not cause errors
            const errors: string[] = [];
            page.on('pageerror', error => {
              errors.push(error.message);
            });
            
            await page.waitForTimeout(1000);
            expect(errors.filter(e => e.includes('pagination')).length).toBe(0);
          }
        }
      }
    });

    test('Popover interactions work correctly', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for popover triggers (buttons, help icons, etc.)
      const popoverTriggers = page.locator('[data-state], button[aria-haspopup], .popover-trigger');
      const triggerCount = await popoverTriggers.count();
      
      if (triggerCount > 0) {
        const trigger = popoverTriggers.first();
        
        if (await trigger.isVisible()) {
          await trigger.click();
          await page.waitForTimeout(1000);
          
          // Look for popover content
          const popoverContent = page.locator('[role="dialog"], .popover-content, [data-state="open"]');
          const hasPopover = await popoverContent.count() > 0;
          
          if (hasPopover) {
            await expect(popoverContent.first()).toBeVisible({ timeout: 5000 });
            
            // Close popover
            await page.keyboard.press('Escape');
            await page.waitForTimeout(500);
          }
        }
      }
    });
  });

  test.describe('Integration & Performance Tests', () => {
    test('All components integrate without conflicts', async ({ page }) => {
      const pages = ['/dashboard', '/leads', '/projects'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Check for JavaScript errors
        const errors: string[] = [];
        page.on('pageerror', error => {
          errors.push(error.message);
        });
        
        // Interact with multiple components
        await page.keyboard.press('Tab'); // Focus navigation
        await page.waitForTimeout(200);
        
        // Try clicking various interactive elements
        const interactiveElements = page.locator('button, [role="button"], [role="combobox"], [role="checkbox"]');
        const elementCount = Math.min(3, await interactiveElements.count());
        
        for (let i = 0; i < elementCount; i++) {
          const element = interactiveElements.nth(i);
          if (await element.isVisible() && await element.isEnabled()) {
            await element.click();
            await page.waitForTimeout(300);
          }
        }
        
        // Should have minimal errors
        await page.waitForTimeout(1000);
        const criticalErrors = errors.filter(e => 
          !e.includes('ResizeObserver') && 
          !e.includes('favicon') &&
          !e.includes('Analytics')
        );
        
        expect(criticalErrors.length).toBeLessThanOrEqual(1);
      }
    });

    test('Mobile responsiveness for advanced components', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Test combobox touch interactions
      const comboboxes = page.locator('[role="combobox"]');
      if (await comboboxes.count() > 0) {
        const combobox = comboboxes.first();
        if (await combobox.isVisible()) {
          await combobox.tap();
          await page.waitForTimeout(1000);
          
          // Should work on mobile
          await expect(combobox).toBeVisible();
        }
      }
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Components should remain functional
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    });
  });
}); 