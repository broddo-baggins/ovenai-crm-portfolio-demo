import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read agent database credentials
const agentCredentialsPath = path.join(__dirname, '..', 'credentials', 'agent-db-credentials.local');
const agentCredentials = fs.readFileSync(agentCredentialsPath, 'utf8');

// Extract credentials from file
const agentUrlMatch = agentCredentials.match(/AGENT_SUPABASE_URL=(.+)/);
const agentKeyMatch = agentCredentials.match(/AGENT_SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!agentUrlMatch || !agentKeyMatch) {
  console.error('❌ Could not find agent database credentials');
  process.exit(1);
}

const agentUrl = agentUrlMatch[1].trim();
const agentKey = agentKeyMatch[1].trim();

// Test user credentials
const TEST_USER_EMAIL = 'test@test.test';

console.log('🔍 Checking test user admin status...');
console.log(`📧 User: ${TEST_USER_EMAIL}`);
console.log(`🔗 Database: ${agentUrl}`);
console.log();

async function checkTestUserAdminStatus() {
  try {
    // Connect to agent database
    const supabase = createClient(agentUrl, agentKey);
    
    console.log('🔌 Connecting to agent database...');
    
    // Check if users table exists and query for test user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', TEST_USER_EMAIL)
      .single();
    
    if (userError) {
      console.log('⚠️  Error querying users table:', userError.message);
      
      // Try alternative table names
      const { data: authData, error: authError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('email', TEST_USER_EMAIL)
        .single();
      
      if (authError) {
        console.log('⚠️  Error querying auth_users table:', authError.message);
        
        // Try checking auth.users via RPC
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_user_by_email', { user_email: TEST_USER_EMAIL });
        
        if (rpcError) {
          console.log('⚠️  Error calling RPC function:', rpcError.message);
          console.log('📋 Available tables and functions:');
          
          // List available tables
          const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(10);
          
          if (!tablesError && tables) {
            console.log('📊 Available tables:');
            tables.forEach(table => console.log(`  - ${table.table_name}`));
          }
          
          // List available RPC functions
          const { data: functions, error: functionsError } = await supabase
            .from('information_schema.routines')
            .select('routine_name')
            .eq('routine_schema', 'public')
            .limit(10);
          
          if (!functionsError && functions) {
            console.log('⚙️  Available RPC functions:');
            functions.forEach(func => console.log(`  - ${func.routine_name}`));
          }
          
          return false;
        } else {
          console.log('✅ Found user via RPC:', rpcData);
          return analyzeUserData(rpcData);
        }
      } else {
        console.log('✅ Found user in auth_users table:', authData);
        return analyzeUserData(authData);
      }
    } else {
      console.log('✅ Found user in users table:', userData);
      return analyzeUserData(userData);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

function analyzeUserData(userData) {
  console.log('\n📋 User Data Analysis:');
  console.log('====================');
  
  if (!userData) {
    console.log('❌ No user data found');
    return false;
  }
  
  // Check for admin indicators
  const adminIndicators = [
    'role',
    'user_role',
    'permissions',
    'is_admin',
    'admin',
    'access_level',
    'user_type',
    'level'
  ];
  
  let isAdmin = false;
  let adminReason = '';
  
  // Print all user properties
  Object.entries(userData).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
    
    // Check for admin indicators
    if (adminIndicators.includes(key.toLowerCase())) {
      const valueStr = String(value).toLowerCase();
      if (valueStr.includes('admin') || valueStr.includes('system') || valueStr === 'true') {
        isAdmin = true;
        adminReason = `${key} = ${value}`;
      }
    }
  });
  
  console.log('\n🔍 Admin Status Analysis:');
  console.log('========================');
  
  if (isAdmin) {
    console.log(`✅ User HAS admin rights: ${adminReason}`);
  } else {
    console.log('❌ User does NOT have admin rights');
    console.log('🔧 To grant admin rights, you may need to:');
    console.log('   1. Update user role in database');
    console.log('   2. Set is_admin = true');
    console.log('   3. Set user_role = "admin" or "system_admin"');
  }
  
  return isAdmin;
}

// Additional function to check user permissions
async function checkUserPermissions() {
  try {
    const supabase = createClient(agentUrl, agentKey);
    
    console.log('\n🔐 Checking user permissions...');
    
    // Try to query user permissions table
    const { data: permissions, error: permError } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_email', TEST_USER_EMAIL);
    
    if (permError) {
      console.log('⚠️  No user_permissions table found');
    } else {
      console.log('📋 User permissions:', permissions);
    }
    
    // Try to query roles table
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_email', TEST_USER_EMAIL);
    
    if (rolesError) {
      console.log('⚠️  No user_roles table found');
    } else {
      console.log('👤 User roles:', roles);
    }
    
  } catch (error) {
    console.log('⚠️  Error checking permissions:', error.message);
  }
}

// Run the checks
async function main() {
  const hasAdminRights = await checkTestUserAdminStatus();
  await checkUserPermissions();
  
  console.log('\n🏁 FINAL RESULT:');
  console.log('===============');
  
  if (hasAdminRights) {
    console.log('✅ TEST USER HAS ADMIN RIGHTS');
    console.log('🎉 Tests should pass with current user configuration');
  } else {
    console.log('❌ TEST USER DOES NOT HAVE ADMIN RIGHTS');
    console.log('⚠️  Admin tests may fail without proper permissions');
    console.log('🔧 Consider running user setup script to grant admin rights');
  }
  
  process.exit(hasAdminRights ? 0 : 1);
}

main().catch(console.error); 