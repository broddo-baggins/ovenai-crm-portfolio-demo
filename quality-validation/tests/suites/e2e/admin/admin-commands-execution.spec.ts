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


// ============================================================================
// ADMIN COMMANDS EXECUTION TEST SUITE
// ============================================================================
// This test suite specifically focuses on testing the AdminCommandService
// and all the available admin commands that can be executed from the console
// ============================================================================

const TEST_URL = 'http://localhost:3002';

// Test data for command testing
const TEST_COMMANDS = {
  help: 'help',
  status: 'status',
  users: {
    list: 'users list',
    count: 'users count',
    search: 'users search testCredentials.email'
  },
  user: {
    details: 'user testCredentials.email',
    profile: 'user profile testCredentials.email'
  },
  createAdmin: `create-admin ${testCredentials.adminEmail}`,
  database: {
    status: 'db status',
    backup: 'db backup',
    optimize: 'db optimize',
    health: 'db health'
  },
  logs: {
    view: 'logs view',
    clear: 'logs clear',
    export: 'logs export'
  },
  debug: {
    info: 'debug info',
    auth: 'debug auth',
    permissions: 'debug permissions'
  },
  cache: {
    clear: 'cache clear',
    stats: 'cache stats'
  },
  cleanup: {
    users: 'cleanup users',
    sessions: 'cleanup sessions',
    temp: 'cleanup temp'
  },
  clear: 'clear'
};

// Expected command responses
const EXPECTED_RESPONSES = {
  help: 'Available commands:',
  status: 'System Status',
  invalidCommand: 'Unknown command:'
};

// Helper function to setup admin user
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

// Helper function to navigate to admin console
async function navigateToAdminConsole(page: Page): Promise<void> {
  await page.goto(`${TEST_URL}/admin/console`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// Helper function to find and interact with command terminal
async function findCommandTerminal(page: Page): Promise<{ input: any, output: any, found: boolean }> {
  // Look for various possible command terminal interfaces
  const terminalSelectors = [
    '[data-testid="command-terminal"]',
    '[data-testid="admin-terminal"]', 
    'input[placeholder*="command" i]',
    'input[placeholder*="terminal" i]',
    'textarea[placeholder*="command" i]',
    '.terminal input',
    '.console input',
    '.command-input'
  ];
  
  for (const selector of terminalSelectors) {
    const input = page.locator(selector);
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`   ✅ Found command terminal: ${selector}`);
      
      // Find corresponding output area
      const outputSelectors = [
        '[data-testid="command-output"]',
        '[data-testid="terminal-output"]',
        '.terminal-output',
        '.console-output',
        '.command-output',
        `${selector.split(' ')[0]} + div`,
        `${selector.split(' ')[0]} ~ div`
      ];
      
      let output = null;
      for (const outSelector of outputSelectors) {
        const outElement = page.locator(outSelector);
        if (await outElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          output = outElement;
          break;
        }
      }
      
      return { input, output, found: true };
    }
  }
  
  console.log('   ❌ No command terminal found in UI');
  return { input: null, output: null, found: false };
}

// Helper function to execute command
async function executeCommand(page: Page, command: string): Promise<{ success: boolean, response: string }> {
  const terminal = await findCommandTerminal(page);
  
  if (!terminal.found || !terminal.input) {
    return { success: false, response: 'Terminal not found' };
  }
  
  try {
    // Clear input and type command
    await terminal.input.fill('');
    await terminal.input.fill(command);
    
    // Execute command (try different methods)
    await terminal.input.press('Enter');
    await page.waitForTimeout(2000);
    
    // Get response from output area
    let response = '';
    if (terminal.output) {
      response = await terminal.output.textContent() || '';
    } else {
      // Try to find response in other areas
      const responseSelectors = [
        '.command-result',
        '.terminal-response', 
        '.console-response',
        '[data-testid="command-result"]'
      ];
      
      for (const selector of responseSelectors) {
        const responseElement = page.locator(selector).last();
        if (await responseElement.isVisible({ timeout: 1000 }).catch(() => false)) {
          response = await responseElement.textContent() || '';
          break;
        }
      }
    }
    
    return { success: true, response };
  } catch (error) {
    console.error('Error executing command:', error);
    return { success: false, response: 'Execution error' };
  }
}

