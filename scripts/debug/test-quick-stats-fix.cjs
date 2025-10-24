#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING QUICK STATS FIX');
console.log('===========================');

async function testQuickStatsFix() {
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

    // Simulate the exact dashboard logic after our fix
    console.log('\n🔄 Simulating Dashboard Logic After Fix:');
    console.log('========================================');

    // Get all conversations
    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select('id, status, lead_id')
      .limit(1000);

    if (convError) {
      throw new Error('Failed to get conversations: ' + convError.message);
    }

    console.log(`📊 Total conversations loaded: ${allConversations?.length || 0}`);

    // Get all leads
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, current_project_id')
      .limit(1000);

    if (leadsError) {
      throw new Error('Failed to get leads: ' + leadsError.message);
    }

    console.log(`📊 Total leads loaded: ${allLeads?.length || 0}`);

    // Simulate filtering logic (when no specific project is selected)
    const projectFilteredLeads = allLeads || [];
    const projectFilteredConversations = allConversations || [];

    // Apply the new active chats logic
    const activeChats = projectFilteredConversations.filter((conv) => {
      // Check if conversation is active or in_progress
      if (conv.status === "active" || conv.status === "in_progress") {
        // For this test, we're simulating no specific project filter
        // So all active/in_progress conversations should count
        return true;
      }
      return false;
    }).length;

    console.log(`\n📊 RESULT - Active Chats Count: ${activeChats}`);
    console.log(`📊 Expected: ~827 (from our earlier analysis)`);
    
    if (activeChats > 800) {
      console.log('✅ SUCCESS: Active chats count looks correct!');
    } else if (activeChats > 100) {
      console.log('⚠️  PARTIAL: Getting some active chats, but might still have filtering issues');
    } else {
      console.log('❌ ISSUE: Still getting low active chats count');
    }

    // Breakdown by status
    const statusBreakdown = {};
    projectFilteredConversations.forEach(conv => {
      if (conv.status === "active" || conv.status === "in_progress") {
        statusBreakdown[conv.status] = (statusBreakdown[conv.status] || 0) + 1;
      }
    });

    console.log('\n📈 Active Conversation Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQuickStatsFix(); 