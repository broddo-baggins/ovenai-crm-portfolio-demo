#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const supabaseUrl = credentials.supabase.development.url;
const supabaseKey = credentials.supabase.development.service_role_key;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeadsSchema() {
  console.log('🔍 CHECKING LEADS TABLE SCHEMA');
  console.log('==============================');
  
  try {
    // Get a sample lead to see the structure
    const { data: sampleLead, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('❌ Error fetching sample lead:', error.message);
      return;
    }
    
    if (!sampleLead) {
      console.log('❌ No leads found in table');
      return;
    }
    
    console.log('✅ Sample lead found. Available columns:');
    console.log('');
    
    Object.keys(sampleLead).forEach(column => {
      const value = sampleLead[column];
      const type = typeof value;
      console.log(`   • ${column}: ${type} = ${value}`);
    });
    
    console.log('');
    console.log('📋 RECOMMENDED LEAD STRUCTURE:');
    const basicFields = ['id', 'first_name', 'last_name', 'phone', 'email', 'status', 'company', 'notes', 'source', 'client_id', 'current_project_id', 'created_at', 'updated_at'];
    
    console.log('✅ Available basic fields:');
    basicFields.forEach(field => {
      if (sampleLead.hasOwnProperty(field)) {
        console.log(`   • ${field} ✅`);
      } else {
        console.log(`   • ${field} ❌ (missing)`);
      }
    });
    
  } catch (error) {
    console.error('💥 Schema check failed:', error.message);
  }
}

checkLeadsSchema(); 