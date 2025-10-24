import { test, expect, devices } from '@playwright/test';

// Use iPhone 13 for mobile testing with proper viewport
test.use({ 
  ...devices['iPhone 13'],
  viewport: { width: 390, height: 844 }
});

// Test mobile Reports page error handling
test.describe('Mobile Reports Error Handling', () => {

  test.beforeEach(async ({ page }) => {
    // Set mobile viewport explicitly
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-mock');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });

    // Ensure mobile user agent is set
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      });
    });
  });

  test('should display mobile-specific error when API fails', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/leads', route => {
      route.abort('failed');
    });
    await page.route('**/api/conversations', route => {
      route.abort('failed');
    });
    await page.route('**/api/whatsapp/messages', route => {
      route.abort('failed');
    });
    await page.route('**/api/projects', route => {
      route.abort('failed');
    });

    // Navigate to Reports page
    await page.goto('/reports');

    // Wait for error display to appear with increased timeout for mobile
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 30000 });

    // Check mobile-specific error content
    await expect(page.locator('text=Mobile Display Error')).toBeVisible();
    await expect(page.locator('text=Chart rendering on small screens')).toBeVisible();
    await expect(page.locator('text=Network connectivity issues')).toBeVisible();
    await expect(page.locator('text=Memory limitations')).toBeVisible();
    await expect(page.locator('text=Touch interaction conflicts')).toBeVisible();

    // Check mobile-specific buttons with full width
    const retryButton = page.locator('[data-testid="mobile-error-retry"]');
    const dashboardButton = page.locator('[data-testid="mobile-error-dashboard"]');
    
    await expect(retryButton).toBeVisible();
    await expect(dashboardButton).toBeVisible();
    
    // Verify buttons are touch-friendly (full width for mobile)
    await expect(retryButton).toHaveClass(/w-full/);
    await expect(dashboardButton).toHaveClass(/w-full/);

    // Verify smartphone icon is displayed
    const smartphoneIcon = page.locator('[data-testid="mobile-error-display"] svg').first();
    await expect(smartphoneIcon).toBeVisible();
  });

  test('should display technical details when expanded on mobile', async ({ page }) => {
    // Mock API with specific error
    await page.route('**/api/leads', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed on mobile device' })
      });
    });

    await page.goto('/reports');

    // Wait for error display
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 30000 });

    // Click on technical details - use touch-friendly interaction
    await page.locator('summary:has-text("Technical Details")').tap();

    // Check that error details are shown
    await expect(page.locator('pre')).toBeVisible();
    await expect(page.locator('text=Database connection failed')).toBeVisible();
  });

  test('should handle timeout errors on mobile', async ({ page }) => {
    // Mock slow API response (will timeout after 15s for mobile)
    await page.route('**/api/leads', async route => {
      // Delay longer than mobile timeout (15s)
      await new Promise(resolve => setTimeout(resolve, 20000));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/reports');

    // Wait for timeout error with mobile timeout consideration
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=timeout after 15s')).toBeVisible();
  });

  test('should retry loading data when retry button is clicked', async ({ page }) => {
    let apiCallCount = 0;

    // Mock API to fail first time, succeed second time
    await page.route('**/api/leads', route => {
      apiCallCount++;
      if (apiCallCount === 1) {
        route.abort('failed');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Test Lead', status: 'new', temperature: 'warm', created_at: new Date().toISOString() }
          ])
        });
      }
    });

    // Mock other APIs to succeed
    await page.route('**/api/conversations', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    await page.route('**/api/whatsapp/messages', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    await page.route('**/api/projects', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/reports');

    // Wait for error display
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 30000 });

    // Click retry button using tap for mobile
    await page.locator('[data-testid="mobile-error-retry"]').tap();

    // Wait for successful load
    await expect(page.locator('text=Reports')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=1 leads analyzed')).toBeVisible();
    
    // Verify error display is gone
    await expect(page.locator('[data-testid="mobile-error-display"]')).not.toBeVisible();
    
    // Verify mobile Select components are visible for export options
    await expect(page.locator('[data-testid="mobile-select-export"]')).toBeVisible();
  });

  test('should navigate to dashboard when dashboard button is clicked', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    await page.goto('/reports');

    // Wait for error display
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 30000 });

    // Click dashboard button using tap for mobile
    await page.locator('[data-testid="mobile-error-dashboard"]').tap();

    // Verify navigation to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle mobile viewport changes during error display', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    await page.goto('/reports');

    // Wait for mobile error display
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 30000 });

    // Change to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Should still detect as mobile due to user agent
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-error-retry"]')).toBeVisible();

    // Change back to mobile
    await page.setViewportSize({ width: 390, height: 844 });

    // Should still show mobile error display
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible();
  });

  test('should display loading state before error on mobile', async ({ page }) => {
    // Mock slow failing API
    await page.route('**/api/leads', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.abort('failed');
    });

    await page.goto('/reports');

    // Should show loading state first
    await expect(page.locator('text=Loading real data...')).toBeVisible();
    
    // Then show error after failure
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 15000 });
  });

  test('should handle successful data load after error state', async ({ page }) => {
    let shouldFail = true;

    // Mock API to fail initially, then succeed
    await page.route('**/api/leads', route => {
      if (shouldFail) {
        route.abort('failed');
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Mobile Test Lead', status: 'new', temperature: 'hot', created_at: new Date().toISOString() }
          ])
        });
      }
    });

    // Mock other successful APIs
    ['conversations', 'whatsapp/messages', 'projects'].forEach(endpoint => {
      page.route(`**/api/${endpoint}`, route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });
    });

    await page.goto('/reports');

    // Wait for error
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 30000 });

    // Change API to succeed
    shouldFail = false;

    // Retry using tap
    await page.locator('[data-testid="mobile-error-retry"]').tap();

    // Should show successful load
    await expect(page.locator('text=1 leads analyzed')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="mobile-error-display"]')).not.toBeVisible();

    // Should show charts/tabs
    await expect(page.locator('text=Lead Funnel')).toBeVisible();
    await expect(page.locator('text=Temperature Shift')).toBeVisible();
    
    // Verify mobile Select components are functional
    await expect(page.locator('select, [role="combobox"]')).toBeVisible();
  });

  test('should handle touch interactions on mobile error display', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    await page.goto('/reports');

    // Wait for error display
    await expect(page.locator('[data-testid="mobile-error-display"]')).toBeVisible({ timeout: 30000 });

    // Test touch interactions
    const retryButton = page.locator('[data-testid="mobile-error-retry"]');
    const dashboardButton = page.locator('[data-testid="mobile-error-dashboard"]');

    // Buttons should be touchable (visible and enabled)
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();
    await expect(dashboardButton).toBeVisible();
    await expect(dashboardButton).toBeEnabled();

    // Test touch feedback (buttons should have proper styling)
    await expect(retryButton).toHaveClass(/w-full/);
    await expect(dashboardButton).toHaveClass(/w-full/);
    
    // Verify minimum touch target size (44px)
    const retryBox = await retryButton.boundingBox();
    const dashboardBox = await dashboardButton.boundingBox();
    
    expect(retryBox?.height).toBeGreaterThanOrEqual(44);
    expect(dashboardBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should use mobile Select component for export options', async ({ page }) => {
    // Mock successful API calls
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto('/reports');

    // Wait for page to load with increased timeout
    await expect(page.locator('h1:has-text("Reports")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=0 leads analyzed')).toBeVisible({ timeout: 10000 });

    // Verify mobile Select component for export options is present
    const exportSelect = page.locator('[data-testid="mobile-select-export"]');
    await expect(exportSelect).toBeVisible({ timeout: 10000 });
    
    // Verify it's using Select instead of DropdownMenu on mobile
    await exportSelect.click();
    
    // Wait for Select content to appear and verify options
    await expect(page.locator('[role="option"]:has-text("Export CSV")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="option"]:has-text("Email Report")')).toBeVisible();
    await expect(page.locator('[role="option"]:has-text("Schedule Report")')).toBeVisible();
    
    // Test selecting an option
    await page.locator('[role="option"]:has-text("Export CSV")').click();
    
    // Verify toast notification appears
    await expect(page.locator('text=CSV export initiated')).toBeVisible({ timeout: 5000 });
  });
}); 