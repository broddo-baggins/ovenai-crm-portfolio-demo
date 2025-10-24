#!/usr/bin/env node

/**
 * Fix Admin Tests - Comprehensive Test Authentication Fix
 * 
 * This script fixes all admin console test files to use the correct
 * authentication credentials and robust selectors.
 */

const fs = require('fs');
const path = require('path');

const ADMIN_TEST_DIR = path.join(__dirname, '../../tests/suites/e2e/admin');

// Working test user credentials
const CORRECT_AUTH = {
  email: 'test@test.test',
  password: process.env.TEST_USER_PASSWORD || process.env.TEST_USER_PASSWORD || 'testtesttest'
};

// Robust authentication function to replace in tests
const ROBUST_AUTH_FUNCTION = `
// Helper function for robust authentication
async function authenticateAsAdmin(page) {
  console.log('🔐 Authenticating as admin user...');
  
  await page.goto('/auth/login', { waitUntil: 'networkidle' });
  
  // Use multiple selector fallbacks for robustness
  const emailSelector = 'input[type="email"], input[name="email"], #email';
  const passwordSelector = 'input[type="password"], input[name="password"], #password';
  
  await page.waitForSelector(emailSelector, { timeout: 10000 });
  await page.fill(emailSelector, '${CORRECT_AUTH.email}');
  await page.fill(passwordSelector, '${CORRECT_AUTH.password}');
  
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
`;

// Standard beforeEach block for admin tests
const STANDARD_BEFORE_EACH = `
  test.beforeEach(async ({ page }) => {
    // Authenticate as admin user
    await authenticateAsAdmin(page);
    
    // Navigate to admin console if not already there
    if (!page.url().includes('/admin')) {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    }
  });
`;

// Patterns to fix in test files
const FIXES = [
  // Fix wrong credentials
  {
    pattern: /vladtzadik@gmail\.com/g,
    replacement: CORRECT_AUTH.email
  },
  {
    pattern: /VladCEO2024!/g,
    replacement: CORRECT_AUTH.password
  },
  {
    pattern: /your-ceo-password/g,
    replacement: CORRECT_AUTH.password
  },
  // Fix hardcoded selectors with robust ones
  {
    pattern: /input\[type="email"\]/g,
    replacement: 'input[type="email"], input[name="email"], #email'
  },
  {
    pattern: /input\[type="password"\]/g,
    replacement: 'input[type="password"], input[name="password"], #password'
  },
  // Fix submit button selectors
  {
    pattern: /button\[type="submit"\]/g,
    replacement: 'button[type="submit"], button:has-text("Sign in"), button:has-text("Login")'
  }
];

async function fixAdminTestFile(filePath) {
  console.log(`🔧 Fixing ${path.basename(filePath)}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply all fixes
    FIXES.forEach(fix => {
      content = content.replace(fix.pattern, fix.replacement);
    });
    
    // Add robust auth function if not present
    if (!content.includes('async function authenticateAsAdmin')) {
      const importIndex = content.indexOf("import { test, expect");
      if (importIndex !== -1) {
        const afterImports = content.indexOf('\n\n', importIndex);
        if (afterImports !== -1) {
          content = content.slice(0, afterImports) + 
                   ROBUST_AUTH_FUNCTION + 
                   content.slice(afterImports);
        }
      }
    }
    
    // Fix common beforeEach patterns
    content = content.replace(
      /test\.beforeEach\(async \(\{ page \}\) => \{[ \s\S]*?\}\);/g,
      STANDARD_BEFORE_EACH.trim()
    );
    
    // Write fixed content back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

async function fixAllAdminTests() {
  console.log('🚀 Starting comprehensive admin test fixes...');
  
  if (!fs.existsSync(ADMIN_TEST_DIR)) {
    console.error(`❌ Admin test directory not found: ${ADMIN_TEST_DIR}`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(ADMIN_TEST_DIR)
    .filter(file => file.endsWith('.spec.ts'))
    .map(file => path.join(ADMIN_TEST_DIR, file));
  
  console.log(`📋 Found ${files.length} admin test files to fix`);
  
  for (const file of files) {
    await fixAdminTestFile(file);
  }
  
  console.log('\n🎉 All admin test files fixed!');
  console.log('\n📝 Summary of fixes applied:');
  console.log('  ✅ Updated credentials to use test@test.test');
  console.log('  ✅ Added robust selector fallbacks');
  console.log('  ✅ Improved authentication flow');
  console.log('  ✅ Standardized beforeEach blocks');
  console.log('\n🧪 Run tests with: npm run test:admin');
}

if (require.main === module) {
  fixAllAdminTests().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixAllAdminTests }; 