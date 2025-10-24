const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugDataAccess() {
  try {
    console.log('🔍 DEBUGGING DATA ACCESS ISSUE...\n');
    
    // Test basic connection
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    console.log('✅ Supabase connection:', usersError ? 'FAILED' : 'SUCCESS');
    
    // Check tables exist
    const tables = ['client_members', 'clients', 'projects', 'leads'];
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 ${table}: ${error ? 'ERROR' : count + ' records'}`);
      if (error) console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n🔍 CHECKING DATA RELATIONSHIPS...');
    
    // Check if there are any client_members
    const { data: memberships, error: memberError } = await supabase
      .from('client_members')
      .select('*')
      .limit(5);
    
    console.log('👥 Client memberships sample:', memberships?.length || 0);
    if (memberships?.length) {
      console.log('   Sample:', memberships[0]);
    }
    
    // Check if there are any clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5);
    
    console.log('🏢 Clients sample:', clients?.length || 0);
    if (clients?.length) {
      console.log('   Sample:', clients[0]);
    }
    
    // Check if there are any projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);
    
    console.log('📋 Projects sample:', projects?.length || 0);
    if (projects?.length) {
      console.log('   Sample:', projects[0]);
    }
    
    // Check if there are any leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(5);
    
    console.log('👤 Leads sample:', leads?.length || 0);
    if (leads?.length) {
      console.log('   Sample:', leads[0]);
    }
    
    console.log('\n🔍 CHECKING RELATIONSHIP INTEGRITY...');
    
    // Check if projects have valid client_id references
    if (projects?.length && clients?.length) {
      const clientIds = clients.map(c => c.id);
      const projectsWithValidClients = projects.filter(p => clientIds.includes(p.client_id));
      console.log(`📊 Projects with valid client_id: ${projectsWithValidClients.length}/${projects.length}`);
    }
    
    // Check if leads have valid current_project_id references
    if (leads?.length && projects?.length) {
      const projectIds = projects.map(p => p.id);
      const leadsWithValidProjects = leads.filter(l => projectIds.includes(l.current_project_id));
      console.log(`📊 Leads with valid current_project_id: ${leadsWithValidProjects.length}/${leads.length}`);
    }
    
    console.log('\n🔍 TESTING SPECIFIC USER ACCESS...');
    
    // Try to find a specific user and trace their access
    const { data: allMemberships } = await supabase
      .from('client_members')
      .select('user_id, client_id')
      .limit(1);
    
    if (allMemberships?.length) {
      const testUserId = allMemberships[0].user_id;
      console.log('🧪 Testing with user_id:', testUserId);
      
      // Follow the full chain
      const { data: userMemberships } = await supabase
        .from('client_members')
        .select('client_id')
        .eq('user_id', testUserId);
      
      if (userMemberships?.length) {
        const clientIds = userMemberships.map(m => m.client_id);
        console.log('   Client IDs:', clientIds);
        
        const { data: userProjects } = await supabase
          .from('projects')
          .select('id, name, client_id')
          .in('client_id', clientIds);
        
        console.log('   Projects:', userProjects?.length || 0);
        
        if (userProjects?.length) {
          const projectIds = userProjects.map(p => p.id);
          console.log('   Project IDs:', projectIds);
          
          const { data: userLeads } = await supabase
            .from('leads')
            .select('id, first_name, last_name, current_project_id')
            .in('current_project_id', projectIds);
          
          console.log('   Leads:', userLeads?.length || 0);
          
          if (userLeads?.length === 0) {
            console.log('❌ NO LEADS FOUND - This is the issue!');
            
            // Check if leads exist but with wrong project references
            const { data: allLeadsWithProjectIds } = await supabase
              .from('leads')
              .select('id, current_project_id')
              .not('current_project_id', 'is', null)
              .limit(10);
            
            console.log('   Leads with project IDs:', allLeadsWithProjectIds?.length || 0);
            if (allLeadsWithProjectIds?.length) {
              console.log('   Sample project IDs in leads:', allLeadsWithProjectIds.map(l => l.current_project_id).slice(0, 5));
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugDataAccess(); 