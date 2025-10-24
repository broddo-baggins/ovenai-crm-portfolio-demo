#!/usr/bin/env node

const { chromium } = require('@playwright/test');

/**
 * Dashboard TestID Discovery Script
 * Logs into the app and discovers all available testids on the dashboard
 */

async function discoverDashboardTestIds() {
  console.log('🔍 Discovering Dashboard TestIDs...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to login
    console.log('🔐 Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login');
    
    // Step 2: Login
    console.log('🔐 Logging in...');
    await page.fill('[data-testid="email-input"]', 'test@test.test');
    await page.fill('[data-testid="password-input"]', 'testtesttest');
    await page.click('[data-testid="login-button"]');
    
    // Step 3: Wait for dashboard
    console.log('⏳ Waiting for dashboard...');
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    
    // Step 4: Discover all testids
    console.log('🔍 Discovering all testids on dashboard...');
    const testIds = await page.evaluate(() => {
      const elementsWithTestId = document.querySelectorAll('[data-testid]');
      const testIds = [];
      
      elementsWithTestId.forEach(element => {
        const testId = element.getAttribute('data-testid');
        const tagName = element.tagName.toLowerCase();
        const textContent = element.textContent?.trim().substring(0, 50) || '';
        const className = element.className || '';
        
        testIds.push({
          testId,
          tagName,
          textContent,
          className,
          isVisible: element.offsetParent !== null
        });
      });
      
      return testIds;
    });
    
    // Step 5: Display results
    console.log('\n📊 Dashboard TestIDs Found:');
    console.log('=' .repeat(80));
    
    testIds
      .filter(item => item.isVisible)
      .sort((a, b) => a.testId.localeCompare(b.testId))
      .forEach(item => {
        console.log(`✅ [data-testid="${item.testId}"]`);
        console.log(`   Tag: ${item.tagName}`);
        console.log(`   Text: ${item.textContent}`);
        console.log(`   Class: ${item.className}`);
        console.log('');
      });
    
    // Step 6: Look for specific patterns
    console.log('🎯 Looking for specific patterns...');
    const patterns = ['lead', 'conversion', 'overview', 'metric', 'stat', 'card', 'dashboard'];
    
    patterns.forEach(pattern => {
      const matches = testIds.filter(item => 
        item.testId.toLowerCase().includes(pattern) && item.isVisible
      );
      
      if (matches.length > 0) {
        console.log(`\n🔍 Pattern "${pattern}" found in:`);
        matches.forEach(match => {
          console.log(`   • [data-testid="${match.testId}"] - ${match.textContent}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error discovering testids:', error);
  } finally {
    await browser.close();
  }
}

discoverDashboardTestIds().catch(console.error); 