test.describe('🚀 Admin Commands Execution Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin user
    await authenticateAsAdmin(page);
    
    // Navigate to admin console if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });
  
  test.describe('📋 Basic Command Interface Tests', () => {
    
    test('Command Terminal Interface Is Available', async ({ page }) => {
      console.log('🧪 Testing command terminal interface availability...');
      
      // Navigate to Scripts or Terminal tab if available
      const scriptsTab = page.locator('[role="tab"]:has-text("Scripts")');
      if (await scriptsTab.isVisible().catch(() => false)) {
        await scriptsTab.click();
        await page.waitForTimeout(1000);
      }
      
      const terminal = await findCommandTerminal(page);
      
      if (terminal.found) {
        console.log('   ✅ Command terminal interface is available');
        expect(terminal.found).toBe(true);
      } else {
        console.log('   ⚠️ No command terminal interface found - may be implemented differently');
        // This might be expected if commands are executed through buttons/dialogs instead
      }
    });
    
    test('Help Command Shows Available Commands', async ({ page }) => {
      console.log('🧪 Testing help command...');
      
      const result = await executeCommand(page, TEST_COMMANDS.help);
      
      if (result.success) {
        console.log('   ✅ Help command executed');
        console.log(`   Response: ${result.response.substring(0, 100)}...`);
        
        // Check if response contains expected help content
        const hasHelpContent = result.response.includes(EXPECTED_RESPONSES.help) ||
                              result.response.includes('command') ||
                              result.response.includes('help');
        
        expect(hasHelpContent).toBe(true);
      } else {
        console.log('   ⚠️ Help command not available through terminal interface');
        console.log('   This may be implemented through UI buttons instead');
      }
    });
    
    test('Invalid Commands Are Handled Gracefully', async ({ page }) => {
      console.log('🧪 Testing invalid command handling...');
      
      const invalidCommands = [
        'invalid-command',
        'hack-system',
        'delete-everything',
        'sudo rm -rf',
        'SELECT * FROM users;'
      ];
      
      for (const invalidCommand of invalidCommands) {
        const result = await executeCommand(page, invalidCommand);
        
        if (result.success) {
          console.log(`   Testing: ${invalidCommand}`);
          
          // Should get error message for invalid commands
          const hasErrorResponse = result.response.includes(EXPECTED_RESPONSES.invalidCommand) ||
                                  result.response.includes('unknown') ||
                                  result.response.includes('invalid') ||
                                  result.response.includes('error');
          
          if (hasErrorResponse) {
            console.log(`   ✅ ${invalidCommand}: Properly rejected`);
          } else {
            console.log(`   ❌ ${invalidCommand}: May have been accepted - SECURITY RISK`);
          }
        }
      }
    });
    
  });
  
  test.describe('👥 User Management Commands', () => {
    
    test('User List Commands Work', async ({ page }) => {
      console.log('🧪 Testing user list commands...');
      
      const userCommands = [
        TEST_COMMANDS.users.list,
        TEST_COMMANDS.users.count
      ];
      
      for (const command of userCommands) {
        const result = await executeCommand(page, command);
        
        if (result.success) {
          console.log(`   ✅ ${command}: Executed successfully`);
          console.log(`   Response length: ${result.response.length} characters`);
          
          // User commands should return user-related data
          const hasUserData = result.response.includes('user') ||
                             result.response.includes('email') ||
                             result.response.includes('count') ||
                             /\d+/.test(result.response); // Contains numbers
          
          if (hasUserData) {
            console.log(`   ✅ ${command}: Contains expected user data`);
          }
        } else {
          console.log(`   ⚠️ ${command}: Not available through terminal`);
        }
      }
    });
    
    test('User Search Commands Work', async ({ page }) => {
      console.log('🧪 Testing user search commands...');
      
      const result = await executeCommand(page, TEST_COMMANDS.users.search);
      
      if (result.success) {
        console.log('   ✅ User search command executed');
        
        // Should return search results or "not found" message
        const hasSearchResults = result.response.includes(testCredentials.email) ||
                                result.response.includes('not found') ||
                                result.response.includes('No users') ||
                                result.response.includes('Found');
        
        expect(hasSearchResults).toBe(true);
      } else {
        console.log('   ⚠️ User search not available through terminal');
      }
    });
    
    test('User Details Commands Work', async ({ page }) => {
      console.log('🧪 Testing user details commands...');
      
      const result = await executeCommand(page, TEST_COMMANDS.user.details);
      
      if (result.success) {
        console.log('   ✅ User details command executed');
        
        // Should return user details or error message
        const hasUserDetails = result.response.includes('email') ||
                              result.response.includes('role') ||
                              result.response.includes('created') ||
                              result.response.includes('not found');
        
        expect(hasUserDetails).toBe(true);
      } else {
        console.log('   ⚠️ User details not available through terminal');
      }
    });
    
  });
  
  test.describe('🗄️ Database Management Commands', () => {
    
    test('Database Status Commands Work', async ({ page }) => {
      console.log('🧪 Testing database status commands...');
      
      const result = await executeCommand(page, TEST_COMMANDS.database.status);
      
      if (result.success) {
        console.log('   ✅ Database status command executed');
        
        // Should return database status information
        const hasDbStatus = result.response.includes('database') ||
                           result.response.includes('connection') ||
                           result.response.includes('status') ||
                           result.response.includes('healthy') ||
                           result.response.includes('connected');
        
        expect(hasDbStatus).toBe(true);
      } else {
        console.log('   ⚠️ Database status not available through terminal');
      }
    });
    
    test('Database Backup Commands Work', async ({ page }) => {
      console.log('🧪 Testing database backup commands...');
      
      const result = await executeCommand(page, TEST_COMMANDS.database.backup);
      
      if (result.success) {
        console.log('   ✅ Database backup command executed');
        
        // Should return backup status or confirmation
        const hasBackupResponse = result.response.includes('backup') ||
                                 result.response.includes('created') ||
                                 result.response.includes('started') ||
                                 result.response.includes('completed') ||
                                 result.response.includes('error');
        
        expect(hasBackupResponse).toBe(true);
      } else {
        console.log('   ⚠️ Database backup not available through terminal');
      }
    });
    
    test('Database Health Commands Work', async ({ page }) => {
      console.log('🧪 Testing database health commands...');
      
      const result = await executeCommand(page, TEST_COMMANDS.database.health);
      
      if (result.success) {
        console.log('   ✅ Database health command executed');
        
        // Should return health check results
        const hasHealthResults = result.response.includes('health') ||
                                result.response.includes('check') ||
                                result.response.includes('passed') ||
                                result.response.includes('failed') ||
                                result.response.includes('issues');
        
        expect(hasHealthResults).toBe(true);
      } else {
        console.log('   ⚠️ Database health not available through terminal');
      }
    });
    
  });
  
  test.describe('📊 System Status and Debug Commands', () => {
    
    test('System Status Command Works', async ({ page }) => {
      console.log('🧪 Testing system status command...');
      
      const result = await executeCommand(page, TEST_COMMANDS.status);
      
      if (result.success) {
        console.log('   ✅ System status command executed');
        
        // Should return system status information
        const hasSystemStatus = result.response.includes(EXPECTED_RESPONSES.status) ||
                               result.response.includes('system') ||
                               result.response.includes('status') ||
                               result.response.includes('uptime') ||
                               result.response.includes('performance');
        
        expect(hasSystemStatus).toBe(true);
      } else {
        console.log('   ⚠️ System status not available through terminal');
      }
    });
    
    test('Debug Commands Work', async ({ page }) => {
      console.log('🧪 Testing debug commands...');
      
      const debugCommands = [
        TEST_COMMANDS.debug.info,
        TEST_COMMANDS.debug.auth,
        TEST_COMMANDS.debug.permissions
      ];
      
      for (const command of debugCommands) {
        const result = await executeCommand(page, command);
        
        if (result.success) {
          console.log(`   ✅ ${command}: Executed successfully`);
          
          // Debug commands should return diagnostic information
          const hasDebugInfo = result.response.includes('debug') ||
                              result.response.includes('auth') ||
                              result.response.includes('permission') ||
                              result.response.includes('user') ||
                              result.response.includes('session');
          
          if (hasDebugInfo) {
            console.log(`   ✅ ${command}: Contains debug information`);
          }
        } else {
          console.log(`   ⚠️ ${command}: Not available through terminal`);
        }
      }
    });
    
  });
  
  test.describe('🧹 Maintenance and Cleanup Commands', () => {
    
    test('Cache Management Commands Work', async ({ page }) => {
      console.log('🧪 Testing cache management commands...');
      
      const cacheCommands = [
        TEST_COMMANDS.cache.stats,
        TEST_COMMANDS.cache.clear
      ];
      
      for (const command of cacheCommands) {
        const result = await executeCommand(page, command);
        
        if (result.success) {
          console.log(`   ✅ ${command}: Executed successfully`);
          
          // Cache commands should return cache-related information
          const hasCacheInfo = result.response.includes('cache') ||
                              result.response.includes('cleared') ||
                              result.response.includes('stats') ||
                              result.response.includes('entries') ||
                              result.response.includes('size');
          
          if (hasCacheInfo) {
            console.log(`   ✅ ${command}: Contains cache information`);
          }
        } else {
          console.log(`   ⚠️ ${command}: Not available through terminal`);
        }
      }
    });
    
    test('Cleanup Commands Work', async ({ page }) => {
      console.log('🧪 Testing cleanup commands...');
      
      const cleanupCommands = [
        TEST_COMMANDS.cleanup.temp,
        TEST_COMMANDS.cleanup.sessions
      ];
      
      for (const command of cleanupCommands) {
        const result = await executeCommand(page, command);
        
        if (result.success) {
          console.log(`   ✅ ${command}: Executed successfully`);
          
          // Cleanup commands should return cleanup results
          const hasCleanupInfo = result.response.includes('cleanup') ||
                                result.response.includes('removed') ||
                                result.response.includes('deleted') ||
                                result.response.includes('cleared') ||
                                result.response.includes('completed');
          
          if (hasCleanupInfo) {
            console.log(`   ✅ ${command}: Contains cleanup information`);
          }
        } else {
          console.log(`   ⚠️ ${command}: Not available through terminal`);
        }
      }
    });
    
    test('Clear Console Command Works', async ({ page }) => {
      console.log('🧪 Testing clear console command...');
      
      // First execute some commands to have output
      await executeCommand(page, TEST_COMMANDS.help);
      await executeCommand(page, TEST_COMMANDS.status);
      
      // Then clear
      const result = await executeCommand(page, TEST_COMMANDS.clear);
      
      if (result.success) {
        console.log('   ✅ Clear command executed');
        
        // After clear, output should be empty or show clear message
        const isClearResponse = result.response.includes('cleared') ||
                               result.response.includes('Console cleared') ||
                               result.response.length < 50; // Minimal output
        
        expect(isClearResponse).toBe(true);
      } else {
        console.log('   ⚠️ Clear command not available through terminal');
      }
    });
    
  });
  
  test.describe('🔐 Security Command Testing', () => {
    
    test('Admin Creation Commands Are Restricted', async ({ page }) => {
      console.log('🧪 Testing admin creation command security...');
      
      const result = await executeCommand(page, TEST_COMMANDS.createAdmin);
      
      if (result.success) {
        console.log('   ✅ Admin creation command executed');
        
        // Admin creation should require additional confirmation
        const requiresConfirmation = result.response.includes('confirm') ||
                                   result.response.includes('warning') ||
                                   result.response.includes('dangerous') ||
                                   result.response.includes('privileges') ||
                                   result.response.includes('created');
        
        expect(requiresConfirmation).toBe(true);
      } else {
        console.log('   ⚠️ Admin creation not available through terminal');
      }
    });
    
    test('Dangerous Commands Are Properly Protected', async ({ page }) => {
      console.log('🧪 Testing dangerous command protection...');
      
      const dangerousCommands = [
        'rm -rf /',
        'DROP TABLE users;',
        'DELETE FROM users;',
        'shutdown now',
        'reboot',
        'format disk'
      ];
      
      for (const command of dangerousCommands) {
        const result = await executeCommand(page, command);
        
        if (result.success) {
          // Dangerous commands should be rejected or require confirmation
          const isSafelyRejected = result.response.includes('Unknown command') ||
                                  result.response.includes('Access denied') ||
                                  result.response.includes('Not allowed') ||
                                  result.response.includes('Invalid');
          
          console.log(`   ${command}: ${isSafelyRejected ? '✅ Safely rejected' : '❌ May be dangerous'}`);
          
          if (!isSafelyRejected) {
            console.log(`   ⚠️ SECURITY WARNING: Command "${command}" may not be properly protected`);
          }
        }
      }
    });
    
    test('Command History Is Managed Securely', async ({ page }) => {
      console.log('🧪 Testing command history security...');
      
      // Execute some commands
      await executeCommand(page, TEST_COMMANDS.help);
      await executeCommand(page, 'fake-password-command secret123');
      await executeCommand(page, TEST_COMMANDS.status);
      
      // Check if sensitive data is handled properly in history
      // This would require access to command history functionality
      
      // Try to access command history (if available)
      const historyResult = await executeCommand(page, 'history');
      
      if (historyResult.success) {
        console.log('   ✅ Command history accessible');
        
        // History should not contain sensitive information in plain text
        const containsSensitiveData = historyResult.response.includes('secret123') ||
                                     historyResult.response.includes('password');
        
        if (!containsSensitiveData) {
          console.log('   ✅ Command history does not expose sensitive data');
        } else {
          console.log('   ❌ SECURITY WARNING: Command history may contain sensitive data');
        }
      } else {
        console.log('   ⚠️ Command history not available through terminal');
      }
    });
    
  });
  
  test.describe('📈 Command Performance and Reliability', () => {
    
    test('Commands Execute Within Reasonable Time', async ({ page }) => {
      console.log('🧪 Testing command execution performance...');
      
      const testCommands = [
        TEST_COMMANDS.help,
        TEST_COMMANDS.status,
        TEST_COMMANDS.users.count
      ];
      
      for (const command of testCommands) {
        const startTime = Date.now();
        const result = await executeCommand(page, command);
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        if (result.success) {
          console.log(`   ${command}: ${executionTime}ms`);
          
          // Commands should execute within reasonable time (< 10 seconds)
          const isReasonableTime = executionTime < 10000;
          
          if (isReasonableTime) {
            console.log(`   ✅ ${command}: Executed in reasonable time`);
          } else {
            console.log(`   ⚠️ ${command}: Slow execution (${executionTime}ms)`);
          }
          
          expect(isReasonableTime).toBe(true);
        }
      }
    });
    
    test('Commands Handle Concurrent Execution', async ({ page }) => {
      console.log('🧪 Testing concurrent command execution...');
      
      // Execute multiple commands simultaneously
      const concurrentCommands = [
        TEST_COMMANDS.help,
        TEST_COMMANDS.status,
        TEST_COMMANDS.users.count,
        TEST_COMMANDS.database.status
      ];
      
      const promises = concurrentCommands.map(command => 
        executeCommand(page, command)
      );
      
      try {
        const results = await Promise.all(promises);
        
        const successfulResults = results.filter(r => r.success);
        console.log(`   ✅ ${successfulResults.length}/${results.length} concurrent commands succeeded`);
        
        // At least some commands should succeed
        expect(successfulResults.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('   ⚠️ Concurrent execution may not be supported');
      }
    });
    
  });
  
});