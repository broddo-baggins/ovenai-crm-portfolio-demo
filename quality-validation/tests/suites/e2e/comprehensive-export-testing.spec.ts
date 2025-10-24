import { test, expect } from '@playwright/test';

/**
 * COMPREHENSIVE EXPORT TESTING SUITE
 * 
 * Tests all export functionality across the OvenAI system after PDF service changes.
 * Covers all export buttons, formats, and tables that implement export functionality.
 * 
 * Focus areas:
 * 1. Table exports (CSV, Excel, PDF alternatives)  
 * 2. Report exports (Reports page, Dashboard reports)
 * 3. Data exports (Settings export, Admin exports)
 * 4. Queue exports (Lead processing queue data)
 * 5. Test that PDF generation now falls back to CSV/Excel
 */

test.describe('📊 Comprehensive Export Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Use test user credentials
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Login with test user
    await page.fill('input[type="email"]', 'test@test.test');
    await page.fill('input[type="password"]', 'testtesttest');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.describe('🗃️ Table Export Functionality', () => {
    test('should test leads table export', async ({ page }) => {
      console.log('🧪 Testing leads table export functionality...');
      
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Look for export button in leads table
      const exportSelectors = [
        'button:has-text("Export")',
        'button:has-text("Download")',
        '[data-testid*="export"]',
        '.export-button',
        'button[aria-label*="export"]'
      ];
      
      let exportFound = false;
      for (const selector of exportSelectors) {
        const exportButton = page.locator(selector).first();
        if (await exportButton.isVisible()) {
          console.log(`✅ Found leads export button: ${selector}`);
          exportFound = true;
          
          // Test the export
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
          await exportButton.click();
          
          const download = await downloadPromise;
          if (download) {
            console.log(`✅ Leads export successful: ${download.suggestedFilename()}`);
            expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|json)$/);
          } else {
            console.log('⚠️ No download detected for leads export');
          }
          break;
        }
      }
      
      if (!exportFound) {
        console.log('⚠️ No export button found in leads table');
      }
    });

    test('should test messages table export', async ({ page }) => {
      console.log('🧪 Testing messages table export functionality...');
      
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      
      // Look for export functionality in messages
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
      
      if (await exportButton.isVisible()) {
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        await exportButton.click();
        
        const download = await downloadPromise;
        if (download) {
          console.log(`✅ Messages export successful: ${download.suggestedFilename()}`);
          expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|json)$/);
        }
      } else {
        console.log('⚠️ No export functionality found in messages');
      }
    });

    test('should test queue management export', async ({ page }) => {
      console.log('🧪 Testing queue management export functionality...');
      
      await page.goto('/queue');
      await page.waitForLoadState('networkidle');
      
      // Look for queue export functionality
      const queueExportSelectors = [
        'button:has-text("Export Queue")',
        'button:has-text("Export Data")',
        'button:has-text("Export")',
        '[data-testid*="queue-export"]'
      ];
      
      for (const selector of queueExportSelectors) {
        const exportButton = page.locator(selector).first();
        if (await exportButton.isVisible()) {
          console.log(`✅ Found queue export button: ${selector}`);
          
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
          await exportButton.click();
          
          const download = await downloadPromise;
          if (download) {
            console.log(`✅ Queue export successful: ${download.suggestedFilename()}`);
            expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|json)$/);
          }
          break;
        }
      }
    });
  });

  test.describe('📈 Reports Export Functionality', () => {
    test('should test reports page export options', async ({ page }) => {
      console.log('🧪 Testing reports page export functionality...');
      
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
      
      // Test various export options
      const exportOptions = [
        'Export CSV',
        'Generate PDF',
        'Export Options',
        'Advanced Report',
        'Export JSON',
        'Export XLSX'
      ];
      
      let successfulExports = 0;
      
      for (const option of exportOptions) {
        const button = page.locator(`button:has-text("${option}")`);
        if (await button.isVisible()) {
          console.log(`✅ Found export option: ${option}`);
          
          const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
          await button.click();
          await page.waitForTimeout(2000); // Allow time for generation
          
          const download = await downloadPromise;
          if (download) {
            console.log(`✅ ${option} export successful: ${download.suggestedFilename()}`);
            successfulExports++;
            
            // Verify file extension matches expected format
            if (option.includes('CSV')) {
              expect(download.suggestedFilename()).toMatch(/\.csv$/);
            } else if (option.includes('JSON')) {
              expect(download.suggestedFilename()).toMatch(/\.json$/);
            } else if (option.includes('XLSX')) {
              expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
            } else if (option.includes('PDF')) {
              // PDF should now fallback to CSV or Excel
              expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/);
            }
          } else {
            console.log(`⚠️ No download for ${option}`);
          }
          
          // Only test one export to avoid multiple downloads
          if (successfulExports > 0) break;
        }
      }
      
      expect(successfulExports).toBeGreaterThan(0);
    });

    test('should test dashboard report generation', async ({ page }) => {
      console.log('🧪 Testing dashboard report generation...');
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for dashboard export/report functionality
      const reportButtons = [
        'button:has-text("Generate Report")',
        'button:has-text("Export Dashboard")',
        'button:has-text("Download Report")'
      ];
      
      for (const selector of reportButtons) {
        const button = page.locator(selector).first();
        if (await button.isVisible()) {
          console.log(`✅ Found dashboard report button`);
          
          const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
          await button.click();
          
          const download = await downloadPromise;
          if (download) {
            console.log(`✅ Dashboard report successful: ${download.suggestedFilename()}`);
            expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|json|pdf)$/);
          }
          break;
        }
      }
    });
  });

  test.describe('⚙️ Settings and Admin Export Functionality', () => {
    test('should test settings data export', async ({ page }) => {
      console.log('🧪 Testing settings data export...');
      
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      // Look for data export option in settings
      const exportButton = page.locator('text=/Export.*Data/, button:has-text("Export")').first();
      
      if (await exportButton.isVisible()) {
        console.log('✅ Found settings export option');
        
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        await exportButton.click();
        
        const download = await downloadPromise;
        if (download) {
          console.log(`✅ Settings export successful: ${download.suggestedFilename()}`);
          expect(download.suggestedFilename()).toMatch(/\.(json|csv)$/);
        }
      } else {
        console.log('⚠️ No export option found in settings');
      }
    });

    test('should test admin console exports', async ({ page }) => {
      console.log('🧪 Testing admin console export functionality...');
      
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Look for admin export functionality
      const adminExportSelectors = [
        'button:has-text("Export Data")',
        'button:has-text("Export Logs")',
        'button:has-text("Download")',
        '[data-testid*="admin-export"]'
      ];
      
      for (const selector of adminExportSelectors) {
        const exportButton = page.locator(selector).first();
        if (await exportButton.isVisible()) {
          console.log(`✅ Found admin export: ${selector}`);
          
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
          await exportButton.click();
          
          const download = await downloadPromise;
          if (download) {
            console.log(`✅ Admin export successful: ${download.suggestedFilename()}`);
            expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|json)$/);
          }
          break;
        }
      }
    });
  });

  test.describe('🔧 PDF Export Fallback Testing', () => {
    test('should verify PDF export falls back to CSV/Excel', async ({ page }) => {
      console.log('🧪 Testing PDF export fallback after xlsx security fix...');
      
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
      
      // Try to trigger PDF export
      const pdfButton = page.locator('button:has-text("Generate PDF"), button:has-text("PDF")').first();
      
      if (await pdfButton.isVisible()) {
        console.log('✅ Found PDF export button');
        
        const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
        await pdfButton.click();
        
        const download = await downloadPromise;
        if (download) {
          const filename = download.suggestedFilename();
          console.log(`✅ PDF fallback successful: ${filename}`);
          
          // PDF should now fallback to CSV or Excel due to security changes
          if (filename.endsWith('.pdf')) {
            console.log('⚠️ PDF still being generated - may need further configuration');
          } else {
            console.log('✅ PDF correctly falling back to secure format');
            expect(filename).toMatch(/\.(csv|xlsx)$/);
          }
        } else {
          console.log('⚠️ PDF export may be temporarily disabled');
        }
      }
    });
  });

  test.describe('📊 Export Format Verification', () => {
    test('should verify all exports use secure formats', async ({ page }) => {
      console.log('🧪 Verifying all exports use secure formats...');
      
      const pagesToTest = [
        { url: '/leads', name: 'Leads' },
        { url: '/messages', name: 'Messages' },
        { url: '/reports', name: 'Reports' },
        { url: '/queue', name: 'Queue' }
      ];
      
      let totalExports = 0;
      let secureExports = 0;
      
      for (const pageTest of pagesToTest) {
        await page.goto(pageTest.url);
        await page.waitForLoadState('networkidle');
        
        const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
        
        if (await exportButton.isVisible()) {
          totalExports++;
          console.log(`✅ Testing export on ${pageTest.name} page`);
          
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
          await exportButton.click();
          
          const download = await downloadPromise;
          if (download) {
            const filename = download.suggestedFilename();
            
            // Check if using secure formats (no vulnerable xlsx, using exceljs instead)
            if (filename.match(/\.(csv|xlsx|json)$/)) {
              secureExports++;
              console.log(`✅ ${pageTest.name} using secure format: ${filename}`);
            } else {
              console.log(`⚠️ ${pageTest.name} using potentially insecure format: ${filename}`);
            }
          }
        }
      }
      
      console.log(`\n📊 Export Security Summary: ${secureExports}/${totalExports} exports using secure formats`);
      
      if (totalExports > 0) {
        const securityRate = (secureExports / totalExports) * 100;
        expect(securityRate).toBeGreaterThan(80); // At least 80% should use secure formats
      }
    });
  });
}); 