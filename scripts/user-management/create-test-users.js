#!/usr/bin/env node

/**
 * OvenAI User Management Testing Script
 * 
 * This script tests the user-management edge function and creates different types of test users.
 * It validates the complete user creation flow including:
 * - User authentication creation
 * - Profile creation
 * - Client/Organization assignment
 * - Project creation
 * - Notification setup
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gdbjfotjjawrhjnjjfzh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test users to create
const TEST_USERS = [
  {
    email: 'manager@ovenai.test',
    name: 'Test Manager',
    role: 'ADMIN',
    client_name: 'Test Management Corp',
    send_invitation: false,
    create_demo_project: true,
    temporary_password: 'TestPass123!'
  },
  {
    email: 'sales@ovenai.test',
    name: 'Sales Engineer',
    role: 'STAFF',
    client_name: 'Sales Department',
    send_invitation: false,
    create_demo_project: true
  },
  {
    email: 'demo@ovenai.test',
    name: 'Demo User',
    role: 'STAFF',
    send_invitation: false,
    create_demo_project: true
  },
  {
    email: 'noprojects@ovenai.test',
    name: 'No Projects User',
    role: 'STAFF',
    send_invitation: false,
    create_demo_project: false  // This user will have empty dashboard
  }
];

// Helper functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const levels = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  };
  console.log(`${levels[level]} ${timestamp} ${message}`);
}

async function callUserManagementFunction(payload, method = 'POST') {
  const functionUrl = `${SUPABASE_URL}/functions/v1/user-management`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (method === 'POST') {
    options.body = JSON.stringify(payload);
  }

  try {
    log(`Calling user management function: ${method} ${functionUrl}`);
    const response = await fetch(functionUrl, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    log(`Function call failed: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

async function verifyUserCreation(email) {
  log(`Verifying user creation for: ${email}`, 'debug');
  
  try {
    // Check auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    
    const authUser = authUsers.users.find(u => u.email === email);
    if (!authUser) {
      log(`User not found in auth.users: ${email}`, 'error');
      return false;
    }
    
    log(`✓ Auth user exists: ${authUser.id}`, 'success');
    
    // Check public.users profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (profileError) {
      log(`Profile not found: ${profileError.message}`, 'warning');
    } else {
      log(`✓ User profile exists: ${profile.name}`, 'success');
    }
    
    // Check client membership
    const { data: memberships, error: memberError } = await supabase
      .from('client_members')
      .select(`
        *,
        clients(id, name)
      `)
      .eq('user_id', authUser.id);
    
    if (memberError) {
      log(`Membership check failed: ${memberError.message}`, 'error');
    } else {
      log(`✓ Client memberships: ${memberships?.length || 0}`, memberships?.length > 0 ? 'success' : 'warning');
      memberships?.forEach(m => {
        log(`  - ${m.clients?.name} (${m.role})`, 'info');
      });
    }
    
    // Check projects access
    if (memberships && memberships.length > 0) {
      const clientIds = memberships.map(m => m.client_id);
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .in('client_id', clientIds);
      
      if (!projectError) {
        log(`✓ Accessible projects: ${projects?.length || 0}`, projects?.length > 0 ? 'success' : 'warning');
        projects?.forEach(p => {
          log(`  - ${p.name}`, 'info');
        });
      }
    }
    
    return true;
  } catch (error) {
    log(`Verification failed: ${error.message}`, 'error');
    return false;
  }
}

async function cleanupExistingTestUsers() {
  log('🧹 Cleaning up existing test users...');
  
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    
    const testUserEmails = TEST_USERS.map(u => u.email);
    const existingTestUsers = authUsers.users.filter(u => testUserEmails.includes(u.email));
    
    log(`Found ${existingTestUsers.length} existing test users to remove`);
    
    for (const user of existingTestUsers) {
      log(`Deleting user: ${user.email}`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        log(`Failed to delete ${user.email}: ${deleteError.message}`, 'error');
      } else {
        log(`Deleted: ${user.email}`, 'success');
      }
    }
    
    log('Cleanup completed', 'success');
  } catch (error) {
    log(`Cleanup failed: ${error.message}`, 'error');
  }
}

async function createTestUsers() {
  log('🚀 Creating test users...');
  
  const results = [];
  
  for (const userData of TEST_USERS) {
    log(`Creating user: ${userData.email}`);
    
    const result = await callUserManagementFunction(userData);
    
    if (result.success) {
      log(`✅ Successfully created: ${userData.email}`, 'success');
      log(`   User ID: ${result.data.user?.id}`, 'info');
      log(`   Client: ${result.data.client?.name}`, 'info');
      if (result.data.project) {
        log(`   Project: ${result.data.project.name}`, 'info');
      }
      if (result.data.user?.temporary_password) {
        log(`   Password: ${result.data.user.temporary_password}`, 'info');
      }
      
      // Verify the creation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
      await verifyUserCreation(userData.email);
      
    } else {
      log(`❌ Failed to create: ${userData.email}`, 'error');
      log(`   Error: ${result.error}`, 'error');
    }
    
    results.push({
      email: userData.email,
      success: result.success,
      error: result.error,
      data: result.data
    });
    
    // Wait between creations to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

async function generateTestReport(results) {
  log('📊 Generating test report...');
  
  console.log('\n' + '='.repeat(60));
  console.log('              USER CREATION TEST REPORT');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total attempts: ${results.length}`);
  console.log(`   Successful: ${successful.length}`);
  console.log(`   Failed: ${failed.length}`);
  console.log(`   Success rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);
  
  if (successful.length > 0) {
    console.log(`\n✅ SUCCESSFUL CREATIONS:`);
    successful.forEach(result => {
      console.log(`   ${result.email}`);
      console.log(`     User ID: ${result.data.user?.id}`);
      console.log(`     Client: ${result.data.client?.name}`);
      if (result.data.project) {
        console.log(`     Project: ${result.data.project.name}`);
      }
      if (result.data.user?.temporary_password) {
        console.log(`     Password: ${result.data.user.temporary_password}`);
      }
      console.log('');
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ FAILED CREATIONS:`);
    failed.forEach(result => {
      console.log(`   ${result.email}: ${result.error}`);
    });
  }
  
  console.log('\n🔗 LOGIN INSTRUCTIONS:');
  console.log('1. Go to: http://localhost:3001/login');
  console.log('2. Use any of the created email addresses');
  console.log('3. Use the temporary password shown above');
  console.log('4. Test the onboarding flow and project creation');
  
  console.log('\n🧪 TESTING SCENARIOS:');
  console.log('- manager@ovenai.test: Test admin privileges');
  console.log('- sales@ovenai.test: Test regular user workflow');
  console.log('- demo@ovenai.test: Test typical user experience');
  console.log('- noprojects@ovenai.test: Test empty dashboard experience');
  
  console.log('\n' + '='.repeat(60));
}

async function testUserManagementSystem() {
  log('🔧 Starting User Management System Test', 'info');
  
  try {
    // Step 1: Cleanup existing test users
    await cleanupExistingTestUsers();
    
    // Step 2: Test function availability
    log('Testing function availability...');
    const testResponse = await callUserManagementFunction({}, 'GET');
    if (!testResponse.success) {
      log('User management function is not accessible', 'error');
      return;
    }
    log('Function is accessible', 'success');
    
    // Step 3: Create test users
    const results = await createTestUsers();
    
    // Step 4: Generate report
    await generateTestReport(results);
    
    log('User management system test completed', 'success');
    
  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    console.error(error);
  }
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      testUserManagementSystem();
      break;
    case 'clean':
      cleanupExistingTestUsers();
      break;
    case 'verify':
      const email = process.argv[3];
      if (email) {
        verifyUserCreation(email);
      } else {
        console.log('Usage: node create-test-users.js verify <email>');
      }
      break;
    default:
      console.log('OvenAI User Management Testing Script');
      console.log('');
      console.log('Usage:');
      console.log('  node create-test-users.js create  - Create all test users');
      console.log('  node create-test-users.js clean   - Clean up existing test users');
      console.log('  node create-test-users.js verify <email> - Verify specific user');
      console.log('');
      console.log('Environment variables required:');
      console.log('  SUPABASE_URL');
      console.log('  SUPABASE_SERVICE_ROLE_KEY');
  }
}

export { testUserManagementSystem, createTestUsers, verifyUserCreation, cleanupExistingTestUsers }; 