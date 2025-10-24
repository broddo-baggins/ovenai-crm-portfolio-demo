#!/usr/bin/env node

// Database Schema Checker
// This script checks the actual database schema to understand table structures

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load credentials from local file
const credentialsPath = '../../supabase-credentials.local';
let credentials;

try {
  const credentialsContent = readFileSync(credentialsPath, 'utf8');
  credentials = {};
  
  credentialsContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      credentials[key.trim()] = value.trim();
    }
  });
  
  console.log('✅ Credentials loaded successfully');
} catch (error) {
  console.error('❌ Failed to load credentials:', error.message);
  process.exit(1);
}

// Create Supabase admin client
const supabaseUrl = credentials.SUPABASE_URL;
const serviceRoleKey = credentials.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('\n🔍 Checking Database Schema\n');

async function checkTableStructure() {
  const tables = ['clients', 'projects', 'leads', 'profiles', 'client_members', 'project_members'];
  
  for (const table of tables) {
    console.log(`📋 Table: ${table}`);
    console.log('═'.repeat(40));
    
    try {
      // Get table structure by querying with limit 0
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message);
        continue;
      }
      
      if (data && data.length > 0) {
        console.log('🔍 Sample record structure:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        // Try to insert a test record to see what fields are expected
        console.log('📝 Table is empty, trying to understand structure...');
        
        // Try a basic insert that should fail and show us the expected structure
        const { error: insertError } = await supabaseAdmin
          .from(table)
          .insert({
            name: 'test'
          });
        
        if (insertError) {
          console.log('💡 Insert error (shows expected structure):');
          console.log(insertError.message);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error with ${table}:`, error.message);
    }
    
    console.log('\n');
  }
}

// Check what we can actually create
async function testClientCreation() {
  console.log('🧪 Testing Client Creation with Different Structures...\n');
  
  const testStructures = [
    // Test 1: Simple structure
    {
      name: 'Test Client 1',
      description: 'Test description',
      status: 'ACTIVE'
    },
    // Test 2: Without description/status
    {
      name: 'Test Client 2'
    },
    // Test 3: With contact_info (if it exists)
    {
      name: 'Test Client 3',
      contact_info: {
        email: 'test@example.com'
      }
    }
  ];
  
  for (let i = 0; i < testStructures.length; i++) {
    const structure = testStructures[i];
    console.log(`Test ${i + 1}:`, JSON.stringify(structure, null, 2));
    
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .insert(structure)
        .select();
      
      if (error) {
        console.log(`❌ Failed:`, error.message);
      } else {
        console.log(`✅ Success! Created:`, data);
        
        // Clean up - delete the test record
        if (data && data[0]) {
          await supabaseAdmin
            .from('clients')
            .delete()
            .eq('id', data[0].id);
          console.log('🧹 Cleaned up test record');
        }
      }
    } catch (error) {
      console.log(`❌ Error:`, error.message);
    }
    
    console.log('\n');
  }
}

async function main() {
  await checkTableStructure();
  await testClientCreation();
}

main().catch(console.error); 