import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read site database credentials from test-credentials.local
const testCredentialsPath = path.join(__dirname, '..', 'credentials', 'test-credentials.local');
const testCredentials = fs.readFileSync(testCredentialsPath, 'utf8');

// Extract site database credentials
const siteUrlMatch = testCredentials.match(/TEST_SUPABASE_URL=(.+)/);
const siteKeyMatch = testCredentials.match(/TEST_SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!siteUrlMatch || !siteKeyMatch) {
  console.error('❌ Could not find site database credentials in test-credentials.local');
  process.exit(1);
}

const siteUrl = siteUrlMatch[1].trim();
const siteKey = siteKeyMatch[1].trim();

// Test user credentials
const TEST_USER_EMAIL = 'test@test.test';

console.log('🔍 Checking test user admin status in SITE database...');
console.log(`📧 User: ${TEST_USER_EMAIL}`);
console.log(`🔗 Site Database: ${siteUrl}`);
console.log();

async function checkSiteDatabase() {
  try {
    const supabase = createClient(siteUrl, siteKey);
    
    console.log('📊 Exploring site database tables...');
    console.log('====================================');
    
    // Test possible tables
    const possibleTables = [
      'users',
      'profiles',
      'user_profiles',
      'auth_users',
      'user_permissions',
      'user_roles',
      'admin_users',
      'system_users',
      'user_settings',
      'user_preferences',
      'leads',
      'projects',
      'clients'
    ];
    
    const existingTables = [];
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: exists`);
          existingTables.push(tableName);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    console.log(`\n🔍 Searching for test user: ${TEST_USER_EMAIL}`);
    console.log('===========================================');
    
    // Search for test user in existing tables
    for (const tableName of existingTables) {
      try {
        // Try different email field names
        const emailFields = ['email', 'user_email', 'email_address'];
        
        for (const emailField of emailFields) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq(emailField, TEST_USER_EMAIL);
            
            if (!error && data && data.length > 0) {
              console.log(`✅ Found test user in ${tableName} (${emailField} field):`);
              data.forEach((row, index) => {
                console.log(`   User ${index + 1}:`, JSON.stringify(row, null, 2));
              });
              
              // Analyze admin status
              analyzeAdminStatus(row, tableName);
            }
          } catch (err) {
            // Field doesn't exist, continue
          }
        }
      } catch (err) {
        console.log(`❌ Error searching ${tableName}:`, err.message);
      }
    }
    
    // Check Supabase auth system
    console.log('\n🔐 Checking Supabase auth for test user...');
    console.log('==========================================');
    
    try {
      // This requires admin/service role key
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('❌ Error listing auth users:', authError.message);
      } else {
        const testUser = authUsers.users.find(user => user.email === TEST_USER_EMAIL);
        
        if (testUser) {
          console.log('✅ Found test user in auth system:');
          console.log('   ID:', testUser.id);
          console.log('   Email:', testUser.email);
          console.log('   Created:', testUser.created_at);
          console.log('   Email confirmed:', testUser.email_confirmed_at ? 'Yes' : 'No');
          console.log('   User metadata:', JSON.stringify(testUser.user_metadata, null, 2));
          console.log('   App metadata:', JSON.stringify(testUser.app_metadata, null, 2));
          
          // Check for admin indicators in metadata
          const isAdminFromAuth = checkAdminInMetadata(testUser);
          
          if (isAdminFromAuth) {
            console.log('✅ User has admin rights in auth metadata');
          } else {
            console.log('❌ User does not have admin rights in auth metadata');
          }
        } else {
          console.log('❌ Test user not found in auth system');
        }
      }
    } catch (err) {
      console.log('❌ Error checking auth system:', err.message);
    }
    
    // Final summary
    console.log('\n🏁 FINAL ANALYSIS:');
    console.log('==================');
    
    if (existingTables.length > 0) {
      console.log('✅ Site database is accessible');
      console.log(`📋 Found ${existingTables.length} tables: ${existingTables.join(', ')}`);
    } else {
      console.log('❌ No tables found in site database');
    }
    
  } catch (error) {
    console.error('❌ Site database check error:', error.message);
  }
}

function analyzeAdminStatus(userData, tableName) {
  console.log(`\n📋 Analyzing admin status from ${tableName}:`);
  console.log('============================================');
  
  const adminIndicators = [
    'role',
    'user_role',
    'permissions',
    'is_admin',
    'admin',
    'access_level',
    'user_type',
    'level',
    'admin_level',
    'system_admin',
    'superuser'
  ];
  
  let adminFound = false;
  
  Object.entries(userData).forEach(([key, value]) => {
    if (adminIndicators.includes(key.toLowerCase()) || key.toLowerCase().includes('admin')) {
      console.log(`🔍 ${key}: ${value}`);
      
      const valueStr = String(value).toLowerCase();
      if (valueStr.includes('admin') || valueStr.includes('system') || valueStr === 'true') {
        console.log(`✅ ADMIN RIGHTS FOUND: ${key} = ${value}`);
        adminFound = true;
      }
    }
  });
  
  if (!adminFound) {
    console.log('❌ No admin indicators found in user data');
  }
  
  return adminFound;
}

function checkAdminInMetadata(authUser) {
  console.log('\n🔍 Checking auth metadata for admin rights:');
  
  // Check user_metadata
  if (authUser.user_metadata) {
    if (authUser.user_metadata.role === 'admin' || 
        authUser.user_metadata.is_admin === true ||
        authUser.user_metadata.admin === true) {
      console.log('✅ Found admin rights in user_metadata');
      return true;
    }
  }
  
  // Check app_metadata
  if (authUser.app_metadata) {
    if (authUser.app_metadata.role === 'admin' || 
        authUser.app_metadata.is_admin === true ||
        authUser.app_metadata.admin === true ||
        authUser.app_metadata.roles?.includes('admin')) {
      console.log('✅ Found admin rights in app_metadata');
      return true;
    }
  }
  
  console.log('❌ No admin rights found in auth metadata');
  return false;
}

checkSiteDatabase().catch(console.error); 