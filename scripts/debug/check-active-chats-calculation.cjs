const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActiveChatCalculation() {
  console.log('🔍 ACTIVE CHATS CALCULATION ANALYSIS');
  console.log('=' .repeat(50));
  
  try {
    // Method 1: Dashboard Calculation (RealDataDashboard.tsx)
    console.log('\n📊 METHOD 1: Dashboard Calculation (Conversations-based)');
    console.log('-' .repeat(40));
    
    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select('id, lead_id, status, message_type, created_at')
      .order('created_at', { ascending: false });
    
    if (convError) {
      console.log('❌ Error fetching conversations:', convError.message);
    } else {
      console.log(`📋 Total conversations in system: ${allConversations?.length || 0}`);
      
      // Show status distribution
      const statusCounts = (allConversations || []).reduce((acc, conv) => {
        const status = conv.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Conversation status distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      // Dashboard calculation: status === "active" || status === "in_progress"
      const activeConversations = (allConversations || []).filter(
        (c) => c.status === "active" || c.status === "in_progress"
      );
      
      console.log(`\n🎯 Dashboard Active Chats Result: ${activeConversations.length}`);
      if (activeConversations.length > 0) {
        console.log('📝 Active conversation samples:');
        activeConversations.slice(0, 3).forEach((conv, i) => {
          console.log(`   ${i + 1}. ${conv.id} - Status: ${conv.status} - Lead: ${conv.lead_id}`);
        });
      }
    }
    
    // Method 2: Sidebar Calculation (leads-based)
    console.log('\n📊 METHOD 2: Sidebar Calculation (Leads-based)');
    console.log('-' .repeat(40));
    
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, status, processing_state, current_project_id, created_at')
      .order('created_at', { ascending: false });
    
    if (leadsError) {
      console.log('❌ Error fetching leads:', leadsError.message);
    } else {
      console.log(`📋 Total leads in system: ${allLeads?.length || 0}`);
      
      // Show status distribution
      const leadStatusCounts = (allLeads || []).reduce((acc, lead) => {
        const status = lead.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Lead status distribution:');
      Object.entries(leadStatusCounts).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
      
      // Show processing_state distribution too
      const processingStateCounts = (allLeads || []).reduce((acc, lead) => {
        const state = lead.processing_state || 'unknown';
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Lead processing_state distribution:');
      Object.entries(processingStateCounts).forEach(([state, count]) => {
        console.log(`   - ${state}: ${count}`);
      });
      
      // Sidebar calculation: status === "active" || status === "contacted" || status === "qualified"
      const activeLeads = (allLeads || []).filter((lead) => 
        lead.status === "active" || lead.status === "contacted" || lead.status === "qualified"
      );
      
      console.log(`\n🎯 Sidebar Active Chats Result: ${activeLeads.length}`);
      if (activeLeads.length > 0) {
        console.log('📝 Active lead samples:');
        activeLeads.slice(0, 3).forEach((lead, i) => {
          const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed';
          console.log(`   ${i + 1}. ${lead.id} - ${name} - Status: ${lead.status}`);
        });
      }
    }
    
    // Method 3: Project-specific analysis
    console.log('\n📊 METHOD 3: Project-Specific Analysis');
    console.log('-' .repeat(40));
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('status', 'active');
    
    if (projectsError) {
      console.log('❌ Error fetching projects:', projectsError.message);
    } else {
      console.log(`📋 Active projects: ${projects?.length || 0}`);
      
      if (projects && projects.length > 0) {
        for (const project of projects) {
          console.log(`\n🏗️ Project: ${project.name} (${project.id})`);
          
          // Get leads for this project
          const projectLeads = (allLeads || []).filter(lead => 
            lead.current_project_id === project.id
          );
          
          // Get conversations for this project's leads
          const projectLeadIds = projectLeads.map(l => l.id);
          const projectConversations = (allConversations || []).filter(conv => 
            projectLeadIds.includes(conv.lead_id)
          );
          
          // Calculate active chats for this project using both methods
          const projectActiveConvs = projectConversations.filter(
            (c) => c.status === "active" || c.status === "in_progress"
          );
          
          const projectActiveLeads = projectLeads.filter((lead) => 
            lead.status === "active" || lead.status === "contacted" || lead.status === "qualified"
          );
          
          console.log(`   📊 Total leads: ${projectLeads.length}`);
          console.log(`   📊 Total conversations: ${projectConversations.length}`);
          console.log(`   🎯 Active chats (conversation method): ${projectActiveConvs.length}`);
          console.log(`   🎯 Active chats (lead method): ${projectActiveLeads.length}`);
        }
      }
    }
    
    // Summary and explanation
    console.log('\n📋 SUMMARY & EXPLANATION');
    console.log('=' .repeat(50));
    console.log('The "0 in quick state" you\'re seeing is likely correct if:');
    console.log('');
    console.log('1️⃣ Dashboard Method (Conversations):');
    console.log('   - Counts conversations with status "active" or "in_progress"');
    console.log('   - Used in: RealDataDashboard.tsx');
    console.log('');
    console.log('2️⃣ Sidebar Method (Leads):');
    console.log('   - Counts leads with status "active", "contacted", or "qualified"');  
    console.log('   - Used in: Sidebar.tsx');
    console.log('');
    console.log('💡 To have active chats showing:');
    console.log('   - For dashboard: Need conversations with status "active" or "in_progress"');
    console.log('   - For sidebar: Need leads with status "active", "contacted", or "qualified"');
    console.log('');
    console.log('🔍 Check the status distributions above to see what data you currently have.');
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

// Run the analysis
checkActiveChatCalculation(); 