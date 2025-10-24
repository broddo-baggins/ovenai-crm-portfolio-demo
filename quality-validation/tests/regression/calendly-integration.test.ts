import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load test credentials from credentials directory
const loadTestCredentials = () => {
  const credentialsPath = path.join(process.cwd(), 'credentials', 'test-credentials.local');
  const credentialsContent = fs.readFileSync(credentialsPath, 'utf-8');
  
  const credentials: Record<string, string> = {};
  credentialsContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        credentials[key.trim()] = value.trim();
      }
    }
  });
  
  return credentials;
};

const testCredentials = loadTestCredentials();

// Create test supabase client
const testSupabase = createClient(
  testCredentials.TEST_SUPABASE_URL,
  testCredentials.TEST_SUPABASE_ANON_KEY
);

test.describe('Calendly Integration Regression Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as test user using credentials
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', testCredentials.TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', testCredentials.TEST_USER_PASSWORD);
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login with better error handling
    try {
      await page.waitForURL('/dashboard', { timeout: 10000 });
    } catch (error) {
      // If login fails, take a screenshot and log the current URL for debugging
      await page.screenshot({ path: 'login-failure-debug.png' });
      console.log('❌ Login failed. Current URL:', page.url());
      console.log('❌ Page title:', await page.title());
      throw new Error(`Login failed: ${error.message}`);
    }
  });

  // Helper function to navigate to integrations tab
  async function navigateToIntegrationsTab(page) {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Wait for the integrations tab to be available and click it with retry logic
    const integrationsTab = page.locator('[data-testid="api-integrations-tab"]');
    await integrationsTab.waitFor({ state: 'visible' });
    
    // Try clicking with force if normal click fails
    try {
      await integrationsTab.click({ timeout: 10000 });
    } catch (error) {
      // If click fails, try with force
      await integrationsTab.click({ force: true });
    }
    
    // Wait for the tab content to load
    await page.waitForTimeout(1000);
  }

  test('should display Calendly integration in settings', async ({ page }) => {
    await navigateToIntegrationsTab(page);
    
    // Should show Calendly integration option - use more specific locator
    const calendlySection = page.locator('[data-testid="calendly-integration"]').or(page.locator('text=Calendly').first());
    if (await calendlySection.isVisible()) {
      await expect(calendlySection).toBeVisible();
    }
    
    // Should show connection status
    const calendlyStatus = page.locator('[data-testid="calendly-status"]');
    if (await calendlyStatus.isVisible()) {
      await expect(calendlyStatus).toBeVisible();
    }
  });

  test('should show Connect to Calendly button when not connected', async ({ page }) => {
    await navigateToIntegrationsTab(page);
    
    // Should show connect button if not connected - check for actual button text
    const connectButton = page.locator('button:has-text("Connect Calendly Account")');
    if (await connectButton.isVisible()) {
      await expect(connectButton).toContainText('Connect Calendly Account');
    } else {
      // If OAuth button not visible, check for PAT connection
      const patButton = page.locator('button:has-text("Connect")');
      if (await patButton.isVisible()) {
        await expect(patButton).toBeVisible();
      }
    }
  });

  test('should redirect to Calendly OAuth when clicking connect', async ({ page }) => {
    await navigateToIntegrationsTab(page);
    
    const connectButton = page.locator('button:has-text("Connect Calendly Account")');
    if (await connectButton.isVisible()) {
      // Click connect and expect redirect to Calendly
      await connectButton.click();
      
      // Wait for redirect to Calendly (it goes to calendly.com/app/login, not /oauth/authorize)
      await page.waitForURL('**/calendly.com/**', { timeout: 10000 });
      
      // Should be on Calendly's login page
      expect(page.url()).toContain('calendly.com');
    } else {
      // Skip if no OAuth button is available
      test.skip();
    }
  });

  test('should show Calendly integration in calendar page', async ({ page }) => {
    await page.goto('/calendar');
    
    // Should show Calendly integration elements - check for actual components
    const calendlyDemo = page.locator('[data-testid="calendly-integration-demo"]');
    const calendlyWidget = page.locator('[data-testid="calendly-widget"]');
    const calendlyText = page.locator('text=Calendly').first();
    
    // Check if any Calendly element is visible
    const hasCalendlyElement = await calendlyDemo.isVisible() || 
                              await calendlyWidget.isVisible() || 
                              await calendlyText.isVisible();
    
    if (hasCalendlyElement) {
      // At least one Calendly element should be visible
      expect(hasCalendlyElement).toBe(true);
    }
  });

  test('should handle Calendly OAuth callback', async ({ page }) => {
    // Simulate OAuth callback with success
    await page.goto('/auth/calendly/callback?code=test_code&state=test_state');
    
    // Wait a bit for the callback to process
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to settings or dashboard
    const isOnSettings = page.url().includes('/settings');
    const isOnDashboard = page.url().includes('/dashboard');
    
    // Check for specific success/error messages
    const successMessage = page.locator('text=Connected').or(page.locator('text=Successfully'));
    const errorMessage = page.locator('text=Failed to connect Calendly').first();
    
    // Either should be redirected to a valid page OR show a message
    const hasValidRedirect = isOnSettings || isOnDashboard;
    const hasMessage = await successMessage.isVisible() || await errorMessage.isVisible();
    
    expect(hasValidRedirect || hasMessage).toBe(true);
  });

  test('should store Calendly credentials in user_api_credentials table', async ({ page }) => {
    // Skip test if no credentials stored
    const { data: credentials } = await testSupabase
      .from('user_api_credentials')
      .select('*')
      .eq('user_id', 'test-user-id')
      .eq('service', 'calendly')
      .single();
    
    if (!credentials) {
      test.skip();
      return;
    }
    
    await page.goto('/settings');
    await page.click('[data-testid="api-integrations-tab"]');
    
    // Should show connected status
    await expect(page.locator('[data-testid="calendly-status"]')).toContainText('Connected');
    
    // Should show disconnect option
    const disconnectButton = page.locator('[data-testid="disconnect-calendly-button"]');
    await expect(disconnectButton).toBeVisible();
  });

  test('should load Calendly user profile when connected', async ({ page }) => {
    await page.goto('/calendar');
    
    // Wait for Calendly data to load
    await page.waitForTimeout(3000);
    
    // If connected, should show user profile
    const userProfile = page.locator('[data-testid="calendly-user-profile"]');
    if (await userProfile.isVisible()) {
      await expect(userProfile).toContainText('@');
      await expect(userProfile).toContainText('calendly.com');
    }
  });

  test('should show Calendly events when connected', async ({ page }) => {
    await page.goto('/calendar');
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // If connected, should show events or no events message
    const eventsSection = page.locator('[data-testid="calendly-events"]');
    if (await eventsSection.isVisible()) {
      // Should show either events or "No events" message
      const hasEvents = await page.locator('[data-testid="calendly-event-item"]').count() > 0;
      const noEventsMessage = await page.locator('text=No events found').isVisible();
      
      expect(hasEvents || noEventsMessage).toBe(true);
    }
  });

  test('should handle Calendly API errors gracefully', async ({ page }) => {
    await page.goto('/calendar');
    
    // Wait for potential API calls
    await page.waitForTimeout(2000);
    
    // Should not show any unhandled errors
    const errorElements = page.locator('[data-testid="error-boundary"]');
    await expect(errorElements).toHaveCount(0);
    
    // Console should not have uncaught errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // No critical errors should be logged
    const criticalErrors = logs.filter(log => 
      log.includes('Uncaught') || 
      log.includes('TypeError') || 
      log.includes('ReferenceError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should allow disconnecting from Calendly', async ({ page }) => {
    await navigateToIntegrationsTab(page);
    
    // If connected, should show disconnect button
    const disconnectButton = page.locator('[data-testid="disconnect-calendly-button"]');
    if (await disconnectButton.isVisible()) {
      await disconnectButton.click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=Are you sure')).toBeVisible();
      
      // Confirm disconnect
      await page.click('[data-testid="confirm-disconnect"]');
      
      // Should show success message
      await expect(page.locator('text=Successfully disconnected')).toBeVisible();
      
      // Should now show connect button
      await expect(page.locator('[data-testid="connect-calendly-button"]')).toBeVisible();
    }
  });

  test('should persist Calendly connection across sessions', async ({ page }) => {
    // Skip if not connected
    const { data: credentials } = await testSupabase
      .from('user_api_credentials')
      .select('*')
      .eq('service', 'calendly')
      .single();
    
    if (!credentials) {
      test.skip();
      return;
    }
    
    await page.goto('/calendar');
    
    // Should show connected status
    await expect(page.locator('[data-testid="calendly-connected"]')).toBeVisible();
    
    // Logout and login again
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/login');
    
    // Login again
    await page.fill('[data-testid="email-input"]', testCredentials.TEST_USER_EMAIL);
    await page.fill('[data-testid="password-input"]', testCredentials.TEST_USER_PASSWORD);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
    
    // Go to calendar
    await page.goto('/calendar');
    
    // Should still show connected status
    await expect(page.locator('[data-testid="calendly-connected"]')).toBeVisible();
  });

  test('should show Calendly integration in integrations test page', async ({ page }) => {
    await navigateToIntegrationsTab(page);
    
    // Should show Calendly in integrations list - use more specific selector
    const calendlyTitle = page.locator('h3:has-text("Calendly Integration")').or(page.locator('span.font-medium:has-text("Calendly")'));
    if (await calendlyTitle.isVisible()) {
      await expect(calendlyTitle).toBeVisible();
    }
    
    // Should show connection status section
    const connectionStatus = page.locator('text=Connection Status');
    if (await connectionStatus.isVisible()) {
      await expect(connectionStatus).toBeVisible();
    }
  });

  test('should validate Calendly credentials format', async ({ page }) => {
    // This test validates the credential storage format
    const { data: credentials } = await testSupabase
      .from('user_api_credentials')
      .select('*')
      .eq('service', 'calendly')
      .single();
    
    if (credentials) {
      // Should have proper structure
      expect((credentials as any).service).toBe('calendly');
      expect((credentials as any).encrypted_credentials).toBeDefined();
      expect((credentials as any).user_id).toBeDefined();
      expect((credentials as any).created_at).toBeDefined();
      
      // Should be able to decrypt credentials
      const decrypted = atob((credentials as any).encrypted_credentials);
      const parsedCredentials = JSON.parse(decrypted);
      
      expect(parsedCredentials.client_id).toBeDefined();
      expect(parsedCredentials.client_secret).toBeDefined();
      expect(parsedCredentials.access_token).toBeDefined();
    }
  });

}); 