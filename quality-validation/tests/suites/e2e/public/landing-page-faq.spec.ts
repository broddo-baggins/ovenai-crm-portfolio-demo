import { test, expect } from '@playwright/test';

test.describe('Landing Page FAQ Accordion Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should display FAQ section with accordion', async ({ page }) => {
    // Scroll to FAQ section
    await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
    
    // Check if FAQ section is visible
    await expect(page.locator('[data-testid="faq-accordion"]')).toBeVisible();
    
    // Check if FAQ title is present
    const faqTitle = page.locator('h2:has-text("Frequently Asked Questions"), h2:has-text("שאלות נפוצות")');
    await expect(faqTitle).toBeVisible();
  });

  test('should have all 8 FAQ items', async ({ page }) => {
    await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
    
    // Check for all FAQ items
    const faqItems = [
      'integration',
      'implementation-time', 
      'languages',
      'pricing',
      'security',
      'customization',
      'roi',
      'support'
    ];

    for (const itemId of faqItems) {
      await expect(page.locator(`[data-testid="faq-item-${itemId}"]`)).toBeVisible();
    }
  });

  test('should expand and collapse FAQ items on click', async ({ page }) => {
    await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
    
    // Test expanding first FAQ item
    const firstTrigger = page.locator('[data-testid="faq-trigger-integration"]');
    await firstTrigger.click();
    
    // Check if content is visible after click
    const firstContent = page.locator('[data-testid="faq-content-integration"]');
    await expect(firstContent).toBeVisible();
    
    // Click again to collapse
    await firstTrigger.click();
    await expect(firstContent).not.toBeVisible();
  });

  test('should display correct content for FAQ items', async ({ page }) => {
    await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
    
    // Test integration FAQ content
    await page.locator('[data-testid="faq-trigger-integration"]').click();
    const integrationContent = page.locator('[data-testid="faq-content-integration"]');
    await expect(integrationContent).toContainText(/CRM|Salesforce|HubSpot/i);
    
    // Test languages FAQ content
    await page.locator('[data-testid="faq-trigger-languages"]').click();
    const languagesContent = page.locator('[data-testid="faq-content-languages"]');
    await expect(languagesContent).toContainText(/50\+|languages|שפות/i);
  });

  test('should work with keyboard navigation', async ({ page }) => {
    await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
    
    // Focus on first FAQ item
    await page.locator('[data-testid="faq-trigger-integration"]').focus();
    
    // Press Enter to expand
    await page.keyboard.press('Enter');
    const firstContent = page.locator('[data-testid="faq-content-integration"]');
    await expect(firstContent).toBeVisible();
    
    // Press Enter again to collapse
    await page.keyboard.press('Enter');
    await expect(firstContent).not.toBeVisible();
    
    // Navigate with Tab key
    await page.keyboard.press('Tab');
    const secondTrigger = page.locator('[data-testid="faq-trigger-implementation-time"]');
    await expect(secondTrigger).toBeFocused();
  });

  test('should display CTA buttons at the bottom', async ({ page }) => {
    await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
    
    // Check for contact sales button
    const contactButton = page.locator('[data-testid="faq-contact-sales"]');
    await expect(contactButton).toBeVisible();
    await expect(contactButton).toContainText(/Contact Sales|צור קשר עם המכירות/i);
    
    // Check for view demo button
    const demoButton = page.locator('[data-testid="faq-view-demo"]');
    await expect(demoButton).toBeVisible();
    await expect(demoButton).toContainText(/View Demo|צפה בדמו/i);
  });

  test('should switch language correctly', async ({ page }) => {
    await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
    
    // Click language toggle to switch to Hebrew
    const languageToggle = page.locator('button:has-text("🌐"), button[data-testid*="language"]').first();
    if (await languageToggle.isVisible()) {
      await languageToggle.click();
      
      // Wait for language change
      await page.waitForTimeout(1000);
      
      // Check if Hebrew text appears
      const hebrewTitle = page.locator('h2:has-text("שאלות נפוצות")');
      await expect(hebrewTitle).toBeVisible();
      
      // Check if FAQ content is in Hebrew
      await page.locator('[data-testid="faq-trigger-integration"]').click();
      const integrationContent = page.locator('[data-testid="faq-content-integration"]');
      await expect(integrationContent).toContainText(/API|Webhooks/);
    }
  });

  test('should work correctly in dark mode', async ({ page }) => {
    // Enable dark mode if toggle exists
    const darkModeToggle = page.locator('button[data-testid*="theme"], button:has-text("🌙")').first();
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
    }
    
    await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
    
    // Check if FAQ section has dark mode classes
    const faqSection = page.locator('[data-testid="faq-accordion"]').locator('..');
    await expect(faqSection).toHaveClass(/dark:bg-gray-900/);
    
    // Test FAQ interaction in dark mode
    await page.locator('[data-testid="faq-trigger-integration"]').click();
    const content = page.locator('[data-testid="faq-content-integration"]');
    await expect(content).toBeVisible();
  });

  // Mobile-specific tests
  test.describe('Mobile FAQ Tests', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display correctly on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Check if FAQ is visible on mobile
      await expect(page.locator('[data-testid="faq-accordion"]')).toBeVisible();
      
      // Check if title is responsive
      const title = page.locator('h2:has-text("Frequently Asked Questions"), h2:has-text("שאלות נפוצות")');
      await expect(title).toBeVisible();
      
      // Test touch interaction
      await page.locator('[data-testid="faq-trigger-integration"]').tap();
      const content = page.locator('[data-testid="faq-content-integration"]');
      await expect(content).toBeVisible();
    });

    test('should have proper mobile spacing and layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Check mobile-specific classes and layout
      const faqItems = page.locator('[data-testid^="faq-item-"]');
      const firstItem = faqItems.first();
      
      // Check if items stack properly on mobile
      const boundingBox = await firstItem.boundingBox();
      expect(boundingBox?.width).toBeLessThan(400); // Should fit mobile width
    });

    test('should work with mobile gestures', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Test scroll behavior
      await page.evaluate(() => {
        window.scrollBy(0, 100);
      });
      
      // Test tap to expand
      await page.locator('[data-testid="faq-trigger-pricing"]').tap();
      const pricingContent = page.locator('[data-testid="faq-content-pricing"]');
      await expect(pricingContent).toBeVisible();
      
      // Test tap to collapse
      await page.locator('[data-testid="faq-trigger-pricing"]').tap();
      await expect(pricingContent).not.toBeVisible();
    });

    test('should display CTA buttons correctly on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Scroll to CTA buttons
      await page.locator('[data-testid="faq-contact-sales"]').scrollIntoViewIfNeeded();
      
      // Check if buttons stack on mobile
      const contactButton = page.locator('[data-testid="faq-contact-sales"]');
      const demoButton = page.locator('[data-testid="faq-view-demo"]');
      
      await expect(contactButton).toBeVisible();
      await expect(demoButton).toBeVisible();
      
      // Check if buttons are properly sized for mobile
      const contactBox = await contactButton.boundingBox();
      const demoBox = await demoButton.boundingBox();
      
      expect(contactBox?.width).toBeGreaterThan(150);
      expect(demoBox?.width).toBeGreaterThan(150);
    });
  });

  // Accessibility tests
  test.describe('FAQ Accessibility Tests', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Check accordion has proper role
      const accordion = page.locator('[data-testid="faq-accordion"]');
      await expect(accordion).toHaveAttribute('type', 'single');
      
      // Check trigger has proper ARIA attributes
      const firstTrigger = page.locator('[data-testid="faq-trigger-integration"]');
      await expect(firstTrigger).toHaveAttribute('aria-expanded');
      
      // Click and check aria-expanded changes
      await firstTrigger.click();
      await expect(firstTrigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('should be screen reader friendly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Check headings structure
      const headings = page.locator('h2, h3');
      await expect(headings.first()).toBeVisible();
      
      // Check for proper text content
      const triggers = page.locator('[data-testid^="faq-trigger-"]');
      for (let i = 0; i < await triggers.count(); i++) {
        const trigger = triggers.nth(i);
        const text = await trigger.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    });

    test('should support high contrast mode', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Simulate high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * { border: 1px solid !important; }
          }
        `
      });
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Test visibility in high contrast
      const firstItem = page.locator('[data-testid="faq-item-integration"]');
      await expect(firstItem).toBeVisible();
      
      await page.locator('[data-testid="faq-trigger-integration"]').click();
      const content = page.locator('[data-testid="faq-content-integration"]');
      await expect(content).toBeVisible();
    });
  });

  // Performance tests
  test.describe('FAQ Performance Tests', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Check if FAQ section renders quickly
      const faqVisible = Date.now();
      const renderTime = faqVisible - startTime;
      expect(renderTime).toBeLessThan(6000);
    });

    test('should have smooth animations', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.locator('[data-testid="faq-accordion"]').scrollIntoViewIfNeeded();
      
      // Test animation performance
      const trigger = page.locator('[data-testid="faq-trigger-integration"]');
      const content = page.locator('[data-testid="faq-content-integration"]');
      
      const startTime = Date.now();
      await trigger.click();
      await expect(content).toBeVisible();
      const animationTime = Date.now() - startTime;
      
      // Animation should complete within reasonable time
      expect(animationTime).toBeLessThan(1000);
    });
  });
}); 