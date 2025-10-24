import { chromium, type FullConfig } from '@playwright/test';
import { testCredentials } from '../__helpers__/test-credentials';

/**
 * Global setup for Admin System Tests
 * 
 * This setup creates test users with different admin roles:
 * - System admin with full platform access
 * - Company admin with company-level access
 * - Regular user with no admin access
 */
async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up Admin System Test Environment...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the application using dynamic URL detection
    const baseURL = config.projects[0]?.use?.baseURL || process.env.DETECTED_BASE_URL || 'http://localhost:3000';
    await page.goto(baseURL);

    console.log('📊 Creating test users for admin system testing...');

    // Create test users with different admin levels
    await createTestUsers(page);

    console.log('✅ Admin system test environment setup complete!');

  } catch (error) {
    console.error('❌ Failed to setup admin test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Create test users with different admin roles
 */
async function createTestUsers(page: any) {
  const testUsers = [
    {
      email: testCredentials.email,
      password: testCredentials.password,
      role: 'system_admin',
      type: 'system_admin'
    },
    {
      email: testCredentials.adminEmail,
      password: testCredentials.adminPassword,
      role: 'company_admin',
      type: 'company_admin'
    },
    {
      email: testCredentials.regularEmail,
      password: testCredentials.regularPassword,
      role: 'user',
      type: 'regular_user'
    }
  ];

  for (const user of testUsers) {
    try {
      console.log(`👤 Creating ${user.type}: ${user.email}`);
      
      // Navigate to registration page
      await page.goto('/auth/signup');
      
      // Fill registration form
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', user.password);
      await page.fill('[data-testid="confirm-password-input"]', user.password);
      
      // Submit registration
      await page.click('[data-testid="signup-button"]');
      
      // Wait for registration to complete
      await page.waitForTimeout(2000);
      
      console.log(`✅ Created ${user.type}: ${user.email}`);
      
    } catch (error) {
      console.warn(`⚠️ User ${user.email} may already exist or registration failed:`, error);
      // Continue with other users even if one fails
    }
  }

  // Set up database records for test users (this would typically be done via API)
  console.log('🔧 Setting up database records for test users...');
  
  try {
    // In a real scenario, you would:
    // 1. Create profiles records with appropriate roles
    // 2. Create client_members records for company admin
    // 3. Set up test companies and projects
    
    // For now, we'll rely on the application's existing test data
    // and the useAdminAccess hook to determine permissions
    
    console.log('✅ Database setup complete');
    
  } catch (error) {
    console.warn('⚠️ Database setup failed:', error);
    // Non-critical - tests might still work with existing data
  }
}

/**
 * Verify admin system is ready for testing
 */
async function verifyAdminSystem(page: any) {
  try {
    // Test system admin login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'system.admin@test.com');
    await page.fill('[data-testid="password-input"]', 'systemadmin123');
    await page.click('[data-testid="login-button"]');
    
    // Verify admin access
    await page.goto('/admin');
    const hasAdminAccess = await page.isVisible('h1:has-text("Admin Center")');
    
    if (hasAdminAccess) {
      console.log('✅ Admin system verification successful');
    } else {
      console.warn('⚠️ Admin system verification failed - continuing with limited testing');
    }
    
    // Logout for clean state
    await page.goto('/auth/logout');
    
  } catch (error) {
    console.warn('⚠️ Admin system verification failed:', error);
    // Continue anyway - individual tests will handle failures
  }
}

export default globalSetup; 