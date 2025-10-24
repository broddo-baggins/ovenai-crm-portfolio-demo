#!/usr/bin/env node

/**
 * Check Valid Test Data - Find valid user IDs and status values for queue testing
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const supabaseUrl = credentials.supabase.development.url;
const supabaseKey = credentials.supabase.development.service_role_key;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 CHECKING VALID TEST DATA');
console.log('===========================');

async function checkValidData() {
  try {
    // 1. Check auth.users table
    console.log('\n👥 AUTH.USERS TABLE:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(10);
    
    if (usersError) {
      console.log('❌ Cannot access users table:', usersError.message);
      
      // Try auth.users directly via RPC or different approach
      console.log('🔄 Trying alternative approach...');
      
      // Check if we can find any user references from leads table
      const { data: leadsWithUsers } = await supabase
        .from('leads')
        .select('client_id, current_project_id')
        .not('client_id', 'is', null)
        .limit(5);
      
      console.log('📋 User IDs found in leads table:');
      leadsWithUsers?.forEach(lead => {
        if (lead.client_id) console.log(`   • client_id: ${lead.client_id}`);
        if (lead.current_project_id) console.log(`   • project_id: ${lead.current_project_id}`);
      });
      
    } else {
      console.log(`✅ Found ${users?.length || 0} users:`);
      users?.forEach(user => {
        console.log(`   • ${user.id} (${user.email || 'no email'})`);
      });
    }
    
    // 2. Check lead status constraints
    console.log('\n📊 LEAD STATUS CONSTRAINTS:');
    try {
      // Try to get the check constraint definition
      const { data: constraints } = await supabase.rpc('sql', {
        query: `
          SELECT constraint_name, check_clause 
          FROM information_schema.check_constraints 
          WHERE constraint_name LIKE '%status%' 
          AND constraint_schema = 'public';
        `
      });
      
      console.log('🔍 Status constraints found:');
      constraints?.forEach(constraint => {
        console.log(`   • ${constraint.constraint_name}: ${constraint.check_clause}`);
      });
      
    } catch (err) {
      console.log('⚠️  Cannot query constraints directly');
    }
    
    // Get actual status values from leads table
    const { data: statusValues } = await supabase
      .from('leads')
      .select('status')
      .not('status', 'is', null)
      .limit(20);
    
    const uniqueStatuses = [...new Set(statusValues?.map(l => l.status))];
    console.log('📋 Actual status values in leads table:');
    uniqueStatuses.forEach(status => {
      console.log(`   • "${status}"`);
    });
    
    // 3. Check clients table for valid client_ids
    console.log('\n🏢 CLIENTS TABLE:');
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .limit(5);
    
    console.log(`✅ Found ${clients?.length || 0} clients:`);
    clients?.forEach(client => {
      console.log(`   • ${client.id} (${client.name})`);
    });
    
    // 4. Check existing leads data
    console.log('\n📋 SAMPLE LEADS DATA:');
    const { data: sampleLeads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, status, client_id, current_project_id')
      .limit(3);
    
    console.log(`✅ Found ${sampleLeads?.length || 0} leads:`);
    sampleLeads?.forEach(lead => {
      console.log(`   • ${lead.id}: ${lead.first_name} ${lead.last_name}`);
      console.log(`     Status: "${lead.status}" | Client: ${lead.client_id} | Project: ${lead.current_project_id}`);
    });
    
    // 5. Generate recommended test values
    console.log('\n💡 RECOMMENDED TEST VALUES:');
    console.log('============================');
    
    if (clients && clients.length > 0) {
      console.log(`✅ Use client_id: "${clients[0].id}" (${clients[0].name})`);
    }
    
    if (uniqueStatuses.length > 0) {
      const goodStatuses = uniqueStatuses.filter(s => 
        s !== 'booked' && 
        !s.includes('_') && 
        s.length > 1
      );
      
      if (goodStatuses.length > 0) {
        console.log(`✅ Use status: "${goodStatuses[0]}" (existing valid value)`);
      }
    }
    
    if (sampleLeads && sampleLeads.length > 0) {
      const leadWithClient = sampleLeads.find(l => l.client_id);
      if (leadWithClient) {
        console.log(`✅ Use user_id: "${leadWithClient.client_id}" (from existing lead)`);
      }
    }
    
    return {
      validClients: clients,
      validStatuses: uniqueStatuses,
      sampleLeads: sampleLeads
    };
    
  } catch (error) {
    console.error('💥 Error checking data:', error);
    return null;
  }
}

checkValidData()
  .then(result => {
    if (result) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Update test script to use valid user_id values from clients table');
      console.log('2. Use existing status values instead of "booked"');
      console.log('3. Re-run queue functionality tests');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }); 