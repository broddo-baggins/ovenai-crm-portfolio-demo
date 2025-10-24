#!/usr/bin/env node

/**
 * Create Test User Script
 * Ensures test@test.test user exists for E2E testing
 */

const { createClient } = require('@supabase/supabase-js');

// Site DB Configuration
const SITE_DB_URL = process.env.VITE_SUPABASE_URL || 'https://ajszzemkpenbfnghqiyz.supabase.co';
const SITE_DB_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE4OTY3NjMsImV4cCI6MjAzNzQ3Mjc2M30.KSbgkdQvbSVrKBuUL5yy73ZvzqFDZfNZEJQSO4iNNK4';

const TEST_USER = {
  email: 'test@test.test',
  password: 'testtesttest',
  role: 'ADMIN'
};

async function createTestUser() {
  const supabase = createClient(SITE_DB_URL, SITE_DB_KEY);
  
  try {
    console.log('🔍 Checking if test user exists...');
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', TEST_USER.email)
      .single();
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      console.log('   Role:', existingUser.role);
      console.log('   ID:', existingUser.id);
      return existingUser;
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    console.log('🔧 Creating test user...');
    
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          role: TEST_USER.role
        }
      }
    });
    
    if (authError) {
      console.log('⚠️ Auth user might already exist:', authError.message);
      // Try to sign in instead
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      if (signInError) {
        throw new Error(`Failed to create or sign in test user: ${signInError.message}`);
      }
      
      console.log('✅ Test user authenticated successfully');
      return signInData.user;
    }
    
    if (authData.user) {
      console.log('✅ Test user created successfully');
      console.log('   Email:', authData.user.email);
      console.log('   ID:', authData.user.id);
      
      // Wait a moment for profile trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profile) {
        console.log('✅ Profile created automatically');
        console.log('   Profile role:', profile.role);
      } else {
        console.log('⚠️ Profile not found, may need manual creation');
      }
      
      return authData.user;
    }
    
    throw new Error('Failed to create test user - no user returned');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await createTestUser();
    console.log('🎉 Test user setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Test user setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createTestUser }; 