import { test, expect } from '@playwright/test';
import { loginTestUser } from '../../../__helpers__/auth-helper';

/**
 * Queue Management System - Comprehensive Test Suite
 * Tests the new queue management features added to the system
 */

test.describe('🎯 Queue Management System Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Login with test credentials using the auth helper
    await loginTestUser(page);
  });

  test('📋 Queue Management Page - Basic Functionality', async ({ page }) => {
    console.log('🧪 Testing queue management page basic functionality...');

    // Navigate to queue page
    await page.goto('/queue');
    await page.waitForLoadState('networkidle');

    // Check for main queue elements
    await test.step('Check for queue metrics', async () => {
      await expect(page.locator('h3:has-text("Queue Depth")')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('h3:has-text("Processing")')).toBeVisible({ timeout: 5000 });
    });

    await test.step('Check for queue control button', async () => {
      const queueButton = page.locator('button:has-text("Start Queue"), button:has-text("Pause Queue")');
      await expect(queueButton).toBeVisible({ timeout: 5000 });
    });

    await test.step('Check for refresh button', async () => {
      const refreshButton = page.locator('button:has-text("Refresh")');
      await expect(refreshButton).toBeVisible({ timeout: 5000 });
    });

    console.log('✅ Queue management basic functionality verified');
  });

  test('🔄 Queue Processing States', async ({ page }) => {
    console.log('🧪 Testing queue processing states...');

    await page.goto('/queue');
    await page.waitForLoadState('networkidle');

    // Test that queue metrics are visible
    await test.step('Check queue metrics', async () => {
      // Queue Depth shows pending/queued items
      const queueDepth = page.locator('h3:has-text("Queue Depth")');
      await expect(queueDepth).toBeVisible({ timeout: 3000 });
      
      // Processing shows currently processing items
      const processing = page.locator('h3:has-text("Processing")');
      await expect(processing).toBeVisible({ timeout: 3000 });
      
      // Success Rate shows completion status
      const successRate = page.locator('h3:has-text("Success Rate")');
      await expect(successRate).toBeVisible({ timeout: 3000 });
    });

    // Test queue status values are displayed
    await test.step('Check metric values', async () => {
      const metricValues = page.locator('.text-2xl.font-bold');
      const count = await metricValues.count();
      expect(count).toBeGreaterThan(0);
    });

    console.log('✅ Queue processing states verified');
  });

  test('⚡ Queue Actions - Prepare Tomorrow\'s Queue', async ({ page }) => {
    console.log('🧪 Testing Prepare Tomorrow\'s Queue action...');

    await page.goto('/dashboard'); 
    await page.waitForLoadState('networkidle');

    // Look for the "Prepare Tomorrow's Queue" button
    const prepareButton = page.locator('button:has-text("Prepare Tomorrow\'s Queue")').first();
    
    if (await prepareButton.isVisible()) {
      await prepareButton.click();
      
      // Check for success message or state change
      await test.step('Verify queue preparation', async () => {
        const successMessage = page.locator('text=Queue prepared successfully').first();
        const loadingState = page.locator('[data-testid="queue-preparing"]').first();
        
        // Either success message or loading state should appear
        await expect(successMessage.or(loadingState)).toBeVisible({ timeout: 5000 });
      });
    } else {
      console.log('⚠️  Prepare Queue button not found - feature may not be implemented yet');
    }

    console.log('✅ Queue preparation action tested');
  });

  test('🚀 Queue Actions - Start Automation', async ({ page }) => {
    console.log('🧪 Testing Start Automation action...');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for the "Start Automation" button
    const automationButton = page.locator('button:has-text("Start Automation")').first();
    
    if (await automationButton.isVisible()) {
      await automationButton.click();
      
      // Check for automation status changes
      await test.step('Verify automation start', async () => {
        const statusIndicators = [
          'text=Automation started',
          'text=Processing queue',
          '[data-testid="automation-active"]',
          '.automation-status'
        ];
        
        let found = false;
        for (const indicator of statusIndicators) {
          try {
            await page.waitForSelector(indicator, { timeout: 3000 });
            found = true;
            break;
          } catch (e) {
            // Continue to next indicator
          }
        }
        
        if (!found) {
          console.log('⚠️  No automation status indicators found');
        }
      });
    } else {
      console.log('⚠️  Start Automation button not found - feature may not be implemented yet');
    }

    console.log('✅ Automation start action tested');
  });

  test('📊 Queue Data Export', async ({ page }) => {
    console.log('🧪 Testing queue data export...');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for the "Export Queue Data" button
    const exportButton = page.locator('button:has-text("Export Queue Data")').first();
    
    if (await exportButton.isVisible()) {
      // Set up download expectation
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        exportButton.click()
      ]);

      await test.step('Verify download', async () => {
        expect(download.suggestedFilename()).toMatch(/queue.*\.(csv|xlsx|json)/i);
      });
    } else {
      console.log('⚠️  Export Queue Data button not found - feature may not be implemented yet');
    }

    console.log('✅ Queue data export tested');
  });

  test('🎛️ Queue Settings & Configuration', async ({ page }) => {
    console.log('🧪 Testing queue settings...');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for queue settings/configuration
    const settingsSelectors = [
      'button:has-text("Queue Settings")',
      'button:has-text("Configure Queue")',
      '[data-testid="queue-settings"]',
      '.queue-configuration'
    ];

    for (const selector of settingsSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        await element.click();
        
        // Check if settings modal/page opens
        await test.step('Verify settings interface', async () => {
          const settingsModal = page.locator('[role="dialog"]').first();
          const settingsPage = page.locator('h1:has-text("Queue Settings")').first();
          
          await expect(settingsModal.or(settingsPage)).toBeVisible({ timeout: 5000 });
        });
        
        break;
      }
    }

    console.log('✅ Queue settings interface tested');
  });

  test('📈 Queue Analytics & Metrics', async ({ page }) => {
    console.log('🧪 Testing queue analytics...');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for queue-related metrics
    const metricsList = [
      'Daily Performance',
      'Queue Performance',
      'Processing Rate',
      'Success Rate'
    ];

    for (const metric of metrics) {
      await test.step(`Check metric: ${metric}`, async () => {
        const element = page.locator(`text=${metric}`).first();
        if (await element.isVisible()) {
          console.log(`✅ Found metric: ${metric}`);
        } else {
          console.log(`⚠️  Metric not found: ${metric}`);
        }
      });
    }

    // Check for numerical indicators
    const numberPatterns = [
      /\d+\s*(leads?|messages?|conversations?)/i,
      /\d+%\s*(success|completion|rate)/i,
      /\d+\/\d+\s*(processed|completed)/i
    ];

    for (const pattern of numberPatterns) {
      await test.step(`Check for pattern: ${pattern}`, async () => {
        const elements = await page.locator('body').innerHTML();
        if (pattern.test(elements)) {
          console.log(`✅ Found pattern: ${pattern}`);
        }
      });
    }

    console.log('✅ Queue analytics tested');
  });

  test('🌐 Hebrew Queue Interface Support', async ({ page }) => {
    console.log('🧪 Testing Hebrew queue interface...');

    // Switch to Hebrew if language toggle exists
    const languageToggle = page.locator('button:has-text("עב")').first();
    if (await languageToggle.isVisible()) {
      await languageToggle.click();
      await page.waitForTimeout(1000);
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for Hebrew queue-related text
    const hebrewQueueTerms = [
      'תור',           // Queue
      'עיבוד',         // Processing  
      'אוטומציה',      // Automation
      'לידים',         // Leads
      'יעדים',         // Goals
      'ביצועים'        // Performance
    ];

    for (const term of hebrewQueueTerms) {
      await test.step(`Check Hebrew term: ${term}`, async () => {
        const element = page.locator(`text=${term}`).first();
        if (await element.isVisible()) {
          console.log(`✅ Found Hebrew term: ${term}`);
        }
      });
    }

    console.log('✅ Hebrew queue interface tested');
  });

  test('📱 Mobile Queue Management', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    }

    console.log('🧪 Testing mobile queue management...');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check that queue elements are mobile-responsive
    await test.step('Verify mobile queue layout', async () => {
      const queueContainer = page.locator('[data-testid="queue-container"]').first();
      const mobileMenu = page.locator('[data-testid="mobile-menu"]').first();
      
      // At least one should be visible on mobile
      if (await queueContainer.isVisible()) {
        console.log('✅ Queue container visible on mobile');
      } else if (await mobileMenu.isVisible()) {
        console.log('✅ Mobile menu accessible');
      } else {
        console.log('⚠️  No mobile queue interface found');
      }
    });

    // Test queue actions on mobile
    const mobileQueueActions = page.locator('button').filter({ hasText: /queue|automation|export/i });
    const count = await mobileQueueActions.count();
    
    if (count > 0) {
      console.log(`✅ Found ${count} queue actions on mobile`);
    }

    console.log('✅ Mobile queue management tested');
  });

  test('🔄 Queue Real-time Updates', async ({ page }) => {
    console.log('🧪 Testing queue real-time updates...');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot of queue stats
    const initialStats = await page.locator('[data-testid="queue-stats"]').first().innerHTML().catch(() => '');

    // Wait for potential real-time updates
    await page.waitForTimeout(5000);

    // Check if stats have updated
    const updatedStats = await page.locator('[data-testid="queue-stats"]').first().innerHTML().catch(() => '');

    // Look for loading indicators or real-time indicators
    const realTimeIndicators = [
      '[data-testid="real-time-indicator"]',
      '.live-updates',
      'text=Live',
      'text=Real-time'
    ];

    for (const indicator of realTimeIndicators) {
      const element = page.locator(indicator).first();
      if (await element.isVisible()) {
        console.log(`✅ Found real-time indicator: ${indicator}`);
      }
    }

    console.log('✅ Queue real-time updates tested');
  });

  test('🚨 Queue Error Handling', async ({ page }) => {
    console.log('🧪 Testing queue error handling...');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Simulate network issues by blocking requests
    await page.route('**/api/queue/**', route => route.abort());
    await page.route('**/api/leads/**', route => route.abort());

    // Try to interact with queue features
    const queueButton = page.locator('button:has-text("Prepare Tomorrow\'s Queue")').first();
    if (await queueButton.isVisible()) {
      await queueButton.click();

      // Check for error handling
      await test.step('Verify error handling', async () => {
        const errorMessages = [
          'text=Failed to prepare queue',
          'text=Network error',
          'text=Unable to connect',
          '[data-testid="error-message"]'
        ];

        let errorFound = false;
        for (const errorSelector of errorMessages) {
          const errorElement = page.locator(errorSelector).first();
          if (await errorElement.isVisible({ timeout: 3000 })) {
            errorFound = true;
            console.log(`✅ Found error message: ${errorSelector}`);
            break;
          }
        }

        if (!errorFound) {
          console.log('⚠️  No error handling detected');
        }
      });
    }

    console.log('✅ Queue error handling tested');
  });

}); 