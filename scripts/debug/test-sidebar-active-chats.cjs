#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 SIDEBAR ACTIVE CHATS DEBUG');
console.log('=============================');

async function testSidebarActiveChats() {
  try {
    // Load test credentials
    const credentialsPath = path.join(__dirname, '../../credentials/test-credentials.local');
    const credentials = fs.readFileSync(credentialsPath, 'utf8')
      .split('\n')
      .reduce((acc, line) => {
        if (line.trim().startsWith('#') || !line.trim()) return acc;
        const [key, value] = line.split('=');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      }, {});

    const supabase = createClient(
      credentials.TEST_SUPABASE_URL,
      credentials.TEST_SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Connected to test database');

    // Check what lead statuses actually exist in the test project
    console.log('\n📊 ACTUAL LEAD STATUSES IN DATABASE:');
    console.log('=====================================');
    
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, current_project_id, first_name, last_name');

    if (leadsError) {
      throw new Error('Failed to get leads: ' + leadsError.message);
    }

    console.log(`📋 Total leads found: ${allLeads?.length || 0}`);

    // Group by status
    const statusCounts = {};
    allLeads?.forEach(lead => {
      const status = lead.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📈 Lead Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} leads`);
    });

    // Test current sidebar logic
    console.log('\n🧪 CURRENT SIDEBAR LOGIC TEST:');
    console.log('==============================');
    
    const currentSidebarActiveLeads = allLeads?.filter((lead) => {
      return lead.status === "active" || lead.status === "contacted" || lead.status === "qualified";
    }) || [];

    console.log(`❌ Current sidebar logic finds: ${currentSidebarActiveLeads.length} active leads`);
    console.log('   (Looking for status: "active", "contacted", "qualified")');

    // Test better logic - count leads with active conversations
    console.log('\n💡 IMPROVED LOGIC TEST:');
    console.log('=======================');

    // Get all conversations  
    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select('id, status, lead_id')
      .or('status.eq.active,status.eq.in_progress');

    if (convError) {
      console.error('❌ Conversation error:', convError);
    } else {
      // Count unique lead IDs with active conversations
      const leadsWithActiveConversations = new Set();
      allConversations?.forEach(conv => {
        if (conv.lead_id) {
          leadsWithActiveConversations.add(conv.lead_id);
        }
      });

      const improvedActiveChatsCount = leadsWithActiveConversations.size;
      console.log(`✅ Improved logic finds: ${improvedActiveChatsCount} leads with active conversations`);
      console.log(`✅ This matches ${allConversations?.length || 0} total active conversations`);
    }

    // Also check if status values are integers
    console.log('\n🔍 STATUS DATA TYPE ANALYSIS:');
    console.log('=============================');
    
    if (allLeads && allLeads.length > 0) {
      const firstLead = allLeads[0];
      console.log(`Sample lead status: ${firstLead.status} (type: ${typeof firstLead.status})`);
      
      if (typeof firstLead.status === 'number') {
        console.log('⚠️  ISSUE: Lead statuses are INTEGERS, not strings!');
        console.log('   Sidebar is looking for strings but getting numbers');
        
        // Show integer status breakdown
        console.log('\n📊 If statuses are integers, possible mappings:');
        const uniqueIntStatuses = [...new Set(allLeads.map(l => l.status))].sort();
        uniqueIntStatuses.forEach(status => {
          const count = allLeads.filter(l => l.status === status).length;
          console.log(`   Status ${status}: ${count} leads`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSidebarActiveChats(); 