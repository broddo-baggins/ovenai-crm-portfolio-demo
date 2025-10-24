#!/usr/bin/env node

/**
 * Create Regular Test User Script
 * Creates the regular@test.test user needed for negative admin console testing
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env and .env.local
const envFiles = ['.env', '.env.local'];
envFiles.forEach(fileName => {
  const envFilePath = path.join(__dirname, '../../', fileName);
  if (fs.existsSync(envFilePath)) {
    const envFile = fs.readFileSync(envFilePath, 'utf8');
    envFile.split('\n').forEach(line => {
      if (line && line.includes('=') && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        process.env[key.trim()] = values.join('=').trim();
      }
    });
  }
});

// Get environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n🔍 Please check your .env.local file contains these variables');
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test user to create
const REGULAR_USER = {
  email: 'regular@test.test',
  password: 'regularpassword123',
  role: 'user',
  status: 'active',
  full_name: 'Regular Test User'
};

async function createRegularTestUser() {
  console.log('🧪 Creating regular test user for admin console testing...');
  console.log(`📧 Email: ${REGULAR_USER.email}`);
  
  try {
    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', REGULAR_USER.email)
      .single();
    
    if (existingProfile) {
      console.log('✅ Regular test user already exists!');
      console.log(`   Email: ${existingProfile.email}`);
      console.log(`   Role: ${existingProfile.role}`);
      console.log(`   Status: ${existingProfile.status}`);
      return existingProfile;
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    // Create auth user
    console.log('🔐 Creating authentication user...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: REGULAR_USER.email,
      password: REGULAR_USER.password,
      email_confirm: true,
      user_metadata: {
        role: REGULAR_USER.role,
        full_name: REGULAR_USER.full_name
      }
    });
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      throw authError;
    }
    
    console.log('✅ Auth user created successfully!');
    console.log(`   User ID: ${authData.user.id}`);
    
    // Create profile
    console.log('👤 Creating user profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: REGULAR_USER.email,
        full_name: REGULAR_USER.full_name,
        role: REGULAR_USER.role,
        status: REGULAR_USER.status
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      throw profileError;
    }
    
    console.log('✅ Profile created successfully!');
    console.log(`   Profile ID: ${profileData.id}`);
    console.log(`   Email: ${profileData.email}`);
    console.log(`   Role: ${profileData.role}`);
    console.log(`   Status: ${profileData.status}`);
    
    console.log('\n🎉 Regular test user created successfully!');
    console.log('\n📋 User Details:');
    console.log(`   Email: ${REGULAR_USER.email}`);
    console.log(`   Password: ${REGULAR_USER.password}`);
    console.log(`   Role: ${REGULAR_USER.role} (non-admin)`);
    console.log(`   Purpose: Negative testing for admin console`);
    
    return profileData;
    
  } catch (error) {
    console.error('❌ Error creating regular test user:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('   1. Check .env.local file exists and has correct variables');
    console.error('   2. Verify Supabase service role key has admin permissions');
    console.error('   3. Ensure database is accessible');
    throw error;
  }
}

// Verify the created user
async function verifyUser(email) {
  console.log('\n🔍 Verifying created user...');
  
  try {
    // Check auth user
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }
    
    const authUser = users.find(u => u.email === email);
    if (authUser) {
      console.log('✅ Auth user verified');
      console.log(`   ID: ${authUser.id}`);
      console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Auth user not found');
    }
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    if (profile) {
      console.log('✅ Profile verified');
      console.log(`   Role: ${profile.role}`);
      console.log(`   Status: ${profile.status}`);
    }
    
    console.log('\n🎯 User ready for admin console testing!');
    
  } catch (error) {
    console.error('❌ Error verifying user:', error.message);
  }
}

// Main execution
async function main() {
  try {
    const user = await createRegularTestUser();
    await verifyUser(REGULAR_USER.email);
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Run admin console tests:');
    console.log('      node scripts/testing/run-admin-console-tests.js comprehensive');
    console.log('   2. Test negative scenarios with this regular user');
    console.log('   3. Verify admin access restrictions work properly');
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 