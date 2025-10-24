#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 CHECKING AGENT DB (MASTER DATABASE)...');

// Agent DB (Master) - READ ONLY
const agentDB = createClient(
  'https://imnyrhjdoaccxenxyfam.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbnlyaGpkb2FjY3hlbnh5ZmFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjczODQ1MCwiZXhwIjoyMDYyMzE0NDUwfQ.mpikoadGg90yaaLibpLekymlFSttsWy2PQtgRuEPlBM',
  { 
    auth: { 
      autoRefreshToken: false, 
      persistSession: false 
    } 
  }
);

async function checkAgentDB() {
  try {
    console.log('\n📊 AGENT DB LEADS ANALYSIS...');
    
    // Get total count
    const { count, error: countError } = await agentDB
      .from('leads')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error('❌ Error getting count:', countError.message);
      return;
    }
    
    console.log(`📈 TOTAL LEADS IN AGENT DB: ${count}`);
    
    // Get sample leads
    const { data: sampleLeads, error: sampleError } = await agentDB
      .from('leads')
      .select('id, first_name, last_name, phone, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (sampleError) {
      console.error('❌ Error getting sample:', sampleError.message);
      return;
    }
    
    console.log('\n📋 SAMPLE LEADS (latest 10):');
    sampleLeads?.forEach((lead, index) => {
      const hasHebrew = /[\u0590-\u05FF]/.test(lead.first_name) || /[\u0590-\u05FF]/.test(lead.last_name);
      const marker = hasHebrew ? '🇮🇱' : '⚠️ ';
      console.log(`   ${index + 1}. ${marker} ${lead.first_name} ${lead.last_name} | ${lead.phone} | ${lead.status}`);
    });
    
    // Check for test data pollution
    const { data: testData, error: testError } = await agentDB
      .from('leads')
      .select('id, first_name, last_name')
      .or('first_name.ilike.%regression%,first_name.ilike.%test%,last_name.ilike.%testsurname%,first_name.ilike.%queue%')
      .limit(10);
      
    if (!testError && testData) {
      console.log(`\n🧪 TEST DATA POLLUTION IN AGENT DB: ${testData.length} test leads found`);
      if (testData.length > 0) {
        testData.forEach(lead => {
          console.log(`   ⚠️  ${lead.first_name} ${lead.last_name}`);
        });
      }
    }
    
    // Check Hebrew content ratio
    const { data: allLeads, error: allError } = await agentDB
      .from('leads')
      .select('first_name, last_name')
      .limit(100);
      
    if (!allError && allLeads) {
      const hebrewCount = allLeads.filter(lead => 
        /[\u0590-\u05FF]/.test(lead.first_name) || /[\u0590-\u05FF]/.test(lead.last_name)
      ).length;
      
      const hebrewRatio = (hebrewCount / allLeads.length * 100).toFixed(1);
      console.log(`\n🇮🇱 HEBREW CONTENT: ${hebrewCount}/${allLeads.length} (${hebrewRatio}%) of sample leads have Hebrew letters`);
    }
    
    console.log('\n✅ AGENT DB ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('💥 AGENT DB CHECK FAILED:', error.message);
  }
}

checkAgentDB(); 