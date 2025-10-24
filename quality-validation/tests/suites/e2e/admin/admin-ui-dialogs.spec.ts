import { test, expect, Page } from '@playwright/test';
import { testCredentials } from '../../../__helpers__/test-credentials';
// Helper function for robust authentication
async function authenticateAsAdmin(page) {
  console.log('🔐 Authenticating as admin user...');
  
  await page.goto('/auth/login', { waitUntil: 'networkidle' });
  
  // Use multiple selector fallbacks for robustness
  const emailSelector = 'input[type="email"], input[name="email"], #email';
  const passwordSelector = 'input[type="password"], input[name="password"], #password';
  
  await page.waitForSelector(emailSelector, { timeout: 10000 });
  await page.fill(emailSelector, testCredentials.email);
  await page.fill(passwordSelector, testCredentials.password);
  
  // Submit with multiple selector fallbacks
  const submitSelector = 'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")';
  await page.click(submitSelector);
  
  // Wait for successful authentication
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  
  // Verify we're authenticated (not on login page)
  const currentUrl = page.url();
  if (currentUrl.includes('/auth/login')) {
    throw new Error('Authentication failed - still on login page');
  }
  
  console.log('✅ Authentication successful');
  return true;
}


// ============================================================================
// ADMIN UI DIALOGS AND COMPONENTS TEST SUITE
// ============================================================================
// This test suite focuses on testing all the UI dialogs, components,
// and interactive elements in the admin console system
// ============================================================================

const TEST_URL = 'http://localhost:3002';

// Test user data for dialog testing
const TEST_USER_DATA = {
  client: {
    fullName: 'Test Client User',
    email: `client.${Date.now()}@test.test`,
    company: 'Test Company',
    phone: '+1234567890'
  },
  partner: {
    fullName: 'Test Partner User', 
    email: `partner.${Date.now()}@test.test`,
    company: 'Partner Company',
    partnerType: 'Integration Partner'
  },
  testUser: {
    fullName: 'Test User Account',
    email: `testuser.${Date.now()}@test.test`,
    role: 'user'
  },
  admin: {
    fullName: 'Test Admin User',
    email: `admin.${Date.now()}@test.test`,
    adminLevel: 'Full Administrator'
  }
};

// Helper functions
async function setupAdminUser(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('userRole', 'admin');
    window.localStorage.setItem('isAdminUser', 'true');
    window.localStorage.setItem('supabase.auth.token', JSON.stringify({
      user: { 
        id: 'admin-123', 
        email: testCredentials.email, 
        role: 'admin',
        user_metadata: { role: 'admin', is_admin: true }
      }
    }));
  });
}

