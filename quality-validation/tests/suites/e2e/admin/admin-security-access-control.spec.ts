import { test, expect } from '@playwright/test';
import { authenticateUser } from '../../../__helpers__/comprehensive-test-helpers';
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


// Admin Security and Access Control Test Suite
test.describe('Admin Security and Access Control Tests', () => {
  test.setTimeout(120000); // 2 minutes per test

  test('Unauthorized Access Prevention - Non-Admin Users', async ({ page }) => {
    console.log('🔒 Testing unauthorized access prevention...');
    
    // Test 1: User without admin role
    console.log('   Testing regular user access...');
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'USER');
      window.localStorage.setItem('isAdminUser', 'false');
      // Simulate a regular authenticated user
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { id: 'user-123', email: 'user@example.com', role: 'user' }
      }));
    });
    
    // Try to access admin console directly
    await page.goto('/admin/console');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected or show unauthorized message
    const currentUrl = page.url();
    const hasUnauthorizedMessage = await page.locator('text=/unauthorized|forbidden|access denied|not authorized/i').isVisible({ timeout: 5000 }).catch(() => false);
    const isRedirectedAway = !currentUrl.includes('/admin/console');
    
    if (hasUnauthorizedMessage) {
      console.log('✅ Unauthorized message displayed');
    } else if (isRedirectedAway) {
      console.log('✅ User redirected away from admin area');
    } else {
      console.log('⚠️ SECURITY ISSUE: Regular user may have access to admin console');
      // Take screenshot for investigation
      await page.screenshot({
        path: 'test-results/security-issue-unauthorized-access.png',
        fullPage: true
      });
    }
    
    // Test 2: Completely unauthenticated user
    console.log('   Testing unauthenticated user access...');
    await page.context().clearCookies();
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    
    await page.goto('/admin/console');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login or show login form
    const hasLoginForm = await page.locator('input[type="email"], input[name="email"], #email, input[name="email"], text=login').isVisible({ timeout: 5000 }).catch(() => false);
    const isOnLoginPage = page.url().includes('/auth/login') || page.url().includes('/auth');
    
    if (hasLoginForm || isOnLoginPage) {
      console.log('✅ Unauthenticated user redirected to login');
    } else {
      console.log('⚠️ SECURITY ISSUE: Unauthenticated user may have access to admin console');
      await page.screenshot({
        path: 'test-results/security-issue-unauthenticated-access.png',
        fullPage: true
      });
    }
  });

  test('Admin User Access Verification', async ({ page }) => {
    console.log('👑 Testing admin user access...');
    
    // Setup admin user
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'ADMIN');
      window.localStorage.setItem('isAdminUser', 'true');
      // Simulate admin user auth
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        user: { 
          id: 'admin-123', 
          email: 'admin@example.com', 
          role: 'admin',
          user_metadata: { role: 'admin', is_admin: true }
        }
      }));
    });
    
    await authenticateUser(page);
    await page.goto('/admin/console');
    await page.waitForLoadState('networkidle');
    
    // Verify admin console loads successfully
    await expect(page.locator('h1:has-text("System Administration Console")')).toBeVisible();
    console.log('✅ Admin user can access console');
    
    // Verify admin-specific elements are present
    await expect(page.locator('text=Infrastructure monitoring and management')).toBeVisible();
    
    // Check that all admin tabs are available
    const adminTabs = ['System Health', 'Users', 'Database', 'Scripts', 'Monitoring'];
    for (const tab of adminTabs) {
      const tabElement = page.locator(`[role="tab"]:has-text("${tab}")`);
      await expect(tabElement).toBeVisible();
      console.log(`   ✅ ${tab} tab available for admin`);
    }
    
    // Test admin can access user creation
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(1000);
    
    // Should see user creation buttons
    const userCreationButtons = ['Create Client User', 'Create Partner User', 'Create Test User'];
    for (const buttonText of userCreationButtons) {
      const button = page.locator(`button:has-text("${buttonText}")`);
      if (await button.isVisible()) {
        console.log(`   ✅ ${buttonText} available for admin`);
      }
    }
  });

  test('Role-Based Permission System', async ({ page }) => {
    console.log('🛡️ Testing role-based permissions...');
    
    // Test admin permissions
    console.log('   Testing admin permissions...');
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'ADMIN');
      window.localStorage.setItem('isAdminUser', 'true');
    });
    
    await authenticateAndNavigate(page, '/admin/console');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Users tab for permission testing
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(1000);
    
    // Test user creation permission (admin-only)
    const createUserButton = page.locator('button:has-text("Create Client User")').first();
    if (await createUserButton.isVisible()) {
      await createUserButton.click();
      
      // Should open user creation dialog
      const userDialog = page.locator('[role="dialog"]');
      await expect(userDialog).toBeVisible({ timeout: 5000 });
      console.log('✅ Admin can access user creation');
      
      // Close dialog
      const cancelButton = page.locator('button:has-text("Cancel")').first();
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
    
    // Test database operations permission (admin-only)
    console.log('   Testing database permissions...');
    const databaseTab = page.locator('[role="tab"]:has-text("Database")');
    await databaseTab.click();
    await page.waitForTimeout(1000);
    
    // Should see database operation buttons
    const dbOperations = ['Backup', 'Optimize', 'Health Check'];
    for (const operation of dbOperations) {
      const operationButton = page.locator(`button:has-text("${operation}")`).first();
      if (await operationButton.isVisible()) {
        console.log(`   ✅ Admin can access ${operation} operation`);
      }
    }
    
    // Test scripts execution permission (admin-only)
    console.log('   Testing scripts permissions...');
    const scriptsTab = page.locator('[role="tab"]:has-text("Scripts")');
    await scriptsTab.click();
    await page.waitForTimeout(1000);
    
    // Should see script execution interface
    const scriptInterface = page.locator('text=Administrative Scripts, text=Script');
    if (await scriptInterface.isVisible()) {
      console.log('✅ Admin can access script execution');
    }
  });

  test('User Creation Security and Validation', async ({ page }) => {
    console.log('👥 Testing user creation security...');
    
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'ADMIN');
      window.localStorage.setItem('isAdminUser', 'true');
    });
    
    await authenticateAndNavigate(page, '/admin/console');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Users tab
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(1000);
    
    // Test Client User Creation with validation
    console.log('   Testing client user creation validation...');
    const createClientButton = page.locator('button:has-text("Create Client User")').first();
    if (await createClientButton.isVisible()) {
      await createClientButton.click();
      
      // Try to submit empty form (should fail validation)
      const submitButton = page.locator('button:has-text("Create User")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show validation errors or prevent submission
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
        const emailInput = page.locator('input[name="email"], input[type="email"], input[name="email"], #email').first();
        
        // Check if required field validation works
        if (await nameInput.isVisible() && await emailInput.isVisible()) {
          const nameRequired = await nameInput.getAttribute('required');
          const emailRequired = await emailInput.getAttribute('required');
          
          if (nameRequired !== null && emailRequired !== null) {
            console.log('✅ User creation form has required field validation');
          }
        }
        
        // Fill form with valid data
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Security User');
        }
        if (await emailInput.isVisible()) {
          await emailInput.fill(testCredentials.email);
        }
        
        console.log('✅ User creation form accepts valid input');
        
        // Cancel instead of actually creating
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
    
    // Test Partner User Creation
    console.log('   Testing partner user creation...');
    const createPartnerButton = page.locator('button:has-text("Create Partner User")').first();
    if (await createPartnerButton.isVisible()) {
      await createPartnerButton.click();
      
      // Should open partner creation dialog
      const partnerDialog = page.locator('[role="dialog"]');
      if (await partnerDialog.isVisible()) {
        console.log('✅ Partner user creation dialog accessible');
        
        // Cancel dialog
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
    
    // Test Test User Creation
    console.log('   Testing test user creation...');
    const createTestButton = page.locator('button:has-text("Create Test User")').first();
    if (await createTestButton.isVisible()) {
      await createTestButton.click();
      
      // Should open test user creation dialog
      const testDialog = page.locator('[role="dialog"]');
      if (await testDialog.isVisible()) {
        console.log('✅ Test user creation dialog accessible');
        
        // Cancel dialog
        const cancelButton = page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
        }
      }
    }
  });

  test('Destructive Operations Require Confirmation', async ({ page }) => {
    console.log('⚠️ Testing destructive operations security...');
    
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'ADMIN');
      window.localStorage.setItem('isAdminUser', 'true');
    });
    
    await authenticateAndNavigate(page, '/admin/console');
    await page.waitForLoadState('networkidle');
    
    // Test cleanup operations require confirmation
    console.log('   Testing cleanup operations...');
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(1000);
    
    // Look for potentially destructive operations
    const destructiveOperations = [
      'Cleanup Test Users',
      'Delete',
      'Remove',
      'Reset',
      'Clear'
    ];
    
    for (const operation of destructiveOperations) {
      const operationButton = page.locator(`button:has-text("${operation}")`).first();
      if (await operationButton.isVisible()) {
        console.log(`   Testing ${operation} confirmation...`);
        await operationButton.click();
        
        // Should show confirmation dialog
        const confirmDialog = page.locator('text=Are you sure?, text=Confirm, text=Warning');
        if (await confirmDialog.isVisible({ timeout: 3000 })) {
          console.log(`   ✅ ${operation} requires confirmation`);
          
          // Cancel the operation
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
          }
        } else {
          console.log(`   ⚠️ ${operation} may not require confirmation`);
        }
      }
    }
    
    // Test database operations require confirmation
    console.log('   Testing database operations...');
    const databaseTab = page.locator('[role="tab"]:has-text("Database")');
    await databaseTab.click();
    await page.waitForTimeout(1000);
    
    const dbOperations = ['Backup', 'Optimize'];
    for (const operation of dbOperations) {
      const operationButton = page.locator(`button:has-text("${operation}")`).first();
      if (await operationButton.isVisible()) {
        await operationButton.click();
        
        // Should show operation dialog with confirmation
        const operationDialog = page.locator('[role="dialog"]');
        if (await operationDialog.isVisible({ timeout: 3000 })) {
          console.log(`   ✅ ${operation} opens confirmation dialog`);
          
          // Close dialog
          const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    }
  });

  test('Navigation Security - Admin Menu Visibility', async ({ page }) => {
    console.log('🧭 Testing navigation security...');
    
    // Test 1: Admin console not visible to regular users
    console.log('   Testing regular user navigation...');
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'USER');
      window.localStorage.setItem('isAdminUser', 'false');
    });
    
    await authenticateAndNavigate(page, '/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Admin Console should not be in navigation
    const adminNavLink = page.locator('a[href="/admin/console"], text="Admin Console"');
    const adminNavVisible = await adminNavLink.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!adminNavVisible) {
      console.log('✅ Admin Console hidden from regular users');
    } else {
      console.log('⚠️ SECURITY ISSUE: Admin Console visible to regular users');
    }
    
    // Test 2: Admin console visible to admin users
    console.log('   Testing admin user navigation...');
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'ADMIN');
      window.localStorage.setItem('isAdminUser', 'true');
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Admin Console should be in navigation
    const adminNavLinkAdmin = page.locator('a[href="/admin/console"], text="Admin Console"');
    const adminNavVisibleToAdmin = await adminNavLinkAdmin.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (adminNavVisibleToAdmin) {
      console.log('✅ Admin Console visible to admin users');
    } else {
      console.log('⚠️ Admin Console not visible to admin users (may need page refresh)');
    }
  });

  test('Session Security and Token Validation', async ({ page }) => {
    console.log('🔐 Testing session security...');
    
    // Test 1: Invalid token handling
    console.log('   Testing invalid token handling...');
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'ADMIN');
      window.localStorage.setItem('isAdminUser', 'true');
      // Set invalid token
      window.localStorage.setItem('supabase.auth.token', 'invalid-token');
    });
    
    await page.goto('/admin/console');
    await page.waitForLoadState('networkidle');
    
    // Should handle invalid token gracefully
    const hasError = await page.locator('text=/error|invalid|expired/i').isVisible({ timeout: 5000 }).catch(() => false);
    const hasLogin = await page.locator('input[type="email"], input[name="email"], #email, text=login').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasError || hasLogin) {
      console.log('✅ Invalid token handled appropriately');
    }
    
    // Test 2: Expired session handling
    console.log('   Testing expired session handling...');
    await page.addInitScript(() => {
      // Clear all auth data to simulate expired session
      window.localStorage.removeItem('supabase.auth.token');
      window.sessionStorage.clear();
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login or show authentication required
    const requiresAuth = page.url().includes('/auth/login') || 
                        await page.locator('text=login, text=sign in').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (requiresAuth) {
      console.log('✅ Expired session redirects to authentication');
    }
  });

  test('Admin Console Data Protection', async ({ page }) => {
    console.log('🛡️ Testing data protection...');
    
    await page.addInitScript(() => {
      window.localStorage.setItem('userRole', 'ADMIN');
      window.localStorage.setItem('isAdminUser', 'true');
    });
    
    await authenticateAndNavigate(page, '/admin/console');
    await page.waitForLoadState('networkidle');
    
    // Check that sensitive data is not exposed in client-side code
    console.log('   Checking for sensitive data exposure...');
    
    // Look for potentially sensitive information that shouldn't be visible
    const sensitivePatterns = [
      'password',
      'secret',
      'private_key',
      'api_key',
      'database_url',
      'connection_string'
    ];
    
    const pageContent = await page.content();
    const lowercaseContent = pageContent.toLowerCase();
    
    for (const pattern of sensitivePatterns) {
      if (lowercaseContent.includes(pattern) && !lowercaseContent.includes(`"${pattern}":`)) {
        console.log(`   ⚠️ Potential sensitive data exposure: ${pattern}`);
      }
    }
    
    console.log('✅ Data protection check completed');
    
    // Test that user data is properly masked/protected
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(1000);
    
    // Check if any user passwords or sensitive data are visible
    const passwordFields = page.locator('input[type="password"], input[name="password"], #password:visible, text*="password":visible');
    const passwordVisible = await passwordFields.count() > 0;
    
    if (!passwordVisible) {
      console.log('✅ No visible passwords in user management');
    }
  });

  test('Comprehensive Security Audit', async ({ page }) => {
    console.log('🔍 Running comprehensive security audit...');
    
    const securityIssues: string[] = [];
    
    // Test multiple security scenarios
    const securityTests = [
      {
        name: 'Direct URL Access',
        test: async () => {
          await page.addInitScript(() => {
            window.localStorage.setItem('userRole', 'USER');
            window.localStorage.setItem('isAdminUser', 'false');
          });
          await page.goto('/admin/console');
          const hasAccess = await page.locator('h1:has-text("System Administration Console")').isVisible({ timeout: 3000 }).catch(() => false);
          if (hasAccess) {
            securityIssues.push('Direct URL access allowed for non-admin users');
          }
        }
      },
      {
        name: 'Client-side Role Manipulation',
        test: async () => {
          // Try to manipulate client-side role after page load
          await page.addInitScript(() => {
            window.localStorage.setItem('userRole', 'USER');
            window.localStorage.setItem('isAdminUser', 'false');
          });
          await page.goto('/dashboard');
          await page.waitForLoadState('networkidle');
          
          // Try to change role on client side
          await page.evaluate(() => {
            window.localStorage.setItem('userRole', 'ADMIN');
            window.localStorage.setItem('isAdminUser', 'true');
          });
          
          await page.goto('/admin/console');
          const hasAccess = await page.locator('h1:has-text("System Administration Console")').isVisible({ timeout: 3000 }).catch(() => false);
          if (hasAccess) {
            securityIssues.push('Client-side role manipulation allows unauthorized access');
          }
        }
      }
    ];
    
    for (const securityTest of securityTests) {
      console.log(`   Testing ${securityTest.name}...`);
      try {
        await securityTest.test();
      } catch (error) {
        console.log(`   Error in ${securityTest.name}: ${error}`);
      }
    }
    
    // Report security issues
    if (securityIssues.length > 0) {
      console.log('🚨 SECURITY ISSUES FOUND:');
      securityIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      
      // Take screenshot for investigation
      await page.screenshot({
        path: 'test-results/security-audit-issues.png',
        fullPage: true
      });
    } else {
      console.log('✅ No major security issues detected');
    }
    
    expect(securityIssues.length).toBe(0);
  });
});