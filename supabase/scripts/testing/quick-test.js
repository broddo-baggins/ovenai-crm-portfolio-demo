#!/usr/bin/env node

/**
 * Quick System Test - No external dependencies
 */

import { createClient } from '@supabase/supabase-js';

// Use credentials directly (these are already public in our documentation)
const supabaseUrl = 'https://ajszzemkpenbfnghqiyz.supabase.co';
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Quick System Test\n');

async function testSystem() {
  try {
    // Test database access
    console.log('📊 Testing database access...');
    const tables = ['profiles', 'clients', 'projects', 'leads'];
    
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) throw error;
      console.log(`  ✅ ${table}: Accessible`);
    }
    
    // Test client creation - try without status first
    console.log('\n🏢 Testing client creation...');
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert({
        name: `Quick Test Client ${Date.now()}`,
        description: 'Test client for system verification'
        // Let's try without status to see if it has a default
      })
      .select()
      .single();
    
    if (clientError) {
      // If that fails, try with null status
      console.log('  Trying with null status...');
      const { data: client2, error: clientError2 } = await supabaseAdmin
        .from('clients')
        .insert({
          name: `Quick Test Client ${Date.now()}`,
          description: 'Test client for system verification',
          status: null
        })
        .select()
        .single();
      
      if (clientError2) throw clientError2;
      console.log(`  ✅ Client created: ${client2.name}`);
      
      // Test project creation
      console.log('\n📁 Testing project creation...');
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          name: `Quick Test Project ${Date.now()}`,
          client_id: client2.id,
          status: null
        })
        .select()
        .single();
      
      if (projectError) throw projectError;
      console.log(`  ✅ Project created: ${project.name}`);
      
      // Test lead creation
      console.log('\n📋 Testing lead creation...');
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          project_id: project.id,
          first_name: 'Test',
          last_name: 'Lead',
          email: `testlead${Date.now()}@example.com`,
          status: null
        })
        .select()
        .single();
      
      if (leadError) throw leadError;
      console.log(`  ✅ Lead created: ${lead.first_name} ${lead.last_name}`);
    } else {
      console.log(`  ✅ Client created: ${client.name}`);
      
      // Test project creation
      console.log('\n📁 Testing project creation...');
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .insert({
          name: `Quick Test Project ${Date.now()}`,
          client_id: client.id
        })
        .select()
        .single();
      
      if (projectError) throw projectError;
      console.log(`  ✅ Project created: ${project.name}`);
      
      // Test lead creation
      console.log('\n📋 Testing lead creation...');
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .insert({
          project_id: project.id,
          first_name: 'Test',
          last_name: 'Lead',
          email: `testlead${Date.now()}@example.com`
        })
        .select()
        .single();
      
      if (leadError) throw leadError;
      console.log(`  ✅ Lead created: ${lead.first_name} ${lead.last_name}`);
    }
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('\n📍 System is ready for development:');
    console.log('  1. Copy env-update-template.txt to .env');
    console.log('  2. Run: npm run dev');
    console.log('  3. Test authentication and client management');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

testSystem()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 