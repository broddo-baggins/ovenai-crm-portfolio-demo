#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 ACTIVE CHATS DETAILED ANALYSIS');
console.log('=====================================');

async function checkActiveChatsDetailed() {
  try {
    // Load Site DB credentials
    const credentialsPath = path.join(__dirname, '../../credentials/test-credentials.local');
    if (!fs.existsSync(credentialsPath)) {
      throw new Error('❌ Credentials file not found at: ' + credentialsPath);
    }

    const credentials = fs.readFileSync(credentialsPath, 'utf8')
      .split('\n')
      .reduce((acc, line) => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) return acc;
        const [key, value] = line.split('=');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      }, {});

    // Connect to Site DB
    const supabase = createClient(
      credentials.TEST_SUPABASE_URL,
      credentials.TEST_SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('✅ Connected to Site DB:', credentials.TEST_SUPABASE_URL.split('.')[0]);
    console.log('');

    // 1. Check total counts
    console.log('📊 TOTAL DATA COUNTS:');
    console.log('=====================');
    
    const { data: totalLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id');
    
    const { data: totalConversations, error: convsError } = await supabase
      .from('conversations')
      .select('id');
    
    const { data: totalMessages, error: msgsError } = await supabase
      .from('messages')
      .select('id');

    console.log(`📋 Total Leads: ${totalLeads?.length || 0}`);
    console.log(`💬 Total Conversations: ${totalConversations?.length || 0}`);
    console.log(`📩 Total Messages: ${totalMessages?.length || 0}`);
    console.log('');

    // 2. Check conversation statuses in detail
    console.log('💬 CONVERSATION STATUS BREAKDOWN:');
    console.log('==================================');
    
    const { data: conversations, error: convStatusError } = await supabase
      .from('conversations')
      .select('id, status, created_at, updated_at, lead_id');

    if (convStatusError) {
      console.error('❌ Error fetching conversations:', convStatusError);
      return;
    }

    if (!conversations || conversations.length === 0) {
      console.log('❌ No conversations found in database');
      return;
    }

    // Group by status
    const statusCounts = {};
    conversations.forEach(conv => {
      const status = conv.status || 'null';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  "${status}": ${count} conversations`);
    });
    console.log('');

    // 3. Check what the dashboard method counts as "active"
    console.log('🎯 DASHBOARD METHOD ANALYSIS:');
    console.log('=============================');
    
    const activeStatuses = ['active', 'in_progress'];
    const activeConversations = conversations.filter(conv => 
      activeStatuses.includes(conv.status)
    );
    
    console.log(`Looking for statuses: ${activeStatuses.join(', ')}`);
    console.log(`Found ${activeConversations.length} conversations with these statuses`);
    
    if (activeConversations.length > 0) {
      console.log('Active conversations:');
      activeConversations.forEach(conv => {
        console.log(`  - ID: ${conv.id}, Status: "${conv.status}", Lead: ${conv.lead_id}`);
      });
    }
    console.log('');

    // 4. Check what the sidebar method counts as "active"
    console.log('📊 SIDEBAR METHOD ANALYSIS:');
    console.log('===========================');
    
    const { data: leads, error: leadsStatusError } = await supabase
      .from('leads')
      .select('id, status, temperature, created_at, updated_at');

    if (leadsStatusError) {
      console.error('❌ Error fetching leads:', leadsStatusError);
      return;
    }

    if (leads && leads.length > 0) {
      // Group leads by status
      const leadStatusCounts = {};
      leads.forEach(lead => {
        const status = lead.status || 'null';
        leadStatusCounts[status] = (leadStatusCounts[status] || 0) + 1;
      });

      console.log('Lead status distribution:');
      Object.entries(leadStatusCounts).forEach(([status, count]) => {
        console.log(`  Status ${status}: ${count} leads`);
      });

      // Check for sidebar's "active" criteria (status: active, contacted, qualified)
      const sidebarActiveStatuses = ['active', 'contacted', 'qualified'];
      const sidebarActiveLeads = leads.filter(lead => 
        sidebarActiveStatuses.includes(lead.status)
      );
      
      console.log(`\nSidebar looking for statuses: ${sidebarActiveStatuses.join(', ')}`);
      console.log(`Found ${sidebarActiveLeads.length} leads with these statuses`);
    }
    console.log('');

    // 5. Check if conversations have recent messages
    console.log('📩 MESSAGE ACTIVITY ANALYSIS:');
    console.log('=============================');
    
    const { data: recentMessages, error: recentMsgsError } = await supabase
      .from('messages')
      .select('id, conversation_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentMsgsError) {
      console.error('❌ Error fetching recent messages:', recentMsgsError);
    } else if (recentMessages && recentMessages.length > 0) {
      console.log('Most recent messages:');
      recentMessages.forEach(msg => {
        console.log(`  - Conversation ${msg.conversation_id}: ${new Date(msg.created_at).toLocaleString()}`);
      });
      
      // Check which conversations have recent activity
      const activeConversationIds = [...new Set(recentMessages.map(m => m.conversation_id))];
      console.log(`\n${activeConversationIds.length} conversations with recent messages`);
    }
    console.log('');

    // 6. Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (conversations.length > 0 && activeConversations.length === 0) {
      console.log('🔧 Issue found: Conversations exist but none have "active" or "in_progress" status');
      console.log('   The dashboard is looking for exact string matches on conversation.status');
      console.log('   Current statuses in database:', Object.keys(statusCounts).join(', '));
      console.log('');
      console.log('   Possible solutions:');
      console.log('   1. Update conversation statuses to use "active" or "in_progress"');
      console.log('   2. Update dashboard logic to recognize the actual status values');
      console.log('   3. Check if status field uses different values (integers, etc.)');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

checkActiveChatsDetailed(); 