const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🔐 Environment check:');
console.log('   URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('   ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function setupTestData() {
  try {
    console.log('🏗️ SETTING UP TEST DATA TO FIX ACCESS ISSUE...\n');
    
    // Check current state
    console.log('📊 Current database state:');
    const tables = ['clients', 'client_members', 'projects', 'leads'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`   ${table}: ${error ? 'ERROR' : count + ' records'}`);
    }
    
    console.log('\n🔧 Creating test data structure...');
    
    // Create a test user ID (in practice, this would come from auth)
    const testUserId = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'; // Use the user ID from the logs
    
    // Step 1: Create a client
    console.log('1. Creating test client...');
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .upsert({
        id: '06a67ac1-bfac-4527-bf73-b1909602573a', // Use existing ID from leads
        name: 'Test Client Company',
        email: 'client@testcompany.com',
        phone: '+1-555-0123',
        status: 'active',
        address: '123 Test Street',
        city: 'Test City',
        created_by: testUserId
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (clientError) {
      console.log('❌ Error creating client:', clientError.message);
      console.log('   Details:', clientError);
    } else {
      console.log('✅ Client created/updated:', client.id);
    }
    
    // Step 2: Create client membership
    console.log('2. Creating client membership...');
    const { data: membership, error: membershipError } = await supabase
      .from('client_members')
      .upsert({
        client_id: '06a67ac1-bfac-4527-bf73-b1909602573a',
        user_id: testUserId,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString()
      }, { onConflict: 'client_id,user_id' })
      .select()
      .single();
    
    if (membershipError) {
      console.log('❌ Error creating membership:', membershipError.message);
      console.log('   Details:', membershipError);
    } else {
      console.log('✅ Membership created/updated');
    }
    
    // Step 3: Create projects
    console.log('3. Creating test projects...');
    const projectsToCreate = [
      {
        id: 'caa0f72f-dc92-4dc1-8bc3-7ed0ee1a7a5a', // Use existing ID from leads
        name: 'Real Estate Project',
        description: 'Primary real estate development project',
        client_id: '06a67ac1-bfac-4527-bf73-b1909602573a',
        status: 'active',
        start_date: new Date().toISOString(),
        created_by: testUserId
      },
      {
        id: 'TDD_UPDATED_PROJECT_1751642743074_1457', // Use ID from logs
        name: 'TDD Updated Project',
        description: 'Test-driven development project',
        client_id: '06a67ac1-bfac-4527-bf73-b1909602573a',
        status: 'active',
        start_date: new Date().toISOString(),
        created_by: testUserId
      }
    ];
    
    for (const project of projectsToCreate) {
      const { data: createdProject, error: projectError } = await supabase
        .from('projects')
        .upsert(project, { onConflict: 'id' })
        .select()
        .single();
      
      if (projectError) {
        console.log(`❌ Error creating project ${project.name}:`, projectError.message);
      } else {
        console.log(`✅ Project created/updated: ${createdProject.name}`);
      }
    }
    
    // Step 4: Update existing leads to ensure they have valid project references
    console.log('4. Ensuring leads have valid project references...');
    const { data: allLeads } = await supabase
      .from('leads')
      .select('id, current_project_id, first_name, last_name')
      .limit(10);
    
    console.log(`   Found ${allLeads?.length || 0} leads`);
    
    if (allLeads?.length) {
      for (const lead of allLeads) {
        if (!lead.current_project_id || lead.current_project_id === 'caa0f72f-dc92-4dc1-8bc3-7ed0ee1a7a5a') {
          // Lead already has the correct project or no project, update if needed
          const { error: updateError } = await supabase
            .from('leads')
            .update({ current_project_id: 'caa0f72f-dc92-4dc1-8bc3-7ed0ee1a7a5a' })
            .eq('id', lead.id);
          
          if (updateError) {
            console.log(`❌ Error updating lead ${lead.first_name}:`, updateError.message);
          }
        }
      }
      console.log('✅ Leads updated to reference valid projects');
    }
    
    console.log('\n🧪 TESTING THE FIXED ACCESS CHAIN...');
    
    // Test the complete access chain
    const { data: memberships } = await supabase
      .from('client_members')
      .select('client_id')
      .eq('user_id', testUserId);
    
    console.log('✅ User memberships:', memberships?.length || 0);
    
    if (memberships?.length) {
      const clientIds = memberships.map(m => m.client_id);
      
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id, name, client_id')
        .in('client_id', clientIds);
      
      console.log('✅ User projects:', userProjects?.length || 0);
      if (userProjects?.length) {
        userProjects.forEach(p => console.log(`   - ${p.name} (${p.id})`));
      }
      
      if (userProjects?.length) {
        const projectIds = userProjects.map(p => p.id);
        
        const { data: userLeads } = await supabase
          .from('leads')
          .select('id, first_name, last_name, current_project_id')
          .in('current_project_id', projectIds);
        
        console.log('✅ User leads:', userLeads?.length || 0);
        if (userLeads?.length) {
          userLeads.slice(0, 3).forEach(l => console.log(`   - ${l.first_name} ${l.last_name}`));
        }
        
        if (userLeads?.length > 0) {
          console.log('\n🎉 SUCCESS! Data access chain is now working!');
          console.log('📊 Summary:');
          console.log(`   - ${memberships.length} client membership(s)`);
          console.log(`   - ${userProjects.length} project(s)`);
          console.log(`   - ${userLeads.length} lead(s)`);
          console.log('\n✅ The dashboard should now load properly with data!');
          
          return true;
        } else {
          console.log('⚠️ Still no leads found. Creating a test lead...');
          
          const { data: testLead, error: leadError } = await supabase
            .from('leads')
            .insert({
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              phone: '+1-555-0199',
              current_project_id: userProjects[0].id,
              status: 'new',
              source: 'setup-script'
            })
            .select()
            .single();
          
          if (leadError) {
            console.log('❌ Error creating test lead:', leadError.message);
            return false;
          } else {
            console.log('✅ Test lead created successfully!');
            return true;
          }
        }
      }
    }
    
    console.log('❌ Data access chain still not working properly.');
    return false;
    
  } catch (error) {
    console.error('❌ Setup error:', error);
    return false;
  }
}

// Run the setup
setupTestData().then(success => {
  if (success) {
    console.log('\n🚀 READY! Restart your development server to see the changes.');
  } else {
    console.log('\n💔 Setup failed. Please check the errors above.');
  }
}); 