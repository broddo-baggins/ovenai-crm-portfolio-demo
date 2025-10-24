#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Database credentials
const SUPABASE_URL = 'https://ajszzemkpenbfnghqiyz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMzMjk3NCwiZXhwIjoyMDYyOTA4OTc0fQ.9xN5Ci6uErpsHx-8IwC4B8vh2cCzD39L3frKO66CSos';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkProfilesSchema() {
  console.log('🔍 Checking profiles table schema...');
  
  try {
    // Get all profiles columns
    const { data: columns, error } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'profiles' 
          ORDER BY ordinal_position;
        `
      });
    
    if (error) {
      console.error('❌ Error getting schema:', error);
      return;
    }
    
    console.log('📊 Profiles table columns:');
    if (columns && columns.length > 0) {
      columns.forEach((col, index) => {
        console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - nullable: ${col.is_nullable}, default: ${col.column_default || 'none'}`);
      });
    } else {
      console.log('No columns found or unable to access schema info');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

async function listActualUsers() {
  console.log('\n👥 Checking actual users in profiles table...');
  
  try {
    // Try to get profiles with basic fields only
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Error listing users:', error);
      return;
    }
    
    console.log(`📊 Found ${users.length} users:`);
    if (users.length > 0) {
      console.log('Sample user structure:', Object.keys(users[0]));
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email || user.id} (role: ${user.role || 'none'})`);
      });
    } else {
      console.log('No users found in profiles table');
    }
    
  } catch (error) {
    console.error('❌ User listing failed:', error);
  }
}

async function createTestAdmin() {
  console.log('\n🧪 Creating test admin user...');
  
  // First, let's try to register a user through the auth system
  try {
    console.log('Note: Users must register through the frontend first to create their profile.');
    console.log('The admin system can then promote existing users to admin role.');
    
    // Try to check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot access auth users (this is expected with current permissions)');
    } else {
      console.log(`📊 Auth users found: ${authUsers.users.length}`);
    }
    
  } catch (error) {
    console.log('ℹ️ Auth user listing not available with current permissions');
  }
}

async function main() {
  console.log('🔍 OvenAI Database Schema Inspector');
  console.log('=====================================');
  
  await checkProfilesSchema();
  await listActualUsers();
  await createTestAdmin();
  
  console.log('\n📝 Next Steps:');
  console.log('1. Register users through the frontend at /register');
  console.log('2. Use admin emails: admin@ovenai.com, amity@ovenai.com, ceo@ovenai.com');
  console.log('3. Run the admin promotion script after users exist');
}

if (require.main === module) {
  main().catch(console.error);
} 