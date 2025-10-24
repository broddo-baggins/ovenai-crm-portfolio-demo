import { test, expect } from '@playwright/test';
import { DEFAULT_TEST_CONFIG, TestURLs } from '../__helpers__/test-config';
import { testCredentials } from '../__helpers__/test-credentials';


/**
 * SYSTEM TESTING SUITE
 * Evaluates the entire system as a whole
 * Ensures all features work together on a full, integrated build
 */

// System test configuration
const SYSTEM_CONFIG = {
  timeout: 120000, // 2 minutes for complex system tests
  retries: 1,
  baseURL: TestURLs.home(),
  environments: {
    development: TestURLs.home(),
    staging: 'https://staging.oven-ai.com',
    production: 'https://oven-ai.com'
  }
};

test.describe('🏗️ System Testing Suite', () => {
  
  test.describe('End-to-End Business Workflows', () => {
    
    test('Complete lead management workflow', async ({ page }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing complete lead management workflow...');
      
      // 1. User Authentication
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/dashboard');
      
      // 2. Navigate to Leads
      await page.click('a[href="/leads"]');
      await page.waitForLoadState('networkidle');
      
      // 3. Create New Lead (email deprecated for leads)
      await page.click('[data-testid="add-lead-button"]');
      await page.fill('[data-testid="lead-name"]', 'System Test Lead');
      await page.fill('[data-testid="lead-phone"]', '+1234567890');
      await page.selectOption('[data-testid="lead-source"]', 'website');
      await page.click('[data-testid="submit-lead"]');
      
      // 4. Verify Lead Creation
      await expect(page.locator('text=System Test Lead')).toBeVisible();
      
      // 5. Update Lead Status
      await page.click('[data-testid="lead-actions"]');
      await page.click('[data-testid="update-status"]');
      await page.selectOption('[data-testid="status-select"]', 'contacted');
      await page.click('[data-testid="save-status"]');
      
      // 6. Add Note to Lead
      await page.click('[data-testid="add-note"]');
      await page.fill('[data-testid="note-content"]', 'System test note');
      await page.click('[data-testid="save-note"]');
      
      // 7. Generate Report
      await page.click('a[href="/reports"]');
      await page.waitForLoadState('networkidle');
      await page.click('[data-testid="generate-report"]');
      await page.selectOption('[data-testid="report-type"]', 'leads');
      await page.click('[data-testid="download-report"]');
      
      // 8. Verify System Consistency
      await page.goto('/dashboard');
      const dashboardStats = page.locator('[data-testid="total-leads"]');
      await expect(dashboardStats).toContainText(/\d+/);
      
      console.log('✅ Complete lead management workflow passed');
    });
    
    test('User onboarding and setup workflow', async ({ page }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing user onboarding workflow...');
      
      // 1. Registration (if enabled)
      await page.goto('/');
      const signUpButton = page.locator('[data-testid="sign-up"]');
      if (await signUpButton.isVisible()) {
        await signUpButton.click();
        await page.fill('[data-testid="register-email"]', 'newuser@test.com');
        await page.fill('[data-testid="register-password"]', 'newpass123');
        await page.click('[data-testid="register-button"]');
      }
      
      // 2. Email Verification (simulate)
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // 3. First-time Setup
      if (await page.locator('[data-testid="onboarding"]').isVisible()) {
        await page.click('[data-testid="start-onboarding"]');
        
        // Business Information
        await page.fill('[data-testid="company-name"]', 'Test Company');
        await page.selectOption('[data-testid="industry"]', 'technology');
        await page.click('[data-testid="next-step"]');
        
        // Integration Setup
        await page.fill('[data-testid="whatsapp-token"]', 'test-token');
        await page.click('[data-testid="test-connection"]');
        await page.click('[data-testid="next-step"]');
        
        // Complete Setup
        await page.click('[data-testid="complete-setup"]');
      }
      
      // 4. Verify Dashboard Access
      await page.waitForURL('/dashboard');
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
      
      console.log('✅ User onboarding workflow passed');
    });
    
    test('Communication and messaging workflow', async ({ page }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing communication workflow...');
      
      // 1. Login
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // 2. Access Messages
      await page.click('a[href="/messages"]');
      await page.waitForLoadState('networkidle');
      
      // 3. Send WhatsApp Message
      await page.click('[data-testid="compose-message"]');
      await page.fill('[data-testid="recipient"]', '+1234567890');
      await page.fill('[data-testid="message-content"]', 'System test message');
      await page.click('[data-testid="send-message"]');
      
      // 4. Verify Message Sent
      await expect(page.locator('text=System test message')).toBeVisible();
      
      // 5. Handle Incoming Message (simulate webhook)
      await page.goto('/whatsapp-demo');
      await page.click('[data-testid="simulate-incoming"]');
      await page.fill('[data-testid="incoming-message"]', 'Test reply');
      await page.click('[data-testid="trigger-webhook"]');
      
      // 6. Verify Message Processing
      await page.goto('/messages');
      await expect(page.locator('text=Test reply')).toBeVisible();
      
      console.log('✅ Communication workflow passed');
    });
  });
  
  test.describe('System Performance and Scalability', () => {
    
    test('System load handling', async ({ page }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing system load handling...');
      
      // Simulate multiple concurrent operations
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          (async () => {
            await page.goto('/dashboard');
            await page.waitForLoadState('networkidle');
            await page.click('a[href="/leads"]');
            await page.waitForLoadState('networkidle');
            return page.locator('[data-testid="leads-list"]').isVisible();
          })()
        );
      }
      
      const results = await Promise.all(promises);
      expect(results.every(result => result)).toBe(true);
      
      console.log('✅ System load handling passed');
    });
    
    test('Database transaction consistency', async ({ page, request }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing database consistency...');
      
      // Test concurrent data operations
      const leadData = {
        name: 'Consistency Test Lead',
        email: 'consistency@test.com',
        phone: '+1234567890'
      };
      
      // Create multiple leads simultaneously
      const createPromises = [];
      for (let i = 0; i < 3; i++) {
        createPromises.push(
          request.post('/api/leads', {
            data: { ...leadData, name: `${leadData.name} ${i}` }
          })
        );
      }
      
      const responses = await Promise.all(createPromises);
      responses.forEach(response => {
        expect(response.status()).toBe(201);
      });
      
      // Verify data consistency in UI
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      for (let i = 0; i < 3; i++) {
        await expect(page.locator(`text=Consistency Test Lead ${i}`)).toBeVisible();
      }
      
      console.log('✅ Database consistency passed');
    });
  });
  
  test.describe('System Security and Access Control', () => {
    
    test('Authentication and authorization system', async ({ page }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing authentication system...');
      
      // 1. Test Unauthenticated Access
      await page.goto('/dashboard');
      await page.waitForURL('**/auth/login');
      
      // 2. Test Login
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="login-button"]');
      await page.waitForURL('/dashboard');
      
      // 3. Test Protected Routes
      const protectedRoutes = ['/leads', '/projects', '/settings', '/users'];
      for (const route of protectedRoutes) {
        await page.goto(route);
        // Should not redirect to login
        expect(page.url()).toContain(route);
      }
      
      // 4. Test Session Persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('login');
      
      // 5. Test Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout"]');
      await page.waitForURL('/');
      
      // 6. Verify Logout Effectiveness
      await page.goto('/dashboard');
      await page.waitForURL('**/auth/login');
      
      console.log('✅ Authentication system passed');
    });
    
    test('Data privacy and security', async ({ page, request }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing data security...');
      
      // Test unauthorized API access
      const unauthorizedResponse = await request.get('/api/leads');
      expect([401, 403]).toContain(unauthorizedResponse.status());
      
      // Test SQL injection protection
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', "test'; DROP TABLE users; --");
      await page.fill('[data-testid="password-input"]', 'password');
      await page.click('[data-testid="login-button"]');
      
      // Should handle malicious input gracefully
      const errorMessage = page.locator('[data-testid="login-error"]');
      if (await errorMessage.isVisible()) {
        expect(await errorMessage.textContent()).not.toContain('DROP TABLE');
      }
      
      console.log('✅ Data security passed');
    });
  });
  
  test.describe('System Integration and Third-party Services', () => {
    
    test('WhatsApp Business API integration', async ({ page, request }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing WhatsApp integration...');
      
      // Test webhook endpoint
      const webhookData = {
        messages: [{
          from: '+1234567890',
          text: { body: 'Integration test message' },
          timestamp: Date.now()
        }]
      };
      
      const webhookResponse = await request.post('/api/whatsapp/webhook', {
        data: webhookData
      });
      
      expect(webhookResponse.status()).toBe(200);
      
      // Verify message processing in UI
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      await page.goto('/messages');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('text=Integration test message')).toBeVisible();
      
      console.log('✅ WhatsApp integration passed');
    });
    
    test('Email service integration', async ({ request }) => {
      console.log('🔄 Testing email integration...');
      
      const emailData = {
        to: 'test@example.com',
        subject: 'System Test Email',
        body: 'This is a system integration test'
      };
      
      const emailResponse = await request.post('/api/notifications/email', {
        data: emailData
      });
      
      // Should handle email requests appropriately
      expect([200, 202, 204]).toContain(emailResponse.status());
      
      console.log('✅ Email integration passed');
    });
  });
  
  test.describe('System Backup and Recovery', () => {
    
    test('Data export and backup functionality', async ({ page }) => {
      test.setTimeout(SYSTEM_CONFIG.timeout);
      
      console.log('🔄 Testing backup functionality...');
      
      // Login
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // Navigate to data export
      await page.goto('/data-export');
      await page.waitForLoadState('networkidle');
      
      // Request data export
      await page.click('[data-testid="request-export"]');
      await page.selectOption('[data-testid="export-format"]', 'json');
      await page.click('[data-testid="confirm-export"]');
      
      // Verify export request
      await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
      
      console.log('✅ Backup functionality passed');
    });
    
    test('System error recovery', async ({ page }) => {
      console.log('🔄 Testing error recovery...');
      
      // Simulate system error
      await page.goto('/dashboard');
      
      // Trigger JavaScript error
      await page.evaluate(() => {
        throw new Error('Simulated system error');
      });
      
      // Verify error boundary handling
      const errorBoundary = page.locator('[data-testid="error-boundary"]');
      if (await errorBoundary.isVisible()) {
        await page.click('[data-testid="retry-button"]');
        await page.waitForLoadState('networkidle');
      }
      
      // System should recover
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      console.log('✅ Error recovery passed');
    });
  });
  
  test.describe('System Monitoring and Health Checks', () => {
    
    test('Health check endpoints', async ({ request }) => {
      console.log('🔄 Testing system health...');
      
      // Test health endpoint
      const healthResponse = await request.get('/api/health');
      expect(healthResponse.status()).toBe(200);
      
      const healthData = await healthResponse.json();
      expect(healthData.status).toBe('healthy');
      
      // Test readiness endpoint
      const readinessResponse = await request.get('/api/ready');
      expect(readinessResponse.status()).toBe(200);
      
      console.log('✅ System health checks passed');
    });
    
    test('System metrics and monitoring', async ({ page }) => {
      console.log('🔄 Testing system monitoring...');
      
      // Login and access monitoring
      await page.goto('/auth/login');
      await page.fill('[data-testid="email-input"]', testCredentials.email);
      await page.fill('[data-testid="password-input"]', testCredentials.password);
      await page.click('[data-testid="login-button"]');
      
      // Check if monitoring dashboard exists
      const monitoringLink = page.locator('a[href="/monitoring"]');
      if (await monitoringLink.isVisible()) {
        await monitoringLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify monitoring data
        await expect(page.locator('[data-testid="system-metrics"]')).toBeVisible();
        await expect(page.locator('[data-testid="uptime-metric"]')).toBeVisible();
      }
      
      console.log('✅ System monitoring passed');
    });
  });
});

// System test utilities
async function waitForSystemStability(page: any, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      break;
    } catch (e) {
      await page.waitForTimeout(1000);
    }
  }
}

async function verifySystemState(page: any, expectedState: string) {
  const systemStatus = await page.evaluate(() => {
    return document.readyState;
  });
  
  expect(systemStatus).toBe(expectedState);
}

async function simulateSystemLoad(page: any, operations: number) {
  const promises = [];
  
  for (let i = 0; i < operations; i++) {
    promises.push(
      page.evaluate(() => {
        return fetch('/api/health').then(r => r.status);
      })
    );
  }
  
  const results = await Promise.all(promises);
  return results.every(status => status === 200);
} 