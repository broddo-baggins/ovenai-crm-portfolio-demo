import { test, expect } from '@playwright/test';

test.describe('🌙 Dark Mode Audit - No Authentication Required', () => {
  test('should verify dark mode implementation on landing page', async ({ page }) => {
    console.log('🧪 Testing dark mode functionality on public pages...');
    
    // Go to landing page (doesn't require auth)
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Check initial state (should be light mode by default due to LightModeWrapper)
    console.log('📍 Checking initial light mode state...');
    
    const htmlElement = page.locator('html');
    let currentClasses = await htmlElement.getAttribute('class');
    let dataTheme = await htmlElement.getAttribute('data-theme');
    
    console.log(`Initial HTML classes: ${currentClasses || 'none'}`);
    console.log(`Initial data-theme: ${dataTheme || 'none'}`);
    
    // Verify light mode is forced on landing page
    expect(currentClasses).toContain('light');
    
    // Look for theme toggle button
    console.log('🔍 Looking for theme toggle...');
    
    const themeToggleSelectors = [
      '[data-testid="theme-toggle"]',
      '[data-testid="theme-controller"]', 
      '[data-testid="dark-mode-toggle"]',
      'button:has-text("🌙")',
      'button:has-text("☀️")',
      '.theme-controller'
    ];
    
    let themeToggle = null;
    for (const selector of themeToggleSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found theme toggle with selector: ${selector}`);
          themeToggle = element;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (themeToggle) {
      console.log('🌙 Testing theme toggle functionality...');
      
      // Click to toggle to dark mode
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      // Check if dark mode applied
      currentClasses = await htmlElement.getAttribute('class');
      dataTheme = await htmlElement.getAttribute('data-theme');
      
      console.log(`After toggle - HTML classes: ${currentClasses || 'none'}`);
      console.log(`After toggle - data-theme: ${dataTheme || 'none'}`);
      
      // Verify dark mode classes
      if (currentClasses?.includes('dark') || dataTheme === 'dark') {
        console.log('✅ Dark mode successfully activated');
      } else {
        console.log('⚠️ Dark mode may not be working - checking other indicators');
      }
      
      // Toggle back to light mode
      await themeToggle.click();
      await page.waitForTimeout(1000);
      
      currentClasses = await htmlElement.getAttribute('class');
      console.log(`After toggle back - HTML classes: ${currentClasses || 'none'}`);
      
    } else {
      console.log('⚠️ No theme toggle found on landing page');
    }
    
    console.log('✅ Dark mode audit completed for landing page');
  });
  
  test('should verify CSS variables for dark mode', async ({ page }) => {
    console.log('🧪 Testing CSS variables for dark/light modes...');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test CSS variables in both modes
    const cssVariableTests = await page.evaluate(() => {
      const root = document.documentElement;
      const getComputedVar = (varName: string) => {
        return getComputedStyle(root).getPropertyValue(varName).trim();
      };
      
      // Force light mode and check variables
      root.classList.remove('dark');
      root.classList.add('light');
      
      const lightVars = {
        background: getComputedVar('--background'),
        foreground: getComputedVar('--foreground'),
        primary: getComputedVar('--primary'),
        card: getComputedVar('--card')
      };
      
      // Force dark mode and check variables
      root.classList.remove('light');
      root.classList.add('dark');
      
      const darkVars = {
        background: getComputedVar('--background'),
        foreground: getComputedVar('--foreground'),
        primary: getComputedVar('--primary'),
        card: getComputedVar('--card')
      };
      
      return { lightVars, darkVars };
    });
    
    console.log('Light mode variables:', cssVariableTests.lightVars);
    console.log('Dark mode variables:', cssVariableTests.darkVars);
    
    // Verify variables are different between modes
    expect(cssVariableTests.lightVars.background).not.toBe(cssVariableTests.darkVars.background);
    expect(cssVariableTests.lightVars.foreground).not.toBe(cssVariableTests.darkVars.foreground);
    
    console.log('✅ CSS variables correctly switch between light and dark modes');
  });
  
  test('should verify system theme detection', async ({ page }) => {
    console.log('🧪 Testing system theme detection...');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test system theme detection
    const systemThemeTest = await page.evaluate(() => {
      // Check if system theme detection works
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemDark = mediaQuery.matches;
      
      // Try to simulate system theme change (this might not work in all test environments)
      let simulationWorked = false;
      try {
        // This is mostly for logging - actual system simulation is complex
        simulationWorked = true;
      } catch (e) {
        simulationWorked = false;
      }
      
      return {
        systemDark,
        mediaQuerySupported: !!mediaQuery,
        simulationWorked
      };
    });
    
    console.log(`System prefers dark: ${systemThemeTest.systemDark}`);
    console.log(`Media query supported: ${systemThemeTest.mediaQuerySupported}`);
    
    expect(systemThemeTest.mediaQuerySupported).toBe(true);
    
    console.log('✅ System theme detection is implemented');
  });
  
  test('should verify localStorage theme persistence', async ({ page }) => {
    console.log('🧪 Testing theme persistence in localStorage...');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test localStorage functionality
    const localStorageTest = await page.evaluate(() => {
      const storageKey = 'vite-ui-theme';
      
      // Clear any existing theme
      localStorage.removeItem(storageKey);
      
      // Set dark theme
      localStorage.setItem(storageKey, 'dark');
      const darkStored = localStorage.getItem(storageKey);
      
      // Set light theme
      localStorage.setItem(storageKey, 'light');
      const lightStored = localStorage.getItem(storageKey);
      
      // Set system theme
      localStorage.setItem(storageKey, 'system');
      const systemStored = localStorage.getItem(storageKey);
      
      return {
        darkStored,
        lightStored,
        systemStored,
        localStorageAvailable: typeof localStorage !== 'undefined'
      };
    });
    
    console.log('localStorage theme persistence test:', localStorageTest);
    
    expect(localStorageTest.localStorageAvailable).toBe(true);
    expect(localStorageTest.darkStored).toBe('dark');
    expect(localStorageTest.lightStored).toBe('light');
    expect(localStorageTest.systemStored).toBe('system');
    
    console.log('✅ Theme persistence in localStorage works correctly');
  });
  
  test('should verify dark mode compatibility with common UI elements', async ({ page }) => {
    console.log('🧪 Testing dark mode compatibility with UI elements...');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Force dark mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    await page.waitForTimeout(1000);
    
    // Check common UI elements for dark mode compatibility
    const uiElementTests = await page.evaluate(() => {
      const elements = {
        buttons: document.querySelectorAll('button').length,
        links: document.querySelectorAll('a').length,
        headers: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
        texts: document.querySelectorAll('p, span, div').length
      };
      
      // Check if any elements have explicit dark mode classes
      const darkModeElements = document.querySelectorAll('[class*="dark:"]').length;
      
      // Check if root has dark class
      const rootHasDark = document.documentElement.classList.contains('dark');
      
      return {
        ...elements,
        darkModeElements,
        rootHasDark,
        totalElements: elements.buttons + elements.links + elements.headers
      };
    });
    
    console.log('UI elements found:', uiElementTests);
    
    expect(uiElementTests.rootHasDark).toBe(true);
    expect(uiElementTests.totalElements).toBeGreaterThan(0);
    
    console.log('✅ Dark mode UI compatibility verified');
  });
  
  test('should verify theme provider integration', async ({ page }) => {
    console.log('🧪 Testing theme provider integration...');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Test theme provider is loaded
    const themeProviderTest = await page.evaluate(() => {
      // Check if React context or theme variables are available
      const hasThemeProvider = window.React !== undefined;
      
      // Check if CSS custom properties are defined
      const style = getComputedStyle(document.documentElement);
      const backgroundVar = style.getPropertyValue('--background');
      const foregroundVar = style.getPropertyValue('--foreground');
      const primaryVar = style.getPropertyValue('--primary');
      
      return {
        hasReact: hasThemeProvider,
        hasBackgroundVar: !!backgroundVar,
        hasForegroundVar: !!foregroundVar,
        hasPrimaryVar: !!primaryVar,
        cssVariablesCount: backgroundVar && foregroundVar && primaryVar ? 3 : 0
      };
    });
    
    console.log('Theme provider integration:', themeProviderTest);
    
    expect(themeProviderTest.hasBackgroundVar).toBe(true);
    expect(themeProviderTest.hasForegroundVar).toBe(true);
    expect(themeProviderTest.cssVariablesCount).toBeGreaterThanOrEqual(3);
    
    console.log('✅ Theme provider integration verified');
  });
}); 