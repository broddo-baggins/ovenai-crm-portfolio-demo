#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load Supabase credentials
const supabaseCredsPath = path.join(__dirname, '../../credentials/supabase-credentials.local');
if (!fs.existsSync(supabaseCredsPath)) {
  console.error('❌ Supabase credentials not found:', supabaseCredsPath);
  process.exit(1);
}

const supabaseCreds = fs.readFileSync(supabaseCredsPath, 'utf8');
const urlMatch = supabaseCreds.match(/SUPABASE_URL[=:]\s*["']?([^"'\s\n]+)["']?/);
const anonKeyMatch = supabaseCreds.match(/SUPABASE_ANON_KEY[=:]\s*["']?([^"'\s\n]+)["']?/);

const supabaseUrl = urlMatch ? urlMatch[1] : null;
const anonKey = anonKeyMatch ? anonKeyMatch[1] : null;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Could not parse Supabase credentials');
  console.error('URL found:', !!supabaseUrl);
  console.error('Anon key found:', !!anonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function checkTestUser() {
  console.log('🔍 Checking test user in Site DB...');
  console.log('📧 Email: test@test.test');
  
  try {
    // Test authentication first
    console.log('🔐 Testing authentication...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@test.test',
      password: 'testtesttest'
    });
    
    if (signInError) {
      console.error('❌ Authentication failed:', signInError.message);
      console.log('💡 This could be because:');
      console.log('   - User does not exist');
      console.log('   - Wrong password');
      console.log('   - Email not confirmed');
      console.log('   - User disabled');
      return false;
    } else {
      console.log('✅ Authentication successful!');
      console.log('🎯 User ID:', signInData.user.id);
      console.log('📧 Email:', signInData.user.email);
      console.log('✔️ Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
      
      // Now check profiles table while authenticated
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'test@test.test')
        .single();
        
      if (profileError) {
        console.error('❌ Error accessing profiles table:', profileError.message);
        console.log('💡 This might be an RLS policy issue');
      } else if (profile) {
        console.log('✅ Test user profile found:', profile.id);
        console.log('👤 Name:', profile.full_name || 'Not set');
        console.log('🔑 Role:', profile.role || 'Not set');
      } else {
        console.log('⚠️ Test user profile NOT found in profiles table');
      }
      
      // Test leads access
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('count')
        .limit(1);
        
      if (leadsError) {
        console.error('❌ Cannot access leads table:', leadsError.message);
      } else {
        console.log('✅ Can access leads table');
      }
      
      // Sign out
      await supabase.auth.signOut();
      return true;
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 OvenAI Test User Verification');
  console.log('🔗 Site DB URL:', supabaseUrl);
  console.log('');
  
  const isValid = await checkTestUser();
  
  if (isValid) {
    console.log('\n✅ Test user is properly configured!');
    process.exit(0);
  } else {
    console.log('\n❌ Test user configuration issues found');
    console.log('💡 To create test user, run: node scripts/user-management/create-test-users.js');
    process.exit(1);
  }
}

main().catch(console.error); 