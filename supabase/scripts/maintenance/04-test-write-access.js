import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials
const credentialsPath = path.join(__dirname, '../../supabase-credentials.local');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

const getCredential = (key) => {
  const line = credentials.split('\n').find(line => line.startsWith(`${key}=`));
  return line ? line.split('=')[1] : null;
};

const supabaseUrl = getCredential('SUPABASE_URL');
const serviceRoleKey = getCredential('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('✍️  TESTING WRITE ACCESS TO ALL TABLES');
console.log('================================================================================');
console.log('Service Role Key should bypass RLS and allow all writes');
console.log('Testing each table with appropriate test data');
console.log('');

async function testClientWrite() {
  console.log('🏢 Testing CLIENTS table write access...');
  
  try {
    const testClient = {
      name: 'Write Test Client',
      description: 'Testing write access to clients table',
      status: 'ACTIVE'
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(testClient)
      .select()
      .single();

    if (error) {
      console.log('   ❌ CLIENTS write failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('   ✅ CLIENTS write successful');
    console.log(`   📋 Created client: ${data.name} (${data.id})`);

    // Clean up
    await supabase.from('clients').delete().eq('id', data.id);
    console.log('   🧹 Test client cleaned up');

    return { success: true, id: data.id };

  } catch (err) {
    console.log('   ❌ CLIENTS exception:', err.message);
    return { success: false, error: err.message };
  }
}

async function testProfileWrite() {
  console.log('');
  console.log('👤 Testing PROFILES table write access...');
  
  try {
    const testProfile = {
      first_name: 'Test',
      last_name: 'User',
      email: `test-${Date.now()}@example.com`,
      role: 'client_admin',
      status: 'active'
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select()
      .single();

    if (error) {
      console.log('   ❌ PROFILES write failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log('   ✅ PROFILES write successful');
    console.log(`   📋 Created profile: ${data.first_name} ${data.last_name} (${data.id})`);

    // Clean up
    await supabase.from('profiles').delete().eq('id', data.id);
    console.log('   🧹 Test profile cleaned up');

    return { success: true, id: data.id };

  } catch (err) {
    console.log('   ❌ PROFILES exception:', err.message);
    return { success: false, error: err.message };
  }
}

async function testProjectWrite() {
  console.log('');
  console.log('📊 Testing PROJECTS table write access...');
  
  try {
    // First create a test client to reference
    const { data: testClient } = await supabase
      .from('clients')
      .insert({ name: 'Test Client for Project', status: 'ACTIVE' })
      .select()
      .single();

    if (!testClient) {
      console.log('   ❌ Cannot create test client for project test');
      return { success: false, error: 'Client creation failed' };
    }

    const testProject = {
      name: 'Test Project',
      description: 'Testing write access to projects table',
      client_id: testClient.id,
      status: 'active'
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single();

    if (error) {
      console.log('   ❌ PROJECTS write failed:', error.message);
      // Clean up test client
      await supabase.from('clients').delete().eq('id', testClient.id);
      return { success: false, error: error.message };
    }

    console.log('   ✅ PROJECTS write successful');
    console.log(`   📋 Created project: ${data.name} (${data.id})`);

    // Clean up
    await supabase.from('projects').delete().eq('id', data.id);
    await supabase.from('clients').delete().eq('id', testClient.id);
    console.log('   🧹 Test project and client cleaned up');

    return { success: true, id: data.id };

  } catch (err) {
    console.log('   ❌ PROJECTS exception:', err.message);
    return { success: false, error: err.message };
  }
}

async function testLeadWrite() {
  console.log('');
  console.log('👥 Testing LEADS table write access...');
  
  try {
    // Create test client and project
    const { data: testClient } = await supabase
      .from('clients')
      .insert({ name: 'Test Client for Lead', status: 'ACTIVE' })
      .select()
      .single();

    const { data: testProject } = await supabase
      .from('projects')
      .insert({ 
        name: 'Test Project for Lead', 
        client_id: testClient.id, 
        status: 'active' 
      })
      .select()
      .single();

    const testLead = {
      project_id: testProject.id,
      first_name: 'Test',
      last_name: 'Lead',
      email: `testlead-${Date.now()}@example.com`,
      phone: '+1555000000',
      status: 'new',
      source: 'test',
      notes: 'Testing write access to leads table'
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(testLead)
      .select()
      .single();

    if (error) {
      console.log('   ❌ LEADS write failed:', error.message);
      // Clean up
      await supabase.from('projects').delete().eq('id', testProject.id);
      await supabase.from('clients').delete().eq('id', testClient.id);
      return { success: false, error: error.message };
    }

    console.log('   ✅ LEADS write successful');
    console.log(`   📋 Created lead: ${data.first_name} ${data.last_name} (${data.id})`);

    // Clean up
    await supabase.from('leads').delete().eq('id', data.id);
    await supabase.from('projects').delete().eq('id', testProject.id);
    await supabase.from('clients').delete().eq('id', testClient.id);
    console.log('   🧹 Test lead, project, and client cleaned up');

    return { success: true, id: data.id };

  } catch (err) {
    console.log('   ❌ LEADS exception:', err.message);
    return { success: false, error: err.message };
  }
}

async function testMembershipWrites() {
  console.log('');
  console.log('👨‍👩‍👧‍👦 Testing MEMBERSHIP tables write access...');
  
  try {
    // Create test data
    const { data: testClient } = await supabase
      .from('clients')
      .insert({ name: 'Test Client for Membership', status: 'ACTIVE' })
      .select()
      .single();

    const { data: testProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({ 
        first_name: 'Test', 
        last_name: 'Member',
        email: `testmember-${Date.now()}@example.com`,
        role: 'member',
        status: 'active'
      })
      .select()
      .single();

    if (profileError || !testProfile) {
      console.log('   ❌ Failed to create test profile for membership test:', profileError?.message);
      await supabase.from('clients').delete().eq('id', testClient.id);
      return { clientMembers: false, projectMembers: false, error: 'Profile creation failed' };
    }

    const { data: testProject } = await supabase
      .from('projects')
      .insert({ 
        name: 'Test Project for Membership', 
        client_id: testClient.id, 
        status: 'active' 
      })
      .select()
      .single();

    // Test client_members
    const { data: clientMember, error: clientMemberError } = await supabase
      .from('client_members')
      .insert({
        client_id: testClient.id,
        user_id: testProfile.id,
        role: 'member'
      })
      .select()
      .single();

    if (clientMemberError) {
      console.log('   ❌ CLIENT_MEMBERS write failed:', clientMemberError.message);
    } else {
      console.log('   ✅ CLIENT_MEMBERS write successful');
    }

    // Test project_members
    const { data: projectMember, error: projectMemberError } = await supabase
      .from('project_members')
      .insert({
        project_id: testProject.id,
        user_id: testProfile.id,
        role: 'member'
      })
      .select()
      .single();

    if (projectMemberError) {
      console.log('   ❌ PROJECT_MEMBERS write failed:', projectMemberError.message);
    } else {
      console.log('   ✅ PROJECT_MEMBERS write successful');
    }

    // Clean up
    if (clientMember) await supabase.from('client_members').delete().eq('id', clientMember.id);
    if (projectMember) await supabase.from('project_members').delete().eq('id', projectMember.id);
    await supabase.from('projects').delete().eq('id', testProject.id);
    await supabase.from('profiles').delete().eq('id', testProfile.id);
    await supabase.from('clients').delete().eq('id', testClient.id);
    console.log('   🧹 Test membership data cleaned up');

    return { 
      clientMembers: !clientMemberError, 
      projectMembers: !projectMemberError 
    };

  } catch (err) {
    console.log('   ❌ MEMBERSHIP exception:', err.message);
    return { clientMembers: false, projectMembers: false, error: err.message };
  }
}

async function checkRLSStatus() {
  console.log('');
  console.log('🔒 Checking Row Level Security status...');
  
  const tables = ['clients', 'projects', 'leads', 'profiles', 'client_members', 'project_members'];
  
  for (const table of tables) {
    try {
      // Service role should bypass RLS, but let's check what happens
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Accessible (RLS bypassed by service role)`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: Exception - ${err.message}`);
    }
  }
}

async function generateWriteAccessReport(results) {
  console.log('');
  console.log('📊 WRITE ACCESS REPORT');
  console.log('================================================================================');
  
  const tableResults = {
    clients: results.clients?.success || false,
    profiles: results.profiles?.success || false,
    projects: results.projects?.success || false,
    leads: results.leads?.success || false,
    client_members: results.memberships?.clientMembers || false,
    project_members: results.memberships?.projectMembers || false
  };

  console.log('📝 Table Write Access Status:');
  Object.entries(tableResults).forEach(([table, success]) => {
    console.log(`   ${success ? '✅' : '❌'} ${table}: ${success ? 'WORKING' : 'BLOCKED'}`);
  });

  const workingTables = Object.values(tableResults).filter(Boolean).length;
  const totalTables = Object.keys(tableResults).length;

  console.log('');
  console.log(`📈 Overall Status: ${workingTables}/${totalTables} tables writable`);

  if (workingTables === totalTables) {
    console.log('🎉 SUCCESS: Full write access confirmed!');
    console.log('✅ Ready to create Sarah Martinez data');
    console.log('');
    console.log('Next step: node 02-create-sarah-data.js');
  } else {
    console.log('⚠️  Some tables have write issues');
    console.log('🔧 Troubleshooting needed for blocked tables');
    
    // Show specific errors
    Object.entries(results).forEach(([test, result]) => {
      if (result && result.error) {
        console.log(`   ${test}: ${result.error}`);
      }
    });
  }

  return { workingTables, totalTables, tableResults };
}

async function main() {
  console.log('🚀 Starting comprehensive write access test...\n');
  
  const results = {};
  
  results.clients = await testClientWrite();
  results.profiles = await testProfileWrite();
  results.projects = await testProjectWrite();
  results.leads = await testLeadWrite();
  results.memberships = await testMembershipWrites();
  
  await checkRLSStatus();
  
  const report = await generateWriteAccessReport(results);
  
  console.log('');
  console.log('================================================================================');
  if (report.workingTables === report.totalTables) {
    console.log('🎯 READY: All tables writable. Proceed with data creation!');
  } else {
    console.log('🔧 ACTION NEEDED: Fix write access issues above');
  }
}

main().catch(console.error); 