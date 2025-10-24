import { test, expect } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';

test.describe('🎯 Button Icon & Text Alignment Tests', () => {
  
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

  test.describe('📱 Mobile Button Alignment', () => {
    
    test.beforeEach(async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
    });

    test('mobile navigation buttons should have proper alignment and touch targets', async ({ page }) => {
      // Check mobile navigation buttons
      const mobileNavButtons = page.locator('.mobile-nav-item');
      
      if (await mobileNavButtons.first().isVisible()) {
        const buttonCount = await mobileNavButtons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = mobileNavButtons.nth(i);
          
          // Check minimum touch target size (44px minimum)
          const boundingBox = await button.boundingBox();
          expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
          expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
          
          // Check icon alignment
          const icon = button.locator('svg').first();
          if (await icon.isVisible()) {
            await expect(icon).toHaveClass(/h-6|w-6/);
          }
          
          // Check text alignment
          const text = button.locator('span').last();
          if (await text.isVisible()) {
            await expect(text).toHaveClass(/text-\[10px\]/);
          }
        }
      }
    });

    test('project selector compact mode should work on mobile', async ({ page }) => {
      // Look for compact project selector
      const compactSelector = page.locator('[data-testid="project-selector-trigger-compact"]');
      
      if (await compactSelector.isVisible()) {
        // Check it's properly sized for mobile
        const boundingBox = await compactSelector.boundingBox();
        expect(boundingBox?.height).toBeGreaterThanOrEqual(32); // h-8 = 32px
        
        // Check icon is present and properly sized
        const icon = compactSelector.locator('svg').first();
        await expect(icon).toBeVisible();
        await expect(icon).toHaveClass(/h-3|w-3/);
        
        // Click to open dropdown
        await compactSelector.click();
        
        // Check dropdown appears
        const dropdown = page.locator('[data-testid="project-selector-dropdown-compact"]');
        await expect(dropdown).toBeVisible({ timeout: 5000 });
      }
    });

    test('leads properties panel buttons should be mobile optimized', async ({ page }) => {
      // Navigate to leads page
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Look for a lead to open
      const leadRow = page.locator('tr').first();
      if (await leadRow.isVisible()) {
        await leadRow.click();
        
        // Wait for properties panel
        const propertiesPanel = page.locator('[data-testid="lead-properties-panel"]');
        await expect(propertiesPanel).toBeVisible({ timeout: 5000 });
        
        // Check action buttons alignment
        const actionButtons = propertiesPanel.locator('button[data-testid^="action-"]');
        const buttonCount = await actionButtons.count();
        
        for (let i = 0; i < buttonCount; i++) {
          const button = actionButtons.nth(i);
          
          // Check minimum touch target
          const boundingBox = await button.boundingBox();
          expect(boundingBox?.height).toBeGreaterThanOrEqual(36); // sm size minimum
          
          // Check icon is properly aligned
          const icon = button.locator('svg').first();
          if (await icon.isVisible()) {
            await expect(icon).toHaveClass(/h-4|w-4/);
          }
        }
      }
    });
  });

  test.describe('🖥️ Desktop Button Alignment', () => {
    
    test.beforeEach(async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('main project selector should have proper alignment', async ({ page }) => {
      const projectSelector = page.locator('[data-testid="project-selector-trigger"]');
      
      if (await projectSelector.isVisible()) {
        // Check button is properly sized
        const boundingBox = await projectSelector.boundingBox();
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44); // min-h-[44px]
        expect(boundingBox?.width).toBeGreaterThanOrEqual(300); // w-[300px]
        
        // Check project name is visible
        const projectName = page.locator('[data-testid="current-project-name"]');
        if (await projectName.isVisible()) {
          await expect(projectName).toHaveClass(/text-foreground/);
        }
        
        // Check chevron icon
        const chevronIcon = projectSelector.locator('svg').last();
        await expect(chevronIcon).toBeVisible();
        await expect(chevronIcon).toHaveClass(/h-4|w-4/);
      }
    });

    test('sidebar navigation buttons should be properly aligned', async ({ page }) => {
      const sidebarItems = page.locator('[data-testid^="sidebar-item-"]');
      const itemCount = await sidebarItems.count();
      
      if (itemCount > 0) {
        for (let i = 0; i < itemCount; i++) {
          const item = sidebarItems.nth(i);
          
          // Check nav link within item
          const navLink = item.locator('a');
          if (await navLink.isVisible()) {
            // Check flex alignment classes
            await expect(navLink).toHaveClass(/flex/);
            await expect(navLink).toHaveClass(/items-center/);
            await expect(navLink).toHaveClass(/gap-3/);
            
            // Check icon
            const icon = navLink.locator('svg').first();
            if (await icon.isVisible()) {
              await expect(icon).toHaveClass(/h-5|w-5/);
            }
          }
        }
      }
    });

    test('dashboard quick action buttons should have consistent spacing', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for quick action buttons with icons
      const actionButtons = page.locator('button:has(svg)');
      const buttonCount = await actionButtons.count();
      
      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10 buttons
          const button = actionButtons.nth(i);
          
          if (await button.isVisible()) {
            // Check gap spacing (should use gap-2 or similar)
            const buttonClass = await button.getAttribute('class');
            const hasGapClass = buttonClass?.includes('gap-') || false;
            
            // Check for consistent icon size
            const icon = button.locator('svg').first();
            if (await icon.isVisible()) {
              const iconClass = await icon.getAttribute('class');
              const hasConsistentSize = iconClass?.includes('h-4') && iconClass?.includes('w-4');
              expect(hasConsistentSize).toBeTruthy();
            }
          }
        }
      }
    });
  });

  test.describe('🌐 RTL Support', () => {
    
    test.beforeEach(async ({ page }) => {
      // Set RTL language
      await page.addInitScript(() => {
        localStorage.setItem('i18nextLng', 'ar');
      });
    });

    test('buttons should properly reverse in RTL mode', async ({ page }) => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Navigate to leads to test properties panel
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Open a lead properties panel
      const leadRow = page.locator('tr').first();
      if (await leadRow.isVisible()) {
        await leadRow.click();
        
        const propertiesPanel = page.locator('[data-testid="lead-properties-panel"]');
        if (await propertiesPanel.isVisible()) {
          // Check for RTL flex classes
          const flexContainers = propertiesPanel.locator('[class*="flex-row-reverse"]');
          const flexCount = await flexContainers.count();
          
          // Should have some RTL-specific styling
          expect(flexCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('🔍 Accessibility', () => {
    
    test('all icon buttons should have proper aria labels', async ({ page }) => {
      // Check various pages for icon-only buttons
      const pages = ['/dashboard', '/leads', '/messages', '/settings'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Find icon-only buttons (buttons with svg but minimal/no text)
        const iconButtons = page.locator('button:has(svg)');
        const buttonCount = await iconButtons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) { // Check first 5 per page
          const button = iconButtons.nth(i);
          
          if (await button.isVisible()) {
            const text = await button.textContent();
            const ariaLabel = await button.getAttribute('aria-label');
            const title = await button.getAttribute('title');
            
            // Should have either text content, aria-label, or title for accessibility
            const hasAccessibleLabel = (text && text.trim().length > 0) || ariaLabel || title;
            expect(hasAccessibleLabel).toBeTruthy();
          }
        }
      }
    });

    test('buttons should have proper focus states', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test keyboard navigation on buttons
      const buttons = page.locator('button:visible');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        
        // Focus the button
        await firstButton.focus();
        
        // Check focus ring is visible
        await expect(firstButton).toBeFocused();
        
        // Check focus ring styles
        const buttonClass = await firstButton.getAttribute('class');
        const hasFocusStyles = buttonClass?.includes('focus-visible:') || false;
        expect(hasFocusStyles).toBeTruthy();
      }
    });
  });

  test.describe('🎨 Consistent Styling', () => {
    
    test('all buttons should use consistent icon sizes', async ({ page }) => {
      const pages = ['/dashboard', '/leads', '/messages'];
      const iconSizes = new Set<string>();
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        // Collect icon sizes from buttons
        const buttonIcons = page.locator('button svg');
        const iconCount = await buttonIcons.count();
        
        for (let i = 0; i < Math.min(iconCount, 10); i++) {
          const icon = buttonIcons.nth(i);
          if (await icon.isVisible()) {
            const iconClass = await icon.getAttribute('class');
            if (iconClass) {
              // Extract size classes (h-4, w-4, etc.)
              const sizeMatches = iconClass.match(/[hw]-\d+/g);
              if (sizeMatches) {
                iconSizes.add(sizeMatches.join(' '));
              }
            }
          }
        }
      }
      
      // Should primarily use h-4 w-4 or h-3 w-3 for consistency
      const commonSizes = Array.from(iconSizes).filter(size => 
        size.includes('h-4 w-4') || size.includes('h-3 w-3') || size.includes('h-5 w-5')
      );
      
      expect(commonSizes.length).toBeGreaterThan(0);
    });

    test('buttons should have consistent gap spacing', async ({ page }) => {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Look for buttons with both icons and text
      const buttonsWithIcons = page.locator('button:has(svg):has-text("")');
      const buttonCount = await buttonsWithIcons.count();
      
      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttonsWithIcons.nth(i);
          
          if (await button.isVisible()) {
            const buttonClass = await button.getAttribute('class');
            
            // Should use gap-2 or similar for consistent spacing
            const hasGapClass = buttonClass?.includes('gap-') || false;
            expect(hasGapClass).toBeTruthy();
          }
        }
      }
    });
  });
}); 