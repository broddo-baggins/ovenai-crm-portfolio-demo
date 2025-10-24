import { test, expect } from '@playwright/test';
import { DEFAULT_TEST_CONFIG, TestURLs } from '../__helpers__/test-config';
import { testCredentials } from '../__helpers__/test-credentials';


/**
 * ACCEPTANCE TESTING (UAT) SUITE
 * Tests business scenarios and user acceptance criteria
 * Validates that the system meets real-world business needs
 */

// UAT configuration
const UAT_CONFIG = {
  timeout: 90000,
  retries: 2,
  baseURL: TestURLs.home(),
  businessScenarios: {
    leadManagement: true,
    clientCommunication: true,
    reporting: true,
    userManagement: true
  }
};

test.describe('🎯 User Acceptance Testing (UAT) Suite', () => {
  
  test.describe('Business Scenario 1: Lead Management Lifecycle', () => {
    
    test('Business User: Complete lead management workflow', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('👤 Business Scenario: Sales Manager managing leads...');
      
      // AC1: User can login and access lead management
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/dashboard');
      
      // Verify dashboard shows relevant metrics with correct testids
      await expect(page.locator('[data-testid="dashboard-metrics-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="metric-card-total-leads"]')).toBeVisible();
      await expect(page.locator('[data-testid="metric-card-bant-qualification-rate"]')).toBeVisible();
      
      // AC2: User can view and filter leads
      await page.click('a[href="/leads"]');
      await page.waitForLoadState('networkidle');
      
      // Test filtering capabilities
      await page.selectOption('[data-testid="status-filter"]', 'new');
      await page.waitForTimeout(1000);
      const newLeads = page.locator('[data-testid="lead-item"][data-status="new"]');
      expect(await newLeads.count()).toBeGreaterThan(0);
      
      // AC3: User can create a new lead with complete information
      await page.click('[data-testid="add-lead-button"]');
      
      const leadData = {
        name: 'UAT Test Lead',
        phone: '+1-555-0123', // Primary identifier for leads
        company: 'Test Company',
        source: 'website',
        budget: '50000',
        notes: 'High priority lead from UAT testing'
      };
      
      await page.fill('[data-testid="lead-name"]', leadData.name);
      await page.fill('[data-testid="lead-phone"]', leadData.phone);
      await page.fill('[data-testid="lead-company"]', leadData.company);
      await page.selectOption('[data-testid="lead-source"]', leadData.source);
      await page.fill('[data-testid="lead-budget"]', leadData.budget);
      await page.fill('[data-testid="lead-notes"]', leadData.notes);
      
      await page.click('[data-testid="submit-lead"]');
      
      // AC4: System confirms lead creation and shows in list
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator(`text=${leadData.name}`)).toBeVisible();
      
      // AC5: User can update lead status through the pipeline
      const leadRow = page.locator(`[data-testid="lead-row"]:has-text("${leadData.name}")`);
      await leadRow.locator('[data-testid="status-dropdown"]').click();
      await page.click('[data-testid="status-contacted"]');
      
      // Verify status update
      await expect(leadRow.locator('[data-status="contacted"]')).toBeVisible();
      
      console.log('✅ Lead management workflow UAT passed');
    });
    
    test('Business User: Lead conversion and reporting', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('👤 Business Scenario: Converting leads to clients...');
      
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // AC1: User can convert qualified leads to clients
      await page.goto('/leads');
      const qualifiedLead = page.locator('[data-testid="lead-item"][data-status="qualified"]').first();
      
      if (await qualifiedLead.isVisible()) {
        await qualifiedLead.locator('[data-testid="convert-to-client"]').click();
        
        // Fill client information
        await page.fill('[data-testid="contract-value"]', '75000');
        await page.selectOption('[data-testid="payment-terms"]', 'monthly');
        await page.fill('[data-testid="project-start-date"]', '2024-02-01');
        await page.click('[data-testid="confirm-conversion"]');
        
        // AC2: System creates client record and project
        await expect(page.locator('[data-testid="conversion-success"]')).toBeVisible();
        
        // Verify client appears in clients list
        await page.goto('/clients');
        await expect(page.locator('[data-testid="client-list"]')).toContainText('UAT Test Lead');
      }
      
      // AC3: User can generate and view conversion reports
      await page.goto('/reports');
      await page.click('[data-testid="conversion-report"]');
      await page.selectOption('[data-testid="report-period"]', 'last-30-days');
      await page.click('[data-testid="generate-report"]');
      
      // Verify report data
      await expect(page.locator('[data-testid="conversion-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="lead-sources-chart"]')).toBeVisible();
      
      console.log('✅ Lead conversion UAT passed');
    });
  });
  
  test.describe('Business Scenario 2: Client Communication Management', () => {
    
    test('Business User: WhatsApp communication workflow', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('👤 Business Scenario: Client communication via WhatsApp...');
      
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // AC1: User can access messaging dashboard
      await page.goto('/messages');
      await expect(page.locator('[data-testid="messages-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-conversations"]')).toBeVisible();
      
      // AC2: User can send WhatsApp messages to clients
      await page.click('[data-testid="new-message"]');
      await page.fill('[data-testid="recipient-phone"]', '+1-555-0124');
      await page.fill('[data-testid="message-text"]', 'Hello! Thank you for your interest in our services.');
      await page.click('[data-testid="send-message"]');
      
      // AC3: System confirms message delivery
      await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
      await expect(page.locator('[data-testid="delivery-status"]')).toContainText('delivered');
      
      // AC4: User can receive and respond to incoming messages
      // Simulate incoming message via webhook
      await page.goto('/whatsapp-demo'); // Test utility page
      await page.fill('[data-testid="webhook-phone"]', '+1-555-0124');
      await page.fill('[data-testid="webhook-message"]', 'I would like more information about pricing');
      await page.click('[data-testid="simulate-webhook"]');
      
      // Return to messages and verify
      await page.goto('/messages');
      await expect(page.locator('text=I would like more information')).toBeVisible();
      
      // AC5: User can manage conversation history
      const conversation = page.locator('[data-testid="conversation"]:has-text("+1-555-0124")');
      await conversation.click();
      
      await expect(page.locator('[data-testid="conversation-history"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-thread"]')).toContainText('Thank you for your interest');
      
      console.log('✅ WhatsApp communication UAT passed');
    });
    
    test('Business User: Automated message templates and responses', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('👤 Business Scenario: Managing automated responses...');
      
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // AC1: User can create message templates
      await page.goto('/messages/templates');
      await page.click('[data-testid="create-template"]');
      
      await page.fill('[data-testid="template-name"]', 'Welcome Message');
      await page.fill('[data-testid="template-content"]', 'Welcome to our service! How can we help you today?');
      await page.selectOption('[data-testid="template-category"]', 'greeting');
      await page.click('[data-testid="save-template"]');
      
      // AC2: User can set up automated responses
      await page.goto('/messages/automation');
      await page.click('[data-testid="create-automation"]');
      
      await page.selectOption('[data-testid="trigger-type"]', 'keyword');
      await page.fill('[data-testid="trigger-keyword"]', 'pricing');
      await page.selectOption('[data-testid="response-template"]', 'Welcome Message');
      await page.click('[data-testid="save-automation"]');
      
      // AC3: System uses automation rules for incoming messages
      // This would be tested through webhook simulation
      
      console.log('✅ Automated messaging UAT passed');
    });
  });
  
  test.describe('Business Scenario 3: Business Intelligence and Reporting', () => {
    
    test('Business Manager: Executive dashboard and KPIs', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('👤 Business Scenario: Executive reviewing business metrics...');
      
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // AC1: Manager can access executive dashboard
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="executive-dashboard"]')).toBeVisible();
      
      // AC2: Dashboard shows key business metrics
      const metrics = [
        '[data-testid="total-revenue"]',
        '[data-testid="monthly-growth"]',
        '[data-testid="active-leads"]',
        '[data-testid="conversion-rate"]',
        '[data-testid="customer-satisfaction"]'
      ];
      
      for (const metric of metrics) {
        await expect(page.locator(metric)).toBeVisible();
        // Verify metrics have values
        const value = await page.locator(metric).textContent();
        expect(value).toMatch(/\d+/); // Should contain numbers
      }
      
      // AC3: Manager can drill down into detailed reports
      await page.click('[data-testid="revenue-chart"]');
      await expect(page.locator('[data-testid="revenue-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-breakdown"]')).toBeVisible();
      
      // AC4: Manager can export reports for external use
      await page.goto('/reports');
      await page.click('[data-testid="executive-summary"]');
      await page.selectOption('[data-testid="export-format"]', 'pdf');
      await page.click('[data-testid="export-report"]');
      
      await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
      
      console.log('✅ Executive dashboard UAT passed');
    });
    
    test('Business Analyst: Custom reports and data analysis', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('👤 Business Scenario: Analyst creating custom reports...');
      
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // AC1: Analyst can create custom reports
      await page.goto('/reports/custom');
      await page.click('[data-testid="create-custom-report"]');
      
      // Select data sources
      await page.check('[data-testid="data-source-leads"]');
      await page.check('[data-testid="data-source-revenue"]');
      
      // Configure metrics
      await page.selectOption('[data-testid="metric-1"]', 'lead-count');
      await page.selectOption('[data-testid="metric-2"]', 'conversion-rate');
      
      // Set date range
      await page.fill('[data-testid="date-from"]', '2024-01-01');
      await page.fill('[data-testid="date-to"]', '2024-01-31');
      
      await page.click('[data-testid="generate-custom-report"]');
      
      // AC2: System generates accurate data visualizations
      await expect(page.locator('[data-testid="custom-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
      
      // AC3: Analyst can save and share reports
      await page.click('[data-testid="save-report"]');
      await page.fill('[data-testid="report-name"]', 'January Lead Analysis');
      await page.fill('[data-testid="report-description"]', 'Monthly lead performance analysis');
      await page.click('[data-testid="confirm-save"]');
      
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
      
      console.log('✅ Custom reporting UAT passed');
    });
  });
  
  test.describe('Business Scenario 4: User Management and Access Control', () => {
    
    test('Admin: Team member management', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('👤 Business Scenario: Admin managing team access...');
      
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // AC1: Admin can access user management
      await page.goto('/users');
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-list"]')).toBeVisible();
      
      // AC2: Admin can invite new team members
      await page.click('[data-testid="invite-user"]');
      await page.fill('[data-testid="invite-email"]', 'newuser@company.com');
      await page.selectOption('[data-testid="user-role"]', 'sales');
      await page.check('[data-testid="permission-leads"]');
      await page.check('[data-testid="permission-messages"]');
      await page.click('[data-testid="send-invitation"]');
      
      await expect(page.locator('[data-testid="invitation-sent"]')).toBeVisible();
      
      // AC3: Admin can modify user permissions
      const userRow = page.locator('[data-testid="user-row"]:has-text("testCredentials.email")');
      await userRow.locator('[data-testid="edit-permissions"]').click();
      
      await page.check('[data-testid="permission-reports"]');
      await page.click('[data-testid="update-permissions"]');
      
      await expect(page.locator('[data-testid="permissions-updated"]')).toBeVisible();
      
      // AC4: Admin can deactivate users
      await userRow.locator('[data-testid="user-actions"]').click();
      await page.click('[data-testid="deactivate-user"]');
      await page.click('[data-testid="confirm-deactivation"]');
      
      await expect(userRow.locator('[data-status="inactive"]')).toBeVisible();
      
      console.log('✅ User management UAT passed');
    });
  });
  
  test.describe('Business Scenario 5: System Integration and Data Import', () => {
    
    test('Business User: Data import and system integration', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('👤 Business Scenario: Importing existing data...');
      
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // AC1: User can import lead data from CSV
      await page.goto('/import');
      await page.click('[data-testid="import-leads"]');
      
      // Simulate file upload
      const fileInput = page.locator('[data-testid="csv-upload"]');
      // In a real scenario, this would upload an actual CSV file
      await fileInput.setInputFiles({
        name: 'leads.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('name,email,phone\nTest Lead,test@example.com,+1234567890')
      });
      
      await page.click('[data-testid="start-import"]');
      
      // AC2: System validates and processes imported data
      await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="validation-results"]')).toBeVisible();
      
      // AC3: User can review and confirm import
      await page.click('[data-testid="confirm-import"]');
      await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
      
      // AC4: Imported data appears in system
      await page.goto('/leads');
      await expect(page.locator('text=Test Lead')).toBeVisible();
      
      console.log('✅ Data import UAT passed');
    });
  });
  
  test.describe('Acceptance Criteria Validation', () => {
    
    test('Cross-functional workflow validation', async ({ page }) => {
      test.setTimeout(UAT_CONFIG.timeout);
      
      console.log('🔄 Validating complete business workflow...');
      
      // Complete end-to-end business process
      // 1. Lead comes in → 2. Sales contacts → 3. Converted to client → 4. Project management → 5. Reporting
      
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // Step 1: New lead acquisition (email deprecated for leads)
      await page.goto('/leads');
      await page.click('[data-testid="add-lead-button"]');
      await page.fill('[data-testid="lead-name"]', 'End-to-End Test Client');
      await page.fill('[data-testid="lead-phone"]', '+1-555-9999');
      await page.click('[data-testid="submit-lead"]');
      
      // Step 2: Sales process
      const leadRow = page.locator('[data-testid="lead-row"]:has-text("End-to-End Test Client")');
      await leadRow.locator('[data-testid="contact-lead"]').click();
      await page.fill('[data-testid="contact-notes"]', 'Initial contact made, interested in our services');
      await page.click('[data-testid="save-contact"]');
      
      // Step 3: Conversion
      await leadRow.locator('[data-testid="convert-lead"]').click();
      await page.fill('[data-testid="project-value"]', '100000');
      await page.click('[data-testid="confirm-conversion"]');
      
      // Step 4: Verify in reports
      await page.goto('/reports');
      await page.click('[data-testid="recent-conversions"]');
      await expect(page.locator('text=End-to-End Test Client')).toBeVisible();
      
      console.log('✅ Cross-functional workflow validation passed');
    });
  });
});

// UAT Helper Functions
async function verifyBusinessRule(page: any, selector: string, expectedBehavior: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  
  const value = await element.textContent();
  return value?.includes(expectedBehavior) || false;
}

async function simulateBusinessScenario(page: any, scenario: string, steps: any[]) {
  console.log(`🎭 Simulating business scenario: ${scenario}`);
  
  for (const step of steps) {
    await step.action(page);
    if (step.validation) {
      await step.validation(page);
    }
  }
}

async function validateAcceptanceCriteria(page: any, criteria: any[]) {
  for (const criterion of criteria) {
    console.log(`✓ Validating: ${criterion.description}`);
    await criterion.test(page);
  }
} 