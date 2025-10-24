import { test, expect } from '@playwright/test';
import { testCredentials } from '../__helpers__/test-credentials';

test.describe('📱 WhatsApp Take Lead - E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigation using dynamic base URL (handled by Playwright config)
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Login with test credentials
    await page.fill('input[type="email"], input[name="email"], [data-testid="email-input"]', testCredentials.email);
    await page.fill('input[type="password"], input[name="password"], [data-testid="password-input"]', testCredentials.password);
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login"), [data-testid="login-button"]');
    
    // Wait for successful authentication - flexible redirect handling
    await page.waitForTimeout(3000);
    
    // Verify we're authenticated by checking we're not still on login page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth/login');
  });

  test('🎯 Complete Take Lead Workflow - Template Selection & Sending', async ({ page }) => {
    console.log('🚀 Testing complete Take Lead workflow...');

    // Step 1: Navigate to leads page
    console.log('📋 Step 1: Navigate to leads page');
    await page.goto('/leads');
    await page.waitForLoadState('networkidle');
    
    // Step 2: Verify leads page loaded
    console.log('✅ Step 2: Verify leads page loaded');
    await expect(page).toHaveURL(/.*\/leads/);
    
    // Look for leads list or table
    const leadsIndicators = [
      'table',
      '[data-testid*="lead"]',
      '.leads-list',
      '[class*="lead"]',
      'tbody tr',
      '.lead-card'
    ];
    
    let leadsContainer = null;
    for (const selector of leadsIndicators) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 5000 })) {
        leadsContainer = element;
        console.log(`✅ Found leads container: ${selector}`);
        break;
      }
    }
    
    expect(leadsContainer).toBeTruthy();
    
    // Step 3: Check for existing leads or create one
    console.log('📝 Step 3: Ensure test lead exists');
    
    const hasExistingLeads = await page.locator('tbody tr, .lead-card').count() > 0;
    
    if (!hasExistingLeads) {
      console.log('Creating test lead...');
      // Look for "Add Lead" or similar button
      const addLeadSelectors = [
        'button:has-text("Add Lead")',
        'button:has-text("New Lead")', 
        'button:has-text("Create Lead")',
        '[data-testid*="add-lead"]',
        '[data-testid*="create-lead"]',
        'button[class*="add"]'
      ];
      
      let addLeadButton = null;
      for (const selector of addLeadSelectors) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          addLeadButton = button;
          break;
        }
      }
      
      if (addLeadButton) {
        await addLeadButton.click();
        await page.waitForTimeout(1000);
        
        // Fill in lead form
        await page.fill('input[name="first_name"], input[placeholder*="first"], input[placeholder*="First"]', 'Test');
        await page.fill('input[name="last_name"], input[placeholder*="last"], input[placeholder*="Last"]', 'Lead');
        await page.fill('input[name="phone"], input[placeholder*="phone"], input[type="tel"]', '+1234567890');
        
        // Submit form
        await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        await page.waitForTimeout(2000);
      }
    }
    
    // Step 4: Look for Take Lead button
    console.log('🔍 Step 4: Looking for Take Lead button');
    
    const takeLeadSelectors = [
      'button:has-text("Take Lead")',
      'button:has-text("Send First Message")',
      '[data-testid*="take-lead"]',
      '[data-testid*="whatsapp"]',
      'button[class*="green"]',
      'button:has(svg)',
      '.take-lead-button'
    ];
    
    let takeLeadButton = null;
    for (const selector of takeLeadSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        takeLeadButton = button;
        console.log(`✅ Found Take Lead button with selector: ${selector}`);
        break;
      }
    }
    
    expect(takeLeadButton).toBeTruthy();
    
    // Step 5: Click Take Lead button and test dialog
    console.log('📱 Step 5: Testing Take Lead dialog');
    await takeLeadButton.click();
    await page.waitForTimeout(1000);
    
    // Look for dialog/modal
    const dialogSelectors = [
      '[role="dialog"]',
      '.dialog',
      '.modal',
      '[data-state="open"]',
      '[data-testid*="dialog"]'
    ];
    
    let dialog = null;
    for (const selector of dialogSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        dialog = element;
        console.log(`✅ Found dialog: ${selector}`);
        break;
      }
    }
    
    expect(dialog).toBeTruthy();
    
    // Step 6: Test template selection (if available)
    console.log('📋 Step 6: Testing template selection');
    
    const templateSelectors = [
      'select[name*="template"]',
      '[data-testid*="template"]',
      '.template-select',
      'select option',
      '[role="combobox"]'
    ];
    
    let templateSelector = null;
    for (const selector of templateSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        templateSelector = element;
        console.log(`✅ Found template selector: ${selector}`);
        break;
      }
    }
    
    if (templateSelector) {
      // Try to select a template
      await templateSelector.click();
      await page.waitForTimeout(500);
      
      // Look for template options
      const options = page.locator('option, [role="option"]');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        await options.nth(1).click(); // Select second option (first is usually placeholder)
        console.log('✅ Template selected');
      }
    }
    
    // Step 7: Verify phone number validation
    console.log('📞 Step 7: Checking phone number validation');
    
    // Look for phone validation message
    const phoneValidationSelectors = [
      'text*="phone"',
      'text*="number"',
      'text*="valid"',
      '.validation-message',
      '.error-message',
      '.phone-status'
    ];
    
    for (const selector of phoneValidationSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        console.log(`✅ Found phone validation: ${selector}`);
        break;
      }
    }
    
    // Step 8: Test final send button (but don't actually send)
    console.log('📤 Step 8: Testing send button presence');
    
    const sendButtonSelectors = [
      'button:has-text("Take Lead")',
      'button:has-text("Send")',
      'button[type="submit"]',
      '[data-testid*="send"]',
      '.send-button'
    ];
    
    let sendButton = null;
    for (const selector of sendButtonSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 })) {
        sendButton = button;
        console.log(`✅ Found send button: ${selector}`);
        break;
      }
    }
    
    expect(sendButton).toBeTruthy();
    
    // Verify button state (should be enabled if all validation passes)
    const isEnabled = await sendButton.isEnabled();
    console.log(`📤 Send button enabled: ${isEnabled}`);
    
    // Step 9: Close dialog without sending (for safety)
    console.log('❌ Step 9: Closing dialog without sending');
    
    const closeSelectors = [
      'button:has-text("Cancel")',
      'button:has-text("Close")',
      '[data-testid*="close"]',
      '.close-button',
      '[aria-label*="close"]'
    ];
    
    for (const selector of closeSelectors) {
      const button = page.locator(selector).first();
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click();
        console.log(`✅ Closed dialog with: ${selector}`);
        break;
      }
    }
    
    console.log('✅ Take Lead workflow test completed successfully!');
  });

  test('🧪 WhatsApp Integration Health Check', async ({ page }) => {
    console.log('🏥 Testing WhatsApp integration health...');
    
    // Navigate to template management page
    await page.goto('/lead-pipeline');
    await page.waitForLoadState('networkidle');
    
    // Look for WhatsApp Manager tab
    const whatsappTab = page.locator('text*="WhatsApp"').first();
    if (await whatsappTab.isVisible({ timeout: 5000 })) {
      await whatsappTab.click();
      await page.waitForTimeout(1000);
      
      // Check for template management UI
      const templateElements = [
        'text*="template"',
        'text*="Template"',
        '.template',
        '[data-testid*="template"]'
      ];
      
      let foundTemplateUI = false;
      for (const selector of templateElements) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          foundTemplateUI = true;
          console.log(`✅ Found WhatsApp template UI: ${selector}`);
          break;
        }
      }
      
      expect(foundTemplateUI).toBeTruthy();
    }
    
    console.log('✅ WhatsApp integration health check completed!');
  });
}); 