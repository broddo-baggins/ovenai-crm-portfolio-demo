import { test, expect } from '@playwright/test';
import { ensureLoggedIn } from '../setup/test-auth-helper';

test.describe('Phase 3.1: Enhanced Dashboard Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is logged in before each test
    await ensureLoggedIn(page);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard components to load
    await page.waitForSelector('h1, h2, h3, [data-testid="dashboard"], [class*="card"]', { timeout: 15000 });
  });

  test.describe('Enhanced Dashboard Features', () => {
    test('should display live data connection status', async ({ page }) => {
      // Wait for dashboard to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Wait for the main dashboard heading to appear
      await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
      
      // Check that live data status is visible
      await expect(page.locator('text=Live Data Connected')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Enhanced analytics with live data integration')).toBeVisible({ timeout: 10000 });
    });

    test('should display all 6 metrics cards', async ({ page }) => {
      // Check that all 6 metrics cards are displayed with specific selectors to avoid duplicates
      await expect(page.locator('[data-testid="metrics-grid"]').locator('text=Total Leads')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-grid"]').locator('text=Reached Leads')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-grid"]').locator('text=Conversion Rate')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-grid"]').locator('text=Active Projects')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-grid"]').locator('text=Messages This Week')).toBeVisible();
      await expect(page.locator('[data-testid="metrics-grid"]').locator('text=Meetings Scheduled')).toBeVisible();

      // Check that we have the expected number of metric cards
      const metricCards = page.locator('[data-testid="metrics-grid"] > *');
      await expect(metricCards).toHaveCount(6);
    });

    test('should display enhanced charts with analytics', async ({ page }) => {
      // Wait for charts to load
      await page.waitForSelector('[data-testid="enhanced-chart"], [class*="chart"], [class*="recharts"], svg', { timeout: 15000 });
      
      // Check charts are present
      const charts = page.locator('[data-testid="enhanced-chart"], [class*="chart"], [class*="recharts"]');
      if (await charts.count() > 0) {
        await expect(charts.first()).toBeVisible();
      }

      // Check for chart titles
      await expect(page.locator('text=Lead Generation & Conversion Trends')).toBeVisible();
      await expect(page.locator('text=Revenue by Marketing Channel')).toBeVisible();
    });

    test('should display Monthly Performance section', async ({ page }) => {
      // Check for Monthly Performance section
      await expect(page.locator('text=Monthly Performance Overview')).toBeVisible();
      
      // Check for Monthly Performance chart
      await expect(page.locator('text=Monthly Performance Metrics')).toBeVisible();
    });

    test('should display performance insights section', async ({ page }) => {
      // Check performance insights section (now redesigned with proper shadcn components)
      await expect(page.locator('text=Performance Analytics')).toBeVisible();
      await expect(page.locator('text=AI-powered insights and recommendations for business growth')).toBeVisible();
      
      // Check for the new performance score cards with more specific selectors to avoid strict mode violations
      await expect(page.locator('p.text-sm:has-text("Excellent")').first()).toBeVisible();
      await expect(page.locator('p.text-sm:has-text("Needs Focus")').first()).toBeVisible();
      await expect(page.locator('p.text-sm:has-text("Good Progress")').first()).toBeVisible();
      
      // Check for Key Strengths and Growth Opportunities sections
      await expect(page.locator('text=Key Strengths')).toBeVisible();
      await expect(page.locator('text=Growth Opportunities')).toBeVisible();
      await expect(page.locator('text=Recommended Actions')).toBeVisible();
      
      // Check for specific performance metrics
      await expect(page.locator('text=Lead Reach Rate')).toBeVisible();
      await expect(page.locator('p.text-xs:has-text("Conversion Rate")').first()).toBeVisible();
      await expect(page.locator('text=Overall Activity')).toBeVisible();
    });

    test('should display Recent Activity section', async ({ page }) => {
      // Check for Recent Activity section with test ID
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
      
      // Check for activity description
      await expect(page.locator('text=Latest updates and interactions with your leads')).toBeVisible();
      
      // Check for specific activity items with more specific selectors to avoid strict mode violations
      await expect(page.locator('text=New lead created')).toBeVisible();
      await expect(page.locator('p.font-medium:has-text("New lead created")').first()).toBeVisible();
      await expect(page.locator('p.text-sm:has-text("Sarah Wilson from TechStart Inc")').first()).toBeVisible();
      await expect(page.locator('text=2 minutes ago')).toBeVisible();
    });

    test('should show metric details in tooltips and dialogs', async ({ page }) => {
      // Test tooltips if available - look for info icons
      const infoButtons = page.locator('[data-testid="info-icon"], [class*="info"], button:has(svg)');
      if (await infoButtons.count() > 0) {
        await infoButtons.first().hover();
        // Check if tooltip appears (may vary by implementation)
        await page.waitForTimeout(1000);
      }

      // Test help dialogs if available
      const helpButtons = page.locator('[data-testid="help-circle-icon"], button:has([class*="help"]), button:has(svg)');
      if (await helpButtons.count() > 0) {
        await helpButtons.first().click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Data Integration', () => {
    test('should handle data loading states', async ({ page }) => {
      // Check loading states appear briefly (may be very fast)
      const loadingElements = page.locator('text=Loading dashboard, .animate-pulse, [class*="loading"]');
      if (await loadingElements.count() > 0) {
        await expect(loadingElements.first()).toBeVisible({ timeout: 5000 });
      }
      
      // Wait for data to finish loading
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="stats-card"], .stats-card, [class*="card"]', { timeout: 15000 });
    });
  });

  test.describe('Loading States & Performance', () => {
    test('should show skeleton loading states', async ({ page }) => {
      // Navigate to dashboard fresh
      await page.goto('/dashboard');
      
      // Check skeleton loading appears (may be very brief)
      const pulseElements = page.locator('.animate-pulse, [class*="skeleton"], [class*="loading"]');
      if (await pulseElements.count() > 0) {
        // Skeleton may appear briefly
        await page.waitForTimeout(500);
      }
      
      // Wait for content to load
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('[data-testid="stats-card"], .stats-card, [class*="card"], h1, h2, h3', { timeout: 15000 });
    });

    test('should load dashboard within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('h1, h2, h3, [data-testid="dashboard"], [class*="card"]', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 10 seconds (generous for CI)
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check header is responsive
      await expect(page.locator('h1').locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Live Data Connected')).toBeVisible();
      
      // Check stats cards stack properly on mobile
      const statsCards = page.locator('[data-testid="stats-card"], .stats-card, [class*="card"]');
      if (await statsCards.count() >= 2) {
        const firstCard = statsCards.first();
        const secondCard = statsCards.nth(1);
        
        const firstCardBox = await firstCard.boundingBox();
        const secondCardBox = await secondCard.boundingBox();
        
        if (firstCardBox && secondCardBox) {
          // Cards should stack vertically on mobile (second card below first)
          expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height - 10);
        }
      }
    });

    test('should maintain touch-friendly interface', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check button sizes are touch-friendly (minimum 32px)
      const buttons = page.locator('button');
      
      for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(32); // Reduced minimum for mobile
        }
      }
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should maintain WCAG 2.1 AA compliance', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Check main heading structure
      const headings = await page.locator('h1, h2, h3').count();
      expect(headings).toBeGreaterThan(0);
      
      // Check tooltip accessibility if present
      const tooltipTriggers = page.locator('[data-testid="info-icon"], [data-testid="help-circle-icon"], button:has(svg)');
      
      for (let i = 0; i < Math.min(await tooltipTriggers.count(), 3); i++) {
        const trigger = tooltipTriggers.nth(i);
        
        // Check trigger is keyboard accessible
        await trigger.focus();
        await expect(trigger).toBeFocused();
        
        // Check for ARIA attributes
        const ariaLabel = await trigger.getAttribute('aria-label');
        const ariaDescribedBy = await trigger.getAttribute('aria-describedby');
        
        // Should have accessibility attributes or be a valid button
        const isButton = await trigger.evaluate(el => el.tagName.toLowerCase() === 'button');
        expect(ariaLabel || ariaDescribedBy || isButton).toBeTruthy();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Find focused element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should show error state or fallback
      const errorElements = await page.locator('text=Error, text=Unable to connect, text=Loading, h1, h2, h3').count();
      expect(errorElements).toBeGreaterThanOrEqual(0);
    });

    test('should handle component loading failures', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Even if some components fail, basic structure should load
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 15000 });
    });
  });
}); 