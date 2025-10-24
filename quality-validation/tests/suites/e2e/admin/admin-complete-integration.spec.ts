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


test.describe('Admin Console - Complete Integration Test Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin user
    await authenticateAsAdmin(page);
    
    // Navigate to admin console if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });

  test.describe('Complete Admin Workflow Integration', () => {
    
    test('should complete full admin workflow: client→project→user→settings→audit', async ({ page }) => {
      console.log('Starting complete admin workflow test...');
      
      // ===== STEP 1: Client Management =====
      console.log('Step 1: Creating client...');
      await page.click('[data-testid="clients-tab"]', { timeout: 10000 });
      await page.click('[data-testid="add-client-button"]');
      
      await page.fill('[data-testid="client-name"]', 'Integration Test Corp');
      await page.fill('[data-testid="client-description"]', 'Full integration testing client');
      await page.fill('[data-testid="client-email"]', 'contact@integration-test.com');
      await page.fill('[data-testid="client-phone"]', '+1-555-INTEGRATION');
      await page.click('[data-testid="save-client"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Client created');
      await expect(page.locator('[data-testid="client-list"]')).toContainText('Integration Test Corp');
      
      // ===== STEP 2: Project Management =====
      console.log('Step 2: Creating project...');
      await page.click('[data-testid="projects-tab"]');
      await page.click('[data-testid="add-project-button"]');
      
      await page.fill('[data-testid="project-name"]', 'Integration Test Campaign');
      await page.fill('[data-testid="project-description"]', 'Full workflow testing project');
      await page.selectOption('[data-testid="project-client"]', 'Integration Test Corp');
      await page.fill('[data-testid="project-budget"]', '100000');
      
      // Set project dates
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      await page.fill('[data-testid="start-date"]', today.toISOString().split('T')[0]);
      await page.fill('[data-testid="end-date"]', nextMonth.toISOString().split('T')[0]);
      
      await page.click('[data-testid="save-project"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Project created');
      await expect(page.locator('[data-testid="project-list"]')).toContainText('Integration Test Campaign');
      
      // Add project goals
      await page.click('[data-testid="project-row-integration"] [data-testid="manage-goals"]');
      
      await page.fill('[data-testid="goal-name"]', 'Generate 100 Leads');
      await page.selectOption('[data-testid="goal-type"]', 'leads');
      await page.fill('[data-testid="target-value"]', '100');
      await page.fill('[data-testid="goal-unit"]', 'leads');
      
      const goalDeadline = new Date(today.getFullYear(), today.getMonth() + 2, today.getDate());
      await page.fill('[data-testid="goal-deadline"]', goalDeadline.toISOString().split('T')[0]);
      
      await page.click('[data-testid="add-goal"]');
      await expect(page.locator('[data-testid="goals-list"]')).toContainText('Generate 100 Leads');
      
      await page.click('[data-testid="close-goals-dialog"]');
      
      // ===== STEP 3: User Creation with Full Workflow =====
      console.log('Step 3: Creating user...');
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="add-user-button"]');
      
      // User creation wizard - Step 1: Client selection
      await page.selectOption('[data-testid="user-client"]', 'Integration Test Corp');
      await page.click('[data-testid="next-step"]');
      
      // Step 2: Project assignment
      await page.check('[data-testid="project-checkbox-integration-test-campaign"]');
      await page.click('[data-testid="next-step"]');
      
      // Step 3: User details
      await page.fill('[data-testid="user-email"]', 'manager@integration-test.com');
      await page.fill('[data-testid="user-full-name"]', 'Integration Test Manager');
      await page.fill('[data-testid="user-phone"]', '+1-555-MANAGER');
      await page.selectOption('[data-testid="user-role"]', 'user');
      await page.click('[data-testid="next-step"]');
      
      // Step 4: Role assignment
      await page.selectOption('[data-testid="project-role"]', 'manager');
      await page.check('[data-testid="permission-view-leads"]');
      await page.check('[data-testid="permission-edit-leads"]');
      await page.check('[data-testid="permission-view-projects"]');
      await page.click('[data-testid="next-step"]');
      
      // Step 5: Confirmation and creation
      await expect(page.locator('[data-testid="summary-email"]')).toContainText('manager@integration-test.com');
      await expect(page.locator('[data-testid="summary-client"]')).toContainText('Integration Test Corp');
      await expect(page.locator('[data-testid="summary-project"]')).toContainText('Integration Test Campaign');
      
      await page.click('[data-testid="create-user-final"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User created successfully');
      
      // Verify user appears in list
      await page.click('[data-testid="view-users"]');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('manager@integration-test.com');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('Integration Test Manager');
      
      // ===== STEP 4: User Settings & API Keys =====
      console.log('Step 4: Managing user settings...');
      await page.click('[data-testid="settings-tab"]');
      
      // Select the created user
      await page.selectOption('[data-testid="settings-user-select"]', 'manager@integration-test.com');
      
      // Add API keys
      await page.click('[data-testid="api-keys-tab"]');
      await page.selectOption('[data-testid="api-service"]', 'openai');
      await page.fill('[data-testid="api-key-name"]', 'Production OpenAI Key');
      await page.fill('[data-testid="api-key-value"]', 'sk-test-integration-key-12345');
      await page.click('[data-testid="add-api-key"]');
      
      await expect(page.locator('[data-testid="api-keys-list"]')).toContainText('Production OpenAI Key');
      await expect(page.locator('[data-testid="api-keys-list"]')).toContainText('openai');
      
      // Add user settings
      await page.click('[data-testid="user-settings-tab"]');
      await page.fill('[data-testid="setting-key"]', 'notification_preferences');
      await page.selectOption('[data-testid="setting-type"]', 'json');
      await page.fill('[data-testid="setting-value"]', '{"email": true, "sms": false, "push": true}');
      await page.click('[data-testid="add-setting"]');
      
      await expect(page.locator('[data-testid="settings-list"]')).toContainText('notification_preferences');
      await expect(page.locator('[data-testid="settings-list"]')).toContainText('json');
      
      // ===== STEP 5: Role Management =====
      console.log('Step 5: Managing roles...');
      await page.click('[data-testid="roles-tab"]');
      
      // Verify role assignment
      await expect(page.locator('[data-testid="roles-table"]')).toContainText('manager@integration-test.com');
      await expect(page.locator('[data-testid="roles-table"]')).toContainText('Integration Test Corp');
      await expect(page.locator('[data-testid="roles-table"]')).toContainText('manager');
      
      // Bulk role update
      await page.check('[data-testid="role-checkbox-manager@integration-test.com"]');
      await page.selectOption('[data-testid="bulk-action"]', 'update-permissions');
      await page.check('[data-testid="bulk-permission-view-analytics"]');
      await page.click('[data-testid="apply-bulk-action"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Roles updated');
      
      // ===== STEP 6: System Prompts (CEO Only) =====
      console.log('Step 6: Managing system prompts...');
      await page.click('[data-testid="system-tab"]');
      
      // Create system prompt for the project
      await page.selectOption('[data-testid="prompt-project"]', 'Integration Test Campaign');
      await page.fill('[data-testid="prompt-name"]', 'Lead Qualification Assistant');
      await page.fill('[data-testid="prompt-content"]', `You are a helpful AI assistant for Integration Test Corp's lead qualification process.

Your role is to:
1. Qualify incoming leads based on BANT criteria
2. Provide helpful information about our services
3. Schedule follow-up calls with the appropriate team members
4. Maintain a professional and friendly tone

Context: This is for the Integration Test Campaign focusing on enterprise clients.

Please respond helpfully and professionally to all inquiries.`);
      
      await page.click('[data-testid="create-prompt"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('System prompt created');
      
      // Verify prompt appears in list
      await expect(page.locator('[data-testid="prompts-list"]')).toContainText('Lead Qualification Assistant');
      await expect(page.locator('[data-testid="prompts-list"]')).toContainText('Integration Test Campaign');
      
      // ===== STEP 7: N8N Settings Integration =====
      console.log('Step 7: Configuring N8N settings...');
      await page.click('[data-testid="automation-tab"]');
      
      // Configure N8N connection
      await page.fill('[data-testid="n8n-url"]', 'https://n8n.integration-test.com');
      await page.fill('[data-testid="n8n-api-key"]', 'n8n-integration-test-key-12345');
      await page.click('[data-testid="test-connection"]');
      
      // Wait for connection test (simulated)
      await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected', { timeout: 10000 });
      
      await page.click('[data-testid="save-n8n-config"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Configuration saved');
      
      // ===== STEP 8: Audit Logs Verification =====
      console.log('Step 8: Verifying audit logs...');
      await page.click('[data-testid="audit-tab"]');
      
      // Filter recent activities
      const todayDate = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="date-from"]', todayDate);
      await page.selectOption('[data-testid="changed-by-filter"]', testCredentials.email);
      await page.click('[data-testid="apply-filters"]');
      
      // Verify all our actions are logged
      const expectedEntries = [
        'clients', // Client creation
        'projects', // Project creation
        'project_goals', // Goal creation
        'profiles', // User creation
        'client_members', // User assignment
        'user_api_keys', // API key creation
        'user_settings', // Settings creation
        'project_system_prompts' // System prompt creation
      ];
      
      for (const table of expectedEntries) {
        await expect(page.locator('[data-testid="audit-logs"]')).toContainText(table);
      }
      
      // Check specific entries
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText('Integration Test Corp');
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText('manager@integration-test.com');
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText('Lead Qualification Assistant');
      
      // Export audit logs
      await page.click('[data-testid="export-audit-logs"]');
      
      // Wait for download (verify export functionality)
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/audit-logs-\d{4}-\d{2}-\d{2}\.csv/);
      
      console.log('Complete admin workflow test completed successfully!');
    });

    test('should handle complex role hierarchy and permissions', async ({ page }) => {
      console.log('Testing complex role hierarchy...');
      
      // Create multiple users with different roles
      const users = [
        { email: 'ceo@hierarchy-test.com', name: 'CEO User', role: 'ceo' },
        { email: 'admin@hierarchy-test.com', name: 'Admin User', role: 'admin' },
        { email: 'manager@hierarchy-test.com', name: 'Manager User', role: 'user' },
        { email: 'member@hierarchy-test.com', name: 'Member User', role: 'user' }
      ];
      
      // Create client first
      await page.click('[data-testid="clients-tab"]');
      await page.click('[data-testid="add-client-button"]');
      await page.fill('[data-testid="client-name"]', 'Hierarchy Test Inc');
      await page.fill('[data-testid="client-description"]', 'Testing role hierarchies');
      await page.click('[data-testid="save-client"]');
      
      // Create project
      await page.click('[data-testid="projects-tab"]');
      await page.click('[data-testid="add-project-button"]');
      await page.fill('[data-testid="project-name"]', 'Hierarchy Test Project');
      await page.selectOption('[data-testid="project-client"]', 'Hierarchy Test Inc');
      await page.click('[data-testid="save-project"]');
      
      // Create users with different roles
      for (const user of users) {
        await page.click('[data-testid="users-tab"]');
        await page.click('[data-testid="add-user-button"]');
        
        // Quick user creation
        await page.selectOption('[data-testid="user-client"]', 'Hierarchy Test Inc');
        await page.click('[data-testid="next-step"]');
        await page.check('[data-testid="project-checkbox-hierarchy-test-project"]');
        await page.click('[data-testid="next-step"]');
        
        await page.fill('[data-testid="user-email"]', user.email);
        await page.fill('[data-testid="user-full-name"]', user.name);
        await page.selectOption('[data-testid="user-role"]', user.role);
        await page.click('[data-testid="next-step"]');
        
        // Set project role based on system role
        const projectRole = user.role === 'ceo' ? 'manager' : 
                           user.role === 'admin' ? 'manager' : 'member';
        await page.selectOption('[data-testid="project-role"]', projectRole);
        
        // Set permissions based on role
        if (user.role === 'ceo' || user.role === 'admin') {
          await page.check('[data-testid="permission-view-leads"]');
          await page.check('[data-testid="permission-edit-leads"]');
          await page.check('[data-testid="permission-view-projects"]');
          await page.check('[data-testid="permission-edit-projects"]');
          await page.check('[data-testid="permission-view-analytics"]');
        } else if (user.role === 'user') {
          await page.check('[data-testid="permission-view-leads"]');
          if (user.email.includes('manager')) {
            await page.check('[data-testid="permission-edit-leads"]');
            await page.check('[data-testid="permission-view-projects"]');
          }
        }
        
        await page.click('[data-testid="next-step"]');
        await page.click('[data-testid="create-user-final"]');
        
        await expect(page.locator('[data-testid="success-message"]')).toContainText('User created');
      }
      
      // Verify role hierarchy in roles table
      await page.click('[data-testid="roles-tab"]');
      
      // Check role distribution
      await expect(page.locator('[data-testid="roles-table"]')).toContainText('ceo@hierarchy-test.com');
      await expect(page.locator('[data-testid="roles-table"]')).toContainText('admin@hierarchy-test.com');
      await expect(page.locator('[data-testid="roles-table"]')).toContainText('manager@hierarchy-test.com');
      await expect(page.locator('[data-testid="roles-table"]')).toContainText('member@hierarchy-test.com');
      
      // Test bulk role management
      await page.check('[data-testid="role-checkbox-manager@hierarchy-test.com"]');
      await page.check('[data-testid="role-checkbox-member@hierarchy-test.com"]');
      await page.selectOption('[data-testid="bulk-action"]', 'update-project-role');
      await page.selectOption('[data-testid="bulk-project-role"]', 'member');
      await page.click('[data-testid="apply-bulk-action"]');
      
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Bulk update completed');
    });

    test('should maintain data consistency across all admin features', async ({ page }) => {
      console.log('Testing data consistency across features...');
      
      // Create base data
      const clientName = 'Consistency Test Corp';
      const projectName = 'Consistency Test Project';
      const userEmail = 'consistency@test.com';
      
      // 1. Create client
      await page.click('[data-testid="clients-tab"]');
      await page.click('[data-testid="add-client-button"]');
      await page.fill('[data-testid="client-name"]', clientName);
      await page.fill('[data-testid="client-description"]', 'Testing data consistency');
      await page.click('[data-testid="save-client"]');
      
      // 2. Create project
      await page.click('[data-testid="projects-tab"]');
      await page.click('[data-testid="add-project-button"]');
      await page.fill('[data-testid="project-name"]', projectName);
      await page.selectOption('[data-testid="project-client"]', clientName);
      await page.click('[data-testid="save-project"]');
      
      // 3. Create user
      await page.click('[data-testid="users-tab"]');
      await page.click('[data-testid="add-user-button"]');
      await page.selectOption('[data-testid="user-client"]', clientName);
      await page.click('[data-testid="next-step"]');
      await page.check(`[data-testid="project-checkbox-${projectName.toLowerCase().replace(/ /g, '-')}"]`);
      await page.click('[data-testid="next-step"]');
      await page.fill('[data-testid="user-email"]', userEmail);
      await page.fill('[data-testid="user-full-name"]', 'Consistency Test User');
      await page.click('[data-testid="next-step"]');
      await page.selectOption('[data-testid="project-role"]', 'member');
      await page.click('[data-testid="next-step"]');
      await page.click('[data-testid="create-user-final"]');
      
      // 4. Verify consistency in client management
      await page.click('[data-testid="clients-tab"]');
      await page.click(`[data-testid="client-row-${clientName.toLowerCase().replace(/ /g, '-')}"] [data-testid="view-details"]`);
      
      // Should show associated project and user
      await expect(page.locator('[data-testid="client-projects"]')).toContainText(projectName);
      await expect(page.locator('[data-testid="client-members"]')).toContainText(userEmail);
      await page.click('[data-testid="close-client-details"]');
      
      // 5. Verify consistency in project management
      await page.click('[data-testid="projects-tab"]');
      await page.click(`[data-testid="project-row-${projectName.toLowerCase().replace(/ /g, '-')}"] [data-testid="view-team"]`);
      
      // Should show associated client and user
      await expect(page.locator('[data-testid="project-client"]')).toContainText(clientName);
      await expect(page.locator('[data-testid="project-members"]')).toContainText(userEmail);
      await page.click('[data-testid="close-project-details"]');
      
      // 6. Verify consistency in user settings
      await page.click('[data-testid="settings-tab"]');
      await page.selectOption('[data-testid="settings-user-select"]', userEmail);
      
      // User should be associated with correct client and project
      await expect(page.locator('[data-testid="user-client-info"]')).toContainText(clientName);
      await expect(page.locator('[data-testid="user-projects-info"]')).toContainText(projectName);
      
      // 7. Verify consistency in audit logs
      await page.click('[data-testid="audit-tab"]');
      
      // Search for related entries
      await page.fill('[data-testid="search-logs"]', clientName);
      await page.click('[data-testid="search-button"]');
      
      // Should show all related audit entries
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText(clientName);
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText(projectName);
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText(userEmail);
      
      // 8. Test cascade consistency - update client name
      await page.click('[data-testid="clients-tab"]');
      await page.click(`[data-testid="client-row-${clientName.toLowerCase().replace(/ /g, '-')}"] [data-testid="edit-client"]`);
      
      const newClientName = 'Updated Consistency Corp';
      await page.fill('[data-testid="edit-client-name"]', newClientName);
      await page.click('[data-testid="save-client-changes"]');
      
      // Verify update is reflected across all features
      await page.click('[data-testid="projects-tab"]');
      await expect(page.locator('[data-testid="project-list"]')).toContainText(newClientName);
      
      await page.click('[data-testid="users-tab"]');
      await expect(page.locator('[data-testid="user-list"]')).toContainText(newClientName);
      
      await page.click('[data-testid="audit-tab"]');
      await expect(page.locator('[data-testid="audit-logs"]')).toContainText(newClientName);
    });
  });

  test.describe('Performance and Stress Testing', () => {
    
    test('should handle large datasets efficiently', async ({ page }) => {
      console.log('Testing performance with large datasets...');
      
      // Test pagination and filtering with large datasets
      await page.click('[data-testid="audit-tab"]');
      
      // Load all audit logs
      await page.click('[data-testid="load-all-logs"]');
      
      // Verify pagination works
      await expect(page.locator('[data-testid="pagination-info"]')).toContainText('of');
      
      // Test filtering performance
      await page.selectOption('[data-testid="table-filter"]', 'profiles');
      await page.click('[data-testid="apply-filters"]');
      
      // Should filter quickly
      await expect(page.locator('[data-testid="audit-logs"]')).toBeVisible({ timeout: 5000 });
      
      // Test search performance
      await page.fill('[data-testid="search-logs"]', 'test');
      await page.click('[data-testid="search-button"]');
      
      // Should search quickly
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible({ timeout: 3000 });
      
      // Test export performance
      await page.click('[data-testid="export-logs"]');
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      const download = await downloadPromise;
      expect(download).toBeTruthy();
    });

    test('should maintain responsiveness during concurrent operations', async ({ page, context }) => {
      console.log('Testing concurrent operations...');
      
      // Open multiple tabs for concurrent testing
      const page2 = await context.newPage();
      const page3 = await context.newPage();
      
      // All navigate to admin
      await Promise.all([
        page2.goto('/admin'),
        page3.goto('/admin')
      ]);
      
      await Promise.all([
        page2.waitForSelector('[data-testid="admin-console"]'),
        page3.waitForSelector('[data-testid="admin-console"]')
      ]);
      
      // Concurrent operations
      const operations = [
        // Page 1: Create client
        page.click('[data-testid="clients-tab"]').then(() => 
          page.click('[data-testid="add-client-button"]')).then(() =>
          page.fill('[data-testid="client-name"]', 'Concurrent Client 1')).then(() =>
          page.click('[data-testid="save-client"]')),
        
        // Page 2: Create user
        page2.click('[data-testid="users-tab"]').then(() =>
          page2.click('[data-testid="add-user-button"]')).then(() =>
          page2.selectOption('[data-testid="user-client"]', 'existing-client')).then(() =>
          page2.click('[data-testid="next-step"]')),
        
        // Page 3: View audit logs
        page3.click('[data-testid="audit-tab"]').then(() =>
          page3.click('[data-testid="apply-filters"]'))
      ];
      
      // All operations should complete within reasonable time
      await Promise.all(operations);
      
      // Verify all pages are still responsive
      await expect(page.locator('[data-testid="admin-console"]')).toBeVisible();
      await expect(page2.locator('[data-testid="admin-console"]')).toBeVisible();
      await expect(page3.locator('[data-testid="admin-console"]')).toBeVisible();
    });
  });

  test.afterEach(async ({ page }) => {
    // Comprehensive cleanup
    console.log('Starting cleanup...');
    
    try {
      // Clean up test users
      await page.goto('/admin');
      await page.click('[data-testid="users-tab"]');
      
      const testUserEmails = [
        'manager@integration-test.com',
        'ceo@hierarchy-test.com',
        'admin@hierarchy-test.com',
        'manager@hierarchy-test.com',
        'member@hierarchy-test.com',
        'consistency@test.com'
      ];
      
      for (const email of testUserEmails) {
        try {
          const userRow = page.locator(`[data-testid="user-row-${email}"]`);
          if (await userRow.isVisible({ timeout: 1000 })) {
            await userRow.locator('[data-testid="delete-user"]').click();
            await page.click('[data-testid="confirm-delete"]');
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log(`Could not delete user ${email}:`, e.message);
        }
      }
      
      // Clean up test projects
      await page.click('[data-testid="projects-tab"]');
      
      const testProjects = [
        'Integration Test Campaign',
        'Hierarchy Test Project',
        'Consistency Test Project'
      ];
      
      for (const project of testProjects) {
        try {
          const projectRow = page.locator(`[data-testid="project-row-${project.toLowerCase().replace(/ /g, '-')}"]`);
          if (await projectRow.isVisible({ timeout: 1000 })) {
            await projectRow.locator('[data-testid="delete-project"]').click();
            await page.click('[data-testid="confirm-delete"]');
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log(`Could not delete project ${project}:`, e.message);
        }
      }
      
      // Clean up test clients
      await page.click('[data-testid="clients-tab"]');
      
      const testClients = [
        'Integration Test Corp',
        'Hierarchy Test Inc',
        'Consistency Test Corp',
        'Updated Consistency Corp'
      ];
      
      for (const client of testClients) {
        try {
          const clientRow = page.locator(`[data-testid="client-row-${client.toLowerCase().replace(/ /g, '-')}"]`);
          if (await clientRow.isVisible({ timeout: 1000 })) {
            await clientRow.locator('[data-testid="delete-client"]').click();
            await page.click('[data-testid="confirm-delete"]');
            await page.waitForTimeout(500);
          }
        } catch (e) {
          console.log(`Could not delete client ${client}:`, e.message);
        }
      }
      
      console.log('Cleanup completed successfully');
      
    } catch (error) {
      console.log('Cleanup failed:', error.message);
    }
  });
});