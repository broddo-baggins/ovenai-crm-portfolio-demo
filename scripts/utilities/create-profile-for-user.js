/**
 * Create Profile for Existing Auth User
 * Usage: node create-profile-for-user.js [USER_ID] [EMAIL] [FIRST_NAME] [LAST_NAME] [ROLE]
 * 
 * This script creates profiles for auth users that already exist
 * Works around the Supabase auth creation limitation
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadCredentials() {
  const localCredsPath = path.join(__dirname, 'supabase-credentials.local');
  const localContent = fs.readFileSync(localCredsPath, 'utf8');
  const localCreds = {};
  
  localContent.split('\n').forEach(line => {
    if (line.startsWith('SUPABASE_URL=')) {
      localCreds.url = line.split('=')[1];
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      localCreds.serviceKey = line.split('=')[1];
    }
  });
  
  return localCreds;
}

async function createProfileForUser(userId, email, firstName, lastName, role = 'user') {
  try {
    console.log('👤 CREATING PROFILE FOR EXISTING AUTH USER');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Role: ${role}`);
    
    const creds = loadCredentials();
    const supabase = createClient(creds.url, creds.serviceKey);
    
    // 1. Verify the auth user exists
    console.log('\n🔍 Verifying auth user exists...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }
    
    const authUser = authUsers.users.find(u => u.id === userId);
    
    if (!authUser) {
      throw new Error(`Auth user with ID ${userId} not found. Available users: ${authUsers.users.map(u => `${u.email} (${u.id})`).join(', ')}`);
    }
    
    console.log(`✅ Auth user found: ${authUser.email}`);
    
    // 2. Check if profile already exists
    console.log('\n🔍 Checking for existing profile...');
    
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!profileCheckError && existingProfile) {
      console.log('⚠️  Profile already exists:');
      console.log(`   Name: ${existingProfile.first_name} ${existingProfile.last_name}`);
      console.log(`   Email: ${existingProfile.email}`);
      console.log(`   Role: ${existingProfile.role}`);
      console.log(`   Status: ${existingProfile.status}`);
      
      return existingProfile;
    }
    
    // 3. Create the profile
    console.log('\n✨ Creating new profile...');
    
    const profileData = {
      id: userId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      role: role,
      status: 'active',
      phone: null
    };
    
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (profileError) {
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    
    console.log('✅ Profile created successfully!');
    console.log(`   Profile ID: ${newProfile.id}`);
    console.log(`   Name: ${newProfile.first_name} ${newProfile.last_name}`);
    console.log(`   Email: ${newProfile.email}`);
    console.log(`   Role: ${newProfile.role}`);
    console.log(`   Status: ${newProfile.status}`);
    
    return newProfile;
    
  } catch (error) {
    console.error('❌ Profile creation failed:', error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 4) {
    console.log('📋 USAGE:');
    console.log('node create-profile-for-user.js [USER_ID] [EMAIL] [FIRST_NAME] [LAST_NAME] [ROLE]');
    console.log('');
    console.log('Examples:');
    console.log('node create-profile-for-user.js "123e4567-e89b-12d3-a456-426614174000" "john@example.com" "John" "Doe" "user"');
    console.log('node create-profile-for-user.js "123e4567-e89b-12d3-a456-426614174000" "admin@company.com" "Admin" "User" "admin"');
    console.log('');
    console.log('Available roles: user, admin, manager, client');
    process.exit(1);
  }
  
  const [userId, email, firstName, lastName, role = 'user'] = args;
  
  try {
    await createProfileForUser(userId, email, firstName, lastName, role);
    console.log('\n🎉 PROFILE CREATION COMPLETE!');
  } catch (error) {
    console.error('\n❌ OPERATION FAILED:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
export { createProfileForUser };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 