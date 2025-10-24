#!/usr/bin/env node

/**
 * Complete System Test
 * 
 * Tests the enhanced authentication and client management system
 * with full database access via service role key.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🧪 Testing Complete System with Enhanced Features\n');

async function testDatabaseAccess() {
  console.log('📊 Testing Database Access...');
  
  try {
    // Test all table access
    const tables = ['profiles', 'clients', 'client_members', 'projects', 'project_members', 'leads'];
    
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) throw error;
      console.log(`  ✅ ${table} table: Accessible`);
    }
    
    return true;
  } catch (error) {
    console.error('  ❌ Database access failed:', error.message);
    return false;
  }
}

async function testClientOperations() {
  console.log('\n🏢 Testing Client Management...');
  
  try {
    // Create test client
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        name: `Test Client ${Date.now()}`,
        description: 'Test client for system verification',
        status: 'active'
      })
      .select()
      .single();
    
    if (clientError) throw clientError;
    console.log(`  ✅ Client created: ${client.name} (ID: ${client.id})`);
    
    // Create test project for the client
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        name: `Test Project ${Date.now()}`,
        description: 'Test project for system verification',
        client_id: client.id,
        status: 'active'
      })
      .select()
      .single();
    
    if (projectError) throw projectError;
    console.log(`  ✅ Project created: ${project.name} (ID: ${project.id})`);
    
    // Create test lead for the project
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert({
        project_id: project.id,
        first_name: 'Test',
        last_name: 'Lead',
        email: `testlead${Date.now()}@example.com`,
        phone: '+1234567890',
        status: 'new',
        source: 'system_test'
      })
      .select()
      .single();
    
    if (leadError) throw leadError;
    console.log(`  ✅ Lead created: ${lead.first_name} ${lead.last_name} (ID: ${lead.id})`);
    
    // Test relationship query
    const { data: clientWithProjects, error: relationError } = await supabaseAdmin
      .from('clients')
      .select(`
        *,
        projects:projects(
          *,
          leads:leads(*)
        )
      `)
      .eq('id', client.id)
      .single();
    
    if (relationError) throw relationError;
    console.log(`  ✅ Relationship query successful`);
    console.log(`    - Client: ${clientWithProjects.name}`);
    console.log(`    - Projects: ${clientWithProjects.projects.length}`);
    console.log(`    - Leads: ${clientWithProjects.projects[0]?.leads?.length || 0}`);
    
    return {
      client,
      project,
      lead,
      success: true
    };
  } catch (error) {
    console.error('  ❌ Client operations failed:', error.message);
    return { success: false };
  }
}

async function testAuthOperations() {
  console.log('\n🔐 Testing Authentication Operations...');
  
  try {
    // Test profile creation (simulating user registration)
    const testUserId = `test-user-${Date.now()}`;
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: testUserId,
        first_name: 'Test',
        last_name: 'User',
        email: `testuser${Date.now()}@example.com`,
        phone: '+1234567890',
        role: 'user',
        status: 'active'
      })
      .select()
      .single();
    
    if (profileError) throw profileError;
    console.log(`  ✅ Profile created: ${profile.first_name} ${profile.last_name} (ID: ${profile.id})`);
    
    // Test profile retrieval
    const { data: retrievedProfile, error: retrieveError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (retrieveError) throw retrieveError;
    console.log(`  ✅ Profile retrieved successfully`);
    
    return {
      profile,
      success: true
    };
  } catch (error) {
    console.error('  ❌ Auth operations failed:', error.message);
    return { success: false };
  }
}

async function testCompleteWorkflow() {
  console.log('\n🔄 Testing Complete User→Client→Project→Leads Workflow...');
  
  try {
    // 1. Create user profile
    const userId = `workflow-user-${Date.now()}`;
    const { data: user } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        first_name: 'Workflow',
        last_name: 'User',
        email: `workflow${Date.now()}@example.com`,
        role: 'admin',
        status: 'active'
      })
      .select()
      .single();
    
    console.log(`  1. ✅ User profile created: ${user.first_name} ${user.last_name}`);
    
    // 2. Create client
    const { data: client } = await supabaseAdmin
      .from('clients')
      .insert({
        name: `Workflow Client ${Date.now()}`,
        description: 'Client for complete workflow test',
        status: 'active'
      })
      .select()
      .single();
    
    console.log(`  2. ✅ Client created: ${client.name}`);
    
    // 3. Add user to client
    const { data: membership } = await supabaseAdmin
      .from('client_members')
      .insert({
        client_id: client.id,
        user_id: userId,
        role: 'admin'
      })
      .select()
      .single();
    
    console.log(`  3. ✅ User added to client as: ${membership.role}`);
    
    // 4. Create project under client
    const { data: project } = await supabaseAdmin
      .from('projects')
      .insert({
        name: `Workflow Project ${Date.now()}`,
        description: 'Project for complete workflow test',
        client_id: client.id,
        status: 'active'
      })
      .select()
      .single();
    
    console.log(`  4. ✅ Project created: ${project.name}`);
    
    // 5. Add user to project
    const { data: projectMembership } = await supabaseAdmin
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: userId,
        role: 'manager'
      })
      .select()
      .single();
    
    console.log(`  5. ✅ User added to project as: ${projectMembership.role}`);
    
    // 6. Create leads under project
    const leads = await Promise.all([
      supabaseAdmin.from('leads').insert({
        project_id: project.id,
        first_name: 'Alice',
        last_name: 'Johnson',
        email: `alice${Date.now()}@example.com`,
        status: 'new',
        source: 'website'
      }).select().single(),
      supabaseAdmin.from('leads').insert({
        project_id: project.id,
        first_name: 'Bob',
        last_name: 'Smith',
        email: `bob${Date.now()}@example.com`,
        status: 'contacted',
        source: 'referral'
      }).select().single()
    ]);
    
    console.log(`  6. ✅ Created ${leads.length} leads`);
    
    // 7. Test complete relationship query
    const { data: completeData } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        client_memberships:client_members(
          *,
          client:clients(
            *,
            projects:projects(
              *,
              leads:leads(*),
              project_members:project_members(*)
            )
          )
        )
      `)
      .eq('id', userId)
      .single();
    
    console.log(`  7. ✅ Complete relationship query successful`);
    console.log(`     - User: ${completeData.first_name} ${completeData.last_name}`);
    console.log(`     - Client memberships: ${completeData.client_memberships.length}`);
    console.log(`     - Projects: ${completeData.client_memberships[0]?.client.projects.length || 0}`);
    console.log(`     - Total leads: ${completeData.client_memberships[0]?.client.projects[0]?.leads.length || 0}`);
    
    return { success: true };
  } catch (error) {
    console.error('  ❌ Complete workflow failed:', error.message);
    return { success: false };
  }
}

async function runTests() {
  console.log('🎯 Starting Enhanced System Tests...\n');
  
  const results = {
    databaseAccess: await testDatabaseAccess(),
    authOperations: await testAuthOperations(),
    clientOperations: await testClientOperations(),
    completeWorkflow: await testCompleteWorkflow()
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('================================');
  console.log(`Database Access: ${results.databaseAccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Auth Operations: ${results.authOperations.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Client Operations: ${results.clientOperations.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Complete Workflow: ${results.completeWorkflow.success ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => 
    typeof result === 'boolean' ? result : result.success
  );
  
  console.log('\n🎉 Overall Result:');
  console.log(`${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🚀 System is ready for full development!');
    console.log('📍 Next steps:');
    console.log('   1. Copy environment variables to .env file');
    console.log('   2. Start development server');
    console.log('   3. Test authentication and client management in UI');
    console.log('   4. Build complete User→Client→Project→Leads workflow');
  }
  
  return allPassed;
}

runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }); 