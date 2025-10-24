#!/usr/bin/env node

/**
 * Create Vlad Tzadik as CEO for full admin console testing
 * This script sets up the CEO user with proper privileges
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

const CEO_USER = {
  email: 'vladtzadik@gmail.com',
  name: 'Vlad Tzadik',
  role: 'admin', // Use 'admin' instead of 'ceo' to match constraint
  password: 'VladCEO2024!'
};

async function createCEOUser() {
  console.log('🚀 Setting up CEO user:', CEO_USER.email);
  
  try {
    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', CEO_USER.email)
      .single();
    
    if (existingUser && !fetchError) {
      console.log('✅ CEO user already exists');
      
      // Update role to ensure CEO privileges
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: CEO_USER.role
        })
        .eq('email', CEO_USER.email);
        
      if (updateError) {
        console.error('❌ Failed to update CEO role:', updateError);
        return false;
      }
      
      console.log('✅ CEO role updated successfully');
      return true;
    }
    
    // Create new CEO user
    console.log('📝 Creating new CEO user...');
    
    // Get or create auth user
    let authUser;
    const { data: createUserData, error: authError } = await supabase.auth.admin.createUser({
      email: CEO_USER.email,
      password: CEO_USER.password,
      email_confirm: true
    });
    
    if (authError && authError.code === 'email_exists') {
      console.log('📧 User already exists in auth, fetching user ID...');
      
      // Get existing user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('❌ Failed to list users:', listError);
        return false;
      }
      
      const existingUser = users.users.find(u => u.email === CEO_USER.email);
      if (!existingUser) {
        console.error('❌ User exists but cannot find in user list');
        return false;
      }
      
      authUser = { user: existingUser };
      console.log('✅ Found existing auth user:', authUser.user.id);
    } else if (authError) {
      console.error('❌ Failed to create auth user:', authError);
      return false;
    } else {
      authUser = createUserData;
      console.log('✅ Auth user created:', authUser.user.id);
    }
    
    // Create profile with CEO role - using only required columns
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: CEO_USER.email,
        role: CEO_USER.role
      });
    
    if (profileError) {
      console.error('❌ Failed to create profile:', profileError);
      return false;
    }
    
    console.log('✅ Profile created with CEO role');
    
    // Ensure admin privileges in auth.users metadata
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      authUser.user.id,
      {
        user_metadata: {
          role: CEO_USER.role,
          is_admin: true,
          is_ceo: true
        }
      }
    );
    
    if (metadataError) {
      console.warn('⚠️ Failed to update user metadata:', metadataError);
    } else {
      console.log('✅ User metadata updated');
    }
    
    console.log('🎉 CEO user setup completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function verifyCEOAccess() {
  console.log('🔍 Verifying CEO access...');
  
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', CEO_USER.email)
      .single();
    
    if (error) {
      console.error('❌ Failed to fetch CEO user:', error);
      return false;
    }
    
    console.log('✅ CEO User Details:');
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Created: ${user.created_at}`);
    
    if (user.role === 'admin') {
      console.log('✅ Admin role verified (CEO-level access)');
      return true;
    } else {
      console.error('❌ User does not have admin role');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

async function main() {
  console.log('🛠️ Setting up Vlad Tzadik as CEO...\n');
  
  const created = await createCEOUser();
  if (!created) {
    console.error('❌ CEO setup failed');
    process.exit(1);
  }
  
  const verified = await verifyCEOAccess();
  if (!verified) {
    console.error('❌ CEO verification failed');
    process.exit(1);
  }
  
  console.log('\n🎉 Vlad Tzadik is ready as CEO!');
  console.log('🔑 Login credentials:');
  console.log(`   Email: ${CEO_USER.email}`);
  console.log(`   Password: ${CEO_USER.password}`);
  console.log('\nYou can now run the admin console tests.');
}

if (require.main === module) {
  main();
} 