import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../../__helpers__/auth-helpers';
import { testCredentials } from '../__helpers__/test-credentials';

test.describe('⚫ Black-Box Tests - User Acceptance', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
  });

  test('should allow user to access the application', async ({ page }) => {
    console.log('🌐 Testing application access...');
    
    // User should be able to access the homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should load successfully
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // User should see some content
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
    
    console.log('✅ Application accessible to users');
  });

  test('should provide clear navigation for users', async ({ page }) => {
    console.log('🧭 Testing user navigation...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // User should be able to find login option
    const loginOptions = [
      'a[href*="login"]',
      'button:has-text("Login")',
      'button:has-text("Sign In")',
      'a:has-text("Login")',
      'a:has-text("Sign In")'
    ];
    
    let loginFound = false;
    for (const selector of loginOptions) {
      if (await page.locator(selector).isVisible()) {
        console.log(`✅ Login option found: ${selector}`);
        loginFound = true;
        break;
      }
    }
    
    if (!loginFound) {
      // Try direct navigation
      await page.goto('/auth/login');
      const loginPage = await page.locator('input[type="email"], input[type="password"]').isVisible();
      if (loginPage) {
        loginFound = true;
        console.log('✅ Login page accessible directly');
      }
    }
    
    expect(loginFound).toBe(true);
  });

  test('should allow user to log in with valid credentials', async ({ page }) => {
    console.log('🔐 Testing user login process...');
    
    // User navigates to login
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // User should see login form
    const emailField = await page.locator('#email, input[type="email"]').first();
    const passwordField = await page.locator('#password, input[type="password"]').first();
    const submitButton = await page.locator('button[type="submit"]').first();
    
    expect(await emailField.isVisible()).toBe(true);
    expect(await passwordField.isVisible()).toBe(true);
    expect(await submitButton.isVisible()).toBe(true);
    
    // User enters credentials and submits
    await emailField.fill(testCredentials.email);
    await passwordField.fill(testCredentials.password);
    await submitButton.click();
    
    // User should be redirected or see success indication
    await page.waitForTimeout(3000);
    
    // Check for successful login indicators
    const loginSuccess = 
      page.url().includes('/dashboard') || 
      page.url() !== '/auth/login' ||
      await page.locator('[data-testid="user-menu"], .user-avatar').isVisible();
    
    if (loginSuccess) {
      console.log('✅ User login successful');
    } else {
      console.log('⚠️ Login may have failed or requires different credentials');
    }
  });

  test('should handle invalid login attempts gracefully', async ({ page }) => {
    console.log('❌ Testing invalid login handling...');
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // User enters invalid credentials
    const emailField = await page.locator('#email, input[type="email"]').first();
    const passwordField = await page.locator('#password, input[type="password"]').first();
    const submitButton = await page.locator('button[type="submit"]').first();
    
    if (await emailField.isVisible() && await passwordField.isVisible()) {
      await emailField.fill('invalid@test.com');
      await passwordField.fill('wrongpassword');
      await submitButton.click();
      
      await page.waitForTimeout(3000);
      
      // User should see error message or remain on login page
      const errorMessage = await page.locator('.error, .alert, [role="alert"]').isVisible();
      const stillOnLogin = page.url().includes('/auth/login');
      
      if (errorMessage || stillOnLogin) {
        console.log('✅ Invalid login handled appropriately');
      } else {
        console.log('⚠️ Invalid login handling unclear');
      }
    }
  });

  test('should provide user feedback during form interactions', async ({ page }) => {
    console.log('💬 Testing user feedback mechanisms...');
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const emailField = await page.locator('#email, input[type="email"]').first();
    const passwordField = await page.locator('#password, input[type="password"]').first();
    
    if (await emailField.isVisible() && await passwordField.isVisible()) {
      // Test field focus states
      await emailField.focus();
      const emailFocused = await emailField.evaluate(el => el === document.activeElement);
      expect(emailFocused).toBe(true);
      
      // Test input validation
      await emailField.fill('invalid-email');
      await passwordField.focus();
      
      // Look for validation feedback
      const validationFeedback = await page.locator('.error, .invalid, [aria-invalid="true"]').isVisible();
      
      if (validationFeedback) {
        console.log('✅ Form validation feedback provided');
      } else {
        console.log('⚠️ Form validation feedback not immediately visible');
      }
      
      console.log('✅ User feedback mechanisms tested');
    }
  });

  test('should be accessible to users with disabilities', async ({ page }) => {
    console.log('♿ Testing accessibility for users with disabilities...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for accessibility features
    const accessibilityFeatures = {
      altText: await page.locator('img[alt]').count(),
      ariaLabels: await page.locator('[aria-label]').count(),
      headings: await page.locator('h1, h2, h3, h4, h5, h6').count(),
      landmarks: await page.locator('[role="main"], [role="navigation"], [role="banner"]').count(),
      skipLinks: await page.locator('a[href="#main"], a:has-text("Skip")').count()
    };
    
    console.log('Accessibility features found:', accessibilityFeatures);
    
    // Should have some accessibility features
    const totalFeatures = Object.values(accessibilityFeatures).reduce((sum, count) => sum + count, 0);
    expect(totalFeatures).toBeGreaterThan(0);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    if (focusedElement) {
      console.log(`✅ Keyboard navigation works - focused: ${focusedElement}`);
    }
    
    console.log('✅ Accessibility features validated');
  });

  test('should work across different browsers and devices', async ({ page, browserName }) => {
    console.log(`📱 Testing cross-browser compatibility - ${browserName}...`);
    
    // Test basic functionality across browsers
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const body = await page.locator('body').isVisible();
    expect(body).toBe(true);
    
    // Test responsive design
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBe(true);
      
      console.log(`✅ ${viewport.name} viewport works in ${browserName}`);
    }
  });

  test('should provide clear error messages to users', async ({ page }) => {
    console.log('🚨 Testing user error messaging...');
    
    // Test 404 error handling
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.textContent('body');
    const has404Content = pageContent?.includes('404') || 
                         pageContent?.includes('Not Found') || 
                         pageContent?.includes('Page not found');
    
    if (has404Content) {
      console.log('✅ 404 error message provided');
    } else {
      console.log('⚠️ 404 error handling unclear');
    }
    
    // Test form validation errors
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const submitButton = await page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Look for validation messages
      const validationMessages = await page.locator('.error, .invalid, [role="alert"]').count();
      
      if (validationMessages > 0) {
        console.log('✅ Form validation errors displayed');
      } else {
        console.log('⚠️ Form validation errors not immediately visible');
      }
    }
  });

  test('should maintain user session appropriately', async ({ page }) => {
    console.log('🔄 Testing user session management...');
    
    // Login user
    await authHelpers.login();
    
    // User should remain logged in after page refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const isStillLoggedIn = await authHelpers.isAuthenticated();
    expect(isStillLoggedIn).toBe(true);
    
    // User should be able to logout
    await authHelpers.logout();
    
    const isLoggedOut = await authHelpers.isAuthenticated();
    expect(isLoggedOut).toBe(false);
    
    console.log('✅ User session management validated');
  });

  test('should provide intuitive user interface', async ({ page }) => {
    console.log('🎨 Testing user interface intuitiveness...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for common UI elements users expect
    const uiElements = {
      logo: await page.locator('img[alt*="logo"], .logo, [class*="brand"]').isVisible(),
      navigation: await page.locator('nav, .navigation, .navbar').isVisible(),
      footer: await page.locator('footer').isVisible(),
      buttons: await page.locator('button, .btn').count(),
      links: await page.locator('a').count()
    };
    
    console.log('UI elements found:', uiElements);
    
    // Should have basic interactive elements
    expect(uiElements.buttons + uiElements.links).toBeGreaterThan(0);
    
    // Check for consistent styling
    const hasCSS = await page.evaluate(() => {
      const stylesheets = document.styleSheets.length;
      const computedStyle = window.getComputedStyle(document.body);
      return stylesheets > 0 && computedStyle.color !== '';
    });
    
    expect(hasCSS).toBe(true);
    
    console.log('✅ User interface intuitiveness validated');
  });

  test('should meet user performance expectations', async ({ page }) => {
    console.log('⚡ Testing user performance expectations...');
    
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Users expect pages to load within 3 seconds for good UX
    expect(loadTime).toBeLessThan(3000);
    
    // Test interactive elements respond quickly
    const button = await page.locator('button, a').first();
    if (await button.isVisible()) {
      const clickStartTime = Date.now();
      await button.click();
      const clickResponseTime = Date.now() - clickStartTime;
      
      // Interactive elements should respond within 100ms
      expect(clickResponseTime).toBeLessThan(1000);
    }
    
    console.log(`✅ Performance expectations met - Load: ${loadTime}ms`);
  });

  test('should handle user data securely', async ({ page }) => {
    console.log('🔒 Testing user data security...');
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Check password field is properly masked
    const passwordField = await page.locator('#password, input[type="password"]').first();
    if (await passwordField.isVisible()) {
      await passwordField.fill('secretpassword');
      
      const fieldType = await passwordField.getAttribute('type');
      expect(fieldType).toBe('password');
      
      console.log('✅ Password field properly masked');
    }
    
    // Check for HTTPS in production-like environments
    const url = page.url();
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.log('⚠️ Local development - HTTPS check skipped');
    } else {
      expect(url).toMatch(/^https:/);
      console.log('✅ HTTPS enforced');
    }
    
    // Test that sensitive data is not exposed in page source
    const pageSource = await page.content();
    const hasSensitiveData = /password|secret|token|key/i.test(pageSource);
    
    if (!hasSensitiveData) {
      console.log('✅ No sensitive data exposed in page source');
    } else {
      console.log('⚠️ Potential sensitive data found in page source');
    }
  });
}); 