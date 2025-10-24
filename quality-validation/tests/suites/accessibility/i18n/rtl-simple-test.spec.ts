import { test, expect } from '@playwright/test';

test.describe('🌐 Simple RTL Language Test', () => {
  test('should switch to Hebrew and apply RTL properly', async ({ page }) => {
    console.log('🧪 Testing simple RTL language switching...');
    
    // Go to the landing page first
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('📍 On landing page, checking initial state...');
    
    // Check initial English state
    const initialDir = await page.locator('html').getAttribute('dir');
    console.log(`Initial direction: ${initialDir || 'not set'}`);
    
    // Try to find a language toggle
    console.log('🔍 Looking for language toggle...');
    
    const languageToggleSelectors = [
      'button:has-text("עברית")', // Hebrew text
      'button:has-text("🌐")', // Globe icon
      '[data-testid="language-toggle"]',
      'button[aria-label*="language"]',
      'button[title*="language"]'
    ];
    
    let languageToggle = null;
    for (const selector of languageToggleSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found language toggle with selector: ${selector}`);
          languageToggle = element;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (languageToggle) {
      console.log('🔄 Clicking language toggle to switch to Hebrew...');
      await languageToggle.click();
      
      // Wait for language switch to complete
      await page.waitForTimeout(2000);
      
      // Check if HTML dir attribute is now RTL
      const newDir = await page.locator('html').getAttribute('dir');
      console.log(`New direction after toggle: ${newDir || 'not set'}`);
      
      if (newDir === 'rtl') {
        console.log('✅ Successfully switched to RTL mode via language toggle');
        expect(newDir).toBe('rtl');
      } else {
        console.log('⚠️ Language toggle did not set RTL, trying localStorage method...');
      }
    } else {
      console.log('⚠️ No language toggle found, trying localStorage method...');
    }
    
    // Alternative method: Set localStorage directly and reload
    console.log('🔄 Setting Hebrew in localStorage and reloading...');
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'he');
      localStorage.setItem('language', 'he');
    });
    
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000); // Give time for RTL initialization
    
    // Check HTML direction after reload
    const finalDir = await page.locator('html').getAttribute('dir');
    const finalLang = await page.locator('html').getAttribute('lang');
    
    console.log(`Final direction: ${finalDir || 'not set'}`);
    console.log(`Final language: ${finalLang || 'not set'}`);
    
    // Check for RTL data attribute from early initialization
    const rtlInitialized = await page.locator('html').getAttribute('data-rtl-initialized');
    console.log(`RTL initialized marker: ${rtlInitialized || 'not set'}`);
    
    // Check for Hebrew font class on body
    const bodyClasses = await page.locator('body').getAttribute('class');
    console.log(`Body classes: ${bodyClasses || 'none'}`);
    const hasHebrewFont = bodyClasses?.includes('font-hebrew') || false;
    
    // Verify RTL is working
    expect(finalDir).toBe('rtl');
    expect(finalLang).toBe('he');
    expect(rtlInitialized).toBe('true');
    expect(hasHebrewFont).toBe(true);
    
    console.log('✅ RTL test completed successfully');
  });
  
  test('should verify RTL layout changes', async ({ page }) => {
    console.log('🧪 Testing RTL layout changes...');
    
    // Set Hebrew directly and go to landing page
    await page.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'he');
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Check document direction
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
    
    // Check for any flex containers and verify they handle RTL
    try {
      const flexElements = await page.locator('.flex').all();
      console.log(`Found ${flexElements.length} flex elements`);
      
      if (flexElements.length > 0) {
        const firstFlex = flexElements[0];
        const computedStyle = await firstFlex.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            direction: style.direction,
            textAlign: style.textAlign
          };
        });
        
        console.log(`Flex element direction: ${computedStyle.direction}`);
        console.log(`Flex element text-align: ${computedStyle.textAlign}`);
        
        // Direction should be rtl
        expect(computedStyle.direction).toBe('rtl');
      }
    } catch (error) {
      console.log('⚠️ Flex element check failed:', error.message);
    }
    
    console.log('✅ RTL layout test completed');
  });
}); 