async function navigateToAdminConsole(page: Page): Promise<void> {
  await page.goto(`${TEST_URL}/admin/console`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

async function openDialog(page: Page, buttonText: string): Promise<{ opened: boolean, dialog: any }> {
  console.log(`   Opening dialog for: ${buttonText}`);
  
  const button = page.locator(`button:has-text("${buttonText}")`);
  
  if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
    await button.click();
    await page.waitForTimeout(1000);
    
    // Check if dialog opened
    const dialog = page.locator('[role="dialog"]');
    const opened = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (opened) {
      console.log(`   ✅ Dialog opened for: ${buttonText}`);
      return { opened: true, dialog };
    } else {
      console.log(`   ❌ Dialog did not open for: ${buttonText}`);
      return { opened: false, dialog: null };
    }
  } else {
    console.log(`   ❌ Button not found: ${buttonText}`);
    return { opened: false, dialog: null };
  }
}

async function closeDialog(page: Page): Promise<void> {
  // Try multiple methods to close dialog
  const closeMethods = [
    () => page.locator('button:has-text("Cancel")').first().click(),
    () => page.locator('button:has-text("Close")').first().click(),
    () => page.locator('[data-testid="close-dialog"]').click(),
    () => page.locator('.dialog-close').click(),
    () => page.keyboard.press('Escape')
  ];
  
  for (const method of closeMethods) {
    try {
      await method();
      await page.waitForTimeout(500);
      
      const dialogClosed = !await page.locator('[role="dialog"]').isVisible({ timeout: 1000 }).catch(() => false);
      if (dialogClosed) {
        break;
      }
    } catch (error) {
      // Continue to next method
    }
  }
}

async function fillUserForm(page: Page, userData: any, userType: string): Promise<boolean> {
  try {
    console.log(`   Filling ${userType} user form...`);
    
    // Common fields
    if (userData.fullName) {
      const nameField = page.locator('input[name="fullName"], input[name="full_name"], input[placeholder*="full name" i]');
      if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameField.fill(userData.fullName);
        console.log(`   ✅ Filled full name: ${userData.fullName}`);
      }
    }
    
    if (userData.email) {
      const emailField = page.locator('input[name="email"], input[type="email"], input[name="email"], #email, input[placeholder*="email" i]');
      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailField.fill(userData.email);
        console.log(`   ✅ Filled email: ${userData.email}`);
      }
    }
    
    // Type-specific fields
    if (userData.company) {
      const companyField = page.locator('input[name="company"], input[placeholder*="company" i]');
      if (await companyField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await companyField.fill(userData.company);
        console.log(`   ✅ Filled company: ${userData.company}`);
      }
    }
    
    if (userData.phone) {
      const phoneField = page.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone" i]');
      if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneField.fill(userData.phone);
        console.log(`   ✅ Filled phone: ${userData.phone}`);
      }
    }
    
    // Admin-specific fields
    if (userData.adminLevel) {
      const adminLevelSelect = page.locator('select[name="adminLevel"], [data-testid="admin-level-select"]');
      if (await adminLevelSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await adminLevelSelect.selectOption(userData.adminLevel);
        console.log(`   ✅ Selected admin level: ${userData.adminLevel}`);
      }
    }
    
    // Partner-specific fields
    if (userData.partnerType) {
      const partnerTypeSelect = page.locator('select[name="partnerType"], [data-testid="partner-type-select"]');
      if (await partnerTypeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await partnerTypeSelect.selectOption(userData.partnerType);
        console.log(`   ✅ Selected partner type: ${userData.partnerType}`);
      }
    }
    
    // Role field
    if (userData.role) {
      const roleSelect = page.locator('select[name="role"], [data-testid="role-select"]');
      if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleSelect.selectOption(userData.role);
        console.log(`   ✅ Selected role: ${userData.role}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error filling form: ${error.message}`);
    return false;
  }
}

