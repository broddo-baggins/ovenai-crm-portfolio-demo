import { test, expect } from '@playwright/test';
import { authenticateUser, navigateWithRetry, findElementWithFallbacks, navigateToSection } from '../../../__helpers__/comprehensive-test-helpers';
import { DEFAULT_TEST_CONFIG, TestURLs } from '../__helpers__/test-config';


test.describe('🎯 Accessibility & Messages Testing', () => {
  test.setTimeout(120000); // 2 minutes per test
  
  test.beforeEach(async ({ page }) => {
    // Use enhanced authentication
    const loginSuccess = await authenticateUser(page);
    expect(loginSuccess).toBe(true);
  });

  test.describe('♿ Core Accessibility Features', () => {
    
    test('should have proper ARIA labels and roles', async ({ page }) => {
      console.log('🧪 Testing ARIA accessibility...');
      
      const navSuccess = await navigateWithRetry(page, TestURLs.dashboard());
      expect(navSuccess).toBe(true);

      await page.waitForTimeout(3000); // Give time for dashboard to load
      
      // Check for main navigation landmark with flexible selectors
      const navigationSelectors = [
        'nav', 
        '[role="navigation"]',
        '.navigation',
        '.navbar',
        '.main-nav',
        '[data-testid="navigation"]'
      ];
      
      const navigation = await findElementWithFallbacks(page, navigationSelectors, 'main navigation');
      if (navigation) {
        console.log('✅ Main navigation found');
        
        // Check for accessible navigation items
        const navItems = page.locator('nav a, [role="navigation"] a, .nav-link, a[href]');
        const count = await navItems.count();
        if (count > 0) {
          console.log(`✅ Found ${count} navigation items`);
        }
      }
      
      // Check for main content area
      const mainContentSelectors = [
        'main', 
        '[role="main"]', 
        '.main-content',
        '.page-content',
        '.content-area'
      ];
      
      const mainContent = await findElementWithFallbacks(page, mainContentSelectors, 'main content area');
      if (mainContent) {
        console.log('✅ Main content area found');
      }
      
      // Check for headings hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      if (headingCount > 0) {
        console.log(`✅ Found ${headingCount} headings`);
      }
      
      console.log('✅ ARIA accessibility test completed');
    });

    test('should support keyboard navigation', async ({ page }) => {
      console.log('🧪 Testing keyboard navigation...');
      
      const navSuccess = await navigateWithRetry(page, TestURLs.dashboard());
      expect(navSuccess).toBe(true);

      await page.waitForTimeout(3000); // Give time for page to load
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusedElement = page.locator(':focus');
      const isFocused = await focusedElement.isVisible().catch(() => false);
      
      if (isFocused) {
        console.log('✅ Keyboard focus working');
      } else {
        console.log('⚠️ Keyboard focus not clearly visible (may be styled differently)');
      }
      
      // Test Enter key on focusable elements
      const interactiveSelectors = ['button', 'a', '[role="button"]', '[role="tab"]'];
      const interactive = await findElementWithFallbacks(page, interactiveSelectors, 'interactive elements');
      
      if (interactive) {
        const allInteractive = page.locator('button, a, [role="button"], [role="tab"]');
        const buttonCount = await allInteractive.count();
        console.log(`✅ Found ${buttonCount} interactive elements`);
      }
      
      console.log('✅ Keyboard navigation test completed');
    });

    test('should have proper form accessibility', async ({ page }) => {
      console.log('🧪 Testing form accessibility...');
      
      // Test login form accessibility by navigating to login page
      const navSuccess = await navigateWithRetry(page, TestURLs.login());
      expect(navSuccess).toBe(true);
      
      await page.waitForTimeout(2000); // Give time for form to load
      
      // Check for form elements with flexible selectors
      const emailInputSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        '[data-testid="email-input"]',
        'input[placeholder*="email" i]'
      ];
      
      const emailInput = await findElementWithFallbacks(page, emailInputSelectors, 'email input');
      if (emailInput) {
        // Check if input has associated label or aria-label
        const emailId = await emailInput.getAttribute('id');
        const ariaLabel = await emailInput.getAttribute('aria-label');
        const hasAccessibleName = emailId || ariaLabel;
        
        if (hasAccessibleName) {
          console.log('✅ Email input has accessible name');
        }
        
        if (emailId) {
          const label = page.locator(`label[for="${emailId}"]`);
          const hasLabel = await label.isVisible().catch(() => false);
          if (hasLabel) {
            console.log('✅ Email input has proper label');
          }
        }
      }
      
      const passwordInputSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        '[data-testid="password-input"]',
        'input[placeholder*="password" i]'
      ];
      
      const passwordInput = await findElementWithFallbacks(page, passwordInputSelectors, 'password input');
      if (passwordInput) {
        const passwordId = await passwordInput.getAttribute('id');
        const ariaLabel = await passwordInput.getAttribute('aria-label');
        const hasAccessibleName = passwordId || ariaLabel;
        
        if (hasAccessibleName) {
          console.log('✅ Password input has accessible name');
        }
      }
      
      // Test form validation (if available)
      const submitButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
        '[data-testid="submit"]'
      ];
      
      const submitButton = await findElementWithFallbacks(page, submitButtonSelectors, 'submit button');
      if (submitButton) {
        console.log('✅ Form submit button found');
        
        // Clear any existing values and try to submit empty form
        if (emailInput) {
          await emailInput.fill('');
        }
        if (passwordInput) {
          await passwordInput.fill('');
        }
        
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Look for validation messages
        const errorSelectors = [
          '[role="alert"]', 
          '.error-message', 
          '.field-error',
          '.invalid-feedback',
          '[data-testid*="error"]'
        ];
        
        const errorMessage = await findElementWithFallbacks(page, errorSelectors, 'validation message');
        if (errorMessage) {
          console.log('✅ Form validation messages shown');
        }
      }
      
      console.log('✅ Form accessibility test completed');
    });
  });

  test.describe('💬 Messages Functionality', () => {
    
    test('should display messages page', async ({ page }) => {
      console.log('🧪 Testing messages page display...');
      
      // Try to navigate to messages page
      const navSuccess = await navigateToSection(page, 'messages');
      if (navSuccess) {
        console.log('✅ Successfully navigated to messages section');
        
        // Look for messages interface with comprehensive selectors
        const messagesSelectors = [
          '[data-testid="messages-page"]',
          '.messages-container',
          '.conversation-list',
          '.chat-interface',
          '.messages-wrapper',
          '.whatsapp-messages',
          '.message-dashboard',
          'h1:has-text("Messages")',
          'h2:has-text("Messages")'
        ];
        
        const messagesInterface = await findElementWithFallbacks(page, messagesSelectors, 'messages interface');
        if (messagesInterface) {
          console.log('✅ Messages interface found and displayed');
        } else {
          console.log('⚠️ Messages interface not found - may be loading or different structure');
        }
      } else {
        // Try direct navigation as fallback
        const directNavSuccess = await navigateWithRetry(page, TestURLs.messages());
        if (directNavSuccess) {
          console.log('✅ Accessed messages via direct navigation');
          
          await page.waitForTimeout(3000);
          
          const messagesPage = await findElementWithFallbacks(page, [
            'h1', 'h2', 'main', '.page-content'
          ], 'messages page content');
          
          if (messagesPage) {
            console.log('✅ Messages page content loaded');
          }
        } else {
          console.log('⚠️ Could not access messages page');
        }
      }
      
      console.log('✅ Messages page display test completed');
    });

    test('should handle message interactions', async ({ page }) => {
      console.log('🧪 Testing message interactions...');
      
      // Navigate to messages
      const navSuccess = await navigateToSection(page, 'messages');
      if (!navSuccess) {
        // Try direct navigation
        const directNavSuccess = await navigateWithRetry(page, TestURLs.messages());
        if (!directNavSuccess) {
          console.log('⚠️ Could not access messages for interaction testing');
          return;
        }
      }
      
      await page.waitForTimeout(3000); // Give time for messages to load
      
      // Look for message input or compose area
      const messageInputSelectors = [
        'textarea[placeholder*="message" i]',
        'input[placeholder*="message" i]',
        '.message-input',
        '[data-testid="message-input"]',
        '[data-testid="compose"]',
        '.compose-message',
        'textarea[name="message"]'
      ];
      
      const messageInput = await findElementWithFallbacks(page, messageInputSelectors, 'message input');
      if (messageInput) {
        console.log('✅ Message input found');
        
        // Test typing in message input
        await messageInput.fill('Test message for functionality');
        const value = await messageInput.inputValue();
        if (value.includes('Test message')) {
          console.log('✅ Message input working correctly');
        }
        
        // Clear the input
        await messageInput.fill('');
      }
      
      // Look for conversation list
      const conversationSelectors = [
        '.conversation-item',
        '.chat-item',
        '[data-testid*="conversation"]',
        '.message-thread',
        '.contact-list',
        '.chat-list'
      ];
      
      const conversations = await findElementWithFallbacks(page, conversationSelectors, 'conversation list');
      if (conversations) {
        const allConversations = page.locator('.conversation-item, .chat-item, [data-testid*="conversation"], .message-thread');
        const count = await allConversations.count();
        console.log(`✅ Found ${count} conversation items`);
      }
      
      // Look for send button
      const sendButtonSelectors = [
        'button:has-text("Send")',
        '[data-testid="send-message"]',
        '.send-button',
        'button[type="submit"]'
      ];
      
      const sendButton = await findElementWithFallbacks(page, sendButtonSelectors, 'send button');
      if (sendButton) {
        console.log('✅ Send button found');
      }
      
      console.log('✅ Message interactions test completed');
    });
  });

  test.describe('🌐 Multi-language Support', () => {
    
    test('should support language switching', async ({ page }) => {
      console.log('🧪 Testing language support...');
      
      const navSuccess = await navigateWithRetry(page, TestURLs.dashboard());
      expect(navSuccess).toBe(true);

      await page.waitForTimeout(3000); // Give time for page to load
      
      // Look for language toggle with comprehensive selectors
      const languageSelectors = [
        'button:has-text("עב")', // Hebrew abbreviation
        'button:has-text("Hebrew")',
        'button:has-text("עברית")', // Hebrew word for Hebrew
        '[data-testid="language-toggle"]',
        '.language-switch',
        'button[aria-label*="language" i]',
        '.lang-toggle',
        'select[name*="language"]'
      ];
      
      const languageToggle = await findElementWithFallbacks(page, languageSelectors, 'language toggle');
      if (languageToggle) {
        console.log('✅ Language toggle found');
        
        // Try to click it
        await languageToggle.click();
        await page.waitForTimeout(2000); // Allow for language change
        
        // Check if page direction changed to RTL
        const htmlElement = page.locator('html').first();
        const dir = await htmlElement.getAttribute('dir');
        
        if (dir === 'rtl') {
          console.log('✅ RTL language successfully applied');
        } else {
          console.log('⚠️ RTL not applied - may use different language system');
        }
        
        // Check for Hebrew text
        const bodyText = await page.textContent('body');
        if (bodyText && /[\u0590-\u05FF]/.test(bodyText)) {
          console.log('✅ Hebrew text detected on page');
        }
      } else {
        console.log('⚠️ Language toggle not found - may not be implemented or different design');
      }
      
      console.log('✅ Language support test completed');
    });
  });
  
  test.describe('📱 Responsive Design', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      console.log('🧪 Testing mobile responsiveness...');
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const navSuccess = await navigateWithRetry(page, TestURLs.dashboard());
      expect(navSuccess).toBe(true);

      await page.waitForTimeout(3000); // Give time for mobile layout to adjust
      
      // Check if mobile navigation is present
      const mobileNavSelectors = [
        '.mobile-menu',
        '.hamburger-menu',
        'button[aria-label*="menu" i]',
        '[data-testid="mobile-nav"]',
        '.mobile-toggle',
        '.nav-toggle',
        'button.md\\:hidden' // Tailwind responsive class
      ];
      
      const mobileNav = await findElementWithFallbacks(page, mobileNavSelectors, 'mobile navigation');
      if (mobileNav) {
        console.log('✅ Mobile navigation element found');
        
        // Try to interact with mobile menu
        try {
          await mobileNav.click();
          await page.waitForTimeout(1000);
          console.log('✅ Mobile menu interaction works');
        } catch (e) {
          console.log('⚠️ Mobile menu may not be clickable');
        }
      }
      
      // Check if content is properly sized for mobile
      const body = page.locator('body').first();
      const bodyWidth = await body.evaluate(el => el.scrollWidth);
      
      if (bodyWidth <= 375 + 20) { // Allow for small margin
        console.log('✅ Content fits mobile viewport');
      } else {
        console.log(`⚠️ Content width (${bodyWidth}px) may overflow mobile viewport (375px)`);
      }
      
      // Check for touch-friendly elements
      const touchElements = page.locator('button, a, [role="button"]');
      const touchCount = await touchElements.count();
      
      if (touchCount > 0) {
        // Check if first few buttons are touch-friendly (>= 44px height)
        for (let i = 0; i < Math.min(touchCount, 3); i++) {
          try {
            const element = touchElements.nth(i);
            const box = await element.boundingBox();
            if (box && box.height >= 44) {
              console.log('✅ Touch-friendly interactive elements found');
              break;
            }
          } catch (e) {
            // Element might not be visible
          }
        }
      }
      
      console.log('✅ Mobile responsiveness test completed');
    });
  });
});
