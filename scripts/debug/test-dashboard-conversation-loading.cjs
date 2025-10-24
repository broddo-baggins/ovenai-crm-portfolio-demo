#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 DASHBOARD CONVERSATION LOADING DEBUG');
console.log('==========================================');

async function testDashboardConversationLoading() {
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

    // Test 1: Check raw conversation data
    console.log('🧪 TEST 1: Raw Conversation Query');
    console.log('==================================');
    
    const { data: rawConversations, error: rawError } = await supabase
      .from('conversations')
      .select('id, status, lead_id')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (rawError) {
      console.error('❌ Raw conversation query error:', rawError);
      return;
    }

    console.log(`📊 Raw query returned ${rawConversations?.length || 0} conversations`);
    if (rawConversations && rawConversations.length > 0) {
      console.log('Sample conversation:', {
        id: rawConversations[0].id,
        status: rawConversations[0].status,
        lead_id: rawConversations[0].lead_id
      });
    }
    console.log('');

    // Test 2: Check conversation status filtering (same as dashboard)
    console.log('🧪 TEST 2: Dashboard Status Filter Test');
    console.log('======================================');
    
    const { data: activeConversations, error: activeError } = await supabase
      .from('conversations')
      .select('id, status, lead_id')
      .or('status.eq.active,status.eq.in_progress')
      .limit(100);

    if (activeError) {
      console.error('❌ Active conversation query error:', activeError);
    } else {
      console.log(`📊 Active/in_progress conversations: ${activeConversations?.length || 0}`);
      
      if (activeConversations && activeConversations.length > 0) {
        const statusBreakdown = {};
        activeConversations.forEach(conv => {
          statusBreakdown[conv.status] = (statusBreakdown[conv.status] || 0) + 1;
        });
        console.log('Status breakdown:', statusBreakdown);
      }
    }
    console.log('');

    // Test 3: Check lead data access
    console.log('🧪 TEST 3: Lead Access Test');
    console.log('===========================');
    
    const { data: rawLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, current_project_id')
      .limit(5);

    if (leadsError) {
      console.error('❌ Leads query error:', leadsError);
    } else {
      console.log(`📊 Available leads: ${rawLeads?.length || 0}`);
      if (rawLeads && rawLeads.length > 0) {
        console.log('Sample lead:', {
          id: rawLeads[0].id,
          current_project_id: rawLeads[0].current_project_id
        });
      }
    }
    console.log('');

    // Test 4: Project-based conversation filtering (simulate dashboard logic)
    console.log('🧪 TEST 4: Project Filtering Simulation');
    console.log('=======================================');
    
    if (rawLeads && rawLeads.length > 0 && activeConversations && activeConversations.length > 0) {
      const leadIds = rawLeads.map(lead => lead.id);
      
      // Filter conversations by lead IDs (simulating project filtering)
      const projectFilteredConversations = activeConversations.filter(conv => 
        leadIds.includes(conv.lead_id)
      );
      
      console.log(`📊 Conversations after project filtering: ${projectFilteredConversations.length}`);
      console.log(`📊 Total available lead IDs: ${leadIds.length}`);
      console.log(`📊 Total active conversations: ${activeConversations.length}`);
      
      // Show which conversations don't match any leads
      const unmatchedConversations = activeConversations.filter(conv => 
        !leadIds.includes(conv.lead_id)
      ).length;
      
      console.log(`📊 Conversations not matching any lead: ${unmatchedConversations}`);
    }
    console.log('');

    // Test 5: Full dashboard simulation
    console.log('🧪 TEST 5: Full Dashboard Simulation');
    console.log('====================================');
    
    // Get all conversations with status filter
    const { data: allConversations, error: allError } = await supabase
      .from('conversations')
      .select('id, status, lead_id, updated_at')
      .or('status.eq.active,status.eq.in_progress');

    const { data: allLeads, error: allLeadsError } = await supabase
      .from('leads')
      .select('id, current_project_id, project_id');

    if (allError || allLeadsError) {
      console.error('❌ Full simulation query errors:', { allError, allLeadsError });
      return;
    }

    console.log(`📊 Total conversations loaded: ${allConversations?.length || 0}`);
    console.log(`📊 Total leads loaded: ${allLeads?.length || 0}`);

    // Simulate exact dashboard logic
    const projectFilteredConversations = allConversations?.filter(
      (c) => c.status === "active" || c.status === "in_progress"
    ) || [];

    console.log(`📊 FINAL RESULT - Dashboard should show: ${projectFilteredConversations.length} active chats`);
    console.log('');

    // Summary and recommendations
    console.log('💡 ANALYSIS & RECOMMENDATIONS:');
    console.log('==============================');
    
    if (projectFilteredConversations.length > 0) {
      console.log('✅ Data exists and filtering works correctly');
      console.log('🔧 Issue is likely in the simpleProjectService caching/throttling');
      console.log('   Recommended fixes:');
      console.log('   1. Clear the cache/throttling in simpleProjectService');
      console.log('   2. Check circuit breaker state');
      console.log('   3. Verify dashboard is calling getAllConversations correctly');
    } else {
      console.log('❌ No data found or filtering is removing all conversations');
      console.log('   Check lead-conversation relationships');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

testDashboardConversationLoading(); 