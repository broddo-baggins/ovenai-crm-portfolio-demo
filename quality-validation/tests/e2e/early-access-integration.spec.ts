import { test, expect, Page } from '@playwright/test';
import { testCredentials } from '../__helpers__/test-credentials';

// Test the Early Access form functionality
test.describe('Early Access Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display Early Access button on landing page', async ({ page }) => {
    // Look for the Early Access button
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await expect(earlyAccessButton.first()).toBeVisible();
  });

  test('should open Early Access form when button is clicked', async ({ page }) => {
    // Click the Early Access button
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Check that the dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Check that the dialog title is correct
    const dialogTitle = page.locator('h2:has-text("Early Access Request"), h2:has-text("בקשת גישה מוקדמת")');
    await expect(dialogTitle).toBeVisible();
  });

  test('should display two options in the Early Access form', async ({ page }) => {
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Check for both options
    const scheduleOption = page.locator('text=Schedule Meeting, text=תיאום פגישה');
    const detailsOption = page.locator('text=Leave Details, text=השארת פרטים');
    
    await expect(scheduleOption).toBeVisible();
    await expect(detailsOption).toBeVisible();
  });

  test('should open Calendly when Schedule Meeting is clicked', async ({ page }) => {
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Set up page listener for new tab
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.locator('button:has-text("Schedule Meeting"), button:has-text("קביעת פגישה")').click()
    ]);
    
    // Check that Calendly opens
    await newPage.waitForLoadState('networkidle');
    expect(newPage.url()).toContain('calendly.com');
  });

  test('should display Google Form when Leave Details is clicked', async ({ page }) => {
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Click Leave Details
    const detailsButton = page.locator('button:has-text("Leave Details"), button:has-text("השארת פרטים")');
    await detailsButton.click();
    
    // Check that the Google Form iframe loads
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
    
    // Check that the iframe src contains the Google Form URL
    const iframeSrc = await iframe.getAttribute('src');
    expect(iframeSrc).toContain('docs.google.com/forms');
  });

  test('should handle RTL layout correctly for Hebrew', async ({ page }) => {
    // Switch to Hebrew
    const languageToggle = page.locator('button:has-text("עברית"), button:has-text("English")');
    if (await languageToggle.first().isVisible()) {
      // If we see "עברית", click it to switch to Hebrew
      const hebrewButton = page.locator('button:has-text("עברית")');
      if (await hebrewButton.isVisible()) {
        await hebrewButton.click();
      }
    }
    
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Check that the dialog has RTL layout
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveClass(/text-right/);
    
    // Check that buttons are arranged RTL
    const scheduleButton = page.locator('button:has-text("קביעת פגישה")');
    await expect(scheduleButton).toBeVisible();
  });

  test('should have proper form validation', async ({ page }) => {
    // Open the Early Access form and go to details flow
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Note: Since we're using Google Form, we can't test the custom form validation
    // But we can check that the Google Form is properly embedded
    const detailsButton = page.locator('button:has-text("Leave Details"), button:has-text("השארת פרטים")');
    await detailsButton.click();
    
    // Check that the form is properly embedded
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
    
    // Check that there's a fallback link if iframe doesn't load
    const fallbackLink = page.locator('a:has-text("Click here"), a:has-text("לחצו כאן")');
    await expect(fallbackLink).toBeVisible();
  });

  test('should close dialog when close button is clicked', async ({ page }) => {
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Check that dialog is open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Click close button (X button)
    const closeButton = page.locator('button[aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    } else {
      // Alternative: click outside the dialog
      await page.keyboard.press('Escape');
    }
    
    // Check that dialog is closed
    await expect(dialog).not.toBeVisible();
  });

  test('should handle back navigation correctly', async ({ page }) => {
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Go to details flow
    const detailsButton = page.locator('button:has-text("Leave Details"), button:has-text("השארת פרטים")');
    await detailsButton.click();
    
    // Check that we're in the Google Form view
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
    
    // Click back button
    const backButton = page.locator('button:has-text("Back"), button:has-text("חזרה")');
    await backButton.click();
    
    // Check that we're back to the choice view
    const scheduleOption = page.locator('text=Schedule Meeting, text=תיאום פגישה');
    await expect(scheduleOption).toBeVisible();
  });

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Check that dialog is responsive
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Check that buttons are properly sized for mobile
    const scheduleButton = page.locator('button:has-text("Schedule Meeting"), button:has-text("קביעת פגישה")');
    const buttonBox = await scheduleButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(40); // Minimum touch target size
  });

  test('should work with different language settings', async ({ page }) => {
    // Test English
    await page.goto('/');
    const earlyAccessButtonEn = page.locator('button:has-text("Request Early Access")');
    await earlyAccessButtonEn.first().click();
    
    let dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Check English text
    const englishTitle = page.locator('h2:has-text("Early Access Request")');
    await expect(englishTitle).toBeVisible();
    
    // Close dialog
    await page.keyboard.press('Escape');
    
    // Switch to Hebrew if language toggle is available
    const languageToggle = page.locator('button:has-text("עברית")');
    if (await languageToggle.isVisible()) {
      await languageToggle.click();
      await page.waitForTimeout(1000);
      
      // Open form again in Hebrew
      const earlyAccessButtonHe = page.locator('button:has-text("בקש גישה מוקדמת")');
      await earlyAccessButtonHe.first().click();
      
      dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      // Check Hebrew text
      const hebrewTitle = page.locator('h2:has-text("בקשת גישה מוקדמת")');
      await expect(hebrewTitle).toBeVisible();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block Google Forms domain to simulate network error
    await page.route('**/docs.google.com/**', route => route.abort());
    
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Go to details flow
    const detailsButton = page.locator('button:has-text("Leave Details"), button:has-text("השארת פרטים")');
    await detailsButton.click();
    
    // Check that fallback link is available
    const fallbackLink = page.locator('a:has-text("Click here"), a:has-text("לחצו כאן")');
    await expect(fallbackLink).toBeVisible();
    
    // Test that fallback link opens in new tab
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      fallbackLink.click()
    ]);
    
    // The new page should attempt to load Google Forms
    expect(newPage.url()).toContain('docs.google.com');
  });

  test('should maintain form state during navigation', async ({ page }) => {
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Navigate to Google Form
    const detailsButton = page.locator('button:has-text("Leave Details"), button:has-text("השארת פרטים")');
    await detailsButton.click();
    
    // Go back
    const backButton = page.locator('button:has-text("Back"), button:has-text("חזרה")');
    await backButton.click();
    
    // Check that we're back to the choice view with original options
    const scheduleOption = page.locator('text=Schedule Meeting, text=תיאום פגישה');
    const detailsOption = page.locator('text=Leave Details, text=השארת פרטים');
    
    await expect(scheduleOption).toBeVisible();
    await expect(detailsOption).toBeVisible();
  });

  test('should handle keyboard navigation correctly', async ({ page }) => {
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Check that dialog is keyboard accessible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Use Tab to navigate to the first button
    await page.keyboard.press('Tab');
    
    // Check that one of the buttons is focused
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Press Escape to close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('should display proper icons and styling', async ({ page }) => {
    // Open the Early Access form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    // Check that the sparkles icon is visible in the title
    const sparklesIcon = page.locator('svg').first();
    await expect(sparklesIcon).toBeVisible();
    
    // Check that schedule meeting has calendar icon
    const calendarIcon = page.locator('svg[data-lucide="calendar"]').first();
    await expect(calendarIcon).toBeVisible();
    
    // Check that leave details has user icon
    const userIcon = page.locator('svg[data-lucide="user"]').first();
    await expect(userIcon).toBeVisible();
  });

  test('should handle iframe loading and fallback', async ({ page }) => {
    // Open the Early Access form and navigate to Google Form
    const earlyAccessButton = page.locator('button:has-text("Request Early Access"), button:has-text("בקש גישה מוקדמת")');
    await earlyAccessButton.first().click();
    
    const detailsButton = page.locator('button:has-text("Leave Details"), button:has-text("השארת פרטים")');
    await detailsButton.click();
    
    // Check that iframe is properly configured
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
    
    // Check iframe attributes
    expect(await iframe.getAttribute('width')).toBe('100%');
    expect(await iframe.getAttribute('height')).toBe('100%');
    expect(await iframe.getAttribute('frameBorder')).toBe('0');
    
    // Check that fallback message is present
    const fallbackText = page.locator('text=Can\'t see the form?, text=לא רואים את הטופס?');
    await expect(fallbackText).toBeVisible();
  });
}); 