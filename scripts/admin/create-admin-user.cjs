#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables from main .env file
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load credentials from credentials file
const credentialsPath = path.join(__dirname, '../../credentials/supabase-credentials.local');
let supabaseServiceKey = null;

try {
  const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
  const lines = credentialsContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1];
      break;
    }
  }
} catch (error) {
  console.warn('⚠️  Could not read credentials file, trying environment variables');
}

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = supabaseServiceKey || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase configuration.');
  console.error('Required variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (in credentials/supabase-credentials.local or environment)');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceKey);

// Admin configuration
const ADMIN_EMAIL = 'admin@ovenai.com';

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user profile...');
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single();
    
    if (existingUser) {
      console.log('ℹ️  Admin user profile already exists:', ADMIN_EMAIL);
      await updateUserToAdmin(ADMIN_EMAIL);
      return existingUser;
    }

    console.log('ℹ️  Please create the admin user account manually in Supabase Auth first.');
    console.log('ℹ️  Then run this script again to promote the user to admin.');
    
    return null;
  } catch (error) {
    console.error('❌ Error in createAdminUser:', error);
    return null;
  }
}

async function updateUserToAdmin(email) {
  try {
    console.log('🔄 Updating user to admin...');
    
    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating profile:', error);
      return;
    }

    console.log('✅ User updated to admin successfully:', email);
    return data;
  } catch (error) {
    console.error('❌ Error in updateUserToAdmin:', error);
  }
}

async function removeAdminRights(email) {
  try {
    console.log('🔄 Removing admin rights...');
    
    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: 'user',
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating profile:', error);
      return;
    }

    console.log('✅ Admin rights removed successfully from:', email);
    return data;
  } catch (error) {
    console.error('❌ Error in removeAdminRights:', error);
  }
}

async function getUserByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error getting user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getUserByEmail:', error);
    return null;
  }
}

async function listAllUsers() {
  try {
    console.log('📋 Listing all users...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error listing users:', error);
      return;
    }

    console.log('\n👥 Users in system:');
    console.log('===================');
    
    for (const user of data) {
      const isAdmin = user.role === 'admin';
      const status = isAdmin ? '🔒 ADMIN' : '👤 USER';
      console.log(`${status} ${user.email} (ID: ${user.id})`);
    }
    
    console.log(`\nTotal users: ${data.length}`);
  } catch (error) {
    console.error('❌ Error in listAllUsers:', error);
  }
}

async function main() {
  console.log('🚀 Admin User Management Script');
  console.log('===============================');
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('📖 Usage:');
    console.log('  node create-admin-user.cjs create        - Create admin@ovenai.com');
    console.log('  node create-admin-user.cjs list          - List all users');
    console.log('  node create-admin-user.cjs make-admin <email> - Make user admin');
    console.log('  node create-admin-user.cjs remove-admin <email> - Remove admin rights');
    console.log('  node create-admin-user.cjs remove-test-admin - Remove admin from test@test.test');
    return;
  }

  switch (command) {
    case 'create':
      await createAdminUser();
      break;
      
    case 'list':
      await listAllUsers();
      break;
      
    case 'make-admin':
      const emailToMakeAdmin = args[1];
      if (!emailToMakeAdmin) {
        console.error('❌ Please provide an email address');
        return;
      }
      const userToMakeAdmin = await getUserByEmail(emailToMakeAdmin);
      if (userToMakeAdmin) {
        await updateUserToAdmin(emailToMakeAdmin);
      } else {
        console.error('❌ User not found:', emailToMakeAdmin);
      }
      break;
      
    case 'remove-admin':
      const emailToRemoveAdmin = args[1];
      if (!emailToRemoveAdmin) {
        console.error('❌ Please provide an email address');
        return;
      }
      const userToRemoveAdmin = await getUserByEmail(emailToRemoveAdmin);
      if (userToRemoveAdmin) {
        await removeAdminRights(emailToRemoveAdmin);
      } else {
        console.error('❌ User not found:', emailToRemoveAdmin);
      }
      break;
      
    case 'remove-test-admin':
      console.log('🔄 Removing admin rights from test@test.test...');
      const testUser = await getUserByEmail('test@test.test');
      if (testUser) {
        await removeAdminRights('test@test.test');
      } else {
        console.error('❌ test@test.test user not found');
      }
      break;
      
    default:
      console.error('❌ Unknown command:', command);
      break;
  }
  
  console.log('\n✅ Script completed');
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(console.error);

module.exports = { createAdminUser, listAllUsers }; 