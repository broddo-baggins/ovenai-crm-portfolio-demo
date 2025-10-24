import { test, expect } from '@playwright/test';
import { loadTestCredentials } from './__helpers__/test-credentials';

const testCredentials = loadTestCredentials();

test('Debug login form structure', async ({ page }) => {
  console.log('🔍 Debugging login page structure...');
  
  // Navigate to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
  
  // Get page content
  const pageContent = await page.content();
  console.log('🔍 Page title:', await page.title());
  console.log('🔍 Current URL:', page.url());
  
  // Look for all input elements
  const inputs = await page.locator('input').all();
  console.log('🔍 Found', inputs.length, 'input elements');
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const id = await input.getAttribute('id');
    const placeholder = await input.getAttribute('placeholder');
    const testId = await input.getAttribute('data-testid');
    const isVisible = await input.isVisible();
    
    console.log(`🔍 Input ${i + 1}:`, {
      type,
      name,
      id,
      placeholder,
      testId,
      isVisible
    });
  }
  
  // Look for all buttons
  const buttons = await page.locator('button').all();
  console.log('🔍 Found', buttons.length, 'button elements');
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const type = await button.getAttribute('type');
    const textContent = await button.textContent();
    const testId = await button.getAttribute('data-testid');
    const isVisible = await button.isVisible();
    
    console.log(`🔍 Button ${i + 1}:`, {
      type,
      textContent: textContent?.trim(),
      testId,
      isVisible
    });
  }
  
  // Look for forms
  const forms = await page.locator('form').all();
  console.log('🔍 Found', forms.length, 'form elements');
  
  // Check if we're on the right page using specific selectors
  const hasLoginButton = await page.locator('[data-testid="login-button"]').isVisible() || 
                          await page.locator('button[type="submit"]:has-text("Sign In")').isVisible() ||
                          await page.locator('button:has-text("התחבר")').isVisible();
  console.log('🔍 Has login button:', hasLoginButton);
  
  // Try manual field entry for testing
  try {
    // Try to find email field by various methods
    const emailField = page.locator('input[type="email"]').first();
    if (await emailField.isVisible({ timeout: 1000 })) {
      console.log('✅ Found email field, testing form submission...');
      await emailField.fill(testCredentials.email);
      
      const passwordField = page.locator('input[type="password"]').first();
      if (await passwordField.isVisible({ timeout: 1000 })) {
        await passwordField.fill(testCredentials.password);
        
        const submitButton = page.locator('button[type="submit"]').first();
        if (await submitButton.isVisible({ timeout: 1000 })) {
          console.log('✅ Attempting form submission...');
          await submitButton.click();
          
          await page.waitForTimeout(5000);
          console.log('🔍 URL after submission:', page.url());
          
          await page.screenshot({ path: 'debug-after-login.png', fullPage: true });
        }
      }
    }
  } catch (e) {
    console.log('❌ Manual login test failed:', e.message);
  }
}); 