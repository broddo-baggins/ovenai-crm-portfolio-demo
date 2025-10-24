import { test, expect } from '@playwright/test';
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
  await page.fill(passwordSelector, process.env.TEST_USER_PASSWORD || testCredentials.password);
  
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


test.describe('Admin Console - User Creation Comprehensive E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as admin user
    await authenticateAsAdmin(page);
    
    // Navigate to admin console if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });

  test('Admin User Creation - Core Flow', async ({ page }) => {
    console.log('🔧 Testing admin user creation flow...');
    
    // Login first
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const emailSelector = 'input[type="email"], input[name="email"], [data-testid="email-input"]';
    const passwordSelector = 'input[type="password"], input[name="password"], [data-testid="password-input"]';
    
    await page.fill(emailSelector, testCredentials.email);
    await page.fill(passwordSelector, process.env.TEST_USER_PASSWORD || testCredentials.password);
    
    // Submit with multiple selector fallbacks
    const submitSelector = 'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")';
    await page.click(submitSelector);
    
    // Wait for successful authentication
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    
    // Navigate to admin console (if not already there)
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });

  test.describe('User Creation Flow - LTR Mode', () => {
    
    test('should complete full user creation workflow with client assignment', async ({ page }) => {
      // Navigate to user creation
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      // Step 1: Client Selection/Creation
      await expect(page.locator('h2')).toContainText('User Creation Wizard');
      await expect(page.locator('[data-testid="step-indicator-1"]')).toHaveClass(/active/);
      
      // Create new client
      await page.click('[data-testid="create-new-client"]');
      await page.fill('[data-testid="client-name"]', 'Test Client for E2E');
      await page.fill('[data-testid="client-description"]', 'E2E testing client');
      await page.fill('[data-testid="client-email"]', 'test@e2eclient.com');
      await page.click('[data-testid="save-client"]');
      
      // Wait for client to be created and selected
      await expect(page.locator('[data-testid="selected-client"]')).toContainText('Test Client for E2E');
      await page.click('[data-testid="next-step"]');
      
      // Step 2: Project Assignment
      await expect(page.locator('[data-testid="step-indicator-2"]')).toHaveClass(/active/);
      
      // Create new project
      await page.click('[data-testid="create-new-project"]');
      await page.fill('[data-testid="project-name"]', 'E2E Test Project');
      await page.fill('[data-testid="project-description"]', 'Project for E2E testing');
      await page.fill('[data-testid="project-budget"]', '10000');
      await page.click('[data-testid="save-project"]');
      
      // Select project
      await page.check('[data-testid="project-checkbox-e2e-test-project"]');
      await page.click('[data-testid="next-step"]');
      
      // Step 3: User Details
      await expect(page.locator('[data-testid="step-indicator-3"]')).toHaveClass(/active/);
      
      await page.fill('[data-testid="user-email"]', 'testuser@e2etest.com');
      await page.fill('[data-testid="user-full-name"]', 'Test User E2E');
      await page.fill('[data-testid="user-phone"]', '+1234567890');
      await page.selectOption('[data-testid="user-role"]', 'user');
      await page.click('[data-testid="next-step"]');
      
      // Step 4: Role Assignment
      await expect(page.locator('[data-testid="step-indicator-4"]')).toHaveClass(/active/);
      
      // Assign project manager role
      await page.selectOption('[data-testid="project-role"]', 'member');
      await page.check('[data-testid="permission-view-leads"]');
      await page.check('[data-testid="permission-edit-leads"]');
      await page.click('[data-testid="next-step"]');
      
      // Step 5: Confirmation
      await expect(page.locator('[data-testid="step-indicator-5"]')).toHaveClass(/active/);
      
      // Verify summary information
      await expect(page.locator('[data-testid="summary-email"]')).toContainText('testuser@e2etest.com');
      await expect(page.locator('[data-testid="summary-client"]')).toContainText('Test Client for E2E');
      await expect(page.locator('[data-testid="summary-project"]')).toContainText('E2E Test Project');
      await expect(page.locator('[data-testid="summary-role"]')).toContainText('user');
      
      // Create user
      await page.click('[data-testid="create-user-final"]');
      
      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User created successfully');
      
      // Verify user appears in user list
      await page.click('[data-testid="view-users-button"]');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('testuser@e2etest.com');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('Test User E2E');
    });

    test('should handle user creation errors gracefully', async ({ page }) => {
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      // Try to proceed without selecting client
      await page.click('[data-testid="next-step"]');
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Please select a client');
      
      // Select existing client
      await page.selectOption('[data-testid="client-select"]', 'existing-client-id');
      await page.click('[data-testid="next-step"]');
      
      // Skip project assignment
      await page.click('[data-testid="skip-projects"]');
      await page.click('[data-testid="next-step"]');
      
      // Try invalid email
      await page.fill('[data-testid="user-email"]', 'invalid-email');
      await page.click('[data-testid="next-step"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email');
      
      // Try duplicate email
      await page.fill('[data-testid="user-email"]', testCredentials.email);
      await page.click('[data-testid="next-step"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Email already exists');
      
      // Fix email and continue
      await page.fill('[data-testid="user-email"]', 'unique@test.com');
      await page.fill('[data-testid="user-full-name"]', 'Unique User');
      await page.click('[data-testid="next-step"]');
      
      // Complete role assignment
      await page.selectOption('[data-testid="default-role"]', 'viewer');
      await page.click('[data-testid="next-step"]');
      
      // Confirm creation
      await page.click('[data-testid="create-user-final"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User created successfully');
    });

    test('should validate required fields in user creation', async ({ page }) => {
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      // Select existing client
      await page.selectOption('[data-testid="client-select"]', 'existing-client-id');
      await page.click('[data-testid="next-step"]');
      
      // Skip projects
      await page.click('[data-testid="skip-projects"]');
      await page.click('[data-testid="next-step"]');
      
      // Try to proceed with empty fields
      await page.click('[data-testid="next-step"]');
      
      // Check validation errors
      await expect(page.locator('[data-testid="email-required"]')).toContainText('Email is required');
      await expect(page.locator('[data-testid="name-required"]')).toContainText('Full name is required');
      
      // Fill minimum required fields
      await page.fill('[data-testid="user-email"]', 'minimal@test.com');
      await page.fill('[data-testid="user-full-name"]', 'Minimal User');
      
      // Should be able to proceed
      await page.click('[data-testid="next-step"]');
      await expect(page.locator('[data-testid="step-indicator-4"]')).toHaveClass(/active/);
    });

    test('should support bulk user creation via CSV', async ({ page }) => {
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="bulk-import-button"]');
      
      // Upload CSV file
      const csvContent = `email,full_name,role,client_name,phone
bulk1@test.com,Bulk User 1,user,Test Client,+1111111111
bulk2@test.com,Bulk User 2,user,Test Client,+2222222222
bulk3@test.com,Bulk User 3,viewer,Test Client,+3333333333`;
      
      await page.setInputFiles('[data-testid="csv-upload"]', {
        name: 'bulk-users.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
      
      // Preview import
      await page.click('[data-testid="preview-import"]');
      
      // Verify preview shows correct data
      await expect(page.locator('[data-testid="preview-table"]')).toContainText('bulk1@test.com');
      await expect(page.locator('[data-testid="preview-table"]')).toContainText('Bulk User 1');
      await expect(page.locator('[data-testid="preview-count"]')).toContainText('3 users');
      
      // Proceed with import
      await page.click('[data-testid="proceed-import"]');
      
      // Wait for import to complete
      await expect(page.locator('[data-testid="import-success"]')).toContainText('3 users imported successfully');
      
      // Verify users appear in user list
      await page.click('[data-testid="view-users-button"]');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('bulk1@test.com');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('bulk2@test.com');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('bulk3@test.com');
    });
  });

  test.describe('User Creation Flow - RTL Mode', () => {
    
    test.beforeEach(async ({ page }) => {
    // Authenticate as admin user
    await authenticateAsAdmin(page);
    
    // Navigate to admin console if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });

    test('should complete user creation in RTL mode', async ({ page }) => {
      // Verify RTL layout
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      
      // Navigate to user creation - Hebrew interface
      await page.click('[data-testid="users-tab"]');
      await expect(page.locator('h2')).toContainText('ניהול משתמשים'); // Hebrew: User Management
      
      await page.click('[data-testid="new-user-button"]');
      await expect(page.locator('h2')).toContainText('אשף יצירת משתמש'); // Hebrew: User Creation Wizard
      
      // Step 1: Client Selection (RTL)
      await expect(page.locator('[data-testid="step-indicator-1"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="step-title"]')).toContainText('בחירת לקוח'); // Hebrew: Client Selection
      
      // Create new client in Hebrew
      await page.click('[data-testid="create-new-client"]');
      await page.fill('[data-testid="client-name"]', 'לקוח בדיקה RTL');
      await page.fill('[data-testid="client-description"]', 'תיאור לקוח לבדיקה');
      await page.fill('[data-testid="client-email"]', 'rtl@test.co.il');
      await page.click('[data-testid="save-client"]');
      
      // Verify RTL text alignment and direction
      await expect(page.locator('[data-testid="client-name"]')).toHaveCSS('text-align', 'right');
      await expect(page.locator('[data-testid="selected-client"]')).toContainText('לקוח בדיקה RTL');
      
      await page.click('[data-testid="next-step"]');
      
      // Step 2: Project Assignment (RTL)
      await expect(page.locator('[data-testid="step-title"]')).toContainText('הקצאת פרויקט'); // Hebrew: Project Assignment
      
      await page.click('[data-testid="create-new-project"]');
      await page.fill('[data-testid="project-name"]', 'פרויקט בדיקה RTL');
      await page.fill('[data-testid="project-description"]', 'תיאור פרויקט לבדיקה');
      await page.fill('[data-testid="project-budget"]', '50000');
      await page.click('[data-testid="save-project"]');
      
      await page.check('[data-testid="project-checkbox-rtl-test"]');
      await page.click('[data-testid="next-step"]');
      
      // Step 3: User Details (RTL)
      await expect(page.locator('[data-testid="step-title"]')).toContainText('פרטי משתמש'); // Hebrew: User Details
      
      await page.fill('[data-testid="user-email"]', 'משתמש@בדיקה.co.il');
      await page.fill('[data-testid="user-full-name"]', 'משתמש בדיקה RTL');
      await page.fill('[data-testid="user-phone"]', '+972-50-123-4567');
      await page.selectOption('[data-testid="user-role"]', 'user');
      
      // Verify RTL input alignment
      await expect(page.locator('[data-testid="user-full-name"]')).toHaveCSS('text-align', 'right');
      
      await page.click('[data-testid="next-step"]');
      
      // Step 4: Role Assignment (RTL)
      await expect(page.locator('[data-testid="step-title"]')).toContainText('הקצאת תפקיד'); // Hebrew: Role Assignment
      
      await page.selectOption('[data-testid="project-role"]', 'member');
      await page.check('[data-testid="permission-view-leads"]');
      await page.click('[data-testid="next-step"]');
      
      // Step 5: Confirmation (RTL)
      await expect(page.locator('[data-testid="step-title"]')).toContainText('אישור'); // Hebrew: Confirmation
      
      // Verify RTL summary layout
      await expect(page.locator('[data-testid="summary-panel"]')).toHaveCSS('text-align', 'right');
      await expect(page.locator('[data-testid="summary-email"]')).toContainText('משתמש@בדיקה.co.il');
      await expect(page.locator('[data-testid="summary-client"]')).toContainText('לקוח בדיקה RTL');
      
      // Create user
      await page.click('[data-testid="create-user-final"]');
      
      // Verify success message in Hebrew
      await expect(page.locator('[data-testid="success-message"]')).toContainText('המשתמש נוצר בהצלחה'); // Hebrew: User created successfully
      
      // Verify user appears in RTL user list
      await page.click('[data-testid="view-users-button"]');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('משתמש@בדיקה.co.il');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('משתמש בדיקה RTL');
      
      // Verify RTL table layout
      await expect(page.locator('[data-testid="user-table"]')).toHaveCSS('direction', 'rtl');
    });

    test('should handle RTL text input validation', async ({ page }) => {
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      // Select existing client and skip to user details
      await page.selectOption('[data-testid="client-select"]', 'existing-client-id');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="skip-projects"]');
      await page.click('[data-testid="next-step"]');
      
      // Test Hebrew text validation
      await page.fill('[data-testid="user-full-name"]', 'משתמש עם טקסט עברי ארוך מאוד שאמור לעבור בדיקה');
      await page.fill('[data-testid="user-email"]', 'hebrew@example.co.il');
      
      // Test mixed RTL/LTR content
      await page.fill('[data-testid="user-phone"]', '+972-54-משה-123');
      
      // Verify validation accepts Hebrew text
      await page.click('[data-testid="next-step"]');
      await expect(page.locator('[data-testid="step-indicator-4"]')).toHaveClass(/active/);
      
      // Test special Hebrew characters
      await page.click('[data-testid="previous-step"]');
      await page.fill('[data-testid="user-full-name"]', 'שם עם תווים מיוחדים: ״״״״');
      await page.click('[data-testid="next-step"]');
      
      // Should still proceed successfully
      await expect(page.locator('[data-testid="step-indicator-4"]')).toHaveClass(/active/);
    });

    test('should maintain RTL layout during navigation', async ({ page }) => {
      // Test navigation consistency in RTL
      await page.click('[data-testid="users-tab"]');
      await expect(page.locator('[data-testid="tab-container"]')).toHaveCSS('direction', 'rtl');
      
      await page.click('[data-testid="roles-tab"]');
      await expect(page.locator('[data-testid="tab-container"]')).toHaveCSS('direction', 'rtl');
      
      await page.click('[data-testid="settings-tab"]');
      await expect(page.locator('[data-testid="tab-container"]')).toHaveCSS('direction', 'rtl');
      
      // Test modal dialogs in RTL
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      await expect(page.locator('[data-testid="wizard-modal"]')).toHaveCSS('direction', 'rtl');
      await expect(page.locator('[data-testid="wizard-content"]')).toHaveCSS('text-align', 'right');
      
      // Test button alignment in RTL
      await expect(page.locator('[data-testid="next-step"]')).toHaveCSS('float', 'left');
      await expect(page.locator('[data-testid="previous-step"]')).toHaveCSS('float', 'right');
    });
  });

  test.describe('User Creation Integration Tests', () => {
    
    test('should integrate with password reset after user creation', async ({ page }) => {
      // Create user first
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      // Quick user creation flow
      await page.selectOption('[data-testid="client-select"]', 'existing-client-id');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="skip-projects"]');
      await page.click('[data-testid="next-step"]');
      
      await page.fill('[data-testid="user-email"]', 'resettest@test.com');
      await page.fill('[data-testid="user-full-name"]', 'Reset Test User');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="create-user-final"]');
      
      // Navigate to password reset
      await page.click('[data-testid="view-users-button"]');
      await page.click('[data-testid="user-row-resettest@test.com"] [data-testid="reset-password-button"]');
      
      // Test password reset for new user
      await page.selectOption('[data-testid="reset-method"]', 'temporary');
      await page.click('[data-testid="generate-password"]');
      
      await expect(page.locator('[data-testid="temporary-password"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-display"]')).toHaveValue(/^[A-Za-z0-9]{12}$/);
      
      await page.click('[data-testid="send-password"]');
      await expect(page.locator('[data-testid="reset-success"]')).toContainText('Password reset successful');
    });

    test('should track user creation in audit logs', async ({ page }) => {
      // Create user
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      await page.selectOption('[data-testid="client-select"]', 'existing-client-id');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="skip-projects"]');
      await page.click('[data-testid="next-step"]');
      
      await page.fill('[data-testid="user-email"]', 'audittest@test.com');
      await page.fill('[data-testid="user-full-name"]', 'Audit Test User');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="create-user-final"]');
      
      // Check audit logs
      await page.click('[data-testid="audit-tab"]');
      
      // Filter for recent user creation
      await page.selectOption('[data-testid="action-filter"]', 'INSERT');
      await page.selectOption('[data-testid="table-filter"]', 'profiles');
      await page.click('[data-testid="apply-filters"]');
      
      // Verify audit log entry
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText('audittest@test.com');
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText('INSERT');
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText(testCredentials.email); // Created by CEO
      
      // Click on audit entry for details
      await page.click('[data-testid="audit-entry-details"]');
      await expect(page.locator('[data-testid="audit-detail"]')).toContainText('Audit Test User');
      await expect(page.locator('[data-testid="audit-detail"]')).toContainText('profiles');
    });

    test('should sync user creation with client members table', async ({ page }) => {
      // Create user with specific client assignment
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      // Create new client for testing
      await page.click('[data-testid="create-new-client"]');
      await page.fill('[data-testid="client-name"]', 'Sync Test Client');
      await page.fill('[data-testid="client-description"]', 'Client for sync testing');
      await page.click('[data-testid="save-client"]');
      
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="skip-projects"]');
      await page.click('[data-testid="next-step"]');
      
      await page.fill('[data-testid="user-email"]', 'synctest@test.com');
      await page.fill('[data-testid="user-full-name"]', 'Sync Test User');
      await page.click('[data-testid="next-step"]');
      
      // Assign specific role
      await page.selectOption('[data-testid="default-role"]', 'manager');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="create-user-final"]');
      
      // Verify client membership
      await page.click('[data-testid="clients-tab"]');
      await page.click('[data-testid="client-row-sync-test"] [data-testid="view-members"]');
      
      await expect(page.locator('[data-testid="client-members"]')).toContainText('synctest@test.com');
      await expect(page.locator('[data-testid="client-members"]')).toContainText('Sync Test User');
      await expect(page.locator('[data-testid="client-members"]')).toContainText('manager');
    });
  });

  test.describe('Performance and Edge Cases', () => {
    
    test('should handle slow network gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      // Verify loading states
      await expect(page.locator('[data-testid="loading-clients"]')).toBeVisible();
      await page.waitForSelector('[data-testid="client-select"]', { timeout: 10000 });
      
      // Continue with user creation
      await page.selectOption('[data-testid="client-select"]', 'existing-client-id');
      await page.click('[data-testid="next-step"]');
      
      // Verify project loading
      await expect(page.locator('[data-testid="loading-projects"]')).toBeVisible();
      await page.waitForSelector('[data-testid="project-list"]', { timeout: 10000 });
    });

    test('should handle concurrent user creation attempts', async ({ page, context }) => {
      // Open multiple tabs for concurrent testing
      const page2 = await context.newPage();
      
      // Both pages navigate to user creation
      await Promise.all([
        page.click('[data-testid="users-tab"]'),
        page2.goto('/admin')
      ]);
      
      await page2.waitForSelector('[data-testid="admin-console"]');
      await page2.click('[data-testid="users-tab"]');
      
      await Promise.all([
        page.click('[data-testid="new-user-button"]'),
        page2.click('[data-testid="new-user-button"]')
      ]);
      
      // Both try to create users with same email
      const email = 'concurrent@test.com';
      
      await Promise.all([
        page.selectOption('[data-testid="client-select"]', 'existing-client-id'),
        page2.selectOption('[data-testid="client-select"]', 'existing-client-id')
      ]);
      
      await Promise.all([
        page.click('[data-testid="next-step"]'),
        page2.click('[data-testid="next-step"]')
      ]);
      
      await Promise.all([
        page.click('[data-testid="skip-projects"]'),
        page2.click('[data-testid="skip-projects"]')
      ]);
      
      await Promise.all([
        page.click('[data-testid="next-step"]'),
        page2.click('[data-testid="next-step"]')
      ]);
      
      await Promise.all([
        page.fill('[data-testid="user-email"]', email),
        page2.fill('[data-testid="user-email"]', email)
      ]);
      
      await Promise.all([
        page.fill('[data-testid="user-full-name"]', 'Concurrent User 1'),
        page2.fill('[data-testid="user-full-name"]', 'Concurrent User 2')
      ]);
      
      await Promise.all([
        page.click('[data-testid="next-step"]'),
        page2.click('[data-testid="next-step"]')
      ]);
      
      await Promise.all([
        page.click('[data-testid="next-step"]'),
        page2.click('[data-testid="next-step"]')
      ]);
      
      // One should succeed, one should fail
      const results = await Promise.allSettled([
        page.click('[data-testid="create-user-final"]').then(() => 'success'),
        page2.click('[data-testid="create-user-final"]').then(() => 'success')
      ]);
      
      // Verify one succeeded and one failed
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBe(1);
      
      // Check for duplicate email error
      await expect(page.locator('[data-testid="error-message"]').or(page2.locator('[data-testid="error-message"]')))
        .toContainText(/email.*already.*exists/i);
    });

    test('should handle browser refresh during user creation', async ({ page }) => {
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="new-user-button"]');
      
      // Fill in step 1
      await page.selectOption('[data-testid="client-select"]', 'existing-client-id');
      await page.click('[data-testid="next-step"]');
      
      // Fill in step 2
      await page.click('[data-testid="skip-projects"]');
      await page.click('[data-testid="next-step"]');
      
      // Fill in step 3 partially
      await page.fill('[data-testid="user-email"]', 'refresh@test.com');
      await page.fill('[data-testid="user-full-name"]', 'Refresh Test');
      
      // Refresh browser
      await page.reload();
      await page.waitForSelector('[data-testid="admin-console"]');
      
      // Should return to main admin page
      await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
      
      // User should not be created
      await page.click('[data-testid="users-tab"]');
      await expect(page.locator('[data-testid="user-list"]')).not.toContainText('refresh@test.com');
    });
  });

  test.afterEach(async ({ page }) => {
    // Cleanup - remove test users if they exist
    try {
      await page.goto('/admin');
      await page.click('[data-testid="users-tab"]');
      
      const testEmails = [
        'testuser@e2etest.com',
        'unique@test.com',
        'minimal@test.com',
        'bulk1@test.com',
        'bulk2@test.com',
        'bulk3@test.com',
        'משתמש@בדיקה.co.il',
        'hebrew@example.co.il',
        'resettest@test.com',
        'audittest@test.com',
        'synctest@test.com',
        'concurrent@test.com',
        'refresh@test.com'
      ];
      
      for (const email of testEmails) {
        const userRow = page.locator(`[data-testid="user-row-${email}"]`);
        if (await userRow.isVisible()) {
          await userRow.locator('[data-testid="delete-user"]').click();
          await page.click('[data-testid="confirm-delete"]');
        }
      }
    } catch (error) {
      console.log('Cleanup failed:', error);
    }
  });
});