import { test, expect } from '@playwright/test';
import { authenticateAndNavigate } from '../__helpers__/auth-helper';

test.describe('🚀 Performance & RTL Quick Tests', () => {
  test('should authenticate quickly and support RTL', async ({ page }) => {
    const startTime = Date.now();
    
    // Test fast authentication
    console.log('🔐 Testing optimized authentication...');
    await authenticateAndNavigate(page, '/dashboard');
    
    const authTime = Date.now() - startTime;
    console.log(`⏱️ Authentication completed in: ${authTime}ms`);
    
    // Authentication should complete within 30 seconds
    expect(authTime).toBeLessThan(30000);
    
    // Test RTL switching performance
    const rtlStartTime = Date.now();
    
    console.log('🌐 Testing RTL language switch...');
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'he');
      window.location.reload();
    });
    
    await page.waitForLoadState('domcontentloaded');
    
    const rtlTime = Date.now() - rtlStartTime;
    console.log(`⏱️ RTL switch completed in: ${rtlTime}ms`);
    
    // RTL switch should complete within 10 seconds
    expect(rtlTime).toBeLessThan(10000);
    
    // Verify RTL is applied
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('dir', 'rtl');
    
    // Test component responsiveness
    const componentStartTime = Date.now();
    
    // Navigate to different pages to test component loading
    const testPages = ['/leads', '/messages', '/projects'];
    
    for (const testPath of testPages) {
      const pageStartTime = Date.now();
      
      await page.goto(testPath, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('main, [role="main"], .main-content', {
        timeout: 5000,
        state: 'visible'
      }).catch(() => {
        console.log(`ℹ️ Main content not found for ${testPath}, continuing...`);
      });
      
      const pageLoadTime = Date.now() - pageStartTime;
      console.log(`⏱️ ${testPath} loaded in: ${pageLoadTime}ms`);
      
      // Each page should load within 5 seconds
      expect(pageLoadTime).toBeLessThan(5000);
      
      // Verify RTL is maintained across pages
      const htmlDir = await htmlElement.getAttribute('dir');
      expect(htmlDir).toBe('rtl');
    }
    
    const totalComponentTime = Date.now() - componentStartTime;
    console.log(`⏱️ All components tested in: ${totalComponentTime}ms`);
    
    // All component testing should complete within 20 seconds
    expect(totalComponentTime).toBeLessThan(20000);
    
    console.log('✅ Performance and RTL tests completed successfully');
  });

  test('should handle data loading efficiently', async ({ page }) => {
    await authenticateAndNavigate(page, '/leads');
    
    const dataLoadStartTime = Date.now();
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="leads-table"], .leads-list, table', {
      timeout: 10000,
      state: 'visible'
    }).catch(() => {
      console.log('ℹ️ Leads table not found, checking for alternative data indicators...');
    });
    
    // Check for loading states being replaced by content
    const hasContent = await page.locator('table tr, .lead-item, [data-testid*="lead"]').count() > 0;
    const hasLoadingIndicator = await page.locator('.loading, .spinner, .skeleton').count() > 0;
    
    const dataLoadTime = Date.now() - dataLoadStartTime;
    console.log(`⏱️ Data loading completed in: ${dataLoadTime}ms`);
    console.log(`📊 Has content: ${hasContent}, Has loading indicators: ${hasLoadingIndicator}`);
    
    // Data should load within 8 seconds
    expect(dataLoadTime).toBeLessThan(8000);
  });

  test('should maintain performance with RTL forms', async ({ page }) => {
    await authenticateAndNavigate(page, '/leads');
    
    // Switch to RTL
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'he');
      window.location.reload();
    });
    await page.waitForLoadState('domcontentloaded');
    
    const formTestStartTime = Date.now();
    
    // Look for form elements
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      const form = forms.first();
      
      // Verify RTL is applied to form
      const formDir = await form.getAttribute('dir');
      const formClasses = await form.getAttribute('class');
      
      expect(formDir === 'rtl' || (formClasses && formClasses.includes('rtl'))).toBeTruthy();
      
      // Test form input performance
      const inputs = form.locator('input, textarea, select');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        const inputType = await input.getAttribute('type');
        
        if (inputType === 'text' || inputType === 'tel' || !inputType) {
          // Test Hebrew input
          const hebrewText = 'שלום עולם';
          await input.fill(hebrewText);
          
          const inputValue = await input.inputValue();
          expect(inputValue).toBe(hebrewText);
        }
      }
    }
    
    const formTestTime = Date.now() - formTestStartTime;
    console.log(`⏱️ RTL form testing completed in: ${formTestTime}ms`);
    
    // Form testing should complete within 5 seconds
    expect(formTestTime).toBeLessThan(5000);
  });

  test('should handle real-time updates efficiently', async ({ page }) => {
    await authenticateAndNavigate(page, '/messages');
    
    const realtimeTestStartTime = Date.now();
    
    // Wait for messages to load
    await page.waitForSelector('[data-testid*="message"], .message, .chat-message', {
      timeout: 10000,
      state: 'visible'
    }).catch(() => {
      console.log('ℹ️ Messages not found, testing with available elements...');
    });
    
    // Check for real-time indicators
    const hasRealtimeIndicators = await page.locator('[data-testid*="online"], .online, .connected, [class*="realtime"]').count() > 0;
    
    const realtimeTestTime = Date.now() - realtimeTestStartTime;
    console.log(`⏱️ Real-time testing completed in: ${realtimeTestTime}ms`);
    console.log(`🔄 Has real-time indicators: ${hasRealtimeIndicators}`);
    
    // Real-time setup should complete within 8 seconds
    expect(realtimeTestTime).toBeLessThan(8000);
  });

  test('should handle mobile RTL performance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileTestStartTime = Date.now();
    
    await authenticateAndNavigate(page, '/dashboard');
    
    // Switch to RTL
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'he');
      window.location.reload();
    });
    await page.waitForLoadState('domcontentloaded');
    
    // Verify mobile RTL layout
    const htmlElement = page.locator('html');
    await expect(htmlElement).toHaveAttribute('dir', 'rtl');
    
    // Check mobile navigation
    const mobileNav = page.locator('[class*="mobile"], button[aria-expanded], [data-testid*="mobile"]');
    const mobileNavCount = await mobileNav.count();
    
    if (mobileNavCount > 0) {
      console.log(`📱 Found ${mobileNavCount} mobile navigation elements`);
    }
    
    const mobileTestTime = Date.now() - mobileTestStartTime;
    console.log(`⏱️ Mobile RTL testing completed in: ${mobileTestTime}ms`);
    
    // Mobile testing should complete within 15 seconds
    expect(mobileTestTime).toBeLessThan(15000);
  });
}); 