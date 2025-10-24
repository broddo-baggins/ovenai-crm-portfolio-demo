const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function minimalFixRelationships() {
  try {
    console.log('🔧 MINIMAL FIX: Creating missing relationships...\n');
    
    // Step 1: Get existing data to understand what we have
    console.log('📋 Checking existing data...');
    
    const { data: leads } = await supabase
      .from('leads')
      .select('id, first_name, client_id, current_project_id')
      .limit(3);
    
    console.log('Leads found:', leads?.length || 0);
    if (leads?.length) {
      console.log('Sample lead:');
      console.log(`  - ${leads[0].first_name} (client: ${leads[0].client_id}, project: ${leads[0].current_project_id})`);
    }
    
    // Step 2: Create the missing client record
    if (leads?.length && leads[0].client_id) {
      const clientId = leads[0].client_id;
      console.log('\n🏢 Creating minimal client record...');
      
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .upsert({
          id: clientId,
          name: 'Default Client'
          // Only use the most basic fields that definitely exist
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (clientError) {
        console.log('❌ Error creating client:', clientError.message);
        
        // Try even more minimal approach
        const { data: simpleClient, error: simpleError } = await supabase
          .from('clients')
          .insert({
            id: clientId,
            name: 'Default Client'
          })
          .select()
          .single();
        
        if (simpleError) {
          console.log('❌ Simple client creation also failed:', simpleError.message);
        } else {
          console.log('✅ Simple client created');
        }
      } else {
        console.log('✅ Client created/updated');
      }
      
      // Step 3: Create the missing project record
      if (leads[0].current_project_id) {
        const projectId = leads[0].current_project_id;
        console.log('\n📋 Creating minimal project record...');
        
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .upsert({
            id: projectId,
            name: 'Default Project',
            client_id: clientId
          }, { onConflict: 'id' })
          .select()
          .single();
        
        if (projectError) {
          console.log('❌ Error creating project:', projectError.message);
        } else {
          console.log('✅ Project created/updated');
        }
      }
      
      // Step 4: Create the crucial client_members relationship
      const testUserId = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5';
      console.log('\n👥 Creating client membership (THE KEY FIX)...');
      
      const { data: membership, error: membershipError } = await supabase
        .from('client_members')
        .upsert({
          client_id: clientId,
          user_id: testUserId,
          role: 'OWNER'
        }, { onConflict: 'client_id,user_id' })
        .select()
        .single();
      
      if (membershipError) {
        console.log('❌ Error creating membership:', membershipError.message);
        console.log('Full error:', membershipError);
      } else {
        console.log('✅ CRITICAL: Client membership created!');
        console.log(`   User ${testUserId} is now OWNER of client ${clientId}`);
      }
      
      // Step 5: Test the access chain
      console.log('\n🧪 TESTING ACCESS CHAIN...');
      
      const { data: testMemberships } = await supabase
        .from('client_members')
        .select('*')
        .eq('user_id', testUserId);
      
      console.log('User memberships:', testMemberships?.length || 0);
      
      if (testMemberships?.length > 0) {
        console.log('🎉 SUCCESS! Client membership exists!');
        
        // Test project access through client
        const { data: accessibleProjects } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', clientId);
        
        console.log('Accessible projects:', accessibleProjects?.length || 0);
        
        if (accessibleProjects?.length > 0) {
          // Test lead access through project
          const projectIds = accessibleProjects.map(p => p.id);
          const { data: accessibleLeads } = await supabase
            .from('leads')
            .select('*')
            .in('current_project_id', projectIds);
          
          console.log('Accessible leads:', accessibleLeads?.length || 0);
          
          if (accessibleLeads?.length > 0) {
            console.log('\n🎯 COMPLETE SUCCESS!');
            console.log('✅ Client membership: ✓');
            console.log('✅ Project access: ✓');
            console.log('✅ Lead access: ✓');
            console.log('\n🚀 The dashboard should now work! Restart your dev server.');
            return true;
          }
        }
      }
    }
    
    console.log('\n⚠️ Partial success - basic structure created but access chain incomplete');
    return false;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

minimalFixRelationships().then(success => {
  if (success) {
    console.log('\n🎯 DASHBOARD SHOULD NOW WORK!');
    console.log('Next steps:');
    console.log('1. Kill the current dev server (Ctrl+C)');
    console.log('2. Run: npm run dev');
    console.log('3. The loading should be fixed!');
  } else {
    console.log('\n💡 Try restarting the dev server anyway - it might still help');
  }
}); 