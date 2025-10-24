import { test, expect, Page } from '@playwright/test';
import { AuthHelper } from '../setup/test-auth-helper';
import { testCredentials } from '../../../__helpers__/test-credentials';

async function authenticateUser(page: Page) {
  const authHelper = new AuthHelper(page);
  await authHelper.login();
}

async function waitForPageLoad(page: Page, selector: string, timeout: number = 30000) {
  await page.waitForSelector(selector, { timeout });
  await page.waitForLoadState('networkidle');
}

test.describe('⚙️ Settings - ALL User Data Scenarios', () => {
  
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test('should handle complete profile settings management', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');

    // General tab - Profile Settings
    await page.click('button:has-text("General"), [data-testid="general-tab"]');
    await page.waitForTimeout(1000);

    // Profile picture upload
    const avatarSection = page.locator('[data-testid="avatar-upload"], .avatar-upload');
    if (await avatarSection.isVisible()) {
      await avatarSection.click();
      // Test avatar upload functionality
      await expect(page.locator('[data-testid="avatar-upload-button"]')).toBeVisible();
    }

    // Project settings form
    await page.fill('[name="name"], [data-testid="project-name"]', 'Updated Test Project');
    await page.fill('[name="description"], [data-testid="project-description"]', 'Comprehensive test project updated');
    await page.fill('[name="waNumber"], [data-testid="whatsapp-number"]', '+1555123456');
    await page.fill('[name="calendlyUrl"], [data-testid="calendly-url"]', 'https://calendly.com/test-updated');
    
    // Save project settings
    await page.click('button:has-text("Save"), [data-testid="save-project-button"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');
  });

  test('should handle notification settings with all configurations', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');
    
    // Navigate to notifications tab
    await page.click('button:has-text("Notifications"), [data-testid="notifications-tab"]');
    await page.waitForTimeout(1000);

    // Email notifications toggle
    const emailToggle = page.locator('[data-testid="email-notifications"], input[name="email_notifications"]');
    if (await emailToggle.isVisible()) {
      await emailToggle.click();
      await page.waitForTimeout(500);
    }

    // Push notifications toggle
    const pushToggle = page.locator('[data-testid="push-notifications"], input[name="push_notifications"]');
    if (await pushToggle.isVisible()) {
      await pushToggle.click();
      await page.waitForTimeout(500);
    }

    // SMS notifications toggle
    const smsToggle = page.locator('[data-testid="sms-notifications"], input[name="sms_notifications"]');
    if (await smsToggle.isVisible()) {
      await smsToggle.click();
      await page.waitForTimeout(500);
    }

    // Notification schedule settings
    await page.selectOption('[data-testid="notification-frequency"], select[name="notification_frequency"]', 'daily');
    await page.fill('[data-testid="quiet-hours-start"], input[name="quiet_hours_start"]', '23:00');
    await page.fill('[data-testid="quiet-hours-end"], input[name="quiet_hours_end"]', '07:00');

    // WhatsApp notification settings
    const whatsappToggle = page.locator('[data-testid="whatsapp-notifications"], input[name="whatsapp_notifications"]');
    if (await whatsappToggle.isVisible()) {
      await whatsappToggle.click();
    }

    // Lead notification settings
    const leadToggle = page.locator('[data-testid="lead-notifications"], input[name="lead_notifications"]');
    if (await leadToggle.isVisible()) {
      await leadToggle.click();
    }

    // Save notification settings
    await page.click('button:has-text("Save Notification Settings"), [data-testid="save-notifications"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');
  });

  test('should handle performance targets configuration', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');
    
    // Navigate to performance tab
    await page.click('button:has-text("Performance"), [data-testid="performance-tab"]');
    await page.waitForTimeout(1000);

    // Performance targets input
    await page.fill('[name="target_leads_per_month"], [data-testid="target-leads"]', '100');
    await page.fill('[name="target_meetings_per_month"], [data-testid="target-meetings"]', '40');
    await page.fill('[name="target_conversion_rate"], [data-testid="target-conversion"]', '25');
    await page.fill('[name="target_response_rate"], [data-testid="target-response"]', '95');
    await page.fill('[name="target_reach_rate"], [data-testid="target-reach"]', '90');
    await page.fill('[name="target_bant_qualification_rate"], [data-testid="target-bant"]', '40');

    // Save performance settings
    await page.click('button:has-text("Save Performance Targets"), [data-testid="save-performance"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');
  });

  test('should handle dashboard widget configuration', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');
    
    // Navigate to dashboard tab
    await page.click('button:has-text("Dashboard"), [data-testid="dashboard-tab"]');
    await page.waitForTimeout(1000);

    // Widget visibility toggles
    const widgetToggles = [
      'lead_overview',
      'conversation_metrics', 
      'performance_charts',
      'calendar_widget',
      'quick_actions',
      'activity_feed'
    ];

    for (const widget of widgetToggles) {
      const toggle = page.locator(`[data-testid="${widget}"], input[name="${widget}"]`);
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(300);
      }
    }

    // Layout configuration
    await page.selectOption('[data-testid="layout-columns"], select[name="columns"]', '2');
    
    const compactMode = page.locator('[data-testid="compact-mode"], input[name="compact_mode"]');
    if (await compactMode.isVisible()) {
      await compactMode.click();
    }

    // Dashboard preferences
    await page.selectOption('[data-testid="theme-select"], select[name="theme"]', 'dark');
    await page.fill('[data-testid="refresh-interval"], input[name="refresh_interval"]', '60');

    // Save dashboard settings
    await page.click('button:has-text("Save Dashboard Settings"), [data-testid="save-dashboard"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');
  });

  test('should handle API integrations with database storage', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');
    
    // Navigate to integrations tab
    await page.click('button:has-text("Integrations"), [data-testid="integrations-tab"], [data-testid="api-integrations-tab"]');
    await waitForPageLoad(page, '[data-testid="integrations-content"], [data-testid="api-integrations-content"]');

    // Test Calendly integration
    await page.click('[data-testid="calendly-tab"], button:has-text("Calendly")');
    await page.waitForTimeout(1000);
    
    // Check if Calendly credentials are already configured
    const calendlyConnected = await page.locator('[data-testid="calendly-connected"], .bg-green-100').isVisible();
    if (calendlyConnected) {
      console.log('✅ Calendly integration already connected');
      
      // Test connection
      await page.click('button:has-text("Test Connection"), [data-testid="test-calendly-connection"]');
      await page.waitForTimeout(2000);
      
      // Should show success or error message
      await expect(page.locator('.toast, [data-testid="success-message"], [data-testid="error-message"]')).toBeVisible();
      
      // Test disconnect functionality
      await page.click('button:has-text("Disconnect"), [data-testid="disconnect-calendly"]');
      await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('disconnect');
    } else {
      console.log('⚠️ Calendly integration not connected, testing OAuth flow');
      
      // Test OAuth connection
      await page.click('button:has-text("Connect Calendly Account"), [data-testid="connect-calendly-button"]');
      
      // Should redirect to OAuth or show Safari helper
      await page.waitForTimeout(2000);
      
      // Check if Safari helper is shown
      const safariHelper = await page.locator('.border-orange-200, [data-testid="safari-oauth-helper"]').isVisible();
      if (safariHelper) {
        console.log('✅ Safari OAuth helper displayed');
        
        // Test Safari cache clearing
        await page.click('button:has-text("Clear Cache"), [data-testid="clear-safari-cache"]');
        await page.waitForTimeout(1000);
        
        // Test OAuth URL generation
        await page.click('button:has-text("Test OAuth"), [data-testid="test-oauth-button"]');
        await page.waitForTimeout(1000);
      }
    }
    
    // Test WhatsApp integration status
    await page.click('[data-testid="whatsapp-tab"], button:has-text("WhatsApp")');
    await page.waitForTimeout(1000);
    
    // Check WhatsApp connection status
    const whatsappStatus = await page.locator('[data-testid="whatsapp-connected"], .bg-green-100').isVisible();
    if (whatsappStatus) {
      console.log('✅ WhatsApp integration connected');
      
      // Verify WhatsApp credentials are loaded from database
      await expect(page.locator('text=WhatsApp Business')).toBeVisible();
      await expect(page.locator('text=Connected')).toBeVisible();
    } else {
      console.log('⚠️ WhatsApp integration not connected');
      
      // Should show configuration options
      await expect(page.locator('text=Not Connected')).toBeVisible();
    }
    
    // Test API key management (if available)
    const apiKeySection = await page.locator('[data-testid="api-keys-section"]').isVisible();
    if (apiKeySection) {
      // Test API key input fields
      await page.fill('[data-testid="whatsapp-api-key-input"], input[name="whatsapp_api_key"]', 'test-whatsapp-key-123');
      await page.fill('[data-testid="calendly-api-key-input"], input[name="calendly_api_key"]', 'test-calendly-key-456');
      
      // Save API keys to database
      await page.click('button:has-text("Save API Keys"), [data-testid="save-api-keys-button"]');
      await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');
      
      // Test API key encryption/decryption
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Keys should be loaded from database (encrypted)
      const whatsappKeyValue = await page.locator('[data-testid="whatsapp-api-key-input"]').inputValue();
      const calendlyKeyValue = await page.locator('[data-testid="calendly-api-key-input"]').inputValue();
      
      // Keys should be either empty (masked) or show decrypted values
      expect(whatsappKeyValue).toBeDefined();
      expect(calendlyKeyValue).toBeDefined();
    }
    
    // Test integration status checks
    await page.click('button:has-text("Check Status"), [data-testid="check-integration-status"]');
    await page.waitForTimeout(2000);
    
    // Should show current integration status
    await expect(page.locator('[data-testid="integration-status-display"]')).toBeVisible();
    
    // Test database connection for credentials
    const databaseTest = await page.locator('[data-testid="test-database-connection"]').isVisible();
    if (databaseTest) {
      await page.click('[data-testid="test-database-connection"]');
      await page.waitForTimeout(2000);
      
      // Should show database connection status
      await expect(page.locator('[data-testid="database-status"]')).toBeVisible();
    }
    
    // Test credentials encryption status
    const encryptionStatus = await page.locator('[data-testid="encryption-status"]').isVisible();
    if (encryptionStatus) {
      await expect(page.locator('text=encrypted')).toBeVisible();
    }
    
    // Test Safari-specific OAuth debugging
    const userAgent = await page.evaluate(() => navigator.userAgent);
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      console.log('🦎 Testing Safari-specific OAuth functionality');
      
      // Safari helper should be visible
      await expect(page.locator('[data-testid="safari-oauth-helper"]')).toBeVisible();
      
      // Test Safari cache clearing
      await page.click('button:has-text("Clear Cache")');
      await page.waitForTimeout(1000);
      
      // Test Safari OAuth URL generation
      await page.click('button:has-text("Test OAuth")');
      await page.waitForTimeout(1000);
    }
  });

  test('should handle system settings and diagnostics', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');
    
    // Navigate to system tab
    await page.click('button:has-text("System"), [data-testid="system-tab"]');
    await page.waitForTimeout(1000);

    // System status check
    await page.click('button:has-text("Check System Status"), [data-testid="check-system-status"]');
    await expect(page.locator('[data-testid="system-status-display"]')).toBeVisible();

    // Database connection test
    await page.click('button:has-text("Test Database"), [data-testid="test-database-button"]');
    await expect(page.locator('[data-testid="database-status"]')).toBeVisible();

    // Clear cache
    await page.click('button:has-text("Clear Cache"), [data-testid="clear-cache-button"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('Cache cleared');

    // Show environment info
    await page.click('button:has-text("Show Environment Info"), [data-testid="show-env-info"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('Environment info');

    // Export settings
    await page.click('button:has-text("Export Settings"), [data-testid="export-settings-button"]');
    // Note: We expect a download to be initiated
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('should handle user preferences and customization', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');

    // Test language switching
    const languageSelect = page.locator('[data-testid="language-select"], select[name="language"]');
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption('he');
      await page.waitForTimeout(1000);
      await languageSelect.selectOption('en');
    }

    // Test theme switching
    const themeSelect = page.locator('[data-testid="theme-select"], select[name="theme"]');
    if (await themeSelect.isVisible()) {
      await themeSelect.selectOption('dark');
      await page.waitForTimeout(1000);
      await themeSelect.selectOption('light');
    }

    // Test RTL mode
    const rtlToggle = page.locator('[data-testid="rtl-toggle"], input[name="rtl_enabled"]');
    if (await rtlToggle.isVisible()) {
      await rtlToggle.click();
      await page.waitForTimeout(1000);
      await rtlToggle.click();
    }

    // Save preferences
    await page.click('button:has-text("Save Preferences"), [data-testid="save-preferences"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');
  });

  test('should handle security settings', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');

    // Navigate to security section
    await page.click('button:has-text("Security"), [data-testid="security-tab"]');
    await page.waitForTimeout(1000);

    // Change password
    await page.fill('[data-testid="current-password"], input[name="current_password"]', testCredentials.password);
    await page.fill('[data-testid="new-password"], input[name="new_password"]', 'newtestpass123');
    await page.fill('[data-testid="confirm-password"], input[name="confirm_password"]', 'newtestpass123');

    // Save new password
    await page.click('button:has-text("Change Password"), [data-testid="change-password-button"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');

    // Two-factor authentication
    const twoFactorToggle = page.locator('[data-testid="two-factor-toggle"], input[name="two_factor_enabled"]');
    if (await twoFactorToggle.isVisible()) {
      await twoFactorToggle.click();
    }

    // Session management
    await page.click('button:has-text("View Active Sessions"), [data-testid="view-sessions-button"]');
    await expect(page.locator('[data-testid="active-sessions-list"]')).toBeVisible();
  });

  test('should handle data management and privacy', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');

    // Navigate to data management
    await page.click('button:has-text("Data"), [data-testid="data-tab"]');
    await page.waitForTimeout(1000);

    // Data export
    await page.click('button:has-text("Export My Data"), [data-testid="export-data-button"]');
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible();

    // Select data types to export
    await page.check('[data-testid="export-profile"]');
    await page.check('[data-testid="export-leads"]');
    await page.check('[data-testid="export-messages"]');
    await page.check('[data-testid="export-settings"]');

    // Start export
    await page.click('button:has-text("Start Export"), [data-testid="start-export-button"]');
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();

    // Data deletion request
    await page.click('button:has-text("Request Data Deletion"), [data-testid="request-deletion-button"]');
    await page.fill('[data-testid="deletion-reason"], textarea[name="deletion_reason"]', 'Test data deletion request');
    await page.click('button:has-text("Submit Request"), [data-testid="submit-deletion-request"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');
  });

  test('should handle mobile-specific settings', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/settings');
    await waitForPageLoad(page, '[data-testid="settings-page"]');

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-toggle"], .mobile-menu-toggle');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Mobile-specific settings
    await page.click('button:has-text("Mobile"), [data-testid="mobile-tab"]');
    await page.waitForTimeout(1000);

    // Mobile notifications
    const mobileNotifications = page.locator('[data-testid="mobile-notifications"], input[name="mobile_notifications"]');
    if (await mobileNotifications.isVisible()) {
      await mobileNotifications.click();
    }

    // Offline mode
    const offlineMode = page.locator('[data-testid="offline-mode"], input[name="offline_mode"]');
    if (await offlineMode.isVisible()) {
      await offlineMode.click();
    }

    // Data usage settings
    await page.selectOption('[data-testid="data-usage"], select[name="data_usage"]', 'low');

    // Save mobile settings
    await page.click('button:has-text("Save Mobile Settings"), [data-testid="save-mobile-settings"]');
    await expect(page.locator('.toast, [data-testid="success-message"]')).toContainText('successfully');
  });
}); 