#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING SIDEBAR FIX');
console.log('======================');

async function testSidebarFix() {
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

    // Simulate the new sidebar logic for "Test project"
    console.log('\n🔄 SIMULATING NEW SIDEBAR LOGIC:');
    console.log('================================');

    // Step 1: Get all projects to find "Test project"
    const { data: allProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name');

    if (projectsError) throw new Error('Failed to get projects: ' + projectsError.message);

    const testProject = allProjects?.find(p => p.name?.toLowerCase().includes('test'));
    
    if (!testProject) {
      console.log('❌ No "Test project" found. Available projects:');
      allProjects?.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));
      return;
    }

    console.log(`✅ Found Test project: "${testProject.name}" (ID: ${testProject.id})`);

    // Step 2: Get leads for Test project  
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, current_project_id, first_name, last_name, status');

    if (leadsError) throw new Error('Failed to get leads: ' + leadsError.message);

    // Filter leads for Test project (using only current_project_id)
    const projectLeads = allLeads?.filter(lead => 
      lead.current_project_id === testProject.id
    ) || [];

    console.log(`📋 Test project has ${projectLeads.length} leads`);

    // Step 3: Get conversations and count active ones for this project
    const { data: allConversations, error: convError } = await supabase
      .from('conversations')
      .select('id, status, lead_id');

    if (convError) throw new Error('Failed to get conversations: ' + convError.message);

    const projectLeadIds = projectLeads.map(lead => lead.id);
    const activeConversations = allConversations?.filter(conv => 
      (conv.status === 'active' || conv.status === 'in_progress') &&
      projectLeadIds.includes(conv.lead_id)
    ) || [];

    console.log(`✅ NEW SIDEBAR RESULT: ${activeConversations.length} active chats`);
    console.log(`   (Found ${allConversations?.length || 0} total conversations)`);
    console.log(`   (${activeConversations.filter(c => c.status === 'active').length} "active" + ${activeConversations.filter(c => c.status === 'in_progress').length} "in_progress")`);

    // Step 4: Compare with old logic
    const oldLogicCount = projectLeads.filter(lead => 
      lead.status === "active" || lead.status === "contacted" || lead.status === "qualified"
    ).length;

    console.log(`\n📊 COMPARISON:`);
    console.log(`   Old logic (lead status): ${oldLogicCount} active chats`);
    console.log(`   New logic (conversations): ${activeConversations.length} active chats`);
    
    if (activeConversations.length > 0) {
      console.log('✅ SUCCESS: Sidebar should now show active chats!');
    } else {
      console.log('⚠️  Still 0 - Test project may genuinely have no active conversations');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSidebarFix(); 