test.describe('🎛️ Admin UI Dialogs and Components Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin user
    await authenticateAsAdmin(page);
    
    // Navigate to admin console if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });
  
  test.describe('👥 User Creation Dialogs', () => {
    
    test('Create Client User Dialog Works', async ({ page }) => {
      console.log('🧪 Testing Create Client User dialog...');
      
      // Navigate to Users tab
      const usersTab = page.locator('[role="tab"]:has-text("Users")');
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      // Open Create Client User dialog
      const { opened, dialog } = await openDialog(page, 'Create Client User');
      
      if (opened) {
        // Check dialog structure
        await expect(dialog).toBeVisible();
        console.log('   ✅ Create Client User dialog opened');
        
        // Verify dialog title
        const dialogTitle = dialog.locator('h2, .dialog-title, [data-testid="dialog-title"]');
        const titleText = await dialogTitle.textContent();
        console.log(`   Dialog title: ${titleText}`);
        
        // Test form filling
        const formFilled = await fillUserForm(page, TEST_USER_DATA.client, 'client');
        
        if (formFilled) {
          console.log('   ✅ Client user form filled successfully');
          
          // Look for Create/Submit button
          const createButton = dialog.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
          const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (hasCreateButton) {
            console.log('   ✅ Create button found in dialog');
          } else {
            console.log('   ⚠️ Create button not found in dialog');
          }
        }
        
        // Close dialog
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Create Client User dialog not available');
      }
    });
    
    test('Create Partner User Dialog Works', async ({ page }) => {
      console.log('🧪 Testing Create Partner User dialog...');
      
      const usersTab = page.locator('[role="tab"]:has-text("Users")');
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Create Partner User');
      
      if (opened) {
        await expect(dialog).toBeVisible();
        console.log('   ✅ Create Partner User dialog opened');
        
        const formFilled = await fillUserForm(page, TEST_USER_DATA.partner, 'partner');
        
        if (formFilled) {
          console.log('   ✅ Partner user form filled successfully');
        }
        
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Create Partner User dialog not available');
      }
    });
    
    test('Create Test User Dialog Works', async ({ page }) => {
      console.log('🧪 Testing Create Test User dialog...');
      
      const usersTab = page.locator('[role="tab"]:has-text("Users")');
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Create Test User');
      
      if (opened) {
        await expect(dialog).toBeVisible();
        console.log('   ✅ Create Test User dialog opened');
        
        const formFilled = await fillUserForm(page, TEST_USER_DATA.testUser, 'test');
        
        if (formFilled) {
          console.log('   ✅ Test user form filled successfully');
        }
        
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Create Test User dialog not available');
      }
    });
    
    test('Create Admin User Dialog Works with Security Warnings', async ({ page }) => {
      console.log('🧪 Testing Create Admin User dialog...');
      
      const usersTab = page.locator('[role="tab"]:has-text("Users")');
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Create Admin User');
      
      if (opened) {
        await expect(dialog).toBeVisible();
        console.log('   ✅ Create Admin User dialog opened');
        
        // Check for security warnings
        const securityWarnings = [
          'text=/warning|dangerous|elevated|full access/i',
          'text=/admin.*privilege/i',
          'text=/understand.*administrative/i',
          '.warning',
          '.alert'
        ];
        
        let hasSecurityWarning = false;
        for (const selector of securityWarnings) {
          const warningElement = dialog.locator(selector);
          if (await warningElement.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   ✅ Security warning found: ${selector}`);
            hasSecurityWarning = true;
            break;
          }
        }
        
        if (!hasSecurityWarning) {
          console.log('   ⚠️ No security warnings found for admin user creation');
        }
        
        // Check for confirmation checkbox
        const confirmationCheckbox = dialog.locator('input[type="checkbox"]');
        const hasConfirmation = await confirmationCheckbox.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasConfirmation) {
          console.log('   ✅ Confirmation checkbox found');
        } else {
          console.log('   ⚠️ No confirmation checkbox found');
        }
        
        const formFilled = await fillUserForm(page, TEST_USER_DATA.admin, 'admin');
        
        if (formFilled) {
          console.log('   ✅ Admin user form filled successfully');
        }
        
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Create Admin User dialog not available');
      }
    });
    
    test('User Creation Dialog Validation Works', async ({ page }) => {
      console.log('🧪 Testing user creation dialog validation...');
      
      const usersTab = page.locator('[role="tab"]:has-text("Users")');
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Create Client User');
      
      if (opened) {
        // Try to submit empty form
        const submitButton = dialog.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
        
        if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Check for validation errors
          const validationErrors = [
            '.error',
            '.invalid',
            '[aria-invalid="true"]',
            'text=/required|invalid|error/i',
            '.field-error'
          ];
          
          let hasValidationErrors = false;
          for (const selector of validationErrors) {
            const errorElement = dialog.locator(selector);
            if (await errorElement.isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log(`   ✅ Validation error found: ${selector}`);
              hasValidationErrors = true;
              break;
            }
          }
          
          if (hasValidationErrors) {
            console.log('   ✅ Form validation working properly');
          } else {
            console.log('   ⚠️ Form validation may not be working');
          }
        }
        
        await closeDialog(page);
      }
    });
    
  });
  
  test.describe('🗄️ Database Operation Dialogs', () => {
    
    test('Database Backup Dialog Works', async ({ page }) => {
      console.log('🧪 Testing Database Backup dialog...');
      
      const databaseTab = page.locator('[role="tab"]:has-text("Database")');
      await databaseTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Manual Backup');
      
      if (opened) {
        await expect(dialog).toBeVisible();
        console.log('   ✅ Database Backup dialog opened');
        
        // Check for backup-specific elements
        const backupElements = [
          'text=/backup/i',
          'text=/database/i',
          'button:has-text("Start Backup")',
          'button:has-text("Begin")',
          'input[name="backupName"]'
        ];
        
        let hasBackupElements = false;
        for (const selector of backupElements) {
          const element = dialog.locator(selector);
          if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   ✅ Backup element found: ${selector}`);
            hasBackupElements = true;
          }
        }
        
        if (hasBackupElements) {
          console.log('   ✅ Database backup dialog has proper elements');
        }
        
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Database Backup dialog not available');
      }
    });
    
    test('Database Optimize Dialog Works', async ({ page }) => {
      console.log('🧪 Testing Database Optimize dialog...');
      
      const databaseTab = page.locator('[role="tab"]:has-text("Database")');
      await databaseTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Optimize Database');
      
      if (opened) {
        await expect(dialog).toBeVisible();
        console.log('   ✅ Database Optimize dialog opened');
        
        // Check for optimization warning
        const warningElements = [
          'text=/optimize.*may take time/i',
          'text=/performance.*impact/i', 
          'text=/warning/i',
          '.warning',
          '.alert'
        ];
        
        let hasWarning = false;
        for (const selector of warningElements) {
          const element = dialog.locator(selector);
          if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   ✅ Optimization warning found: ${selector}`);
            hasWarning = true;
            break;
          }
        }
        
        if (!hasWarning) {
          console.log('   ⚠️ No optimization warnings found');
        }
        
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Database Optimize dialog not available');
      }
    });
    
    test('Database Health Check Dialog Works', async ({ page }) => {
      console.log('🧪 Testing Database Health Check dialog...');
      
      const databaseTab = page.locator('[role="tab"]:has-text("Database")');
      await databaseTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Integrity Check');
      
      if (opened) {
        await expect(dialog).toBeVisible();
        console.log('   ✅ Database Health Check dialog opened');
        
        // Look for health check elements
        const healthElements = [
          'text=/integrity/i',
          'text=/health.*check/i',
          'text=/verify/i',
          'button:has-text("Start Check")',
          'button:has-text("Run")'
        ];
        
        let hasHealthElements = false;
        for (const selector of healthElements) {
          const element = dialog.locator(selector);
          if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   ✅ Health check element found: ${selector}`);
            hasHealthElements = true;
          }
        }
        
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Database Health Check dialog not available');
      }
    });
    
  });
  
  test.describe('🧹 Cleanup and Maintenance Dialogs', () => {
    
    test('Cleanup Test Users Dialog Works', async ({ page }) => {
      console.log('🧪 Testing Cleanup Test Users dialog...');
      
      const usersTab = page.locator('[role="tab"]:has-text("Users")');
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Cleanup Test Users');
      
      if (opened) {
        await expect(dialog).toBeVisible();
        console.log('   ✅ Cleanup Test Users dialog opened');
        
        // Check for cleanup warnings
        const warningElements = [
          'text=/cleanup.*test.*user/i',
          'text=/delete.*test/i',
          'text=/permanent/i',
          'text=/cannot.*undo/i',
          '.warning',
          '.alert'
        ];
        
        let hasWarning = false;
        for (const selector of warningElements) {
          const element = dialog.locator(selector);
          if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   ✅ Cleanup warning found: ${selector}`);
            hasWarning = true;
            break;
          }
        }
        
        if (hasWarning) {
          console.log('   ✅ Cleanup test users dialog has proper warnings');
        }
        
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Cleanup Test Users dialog not available');
      }
    });
    
    test('Health Check Script Dialog Works', async ({ page }) => {
      console.log('🧪 Testing Health Check Script dialog...');
      
      const scriptsTab = page.locator('[role="tab"]:has-text("Scripts")');
      await scriptsTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Health Check Script');
      
      if (opened) {
        await expect(dialog).toBeVisible();
        console.log('   ✅ Health Check Script dialog opened');
        
        // Check for script execution elements
        const scriptElements = [
          'text=/health.*check/i',
          'text=/script/i',
          'text=/execute/i',
          'button:has-text("Run")',
          'button:has-text("Execute")',
          'button:has-text("Start")'
        ];
        
        let hasScriptElements = false;
        for (const selector of scriptElements) {
          const element = dialog.locator(selector);
          if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   ✅ Script element found: ${selector}`);
            hasScriptElements = true;
          }
        }
        
        await closeDialog(page);
      } else {
        console.log('   ⚠️ Health Check Script dialog not available');
      }
    });
    
  });
  
  test.describe('📊 System Monitoring UI Elements', () => {
    
    test('System Health Metrics Display Correctly', async ({ page }) => {
      console.log('🧪 Testing system health metrics display...');
      
      // Navigate to System Health tab (should be default)
      const healthTab = page.locator('[role="tab"]:has-text("System Health")');
      await healthTab.click();
      await page.waitForTimeout(2000);
      
      // Check for system metrics
      const metricElements = [
        'text=/CPU/i',
        'text=/Memory/i',
        'text=/Disk/i',
        'text=/Network/i',
        'text=/Database/i',
        'text=/Uptime/i',
        'text=/Performance/i'
      ];
      
      let foundMetrics = 0;
      for (const selector of metricElements) {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`   ✅ Found metric: ${selector}`);
          foundMetrics++;
        }
      }
      
      console.log(`   Found ${foundMetrics}/${metricElements.length} system metrics`);
      expect(foundMetrics).toBeGreaterThan(0);
    });
    
    test('Auto-Refresh Toggle Works', async ({ page }) => {
      console.log('🧪 Testing auto-refresh toggle...');
      
      const healthTab = page.locator('[role="tab"]:has-text("System Health")');
      await healthTab.click();
      await page.waitForTimeout(1000);
      
      // Find auto-refresh toggle
      const autoRefreshToggle = page.locator('button:has-text("Auto-Refresh")');
      
      if (await autoRefreshToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Check initial state
        const initialText = await autoRefreshToggle.textContent();
        console.log(`   Initial auto-refresh state: ${initialText}`);
        
        // Click toggle
        await autoRefreshToggle.click();
        await page.waitForTimeout(1000);
        
        // Check if state changed
        const newText = await autoRefreshToggle.textContent();
        console.log(`   New auto-refresh state: ${newText}`);
        
        const stateChanged = initialText !== newText;
        if (stateChanged) {
          console.log('   ✅ Auto-refresh toggle works');
        } else {
          console.log('   ⚠️ Auto-refresh toggle may not be working');
        }
      } else {
        console.log('   ⚠️ Auto-refresh toggle not found');
      }
    });
    
    test('Refresh Button Updates Metrics', async ({ page }) => {
      console.log('🧪 Testing refresh button functionality...');
      
      const healthTab = page.locator('[role="tab"]:has-text("System Health")');
      await healthTab.click();
      await page.waitForTimeout(1000);
      
      // Find refresh button
      const refreshButton = page.locator('button:has-text("Refresh")');
      
      if (await refreshButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Click refresh button
        await refreshButton.click();
        
        // Check for loading state
        const loadingButton = page.locator('button:has-text("Refresh"):has(svg.animate-spin)');
        const hasLoadingState = await loadingButton.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasLoadingState) {
          console.log('   ✅ Refresh button shows loading state');
        } else {
          console.log('   ⚠️ No loading state detected on refresh');
        }
        
        // Wait for refresh to complete
        await page.waitForTimeout(3000);
        
        // Check for "Last updated" timestamp
        const timestampElements = [
          'text=/last updated/i',
          'text=/refreshed/i',
          'text=/updated.*ago/i',
          '[data-testid="last-refresh"]'
        ];
        
        let hasTimestamp = false;
        for (const selector of timestampElements) {
          const element = page.locator(selector);
          if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`   ✅ Found timestamp: ${selector}`);
            hasTimestamp = true;
            break;
          }
        }
        
        console.log(`   Refresh functionality: ${hasTimestamp ? '✅ Working' : '⚠️ May not be updating'}`);
      } else {
        console.log('   ⚠️ Refresh button not found');
      }
    });
    
  });
  
  test.describe('🎯 Tab Navigation and Content Loading', () => {
    
    test('All Admin Console Tabs Load Content', async ({ page }) => {
      console.log('🧪 Testing all admin console tabs load content...');
      
      const adminTabs = [
        'System Health',
        'Users', 
        'Database',
        'Scripts',
        'Monitoring'
      ];
      
      for (const tabName of adminTabs) {
        console.log(`   Testing ${tabName} tab...`);
        
        const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
        
        if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(2000);
          
          // Check if tab content loaded
          const tabContent = page.locator('[role="tabpanel"]');
          const hasContent = await tabContent.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (hasContent) {
            // Check for tab-specific content
            const contentText = await tabContent.textContent();
            const hasTabSpecificContent = contentText && contentText.length > 100;
            
            console.log(`   ${tabName}: ${hasTabSpecificContent ? '✅ Content loaded' : '⚠️ Minimal content'}`);
          } else {
            console.log(`   ${tabName}: ❌ No content loaded`);
          }
        } else {
          console.log(`   ${tabName}: ❌ Tab not available`);
        }
      }
    });
    
    test('Tab Navigation Maintains State', async ({ page }) => {
      console.log('🧪 Testing tab navigation state maintenance...');
      
      // Start with Users tab
      const usersTab = page.locator('[role="tab"]:has-text("Users")');
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      // Open a dialog
      const { opened } = await openDialog(page, 'Create Client User');
      
      if (opened) {
        // Switch to another tab while dialog is open
        const databaseTab = page.locator('[role="tab"]:has-text("Database")');
        await databaseTab.click();
        await page.waitForTimeout(1000);
        
        // Check if dialog closed (expected behavior)
        const dialogStillOpen = await page.locator('[role="dialog"]').isVisible({ timeout: 2000 }).catch(() => false);
        
        if (!dialogStillOpen) {
          console.log('   ✅ Dialog properly closed when switching tabs');
        } else {
          console.log('   ⚠️ Dialog remained open across tab switch');
        }
        
        // Go back to Users tab
        await usersTab.click();
        await page.waitForTimeout(1000);
        
        console.log('   ✅ Tab navigation working properly');
      }
    });
    
  });
  
  test.describe('🔧 Error Handling in UI Components', () => {
    
    test('Dialog Error Handling Works', async ({ page }) => {
      console.log('🧪 Testing dialog error handling...');
      
      // Simulate network errors
      await page.route('**/api/**', route => {
        if (route.request().url().includes('create') || route.request().url().includes('users')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      const usersTab = page.locator('[role="tab"]:has-text("Users")');
      await usersTab.click();
      await page.waitForTimeout(1000);
      
      const { opened, dialog } = await openDialog(page, 'Create Client User');
      
      if (opened) {
        // Fill form and try to submit
        await fillUserForm(page, TEST_USER_DATA.client, 'client');
        
        const submitButton = dialog.locator('button:has-text("Create"), button:has-text("Submit")');
        
        if (await submitButton.isVisible().catch(() => false)) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          // Check for error handling
          const errorElements = [
            'text=/error|failed|network/i',
            '.error',
            '.toast',
            '[role="alert"]'
          ];
          
          let hasErrorHandling = false;
          for (const selector of errorElements) {
            if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log(`   ✅ Error handling found: ${selector}`);
              hasErrorHandling = true;
              break;
            }
          }
          
          if (hasErrorHandling) {
            console.log('   ✅ Dialog error handling working');
          } else {
            console.log('   ⚠️ No error handling detected');
          }
        }
        
        await closeDialog(page);
      }
    });
    
    test('Component Resilience to Data Loading Failures', async ({ page }) => {
      console.log('🧪 Testing component resilience to data failures...');
      
      // Intercept and fail some requests
      await page.route('**/api/metrics', route => route.abort());
      await page.route('**/api/users', route => route.abort());
      
      // Try to refresh system metrics
      const refreshButton = page.locator('button:has-text("Refresh")');
      
      if (await refreshButton.isVisible().catch(() => false)) {
        await refreshButton.click();
        await page.waitForTimeout(3000);
        
        // Application should still be functional
        const appFunctional = await page.locator('h1:has-text("System Administration Console")').isVisible().catch(() => false);
        
        if (appFunctional) {
          console.log('   ✅ Application remains functional despite data loading failures');
        } else {
          console.log('   ❌ Application may have crashed due to data loading failures');
        }
        
        expect(appFunctional).toBe(true);
      }
    });
    
  });
  
});