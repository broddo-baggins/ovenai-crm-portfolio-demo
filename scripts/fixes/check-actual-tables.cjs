#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const credsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const siteDbUrl = creds.supabase.development.url;
    const siteDbServiceKey = creds.supabase.development.service_role_key;
    
    const supabase = createClient(siteDbUrl, siteDbServiceKey);

    console.log('🔍 Checking Site DB tables...');
    
    // Try a direct query for table listing
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      });

    if (error) {
      console.log('❌ RPC error, trying alternative method:', error.message);
      
      // Try the tables we know exist
      const knownTables = [
        'clients', 'projects', 'leads', 'conversations', 'whatsapp_messages',
        'conversation_audit_log', 'dashboard_system_metrics', 'agent_interaction_logs'
      ];
      
      console.log('\n🔍 Testing table access...');
      for (const table of knownTables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('count', { count: 'exact', head: true });
          
          if (error) {
            console.log(`❌ ${table}: ${error.message}`);
          } else {
            console.log(`✅ ${table}: accessible`);
          }
        } catch (e) {
          console.log(`❌ ${table}: ${e.message}`);
        }
      }
      
    } else {
      console.log('✅ Found tables:', data.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main(); 