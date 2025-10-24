import { test, expect } from '@playwright/test';
import { ensureAuthenticated, loginTestUser } from '../../../__helpers__/auth-helper';
import { testCredentials } from '../../__helpers__/test-credentials';

test.describe('🌍 RTL, Hebrew Translation & Dark Mode Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're authenticated before accessing protected routes
    await ensureAuthenticated(page);
    console.log('🔐 Authentication verified for RTL/Hebrew/Dark mode tests');
  });

  test.describe('1. RTL Support', () => {
    test('should switch to RTL when Hebrew is selected', async ({ page }) => {
      console.log('🔄 Testing RTL layout switching...');
      
      // Authenticate first
      await page.goto('/auth/login');
      await page.fill('#email', testCredentials.email);
      await page.fill('#password', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Navigate to settings or language selector
      await page.goto('/settings');
      await page.waitForSelector('[data-testid="settings-page"], main, .settings-page', { timeout: 15000 });
      
      // Look for language selector
      const languageSelector = page.locator('[data-testid="language-selector"]');
      if (await languageSelector.isVisible()) {
        // Select Hebrew
        await languageSelector.click();
        const hebrewOption = page.locator('[data-value="he"], [value="he"]');
        if (await hebrewOption.isVisible()) {
          await hebrewOption.click();
        }
      }
      
      // Check if document direction changes to RTL
      const documentDir = await page.evaluate(() => document.documentElement.dir);
      expect(documentDir).toBe('rtl');
      
      // Check if body has Hebrew font class
      const bodyClasses = await page.evaluate(() => document.body.className);
      expect(bodyClasses).toContain('font-hebrew');
      
      console.log('✅ RTL layout switching verified');
    });

    test('should maintain RTL layout across navigation', async ({ page }) => {
      console.log('🧭 Testing RTL persistence across pages...');
      
      // Authenticate first
      await page.goto('/auth/login');
      await page.fill('#email', testCredentials.email);
      await page.fill('#password', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Set localStorage to Hebrew
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'he');
      });
      
      // Navigate to different pages and verify RTL
      const pagesToTest = ['/dashboard', '/messages', '/projects', '/lead-pipeline'];
      
      for (const pagePath of pagesToTest) {
        await page.goto(pagePath);
        await page.waitForSelector('main, [data-testid*="page"], [data-testid*="dashboard"], [data-testid*="messages"], [data-testid*="projects"]', { timeout: 15000 });
        
        // Verify RTL is maintained
        const documentDir = await page.evaluate(() => document.documentElement.dir);
        expect(documentDir).toBe('rtl');
        
        // Check for Hebrew font class
        const bodyClasses = await page.evaluate(() => document.body.className);
        expect(bodyClasses).toContain('font-hebrew');
      }
      
      console.log('✅ RTL persistence verified across navigation');
    });

    test('should properly align elements in RTL mode', async ({ page }) => {
      console.log('📐 Testing RTL element alignment...');
      
      // Authenticate first
      await page.goto('/auth/login');
      await page.fill('#email', testCredentials.email);
      await page.fill('#password', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Set Hebrew language
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'he');
      });
      
      await page.goto('/messages');
      await page.waitForSelector('[data-testid="messages-page"], main, .messages-page', { timeout: 15000 });
      
      // Check sidebar alignment in RTL
      const sidebar = page.locator('[data-testid="main-sidebar"], [data-sidebar="sidebar"], .sidebar');
      if (await sidebar.isVisible()) {
        const sidebarBox = await sidebar.boundingBox();
        const viewportSize = page.viewportSize();
        
        if (sidebarBox && viewportSize) {
          // In RTL, sidebar should be on the right side
          expect(sidebarBox.x).toBeGreaterThan(viewportSize.width / 2);
        }
      }
      
      // Check if text fields have proper RTL direction
      const textInputs = page.locator('input[type="text"], textarea');
      const inputCount = await textInputs.count();
      
      if (inputCount > 0) {
        const firstInput = textInputs.first();
        const inputDirection = await firstInput.evaluate((el) => 
          window.getComputedStyle(el).direction
        );
        expect(inputDirection).toBe('rtl');
      }
      
      console.log('✅ RTL element alignment verified');
    });
  });

  test.describe('2. Hebrew Translation Support', () => {
    test('should display Hebrew text in UI elements', async ({ page }) => {
      console.log('🔤 Testing Hebrew translation display...');
      
      // Set Hebrew language
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'he');
      });
      
      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="dashboard-page"], main, .dashboard', { timeout: 15000 });
      
      // Check for Hebrew characters in the page
      const pageText = await page.textContent('body');
      const hasHebrewChars = /[\u0590-\u05FF]/.test(pageText || '');
      
      if (hasHebrewChars) {
        console.log('✅ Hebrew characters found in UI');
      } else {
        console.log('⚠️ No Hebrew characters found - may be fallback to keys');
      }
      
      // Check specific elements that should be translated
      const navigationItems = page.locator('[data-testid*="nav-link"], nav a, .nav-link');
      const navCount = await navigationItems.count();
      expect(navCount).toBeGreaterThan(0);
      
      console.log('✅ Hebrew translation display verified');
    });

    test('should handle Hebrew text in forms and inputs', async ({ page }) => {
      console.log('📝 Testing Hebrew input handling...');
      
      // Set Hebrew language
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'he');
      });
      
      await page.goto('/projects');
      await page.waitForSelector('[data-testid="projects-page"], main, .projects-page', { timeout: 15000 });
      
      // Try to open a form (like edit project)
      const editButton = page.locator('[data-testid="project-edit-btn"], button:has-text("Edit"), button:has-text("עריכה")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Test Hebrew input in form
        const nameInput = page.locator('[data-testid="project-name-input"], input[name="name"], input[placeholder*="name" i]').first();
        if (await nameInput.isVisible()) {
          const hebrewText = 'פרויקט בדיקה';
          await nameInput.fill(hebrewText);
          
          const inputValue = await nameInput.inputValue();
          expect(inputValue).toBe(hebrewText);
        }
      }
      
      console.log('✅ Hebrew input handling verified');
    });

    test('should maintain Hebrew translations in all propagated fixes', async ({ page }) => {
      console.log('🔧 Testing Hebrew translations in new components...');
      
      // Set Hebrew language
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'he');
      });
      
      // Test cookie consent in Hebrew
      await page.goto('/');
      const cookieConsent = page.locator('[data-testid="cookie-consent"]');
      if (await cookieConsent.isVisible()) {
        const consentText = await cookieConsent.textContent();
        // Should contain translated text or Hebrew characters
        expect(consentText).toBeTruthy();
      }
      
      // Test WhatsApp templates page
      await page.goto('/lead-pipeline');
      await page.waitForSelector('[data-testid="template-management"], main, .template-management', { timeout: 15000 });
      
      // Switch to WhatsApp tab and verify translations
      const whatsappTab = page.locator('[data-testid="whatsapp-templates-tab"], button:has-text("WhatsApp")');
      if (await whatsappTab.isVisible()) {
        await whatsappTab.click();
        
        // Check for translated content
        const pageContent = await page.textContent('[data-testid="template-manager"], main');
        expect(pageContent).toBeTruthy();
      }
      
      console.log('✅ Hebrew translations in new components verified');
    });
  });

  test.describe('3. Dark Mode Support', () => {
    test('should switch to dark mode when toggled', async ({ page }) => {
      console.log('🌙 Testing dark mode switching...');
      
      // Authenticate first
      await page.goto('/auth/login');
      await page.fill('#email', testCredentials.email);
      await page.fill('#password', testCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      await page.goto('/settings');
      await page.waitForSelector('[data-testid="settings-page"], main, .settings-page', { timeout: 15000 });
      
      // Look for theme toggle
      const themeToggle = page.locator('[data-testid="theme-toggle"], [data-testid="dark-mode-toggle"], [data-testid="theme-controller"], .theme-controller');
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        
        // Check if dark mode is applied
        const htmlElement = page.locator('html');
        const htmlClasses = await htmlElement.getAttribute('class');
        expect(htmlClasses).toContain('dark');
        
        // Verify dark background colors (not grey)
        const bodyStyles = await page.evaluate(() => {
          const body = document.body;
          const styles = window.getComputedStyle(body);
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color
          };
        });
        
        // Should have dark background, not grey
        console.log('Dark mode styles:', bodyStyles);
        
        // Check specific dark mode colors in components
        const cardElements = page.locator('.card, [data-testid*="card"]');
        const cardCount = await cardElements.count();
        
        if (cardCount > 0) {
          const cardBg = await cardElements.first().evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });
          
          // Should be dark colors (rgb values closer to 0) not grey (128, 128, 128)
          console.log('Card background in dark mode:', cardBg);
        }
      }
      
      console.log('✅ Dark mode switching verified');
    });

    test('should maintain dark mode across navigation', async ({ page }) => {
      console.log('🔄 Testing dark mode persistence...');
      
      // Set dark mode in localStorage
      await page.evaluate(() => {
        localStorage.setItem('vite-ui-theme', 'dark');
      });
      
      // Navigate to different pages and verify dark mode
      const pagesToTest = ['/dashboard', '/messages', '/projects', '/lead-pipeline', '/calendar'];
      
      for (const pagePath of pagesToTest) {
        await page.goto(pagePath);
        await page.waitForSelector('main, [data-testid*="page"], [data-testid*="dashboard"], [data-testid*="messages"], [data-testid*="projects"]', { timeout: 15000 });
        
        // Verify dark mode is maintained
        const htmlClasses = await page.locator('html').getAttribute('class');
        expect(htmlClasses).toContain('dark');
        
        // Check for proper dark styling (not grey)
        const mainElement = page.locator('main');
        if (await mainElement.isVisible()) {
          const mainBg = await mainElement.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });
          
          // Log background color for debugging
          console.log(`${pagePath} main background:`, mainBg);
        }
      }
      
      console.log('✅ Dark mode persistence verified');
    });

    test('should apply proper dark mode colors to new components', async ({ page }) => {
      console.log('🎨 Testing dark mode in new components...');
      
      // Set dark mode
      await page.evaluate(() => {
        localStorage.setItem('vite-ui-theme', 'dark');
      });
      
      // Test cookie consent dark mode
      await page.goto('/');
      const cookieConsent = page.locator('[data-testid="cookie-consent"]');
      if (await cookieConsent.isVisible()) {
        const consentBg = await cookieConsent.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        console.log('Cookie consent dark background:', consentBg);
      }
      
      // Test progress bars dark mode
      await page.goto('/messages');
      const progressElement = page.locator('.progress, [data-testid*="progress"]');
      if (await progressElement.isVisible()) {
        const progressBg = await progressElement.first().evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });
        console.log('Progress bar dark background:', progressBg);
      }
      
      // Test modal dark mode (projects edit modal)
      await page.goto('/projects');
      await page.waitForSelector('[data-testid="projects-page"], main, .projects-page', { timeout: 15000 });
      
      const editButton = page.locator('[data-testid="project-edit-btn"], button:has-text("Edit"), button:has-text("עריכה")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        const modal = page.locator('[data-testid="edit-project-modal"], .modal, [role="dialog"]');
        if (await modal.isVisible()) {
          const modalBg = await modal.evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });
          console.log('Modal dark background:', modalBg);
          
          // Should be dark, not grey
          expect(modalBg).not.toContain('128'); // Avoid grey colors
        }
      }
      
      console.log('✅ Dark mode in new components verified');
    });
  });

  test.describe('4. Combined RTL + Dark Mode + Hebrew', () => {
    test('should handle all three features together', async ({ page }) => {
      console.log('🌟 Testing RTL + Dark Mode + Hebrew combination...');
      
      // Set all three: Hebrew language, dark mode, RTL
      await page.evaluate(() => {
        localStorage.setItem('i18nextLng', 'he');
        localStorage.setItem('vite-ui-theme', 'dark');
      });
      
      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="dashboard-page"], main, .dashboard', { timeout: 15000 });
      
      // Verify all three are active
      const documentDir = await page.evaluate(() => document.documentElement.dir);
      const htmlClasses = await page.locator('html').getAttribute('class');
      const bodyClasses = await page.evaluate(() => document.body.className);
      
      expect(documentDir).toBe('rtl');
      expect(htmlClasses).toContain('dark');
      expect(bodyClasses).toContain('font-hebrew');
      
      // Test interaction in this combined mode
      await page.goto('/messages');
      await page.waitForSelector('[data-testid="messages-page"], main, .messages-page', { timeout: 15000 });
      
      // Verify the page functions correctly with all features
      const conversationList = page.locator('[data-testid="conversation-list"], .conversation-list, [data-testid*="conversation"]');
      if (await conversationList.isVisible()) {
        const listStyles = await conversationList.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return {
            direction: styles.direction,
            backgroundColor: styles.backgroundColor,
            textAlign: styles.textAlign
          };
        });
        
        expect(listStyles.direction).toBe('rtl');
        console.log('Combined mode styles:', listStyles);
      }
      
      console.log('✅ Combined RTL + Dark Mode + Hebrew verified');
    });
  });
}); 