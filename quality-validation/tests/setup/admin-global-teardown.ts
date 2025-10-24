import { chromium, type FullConfig } from '@playwright/test';
import { testCredentials } from '../__helpers__/test-credentials';

/**
 * Global teardown for Admin System Tests
 * 
 * This teardown cleans up test users and data created during admin testing.
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up Admin System Test Environment...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the application
    const baseURL = config.projects[0]?.use?.baseURL || process.env.DETECTED_BASE_URL || 'http://localhost:3000';
    await page.goto(baseURL);

    console.log('🗑️ Cleaning up test users...');

    // Clean up test users (if admin deletion functionality exists)
    await cleanupTestUsers(page);

    console.log('📊 Generating test report summary...');
    
    // Generate admin test summary
    await generateTestSummary();

    console.log('✅ Admin system test cleanup complete!');

  } catch (error) {
    console.error('❌ Failed to cleanup admin test environment:', error);
    // Don't throw - cleanup failures shouldn't fail the entire test run
  } finally {
    await browser.close();
  }
}

/**
 * Clean up test users created during testing
 */
async function cleanupTestUsers(page: any) {
  const testUserEmails = [
    'system.admin@test.com',
    'company.admin@test.com',
    'regular.user@test.com'
  ];

  try {
    // Login as system admin to potentially delete test users
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testCredentials.email); // Use existing admin
    await page.fill('[data-testid="password-input"]', testCredentials.password);
    await page.click('[data-testid="login-button"]');
    
    // If admin user management exists, try to clean up test users
    try {
      await page.goto('/admin/console/users');
      
      for (const email of testUserEmails) {
        try {
          // Look for user in admin panel and delete if exists
          const userRow = page.locator(`tr:has-text("${email}")`);
          if (await userRow.isVisible()) {
            await userRow.locator('button:has-text("Delete")').click();
            await page.click('button:has-text("Confirm")');
            console.log(`🗑️ Deleted test user: ${email}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not delete test user ${email}:`, error);
        }
      }
    } catch (error) {
      console.warn('⚠️ User management interface not available for cleanup');
    }
    
  } catch (error) {
    console.warn('⚠️ Could not perform user cleanup:', error);
    // This is non-critical - test users can remain for future runs
  }
}

/**
 * Generate test summary report
 */
async function generateTestSummary() {
  try {
    const summaryData = {
      timestamp: new Date().toISOString(),
      testType: 'admin-system-comprehensive',
      environment: process.env.NODE_ENV || 'development',
      testUsers: [
        'system.admin@test.com (System Admin)',
        'company.admin@test.com (Company Admin)', 
        'regular.user@test.com (Regular User)'
      ],
      testAreas: [
        'System Admin Full Access',
        'Company Admin Limited Access',
        'Regular User No Admin Access',
        'Navigation & URL Access',
        'Mobile Admin Experience',
        'Error Handling',
        'Performance & Accessibility',
        'Session Management'
      ],
      reportFiles: [
        'playwright-report-admin/index.html',
        'test-results-admin/results.json',
        'test-results-admin/results.xml'
      ]
    };

    console.log('📋 Admin Test Summary:');
    console.log(`   Test Type: ${summaryData.testType}`);
    console.log(`   Timestamp: ${summaryData.timestamp}`);
    console.log(`   Environment: ${summaryData.environment}`);
    console.log(`   Test Users: ${summaryData.testUsers.length}`);
    console.log(`   Test Areas: ${summaryData.testAreas.length}`);
    console.log(`   Reports: ${summaryData.reportFiles.join(', ')}`);

  } catch (error) {
    console.warn('⚠️ Could not generate test summary:', error);
  }
}

export default globalTeardown; 